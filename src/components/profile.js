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
        
        // Section 4: Recent Activity
        const recentActivity = document.createElement('div');
        recentActivity.className = 'profile-section';
        
        const activityTitle = document.createElement('h2');
        activityTitle.innerHTML = '<i class="fas fa-history"></i> Recent Activity';
        recentActivity.appendChild(activityTitle);
        
        // Get the 5 most recent transactions
        const recentTransactions = [...user.transactions]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
            
        if (recentTransactions.length > 0) {
            const activityList = document.createElement('ul');
            activityList.className = 'activity-list';
            
            recentTransactions.forEach(transaction => {
                const item = document.createElement('li');
                const date = new Date(transaction.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                let icon, description;
                switch(transaction.type) {
                    case 'xp':
                        icon = '<i class="fas fa-star"></i>';
                        description = `Earned ${formatNumber(transaction.amount)} XP`;
                        break;
                    case 'up':
                        icon = '<i class="fas fa-arrow-up"></i>';
                        description = `Received ${formatNumber(transaction.amount)} audit points`;
                        break;
                    case 'down':
                        icon = '<i class="fas fa-arrow-down"></i>';
                        description = `Gave ${formatNumber(transaction.amount)} audit points`;
                        break;
                    default:
                        icon = '<i class="fas fa-circle"></i>';
                        description = `${transaction.type} transaction of ${formatNumber(transaction.amount)}`;
                }
                
                item.innerHTML = `
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-details">
                        <div class="activity-description">${description}</div>
                        <div class="activity-path">${transaction.path || 'N/A'}</div>
                        <div class="activity-date">${date}</div>
                    </div>
                `;
                
                activityList.appendChild(item);
            });
            
            recentActivity.appendChild(activityList);
        } else {
            const noActivity = document.createElement('p');
            noActivity.textContent = 'No recent activity found.';
            recentActivity.appendChild(noActivity);
        }
        
        profileContainer.appendChild(recentActivity);
        
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
