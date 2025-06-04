// API Configuration
const API_BASE = 'https://learn.zone01kisumu.ke/api';
const GRAPHQL_ENDPOINT = `${API_BASE}/graphql-engine/v1/graphql`;

// Check if user is logged in
document.addEventListener("DOMContentLoaded", () => {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    window.location.href = "login.html";
    return;
  }

  loadProfile();
});

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("jwt");
  window.location.href = "login.html";
});

// GraphQL query function
async function graphqlQuery(query, variables = {}) {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    window.location.href = "login.html";
    return null;
  }

  try {
    // Clean the token if needed
    const cleanToken = jwt.replace(/^["'](.*)["']$/, "$1").trim();

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error(`HTTP error ${response.status}: ${response.statusText}`);
      if (response.status === 401) {
        localStorage.removeItem("jwt");
        window.location.href = "login.html";
      }
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      const errorMessage = data.errors[0]?.message || "Unknown GraphQL error";
      console.error("Error message:", errorMessage);

      if (
        errorMessage.includes("JWT") ||
        errorMessage.includes("token") ||
        errorMessage.includes("auth")
      ) {
        localStorage.removeItem("jwt");
        window.location.href = "login.html";
      }

      return null;
    }

    return data.data;
  } catch (error) {
    console.error("GraphQL request failed:", error);
    return null;
  }
}