import * as admin from 'firebase-admin';

let initialized = false;
let dbInstance: any = null;
let authInstance: any = null;

export function initializeFirebase() {
  if (initialized) {
    return { db: dbInstance, auth: authInstance };
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  // Only initialize if we have valid credentials
  if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
      }

      dbInstance = admin.firestore();
      authInstance = admin.auth();

      // Enable offline persistence for better performance
      dbInstance.settings({
        ignoreUndefinedProperties: true,
      });

      initialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  }

  return { db: dbInstance, auth: authInstance };
}

// Export lazy-initialized instances using Proxy
export const db = new Proxy({} as any, {
  get: (target, prop: string | symbol) => {
    const { db: firestore } = initializeFirebase();
    if (!firestore) {
      throw new Error("Firebase not initialized");
    }
    const value = (firestore as any)[prop];
    if (typeof value === 'function') {
      return value.bind(firestore);
    }
    return value;
  },
});

export const auth = new Proxy({} as any, {
  get: (target, prop: string | symbol) => {
    const { auth: authService } = initializeFirebase();
    if (!authService) {
      throw new Error("Firebase not initialized");
    }
    const value = (authService as any)[prop];
    if (typeof value === 'function') {
      return value.bind(authService);
    }
    return value;
  },
});

export default admin;
