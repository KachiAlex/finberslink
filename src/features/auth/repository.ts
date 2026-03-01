import * as FirestoreService from "@/lib/firestore-service";

interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role?: 'ADMIN' | 'SUPER_ADMIN' | 'STUDENT' | 'TUTOR';
}

export async function findUserByEmail(email: string) {
  return FirestoreService.findUserByEmail(email);
}

export async function createUser(input: CreateUserInput) {
  return FirestoreService.createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash: input.passwordHash,
    role: input.role ?? 'STUDENT',
    status: 'ACTIVE',
  });
}
