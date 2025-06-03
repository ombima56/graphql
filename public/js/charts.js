// Chart display toggle
function showChart(chartId) {
  const charts = document.querySelectorAll(".chart-section");
  const buttons = document.querySelectorAll(".chart-btn");

  charts.forEach((chart) => chart.classList.add("hidden"));
  document.getElementById(`${chartId}Chart`).classList.remove("hidden");

  buttons.forEach((btn) => {
    btn.classList.remove("bg-blue-600", "border-blue-600");
    btn.classList.add("bg-slate-700", "border-slate-700");
  });

  const activeButton = Array.from(buttons).find((btn) =>
    btn.textContent
      .trim()
      .includes(chartId === "xpProgress" ? "XP PROGRESS" : "PROJECT RESULTS")
  );

  if (activeButton) {
    activeButton.classList.remove("bg-slate-700", "border-slate-700");
    activeButton.classList.add("bg-blue-600", "border-blue-600");
  }
}

// Generate XP chart (SVG bar chart)
function generateXPChart(transactions) {
  const svg = document.getElementById("xpSvg");
  svg.innerHTML = ''; // Clear previous content
  
  // Set dimensions and margins
  const width = svg.clientWidth;
  const height = svg.clientHeight;
  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Create chart group with transform
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${margin.left},${margin.top})`);
  svg.appendChild(g);
  
  // Add tooltip element
  const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tooltip.setAttribute("class", "tooltip");
  tooltip.setAttribute("visibility", "hidden");
  svg.appendChild(tooltip);
  
  if (!transactions || transactions.length === 0) {
    svg.innerHTML =
      '<text x="50%" y="50%" text-anchor="middle" class="text-slate-500 dark:text-slate-400">No XP data available</text>';
    return;
  }

  // Sort transactions by date
  const sortedData = [...transactions].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Calculate cumulative XP
  let cumulativeXP = 0;
  const xpOverTime = sortedData.map((t) => {
    cumulativeXP += t.amount || 0;
    return {
      date: new Date(t.createdAt),
      xp: cumulativeXP,
      type: t.type,
    };
  });

  // Group by month
  const monthlyData = xpOverTime.reduce((acc, t) => {
    const date = t.date;
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!acc[monthYear]) {
      acc[monthYear] = {
        monthYear,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        amount: t.xp,
        date: date,
        type: t.type,
      };
    } else {
      acc[monthYear].amount = t.xp; // Keep the latest cumulative XP for the month
    }

    return acc;
  }, {});

  const dataPoints = Object.values(monthlyData);

  // Calculate scales
  const maxXP = Math.max(...dataPoints.map((d) => d.amount));
  const barWidth =
    (width - margin.left - margin.right) / dataPoints.length - 10;

  // Draw axes
  const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxis.setAttribute("x1", margin.left);
  xAxis.setAttribute("y1", height - margin.bottom);
  xAxis.setAttribute("x2", width - margin.right);
  xAxis.setAttribute("y2", height - margin.bottom);
  xAxis.setAttribute("stroke", "#64748b");
  xAxis.setAttribute("stroke-width", "2");
  svg.appendChild(xAxis);

  const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxis.setAttribute("x1", margin.left);
  yAxis.setAttribute("y1", margin.top);
  yAxis.setAttribute("x2", margin.left);
  yAxis.setAttribute("y2", height - margin.bottom);
  yAxis.setAttribute("stroke", "#64748b");
  yAxis.setAttribute("stroke-width", "2");
  svg.appendChild(yAxis);

  // Draw grid lines
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const yPos =
      height -
      margin.bottom -
      (i / gridLines) * (height - margin.top - margin.bottom);
    const gridLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    gridLine.setAttribute("x1", margin.left);
    gridLine.setAttribute("y1", yPos);
    gridLine.setAttribute("x2", width - margin.right);
    gridLine.setAttribute("y2", yPos);
    gridLine.setAttribute("stroke", "#e2e8f0");
    gridLine.setAttribute("stroke-width", "1");
    svg.appendChild(gridLine);
  }

  // Draw bars and labels
  dataPoints.forEach((point, i) => {
    const x =
      margin.left +
      i * ((width - margin.left - margin.right) / dataPoints.length) +
      5;
    const barHeight =
      (point.amount / maxXP) * (height - margin.top - margin.bottom);
    const y = height - margin.bottom - barHeight;

    // Bar
    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bar.setAttribute("x", x);
    bar.setAttribute("y", y);
    bar.setAttribute("width", barWidth);
    bar.setAttribute("height", barHeight);
    bar.setAttribute("fill", "#3b82f6");
    bar.setAttribute("rx", "4");
    bar.setAttribute("class", "chart-bar");

    // Tooltip on hover
    bar.setAttribute("data-amount", point.amount.toLocaleString());
    bar.setAttribute("data-month", point.label);

    bar.addEventListener("mouseover", function () {
      const tooltip = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      tooltip.setAttribute("id", "tooltip");

      const tooltipRect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      tooltipRect.setAttribute("x", x - 40);
      tooltipRect.setAttribute("y", y - 40);
      tooltipRect.setAttribute("width", "100");
      tooltipRect.setAttribute("height", "30");
      tooltipRect.setAttribute("fill", "#334155");
      tooltipRect.setAttribute("rx", "4");

      const tooltipText = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      tooltipText.setAttribute("x", x + 10);
      tooltipText.setAttribute("y", y - 20);
      tooltipText.setAttribute("text-anchor", "middle");
      tooltipText.setAttribute("fill", "white");
      tooltipText.setAttribute("font-size", "12");
      tooltipText.setAttribute("font-family", "JetBrains Mono, monospace");
      tooltipText.textContent = `${point.amount.toLocaleString()} XP`;

      tooltip.appendChild(tooltipRect);
      tooltip.appendChild(tooltipText);
      svg.appendChild(tooltip);
    });

    bar.addEventListener("mouseout", function () {
      const tooltip = document.getElementById("tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    });

    svg.appendChild(bar);

    // X-axis label
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", x + barWidth / 2);
    label.setAttribute("y", height - margin.bottom + 20);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "10");
    label.setAttribute("font-family", "JetBrains Mono, monospace");
    label.setAttribute("fill", "#64748b");
    label.textContent = point.label;
    svg.appendChild(label);
  });

  // Y-axis labels
  for (let i = 0; i <= gridLines; i++) {
    const yPos =
      height -
      margin.bottom -
      (i / gridLines) * (height - margin.top - margin.bottom);
    const yLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    yLabel.setAttribute("x", margin.left - 10);
    yLabel.setAttribute("y", yPos + 5);
    yLabel.setAttribute("text-anchor", "end");
    yLabel.setAttribute("font-size", "10");
    yLabel.setAttribute("font-family", "JetBrains Mono, monospace");
    yLabel.setAttribute("fill", "#64748b");
    yLabel.textContent = Math.round((i / gridLines) * maxXP).toLocaleString();
    svg.appendChild(yLabel);
  }
}

// Generate results chart (SVG pie chart)
function generateResultsChart(data) {
  const svg = document.getElementById("resultsSvg");
  svg.innerHTML = "";

  if (!data || data.length === 0) {
    svg.innerHTML =
      '<text x="50%" y="50%" text-anchor="middle" class="text-slate-500 dark:text-slate-400">No project data available</text>';
    return;
  }

  // Categorize projects
  const projects = {
    passed: data.filter((p) => p.grade > 0),
    failed: data.filter((p) => p.grade < 0),
    inProgress: data.filter((p) => p.grade === 0),
  };

  const totalProjects = data.length;
  const passedCount = projects.passed.length;
  const failedCount = projects.failed.length;
  const inProgressCount = projects.inProgress.length;

  if (totalProjects === 0) {
    svg.innerHTML =
      '<text x="50%" y="50%" text-anchor="middle" class="text-slate-500 dark:text-slate-400">No project results available</text>';
    return;
  }

  // SVG dimensions
  const width = svg.clientWidth;
  const height = svg.clientHeight;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;

  // Create a group for the entire chart
  const chartGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  chartGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`);

  // Calculate angles for each segment
  const passedAngle = (passedCount / totalProjects) * 2 * Math.PI;
  const failedAngle = (failedCount / totalProjects) * 2 * Math.PI;
  const inProgressAngle = (inProgressCount / totalProjects) * 2 * Math.PI;

  let currentAngle = -Math.PI / 2; // Start at the top

  // Draw passed segment (green)
  if (passedCount > 0) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const endAngle = currentAngle + passedAngle;

    const x1 = radius * Math.cos(currentAngle);
    const y1 = radius * Math.sin(currentAngle);
    const x2 = radius * Math.cos(endAngle);
    const y2 = radius * Math.sin(endAngle);

    const largeArcFlag = passedAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M 0 0`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`,
    ].join(" ");

    path.setAttribute("d", pathData);
    path.setAttribute("fill", "#10b981");
    path.setAttribute("stroke", "white");
    path.setAttribute("stroke-width", "2");
    chartGroup.appendChild(path);

    currentAngle += passedAngle;
  }

  // Draw failed segment (red)
  if (failedCount > 0) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const endAngle = currentAngle + failedAngle;

    const x1 = radius * Math.cos(currentAngle);
    const y1 = radius * Math.sin(currentAngle);
    const x2 = radius * Math.cos(endAngle);
    const y2 = radius * Math.sin(endAngle);

    const largeArcFlag = failedAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M 0 0`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`,
    ].join(" ");

    path.setAttribute("d", pathData);
    path.setAttribute("fill", "#ef4444");
    path.setAttribute("stroke", "white");
    path.setAttribute("stroke-width", "2");
    chartGroup.appendChild(path);

    currentAngle += failedAngle;
  }

  // Draw in progress segment (yellow)
  if (inProgressCount > 0) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const endAngle = currentAngle + inProgressAngle;

    const x1 = radius * Math.cos(currentAngle);
    const y1 = radius * Math.sin(currentAngle);
    const x2 = radius * Math.cos(endAngle);
    const y2 = radius * Math.sin(endAngle);

    const largeArcFlag = inProgressAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M 0 0`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`,
    ].join(" ");

    path.setAttribute("d", pathData);
    path.setAttribute("fill", "#f59e0b");
    path.setAttribute("stroke", "white");
    path.setAttribute("stroke-width", "2");
    chartGroup.appendChild(path);
  }

  svg.appendChild(chartGroup);

  // Add legend
  const legendGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  legendGroup.setAttribute("transform", `translate(${width - 120}, 30)`);

  // Passed legend item
  const passRect = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  passRect.setAttribute("x", "0");
  passRect.setAttribute("y", "0");
  passRect.setAttribute("width", "15");
  passRect.setAttribute("height", "15");
  passRect.setAttribute("fill", "#10b981");
  legendGroup.appendChild(passRect);

  const passText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  passText.setAttribute("x", "25");
  passText.setAttribute("y", "12");
  passText.setAttribute("font-size", "12");
  passText.setAttribute("font-family", "JetBrains Mono, monospace");
  passText.setAttribute("fill", "#64748b");
  passText.textContent = `PASS (${Math.round(
    (passedCount / totalProjects) * 100
  )}%)`;
  legendGroup.appendChild(passText);

  // Failed legend item
  const failRect = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  failRect.setAttribute("x", "0");
  failRect.setAttribute("y", "25");
  failRect.setAttribute("width", "15");
  failRect.setAttribute("height", "15");
  failRect.setAttribute("fill", "#ef4444");
  legendGroup.appendChild(failRect);

  const failText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  failText.setAttribute("x", "25");
  failText.setAttribute("y", "37");
  failText.setAttribute("font-size", "12");
  failText.setAttribute("font-family", "JetBrains Mono, monospace");
  failText.setAttribute("fill", "#64748b");
  failText.textContent = `FAIL (${Math.round(
    (failedCount / totalProjects) * 100
  )}%)`;
  legendGroup.appendChild(failText);

  // In Progress legend item
  const progressRect = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  progressRect.setAttribute("x", "0");
  progressRect.setAttribute("y", "50");
  progressRect.setAttribute("width", "15");
  progressRect.setAttribute("height", "15");
  progressRect.setAttribute("fill", "#f59e0b");
  legendGroup.appendChild(progressRect);

  const progressText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  progressText.setAttribute("x", "25");
  progressText.setAttribute("y", "62");
  progressText.setAttribute("font-size", "12");
  progressText.setAttribute("font-family", "JetBrains Mono, monospace");
  progressText.setAttribute("fill", "#64748b");
  progressText.textContent = `IN PROGRESS (${Math.round(
    (inProgressCount / totalProjects) * 100
  )}%)`;
  legendGroup.appendChild(progressText);

  svg.appendChild(legendGroup);

  // Add total count in the center
  const totalText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  totalText.setAttribute("x", centerX);
  totalText.setAttribute("y", centerY);
  totalText.setAttribute("text-anchor", "middle");
  totalText.setAttribute("font-size", "14");
  totalText.setAttribute("font-weight", "bold");
  totalText.setAttribute("font-family", "JetBrains Mono, monospace");
  totalText.setAttribute("fill", "#1e293b");
  totalText.textContent = `${totalProjects} Projects`;
  svg.appendChild(totalText);

  // Add counts below
  const passCountText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  passCountText.setAttribute("x", centerX);
  passCountText.setAttribute("y", centerY + 25);
  passCountText.setAttribute("text-anchor", "middle");
  passCountText.setAttribute("font-size", "12");
  passCountText.setAttribute("font-family", "JetBrains Mono, monospace");
  passCountText.setAttribute("fill", "#10b981");
  passCountText.textContent = `${passedCount} Passed`;
  svg.appendChild(passCountText);

  const failCountText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  failCountText.setAttribute("x", centerX);
  failCountText.setAttribute("y", centerY + 45);
  failCountText.setAttribute("text-anchor", "middle");
  failCountText.setAttribute("font-size", "12");
  failCountText.setAttribute("font-family", "JetBrains Mono, monospace");
  failCountText.setAttribute("fill", "#ef4444");
  failCountText.textContent = `${failedCount} Failed`;
  svg.appendChild(failCountText);

  const progressCountText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  progressCountText.setAttribute("x", centerX);
  progressCountText.setAttribute("y", centerY + 65);
  progressCountText.setAttribute("text-anchor", "middle");
  progressCountText.setAttribute("font-size", "12");
  progressCountText.setAttribute("font-family", "JetBrains Mono, monospace");
  progressCountText.setAttribute("fill", "#f59e0b");
  progressCountText.textContent = `${inProgressCount} In Progress`;
  svg.appendChild(progressCountText);
}
