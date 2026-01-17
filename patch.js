// ========================================
// PATCH NOTES PAGE
// Admins can edit patch notes
// ========================================

// Default patch notes
const defaultPatches = [
    { id: 1, version: "Patch 2.5.0", date: "December 15, 2024", text: "New Features\n- New Gun" },
];

let patches = [];
let editMode = false;

// Check if user is admin
const isAdmin = () => { 
    try { 
        return JSON.parse(localStorage.getItem('currentUser') || 'null')?.isAdmin || false; 
    } catch { 
        return false; 
    } 
};

// Save patches to storage
const save = () => localStorage.setItem('patches', JSON.stringify(patches));

// Format text: "- item" becomes list, other lines become headings
const formatText = text => text.split('\n')
    .map(line => line.startsWith('- ') 
        ? `<li>${line.substring(2)}</li>`
        : line.trim() 
            ? `<h3>${line}</h3>`
            : ''
    ).join('');

// ========================================
// LOAD PATCHES
// ========================================

// Load patches from storage
function load() {
    patches = JSON.parse(localStorage.getItem('patches') || JSON.stringify(defaultPatches));
    
    // Show edit button only for admins
    const btn = document.getElementById('editModeBtn');
    if (btn) btn.style.display = isAdmin() ? 'inline-block' : 'none';
    
    // Non-admins can't enter edit mode
    if (!isAdmin()) editMode = false;
    
    render();
}

// ========================================
// SHOW PATCHES ON PAGE
// ========================================

// Display all patches
function render() {
    document.getElementById('patchList').innerHTML = patches.map(p => `
        <article class="patch-card" data-id="${p.id}">
            <div class="patch-header">
                ${editMode 
                    ? `<input type="text" class="patch-version-edit" value="${p.version}">` 
                    : `<h2 class="patch-version">${p.version}</h2>`
                }
                ${editMode 
                    ? `<input type="text" class="patch-date-edit" value="${p.date}">` 
                    : `<span class="patch-date">${p.date}</span>`
                }
                ${editMode 
                    ? `<button class="btn-delete-patch">🗑️</button>` 
                    : ''
                }
            </div>
            <div class="patch-content">
                ${editMode 
                    ? `<textarea class="patch-text-edit">${p.text}</textarea>` 
                    : `<ul>${formatText(p.text)}</ul>`
                }
            </div>
        </article>
    `).join('');
    
    // Setup edit listeners if in edit mode
    if (editMode) attachListeners();
}

// ========================================
// EDIT MODE - SETUP LISTENERS
// ========================================

// Setup live editing for all patches
function attachListeners() {
    document.querySelectorAll('.patch-card').forEach(card => {
        // Find the patch data by ID
        const p = patches.find(p => p.id === parseInt(card.dataset.id));
        
        // Get editable fields
        const ver = card.querySelector('.patch-version-edit');
        const date = card.querySelector('.patch-date-edit');
        const text = card.querySelector('.patch-text-edit');
        const del = card.querySelector('.btn-delete-patch');

        // Auto-save when editing
        if (ver) ['input', 'blur'].forEach(e => 
            ver.addEventListener(e, () => { 
                p.version = ver.value; 
                save(); 
            })
        );
        
        if (date) ['input', 'blur'].forEach(e => 
            date.addEventListener(e, () => { 
                p.date = date.value; 
                save(); 
            })
        );
        
        if (text) ['input', 'blur'].forEach(e => 
            text.addEventListener(e, () => { 
                p.text = text.value; 
                save(); 
            })
        );
        
        // Delete with confirmation
        if (del) del.addEventListener('click', () => {
            if (confirm('Delete this patch?')) { 
                patches = patches.filter(x => x.id !== p.id); 
                save(); 
                render(); 
            }
        });
    });
}

// ========================================
// TOGGLE EDIT MODE
// ========================================

// Turn edit mode on/off (admin only)
document.getElementById('editModeBtn').addEventListener('click', function() {
    // Only admins can edit
    if (!isAdmin()) return alert('You must be logged in as an administrator to edit patches.');
    
    // Switch edit mode
    editMode = !editMode;
    
    // Update button
    this.textContent = editMode ? '✓ Save' : '✎ Edit';
    this.classList.toggle('active');
    document.body.classList.toggle('edit-mode');
    
    // Refresh display
    render();
});

// Load patches when page opens
document.addEventListener('DOMContentLoaded', load);
