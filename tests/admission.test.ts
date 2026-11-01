import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import {
  acceptAccountInvitationWithPassword,
  bootstrapAdminAccount,
  completePasswordReset,
  evaluateLoginEligibility,
  hashOpaqueToken,
  hashPassword,
  inspectAccountInvitationToken,
  issueAccountInvitation,
  issuePasswordReset,
  revokeAccountInvitation,
  rotateAccountInvitation,
  updateAccountRoleOrStatus,
  validatePasswordStrength,
  verifyPassword,
} from '../src/lib/account-admission';

test('Invite-only account admission, RBAC, rotation, revocation, password reset, and audit logging', async () => {
  const workDir = mkdtempSync(join(tmpdir(), 'alphasignal-unit-'));
  const dbPath = join(workDir, 'unit.db');
  const databaseUrl = `file:${dbPath}`;

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Verify zero dummy data on fresh database migration
    const [initialUsers, initialSignals] = await Promise.all([
      prisma.user.count(),
      prisma.signal.count(),
    ]);
    assert.equal(initialUsers, 0, 'Fresh database must have 0 users');
    assert.equal(initialSignals, 0, 'Fresh database must have 0 signals');

    // 2. Password strength & hashing
    assert.ok(validatePasswordStrength('short1'));
    assert.ok(validatePasswordStrength('alllettersonlypassword'));
    assert.equal(validatePasswordStrength('ValidPass123!'), null);
    const hashed = await hashPassword('ValidPass123!');
    assert.equal(await verifyPassword('ValidPass123!', hashed), true);
    assert.equal(await verifyPassword('WrongPass123!', hashed), false);

    // 3. Bootstrap Admin Account
    const admin = await bootstrapAdminAccount(prisma, {
      email: 'Admin@AlphaSignal.Example',
      name: 'Root Operator',
      password: 'AdminPassword123!',
    });
    assert.equal(admin.email, 'admin@alphasignal.example');
    assert.equal(admin.role, 'ADMIN');
    assert.equal(admin.admissionSource, 'BOOTSTRAP');
    assert.equal(evaluateLoginEligibility(admin).allowed, true);

    // 4. Issue Invitation (SHA-256 tokenHash, never plaintext)
    const issued = await issueAccountInvitation(prisma, {
      email: 'Researcher@AlphaSignal.Example',
      role: 'OPERATOR',
      createdByUserId: admin.id,
      expiresInHours: 48,
    });
    assert.equal(issued.invitation.normalizedEmail, 'researcher@alphasignal.example');
    assert.equal(issued.invitation.role, 'OPERATOR');

    const storedInvite = await prisma.accountInvitation.findUnique({
      where: { id: issued.invitation.id },
    });
    assert.ok(storedInvite);
    assert.notEqual(storedInvite.tokenHash, issued.rawToken);
    assert.equal(storedInvite.tokenHash, hashOpaqueToken(issued.rawToken));

    // 5. Rotate Invitation (revokes old token, issues new one)
    const rotated = await rotateAccountInvitation(prisma, {
      invitationId: issued.invitation.id,
      actorUserId: admin.id,
      expiresInHours: 24,
    });
    const oldInspect = await inspectAccountInvitationToken(prisma, issued.rawToken);
    assert.equal(oldInspect.status, 'revoked');

    const newInspect = await inspectAccountInvitationToken(prisma, rotated.rawToken);
    assert.equal(newInspect.status, 'valid');

    // 6. Accept rotated single-use invitation
    const memberUser = await acceptAccountInvitationWithPassword(prisma, {
      rawToken: rotated.rawToken,
      name: 'Dr. Grace Hopper',
      username: 'grace_hopper',
      password: 'GraceSecurePassword99',
    });
    assert.equal(memberUser.email, 'researcher@alphasignal.example');
    assert.equal(memberUser.role, 'OPERATOR');
    assert.equal(memberUser.admissionSource, 'INVITATION');

    // Replay of single-use token must fail
    await assert.rejects(
      () =>
        acceptAccountInvitationWithPassword(prisma, {
          rawToken: rotated.rawToken,
          name: 'Replay Attacker',
          password: 'ReplayPassword99',
        }),
      /accepted/i
    );

    // 7. Revoke a pending invitation
    const toRevoke = await issueAccountInvitation(prisma, {
      email: 'revoked@alphasignal.example',
      role: 'VIEWER',
      createdByUserId: admin.id,
    });
    await revokeAccountInvitation(prisma, {
      invitationId: toRevoke.invitation.id,
      revokedByUserId: admin.id,
    });
    const revokedStatus = await inspectAccountInvitationToken(prisma, toRevoke.rawToken);
    assert.equal(revokedStatus.status, 'revoked');

    // 8. Role update & Account Disablement + Self-protection
    await assert.rejects(
      () =>
        updateAccountRoleOrStatus(prisma, {
          actorUserId: admin.id,
          targetUserId: admin.id,
          disabled: true,
        }),
      /cannot disable their own/i
    );

    const updatedRoleUser = await updateAccountRoleOrStatus(prisma, {
      actorUserId: admin.id,
      targetUserId: memberUser.id,
      role: 'VIEWER',
      disabled: true,
    });
    assert.equal(updatedRoleUser.role, 'VIEWER');
    assert.ok(updatedRoleUser.disabledAt);
    assert.equal(evaluateLoginEligibility(updatedRoleUser).allowed, false);

    // Re-enable user for password reset test
    await updateAccountRoleOrStatus(prisma, {
      actorUserId: admin.id,
      targetUserId: memberUser.id,
      disabled: false,
    });

    // 9. Password Reset flow
    const resetIssued = await issuePasswordReset(
      prisma,
      'researcher@alphasignal.example'
    );
    assert.ok(resetIssued);
    await completePasswordReset(prisma, resetIssued.rawToken, 'UpdatedPassword2026!');

    const cred = await prisma.passwordCredential.findUnique({
      where: { userId: memberUser.id },
    });
    assert.ok(cred);
    assert.equal(await verifyPassword('UpdatedPassword2026!', cred.passwordHash), true);

    // 10. Verify AuditLog completeness
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const actions = new Set(auditLogs.map((l) => l.action));
    assert.ok(actions.has('ADMIN_BOOTSTRAPPED'));
    assert.ok(actions.has('INVITATION_ISSUED'));
    assert.ok(actions.has('INVITATION_ROTATED'));
    assert.ok(actions.has('INVITATION_ACCEPTED'));
    assert.ok(actions.has('INVITATION_REVOKED'));
    assert.ok(actions.has('USER_ROLE_UPDATED'));
    assert.ok(actions.has('USER_STATUS_UPDATED'));
    assert.ok(actions.has('PASSWORD_RESET_REQUESTED'));
    assert.ok(actions.has('PASSWORD_RESET_COMPLETED'));
  } finally {
    await prisma.$disconnect();
    rmSync(workDir, { recursive: true, force: true });
  }
});
