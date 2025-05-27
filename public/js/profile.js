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
    const userData = await graphqlQuery(userQuery); // Assumes graphqlQuery is defined
    if (userData && userData.user) {
      const user = Array.isArray(userData.user) ? userData.user[0] : userData.user;
      displayUserInfo(user); // Assumes displayUserInfo is defined
    }

    // Query for all transactions (could be used for audit ratio or other calculations)
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
      processTransactions(transactionsData.transaction); // Assumes processTransactions is defined
    }

    // Query for progress/results (used for results chart and recent activity)
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
      generateResultsChart(progressData.progress); // Assumes generateResultsChart is defined
      displayRecentActivity(progressData.progress); // Assumes displayRecentActivity is defined
    }

    // Query specifically for XP-related transactions (used for XP card and XP chart)
    const xpQuery = `
      query {
        transaction(
          where: {
            _or: [
              { type: { _eq: "xp" } },
              { type: { _eq: "skill" } },
              { type: { _eq: "level" } }
            ]
          },
          order_by: { createdAt: desc }
        ) {
          id
          type
          amount
          createdAt
          path
        }
      }
    `;
    const xpData = await graphqlQuery(xpQuery);
    if (xpData && xpData.transaction) {
      const positiveXpTransactions = xpData.transaction.filter(t => t.amount > 0 && (t.type === "xp" || t.type === "skill" || t.type === "level"));
      displayXPInfo(positiveXpTransactions);
      generateXPChart(xpData.transaction);
    } else {
      displayXPInfo([]);
    }

  } catch (error) {
    console.error("Error loading profile:", error);
    showError("Failed to load profile data. Please try again.");
    
    // More specific error messages based on error type
    if (error.message.includes("NetworkError") || (error.cause && error.cause.message.includes("Failed to fetch"))) {
      showError("Network error. Please check your connection and the GraphQL endpoint.");
    } else if (error.message.includes("GraphQL error")) {
      showError("Data loading error from GraphQL. Please refresh or check query.");
    }
  }
}

// Process transactions for XP and audit data
function processTransactions(transactions) {
  if (!transactions || transactions.length === 0) return;

  // XP transactions are those with positive amounts
  const xpTransactions = transactions.filter(t => t.amount > 0);
  displayXPInfo(xpTransactions);
  generateXPChart(xpTransactions);

  // Separate audit transactions into up and down
  const auditTransactions = transactions.filter(t => t.type === 'up' || t.type === 'down');
  const upTransactions = auditTransactions.filter(t => t.type === 'up');
  const downTransactions = auditTransactions.filter(t => t.type === 'down');
  
  displayAuditRatio(upTransactions, downTransactions);
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
  // Get references to the HTML elements for different XP states
  const totalXPLoading = document.getElementById("totalXPLoading");
  const totalXPDataView = document.getElementById("totalXPDataView");
  const noXPDataView = document.getElementById("noXPDataView");

  // Defensive check: Ensure all required view elements are present in the DOM
  if (!totalXPLoading || !totalXPDataView || !noXPDataView) {
    console.error("Critical XP display elements (totalXPLoading, totalXPDataView, or noXPDataView) are missing from the DOM. Cannot update XP info.");
    const xpCardTitle = document.querySelector('#totalXP').closest('div').querySelector('h2');
    if(xpCardTitle) xpCardTitle.insertAdjacentHTML('afterend', '<p class="text-red-500 text-sm">Error: XP display components missing.</p>');
    return;
  }
  
  // Always hide the loading spinner first
  totalXPLoading.classList.add("hidden");

  // Check if there are valid transactions to display
  if (!transactions || transactions.length === 0) {
    totalXPDataView.classList.add("hidden");
    noXPDataView.classList.remove("hidden");
    return;
  }

  // If data is available, show the data view and hide the "no data" message
  totalXPDataView.classList.remove("hidden");
  noXPDataView.classList.add("hidden");

  // Calculate total XP from transactions (ensure amount is a number)
  const totalXP = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const formattedXP = formatDataSize(totalXP);
  
  const currentDate = new Date();
  const thirtyDaysAgo = new Date(currentDate);
  thirtyDaysAgo.setDate(currentDate.getDate() - 30); 
  
  const recentXPTransactions = transactions.filter(t => new Date(t.createdAt) > thirtyDaysAgo);
  const recentXPSum = recentXPTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const xpPerDay = (recentXPSum / 30).toFixed(1);

  const xpValueEl = document.getElementById("xpValue");
  const xpTransactionsEl = document.getElementById("xpTransactions");
  const xpPerDayEl = document.getElementById("xpPerDay");

  if (xpValueEl) {
    xpValueEl.textContent = formattedXP;
  } else {
    console.warn("Element with ID 'xpValue' not found.");
  }

  if (xpTransactionsEl) {
    xpTransactionsEl.textContent = transactions.length;
  } else {
    console.warn("Element with ID 'xpTransactions' not found.");
  }

  if (xpPerDayEl) {
    xpPerDayEl.textContent = xpPerDay;
  } else {
    console.warn("Element with ID 'xpPerDay' not found.");
  }
}

function displayAuditRatio(upTransactions = [], downTransactions = []) {
  const auditRatioDiv = document.getElementById("auditRatio");

  // Calculate totals (default to 0 if undefined)
  const receivedXP = upTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const givenXP = downTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  // Calculate ratio (protect against division by zero)
  let ratio;
  if (givenXP > 0) {
    ratio = (receivedXP / givenXP).toFixed(1);
  } else {
    ratio = receivedXP > 0 ? "∞" : "0.0";
  }

  // Format values in B/KB/MB with different decimal places
  const formatReceivedGiven = (value) => {
    if (value === 0) return "0 B";
    if (value < 1000) return `${value.toFixed(0)} B`;
    if (value < 1000000) return `${(value/1000).toFixed(2)} KB`;
    return `${(value/1000000).toFixed(2)} MB`;
  };

  auditRatioDiv.innerHTML = `
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">Audit Ratio:</span>
        <span class="text-xl font-bold ${getRatioColorClass(ratio)}">${ratio}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">Received:</span>
        <span class="text-sm font-medium text-green-500">${formatReceivedGiven(receivedXP)}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">Given:</span>
        <span class="text-sm font-medium text-blue-500">${formatReceivedGiven(givenXP)}</span>
      </div>
    </div>
  `;
}

// Helper function for ratio color coding
function getRatioColorClass(ratio) {
  const numRatio = parseFloat(ratio);
  if (numRatio >= 1.0) return 'text-green-500';
  if (numRatio >= 0.5) return 'text-yellow-500';
  return 'text-red-500';
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