// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDA69pFhhtib00x_FdWx-Y4_IVvrjYG_ag",
  authDomain: "illustra-6ca8a.firebaseapp.com",
  databaseURL: "https://illustra-6ca8a-default-rtdb.firebaseio.com",
  projectId: "illustra-6ca8a",
  storageBucket: "illustra-6ca8a.appspot.com",
  messagingSenderId: "643320223920",
  appId: "1:643320223920:web:d39c2493da8472ab934375",
  measurementId: "G-69S0CBVXMH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the authentication service
const auth = getAuth(app);

// Function to log out
const logout = () => {
  return signOut(auth);
};

// Get a reference to the Firestore service
const db = getFirestore(app);

// Get a reference to the Storage service
const storage = getStorage(app);

export { auth, db, storage, logout };
