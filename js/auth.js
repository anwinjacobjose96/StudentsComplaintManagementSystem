import { db } from './firebase-config.js';
import { showNotification, showStudentDashboard, showAdminDashboard, showLoading, hideLoading } from './main.js';
import { collection, getDocs, query, where, addDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Hardcoded admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

// DOM Elements
let loginFormElement, signupFormElement, loginTab, signupTab;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Auth module loaded');
    
    // Initialize DOM elements
    loginFormElement = document.getElementById('loginForm');
    signupFormElement = document.getElementById('signupForm');
    loginTab = document.getElementById('loginTab');
    signupTab = document.getElementById('signupTab');

    // Event Listeners
    if (loginTab) {
        loginTab.addEventListener('click', () => switchTab('login'));
    }
    
    if (signupTab) {
        signupTab.addEventListener('click', () => switchTab('signup'));
    }
    
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }
    
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', handleSignup);
    }
});

// Switch between login and signup tabs
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        if (loginForm) loginForm.classList.remove('hidden');
        if (signupForm) signupForm.classList.add('hidden');
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        if (signupForm) signupForm.classList.remove('hidden');
        if (loginForm) loginForm.classList.add('hidden');
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    console.log('🔑 Login attempt started');
    
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const originalText = showLoading(loginSubmitBtn);
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;

    console.log('📝 Login details:', { username, password, userType });

    try {
        if (userType === 'admin') {
            console.log('👨‍💼 Admin login attempt');
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                // Store user in localStorage instead of trying to modify imported variable
                const currentUser = { username, name: 'Administrator', type: 'admin' };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                console.log('✅ Admin login successful');
                showAdminDashboard();
                showNotification('Welcome, Admin!', 'success');
            } else {
                console.log('❌ Invalid admin credentials');
                showNotification('Invalid admin credentials', 'danger');
            }
        } else {
            console.log('🎓 Student login attempt');
            console.log('🔍 Searching for user in Firestore...');
            
            // Query Firestore for the user
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            
            console.log('📊 Firestore query results:', querySnapshot.size, 'users found');
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const user = userDoc.data();
                console.log('✅ User found in database:', user);
                console.log('🔐 Checking password...');
                
                if (user.password === password) {
                    console.log('✅ Password correct');
                    // Store user in localStorage instead of trying to modify imported variable
                    const currentUser = { 
                        ...user, 
                        id: userDoc.id, 
                        type: 'student' 
                    };
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    console.log('✅ Student login successful, redirecting to dashboard...');
                    showStudentDashboard();
                    showNotification(`Welcome back, ${user.name}!`, 'success');
                } else {
                    console.log('❌ Password mismatch');
                    console.log('Expected:', user.password);
                    console.log('Provided:', password);
                    showNotification('Invalid password', 'danger');
                }
            } else {
                console.log('❌ No user found with username:', username);
                showNotification('User not found. Please check your username or sign up.', 'danger');
            }
        }
    } catch (error) {
        console.error('💥 Login error:', error);
        showNotification('Login failed. Please try again.', 'danger');
    } finally {
        hideLoading(loginSubmitBtn, originalText);
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    console.log('📝 Signup attempt started');
    
    const signupSubmitBtn = document.getElementById('signupSubmitBtn');
    const originalText = showLoading(signupSubmitBtn);
    
    const name = document.getElementById('signupName').value;
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const department = document.getElementById('signupDepartment').value;

    console.log('📋 Signup details:', { name, username, password, department });

    try {
        // Check if username already exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        console.log('🔍 Username check:', querySnapshot.size, 'existing users with same username');
        
        if (!querySnapshot.empty) {
            showNotification('Username already exists', 'warning');
            return;
        }

        // Add new user to Firebase
        console.log('💾 Adding new user to Firestore...');
        const docRef = await addDoc(collection(db, 'users'), {
            name,
            username,
            password,
            department,
            createdAt: new Date()
        });
        
        console.log('✅ User created with ID:', docRef.id);
        showNotification('Account created successfully. Please login.', 'success');
        switchTab('login');
        if (signupFormElement) signupFormElement.reset();
    } catch (error) {
        console.error('💥 Signup error:', error);
        showNotification('Signup failed. Please try again.', 'danger');
    } finally {
        hideLoading(signupSubmitBtn, originalText);
    }
}

// Ensure logout works from auth module too
window.logout = function() {
    localStorage.removeItem('currentUser');
    window.location.href = window.location.origin + window.location.pathname;
};
