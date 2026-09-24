import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  getUserProfile,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  registerWithEmail,
  updateUserProfile,
  changeUserPassword,
} from '../firebase/auth';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginGuest: () => void;
  signup: (name: string, email: string, mobile: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (name?: string, mobile?: string) => Promise<void>;
  updatePasswordData: (newPass: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to construct an immediate local profile without waiting for network/Firestore
function buildInstantProfile(firebaseUser: User): UserProfile {
  try {
    const cached = localStorage.getItem(`edu_user_profile_${firebaseUser.uid}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
    email: firebaseUser.email || '',
    mobile: firebaseUser.phoneNumber || '',
    role: firebaseUser.email === 'aaravmalik128@gmail.com' ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Module-level listener state to guarantee onAuthStateChanged is registered only once
type AuthSubscriber = (firebaseUser: User | null) => void;
const subscribers = new Set<AuthSubscriber>();
let isListenerAttached = false;
let currentAuthUser: User | null = null;
let isInitialAuthResolved = false;

function initAuthListener() {
  if (isListenerAttached) return;
  isListenerAttached = true;

  onAuthStateChanged(
    auth,
    (firebaseUser) => {
      currentAuthUser = firebaseUser;
      isInitialAuthResolved = true;
      subscribers.forEach((callback) => callback(firebaseUser));
    },
    (error) => {
      console.warn('Firebase Auth listener error:', error);
      isInitialAuthResolved = true;
      subscribers.forEach((callback) => callback(null));
    }
  );
}

// Synchronously recover initial state to prevent any layout shift or flicker on mount
function getInitialAuthState(): {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
} {
  // 1. Check if auth.currentUser is already populated synchronously by Firebase
  if (auth.currentUser) {
    const u = auth.currentUser;
    return {
      user: u,
      profile: buildInstantProfile(u),
      loading: false,
    };
  }

  // 2. Check if listener has already resolved prior to component mount
  if (isInitialAuthResolved) {
    return {
      user: currentAuthUser,
      profile: currentAuthUser ? buildInstantProfile(currentAuthUser) : null,
      loading: false,
    };
  }

  // 3. Default: wait for the auth state listener to report
  return {
    user: null,
    profile: null,
    loading: true,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = useRef(getInitialAuthState());
  const [user, setUser] = useState<User | null>(initial.current.user);
  const [profile, setProfile] = useState<UserProfile | null>(initial.current.profile);
  const [loading, setLoading] = useState<boolean>(initial.current.loading);

  const loadProfile = async (uid: string) => {
    try {
      const p = await getUserProfile(uid);
      if (p) {
        setProfile(p);
      }
    } catch (err) {
      console.warn('Error fetching user profile from database:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Never leave app stuck on full-screen loading spinner
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1000);

    const handleAuthChange = async (firebaseUser: User | null) => {
      if (!isMounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        const instant = buildInstantProfile(firebaseUser);
        setProfile(prev => prev || instant);
        setLoading(false);

        // Background profile sync
        loadProfile(firebaseUser.uid).catch(console.warn);
      } else {
        // If not logged into Firebase, check if demo mode was active
        const savedDemo = localStorage.getItem('edu_veda_demo_session');
        if (savedDemo) {
          try {
            const parsed: UserProfile = JSON.parse(savedDemo);
            setUser({
              uid: parsed.uid,
              email: parsed.email,
              displayName: parsed.name,
            } as unknown as User);
            setProfile(parsed);
          } catch {
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    };

    // Ensure the single global Firebase Auth listener is initialized
    initAuthListener();

    // Register this component as an active subscriber
    subscribers.add(handleAuthChange);

    // If auth resolved before this subscriber was added, dispatch immediate update
    if (isInitialAuthResolved) {
      handleAuthChange(currentAuthUser);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscribers.delete(handleAuthChange);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const loggedInUser = await loginWithEmail(email, pass);
    setUser(loggedInUser);
    const instant = buildInstantProfile(loggedInUser);
    setProfile(instant);
    loadProfile(loggedInUser.uid).catch(console.warn);
  };

  const loginGoogle = async () => {
    const newProfile = await loginWithGoogle();
    if (auth.currentUser) {
      setUser(auth.currentUser);
    }
    setProfile(newProfile);
  };

  const loginGuest = () => {
    const guestProfile: UserProfile = {
      uid: 'guest_student_' + Math.random().toString(36).substring(2, 9),
      name: 'Guest Student',
      email: 'student@eduveda.app',
      mobile: '',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('edu_veda_demo_session', JSON.stringify(guestProfile));
    } catch {}
    setUser({
      uid: guestProfile.uid,
      email: guestProfile.email,
      displayName: guestProfile.name,
    } as unknown as User);
    setProfile(guestProfile);
    setLoading(false);
  };

  const signup = async (name: string, email: string, mobile: string, pass: string) => {
    const newProfile = await registerWithEmail(name, email, mobile, pass);
    if (auth.currentUser) {
      setUser(auth.currentUser);
    }
    setProfile(newProfile);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Error signing out:', err);
    }
    setUser(null);
    setProfile(null);
  };

  const updateProfileData = async (name?: string, mobile?: string) => {
    if (!user) throw new Error('Not authenticated');
    await updateUserProfile(user.uid, { name, mobile });
    await loadProfile(user.uid);
  };

  const updatePasswordData = async (newPass: string) => {
    await changeUserPassword(newPass);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        loginGoogle,
        loginGuest,
        signup,
        logout,
        updateProfileData,
        updatePasswordData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

