import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { prisma } from './prisma';
import {
  evaluateLoginEligibility,
  normalizeEmail,
  recordAuditLog,
  verifyPassword,
} from './account-admission';
import { consumeRateLimit } from './api';

const DUMMY_PASSWORD_HASH =
  'scrypt-v1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

function hasValue(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

export function isGoogleAuthConfigured(): boolean {
  return hasValue(process.env.GOOGLE_CLIENT_ID) && hasValue(process.env.GOOGLE_CLIENT_SECRET);
}

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    id: 'credentials',
    name: 'Invited Account',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = normalizeEmail(credentials?.email);
      const password = credentials?.password ?? '';
      if (!email || !password) {
        return null;
      }

      if (!consumeRateLimit(`login:${email}`, 12, 15 * 60_000)) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { passwordCredential: true },
      });

      const storedHash = user?.passwordCredential?.passwordHash ?? DUMMY_PASSWORD_HASH;
      const passwordValid = await verifyPassword(password, storedHash);
      if (!user || !user.passwordCredential || !passwordValid) {
        await recordAuditLog(prisma, {
          action: 'LOGIN_REJECTED',
          targetUserId: user?.id ?? null,
          entityType: 'User',
          entityId: user?.id ?? null,
          metadata: { email, reason: 'invalid-credentials' },
        });
        return null;
      }

      const eligibility = evaluateLoginEligibility(user);
      if (!eligibility.allowed) {
        await recordAuditLog(prisma, {
          action: 'LOGIN_REJECTED',
          targetUserId: user.id,
          entityType: 'User',
          entityId: user.id,
          metadata: { email, reason: eligibility.reason },
        });
        return null;
      }

      await recordAuditLog(prisma, {
        action: 'LOGIN_SUCCEEDED',
        actorUserId: user.id,
        targetUserId: user.id,
        entityType: 'User',
        entityId: user.id,
        metadata: { email, provider: 'credentials' },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

if (isGoogleAuthConfigured()) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      const candidateEmail = normalizeEmail(user?.email ?? (profile as { email?: string } | undefined)?.email);
      if (!candidateEmail) {
        return '/login?error=AccessDenied';
      }

      if (account?.provider === 'google') {
        const googleProfile = profile as { email_verified?: boolean } | undefined;
        if (googleProfile?.email_verified !== true) {
          return '/login?error=EmailNotVerified';
        }
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: candidateEmail },
        select: {
          id: true,
          email: true,
          admittedAt: true,
          disabledAt: true,
        },
      });

      const eligibility = evaluateLoginEligibility(existingUser);
      if (!eligibility.allowed) {
        return `/login?error=${eligibility.reason === 'disabled' ? 'AccountDisabled' : 'InvitationRequired'}`;
      }

      return true;
    },
    async jwt({ token, user }) {
      const tokenIssuedAtMs =
        typeof token.iat === 'number' ? token.iat * 1000 : Date.now();
      const userId = (user?.id ?? token.sub ?? '') as string;

      if (!userId) {
        return { ...token, disabled: true };
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          admittedAt: true,
          disabledAt: true,
          sessionInvalidAfter: true,
        },
      });

      const eligibility = evaluateLoginEligibility(dbUser);
      const invalidated =
        dbUser?.sessionInvalidAfter &&
        dbUser.sessionInvalidAfter.getTime() > tokenIssuedAtMs + 1000;

      if (!dbUser || !eligibility.allowed || invalidated) {
        return {
          ...token,
          sub: undefined,
          role: undefined,
          disabled: true,
        };
      }

      token.sub = dbUser.id;
      token.email = dbUser.email;
      token.name = dbUser.name;
      token.username = dbUser.username;
      token.role = dbUser.role;
      token.disabled = false;
      return token;
    },
    async session({ session, token }) {
      if (!session.user || token.disabled || !token.sub) {
        return {
          ...session,
          user: undefined,
           expires: new Date(0).toISOString(),
        };
      }
      session.user.id = String(token.sub);
      session.user.email = typeof token.email === 'string' ? token.email : session.user.email;
      session.user.name = typeof token.name === 'string' ? token.name : session.user.name;
      session.user.username = typeof token.username === 'string' ? token.username : null;
      session.user.role = typeof token.role === 'string' ? token.role : 'MEMBER';
      return session;
    },
  },
};
