// ========================================
// PATCH NOTES PAGE
// Admins can edit patch notes
// ========================================

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

// Format text: "- item" becomes list, other lines become headings
const formatText = text => text.split('\n')
    .map(line => line.startsWith('- ') 
        ? `<li>${line.substring(2)}</li>`
        : line.trim() 
            ? `<h3>${line}</h3>`
            : ''
    ).join('');

// ========================================
// LOAD PATCHES FROM SERVER
// ========================================

async function load() {
    try {
        const res = await fetch('/api/patches');
        patches = await res.json();
        
        // Show edit button only for admins
        const btn = document.getElementById('editModeBtn');
        if (btn) btn.style.display = isAdmin() ? 'inline-block' : 'none';
        
        // Non-admins can't enter edit mode
        if (!isAdmin()) editMode = false;
        
        render();
    } catch (error) {
        console.error('Error loading patches:', error);
    }
}

// ========================================
// DISPLAY PATCHES
// ========================================

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
                    ? `<button class="btn-delete-patch" onclick="deletePatch(${p.id})">🗑️</button>` 
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
// EDIT MODE
// ========================================

function toggleEditMode() {
    editMode = !editMode;
    const btn = document.getElementById('editModeBtn');
    btn.textContent = editMode ? '✓ Save Changes' : '✏️ Edit Patch Notes';
    
    if (!editMode) {
        // Save all changes
        saveAllPatches();
    }
    
    render();
}

// Setup live editing
function attachListeners() {
    document.querySelectorAll('.patch-card').forEach(card => {
        const patchId = parseInt(card.dataset.id);
        const patch = patches.find(p => p.id === patchId);
        if (!patch) return;
        
        const ver = card.querySelector('.patch-version-edit');
        const date = card.querySelector('.patch-date-edit');
        const text = card.querySelector('.patch-text-edit');
        
        if (ver) ver.addEventListener('input', e => patch.version = e.target.value);
        if (date) date.addEventListener('input', e => patch.date = e.target.value);
        if (text) text.addEventListener('input', e => patch.text = e.target.value);
    });
}

// Save all patches to server
async function saveAllPatches() {
    for (const patch of patches) {
        try {
            await fetch(`/api/patches/${patch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...patch, isAdmin: true })
            });
        } catch (error) {
            console.error('Error saving patch:', error);
        }
    }
}

// Delete a patch
async function deletePatch(patchId) {
    if (!confirm('Are you sure you want to delete this patch?')) return;
    
    try {
        const res = await fetch(`/api/patches/${patchId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAdmin: true })
        });
        
        if (res.ok) {
            patches = patches.filter(p => p.id !== patchId);
            render();
        }
    } catch (error) {
        console.error('Error deleting patch:', error);
    }
}

// Add new patch
async function addPatch() {
    const version = prompt('Enter patch version (e.g., Patch 2.6.0):');
    if (!version) return;
    
    const date = prompt('Enter patch date:');
    if (!date) return;
    
    const text = prompt('Enter patch notes (use "- " for bullet points):');
    if (!text) return;
    
    try {
        const res = await fetch('/api/patches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version, date, text, isAdmin: true })
        });
        
        if (res.ok) {
            const newPatch = await res.json();
            patches.push(newPatch);
            render();
        }
    } catch (error) {
        alert('Error creating patch');
    }
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    load();
    
    const btn = document.getElementById('editModeBtn');
    if (btn) {
        btn.addEventListener('click', toggleEditMode);
    }
    
    const addBtn = document.getElementById('addPatchBtn');
    if (addBtn && isAdmin()) {
        addBtn.style.display = 'inline-block';
        addBtn.addEventListener('click', addPatch);
    }
});
