#!/usr/bin/env ts-node
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface CliArgs {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantSlug?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | undefined> = {};

  for (let i = 0; i < args.length; i++) {
    const current = args[i];
    if (current.startsWith("--")) {
      const key = current.replace(/^--/, "");
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for --${key}`);
      }
      parsed[key] = value;
      i++;
    }
  }

  if (!parsed.email || !parsed.password) {
    throw new Error("Usage: ts-node scripts/create-superadmin.ts --email <email> --password <password> [--firstName <name>] [--lastName <name>] [--tenant <slug>]");
  }

  return {
    email: parsed.email,
    password: parsed.password,
    firstName: parsed.firstName ?? "Super",
    lastName: parsed.lastName ?? "Admin",
    tenantSlug: parsed.tenant,
  } as CliArgs;
}

async function main() {
  const { email, password, firstName, lastName, tenantSlug } = parseArgs();
  const defaultTenantSlug = tenantSlug ?? process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "finbers-link";

  const tenant = await prisma.tenant.findUnique({ where: { slug: defaultTenantSlug } });
  if (!tenant) {
    throw new Error(`Tenant with slug "${defaultTenantSlug}" not found. Seed tenants before creating a superadmin.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      tenantId: tenant.id,
    },
    create: {
      email,
      firstName,
      lastName,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      tenantId: tenant.id,
    },
  });

  console.log(`Superadmin ready: ${user.firstName} ${user.lastName} <${user.email}> (tenant: ${tenant.slug})`);
}

main()
  .catch((error) => {
    console.error("Failed to create superadmin", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
