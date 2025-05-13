// Function to send GraphQL queries to the server
async function sendQuery(query, variables = {}) {
    const token = localStorage.getItem('jwt');
    
    if (!token) {
        console.error('No JWT token found. Redirecting to login page.');
        window.location.href = '/public/login.html';
        throw new Error('Authentication required. Please log in.');
    }
    
    try {
        console.log('Sending GraphQL query with token:', token.substring(0, 15) + '...');
        
        const response = await fetch('https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
                console.error('Authentication error (401). Token might be expired.');
                localStorage.removeItem('jwt');
                window.location.href = '/public/login.html';
                throw new Error('Your session has expired. Please log in again.');
            } else {
                console.error(`Server error (${response.status})`);
                throw new Error(`Server error (${response.status}). Please try again later.`);
            }
        }

        const data = await response.json();
        console.log('GraphQL response:', data);
        
        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            
            // Get the first error message
            const errorMessage = data.errors[0].message || 'Error fetching data from server';
            
            // If it's a field not found error, we need to modify our query
            if (errorMessage.includes('field') && errorMessage.includes('not found')) {
                console.log('Field not found error. Trying simplified query...');
                return await sendSimplifiedQuery();
            }
            
            throw new Error(errorMessage);
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

// Fallback function with a simplified query
async function sendSimplifiedQuery() {
    const query = `
    query {
        user {
            id
            login
            firstName
            lastName
            email
            totalUp
            totalDown
            createdAt
            campus
            progresses {
                id
                grade
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
    
    const token = localStorage.getItem('jwt');
    
    const response = await fetch('https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
            query
        })
    });
    
    if (!response.ok) {
        throw new Error(`Server error (${response.status}). Please try again later.`);
    }
    
    const data = await response.json();
    
    if (data.errors) {
        throw new Error(data.errors[0].message || 'Error fetching data from server');
    }
    
    return data.data;
}

// Get user profile data with nested queries
async function getUserProfile() {
    const query = `
    query {
        user {
            id
            login
            firstName
            lastName
            email
            totalUp
            totalDown
            createdAt
            campus
            # Nested query for progresses
            progresses {
                id
                grade
                object {
                    id
                    name
                }
            }
            # Nested query for transactions
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

// Get specific project data using arguments
async function getProjectData(projectId) {
    const query = `
    query GetProject($id: Int!) {
        object(where: {id: {_eq: $id}}) {
            id
            name
            type
            attrs
        }
    }`;
    
    return sendQuery(query, { id: projectId });
}

// Get user XP data
async function getUserXP() {
    const query = `
    query {
        user {
            id
            login
            transactions(where: {type: {_eq: "xp"}}) {
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

// Get user audit data
async function getUserAudits() {
    const query = `
    query {
        user {
            id
            login
            # Get audit transactions
            audits: transactions(where: {type: {_in: ["up", "down"]}}) {
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

export { sendQuery, getUserProfile, getUserXP, getUserAudits, getProjectData };
