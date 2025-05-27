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
      .includes(
        chartId === "xpProgress" ? "XP PROGRESS" : "PROJECT RESULTS"
      )
  );

  if (activeButton) {
    activeButton.classList.remove("bg-slate-700", "border-slate-700");
    activeButton.classList.add("bg-blue-600", "border-blue-600");
  }
}

// Generate XP chart (SVG bar chart)
function generateXPChart(transactions) {
  const svg = document.getElementById("xpSvg");
  svg.innerHTML = "";

  if (!transactions || transactions.length === 0) {
    svg.innerHTML =
      '<text x="50%" y="50%" text-anchor="middle" class="text-slate-500">No XP data available</text>';
    return;
  }

  const width = svg.clientWidth;
  const height = svg.clientHeight;
  const padding = { top: 40, right: 30, bottom: 60, left: 60 };

  // Sort transactions by date
  const sortedData = [...transactions].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Group by month
  const monthlyData = sortedData.reduce((acc, t) => {
    const date = new Date(t.createdAt);
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!acc[monthYear]) {
      acc[monthYear] = {
        monthYear,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        amount: 0,
      };
    }

    acc[monthYear].amount += t.amount || 0;
    return acc;
  }, {});

  const dataPoints = Object.values(monthlyData);

  // Calculate scales
  const maxXP = Math.max(...dataPoints.map((d) => d.amount));
  const barWidth =
    (width - padding.left - padding.right) / dataPoints.length - 10;

  // Draw axes
  const xAxis = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  xAxis.setAttribute("x1", padding.left);
  xAxis.setAttribute("y1", height - padding.bottom);
  xAxis.setAttribute("x2", width - padding.right);
  xAxis.setAttribute("y2", height - padding.bottom);
  xAxis.setAttribute("stroke", "#64748b");
  xAxis.setAttribute("stroke-width", "2");
  svg.appendChild(xAxis);

  const yAxis = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  yAxis.setAttribute("x1", padding.left);
  yAxis.setAttribute("y1", padding.top);
  yAxis.setAttribute("x2", padding.left);
  yAxis.setAttribute("y2", height - padding.bottom);
  yAxis.setAttribute("stroke", "#64748b");
  yAxis.setAttribute("stroke-width", "2");
  svg.appendChild(yAxis);

  // Draw grid lines
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const yPos =
      height -
      padding.bottom -
      (i / gridLines) * (height - padding.top - padding.bottom);
    const gridLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    gridLine.setAttribute("x1", padding.left);
    gridLine.setAttribute("y1", yPos);
    gridLine.setAttribute("x2", width - padding.right);
    gridLine.setAttribute("y2", yPos);
    gridLine.setAttribute("stroke", "#e2e8f0");
    gridLine.setAttribute("stroke-width", "1");
    svg.appendChild(gridLine);
  }

  // Draw bars and labels
  dataPoints.forEach((point, i) => {
    const x =
      padding.left +
      i * ((width - padding.left - padding.right) / dataPoints.length) +
      5;
    const barHeight =
      (point.amount / maxXP) * (height - padding.top - padding.bottom);
    const y = height - padding.bottom - barHeight;

    // Bar
    const bar = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
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
      tooltipText.setAttribute(
        "font-family",
        "JetBrains Mono, monospace"
      );
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
    label.setAttribute("y", height - padding.bottom + 20);
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
      padding.bottom -
      (i / gridLines) * (height - padding.top - padding.bottom);
    const yLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    yLabel.setAttribute("x", padding.left - 10);
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
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-family="JetBrains Mono, monospace">No project data available</text>';
    return;
  }

  // Count pass/fail results
  const passCount = data.filter((item) => item.grade > 0).length;
  const failCount = data.filter((item) => item.grade === 0).length;
  const total = passCount + failCount;

  if (total === 0) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-family="JetBrains Mono, monospace">No project results available</text>';
    return;
  }

  // Calculate percentages
  const passPercentage = Math.round((passCount / total) * 100);
  const failPercentage = Math.round((failCount / total) * 100);

  // SVG dimensions
  const width = svg.clientWidth;
  const height = svg.clientHeight;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;

  // Create a group for the entire chart
  const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  chartGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`);

  // Create the pie chart
  const pie = document.createElementNS("http://www.w3.org/2000/svg", "g");
  
  // Calculate angles
  const passAngle = (passCount / total) * 2 * Math.PI;
  const startAngle = -Math.PI / 2; // Start at the top
  
  // Create the passed slice (green)
  if (passCount > 0) {
    const passPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const passEndAngle = startAngle + passAngle;
    
    const x1 = radius * Math.cos(startAngle);
    const y1 = radius * Math.sin(startAngle);
    const x2 = radius * Math.cos(passEndAngle);
    const y2 = radius * Math.sin(passEndAngle);
    
    const largeArcFlag = passAngle > Math.PI ? 1 : 0;
    
    const passPathData = [
      `M 0 0`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(" ");
    
    passPath.setAttribute("d", passPathData);
    passPath.setAttribute("fill", "#10b981");
    passPath.setAttribute("stroke", "white");
    passPath.setAttribute("stroke-width", "2");
    pie.appendChild(passPath);
  }
  
  // Create the failed slice (red)
  if (failCount > 0) {
    const failPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const failStartAngle = startAngle + passAngle;
    const failEndAngle = startAngle + 2 * Math.PI;
    
    const x1 = radius * Math.cos(failStartAngle);
    const y1 = radius * Math.sin(failStartAngle);
    const x2 = radius * Math.cos(failEndAngle);
    const y2 = radius * Math.sin(failEndAngle);
    
    const largeArcFlag = (2 * Math.PI - passAngle) > Math.PI ? 1 : 0;
    
    const failPathData = [
      `M 0 0`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(" ");
    
    failPath.setAttribute("d", failPathData);
    failPath.setAttribute("fill", "#ef4444");
    failPath.setAttribute("stroke", "white");
    failPath.setAttribute("stroke-width", "2");
    pie.appendChild(failPath);
  }
  
  chartGroup.appendChild(pie);
  svg.appendChild(chartGroup);
  
  // Add legend
  const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  legendGroup.setAttribute("transform", `translate(${width - 120}, 30)`);
  
  // Pass legend item
  const passRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  passRect.setAttribute("x", "0");
  passRect.setAttribute("y", "0");
  passRect.setAttribute("width", "15");
  passRect.setAttribute("height", "15");
  passRect.setAttribute("fill", "#10b981");
  legendGroup.appendChild(passRect);
  
  const passText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  passText.setAttribute("x", "25");
  passText.setAttribute("y", "12");
  passText.setAttribute("font-size", "12");
  passText.setAttribute("font-family", "JetBrains Mono, monospace");
  passText.setAttribute("fill", "#64748b");
  passText.textContent = `PASS (${passPercentage}%)`;
  legendGroup.appendChild(passText);
  
  // Fail legend item
  const failRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  failRect.setAttribute("x", "0");
  failRect.setAttribute("y", "25");
  failRect.setAttribute("width", "15");
  failRect.setAttribute("height", "15");
  failRect.setAttribute("fill", "#ef4444");
  legendGroup.appendChild(failRect);
  
  const failText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  failText.setAttribute("x", "25");
  failText.setAttribute("y", "37");
  failText.setAttribute("font-size", "12");
  failText.setAttribute("font-family", "JetBrains Mono, monospace");
  failText.setAttribute("fill", "#64748b");
  failText.textContent = `FAIL (${failPercentage}%)`;
  legendGroup.appendChild(failText);
  
  svg.appendChild(legendGroup);
  
  // Add total count in the center
  const totalText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  totalText.setAttribute("x", centerX);
  totalText.setAttribute("y", centerY);
  totalText.setAttribute("text-anchor", "middle");
  totalText.setAttribute("font-size", "14");
  totalText.setAttribute("font-weight", "bold");
  totalText.setAttribute("font-family", "JetBrains Mono, monospace");
  totalText.setAttribute("fill", "#1e293b");
  totalText.textContent = `${total} Projects`;
  svg.appendChild(totalText);
  
  // Add pass count below
  const passCountText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  passCountText.setAttribute("x", centerX);
  passCountText.setAttribute("y", centerY + 25);
  passCountText.setAttribute("text-anchor", "middle");
  passCountText.setAttribute("font-size", "12");
  passCountText.setAttribute("font-family", "JetBrains Mono, monospace");
  passCountText.setAttribute("fill", "#10b981");
  passCountText.textContent = `${passCount} Passed`;
  svg.appendChild(passCountText);
  
  // Add fail count below
  const failCountText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  failCountText.setAttribute("x", centerX);
  failCountText.setAttribute("y", centerY + 45);
  failCountText.setAttribute("text-anchor", "middle");
  failCountText.setAttribute("font-size", "12");
  failCountText.setAttribute("font-family", "JetBrains Mono, monospace");
  failCountText.setAttribute("fill", "#ef4444");
  failCountText.textContent = `${failCount} Failed`;
  svg.appendChild(failCountText);
}
