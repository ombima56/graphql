// Load profile data dynamically
async function loadProfile() {
  try {
    // Query for user information
    const userQuery = `
      query {
        user {
          id
          login
          firstName
          lastName
          email
          createdAt
        }
      }
    `;

    const userData = await graphqlQuery(userQuery);

    if (userData && userData.user) {
      const user = Array.isArray(userData.user) ? userData.user[0] : userData.user;
      displayUserInfo(user);
    }

    // Query for transactions (both XP and audits)
    const transactionsQuery = `
      query {
        transaction(order_by: {createdAt: desc}) {
          id
          type
          amount
          createdAt
          path
        }
      }
    `;

    const transactionsData = await graphqlQuery(transactionsQuery);
    
    if (transactionsData && transactionsData.transaction) {
      // Process all transactions for XP and audit data
      processTransactions(transactionsData.transaction);
    }

    // Query for progress/results
    const progressQuery = `
      query {
        progress(order_by: {createdAt: desc}) {
          id
          grade
          createdAt
          updatedAt
          path
          object {
            id
            name
            type
          }
        }
      }
    `;

    const progressData = await graphqlQuery(progressQuery);
    
    if (progressData && progressData.progress) {
      generateResultsChart(progressData.progress);
      displayRecentActivity(progressData.progress);
    }

  } catch (error) {
    console.error("Error loading profile:", error);
    showError("Failed to load profile data");
  }
}

// Process transactions for XP and audit data
function processTransactions(transactions) {
  if (!transactions || transactions.length === 0) return;

  // XP transactions are those with positive amounts
  const xpTransactions = transactions.filter(t => t.amount > 0);
  displayXPInfo(xpTransactions);
  generateXPChart(xpTransactions);

  // Audit transactions are those with negative amounts
  const auditTransactions = transactions.filter(t => t.amount < 0);
  displayAuditRatio(auditTransactions);
}

// Display user info dynamically
function displayUserInfo(user) {
  const userInfoDiv = document.getElementById("userInfo");

  if (!user) {
    userInfoDiv.innerHTML = '<p class="text-red-500">User data not available</p>';
    return;
  }

  let html = '';
  
  // Standard fields to display
  const fields = [
    { key: 'login', label: 'Login' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name', 
      format: (value, user) => user.firstName ? `${user.firstName} ${value}` : value 
    },
    { key: 'email', label: 'Email' },
    { key: 'createdAt', label: 'Joined', format: (value) => 
      new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long", 
        day: "numeric",
      })
    }
  ];

  // Display standard fields
  fields.forEach(field => {
    if (user[field.key]) {
      const value = field.format ? field.format(user[field.key], user) : user[field.key];
      html += `<p><span class="text-slate-500">${field.label}:</span> ${value}</p>`;
    }
  });

  userInfoDiv.innerHTML = html || '<p class="text-slate-500">No user information available</p>';
}

// Display XP info dynamically
function displayXPInfo(transactions) {
  const totalXPDiv = document.getElementById("totalXP");

  if (!transactions || transactions.length === 0) {
    totalXPDiv.innerHTML = '<span class="text-base text-slate-500">No XP data available</span>';
    return;
  }

  // Calculate total XP from all transactions
  const totalXP = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Format the XP value using the formatDataSize function
  const formattedXP = formatDataSize(totalXP);
  
  // Display the formatted XP value with additional info
  totalXPDiv.innerHTML = `
    <div class="flex items-center justify-center">
      <div class="text-center">
        <span class="text-3xl font-bold">${formattedXP}</span>
        <div class="text-sm text-slate-500 mt-1">${transactions.length} transactions</div>
      </div>
    </div>
  `;
}

// Display audit ratio dynamically
function displayAuditRatio(transactions) {
  const auditRatioDiv = document.getElementById("auditRatio");

  if (!transactions || transactions.length === 0) {
    auditRatioDiv.innerHTML = '<span class="text-base text-slate-500">No audit data available</span>';
    return;
  }

  // Calculate total audit points (using absolute values)
  const totalAudits = transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  
  // Calculate ratio (for display purposes, we'll just show the count)
  const ratio = transactions.length > 0 ? (totalAudits / transactions.length).toFixed(1) : "0.0";
  
  auditRatioDiv.innerHTML = `
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">Audits:</span>
        <span class="text-xl font-bold text-purple-500">${transactions.length}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">Points:</span>
        <span class="text-lg font-bold text-blue-500">${formatDataSize(totalAudits)}</span>
      </div>
    </div>
  `;
}

// Display recent activity dynamically
function displayRecentActivity(activities) {
  const activityDiv = document.getElementById("recentActivity");
  
  if (!activities || activities.length === 0) {
    activityDiv.innerHTML = '<p class="text-slate-500">No recent activity</p>';
    return;
  }
  
  // Take the most recent 5 activities
  const recentActivities = activities.slice(0, 5);
  
  let html = '';
  
  recentActivities.forEach(activity => {
    const date = new Date(activity.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
    
    // Determine project name
    let projectName = activity.object?.name || activity.path || "Unknown project";
    
    // Determine pass/fail status
    const isPassed = activity.grade > 0;
    const statusText = isPassed ? "PASS" : "FAIL";
    
    html += `
      <div class="border-l-4 ${isPassed ? 'border-green-500' : 'border-red-500'} pl-4 py-2">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-bold">${projectName}</p>
            <p class="text-xs text-slate-500">${date}</p>
          </div>
          <div class="text-right">
            <span class="px-2 py-1 rounded text-xs ${
              isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }">${statusText}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  activityDiv.innerHTML = html;
}