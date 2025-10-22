
import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Global variables
let currentUser = null;

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const getStartedBtn = document.getElementById('getStartedBtn');
const heroSection = document.getElementById('hero');
const authPage = document.getElementById('auth-page');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CampusCare System Initializing...');
    
    // Initialize all components
    initializeTheme();
    initializeNavigation();
    checkExistingLogin();
});

// ========== THEME FUNCTIONALITY ==========

// Initialize the app
function initializeApp() {
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        try {
            currentUser = JSON.parse(loggedInUser);
            if (currentUser.type === 'student') {
                showStudentDashboard();
            } else if (currentUser.type === 'admin') {
                showAdminDashboard();
            }
        } catch (e) {
            console.error('Error parsing saved user data:', e);
            localStorage.removeItem('currentUser');
        }
    } else {
        // Update hero stats on homepage
        updateHeroStats();
    }
}

function initializeTheme() {
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('darkMode', null);
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// ========== NAVIGATION FUNCTIONALITY ==========
function initializeNavigation() {
    // Get Started button
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            console.log('Get Started button clicked');
            showAuthPage();
        });
    } else {
        console.error('Get Started button not found!');
    }
}

function showAuthPage() {
    if (heroSection && authPage) {
        heroSection.classList.add('hidden');
        authPage.classList.remove('hidden');
        window.scrollTo(0, 0);
        console.log('Switched to auth page');
    }
}

// ========== HOMEPAGE STATS FUNCTIONALITY ==========
// Update hero stats
async function updateHeroStats() {
    try {
        const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        const complaints = complaintsSnapshot.docs.map(doc => doc.data());
        const users = usersSnapshot.docs.map(doc => doc.data());
        
        const totalComplaints = complaints.length;
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
        const studentCount = users.length;
        const successRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

        // Update the hero section numbers with animation
        animateCounter('heroComplaintsCount', totalComplaints);
        animateCounter('heroStudentsCount', studentCount);
        animateCounter('heroSuccessRate', successRate, true);
        
    } catch (error) {
        console.error('Error updating hero stats:', error);
    }
}

// Animate number counting
function animateCounter(elementId, targetValue, isPercentage = false) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = targetValue / 50; // Adjust speed
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            current = targetValue;
            clearInterval(timer);
        }
        element.textContent = isPercentage ? 
            Math.round(current) + '%' : 
            Math.round(current);
        element.classList.add('counter-animate');
    }, 30);
}

// ========== AUTH & DASHBOARD FUNCTIONALITY ==========
function checkExistingLogin() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        try {
            currentUser = JSON.parse(loggedInUser);
            console.log('Found existing user:', currentUser);
            
            if (currentUser.type === 'student') {
                showStudentDashboard();
            } else if (currentUser.type === 'admin') {
                showAdminDashboard();
            }
        } catch (e) {
            console.error('Error parsing saved user data:', e);
            localStorage.removeItem('currentUser');
        }
    } else {
        // Update hero stats on homepage (only if no user is logged in)
        updateHeroStats();
    }
}

function showStudentDashboard() {
    hideAllPages();
    const studentDashboard = document.getElementById('student-dashboard');
    if (studentDashboard) {
        studentDashboard.classList.remove('hidden');
    }
    
    // Update student info
    updateStudentInfo();
    setCurrentDate();
    
    console.log('Student dashboard shown');
}

function showAdminDashboard() {
    hideAllPages();
    const adminDashboard = document.getElementById('admin-dashboard');
    if (adminDashboard) {
        adminDashboard.classList.remove('hidden');
    }
    
    setAdminCurrentDate();
    console.log('Admin dashboard shown');
}

function hideAllPages() {
    const pages = [heroSection, authPage, 
                  document.getElementById('student-dashboard'), 
                  document.getElementById('admin-dashboard')];
    
    pages.forEach(page => {
        if (page) page.classList.add('hidden');
    });
}

function updateStudentInfo() {
    const studentNameElement = document.getElementById('studentName');
    const bannerStudentName = document.getElementById('bannerStudentName');
    
    if (studentNameElement && bannerStudentName && currentUser) {
        studentNameElement.textContent = currentUser.name;
        bannerStudentName.textContent = currentUser.name;
    }
}

function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

function setAdminCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('adminCurrentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingAlerts = document.querySelectorAll('.notification');
    existingAlerts.forEach(alert => alert.remove());
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show notification`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ========== LOADING STATES ==========
function showLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    button.disabled = true;
    return originalText;
}

function hideLoading(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

// ========== LOGOUT FUNCTION ==========
function logout() {
    console.log('User logging out');
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.reload();
}

// ========== EXPORTS ==========
// Make functions globally available
window.showNotification = showNotification;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.logout = logout;
window.showAuthPage = showAuthPage;

// Export for use in other modules
export { 
    showNotification, 
    showStudentDashboard, 
    showAdminDashboard, 
    showLoading, 
    hideLoading 
};
