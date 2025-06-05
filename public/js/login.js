// API Configuration
const API_BASE = 'https://learn.zone01kisumu.ke/api';
const AUTH_ENDPOINT = `${API_BASE}/auth/signin`;
const GRAPHQL_ENDPOINT = `${API_BASE}/graphql-engine/v1/graphql`;

// Check if user is already logged in
document.addEventListener("DOMContentLoaded", () => {
  // Initialize dark mode
  checkDarkMode();
  
  // Add event listener for dark mode toggle
  const darkModeBtn = document.getElementById('darkModeBtn');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', toggleDarkMode);
    // Update button text based on current mode
    darkModeBtn.textContent = document.documentElement.classList.contains('dark') 
      ? '☀️ Light Mode' 
      : '🌙 Dark Mode';
  }
  
  // Check if user is already logged in
  const jwt = localStorage.getItem("jwt");
  if (jwt) {
    // Verify token is still valid with a simple GraphQL query
    verifyToken(jwt).then(valid => {
      if (valid) {
        window.location.href = "index.html";
      }
    });
  }
  
  // Add event listener for login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});

// Verify if token is still valid
async function verifyToken(token) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query {
            user {
              id
            }
          }
        `
      })
    });
    
    const data = await response.json();
    return !data.errors && data.data && data.data.user;
  } catch (error) {
    console.error("Error verifying token:", error);
    return false;
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();
  
  // Hide any previous error messages
  hideError();
  
  // Get form values
  const identifier = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  
  // Determine if identifier is email or username
  const isEmail = identifier.includes('@');
  const authType = isEmail ? 'email' : 'username';
  
  // Create Basic auth credentials
  const credentials = btoa(`${identifier}:${password}`);
  
  try {
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = "LOGGING IN...";
    submitButton.disabled = true;
    
    // Make signin request
    const response = await fetch(AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`
      }
    });
    
    // Reset button state
    submitButton.textContent = originalButtonText;
    submitButton.disabled = false;
    
    if (response.ok) {
      const data = await response.json();
      
      // Store JWT in localStorage
      localStorage.setItem("jwt", data);
      
      // Redirect to profile page
      window.location.href = "index.html";
    } else {
      // Show error message
      const errorDiv = document.getElementById("errorMessage");
      errorDiv.classList.remove("hidden");
      
      if (response.status === 401) {
        errorDiv.querySelector("p:last-child").textContent = "Invalid username or password. Please try again.";
      } else {
        errorDiv.querySelector("p:last-child").textContent = `Login failed: ${response.statusText}`;
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    
    // Show error message
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.classList.remove("hidden");
    errorDiv.querySelector("p:last-child").textContent = "Network error. Please check your connection and try again.";
    
    // Reset button state
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.textContent = "LOG IN";
    submitButton.disabled = false;
  }
}

// Hide error message
function hideError() {
  const errorDiv = document.getElementById("errorMessage");
  if (errorDiv) {
    errorDiv.classList.add("hidden");
  }
}
