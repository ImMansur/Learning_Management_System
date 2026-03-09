import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "Learner" | "Trainer" | "Admin";
export type SignUpRole = "Learner" | "Trainer";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  idToken: string;
}

const LOCAL_ROLE_CACHE_KEY = "ltc_user_roles";

const normalizeRole = (value: unknown): UserRole | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "admin") return "Admin";
  if (normalized === "trainer") return "Trainer";
  if (normalized === "learner") return "Learner";
  return null;
};

const mapFirebaseError = (code?: string) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/user-not-found":
      return "No account found for this email.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Authentication failed. Please try again.";
  }
};

const getLocalRoleCache = (): Record<string, UserRole> => {
  try {
    const raw = localStorage.getItem(LOCAL_ROLE_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UserRole>;
  } catch {
    return {};
  }
};

const setLocalRoleCache = (cache: Record<string, UserRole>) => {
  try {
    localStorage.setItem(LOCAL_ROLE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage issues
  }
};

const cacheRoleLocally = (uid: string, email: string, role: UserRole) => {
  const cache = getLocalRoleCache();
  cache[uid] = role;
  cache[email.toLowerCase()] = role;
  setLocalRoleCache(cache);
};

const getLocalCachedRole = (uid: string, email: string): UserRole | null => {
  const cache = getLocalRoleCache();
  return cache[uid] || cache[email.toLowerCase()] || null;
};

const getUserProfileRole = async (uid: string): Promise<UserRole | null> => {
  try {
    const snapshot = await getDoc(doc(db, "users", uid));
    if (!snapshot.exists()) {
      return null;
    }

    const profile = snapshot.data() as { role?: unknown };
    return normalizeRole(profile.role);
  } catch {
    return null;
  }
};

const saveUserProfile = async (uid: string, data: { email: string; name: string; role: UserRole }) => {
  await setDoc(
    doc(db, "users", uid),
    {
      email: data.email,
      name: data.name,
      role: data.role,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
};

const buildAuthenticatedUser = async (firebaseUser: FirebaseUser): Promise<AuthenticatedUser> => {
  const idToken = await firebaseUser.getIdToken();
  const tokenResult = await firebaseUser.getIdTokenResult();

  const profileRole = await getUserProfileRole(firebaseUser.uid);
  const email = firebaseUser.email || "";
  const localRole = getLocalCachedRole(firebaseUser.uid, email);
  const role = normalizeRole(tokenResult.claims.role) || profileRole || localRole || "Learner";
  const fallbackName = email ? email.split("@")[0] : "User";

  // Fetch full name from Firestore profile
  let profileName = "";
  try {
    const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));
    if (snapshot.exists()) {
      profileName = snapshot.data().name || "";
    }
  } catch {
    // ignore
  }

  return {
    uid: firebaseUser.uid,
    email,
    name: profileName || firebaseUser.displayName || fallbackName,
    role,
    idToken,
  };
};

export const signInWithFirebase = async (email: string, password: string): Promise<AuthenticatedUser> => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return await buildAuthenticatedUser(credential.user);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : undefined;
    throw new Error(mapFirebaseError(code));
  }
};

export const signUpWithFirebase = async (
  name: string,
  email: string,
  password: string,
  requestedRole: SignUpRole,
): Promise<AuthenticatedUser> => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const firebaseUser = credential.user;

    if (name.trim()) {
      await updateProfile(firebaseUser, { displayName: name.trim() });
    }

    const normalizedRole: UserRole = requestedRole === "Trainer" ? "Trainer" : "Learner";
    const normalizedEmail = firebaseUser.email || email.trim().toLowerCase();
    const normalizedName = name.trim() || normalizedEmail.split("@")[0] || "User";

    cacheRoleLocally(firebaseUser.uid, normalizedEmail, normalizedRole);

    try {
      await saveUserProfile(firebaseUser.uid, {
        email: normalizedEmail,
        name: normalizedName,
        role: normalizedRole,
      });
    } catch {
      // Firestore may be locked by rules. Keep account creation successful.
    }

    return await buildAuthenticatedUser(firebaseUser);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : undefined;
    throw new Error(mapFirebaseError(code));
  }
};

export const restoreFirebaseSession = async (): Promise<AuthenticatedUser | null> => {
  return await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();

      if (!firebaseUser) {
        resolve(null);
        return;
      }

      try {
        resolve(await buildAuthenticatedUser(firebaseUser));
      } catch {
        resolve(null);
      }
    });
  });
};

export const signOutFirebase = async () => {
  await signOut(auth);
};

export const isFirebaseAuthConfigured = () => Boolean(auth.app.options.apiKey);
