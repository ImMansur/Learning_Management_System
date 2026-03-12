import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyrYHy21fZNd3OpymRjwZqGS8pYXcD8-g",
  authDomain: "capstone-lms-60591.firebaseapp.com",
  projectId: "capstone-lms-60591",
  storageBucket: "capstone-lms-60591.firebasestorage.app",
  messagingSenderId: "893757131144",
  appId: "1:893757131144:web:9531d970dd54d03e4a923d",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export const initializeFirebaseAnalytics = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    return null;
  }

  return getAnalytics(firebaseApp);
};