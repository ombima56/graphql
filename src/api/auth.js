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
            if (response.status === 401) {
                throw new Error('Invalid username or password. Please try again.');
            } else if (response.status === 429) {
                throw new Error('Too many login attempts. Please try again later.');
            } else {
                throw new Error(`Server error (${response.status}). Please try again later.`);
            }
        }

        const data = await response.json();
        
        if (!data) {
            throw new Error('Invalid response from server. Please try again.');
        }
        
        // Store JWT token in localStorage
        localStorage.setItem('jwt', data);
        return true;
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
            throw new Error('Network error. Please check your internet connection and try again.');
        }
        
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
