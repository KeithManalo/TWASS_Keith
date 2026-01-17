// ========================================
// AGENTS PAGE - BROWSE VALORANT AGENTS
// Fetches agents from API with search and filters
// ========================================

// Store all agents and filtered results
let allAgents = [];
let filteredAgents = [];
let filter = 'all';

// Shortcuts for getting elements
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ========================================
// FETCH AGENTS FROM API
// ========================================

// Get agents when page loads
async function init() {
    try {
        // Fetch from server API
        const res = await fetch('/api/agents');
        const data = await res.json();
        
        if (data.status === 200) {
            // Store and display agents
            allAgents = filteredAgents = data.data.filter(a => a.isPlayableCharacter);
            render(); // Display agents
        } else {
            error('Failed to fetch agents');
        }
    } catch (e) {
        error('Error loading agents. Please try again.');
    }
}

// ========================================
// DISPLAY AGENTS
// ========================================

// Show filtered agents on page
function render() {
    const has = filteredAgents.length > 0;
    
    // Toggle visibility of no results message
    $('noResults').style.display = has ? 'none' : 'block';
    $('errorMessage').style.display = 'none';
    
    // Create card for each agent
    $('agentsGrid').innerHTML = filteredAgents.map(a => `
        <div class="agent-card" onclick="modal('${a.uuid}')">
            <div class="agent-image">
                <img src="${a.displayIcon}" alt="${a.displayName}" loading="lazy">
            </div>
            <div class="agent-info">
                <div class="agent-name">${a.displayName}</div>
                <div class="agent-role">${a.role.displayName}</div>
                <button class="view-details-btn">View Details</button>
            </div>
        </div>
    `).join('');
}

// ========================================
// AGENT DETAILS POPUP
// ========================================

// Open popup with agent details
function modal(id) {
    // Find the agent
    const a = allAgents.find(x => x.uuid === id);
    if (!a) return;
    
    // Fill in agent info
    $('modalImage').src = a.displayIcon;
    $('modalName').textContent = a.displayName;
    $('modalRole').textContent = a.role.displayName;
    $('modalBio').textContent = a.description;
    
    // List all abilities
    $('abilitiesList').innerHTML = a.abilities
        .filter(x => x.displayName)
        .map((x, i) => {
            // Determine ability label based on slot type
            let label = '';
            if (x.slot === 'Ultimate') label = 'Ultimate:';
            else if (x.slot === 'Passive') label = 'Passive:';
            else label = `Ability ${i + 1}:`;
            
            return `<div class="ability">
                <div class="ability-name">${label} ${x.displayName}</div>
                <div class="ability-desc">${x.description}</div>
            </div>`;
        })
        .join('');
    
    // Show the popup
    $('agentModal').classList.add('active');
}

// Close the popup
function close() {
    $('agentModal').classList.remove('active');
}

// ========================================
// SEARCH AND FILTER
// ========================================

// Update shown agents based on search and filter
function refresh() {
    const term = $('searchInput').value.toLowerCase();
    
    // Filter by name and role
    filteredAgents = allAgents.filter(a => 
        a.displayName.toLowerCase().includes(term) && 
        (filter === 'all' || a.role.displayName === filter)
    );
    
    render();
}

// Show error message
function error(msg) {
    $('agentsGrid').style.display = 'none';
    $('errorMessage').textContent = msg;
    $('errorMessage').style.display = 'block';
}

// ========================================
// SETUP EVENT LISTENERS
// ========================================

// Search as user types
$('searchInput').addEventListener('input', refresh);

// Role filter buttons
$$('.role-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        // Remove active from all buttons
        $$('.role-btn').forEach(b => b.classList.remove('active'));
        
        // Mark clicked button as active
        e.target.classList.add('active');
        
        // Update filter and refresh
        filter = e.target.dataset.role;
        refresh();
    });
});

// Close button
$('closeModal').addEventListener('click', close);

// Click outside to close
$('agentModal').addEventListener('click', e => e.target.id === 'agentModal' && close());

// Start loading agents
init();
