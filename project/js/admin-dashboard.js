import { db } from './firebase-config.js';
import { showNotification } from './main.js';
import { collection, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// DOM Elements
let adminLogoutBtn, showAllBtn, showPendingBtn, showResolvedBtn, adminComplaintsList;

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    console.log('👨‍💼 Admin dashboard module loaded');
    
    // Initialize DOM elements
    adminLogoutBtn = document.getElementById('adminLogout');
    showAllBtn = document.getElementById('showAllBtn');
    showPendingBtn = document.getElementById('showPendingBtn');
    showResolvedBtn = document.getElementById('showResolvedBtn');
    adminComplaintsList = document.getElementById('adminComplaintsList');

    // Event Listeners
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', logout);
    }
    
    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => filterComplaints('all'));
    }
    
    if (showPendingBtn) {
        showPendingBtn.addEventListener('click', () => filterComplaints('pending'));
    }
    
    if (showResolvedBtn) {
        showResolvedBtn.addEventListener('click', () => filterComplaints('resolved'));
    }

    // Load admin data
    updateAdminDashboard();
    renderAdminComplaints();
});

// Update admin dashboard stats
async function updateAdminDashboard() {
    try {
        const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        const complaints = complaintsSnapshot.docs.map(doc => doc.data());
        const users = usersSnapshot.docs.map(doc => doc.data());
        
        const totalComplaints = complaints.length;
        const pending = complaints.filter(c => c.status === 'pending').length;
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const studentCount = users.length;

        document.getElementById('adminTotalComplaints').textContent = totalComplaints;
        document.getElementById('adminPendingCount').textContent = pending;
        document.getElementById('adminResolvedCount').textContent = resolved;
        document.getElementById('adminStudentCount').textContent = studentCount;
    } catch (error) {
        console.error('Error updating admin dashboard:', error);
    }
}

// Render complaints for admin
async function renderAdminComplaints(filter = 'all') {
    adminComplaintsList.innerHTML = '';
    currentFilter = filter;
    
    try {
        const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
        let complaints = complaintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (filter === 'pending') {
            complaints = complaints.filter(c => c.status === 'pending');
        } else if (filter === 'resolved') {
            complaints = complaints.filter(c => c.status === 'resolved');
        }
        
        if (complaints.length === 0) {
            adminComplaintsList.innerHTML = '<div class="text-center text-muted p-5"><i class="fas fa-inbox fa-3x mb-3"></i><p>No complaints found.</p></div>';
            return;
        }

        complaints.forEach((complaint, index) => {
            renderComplaintWithEffects(complaint, adminComplaintsList, index, true);
        });
    } catch (error) {
        console.error('Error rendering admin complaints:', error);
        adminComplaintsList.innerHTML = '<div class="text-center text-danger p-5"><i class="fas fa-exclamation-triangle fa-3x mb-3"></i><p>Error loading complaints.</p></div>';
    }
}

// Render complaint with animation effects
function renderComplaintWithEffects(complaint, container, index, isAdmin = false) {
    const card = document.createElement('div');
    card.className = `complaint-card ${complaint.status} fade-in`;
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <h6 class="card-title mb-2">${complaint.title}</h6>
                <p class="card-text mb-3">${complaint.description}</p>
                <div class="d-flex flex-wrap gap-2 align-items-center">
                    <span class="badge bg-secondary">${complaint.department}</span>
                    <span class="badge bg-light text-dark">
                        <i class="fas fa-user me-1"></i>${complaint.studentName}
                    </span>
                    <span class="badge bg-light text-dark">
                        <i class="fas fa-calendar me-1"></i>${complaint.date}
                    </span>
                    ${complaint.category ? `<span class="badge bg-info">${complaint.category}</span>` : ''}
                    ${complaint.priority ? `<span class="status-badge badge-priority-${complaint.priority}">${complaint.priority} priority</span>` : ''}
                </div>
            </div>
            <div class="d-flex flex-column align-items-end">
                <span class="status-badge ${complaint.status === 'resolved' ? 'badge-resolved' : 'badge-pending'}">
                    ${complaint.status}
                </span>
                ${isAdmin ? `
                    <button class="btn btn-sm ${complaint.status === 'pending' ? 'btn-success' : 'btn-warning'} mt-2"
                            onclick="toggleComplaintStatus('${complaint.id}')">
                        <i class="fas ${complaint.status === 'pending' ? 'fa-check' : 'fa-clock'} me-1"></i>
                        ${complaint.status === 'pending' ? 'Resolve' : 'Reopen'}
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    container.appendChild(card);
}

// Update complaint status
async function toggleComplaintStatus(id) {
    try {
        const complaintRef = doc(db, 'complaints', id);
        const complaintDoc = await getDoc(complaintRef);
        const complaint = complaintDoc.data();
        
        const newStatus = complaint.status === 'pending' ? 'resolved' : 'pending';
        await updateDoc(complaintRef, { status: newStatus });
        
        updateAdminDashboard();
        renderAdminComplaints(currentFilter);
        showNotification(`Complaint marked as ${newStatus}`, 'success');
    } catch (error) {
        console.error('Error updating complaint status:', error);
        showNotification('Failed to update complaint status', 'danger');
    }
}

// Filter complaints for admin
function filterComplaints(status) {
    renderAdminComplaints(status);
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.reload();
}

// Make functions globally available for onclick handlers
window.toggleComplaintStatus = toggleComplaintStatus;
