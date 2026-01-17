// ========================================
// RANT PAGE - POSTS AND REPLIES (SERVER BACKED)
// ========================================

// API base (allow overriding for hosted frontend pointing to remote backend)
const API_BASE = window.__API_BASE__ || '';

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

// Helper to fetch API with optional base URL
const apiFetch = (path, options = {}) => fetch(`${API_BASE}${path}`, options);

// Escape user-generated text to avoid script injection in templates
const escapeHtml = (str = '') => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Read a File object as a Data URL (base64)
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

// Format timestamp for display
const formatDate = (ts) => new Date(ts).toLocaleString();

// ========================================
// LOAD AND DISPLAY POSTS
// ========================================

async function loadPosts() {
    const el = document.getElementById('postsDisplay');
    if (!el) return;

    try {
        const res = await apiFetch('/api/posts');
        if (!res.ok) throw new Error('Failed to fetch posts');

        const posts = await res.json();
        const sorted = Array.isArray(posts) ? [...posts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];

        if (!sorted.length) {
            el.innerHTML = '<p class="no-posts">No posts yet. Be the first to share!</p>';
            return;
        }

        const admin = isAdmin();
        const html = sorted.map((p) => {
            const img = p.image ? `<img src="${p.image}" alt="Post image" class="post-image">` : '';
            const del = admin ? `<button class="delete-post-btn" onclick="deletePost(${p.id})">🗑️ Delete</button>` : '';

            const repliesHtml = (p.replies || []).map((r) => {
                const delR = admin ? `<button class="delete-post-btn delete-reply-btn" onclick="deleteReply(${p.id}, ${r.id})">🗑️ Delete</button>` : '';
                return `<div class="reply-item">
                <div class="reply-meta">
                    <strong>${escapeHtml(r.author)}</strong>
                    <span class="reply-date">${formatDate(r.timestamp)}</span>
                    ${delR}
                </div>
                <div class="reply-content">${escapeHtml(r.content)}</div>
            </div>`;
            }).join('');

            const replyInputId = `reply-input-${p.id}`;

            return `<div class="post-item">
                <div class="post-header">
                    <strong>${escapeHtml(p.author)}</strong>
                    <span class="post-date">${formatDate(p.timestamp)}</span>
                    ${del}
                </div>
                <div class="post-content">${escapeHtml(p.content)}</div>
                ${img}
                <div class="reply-section">
                    <div class="reply-list">${repliesHtml || '<p class="no-replies">No replies yet.</p>'}</div>
                    <div class="reply-form">
                        <textarea id="${replyInputId}" class="reply-input" rows="2" placeholder="Write a reply..."></textarea>
                        <button class="reply-submit-btn" onclick="submitReply(${p.id}, '${replyInputId}')">Reply</button>
                    </div>
                </div>
            </div>`;
        });

        el.innerHTML = html.join('');
    } catch (error) {
        console.error('Error loading posts:', error);
        el.innerHTML = '<p class="error">Error loading posts</p>';
    }
}

// ========================================
// CREATE NEW POST
// ========================================

async function submitPost(e) {
    if (e) e.preventDefault();

    console.log('Submit post called');
    
    const contentEl = document.getElementById('postContent');
    const imageEl = document.getElementById('postImage');
    const content = contentEl?.value.trim();

    console.log('Content:', content);
    console.log('API_BASE:', API_BASE);

    if (!content) {
        alert('Please enter a post before submitting');
        return;
    }

    try {
        const imageFile = imageEl?.files?.[0];
        const imageData = imageFile ? await fileToDataUrl(imageFile) : null;

        const res = await apiFetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                author: getAuthorName(),
                content,
                image: imageData
            })
        });

        if (!res.ok) throw new Error('Error creating post');

        if (contentEl) contentEl.value = '';
        if (imageEl) imageEl.value = '';
        loadPosts();
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
        alert('Only administrators can delete posts');
        return;
    }

    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const res = await apiFetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAdmin: true })
        });

        if (!res.ok) throw new Error('Error deleting post');
        loadPosts();
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
        alert('Please enter a reply before submitting');
        return;
    }

    try {
        const res = await apiFetch(`/api/posts/${postId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                author: getAuthorName(),
                content
            })
        });

        if (!res.ok) throw new Error('Error adding reply');
        input.value = '';
        loadPosts();
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
        alert('Only administrators can delete replies');
        return;
    }

    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
        const res = await apiFetch(`/api/posts/${postId}/reply/${replyId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAdmin: true })
        });

        if (!res.ok) throw new Error('Error deleting reply');
        loadPosts();
    } catch (error) {
        alert('Error deleting reply');
        console.error(error);
    }
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing rant page');
    loadPosts();

    const form = document.getElementById('postForm');
    console.log('Form found:', !!form);
    if (form) {
        form.addEventListener('submit', submitPost);
        console.log('Submit handler attached');
    }
});
