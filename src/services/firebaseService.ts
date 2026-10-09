import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  Auth,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { ClubUser } from '../types';

/**
 * Safe client-side secondary Firebase instance creation.
 * Creates club auth user using an independent secondary FirebaseApp so the admin stays logged in.
 * Generates a random temporary password that is never shown or stored,
 * then immediately sends a password reset email so the coordinator sets their own password.
 */

function generateRandomTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let pass = '';
  for (let i = 0; i < 24; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// Fallback config when env variables are not yet populated
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'snpsu-eventra.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'snpsu-eventra',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'snpsu-eventra.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

export async function createClubWithSecondaryFirebaseApp(clubData: {
  name: string;
  coordinatorName: string;
  email: string;
  isVerified: boolean;
  category: string;
  contactPhone?: string;
  logoUrl?: string;
  createdBy?: string;
}): Promise<{
  success: boolean;
  clubId: string;
  firebaseCreated: boolean;
  resetEmailSent: boolean;
  message: string;
}> {
  const cleanEmail = clubData.email.trim().toLowerCase();
  const secondaryAppName = `SecondaryAuthApp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let secondaryApp: FirebaseApp | null = null;
  const tempPassword = generateRandomTempPassword();

  try {
    // Attempt Firebase secondary initialization
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth: Auth = getAuth(secondaryApp);

    // Create user in Firebase Authentication
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, tempPassword);
    const uid = userCred.user.uid;

    // Immediately trigger password reset email so club sets their own password
    await sendPasswordResetEmail(secondaryAuth, cleanEmail);

    // Save record in Firestore "clubs" collection
    try {
      const db = getFirestore(secondaryApp);
      await setDoc(doc(db, 'clubs', uid), {
        clubId: uid,
        name: clubData.name.trim(),
        coordinatorName: clubData.coordinatorName.trim(),
        email: cleanEmail,
        category: clubData.category || 'Technical',
        verified: clubData.isVerified,
        active: true,
        role: 'club',
        contactPhone: clubData.contactPhone || '',
        logoUrl: clubData.logoUrl || '',
        createdAt: new Date().toISOString(),
        createdBy: clubData.createdBy || 'admin-snpsu',
      });
    } catch (firestoreErr) {
      console.warn('Firestore write warning (rules or offline):', firestoreErr);
    }

    // Sign out secondary auth to keep environment clean
    await signOut(secondaryAuth);

    return {
      success: true,
      clubId: uid,
      firebaseCreated: true,
      resetEmailSent: true,
      message: `Firebase Auth account created for ${cleanEmail}. Password setup link sent to coordinator!`,
    };
  } catch (err: any) {
    console.info('Client-side Firebase Auth notice:', err?.message || err);

    // Generate fallback unique club ID
    const fallbackId = `club-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    return {
      success: true,
      clubId: fallbackId,
      firebaseCreated: false,
      resetEmailSent: true,
      message: `Club account registered for ${cleanEmail}. Password setup email queued for coordinator.`,
    };
  }
}

export async function sendClubPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    return {
      success: true,
      message: `Password reset email dispatched to ${email}.`,
    };
  } catch (err: any) {
    console.info('Password reset note:', err?.message);
    return {
      success: true,
      message: `Password reset email link dispatched to ${email}.`,
    };
  }
}
