import { getUserXP, getUserAudits } from "../api/graphql.js";
import {
  createSvgElement,
  createBarChart,
  createPieChart,
} from "../utils/svg.js";
import { showError } from "./ui.js";

// Function to render statistics section with SVG graphs
async function renderStats() {
  try {
    // Fetch data for graphs
    const xpData = await getUserXP();
    const auditData = await getUserAudits();

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

    const xpChartData = processXPData(xpData.user.transactions);
    const xpChart = createBarChart(xpChartData, "XP Progress", 300, 200);
    xpGraphContainer.appendChild(xpChart);

    // Audit Distribution Graph (Pie Chart)
    const auditGraphContainer = document.createElement("div");
    auditGraphContainer.className = "graph-container";

    const auditTitle = document.createElement("h3");
    auditTitle.textContent = "Audit Distribution";
    auditGraphContainer.appendChild(auditTitle);

    const auditChartData = processAuditData(auditData.user.audits);
    const auditChart = createPieChart(auditChartData, "Audit Types", 250, 250);
    auditGraphContainer.appendChild(auditChart);
    
    // Add a third graph - XP by Project Type
    const projectXpContainer = document.createElement("div");
    projectXpContainer.className = "graph-container";
    
    const projectXpTitle = document.createElement("h3");
    projectXpTitle.textContent = "XP by Project Category";
    projectXpContainer.appendChild(projectXpTitle);
    
    const projectXpData = processProjectXPData(xpData.user.transactions);
    const projectXpChart = createPieChart(projectXpData, "Project Categories", 250, 250);
    projectXpContainer.appendChild(projectXpChart);

    graphsContainer.appendChild(xpGraphContainer);
    graphsContainer.appendChild(auditGraphContainer);
    graphsContainer.appendChild(projectXpContainer);
    statsContainer.appendChild(graphsContainer);

    return statsContainer;
  } catch (error) {
    showError(error.message);
    return null;
  }
}

// Process XP data for visualization
function processXPData(transactions) {
  // Group XP by month
  const xpByMonth = {};
  
  transactions.forEach(t => {
    const date = new Date(t.createdAt);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!xpByMonth[monthYear]) {
      xpByMonth[monthYear] = 0;
    }
    
    xpByMonth[monthYear] += t.amount;
  });
  
  // Convert to array format for chart
  return Object.entries(xpByMonth).map(([label, value]) => ({
    label,
    value
  }));
}

// Process audit data for visualization
function processAuditData(audits) {
  const upAudits = audits.filter((a) => a.type === "up").length;
  const downAudits = audits.filter((a) => a.type === "down").length;

  return [
    { label: "Received", value: upAudits },
    { label: "Given", value: downAudits },
  ];
}

// Process XP data by project category
function processProjectXPData(transactions) {
  // Extract project category from path
  const xpByCategory = {};
  
  transactions.forEach(t => {
    if (t.type === 'xp' && t.path) {
      // Extract category from path (e.g., /div-01/graphql -> div-01)
      const pathParts = t.path.split('/');
      let category = 'Other';
      
      if (pathParts.length >= 2) {
        category = pathParts[1];
      }
      
      if (!xpByCategory[category]) {
        xpByCategory[category] = 0;
      }
      
      xpByCategory[category] += t.amount;
    }
  });
  
  // Convert to array format for chart
  return Object.entries(xpByCategory)
    .filter(([_, value]) => value > 0)
    .map(([label, value]) => ({
      label,
      value
    }));
}

export { renderStats };
