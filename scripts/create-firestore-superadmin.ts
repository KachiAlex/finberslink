#!/usr/bin/env ts-node
import "dotenv/config";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/firestore-service";

interface CliArgs {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
    throw new Error(
      "Usage: ts-node scripts/create-firestore-superadmin.ts --email <email> --password <password> [--firstName <name>] [--lastName <name>]"
    );
  }

  return {
    email: parsed.email,
    password: parsed.password,
    firstName: parsed.firstName ?? "Super",
    lastName: parsed.lastName ?? "Admin",
  } as CliArgs;
}

async function main() {
  const { email, password, firstName, lastName } = parseArgs();

  // Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    console.log(`User with email ${email} already exists. Skipping creation.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await createUser({
    email,
    firstName,
    lastName,
    passwordHash,
    role: "SUPER_ADMIN",
    status: "ACTIVE",
  });

  console.log(
    `✅ Superadmin created: ${user.firstName} ${user.lastName} <${user.email}>`
  );
}

main()
  .catch((error) => {
    console.error("❌ Failed to create superadmin:", error);
    process.exit(1);
  });
