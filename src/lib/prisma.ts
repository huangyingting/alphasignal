import { dirname, isAbsolute, join, resolve } from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveSqliteUrl(rawUrl: string): string {
  const pathPart = rawUrl.slice('file:'.length);
  if (pathPart.startsWith('/') || pathPart === ':memory:') {
    return rawUrl;
  }
  const schemaPath = process.env.PRISMA_SCHEMA_PATH ?? 'prisma/schema.prisma';
  const absSchema = isAbsolute(schemaPath) ? schemaPath : resolve(process.cwd(), schemaPath);
  return `file:${join(dirname(absSchema), pathPart).replace(/\\/g, '/')}`;
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
  if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    return new PrismaClient({ adapter, log: ['error'] });
  }
  if (databaseUrl.startsWith('file:')) {
    const adapter = new PrismaBetterSqlite3({ url: resolveSqliteUrl(databaseUrl) });
    return new PrismaClient({ adapter, log: ['error'] });
  }
  throw new Error('DATABASE_URL must start with file:, postgres://, or postgresql://');
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
