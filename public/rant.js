// ========================================
// RANT PAGE - POSTS AND REPLIES
// ========================================

// Get current logged in user
const getCurrentUser = () => { 
    try { 
        return JSON.parse(localStorage.getItem('currentUser') || 'null'); 
    } catch { 
        return null; 
    } 
};

// Check if user is admin
const isAdmin = () => !!getCurrentUser()?.isAdmin;

// Get username or "Anonymous"
const getAuthorName = () => getCurrentUser()?.username || 'Anonymous';

// ========================================
// LOAD AND DISPLAY POSTS
// ========================================

// Load all posts from server
async function loadPosts() {
    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();
        
        const el = document.getElementById('postsDisplay');
        
        if (!posts.length) { 
            el.innerHTML = '<p class="no-posts">No posts yet. Be the first to share!</p>'; 
            return; 
        }
        
        const admin = isAdmin();
        const html = [];
        
        // Display posts (newest first)
        posts.reverse().forEach((p, index) => {
            const img = p.image ? `<img src="${p.image}" alt="Post image" class="post-image">` : '';
            const del = admin ? `<button class="delete-post-btn" onclick="deletePost(${p.id})">🗑️ Delete</button>` : '';
            
            const repliesHtml = (p.replies || []).map(r => {
                const delR = admin ? `<button class="delete-post-btn delete-reply-btn" onclick="deleteReply(${p.id}, ${r.id})">🗑️ Delete</button>` : '';
                return `
                    <div class="reply">
                        <div class="reply-header">
                            <strong>${r.author}</strong>
                            <span class="reply-time">${new Date(r.timestamp).toLocaleString()}</span>
                        </div>
                        <p>${r.content}</p>
                        ${delR}
                    </div>
                `;
            }).join('');
            
            html.push(`
                <article class="post">
                    <div class="post-header">
                        <h3>${p.author}</h3>
                        <span class="post-time">${new Date(p.timestamp).toLocaleString()}</span>
                        ${del}
                    </div>
                    <p>${p.content}</p>
                    ${img}
                    <div class="replies">
                        <h4>Replies:</h4>
                        ${repliesHtml || '<p class="no-replies">No replies yet</p>'}
                        ${getCurrentUser() ? `
                            <div class="reply-input-section">
                                <input type="text" id="replyInput${p.id}" placeholder="Add a reply..." class="reply-input">
                                <button onclick="submitReply(${p.id}, 'replyInput${p.id}')" class="submit-reply-btn">Reply</button>
                            </div>
                        ` : '<p class="login-prompt"><a href="login.html">Login</a> to reply</p>'}
                    </div>
                </article>
            `);
        });
        
        el.innerHTML = html.join('');
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('postsDisplay').innerHTML = '<p class="error">Error loading posts</p>';
    }
}

// ========================================
// CREATE NEW POST
// ========================================

async function submitPost() {
    if (!getCurrentUser()) {
        return alert('Please login to post');
    }
    
    const input = document.getElementById('postInput');
    const content = input?.value.trim();
    
    if (!content) {
        return alert('Please enter a post before submitting');
    }
    
    try {
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                author: getAuthorName(),
                content,
                image: null
            })
        });
        
        if (res.ok) {
            input.value = '';
            loadPosts();
        } else {
            alert('Error creating post');
        }
    } catch (error) {
        alert('Error creating post');
        console.error(error);
    }
}

// ========================================
// DELETE POST
// ========================================

async function deletePost(postId) {
    if (!isAdmin()) {
        return alert('Only administrators can delete posts');
    }
    
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        const res = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAdmin: true })
        });
        
        if (res.ok) {
            loadPosts();
        } else {
            alert('Error deleting post');
        }
    } catch (error) {
        alert('Error deleting post');
        console.error(error);
    }
}

// ========================================
// ADD REPLY
// ========================================

async function submitReply(postId, inputId) {
    const input = document.getElementById(inputId);
    const content = input?.value.trim();
    
    if (!content) {
        return alert('Please enter a reply before submitting');
    }
    
    try {
        const res = await fetch(`/api/posts/${postId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                author: getAuthorName(),
                content
            })
        });
        
        if (res.ok) {
            input.value = '';
            loadPosts();
        } else {
            alert('Error adding reply');
        }
    } catch (error) {
        alert('Error adding reply');
        console.error(error);
    }
}

// ========================================
// DELETE REPLY
// ========================================

async function deleteReply(postId, replyId) {
    if (!isAdmin()) {
        return alert('Only administrators can delete replies');
    }
    
    if (!confirm('Are you sure you want to delete this reply?')) {
        return;
    }
    
    try {
        const res = await fetch(`/api/posts/${postId}/reply/${replyId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAdmin: true })
        });
        
        if (res.ok) {
            loadPosts();
        } else {
            alert('Error deleting reply');
        }
    } catch (error) {
        alert('Error deleting reply');
        console.error(error);
    }
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    
    const submitBtn = document.getElementById('submitPostBtn');
    if (submitBtn && getCurrentUser()) {
        submitBtn.addEventListener('click', submitPost);
    } else if (submitBtn) {
        submitBtn.style.display = 'none';
    }
});
