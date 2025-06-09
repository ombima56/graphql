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
      const user = Array.isArray(userData.user)
        ? userData.user[0]
        : userData.user;
      displayUserInfo(user);
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
      processTransactions(transactionsData.transaction);
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
      generateResultsChart(progressData.progress);
      displayRecentActivity(progressData.progress);
    }

    // Query specifically for XP-related transactions (used for XP card and XP chart)
    const xpQuery = `
      query {
        transaction(
          where: {
            _or: [
              { type: { _eq: "xp" }, eventId: {_eq: 75} },
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
      const positiveXpTransactions = xpData.transaction.filter(
        (t) =>
          t.amount > 0 &&
          (t.type === "xp" || t.type === "skill" || t.type === "level")
      );
      displayXPInfo(positiveXpTransactions);
      generateXPChart(xpData.transaction);
    } else {
      displayXPInfo([]);
    }

    // Query for skills data
    const skillsQuery = `
      query {
        transaction(
          where: {
            type: { _like: "skill_%" },
          }
          distinct_on: [type]
          order_by:[{type: asc}, {amount: desc}]
  
        ) {
          id
          type
          amount
          createdAt
          path
        }
      }
    `;
    const skillsData = await graphqlQuery(skillsQuery);
    if (skillsData && skillsData.transaction) {
      processSkillsData(skillsData.transaction);
    } else {
      displaySkillsError();
    }

  } catch (error) {
    console.error("Error loading profile:", error);
    showError("Failed to load profile data. Please try again.");

    // More specific error messages based on error type
    if (
      error.message.includes("NetworkError") ||
      (error.cause && error.cause.message.includes("Failed to fetch"))
    ) {
      showError(
        "Network error. Please check your connection and the GraphQL endpoint."
      );
    } else if (error.message.includes("GraphQL error")) {
      showError(
        "Data loading error from GraphQL. Please refresh or check query."
      );
    }
  }
}

// Process skills data from transactions
function processSkillsData(skillTransactions) {
  if (!skillTransactions || skillTransactions.length === 0) {
    displaySkillsError();
    return;
  }

  // Group skills by type and sum their amounts
  const skillsMap = new Map();
  
  skillTransactions.forEach(transaction => {
    if (transaction.type.startsWith('skill_')) {
      const skillType = transaction.type;
      const currentAmount = skillsMap.get(skillType) || 0;
      skillsMap.set(skillType, currentAmount + transaction.amount);
    }
  });

  // Convert to array format expected by renderSkillsOverview
  const skills = Array.from(skillsMap.entries()).map(([type, amount]) => ({
    type: type,
    amount: Math.round(amount) // Round to nearest integer for percentage display
  }));

  // Create userData object with skills
  const userData = { skills: skills };
  
  // Use the existing renderSkillsOverview function
  renderSkillsOverview(userData);
}

// Display error when skills data is not available
function displaySkillsError() {
  const skillsContainer = document.getElementById('skillsInfo');
  if (skillsContainer) {
    skillsContainer.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-triangle text-3xl text-slate-400 mb-3"></i>
        <p class="text-slate-500 dark:text-slate-400 text-sm">Skills data unavailable</p>
      </div>
    `;
  }
}

/**
 * Renders the skills overview section
 * @param {Object} userData - The processed user data
 */
function renderSkillsOverview(userData) {
  try {
    if (!userData || !userData.skills || !userData.skills.length) {
      throw new Error('Skills data not available');
    }

    const container = document.getElementById('skillsInfo');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Find max value for scaling
    const maxAmount = Math.max(...userData.skills.map(skill => skill.amount));

    // Sort skills by amount in descending order
    const sortedSkills = [...userData.skills].sort((a, b) => b.amount - a.amount);

    // Define colors for variety
    const colors = [
      { bg: 'bg-blue-500', text: 'text-blue-500' },
      { bg: 'bg-green-500', text: 'text-green-500' },
      { bg: 'bg-purple-500', text: 'text-purple-500' },
      { bg: 'bg-yellow-500', text: 'text-yellow-500' },
      { bg: 'bg-red-500', text: 'text-red-500' },
      { bg: 'bg-indigo-500', text: 'text-indigo-500' },
      { bg: 'bg-pink-500', text: 'text-pink-500' },
      { bg: 'bg-teal-500', text: 'text-teal-500' }
    ];

    // Create skills container

    console.log('sorted skills:', sortedSkills);

    // Process and display skills
    sortedSkills.forEach((skill, index) => {
      const skillName = skill.type.replace('skill_', '').replace(/_/g, ' ');
      const percentage = Math.min(skill.amount, 100); // Cap at 100% for display
      const color = colors[index % colors.length];

      const skillDiv = document.createElement('div');
      skillDiv.className = 'space-y-2';
      skillDiv.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">${skillName}</span>
          <span class="text-sm font-bold ${color.text} dark:${color.text}">${percentage}%</span>
        </div>
        <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
          <div class="${color.bg} h-2.5 rounded-full transition-all duration-300 ease-in-out" style="width: ${percentage}%"></div>
        </div>
      `;

      container.appendChild(skillDiv);
    });

  } catch (error) {
    console.error('Error rendering skills overview:', error);
    displaySkillsError();
  }
}

// Process transactions for XP and audit data
function processTransactions(transactions) {
  if (!transactions || transactions.length === 0) return;

  // XP transactions are those with positive amounts
  const xpTransactions = transactions.filter((t) => t.amount > 0);
  displayXPInfo(xpTransactions);
  generateXPChart(xpTransactions);

  // Separate audit transactions into up and down
  const auditTransactions = transactions.filter(
    (t) => t.type === "up" || t.type === "down"
  );
  const upTransactions = auditTransactions.filter((t) => t.type === "up");
  const downTransactions = auditTransactions.filter((t) => t.type === "down");

  displayAuditRatio(upTransactions, downTransactions);
}

function displayUserInfo(user) {
  const userInfoDiv = document.getElementById("userInfo");

  if (!user) {
    userInfoDiv.innerHTML = `
      <div class="text-center py-4">
        <p class="text-red-500 font-medium">User data not available</p>
      </div>
    `;
    return;
  }

  let html = "";

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  // Standard fields to display with enhanced styling
  const fields = [
    {
      key: "name",
      label: "Name:",
      value: fullName,
      icon: "👤",
    },
    {
      key: "login",
      label: "Username:",
      value: user.login,
      icon: "@",
    },
    {
      key: "email",
      label: "Email:",
      value: user.email,
      icon: "✉️",
    },
    {
      key: "createdAt",
      label: "Member Since:",
      value: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      icon: "📅",
    },
  ];

  // Display fields with enhanced styling
  fields.forEach((field) => {
    if (field.value) {
      html += `
        <div class="flex items-center p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow">
          <span class="text-xl mr-3 opacity-70">${field.icon}</span>
          <div class="flex-1">
            <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">${field.label}</span>
            <span class="block text-sm font-semibold text-slate-800 dark:text-slate-200">${field.value}</span>
          </div>
        </div>
      `;
    }
  });

  userInfoDiv.innerHTML =
    html ||
    `
    <div class="text-center py-4">
      <p class="text-slate-500 dark:text-slate-400 italic">No user information available</p>
    </div>
  `;
}

function displayXPInfo(transactions) {
  // Get references to the HTML elements for different XP states
  const totalXPLoading = document.getElementById("totalXPLoading");
  const totalXPDataView = document.getElementById("totalXPDataView");
  const noXPDataView = document.getElementById("noXPDataView");

  // Defensive check: Ensure all required view elements are present in the DOM
  if (!totalXPLoading || !totalXPDataView || !noXPDataView) {
    console.error(
      "Critical XP display elements (totalXPLoading, totalXPDataView, or noXPDataView) are missing from the DOM. Cannot update XP info."
    );
    const xpCardTitle = document
      .querySelector("#totalXP")
      .closest("div")
      .querySelector("h2");
    if (xpCardTitle)
      xpCardTitle.insertAdjacentHTML(
        "afterend",
        '<p class="text-red-500 text-sm">Error: XP display components missing.</p>'
      );
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
  const totalXP = transactions.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0
  );
  const formattedXP = formatDataSize(totalXP);

  const currentDate = new Date();
  const thirtyDaysAgo = new Date(currentDate);
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);

  const recentXPTransactions = transactions.filter(
    (t) => new Date(t.createdAt) > thirtyDaysAgo
  );
  const recentXPSum = recentXPTransactions.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0
  );
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
  const receivedXP = upTransactions.reduce(
    (sum, t) => sum + (t.amount || 0),
    0
  );
  const givenXP = downTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount || 0),
    0
  );

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
    if (value < 1000000) return `${(value / 1000).toFixed(2)} KB`;
    return `${(value / 1000000).toFixed(2)} MB`;
  };

  auditRatioDiv.innerHTML = `
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">Audit Ratio:</span>
        <span class="text-xl font-bold ${getRatioColorClass(
          ratio
        )}">${ratio}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">Received:</span>
        <span class="text-sm font-medium text-green-500">${formatReceivedGiven(
          receivedXP
        )}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">Given:</span>
        <span class="text-sm font-medium text-blue-500">${formatReceivedGiven(
          givenXP
        )}</span>
      </div>
    </div>
  `;
}

// Helper function for ratio color coding
function getRatioColorClass(ratio) {
  const numRatio = parseFloat(ratio);
  if (numRatio >= 1.0) return "text-green-500";
  if (numRatio >= 0.5) return "text-yellow-500";
  return "text-red-500";
}

function displayRecentActivity(activities) {
  const activityDiv = document.getElementById("recentActivity");

  if (!activities || activities.length === 0) {
    activityDiv.innerHTML = '<p class="text-slate-500">No recent activity</p>';
    return;
  }

  // Take the most recent 5 activities
  const recentActivities = activities.slice(0, 5);

  let html = "";

  recentActivities.forEach((activity) => {
    const date = new Date(activity.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Determine project name
    let projectName =
      activity.object?.name || activity.path || "Unknown project";

    // Determine status
    let statusText, statusClass, borderClass;
    if (activity.grade > 0) {
      statusText = "PASS";
      statusClass = "bg-green-100 text-green-800";
      borderClass = "border-green-500";
    } else if (activity.grade < 0) {
      statusText = "FAIL";
      statusClass = "bg-red-100 text-red-800";
      borderClass = "border-red-500";
    } else {
      statusText = "IN PROGRESS";
      statusClass = "bg-yellow-100 text-yellow-800";
      borderClass = "border-yellow-500";
    }

    html += `
      <div class="border-l-4 ${borderClass} pl-4 py-2">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-bold">${projectName}</p>
            <p class="text-xs text-slate-500">${date}</p>
          </div>
          <div class="text-right">
            <span class="px-2 py-1 rounded text-xs ${statusClass}">${statusText}</span>
          </div>
        </div>
      </div>
    `;
  });

  activityDiv.innerHTML = html;
}
