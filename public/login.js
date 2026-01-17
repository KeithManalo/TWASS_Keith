// ========================================
// USER LOGIN AND REGISTRATION
// ========================================

// Get current user from localStorage
const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem('currentUser'));
    } catch {
        return null;
    }
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Check if user is logged in and update the page
function checkLoggedInUser() {
    const user = getCurrentUser();
    const loggedIn = document.getElementById('loggedInView');
    const auth = document.getElementById('authView');
    
    if (user) {
        // Show logged in screen
        document.getElementById('usernameDisplay').textContent = user.username;
        loggedIn.style.display = 'block';
        auth.style.display = 'none';
    } else {
        // Show login/register forms
        loggedIn.style.display = 'none';
        auth.style.display = 'block';
    }
}

// Log out the current user
function logout() {
    localStorage.removeItem('currentUser');
    checkLoggedInUser();
    alert('You have been logged out');
}

// Setup when page loads
window.addEventListener('DOMContentLoaded', () => {
    checkLoggedInUser();
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

// ========================================
// REGISTER NEW USER
// ========================================
document.querySelector('.register-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    
    // Get form values
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    // Check all fields are filled
    if (!username || !email || !password || !confirm) return alert('Please fill in all fields');
    if (username.length < 3) return alert('Username must be at least 3 characters long');
    if (!emailRegex.test(email)) return alert('Please enter a valid email address');
    if (password !== confirm) return alert('Passwords do not match');
    if (password.length < 6) return alert('Password must be at least 6 characters long');
    
    try {
        // Send to server
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, confirm })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert('Registration successful! Welcome ' + username + '!');
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            e.target.reset();
            checkLoggedInUser();
            setTimeout(() => window.location.href = 'index.html', 500);
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error registering. Please try again.');
        console.error(error);
    }
});

// ========================================
// LOGIN EXISTING USER
// ========================================
document.querySelector('.login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    
    // Get login credentials
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Check fields are filled
    if (!email || !password) return alert('Please fill in all fields');
    if (!emailRegex.test(email)) return alert('Please enter a valid email address');
    
    try {
        // Send to server
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert(data.message);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            e.target.reset();
            checkLoggedInUser();
            setTimeout(() => window.location.href = 'index.html', 500);
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error logging in. Please try again.');
        console.error(error);
    }
});
