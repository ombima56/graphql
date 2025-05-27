// Load profile data
async function loadProfile() {
  try {
    // Basic user query (normal query)
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

    // XP transactions query (query with arguments)
    const xpQuery = `
      query {
        transaction(where: {type: {_eq: "xp"}}) {
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
      displayXPInfo(xpData.transaction);
      generateXPChart(xpData.transaction);
    }

    // Audit transactions query
    const auditQuery = `
      query {
        transaction(where: {type: {_in: ["up", "down"]}}) {
          id
          type
          amount
          createdAt
        }
      }
    `;

    const auditData = await graphqlQuery(auditQuery);

    if (auditData && auditData.transaction) {
      displayAuditRatio(auditData.transaction);
    }

    // Progress query (nested query)
    const progressQuery = `
      query {
        progress {
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
    } else {
      // Fallback to results if progress is not available
      const resultsQuery = `
        query {
          result {
            id
            grade
            createdAt
            path
          }
        }
      `;

      const resultsData = await graphqlQuery(resultsQuery);

      if (resultsData && resultsData.result) {
        generateResultsChart(resultsData.result);
        displayRecentActivity(resultsData.result);
      }
    }
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

// Display user info
function displayUserInfo(user) {
  const userInfoDiv = document.getElementById("userInfo");

  if (!user) {
    userInfoDiv.innerHTML =
      '<p class="text-red-500">User data not available</p>';
    return;
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  userInfoDiv.innerHTML = `
    <p><span class="text-slate-500">Login:</span> ${
      user.login || "N/A"
    }</p>
    <p><span class="text-slate-500">Name:</span> ${
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : "N/A"
    }</p>
    <p><span class="text-slate-500">Email:</span> ${
      user.email || "N/A"
    }</p>
    <p><span class="text-slate-500">Joined:</span> ${joinDate}</p>
  `;
}

// Display XP info
function displayXPInfo(transactions) {
  const totalXPDiv = document.getElementById("totalXP");

  if (!transactions || transactions.length === 0) {
    totalXPDiv.innerHTML =
      '<span class="text-base text-slate-500">No XP data available</span>';
    return;
  }

  const totalXP = transactions.reduce(
    (sum, t) => sum + (t.amount || 0),
    0
  );
  
  // Format the XP value using the formatDataSize function
  const formattedXP = formatDataSize(totalXP);
  
  // Display the formatted XP value
  totalXPDiv.innerHTML = `
    <div class="flex items-center justify-center">
      <span class="text-3xl font-bold">${formattedXP}</span>
    </div>
  `;
}

// Display audit ratio
function displayAuditRatio(transactions) {
  const auditRatioDiv = document.getElementById("auditRatio");

  if (!transactions || transactions.length === 0) {
    auditRatioDiv.innerHTML =
      '<span class="text-base text-slate-500">No audit data available</span>';
    return;
  }

  const upTotal = transactions
    .filter((t) => t.type === "up")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const downTotal = transactions
    .filter((t) => t.type === "down")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  if (upTotal > 0 || downTotal > 0) {
    // Format the values in B, KB, or MB
    const upFormatted = formatDataSize(upTotal);
    const downFormatted = formatDataSize(downTotal);
    
    // Calculate ratio (if downTotal is 0, set ratio to upTotal or 1.0)
    const ratio = downTotal > 0 ? (upTotal / downTotal).toFixed(1) : (upTotal > 0 ? upTotal.toFixed(1) : "1.0");
    
    // Create HTML with a vertical layout and aligned labels
    auditRatioDiv.innerHTML = `
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-500">Ratio:</span>
          <span class="text-xl font-bold text-purple-500">${ratio}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-500">Received:</span>
          <span class="text-lg font-bold text-green-500">${upFormatted}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-500">Given:</span>
          <span class="text-lg font-bold text-blue-500">${downFormatted}</span>
        </div>
      </div>
    `;
  } else {
    auditRatioDiv.innerHTML =
      '<span class="text-base text-slate-500">No audit data</span>';
  }
}

// Display recent activity
function displayRecentActivity(activities) {
  const activityDiv = document.getElementById("recentActivity");
  
  if (!activities || activities.length === 0) {
    activityDiv.innerHTML = '<p class="text-slate-500">No recent activity</p>';
    return;
  }
  
  // Sort by date (newest first) and take the 5 most recent
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  
  let html = '';
  
  recentActivities.forEach(activity => {
    const date = new Date(activity.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
    
    const projectName = activity.object?.name || activity.path || "Unknown project";
    const grade = activity.grade !== undefined ? activity.grade : "N/A";
    
    html += `
      <div class="border-l-4 ${grade > 0 ? 'border-green-500' : 'border-red-500'} pl-4 py-2">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-bold">${projectName}</p>
            <p class="text-xs text-slate-500">${date}</p>
          </div>
          <div class="text-right">
            <span class="px-2 py-1 rounded ${
              grade > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }">${grade > 0 ? 'PASS' : 'FAIL'}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  activityDiv.innerHTML = html;
}