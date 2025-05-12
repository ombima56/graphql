// Create SVG element with given dimensions
function createSvgElement(width, height) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    return svg;
}

// Create bar chart SVG
function createBarChart(data, title, width, height) {
    const svg = createSvgElement(width, height);
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Calculate scales
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = chartWidth / data.length - 10;
    
    // Add title
    const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleElement.setAttribute("x", width / 2);
    titleElement.setAttribute("y", 20);
    titleElement.setAttribute("text-anchor", "middle");
    titleElement.textContent = title;
    svg.appendChild(titleElement);
    
    // Create bars
    data.forEach((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = padding + i * (barWidth + 10);
        const y = height - padding - barHeight;
        
        // Bar
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("fill", "#4CAF50");
        
        // Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x + barWidth / 2);
        text.setAttribute("y", height - padding + 15);
        text.setAttribute("text-anchor", "middle");
        text.textContent = d.label;
        text.setAttribute("font-size", "10px");
        
        svg.appendChild(rect);
        svg.appendChild(text);
    });
    
    return svg;
}

// Create pie chart SVG
function createPieChart(data, title, width, height) {
    const svg = createSvgElement(width, height);
    const radius = Math.min(width, height) / 2 - 40;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Add title
    const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleElement.setAttribute("x", centerX);
    titleElement.setAttribute("y", 20);
    titleElement.setAttribute("text-anchor", "middle");
    titleElement.textContent = title;
    svg.appendChild(titleElement);
    
    // Calculate total for percentages
    const total = data.reduce((sum, d) => sum + d.value, 0);
    
    // Colors for pie slices
    const colors = ["#4CAF50", "#2196F3", "#FFC107", "#E91E63", "#9C27B0"];
    
    // Create pie slices
    let startAngle = 0;
    data.forEach((d, i) => {
        const percentage = d.value / total;
        const endAngle = startAngle + percentage * 2 * Math.PI;
        
        // Calculate points
        const startX = centerX + radius * Math.cos(startAngle);
        const startY = centerY + radius * Math.sin(startAngle);
        const endX = centerX + radius * Math.cos(endAngle);
        const endY = centerY + radius * Math.sin(endAngle);
        
        // Create path for arc
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            "Z"
        ].join(" ");
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", colors[i % colors.length]);
        svg.appendChild(path);
        
        // Add label
        const labelAngle = startAngle + (endAngle - startAngle) / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + labelRadius * Math.cos(labelAngle);
        const labelY = centerY + labelRadius * Math.sin(labelAngle);
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", labelX);
        text.setAttribute("y", labelY);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "white");
        text.textContent = `${d.label}: ${Math.round(percentage * 100)}%`;
        svg.appendChild(text);
        
        startAngle = endAngle;
    });
    
    return svg;
}

export { createSvgElement, createBarChart, createPieChart };
