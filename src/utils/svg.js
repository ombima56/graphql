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
    // Handle empty data case
    if (!data || data.length === 0) {
        data = [{ label: 'No Data', value: 0, displayValue: '0 B' }];
    }
    
    const svg = createSvgElement(width, height);
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Calculate scales
    const maxValue = Math.max(...data.map(d => d.value || 0));
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
        // Ensure value is a number
        const value = Number(d.value) || 0;
        const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
        const x = padding + i * (barWidth + 10);
        const y = height - padding - barHeight;
        
        // Bar
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("fill", "#4CAF50");
        
        // Value label
        const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueText.setAttribute("x", x + barWidth / 2);
        valueText.setAttribute("y", y - 5);
        valueText.setAttribute("text-anchor", "middle");
        valueText.setAttribute("font-size", "10px");
        valueText.textContent = d.displayValue || value;
        
        // Month label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x + barWidth / 2);
        text.setAttribute("y", height - padding + 15);
        text.setAttribute("text-anchor", "middle");
        text.textContent = d.label || '';
        text.setAttribute("font-size", "10px");
        
        svg.appendChild(rect);
        svg.appendChild(valueText);
        svg.appendChild(text);
    });
    
    return svg;
}

// Create pie chart SVG
function createPieChart(data, title, width, height) {
    // Handle empty data case
    if (!data || data.length === 0) {
        data = [{ label: 'No Data', value: 1 }];
    }
    
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
    const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    
    // If total is 0, show a placeholder
    if (total === 0) {
        const noDataText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        noDataText.setAttribute("x", centerX);
        noDataText.setAttribute("y", centerY);
        noDataText.setAttribute("text-anchor", "middle");
        noDataText.setAttribute("font-size", "16px");
        noDataText.textContent = "No Data Available";
        svg.appendChild(noDataText);
        return svg;
    }
    
    // Colors for pie slices
    const colors = ["#4CAF50", "#2196F3", "#FFC107", "#E91E63", "#9C27B0"];
    
    // Create pie slices
    let startAngle = 0;
    data.forEach((d, i) => {
        // Ensure value is a number
        const value = Number(d.value) || 0;
        const percentage = total > 0 ? value / total : 0;
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
        
        // Create path element
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", colors[i % colors.length]);
        path.setAttribute("stroke", "#fff");
        path.setAttribute("stroke-width", "1");
        
        // Add tooltip on hover
        path.setAttribute("data-value", value);
        path.setAttribute("data-label", d.label || '');
        
        svg.appendChild(path);
        
        // Add label for slice
        const labelAngle = startAngle + (endAngle - startAngle) / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + labelRadius * Math.cos(labelAngle);
        const labelY = centerY + labelRadius * Math.sin(labelAngle);
        
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", labelX);
        label.setAttribute("y", labelY);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("fill", "#fff");
        label.setAttribute("font-size", "12px");
        label.textContent = `${d.label || 'Unknown'}: ${Math.round(percentage * 100)}%`;
        
        svg.appendChild(label);
        
        startAngle = endAngle;
    });
    
    return svg;
}

export { createSvgElement, createBarChart, createPieChart };
