import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { handleFirestoreError, OperationType } from './error';
import type { UserProfile } from '../types';

export async function registerWithEmail(
  name: string,
  email: string,
  mobile: string,
  pass: string
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  // Update Auth Profile Display Name
  try {
    await updateProfile(user, { displayName: name.trim() });
  } catch (err) {
    console.warn('Could not update Auth displayName:', err);
  }

  const profile: UserProfile = {
    uid: user.uid,
    name: name.trim(),
    email: user.email || email.trim(),
    mobile: mobile.trim() || '',
    role: 'user', // Enforce normal user role
    avatar: user.photoURL || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Cache locally immediately for instant performance
  try {
    localStorage.setItem(`edu_user_profile_${user.uid}`, JSON.stringify(profile));
  } catch {}

  const userDocRef = doc(db, 'users', user.uid);
  try {
    await Promise.race([
      setDoc(userDocRef, profile),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
  } catch (err) {
    console.warn('Firestore setDoc failed or timed out for user profile, cached locally:', err);
  }

  return profile;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return credential.user;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  let profile = await getUserProfile(user.uid);
  if (!profile) {
    profile = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Learner',
      email: user.email || '',
      mobile: user.phoneNumber || '',
      role: 'user',
      avatar: user.photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`edu_user_profile_${user.uid}`, JSON.stringify(profile));
    } catch {}

    const userDocRef = doc(db, 'users', user.uid);
    try {
      await Promise.race([
        setDoc(userDocRef, profile),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ]);
    } catch (err) {
      console.warn('Firestore setDoc failed or timed out for Google profile, cached locally:', err);
    }
  }
  return profile;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // Fast local cache check
  try {
    const cached = localStorage.getItem(`edu_user_profile_${uid}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  const userDocRef = doc(db, 'users', uid);
  try {
    const snap = (await Promise.race([
      getDoc(userDocRef),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ])) as any;

    if (snap && snap.exists()) {
      const data = snap.data() as UserProfile;
      try {
        localStorage.setItem(`edu_user_profile_${uid}`, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (err) {
    console.warn('Could not fetch user profile from Firestore, using fallback:', err);
  }

  // Fallback to auth.currentUser if available
  if (auth.currentUser && auth.currentUser.uid === uid) {
    const fallbackProfile: UserProfile = {
      uid,
      name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Student',
      email: auth.currentUser.email || '',
      mobile: auth.currentUser.phoneNumber || '',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`edu_user_profile_${uid}`, JSON.stringify(fallbackProfile));
    } catch {}
    return fallbackProfile;
  }

  return null;
}

export async function updateUserProfile(
  uid: string,
  updates: { name?: string; mobile?: string }
): Promise<void> {
  // Update local cache immediately
  try {
    const cached = localStorage.getItem(`edu_user_profile_${uid}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (updates.name !== undefined) parsed.name = updates.name.trim();
      if (updates.mobile !== undefined) parsed.mobile = updates.mobile.trim();
      parsed.updatedAt = new Date().toISOString();
      localStorage.setItem(`edu_user_profile_${uid}`, JSON.stringify(parsed));
    }
  } catch {}

  if (auth.currentUser && updates.name) {
    try {
      await updateProfile(auth.currentUser, { displayName: updates.name.trim() });
    } catch {}
  }

  const userDocRef = doc(db, 'users', uid);
  const dataToUpdate: Record<string, string> = {
    updatedAt: new Date().toISOString(),
  };
  if (updates.name !== undefined) dataToUpdate.name = updates.name.trim();
  if (updates.mobile !== undefined) dataToUpdate.mobile = updates.mobile.trim();

  try {
    await Promise.race([
      updateDoc(userDocRef, dataToUpdate),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
  } catch (err) {
    console.warn('Firestore updateDoc failed or timed out:', err);
  }
}

export async function changeUserPassword(newPassword: string): Promise<void> {
  if (!auth.currentUser) throw new Error('No authenticated user session found');
  await updatePassword(auth.currentUser, newPassword);
}
