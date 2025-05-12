import { login, isAuthenticated } from "./api/auth.js";
import { renderProfile } from "./components/profile.js";
import { renderStats } from "./components/stats.js";
import { showError, showLoading, hideLoading } from "./components/ui.js";

// Main application entry point
document.addEventListener("DOMContentLoaded", () => {
  // Check current page
  const isLoginPage = window.location.pathname.includes("login.html");
  const isAuthenticated = localStorage.getItem("jwt") !== null;

  // Redirect if needed
  if (isLoginPage && isAuthenticated) {
    window.location.href = "/public/index.html";
    return;
  } else if (!isLoginPage && !isAuthenticated) {
    window.location.href = "/public/login.html";
    return;
  }

  // Initialize appropriate page
  if (isLoginPage) {
    initLoginPage();
  } else {
    initProfilePage();
  }
});

// Initialize login page
function initLoginPage() {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const loginButton = loginForm.querySelector("button[type='submit']");
      
      // Show loading state
      loginButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Logging in...';
      loginButton.disabled = true;
      
      try {
        await login(username, password);
        window.location.href = "/public/index.html";
      } catch (error) {
        showError(error.message || "Login failed. Please check your credentials and try again.");
        
        // Reset button state
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        loginButton.disabled = false;
      }
    });
  }
}

// Initialize profile page
async function initProfilePage() {
  const appContainer = document.getElementById("app");

  if (appContainer) {
    // Show initial loading state
    appContainer.innerHTML = `
      <div class="initial-loading">
        <i class="fas fa-circle-notch fa-spin fa-3x"></i>
        <p>Loading your profile...</p>
      </div>
    `;

    try {
      // Clear loading indicator
      appContainer.innerHTML = '';
      
      // Render profile sections
      const profileSection = await renderProfile();
      if (profileSection) {
        appContainer.appendChild(profileSection);
      }

      // Render statistics with graphs
      const statsSection = await renderStats();
      if (statsSection) {
        appContainer.appendChild(statsSection);
      }
    } catch (error) {
      appContainer.innerHTML = '';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-container';
      errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <h2>Error Loading Profile</h2>
        <p>${error.message || 'Failed to load profile data. Please try again later.'}</p>
        <button onclick="window.location.reload()">Retry</button>
      `;
      appContainer.appendChild(errorDiv);
    }
  }
}
