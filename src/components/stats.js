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
    title.textContent = "Graphical Statistics";
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

    graphsContainer.appendChild(xpGraphContainer);
    graphsContainer.appendChild(auditGraphContainer);
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

export { renderStats };
