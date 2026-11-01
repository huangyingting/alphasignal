import { readFileSync } from 'node:fs';
import { prisma } from '../src/lib/prisma';
import { bootstrapAdminAccount } from '../src/lib/account-admission';

function readArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const inline = args.find((item) => item.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);
  const index = args.indexOf(flag);
  if (index >= 0) return args[index + 1];
  return undefined;
}

function resolvePassword(): string | undefined {
  if (process.argv.includes('--password-stdin')) {
    return readFileSync(0, 'utf8').replace(/\r?\n$/, '');
  }
  return process.env.BOOTSTRAP_ADMIN_PASSWORD;
}

async function main() {
  const email = readArg('--email') ?? process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = resolvePassword();
  const name = readArg('--name') ?? process.env.BOOTSTRAP_ADMIN_NAME ?? 'Administrator';

  if (!email || !password) {
    console.error(
      'Usage: printf "%s" "$ADMIN_PASSWORD" | npm run bootstrap:admin -- --email admin@example.com --password-stdin [--name "Admin"]'
    );
    process.exitCode = 1;
    return;
  }

  const user = await bootstrapAdminAccount(prisma, {
    email,
    password,
    name,
    role: 'ADMIN',
  });

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        id: user.id,
        email: user.email,
        role: user.role,
        admissionSource: user.admissionSource,
        admittedAt: user.admittedAt,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
