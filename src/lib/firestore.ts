import * as admin from "firebase-admin";

type FirebaseServices = {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
};

let services: FirebaseServices | null = null;

export function initializeFirebase(): FirebaseServices {
  if (services) {
    return services;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error("Firebase credentials are not configured");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }

  const dbInstance = admin.firestore();
  dbInstance.settings({ ignoreUndefinedProperties: true });

  services = {
    db: dbInstance,
    auth: admin.auth(),
  };

  return services;
}

function getFirestoreInstance() {
  return initializeFirebase().db;
}

function getAuthInstance() {
  return initializeFirebase().auth;
}

export const db = new Proxy({} as admin.firestore.Firestore, {
  get: (_target, prop: string | symbol) => {
    const firestore = getFirestoreInstance();
    const value = firestore[prop as keyof admin.firestore.Firestore];
    return typeof value === "function" ? value.bind(firestore) : value;
  },
});

export const auth = new Proxy({} as admin.auth.Auth, {
  get: (_target, prop: string | symbol) => {
    const authService = getAuthInstance();
    const value = authService[prop as keyof admin.auth.Auth];
    return typeof value === "function" ? value.bind(authService) : value;
  },
});

export default admin;
