import { getUserXP, getUserAudits } from "../api/graphql.js";
import {
  createSvgElement,
  createBarChart,
  createPieChart,
} from "../utils/svg.js";
import { showError } from "./ui.js";
import { formatXP } from './profile.js';

// Function to render statistics section with SVG graphs
async function renderStats() {
  try {
    // Fetch data for graphs
    const xpData = await getUserXP();
    const auditData = await getUserAudits();
    
    if (!xpData || !xpData.user) {
      throw new Error('Failed to load XP data. Please try again later.');
    }
    
    if (!auditData || !auditData.user) {
      throw new Error('Failed to load audit data. Please try again later.');
    }
    
    // Handle case where user is returned as an array
    const xpUserData = Array.isArray(xpData.user) ? xpData.user[0] : xpData.user;
    const auditUserData = Array.isArray(auditData.user) ? auditData.user[0] : auditData.user;
    
    if (!xpUserData || !auditUserData) {
      throw new Error('Failed to load user data. Please try again later.');
    }
    
    const statsContainer = document.createElement("div");
    statsContainer.className = "profile-section";

    const title = document.createElement("h2");
    title.innerHTML = '<i class="fas fa-chart-line"></i> Graphical Statistics';
    statsContainer.appendChild(title);

    const graphsContainer = document.createElement("div");
    graphsContainer.className = "stats-container";

    // XP Progress Graph (Bar Chart)
    const xpGraphContainer = document.createElement("div");
    xpGraphContainer.className = "graph-container";

    const xpTitle = document.createElement("h3");
    xpTitle.textContent = "XP Progress Over Time";
    xpGraphContainer.appendChild(xpTitle);

    const xpChartData = processXPData(xpUserData.transactions);
    const xpChart = createBarChart(xpChartData, "XP Progress", 400, 300, formatXP);
    xpGraphContainer.appendChild(xpChart);

    // Audit Distribution Graph (Pie Chart)
    const auditGraphContainer = document.createElement("div");
    auditGraphContainer.className = "graph-container";

    const auditTitle = document.createElement("h3");
    auditTitle.textContent = "Audit Distribution";
    auditGraphContainer.appendChild(auditTitle);

    const auditChartData = processAuditData(auditUserData.audits);
    const auditChart = createPieChart(auditChartData, "Audit Types", 250, 250);
    auditGraphContainer.appendChild(auditChart);
    
    // Add a third graph - XP by Project Type
    const projectXpContainer = document.createElement("div");
    projectXpContainer.className = "graph-container";
    
    const projectXpTitle = document.createElement("h3");
    projectXpTitle.textContent = "XP by Project Category";
    projectXpContainer.appendChild(projectXpTitle);
    
    const projectXpData = processProjectXPData(xpUserData.transactions);
    const projectXpChart = createPieChart(projectXpData, "Project Categories", 250, 250);
    projectXpContainer.appendChild(projectXpChart);

    graphsContainer.appendChild(xpGraphContainer);
    graphsContainer.appendChild(auditGraphContainer);
    graphsContainer.appendChild(projectXpContainer);
    statsContainer.appendChild(graphsContainer);

    return statsContainer;
  } catch (error) {
    console.error('Stats rendering error:', error);
    
    // Create an error message element
    const errorContainer = document.createElement('div');
    errorContainer.className = 'profile-section error-section';
    errorContainer.innerHTML = `
        <h2><i class="fas fa-exclamation-circle"></i> Error Loading Statistics</h2>
        <p>${error.message || 'An unexpected error occurred while loading your statistics data.'}</p>
        <button onclick="window.location.reload()">Retry</button>
    `;
    
    return errorContainer;
  }
}

// Process XP data for visualization
function processXPData(transactions) {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return [{ label: 'No Data', value: 0 }];
  }
  
  // Group XP by month
  const xpByMonth = {};
  
  transactions.forEach(t => {
    if (!t.createdAt) return;
    
    try {
      const date = new Date(t.createdAt);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!xpByMonth[monthYear]) {
        xpByMonth[monthYear] = 0;
      }
      
      xpByMonth[monthYear] += Number(t.amount) || 0;
    } catch (e) {
      console.error('Error processing transaction date:', e);
    }
  });
  
  // Convert to array format for chart
  const result = Object.entries(xpByMonth).map(([label, value]) => ({
    label,
    value,
    displayValue: formatXP(value) // Add formatted value for display
  }));
  
  return result.length > 0 ? result : [{ label: 'No Data', value: 0, displayValue: '0 B' }];
}

// Process audit data for visualization
function processAuditData(audits) {
  if (!audits || !Array.isArray(audits)) {
    return [
      { label: 'Received', value: 0 },
      { label: 'Given', value: 0 }
    ];
  }

  const upAudits = audits.filter((a) => a && a.type === "up").length;
  const downAudits = audits.filter((a) => a && a.type === "down").length;

  return [
    { label: 'Received', value: upAudits },
    { label: 'Given', value: downAudits }
  ];
}

// Process XP data by project category
function processProjectXPData(transactions) {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return [{ label: 'No Data', value: 0 }];
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
  
  // Convert to array format for chart
  const result = Object.entries(xpByCategory)
    .filter(([_, value]) => value > 0)
    .map(([label, value]) => ({
      label,
      value,
      displayValue: formatXP(value),
      percentage: totalXP > 0 ? Math.round((value / totalXP) * 100) : 0
    }))
    .sort((a, b) => b.value - a.value); // Sort by value in descending order
    
  return result.length > 0 ? result : [{ label: 'No Data', value: 0, displayValue: '0 B' }];
}

export { renderStats };
