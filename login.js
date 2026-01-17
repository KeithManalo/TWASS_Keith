// ========================================
// USER LOGIN AND REGISTRATION
// ========================================

// Get users from storage
const getUsers = () => JSON.parse(localStorage.getItem('users') || '[]');
const getCurrentUser = () => localStorage.getItem('currentUser');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Admin account (built into the code)
const ADMIN = { username: 'Admin', email: 'admin@gmail.com', password: btoa('access') };

// Check if user is logged in and update the page
function checkLoggedInUser() {
    const user = getCurrentUser();
    const loggedIn = document.getElementById('loggedInView');
    const auth = document.getElementById('authView');
    
    if (user) {
        // Show logged in screen
        document.getElementById('usernameDisplay').textContent = JSON.parse(user).username;
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
    // Create users array if needed
    if (!localStorage.getItem('users')) localStorage.setItem('users', '[]');
    
    checkLoggedInUser();
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

// ========================================
// REGISTER NEW USER
// ========================================
document.querySelector('.register-form')?.addEventListener('submit', e => {
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
    
    // Check if email or username already exists
    const users = getUsers();
    if (users.some(u => u.email === email || u.username === username)) return alert('This email or username is already registered');
    
    // Save new user
    users.push({ username, email, password: btoa(password) });
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify({ username, email }));
    
    // Success - go to home page
    alert('Registration successful! Welcome ' + username + '!');
    e.target.reset();
    checkLoggedInUser();
    setTimeout(() => window.location.href = 'index.html', 500);
});

// ========================================
// LOGIN EXISTING USER
// ========================================
document.querySelector('.login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    
    // Get login credentials
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Check fields are filled
    if (!email || !password) return alert('Please fill in all fields');
    if (!emailRegex.test(email)) return alert('Please enter a valid email address');
    
    // Helper to log in user
    const loginUser = (username, isAdmin = false) => {
        localStorage.setItem('currentUser', JSON.stringify({ username, email, isAdmin }));
        alert((isAdmin ? 'Admin' : '') + ' login successful! Welcome ' + username + '!');
        e.target.reset();
        checkLoggedInUser();
        setTimeout(() => window.location.href = 'index.html', 500);
    };
    
    // Check if admin login
    if (email === ADMIN.email && btoa(password) === ADMIN.password) return loginUser(ADMIN.username, true);
    
    // Check regular user
    const user = getUsers().find(u => u.email === email && u.password === btoa(password));
    if (!user) return alert('Invalid email or password');
    
    loginUser(user.username);
});
