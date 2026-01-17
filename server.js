// ========================================
// VALO.RANT - NODE.JS/EXPRESS WEB SERVICE WITH MONGODB
// ========================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MONGODB CONNECTION
// ========================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'valoRant';

let db;
let usersCollection;
let postsCollection;
let patchesCollection;

// Connect to MongoDB
async function connectDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        
        db = client.db(DB_NAME);
        usersCollection = db.collection('users');
        postsCollection = db.collection('posts');
        patchesCollection = db.collection('patches');
        
        // Create default patch if none exist
        const patchCount = await patchesCollection.countDocuments();
        if (patchCount === 0) {
            await patchesCollection.insertOne({
                id: 1,
                version: "Patch 2.5.0",
                date: "December 15, 2024",
                text: "New Features\n- New Gun"
            });
        }
        
        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ========================================
// AGENTS API - FETCH FROM VALORANT API
// ========================================

// Get all agents
app.get('/api/agents', async (req, res) => {
    try {
        const response = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
        const data = await response.json();
        
        if (data.status === 200) {
            const agents = data.data.filter(a => a.isPlayableCharacter);
            res.json({ status: 200, data: agents });
        } else {
            res.status(500).json({ status: 500, error: 'Failed to fetch agents' });
        }
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ status: 500, error: 'Server error fetching agents' });
    }
});

// ========================================
// USER AUTHENTICATION
// ========================================

// Encode password (basic - use bcrypt in production)
const encodePassword = (pwd) => Buffer.from(pwd).toString('base64');
const decodePassword = (encoded) => Buffer.from(encoded, 'base64').toString('utf-8');

// Admin account
const ADMIN = { 
    username: 'Admin', 
    email: 'admin@gmail.com', 
    password: encodePassword('access'),
    isAdmin: true
};

// Register new user
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, confirm } = req.body;
    
    // Validation
    if (!username || !email || !password || !confirm) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }
    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (password !== confirm) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    try {
        // Check if user exists
        const existingUser = await usersCollection.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'This email or username is already registered' });
        }
        
        // Save user
        const newUser = { username, email, password: encodePassword(password), isAdmin: false };
        await usersCollection.insertOne(newUser);
        
        res.status(201).json({ 
            message: 'Registration successful!',
            user: { username, email }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }
    
    try {
        // Check admin account
        if (email === ADMIN.email && encodePassword(password) === ADMIN.password) {
            return res.json({ 
                message: 'Admin login successful!',
                user: { username: ADMIN.username, email: ADMIN.email, isAdmin: true }
            });
        }
        
        // Check user accounts
        const user = await usersCollection.findOne({ email });
        if (user && decodePassword(user.password) === password) {
            return res.json({ 
                message: 'Login successful!',
                user: { username: user.username, email: user.email, isAdmin: user.isAdmin || false }
            });
        }
        
        res.status(401).json({ error: 'Invalid email or password' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ========================================
// RANT POSTS API
// ========================================

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await postsCollection.find({}).toArray();
        const postsWithReplies = posts.map(p => ({ 
            ...p, 
            replies: p.replies || [] 
        }));
        res.json(postsWithReplies);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Server error fetching posts' });
    }
});

// Create new post
app.post('/api/posts', async (req, res) => {
    const { author, content, image } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Post content is required' });
    }
    
    try {
        const post = {
            id: Date.now(),
            author: author || 'Anonymous',
            content,
            image: image || null,
            timestamp: new Date().toISOString(),
            replies: []
        };
        
        await postsCollection.insertOne(post);
        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Server error creating post' });
    }
});

// Delete post (admin only)
app.delete('/api/posts/:id', async (req, res) => {
    const { isAdmin } = req.body;
    
    if (!isAdmin) {
        return res.status(403).json({ error: 'Only administrators can delete posts' });
    }
    
    try {
        const result = await postsCollection.deleteOne({ id: parseInt(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ message: 'Post deleted' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Server error deleting post' });
    }
});

// Add reply to post
app.post('/api/posts/:id/reply', async (req, res) => {
    const { author, content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Reply content is required' });
    }
    
    try {
        const reply = {
            id: Date.now(),
            author: author || 'Anonymous',
            content,
            timestamp: new Date().toISOString()
        };
        
        const result = await postsCollection.updateOne(
            { id: parseInt(req.params.id) },
            { $push: { replies: reply } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.status(201).json(reply);
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ error: 'Server error adding reply' });
    }
});

// Delete reply (admin only)
app.delete('/api/posts/:postId/reply/:replyId', async (req, res) => {
    const { isAdmin } = req.body;
    
    if (!isAdmin) {
        return res.status(403).json({ error: 'Only administrators can delete replies' });
    }
    
    try {
        const result = await postsCollection.updateOne(
            { id: parseInt(req.params.postId) },
            { $pull: { replies: { id: parseInt(req.params.replyId) } } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json({ message: 'Reply deleted' });
    } catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).json({ error: 'Server error deleting reply' });
    }
});

// ========================================
// PATCH NOTES API
// ========================================

// Get all patches
app.get('/api/patches', async (req, res) => {
    try {
        const patches = await patchesCollection.find({}).toArray();
        res.json(patches);
    } catch (error) {
        console.error('Error fetching patches:', error);
        res.status(500).json({ error: 'Server error fetching patches' });
    }
});

// Create new patch (admin only)
app.post('/api/patches', async (req, res) => {
    const { version, date, text, isAdmin } = req.body;
    
    if (!isAdmin) {
        return res.status(403).json({ error: 'Only administrators can create patches' });
    }
    
    if (!version || !date || !text) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        const patch = {
            id: Date.now(),
            version,
            date,
            text
        };
        
        await patchesCollection.insertOne(patch);
        res.status(201).json(patch);
    } catch (error) {
        console.error('Error creating patch:', error);
        res.status(500).json({ error: 'Server error creating patch' });
    }
});

// Update patch (admin only)
app.put('/api/patches/:id', async (req, res) => {
    const { version, date, text, isAdmin } = req.body;
    
    if (!isAdmin) {
        return res.status(403).json({ error: 'Only administrators can edit patches' });
    }
    
    try {
        const updateFields = {};
        if (version) updateFields.version = version;
        if (date) updateFields.date = date;
        if (text) updateFields.text = text;
        
        const result = await patchesCollection.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            { $set: updateFields },
            { returnDocument: 'after' }
        );
        
        if (!result.value) {
            return res.status(404).json({ error: 'Patch not found' });
        }
        
        res.json(result.value);
    } catch (error) {
        console.error('Error updating patch:', error);
        res.status(500).json({ error: 'Server error updating patch' });
    }
});

// Delete patch (admin only)
app.delete('/api/patches/:id', async (req, res) => {
    const { isAdmin } = req.body;
    
    if (!isAdmin) {
        return res.status(403).json({ error: 'Only administrators can delete patches' });
    }
    
    try {
        const result = await patchesCollection.deleteOne({ id: parseInt(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Patch not found' });
        }
        res.json({ message: 'Patch deleted' });
    } catch (error) {
        console.error('Error deleting patch:', error);
        res.status(500).json({ error: 'Server error deleting patch' });
    }
});

// ========================================
// SERVE STATIC HTML
// ========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================================
// START SERVER
// ========================================

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🎮 Valo.Rant server running on http://localhost:${PORT}`);
    });
});
