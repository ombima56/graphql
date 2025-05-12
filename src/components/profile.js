import { getUserProfile } from '../api/graphql.js';
import { logout } from '../api/auth.js';
import { showError } from './ui.js';

// Function to render user profile
async function renderProfile() {
    try {
        const data = await getUserProfile();
        const user = data.user;
        
        const profileContainer = document.createElement('div');
        profileContainer.className = 'profile-container';
        
        // Profile header with logout button
        const header = document.createElement('div');
        header.className = 'profile-header';
        
        const title = document.createElement('h1');
        title.innerHTML = `<i class="fas fa-user-circle"></i> ${user.firstName} ${user.lastName}'s Profile`;
        
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'logout-btn';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.addEventListener('click', logout);
        
        header.appendChild(title);
        header.appendChild(logoutBtn);
        profileContainer.appendChild(header);
        
        // Section 1: Basic Information
        const basicInfo = document.createElement('div');
        basicInfo.className = 'profile-section';
        basicInfo.innerHTML = `
            <h2><i class="fas fa-id-card"></i> Basic Information</h2>
            <p><strong>Username:</strong> ${user.login}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Campus:</strong> ${user.campus}</p>
            <p><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
        `;
        profileContainer.appendChild(basicInfo);
        
        // Section 2: XP and Progress
        const progressInfo = document.createElement('div');
        progressInfo.className = 'profile-section';
        progressInfo.innerHTML = `
            <h2><i class="fas fa-trophy"></i> XP and Progress</h2>
            <p><strong>Total XP:</strong> ${formatNumber(calculateTotalXP(user.transactions))} XP</p>
            <p><strong>Audit Ratio:</strong> ${user.auditRatio.toFixed(1)}</p>
            <p><strong>Projects Completed:</strong> ${user.progresses.length}</p>
        `;
        profileContainer.appendChild(progressInfo);
        
        // Section 3: Audit Information
        const auditInfo = document.createElement('div');
        auditInfo.className = 'profile-section';
        auditInfo.innerHTML = `
            <h2><i class="fas fa-exchange-alt"></i> Audit Information</h2>
            <p><strong>Total Received:</strong> ${formatNumber(user.totalUp)} XP</p>
            <p><strong>Total Given:</strong> ${formatNumber(user.totalDown)} XP</p>
        `;
        profileContainer.appendChild(auditInfo);
        
        return profileContainer;
    } catch (error) {
        showError(error.message);
        return null;
    }
}

// Helper function to calculate total XP
function calculateTotalXP(transactions) {
    return transactions
        .filter(t => t.type === 'xp')
        .reduce((sum, t) => sum + t.amount, 0);
}

// Helper function to format numbers
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export { renderProfile };
