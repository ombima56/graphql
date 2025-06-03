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

async function graphqlQuery(query, variables = {}) {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    window.location.href = "login.html";
    return null;
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("jwt");
        window.location.href = "login.html?error=session_expired";
        return null;
      }
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      // Handle GraphQL specific errors
      const errorMessage = result.errors.map(e => e.message).join(', ');
      console.error("GraphQL errors:", result.errors);
      console.log("Query that caused error:", query);
      showError(`GraphQL Error: ${errorMessage}`);
      return null;
    }
    
    return result.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    console.log("Query that caused error:", query);
    showError(`Failed to fetch data: ${error.message}`);
    return null;
  }
}
