// Format data size with decimal scaling (bytes, KB, MB)
function formatDataSize(bytes) {
  if (bytes === 0) return "0 B";
  
  const k = 1000;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Toggle dark mode
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  
  // Update button text
  const darkModeBtn = document.getElementById('darkModeBtn');
  if (darkModeBtn) {
    darkModeBtn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
  }
}

// Check for saved dark mode preference
function checkDarkMode() {
  const darkMode = localStorage.getItem('darkMode');
  if (darkMode === 'true') {
    document.documentElement.classList.add('dark');
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
      darkModeBtn.textContent = '☀️ Light';
    }
  }
}

// Copy to clipboard function
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show a temporary tooltip or notification
    const notification = document.createElement('div');
    notification.textContent = 'Copied to clipboard!';
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
    document.body.appendChild(notification);
    
    // Remove the notification after 2 seconds
    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    
    // Show error notification
    const notification = document.createElement('div');
    notification.textContent = 'Failed to copy to clipboard';
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg';
    document.body.appendChild(notification);
    
    // Remove the notification after 2 seconds
    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 2000);
  });
}

// Show profile page
function showProfile() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("profilePage").classList.remove("hidden");
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
}

// Hide error message
function hideError() {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.classList.add("hidden");
}

// Initialize UI
document.addEventListener("DOMContentLoaded", () => {
  // Initialize dark mode
  checkDarkMode();
  
  // Add event listener for dark mode toggle
  const darkModeBtn = document.getElementById('darkModeBtn');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', toggleDarkMode);
  }
  
  // Initialize chart buttons
  const xpChartBtn = document.getElementById('xpChartBtn');
  const resultsChartBtn = document.getElementById('resultsChartBtn');
  
  if (xpChartBtn) {
    xpChartBtn.addEventListener('click', () => showChart('xpProgress'));
  }
  
  if (resultsChartBtn) {
    resultsChartBtn.addEventListener('click', () => showChart('results'));
  }
});

// Handle window resize for responsive charts
window.addEventListener("resize", () => {
  // Debounce the resize event
  if (window.resizeTimer) {
    clearTimeout(window.resizeTimer);
  }
  
  window.resizeTimer = setTimeout(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      // Reload profile to regenerate charts
      loadProfile();
    }
  }, 250);
});
