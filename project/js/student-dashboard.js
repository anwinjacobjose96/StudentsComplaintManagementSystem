import { db } from './firebase-config.js';
import { showNotification, showLoading, hideLoading } from './main.js';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// DOM Elements
let complaintForm, complaintsList, studentLogoutBtn, searchComplaints, sortComplaints, complaintSubmitBtn;

// Get current user from localStorage
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// Track initialization state
let dashboardInitialized = false;

// Initialize when the student dashboard becomes visible
function initStudentDashboard() {
    if (dashboardInitialized) return;
    
    console.log('🚀 Student dashboard detected, initializing...');
    initializeDashboard();
}

// Watch for dashboard visibility
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const studentDashboard = document.getElementById('student-dashboard');
            if (studentDashboard && !studentDashboard.classList.contains('hidden') && !dashboardInitialized) {
                // Small delay to ensure DOM is fully ready
                setTimeout(initStudentDashboard, 100);
            }
        }
    });
});

// Start observing when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 Student dashboard module loaded');
    
    const studentDashboard = document.getElementById('student-dashboard');
    if (studentDashboard) {
        // Observe the student dashboard for class changes
        observer.observe(studentDashboard, { attributes: true });
        
        // If dashboard is already visible (on page refresh), initialize immediately
        if (!studentDashboard.classList.contains('hidden')) {
            setTimeout(initStudentDashboard, 100);
        }
    }
});

// Initialize dashboard with proper loading sequence
async function initializeDashboard() {
    if (dashboardInitialized) {
        console.log('📋 Dashboard already initialized');
        return;
    }
    
    console.log('🔄 Starting dashboard initialization...');
    dashboardInitialized = true;
    
    try {
        // Initialize DOM elements
        initializeDOMElements();
        
        // SET USER NAME FIRST - This is the fix
        updateUserInfo();
        
        // Show loading state for stats
        showLoadingStats();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup complaint form
        setupComplaintForm();
        
        // Load data
        await loadDashboardData();
        
        // Setup real-time updates
        setupRealtimeUpdates();
        
        console.log('✅ Student dashboard fully initialized and ready');
        
    } catch (error) {
        console.error('❌ Dashboard initialization failed:', error);
        dashboardInitialized = false;
    }
}

// Initialize all DOM elements
function initializeDOMElements() {
    complaintForm = document.getElementById('complaintForm');
    complaintsList = document.getElementById('complaintsList');
    studentLogoutBtn = document.getElementById('studentLogout');
    searchComplaints = document.getElementById('searchComplaints');
    sortComplaints = document.getElementById('sortComplaints');
    complaintSubmitBtn = document.getElementById('complaintSubmitBtn');
    
    console.log('📝 DOM elements initialized');
}

// UPDATE: Add this function to set user name
function updateUserInfo() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Update welcome message in navbar
        const studentNameElement = document.getElementById('studentName');
        if (studentNameElement) {
            studentNameElement.textContent = currentUser.name;
            console.log('✅ Navbar name set:', currentUser.name);
        }
        
        // Update welcome message in banner
        const bannerStudentName = document.getElementById('bannerStudentName');
        if (bannerStudentName) {
            bannerStudentName.textContent = currentUser.name;
            console.log('✅ Banner name set:', currentUser.name);
        }
        
        // Set current date
        setCurrentDate();
    } else {
        console.log('❌ No user found for name display');
    }
}

// Set current date
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', options);
        console.log('✅ Date set');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Complaint form
    if (complaintForm) {
        complaintForm.addEventListener('submit', handleComplaintSubmit);
        console.log('✅ Complaint form listener added');
    }
    
    // Logout button
    if (studentLogoutBtn) {
        // Remove any existing listeners and add fresh one
        studentLogoutBtn.replaceWith(studentLogoutBtn.cloneNode(true));
        // Get the fresh reference
        studentLogoutBtn = document.getElementById('studentLogout');
        studentLogoutBtn.addEventListener('click', logout);
        console.log('✅ Logout button listener added');
    }
    
    // Search and sort
    if (searchComplaints) {
        searchComplaints.addEventListener('input', filterComplaintsBySearch);
    }
    
    if (sortComplaints) {
        sortComplaints.addEventListener('change', sortComplaintsList);
    }
    
    console.log('✅ All event listeners setup');
}

// Show loading state for stats
function showLoadingStats() {
    const stats = {
        'myComplaintsCount': '...',
        'pendingCount': '...', 
        'resolvedCount': '...',
        'resolutionRate': '...%'
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    const progressBar = document.getElementById('resolutionProgress');
    if (progressBar) progressBar.style.width = '0%';
    
    console.log('⏳ Loading stats displayed');
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        // Load stats and complaints in parallel for faster loading
        await Promise.all([
            updateStudentDashboard(),
            renderComplaints()
        ]);
        
        console.log('✅ Dashboard data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'danger');
        setFallbackStats();
    }
}

// Set fallback stats in case of error
function setFallbackStats() {
    const stats = {
        'myComplaintsCount': '0',
        'pendingCount': '0',
        'resolvedCount': '0', 
        'resolutionRate': '0%'
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    const progressBar = document.getElementById('resolutionProgress');
    if (progressBar) progressBar.style.width = '0%';
}

// Set up real-time Firestore listeners
function setupRealtimeUpdates() {
    try {
        const complaintsRef = collection(db, 'complaints');
        
        console.log('📡 Setting up real-time Firestore listener...');
        
        onSnapshot(complaintsRef, (snapshot) => {
            console.log('🔄 Real-time update received');
            updateStudentDashboard();
            renderComplaints();
        });
        
    } catch (error) {
        console.error('❌ Error setting up real-time updates:', error);
    }
}

// Setup complaint form with auto-fill
function setupComplaintForm() {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.type === 'student') {
        const nameField = document.getElementById('complaintName');
        const deptField = document.getElementById('complaintDept');
        
        if (nameField) nameField.value = currentUser.name;
        if (deptField) deptField.value = currentUser.department;
        
        console.log('✅ Complaint form auto-filled');
    }
}

// Handle complaint submission
async function handleComplaintSubmit(e) {
    e.preventDefault();
    console.log('📝 Complaint submission started');
    
    const originalText = showLoading(complaintSubmitBtn);
    
    const name = document.getElementById('complaintName').value;
    const department = document.getElementById('complaintDept').value;
    const category = document.getElementById('complaintCategory').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const title = document.getElementById('complaintTitle').value;
    const description = document.getElementById('complaintDescription').value;

    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Please login again', 'danger');
        hideLoading(complaintSubmitBtn, originalText);
        return;
    }

    try {
        const newComplaint = {
            studentName: name,
            department: department,
            category: category,
            priority: priority,
            title,
            description,
            status: 'pending',
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            studentId: currentUser.id
        };

        console.log('💾 Adding complaint to Firestore...');
        
        await addDoc(collection(db, 'complaints'), newComplaint);
        
        console.log('✅ Complaint submitted successfully');
        complaintForm.reset();
        setupComplaintForm();
        
        showNotification('Complaint submitted successfully!', 'success');
    } catch (error) {
        console.error('💥 Error submitting complaint:', error);
        showNotification('Failed to submit complaint. Please try again.', 'danger');
    } finally {
        hideLoading(complaintSubmitBtn, originalText);
    }
}

// Update student dashboard stats
async function updateStudentDashboard() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.log('❌ No current user found');
            setFallbackStats();
            return;
        }
        
        console.log('🔄 Updating dashboard stats...');
        
        const complaintsRef = collection(db, 'complaints');
        const querySnapshot = await getDocs(complaintsRef);
        const allComplaints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const myComplaints = allComplaints.filter(c => c.studentId === currentUser.id);
        
        const pending = myComplaints.filter(c => c.status === 'pending').length;
        const resolved = myComplaints.filter(c => c.status === 'resolved').length;
        const total = myComplaints.length;
        const resolutionPercentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

        console.log(`📈 Stats - Total: ${total}, Pending: ${pending}, Resolved: ${resolved}`);

        // Update stats immediately (no animation for initial load)
        updateStatImmediately('myComplaintsCount', total);
        updateStatImmediately('pendingCount', pending);
        updateStatImmediately('resolvedCount', resolved);
        
        const resolutionRateElement = document.getElementById('resolutionRate');
        const progressBar = document.getElementById('resolutionProgress');
        
        if (resolutionRateElement) {
            resolutionRateElement.textContent = `${resolutionPercentage}%`;
        }
        
        if (progressBar) {
            progressBar.style.width = `${resolutionPercentage}%`;
        }
        
    } catch (error) {
        console.error('❌ Error updating dashboard:', error);
        setFallbackStats();
    }
}

// Update stat immediately (no animation for initial load)
function updateStatImmediately(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = targetValue;
    }
}

// Render complaints for students
async function renderComplaints() {
    if (!complaintsList) {
        console.log('❌ Complaints list element not found');
        return;
    }
    
    console.log('🔄 Rendering complaints...');
    
    try {
        const complaintsRef = collection(db, 'complaints');
        const querySnapshot = await getDocs(complaintsRef);
        const allComplaints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`📋 Found ${allComplaints.length} total complaints`);

        if (allComplaints.length === 0) {
            complaintsList.innerHTML = `
                <div class="text-center text-muted p-5">
                    <i class="fas fa-clipboard-list fa-3x mb-3" style="color: #6c757d;"></i>
                    <p>No complaints submitted yet.</p>
                </div>`;
            return;
        }

        let filteredComplaints = [...allComplaints];
        
        // Apply search filter
        const searchTerm = searchComplaints ? searchComplaints.value.toLowerCase() : '';
        if (searchTerm) {
            filteredComplaints = filteredComplaints.filter(complaint => 
                complaint.title.toLowerCase().includes(searchTerm) || 
                complaint.description.toLowerCase().includes(searchTerm) ||
                complaint.studentName.toLowerCase().includes(searchTerm) ||
                complaint.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply sorting
        sortComplaintsList(filteredComplaints);
        
        if (filteredComplaints.length === 0) {
            complaintsList.innerHTML = `
                <div class="text-center text-muted p-5">
                    <i class="fas fa-search fa-3x mb-3" style="color: #6c757d;"></i>
                    <p>No complaints match your search.</p>
                </div>`;
            return;
        }

        complaintsList.innerHTML = '';
        
        filteredComplaints.forEach((complaint, index) => {
            renderComplaintWithEffects(complaint, complaintsList, index);
        });
        
        console.log(`✅ Rendered ${filteredComplaints.length} complaints`);
        
    } catch (error) {
        console.error('❌ Error rendering complaints:', error);
        complaintsList.innerHTML = `
            <div class="text-center text-danger p-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>Error loading complaints.</p>
            </div>`;
    }
}

// [Keep the rest of the functions the same...]
// Render complaint with animation effects
function renderComplaintWithEffects(complaint, container, index, isAdmin = false) {
    const card = document.createElement('div');
    card.className = `complaint-card ${complaint.status} fade-in`;
    card.style.animationDelay = `${index * 0.1}s`;
    
    const currentUser = getCurrentUser();
    const isOwner = currentUser && currentUser.type === 'student' && complaint.studentId === currentUser.id;
    
    const priorityColors = {
        'low': 'success',
        'medium': 'warning',
        'high': 'danger'
    };
    
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <h6 class="card-title mb-2 text-dark">${complaint.title}</h6>
                <p class="card-text mb-3 text-muted">${complaint.description}</p>
                <div class="d-flex flex-wrap gap-2 align-items-center">
                    <span class="badge bg-secondary">${complaint.department}</span>
                    <span class="badge bg-light text-dark">
                        <i class="fas fa-user me-1"></i>${complaint.studentName}
                    </span>
                    <span class="badge bg-light text-dark">
                        <i class="fas fa-calendar me-1"></i>${complaint.date}
                    </span>
                    ${complaint.category ? `<span class="badge bg-info">${complaint.category}</span>` : ''}
                    ${complaint.priority ? `<span class="badge bg-${priorityColors[complaint.priority]}">${complaint.priority} priority</span>` : ''}
                </div>
            </div>
            <div class="d-flex flex-column align-items-end">
                <span class="status-badge ${complaint.status === 'resolved' ? 'badge-resolved' : 'badge-pending'}">
                    <i class="fas ${complaint.status === 'resolved' ? 'fa-check-circle' : 'fa-clock'} me-1"></i>
                    ${complaint.status}
                </span>
                ${!isAdmin && isOwner ? `
                    <button class="btn btn-sm btn-outline-danger delete-btn mt-2"
                            onclick="deleteStudentComplaint('${complaint.id}')">
                        <i class="fas fa-trash me-1"></i> Delete
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    container.appendChild(card);
}

// Delete complaint function
async function deleteStudentComplaint(id) {
    showConfirmationModal('Are you sure you want to delete this complaint? This action cannot be undone.', async () => {
        try {
            await deleteDoc(doc(db, 'complaints', id));
            showNotification('Complaint deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting complaint:', error);
            showNotification('Failed to delete complaint', 'danger');
        }
    });
}

// Filter complaints by search term
function filterComplaintsBySearch() {
    renderComplaints();
}

// Sort complaints list
function sortComplaintsList(complaintsArray = null) {
    const sortBy = sortComplaints ? sortComplaints.value : 'newest';
    let listToSort = complaintsArray;
    
    if (!listToSort) {
        renderComplaints();
        return;
    }
    
    switch(sortBy) {
        case 'newest':
            listToSort.sort((a, b) => b.timestamp - a.timestamp);
            break;
        case 'oldest':
            listToSort.sort((a, b) => a.timestamp - b.timestamp);
            break;
        case 'status':
            listToSort.sort((a, b) => a.status.localeCompare(b.status));
            break;
    }
}

// Confirmation modal
function showConfirmationModal(message, callback) {
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h5 class="mb-3"><i class="fas fa-exclamation-triangle text-warning me-2"></i>Confirm Action</h5>
            <p class="mb-4">${message}</p>
            <div class="d-flex gap-2 justify-content-end">
                <button class="btn btn-secondary" id="cancelBtn">
                    <i class="fas fa-times me-1"></i> Cancel
                </button>
                <button class="btn btn-danger" id="confirmBtn">
                    <i class="fas fa-trash me-1"></i> Confirm Delete
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('cancelBtn').onclick = () => {
        document.body.removeChild(modal);
    };
    
    document.getElementById('confirmBtn').onclick = () => {
        document.body.removeChild(modal);
        callback();
    };
}

// Logout function
function logout() {
    console.log('🚪 Logout initiated');
    localStorage.removeItem('currentUser');
    // Force reload to ensure clean state
    window.location.href = window.location.origin + window.location.pathname;
}

// Make functions globally available
window.deleteStudentComplaint = deleteStudentComplaint;
window.logout = logout;
