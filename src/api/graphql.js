// Function to send GraphQL queries to the server
async function sendQuery(query, variables = {}) {
    const token = localStorage.getItem('jwt');
    
    try {
        const response = await fetch('https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        // Check if the response is ok
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('jwt');
                window.location.href = '/public/login.html';
                throw new Error('Your session has expired. Please log in again.');
            } else {
                throw new Error(`Server error (${response.status}). Please try again later.`);
            }
        }

        const data = await response.json();
        
        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            throw new Error(data.errors[0].message || 'Error fetching data from server');
        }
        
        return data.data;
    } catch (error) {
        console.error('GraphQL query error:', error);
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
            throw new Error('Network error. Please check your internet connection and try again.');
        }
        
        // Handle CORS errors
        if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
            throw new Error('Cross-origin request failed. This might be a temporary issue with the server.');
        }
        
        // Handle timeout errors
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            throw new Error('Request timed out. The server might be experiencing high load.');
        }
        
        // Re-throw the error to be handled by the caller
        throw error;
    }
}

// Get user profile data
async function getUserProfile() {
    const query = `
    query {
        user {
            id
            login
            firstName
            lastName
            email
            auditRatio
            totalUp
            totalDown
            createdAt
            campus
            attrs
            progresses {
                id
                objectId
                grade
                createdAt
                updatedAt
            }
            transactions {
                id
                type
                amount
                createdAt
                path
            }
        }
    }`;
    
    return sendQuery(query);
}

// Get user XP progression
async function getUserXP() {
    const query = `
    query {
        user {
            transactions(where: {type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
                id
                type
                amount
                createdAt
                path
            }
        }
    }`;
    
    return sendQuery(query);
}

// Get user audit statistics
async function getUserAudits() {
    const query = `
    query {
        user {
            audits: transactions(where: {type: {_in: ["up", "down"]}}) {
                id
                type
                amount
                createdAt
            }
        }
    }`;
    
    return sendQuery(query);
}

export { sendQuery, getUserProfile, getUserXP, getUserAudits };
