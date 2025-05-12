// Function to send GraphQL queries to the server
async function sendQuery(query, variables = {}) {
    const token = localStorage.getItem('jwt');
    
    try {
        const response = await fetch('https://https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql', {
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

        const data = await response.json();
        
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }
        
        return data.data;
    } catch (error) {
        console.error('GraphQL query error:', error);
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