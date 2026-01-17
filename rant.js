// ========================================
// RANT PAGE - POSTS AND REPLIES
// ========================================

// Get current logged in user
const getCurrentUser = () => { try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; } };

// Check if user is admin
const isAdmin = () => !!getCurrentUser()?.isAdmin;

// Get username or "Anonymous"
const getAuthorName = () => getCurrentUser()?.username || 'Anonymous';

// Get all posts from storage
const getPosts = () => { try { return (JSON.parse(localStorage.getItem('rantPosts') || '[]')).map(p => ({ ...p, replies: p.replies || [] })); } catch { return []; } };

// Save posts to storage
const savePosts = posts => localStorage.setItem('rantPosts', JSON.stringify(posts));

// Check if index is valid
const hasIndex = (arr, i) => Array.isArray(arr) && i >= 0 && i < arr.length;

// Format timestamp to readable date
const fmtDate = ts => new Date(ts).toLocaleString();

// ========================================
// DELETE POSTS AND REPLIES (ADMIN ONLY)
// ========================================

// Delete a post
function deletePost(i) {
    if (!isAdmin()) return alert('Only administrators can delete posts.');
    const posts = getPosts();
    if (!hasIndex(posts, i) || !confirm('Are you sure you want to delete this post?')) return;
    posts.splice(i, 1); 
    savePosts(posts); 
    loadPosts();
}

// Delete a reply
function deleteReply(pi, ri) {
    if (!isAdmin()) return alert('Only administrators can delete replies.');
    const posts = getPosts();
    if (!hasIndex(posts, pi) || !hasIndex(posts[pi].replies, ri) || !confirm('Delete this reply?')) return;
    posts[pi].replies.splice(ri, 1); 
    savePosts(posts); 
    loadPosts();
}

// Add a reply to a post
function submitReply(pi, inputId) {
    const input = document.getElementById(inputId);
    const content = input?.value.trim();
    if (!content) return alert('Please enter a reply before submitting.');
    
    const posts = getPosts();
    if (!hasIndex(posts, pi)) return;
    
    // Add reply with username and time
    posts[pi].replies.push({ 
        author: getAuthorName(), 
        content, 
        timestamp: new Date().toISOString() 
    });
    
    savePosts(posts); 
    loadPosts();
}

// ========================================
// DISPLAY POSTS ON PAGE
// ========================================

// Load and show all posts
function loadPosts() {
    const posts = getPosts();
    const el = document.getElementById('postsDisplay');
    
    // Show message if no posts
    if (!posts.length) { 
        el.innerHTML = '<p class="no-posts">No posts yet. Be the first to share!</p>'; 
        return; 
    }
    
    const admin = isAdmin();
    const html = [];
    
    // Build HTML for each post (newest first)
    for (let i = posts.length - 1; i >= 0; i--) {
        const p = posts[i];
        
        // Add image if post has one
        const img = p.image ? `<img src="${p.image}" alt="Post image" class="post-image">` : '';
        
        // Add delete button for admins
        const del = admin ? `<button class="delete-post-btn" onclick="deletePost(${i})">🗑️ Delete</button>` : '';
        
        // Build HTML for all replies
        const replies = p.replies.map((r, ri) => {
            const delR = admin ? `<button class="delete-post-btn delete-reply-btn" onclick="deleteReply(${i}, ${ri})">🗑️ Delete</button>` : '';
            return `<div class="reply-item">
                <div class="reply-meta">
                    <strong>${r.author}</strong>
                    <span class="reply-date">${fmtDate(r.timestamp)}</span>
                    ${delR}
                </div>
                <div class="reply-content">${r.content}</div>
            </div>`;
        }).join('');
        
        // Create unique ID for reply input
        const replyId = `reply-input-${i}`;
        
        // Build complete post HTML
        html.push(
            `<div class="post-item">
                <div class="post-header">
                    <strong>${p.author}</strong>
                    <span class="post-date">${fmtDate(p.timestamp)}</span>
                    ${del}
                </div>
                <div class="post-content">${p.content}</div>
                ${img}
                <div class="reply-section">
                    <div class="reply-list">${replies || '<p class="no-replies">No replies yet.</p>'}</div>
                    <div class="reply-form">
                        <textarea id="${replyId}" class="reply-input" rows="2" placeholder="Write a reply..."></textarea>
                        <button class="reply-submit-btn" onclick="submitReply(${i}, '${replyId}')">Reply</button>
                    </div>
                </div>
            </div>`
        );
    }
    
    // Show all posts on page
    el.innerHTML = html.join('');
}

// ========================================
// CREATE NEW POST
// ========================================

// Handle new post form
document.getElementById('postForm').addEventListener('submit', e => {
    e.preventDefault();
    
    // Get post text
    const content = document.getElementById('postContent').value.trim();
    if (!content) return alert('Please enter content before posting.');
    
    // Get image if user uploaded one
    const imageFile = document.getElementById('postImage').files[0];
    const posts = getPosts();
    
    // Helper to save post
    const savePost = imageData => {
        posts.push({ 
            author: getAuthorName(), 
            content, 
            image: imageData, 
            timestamp: new Date().toISOString(), 
            replies: [] 
        });
        savePosts(posts); 
        document.getElementById('postForm').reset(); 
        loadPosts();
    };
    
    // Convert image to base64 if exists
    if (imageFile) { 
        const reader = new FileReader(); 
        reader.onload = e2 => savePost(e2.target.result); 
        reader.readAsDataURL(imageFile); 
    } else {
        // No image, save now
        savePost(null);
    }
});

// Load posts when page opens
window.addEventListener('DOMContentLoaded', loadPosts);
