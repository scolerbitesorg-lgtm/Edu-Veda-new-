import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  getUserProfile,
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
  signup: (name: string, email: string, mobile: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (name?: string, mobile?: string) => Promise<void>;
  updatePasswordData: (newPass: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to quickly build a profile from a Firebase user object
function buildInstantProfile(firebaseUser: User): UserProfile {
  const email = firebaseUser.email || '';
  const name =
    firebaseUser.displayName ||
    (email ? email.split('@')[0] : 'Student');

  return {
    uid: firebaseUser.uid,
    name,
    email,
    mobile: firebaseUser.phoneNumber || '',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Module-level auth listener to guarantee single subscription across components
type AuthSubscriber = (user: User | null) => void;
const subscribers = new Set<AuthSubscriber>();
let isListenerInitialized = false;
let currentAuthUser: User | null = null;
let isInitialAuthResolved = false;

function initAuthListener() {
  if (isListenerInitialized) return;
  isListenerInitialized = true;

  onAuthStateChanged(auth, (user: User | null) => {
    currentAuthUser = user;
    isInitialAuthResolved = true;
    subscribers.forEach(cb => {
      try {
        cb(user);
      } catch (e) {
        console.error('Error in auth subscriber:', e);
      }
    });
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    return auth?.currentUser || null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (auth?.currentUser) {
      return buildInstantProfile(auth.currentUser);
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!isInitialAuthResolved && !auth?.currentUser);

  const loadProfile = async (uid: string) => {
    try {
      const dbProfile = await getUserProfile(uid);
      if (dbProfile) {
        setProfile(dbProfile);
      } else if (auth?.currentUser && auth.currentUser.uid === uid) {
        setProfile(buildInstantProfile(auth.currentUser));
      }
    } catch (err) {
      console.warn('Notice loading user profile from Firestore:', err);
      if (auth?.currentUser && auth.currentUser.uid === uid) {
        setProfile(buildInstantProfile(auth.currentUser));
      }
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
        setUser(null);
        setProfile(null);
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
