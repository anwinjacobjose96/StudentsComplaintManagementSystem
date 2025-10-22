// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDoFCwE-oS94khHwYgwlMeraVnyE-0BJf8",
    authDomain: "student-complaint-manage-748cf.firebaseapp.com",
    projectId: "student-complaint-manage-748cf",
    storageBucket: "student-complaint-manage-748cf.firebasestorage.app",
    messagingSenderId: "781806066119",
    appId: "1:781806066119:web:78f820e8e20e8b739621e2",
    measurementId: "G-HCSK9EST76"

  };


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
