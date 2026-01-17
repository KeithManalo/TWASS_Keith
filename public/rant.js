// ========================================
// RANT PAGE - POSTS AND REPLIES (SERVER BACKED)
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
        const res = await fetch('/api/posts');
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
                return `
                    <div class="reply">
                        <div class="reply-header">
                            <strong>${escapeHtml(r.author)}</strong>
                            <span class="reply-time">${formatDate(r.timestamp)}</span>
                        </div>
                        <p>${escapeHtml(r.content)}</p>
                        ${delR}
                    </div>
                `;
            }).join('');

            const replyBlock = getCurrentUser()
                ? `
                    <div class="reply-input-section">
                        <input type="text" id="replyInput${p.id}" placeholder="Add a reply..." class="reply-input">
                        <button onclick="submitReply(${p.id}, 'replyInput${p.id}')" class="submit-reply-btn">Reply</button>
                    </div>
                `
                : '<p class="login-prompt"><a href="login.html">Login</a> to reply</p>';

            return `
                <article class="post">
                    <div class="post-header">
                        <h3>${escapeHtml(p.author)}</h3>
                        <span class="post-time">${formatDate(p.timestamp)}</span>
                        ${del}
                    </div>
                    <p class="post-content">${escapeHtml(p.content)}</p>
                    ${img}
                    <div class="replies">
                        <h4>Replies:</h4>
                        ${repliesHtml || '<p class="no-replies">No replies yet</p>'}
                        ${replyBlock}
                    </div>
                </article>
            `;
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

    if (!getCurrentUser()) {
        alert('Please login to post');
        return;
    }

    const contentEl = document.getElementById('postContent');
    const imageEl = document.getElementById('postImage');
    const content = contentEl?.value.trim();

    if (!content) {
        alert('Please enter a post before submitting');
        return;
    }

    try {
        const imageFile = imageEl?.files?.[0];
        const imageData = imageFile ? await fileToDataUrl(imageFile) : null;

        const res = await fetch('/api/posts', {
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
        const res = await fetch(`/api/posts/${postId}`, {
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
    if (!getCurrentUser()) {
        alert('Please login to reply');
        return;
    }

    const input = document.getElementById(inputId);
    const content = input?.value.trim();

    if (!content) {
        alert('Please enter a reply before submitting');
        return;
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
        const res = await fetch(`/api/posts/${postId}/reply/${replyId}`, {
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
    loadPosts();

    const form = document.getElementById('postForm');
    if (form) {
        form.addEventListener('submit', submitPost);
    }
});
