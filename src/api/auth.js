// Function to handle user login
async function login(usernameOrEmail, password) {
    try {
        // Create Basic auth header
        const credentials = btoa(`${usernameOrEmail}:${password}`);
        
        const response = await fetch('https://learn.zone01kisumu.ke/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid credentials. Please try again.');
        }

        const data = await response.json();
        
        // Store JWT token in localStorage
        localStorage.setItem('jwt', data);
        return true;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Function to check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('jwt') !== null;
}

// Function to handle user logout
function logout() {
    localStorage.removeItem('jwt');
    window.location.href = '/public/login.html';
}

export { login, isAuthenticated, logout };
