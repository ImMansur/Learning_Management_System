import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AuthenticatedUser,
  restoreFirebaseSession,
  signInWithFirebase,
  signUpWithFirebase,
  type SignUpRole,
  signOutFirebase,
  signInWithGoogle,
} from "@/services/firebaseAuthService";
import { auth } from "@/lib/firebase";

export type User = AuthenticatedUser;

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, role: SignUpRole) => Promise<User>;
  logout: () => Promise<void>;
  getToken: () => Promise<string>;
  loginWithGoogle: () => Promise<User>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      try {
        const restoredUser = await restoreFirebaseSession();
        if (isMounted) {
          setUser(restoredUser);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const authenticatedUser = await signInWithFirebase(email, password);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const logout = async () => {
    await signOutFirebase();
    setUser(null);
  };

  const signup = async (name: string, email: string, password: string, role: SignUpRole) => {
    const authenticatedUser = await signUpWithFirebase(name, email, password, role);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const getToken = async (): Promise<string> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not authenticated");
    return firebaseUser.getIdToken(true);
  };

  const loginWithGoogle = async () => {
    const authenticatedUser = await signInWithGoogle();
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, signup, logout, getToken, loginWithGoogle }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
