# CampusCare - College Complaint System

A comprehensive college complaint registration system with Firebase backend.

## Features

- **Student Portal**: Submit and track complaints
- **Admin Portal**: Manage and resolve complaints
- **Real-time Data**: Firebase Firestore backend
- **Responsive Design**: Works on all devices
- **Dark/Light Mode**: Toggleable theme

## Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Update `js/firebase-config.js` with your Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
