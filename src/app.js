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

      try {
        await login(username, password);
        window.location.href = "/public/index.html";
      } catch (error) {
        showError(error.message);
      }
    });
  }
}

// Initialize profile page
async function initProfilePage() {
  const appContainer = document.getElementById("app");

  if (appContainer) {
    const loader = showLoading(appContainer);

    try {
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
      showError(error.message);
    } finally {
      hideLoading(loader);
    }
  }
}
