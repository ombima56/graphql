// Create SVG element with given dimensions
function createSvgElement(width, height) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    return svg;
}

// Create bar chart SVG
function createBarChart(data, title, width, height, formatFunction) {
    // Handle empty data case
    if (!data || data.length === 0) {
        data = [{ label: 'No Data', value: 0, displayValue: '0 B' }];
    }
    
    const svg = createSvgElement(width, height);
    const padding = { top: 40, right: 20, bottom: 50, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Calculate scales
    const maxValue = Math.max(...data.map(d => d.value || 0));
    const barWidth = Math.min(chartWidth / data.length - 10, 40); // Limit max width
    
    // Add title
    const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleElement.setAttribute("x", width / 2);
    titleElement.setAttribute("y", 20);
    titleElement.setAttribute("text-anchor", "middle");
    titleElement.setAttribute("font-weight", "bold");
    titleElement.textContent = title;
    svg.appendChild(titleElement);
    
    // Create a text element for displaying XP on click
    const valueDisplay = document.createElementNS("http://www.w3.org/2000/svg", "text");
    valueDisplay.setAttribute("x", width / 2);
    valueDisplay.setAttribute("y", height - 10);
    valueDisplay.setAttribute("text-anchor", "middle");
    valueDisplay.setAttribute("font-size", "12px");
    valueDisplay.setAttribute("font-weight", "bold");
    valueDisplay.setAttribute("fill", "#333");
    valueDisplay.setAttribute("id", "value-display");
    valueDisplay.textContent = "Click on a bar to see XP details";
    valueDisplay.style.opacity = 0.7;
    svg.appendChild(valueDisplay);

    // Add a background rectangle for the value display
    const valueDisplayBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    valueDisplayBg.setAttribute("x", width / 2 - 150);
    valueDisplayBg.setAttribute("y", height - 25);
    valueDisplayBg.setAttribute("width", 300);
    valueDisplayBg.setAttribute("height", 20);
    valueDisplayBg.setAttribute("rx", 4);
    valueDisplayBg.setAttribute("ry", 4);
    valueDisplayBg.setAttribute("fill", "rgba(255, 255, 255, 0.8)");
    valueDisplayBg.setAttribute("stroke", "#ddd");
    valueDisplayBg.setAttribute("stroke-width", "1");
    valueDisplayBg.setAttribute("id", "value-display-bg");
    valueDisplayBg.style.opacity = 0.7;
    svg.insertBefore(valueDisplayBg, valueDisplay);
    
    // Add background grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight * i / gridLines);
        
        // Grid line
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gridLine.setAttribute("x1", padding.left);
        gridLine.setAttribute("y1", y);
        gridLine.setAttribute("x2", width - padding.right);
        gridLine.setAttribute("y2", y);
        gridLine.setAttribute("stroke", "#e0e0e0");
        gridLine.setAttribute("stroke-width", "1");
        svg.appendChild(gridLine);
        
        // Y-axis label
        const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yLabel.setAttribute("x", padding.left - 10);
        yLabel.setAttribute("y", y);
        yLabel.setAttribute("text-anchor", "end");
        yLabel.setAttribute("alignment-baseline", "middle");
        yLabel.setAttribute("font-size", "10px");
        yLabel.setAttribute("fill", "#666");
        
        // Format the label value
        const labelValue = maxValue * (gridLines - i) / gridLines;
        yLabel.textContent = formatFunction ? formatFunction(labelValue) : Math.round(labelValue);
        
        svg.appendChild(yLabel);
    }
    
    // Create bars with animation and gradient
    data.forEach((d, i) => {
        // Ensure value is a number
        const value = Number(d.value) || 0;
        const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
        const x = padding.left + i * (chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
        const y = height - padding.bottom - barHeight;
        
        // Create gradient for bar
        const gradientId = `barGradient-${i}`;
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        gradient.setAttribute("id", gradientId);
        gradient.setAttribute("x1", "0%");
        gradient.setAttribute("y1", "0%");
        gradient.setAttribute("x2", "0%");
        gradient.setAttribute("y2", "100%");
        
        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", "#4CAF50");
        
        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", "#2E7D32");
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        svg.appendChild(gradient);
        
        // Bar background (for animation)
        const barBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        barBg.setAttribute("x", x);
        barBg.setAttribute("y", height - padding.bottom - chartHeight);
        barBg.setAttribute("width", barWidth);
        barBg.setAttribute("height", chartHeight);
        barBg.setAttribute("fill", "#f5f5f5");
        barBg.setAttribute("rx", "4");
        barBg.setAttribute("ry", "4");
        svg.appendChild(barBg);
        
        // Bar with rounded corners
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("fill", `url(#${gradientId})`);
        rect.setAttribute("rx", "4");
        rect.setAttribute("ry", "4");
        rect.setAttribute("stroke", "#fff");
        rect.setAttribute("stroke-width", "1");
        rect.setAttribute("cursor", "pointer");
        
        // Add animation
        const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animate.setAttribute("attributeName", "height");
        animate.setAttribute("from", "0");
        animate.setAttribute("to", barHeight);
        animate.setAttribute("dur", "0.8s");
        animate.setAttribute("fill", "freeze");
        animate.setAttribute("calcMode", "spline");
        animate.setAttribute("keySplines", "0.215, 0.61, 0.355, 1");
        rect.appendChild(animate);
        
        const animateY = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animateY.setAttribute("attributeName", "y");
        animateY.setAttribute("from", height - padding.bottom);
        animateY.setAttribute("to", y);
        animateY.setAttribute("dur", "0.8s");
        animateY.setAttribute("fill", "freeze");
        animateY.setAttribute("calcMode", "spline");
        animateY.setAttribute("keySplines", "0.215, 0.61, 0.355, 1");
        rect.appendChild(animateY);
        
        // Add hover effect
        rect.setAttribute("onmouseover", `this.style.opacity = 0.8`);
        rect.setAttribute("onmouseout", `this.style.opacity = 1`);
        
        // Add click event to show XP value
        rect.setAttribute("onclick", `
            // Reset all bars to normal state
            const bars = this.parentNode.querySelectorAll('rect[data-is-bar="true"]');
            bars.forEach(bar => {
                bar.setAttribute('stroke', '#fff');
                bar.setAttribute('stroke-width', '1');
            });
            
            // Highlight this bar
            this.setAttribute('stroke', '#FF5722');
            this.setAttribute('stroke-width', '2');
            
            // Update the value display
            const valueDisplay = this.parentNode.querySelector('#value-display');
            const displayText = '${d.projectName ? d.label + ": " + d.displayValue + " - " + d.projectName : d.label + ": " + d.displayValue}';
            valueDisplay.textContent = displayText;
            
            // Adjust background rectangle width based on text length
            const valueDisplayBg = this.parentNode.querySelector('#value-display-bg');
            const textWidth = Math.min(Math.max(displayText.length * 7, 150), 350); // Estimate text width
            valueDisplayBg.setAttribute('x', ${width / 2} - textWidth / 2);
            valueDisplayBg.setAttribute('width', textWidth);
            
            // Make the display visible with full opacity
            valueDisplay.style.opacity = 1;
            valueDisplayBg.style.opacity = 1;
            
            // Clear any existing timeout
            if (window.valueDisplayTimeout) {
                clearTimeout(window.valueDisplayTimeout);
            }
            
            // Set timeout to hide the display after 2 seconds
            window.valueDisplayTimeout = setTimeout(() => {
                // Fade out the display
                valueDisplay.style.opacity = 0;
                valueDisplayBg.style.opacity = 0;
                
                // Reset bar highlight
                this.setAttribute('stroke', '#fff');
                this.setAttribute('stroke-width', '1');
                
                // Reset the text after fade out animation completes
                setTimeout(() => {
                    valueDisplay.textContent = "Click on a bar to see XP details";
                    valueDisplayBg.setAttribute('x', ${width / 2} - 150);
                    valueDisplayBg.setAttribute('width', 300);
                    valueDisplay.style.opacity = 0.7;
                    valueDisplayBg.style.opacity = 0.7;
                }, 300);
            }, 2000);
        `);
        
        // Mark this as a bar for selection
        rect.setAttribute("data-is-bar", "true");
        
        svg.appendChild(rect);
        
        // Month label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x + barWidth / 2);
        text.setAttribute("y", height - padding.bottom + 15);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "10px");
        text.setAttribute("fill", "#666");
        text.textContent = d.label || '';
        
        // Rotate label if there are many bars
        if (data.length > 6) {
            text.setAttribute("transform", `rotate(45, ${x + barWidth / 2}, ${height - padding.bottom + 15})`);
            text.setAttribute("x", x + barWidth / 2 + 5);
            text.setAttribute("text-anchor", "start");
        }
        
        svg.appendChild(text);
    });
    
    // Add X and Y axis lines
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", padding.left);
    xAxis.setAttribute("y1", height - padding.bottom);
    xAxis.setAttribute("x2", width - padding.right);
    xAxis.setAttribute("y2", height - padding.bottom);
    xAxis.setAttribute("stroke", "#333");
    xAxis.setAttribute("stroke-width", "1");
    svg.appendChild(xAxis);
    
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", padding.left);
    yAxis.setAttribute("y1", padding.top);
    yAxis.setAttribute("x2", padding.left);
    yAxis.setAttribute("y2", height - padding.bottom);
    yAxis.setAttribute("stroke", "#333");
    yAxis.setAttribute("stroke-width", "1");
    svg.appendChild(yAxis);
    
    // Add axis titles
    const xAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xAxisTitle.setAttribute("x", width / 2);
    xAxisTitle.setAttribute("y", height - 30);
    xAxisTitle.setAttribute("text-anchor", "middle");
    xAxisTitle.setAttribute("font-size", "12px");
    xAxisTitle.setAttribute("fill", "#333");
    xAxisTitle.textContent = "Time Period";
    svg.appendChild(xAxisTitle);
    
    const yAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisTitle.setAttribute("x", -height / 2);
    yAxisTitle.setAttribute("y", 15);
    yAxisTitle.setAttribute("text-anchor", "middle");
    yAxisTitle.setAttribute("font-size", "12px");
    yAxisTitle.setAttribute("fill", "#333");
    yAxisTitle.setAttribute("transform", "rotate(-90)");
    yAxisTitle.textContent = "XP Earned";
    svg.appendChild(yAxisTitle);
    
    return svg;
}

// Create pie chart SVG
function createPieChart(data, title, width, height) {
    // Handle empty data case
    if (!data || data.length === 0) {
        data = [{ label: 'No Data', value: 1 }];
    }
    
    const svg = createSvgElement(width, height);
    const radius = Math.min(width, height) / 2 - 60; // Reduce radius to make room for labels
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Add title
    const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleElement.setAttribute("x", centerX);
    titleElement.setAttribute("y", 20);
    titleElement.setAttribute("text-anchor", "middle");
    titleElement.setAttribute("font-weight", "bold");
    titleElement.textContent = title;
    svg.appendChild(titleElement);
    
    // Calculate total for percentages
    const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    
    // Define colors for pie slices
    const colors = [
        "#4CAF50", "#2196F3", "#FFC107", "#E91E63", 
        "#9C27B0", "#FF5722", "#607D8B", "#3F51B5",
        "#009688", "#795548", "#CDDC39", "#00BCD4"
    ];
    
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
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", colors[i % colors.length]);
        path.setAttribute("stroke", "#fff");
        path.setAttribute("stroke-width", "1");
        
        // Add hover effect
        path.setAttribute("onmouseover", `this.style.opacity = 0.8`);
        path.setAttribute("onmouseout", `this.style.opacity = 1`);
        
        svg.appendChild(path);
        
        // Add label line and text if slice is big enough
        if (percentage > 0.03) {
            // Calculate position for label
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const labelRadius = radius * 0.7; // Position label inside the slice
            const labelX = centerX + labelRadius * Math.cos(midAngle);
            const labelY = centerY + labelRadius * Math.sin(midAngle);
            
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", labelX);
            label.setAttribute("y", labelY);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("fill", "#fff");
            label.setAttribute("font-size", "12px");
            label.setAttribute("font-weight", "bold");
            label.textContent = `${Math.round(percentage * 100)}%`;
            
            svg.appendChild(label);
        }
        
        startAngle = endAngle;
    });
    
    // Add legend
    const legendY = height - 20;
    const legendX = 20;
    const legendSpacing = 20;
    const legendSize = 10;
    
    // Create legend title
    const legendTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    legendTitle.setAttribute("x", legendX);
    legendTitle.setAttribute("y", legendY - legendSpacing);
    legendTitle.setAttribute("font-size", "12px");
    legendTitle.setAttribute("font-weight", "bold");
    legendTitle.textContent = "Legend:";
    svg.appendChild(legendTitle);
    
    // Create legend items
    data.forEach((d, i) => {
        // Skip if value is too small
        if (d.value / total < 0.05) return;
        
        const itemY = legendY + i * legendSpacing;
        
        // Legend color box
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", legendX);
        rect.setAttribute("y", itemY - legendSize);
        rect.setAttribute("width", legendSize);
        rect.setAttribute("height", legendSize);
        rect.setAttribute("fill", colors[i % colors.length]);
        svg.appendChild(rect);
        
        // Legend text
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", legendX + legendSize + 5);
        text.setAttribute("y", itemY);
        text.setAttribute("font-size", "10px");
        text.textContent = `${d.label}: ${d.displayValue || d.value}`;
        svg.appendChild(text);
    });
    
    return svg;
}

export { createSvgElement, createBarChart, createPieChart };
