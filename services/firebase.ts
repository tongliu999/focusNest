import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "../firebaseConfig";
      
// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Standard Firestore initialization
export const db = getFirestore(app);

// Initialize other services as needed
export const auth = getAuth(app);
