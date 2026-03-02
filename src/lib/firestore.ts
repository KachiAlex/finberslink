import * as admin from 'firebase-admin';

let cachedDb: any = null;
let cachedAuth: any = null;

function initializeFirebase() {
  if (cachedDb && cachedAuth) {
    return { db: cachedDb, auth: cachedAuth };
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  // Only initialize if we have valid credentials
  if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }

    cachedDb = admin.firestore();
    cachedAuth = admin.auth();

    // Enable offline persistence for better performance
    cachedDb.settings({
      ignoreUndefinedProperties: true,
    });
  }

  return { db: cachedDb, auth: cachedAuth };
}

// Lazy initialization - only initialize when actually needed
export function getFirebaseServices() {
  return initializeFirebase();
}

export const db = new Proxy({}, {
  get: (target, prop) => {
    const { db: firestore } = initializeFirebase();
    return firestore?.[prop as string];
  },
});

export const auth = new Proxy({}, {
  get: (target, prop) => {
    const { auth: authService } = initializeFirebase();
    return authService?.[prop as string];
  },
});

export default admin;
