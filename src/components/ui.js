// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        console.error(message);
    }
}

// Show loading indicator
function showLoading(container) {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = '<p>Loading...</p>';
    container.appendChild(loader);
    return loader;
}

// Hide loading indicator
function hideLoading(loader) {
    if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
    }
}

export { showError, showLoading, hideLoading };