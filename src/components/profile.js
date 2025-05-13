import { getUserProfile } from '../api/graphql.js';
import { logout } from '../api/auth.js';
import { showError } from './ui.js';

// Function to calculate audit ratio if not provided by the API
function calculateAuditRatio(user) {
    if (user.auditRatio !== undefined) {
        return user.auditRatio;
    }
    
    // If auditRatio is not provided, calculate it from totalUp and totalDown
    if (user.totalUp && user.totalDown && user.totalDown > 0) {
        return user.totalUp / user.totalDown;
    }
    
    // Default value if we can't calculate
    return 1.0;
}

// Function to render user profile
async function renderProfile() {
    try {
        console.log('Fetching user profile data...');
        const data = await getUserProfile();
        
        if (!data) {
            console.error('No data returned from getUserProfile()');
            throw new Error('Failed to load profile data. No data returned from server.');
        }
        
        if (!data.user) {
            console.error('No user data in response:', data);
            throw new Error('Failed to load profile data. User data not found in response.');
        }
        
        console.log('User profile data received:', data.user);
        
        // Handle case where user is returned as an array
        const userData = Array.isArray(data.user) ? data.user[0] : data.user;
        
        if (!userData) {
            console.error('No user data found in response array');
            throw new Error('Failed to load profile data. User data not found in response.');
        }
        
        // Add defensive checks for all user properties
        const safeUser = {
            firstName: userData.firstName || 'Unknown',
            lastName: userData.lastName || 'User',
            login: userData.login || 'unknown',
            email: userData.email || 'N/A',
            campus: userData.campus || 'N/A',
            createdAt: userData.createdAt || new Date().toISOString(),
            totalUp: userData.totalUp || 0,
            totalDown: userData.totalDown || 0,
            progresses: Array.isArray(userData.progresses) ? userData.progresses : [],
            transactions: Array.isArray(userData.transactions) ? userData.transactions : []
        };
        
        // Calculate audit ratio if not provided
        safeUser.auditRatio = calculateAuditRatio(userData);
        
        console.log('Prepared safe user data:', safeUser);
        
        const profileContainer = document.createElement('div');
        profileContainer.className = 'profile-container';
        
        // Profile header with logout button
        const header = document.createElement('div');
        header.className = 'profile-header';
        
        const title = document.createElement('h1');
        title.innerHTML = `<i class="fas fa-user-circle"></i> ${safeUser.firstName} ${safeUser.lastName}'s Profile`;
        
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
            <p><strong>Username:</strong> ${safeUser.login}</p>
            <p><strong>Email:</strong> ${safeUser.email}</p>
            <p><strong>Campus:</strong> ${safeUser.campus}</p>
            <p><strong>Joined:</strong> ${new Date(safeUser.createdAt).toLocaleDateString('en-US', { 
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
            <p><strong>Total XP:</strong> ${formatXP(calculateTotalXP(safeUser.transactions))} </p>
            <p><strong>Audit Ratio:</strong> ${safeUser.auditRatio.toFixed(1)}</p>
            <p><strong>Projects Completed:</strong> ${safeUser.progresses.length}</p>
        `;
        profileContainer.appendChild(progressInfo);
        
        // Section 3: Audit Information
        const auditInfo = document.createElement('div');
        auditInfo.className = 'profile-section';
        auditInfo.innerHTML = `
            <h2><i class="fas fa-exchange-alt"></i> Audit Information</h2>
            <p><strong>Total Received:</strong> ${formatXP(safeUser.totalUp)} </p>
            <p><strong>Total Given:</strong> ${formatXP(safeUser.totalDown)} </p>
        `;
        profileContainer.appendChild(auditInfo);
        
        // Section 4: Recent Activity
        const recentActivity = document.createElement('div');
        recentActivity.className = 'profile-section';
        
        const activityTitle = document.createElement('h2');
        activityTitle.innerHTML = '<i class="fas fa-history"></i> Recent Activity';
        recentActivity.appendChild(activityTitle);
        
        // Get the 5 most recent transactions
        const recentTransactions = [...safeUser.transactions]
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
                        description = `Earned ${formatXP(transaction.amount)}`;
                        break;
                    case 'up':
                        icon = '<i class="fas fa-arrow-up"></i>';
                        description = `Received ${formatXP(transaction.amount)}`;
                        break;
                    case 'down':
                        icon = '<i class="fas fa-arrow-down"></i>';
                        description = `Gave ${formatXP(transaction.amount)}`;
                        break;
                    default:
                        icon = '<i class="fas fa-circle"></i>';
                        description = `${transaction.type} transaction of ${formatXP(transaction.amount)}`;
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

        // Section 5: Project Categories
        const projectCategories = document.createElement('div');
        profileContainer.appendChild(projectCategories);

        return profileContainer;
    } catch (error) {
        console.error('Profile rendering error:', error);
        
        // Create an error message element
        const errorContainer = document.createElement('div');
        errorContainer.className = 'profile-section error-section';
        errorContainer.innerHTML = `
            <h2><i class="fas fa-exclamation-circle"></i> Error Loading Profile</h2>
            <p>${error.message || 'An unexpected error occurred while loading your profile data.'}</p>
            <button onclick="window.location.reload()">Retry</button>
        `;
        
        return errorContainer;
    }
}

// Helper function to calculate total XP
function calculateTotalXP(transactions) {
    if (!transactions || !Array.isArray(transactions)) {
        return 0;
    }
    
    return transactions
        .filter(t => t.type === 'xp')
        .reduce((sum, t) => sum + t.amount, 0);
}

// Helper function to format numbers
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper function to format XP in KB and MB
function formatXP(xp) {
    if (xp >= 1000000) {
        return `${(xp / 1000000).toFixed(2)} MB`;
    } else if (xp >= 1000) {
        return `${(xp / 1000).toFixed(1)} KB`;
    } else {
        return `${xp} B`;
    }
}

// Helper function to process project categories
function processProjectCategories(transactions) {
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return [];
    }
    
    // Extract project category from path
    const xpByCategory = {};
    let totalXP = 0;
    
    transactions.forEach(t => {
        if (t && t.type === 'xp' && t.path) {
            // Extract category from path (e.g., /div-01/graphql -> div-01)
            const pathParts = t.path.split('/');
            let category = 'Other';
            
            if (pathParts.length >= 2) {
                // Get the main category (e.g., div-01, piscine-js)
                category = pathParts[1] || 'Other';
                
                // Clean up category names for better display
                if (category.startsWith('div-')) {
                    category = 'Division ' + category.substring(4);
                } else if (category === 'piscine-js') {
                    category = 'JS Piscine';
                } else if (category === 'piscine-go') {
                    category = 'Go Piscine';
                }
            }
            
            if (!xpByCategory[category]) {
                xpByCategory[category] = 0;
            }
            
            const amount = Number(t.amount) || 0;
            xpByCategory[category] += amount;
            totalXP += amount;
        }
    });
    
    // Convert to array format and calculate percentages
    const result = Object.entries(xpByCategory)
        .filter(([_, value]) => value > 0)
        .map(([label, value]) => ({
            label,
            value,
            displayValue: formatXP(value),
            percentage: totalXP > 0 ? Math.round((value / totalXP) * 100) : 0
        }))
        .sort((a, b) => b.value - a.value); // Sort by value in descending order
        
    return result;
}

export { renderProfile, formatXP };
