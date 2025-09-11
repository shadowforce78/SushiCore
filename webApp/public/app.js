
let currentModule = 'welcome';
let notes = [];

// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function () {
    switchModule('welcome');
});

// Navigation entre modules
function switchModule(moduleName) {
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    if (moduleName !== 'welcome') {
        event.target.closest('.nav-item').classList.add('active');
    }

    // Masquer tous les modules
    document.querySelectorAll('.module-container').forEach(module => {
        module.classList.remove('active');
    });

    // Afficher le module sélectionné
    document.getElementById(`${moduleName}-module`).classList.add('active');

    currentModule = moduleName;

    // Mettre à jour le titre et les actions
    updateHeader(moduleName);

    // Charger les données si nécessaire
    if (moduleName === 'notes') {
        loadNotes();
    }
}

function updateHeader(moduleName) {
    const titleElement = document.getElementById('module-title');
    const primaryAction = document.getElementById('primary-action');

    switch (moduleName) {
        case 'welcome':
            titleElement.textContent = 'Bienvenue';
            primaryAction.style.display = 'none';
            break;
        case 'notes':
            titleElement.textContent = 'Mes Notes';
            primaryAction.style.display = 'flex';
            primaryAction.onclick = showCreateNoteForm;
            break;
        default:
            titleElement.textContent = 'Module';
            primaryAction.style.display = 'none';
    }
}

// Gestion des notes
let currentView = 'grid'; // 'grid' ou 'list'
let editingNoteId = null;
let noteToDelete = null;
let allTags = [];

async function loadNotes() {
    const loading = document.getElementById('notes-loading');
    const grid = document.getElementById('notes-grid');
    const list = document.getElementById('notes-list');
    const empty = document.getElementById('notes-empty');

    loading.style.display = 'flex';
    grid.style.display = 'none';
    list.style.display = 'none';
    empty.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/notes`);

        if (response.ok) {
            notes = await response.json();
            extractTags();
            updateTagFilter();
            displayNotes();
        } else {
            console.error('Erreur lors du chargement des notes:', response.status);
            showError('Impossible de charger les notes');
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showError('Erreur de connexion à l\'API');
    }

    loading.style.display = 'none';
}

function extractTags() {
    const tagSet = new Set();
    notes.forEach(note => {
        if (note.tag && Array.isArray(note.tag)) {
            note.tag.forEach(tag => {
                if (tag && tag.trim()) {
                    tagSet.add(tag.trim());
                }
            });
        }
    });
    allTags = Array.from(tagSet);
}

function updateTagFilter() {
    const filterSelect = document.getElementById('filter-tag');
    const tagSuggestions = document.getElementById('tag-suggestions');

    // Mettre à jour le filtre
    filterSelect.innerHTML = '<option value="">Tous les tags</option>' +
        allTags.map(tag => `<option value="${tag}">${tag}</option>`).join('');

    // Mettre à jour les suggestions
    tagSuggestions.innerHTML = allTags.map(tag => `<option value="${tag}"></option>`).join('');
}

function displayNotes() {
    const grid = document.getElementById('notes-grid');
    const list = document.getElementById('notes-list');
    const empty = document.getElementById('notes-empty');

    // Filtrer les notes
    const searchTerm = document.getElementById('search-notes').value.toLowerCase();
    const tagFilter = document.getElementById('filter-tag').value;

    let filteredNotes = notes.filter(note => {
        const matchesSearch = !searchTerm ||
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm) ||
            (note.tag && note.tag.some(tag => tag.toLowerCase().includes(searchTerm)));
        const matchesTag = !tagFilter ||
            (note.tag && note.tag.includes(tagFilter));
        return matchesSearch && matchesTag;
    });

    if (filteredNotes.length === 0) {
        grid.style.display = 'none';
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    if (currentView === 'grid') {
        grid.style.display = 'grid';
        list.style.display = 'none';
        displayNotesGrid(filteredNotes);
    } else {
        grid.style.display = 'none';
        list.style.display = 'flex';
        displayNotesList(filteredNotes);
    }
}

function displayNotesGrid(filteredNotes) {
    const grid = document.getElementById('notes-grid');

    grid.innerHTML = filteredNotes.map(note => `
                <div class="note-card">
                    <div class="note-header">
                        <div>
                            <h3 class="note-title">${escapeHtml(note.title)}</h3>
                            ${note.tag && note.tag.length > 0 ?
            note.tag.map(tag => `<span class="note-tag">${escapeHtml(tag)}</span>`).join(' ') :
            ''
        }
                        </div>
                    </div>
                    <div class="note-content">
                        ${escapeHtml(note.content).substring(0, 150)}${note.content.length > 150 ? '...' : ''}
                    </div>
                    <div class="note-footer">
                        <span class="note-date">
                            ${formatDate(note.createdAt)}
                        </span>
                        <div class="note-actions">
                            <button class="note-action-btn" onclick="editNote('${note._id}')" title="Modifier">
                                ✏️
                            </button>
                            <button class="note-action-btn" onclick="showDeleteConfirm('${note._id}')" title="Supprimer">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
}

function displayNotesList(filteredNotes) {
    const list = document.getElementById('notes-list');

    list.innerHTML = filteredNotes.map(note => `
                <div class="note-list-item">
                    <div class="note-list-content">
                        <div class="note-list-title">${escapeHtml(note.title)}</div>
                        <div class="note-list-preview">
                            ${escapeHtml(note.content).substring(0, 100)}${note.content.length > 100 ? '...' : ''}
                        </div>
                    </div>
                    <div class="note-list-meta">
                        ${note.tag && note.tag.length > 0 ?
            note.tag.map(tag => `<span class="note-list-tag">${escapeHtml(tag)}</span>`).join(' ') :
            ''
        }
                        <span class="note-list-date">${formatDate(note.createdAt)}</span>
                    </div>
                    <div class="note-list-actions">
                        <button class="note-action-btn" onclick="editNote('${note._id}')" title="Modifier">
                            ✏️
                        </button>
                        <button class="note-action-btn" onclick="showDeleteConfirm('${note._id}')" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('');
}

function toggleView() {
    currentView = currentView === 'grid' ? 'list' : 'grid';
    const viewIcon = document.getElementById('view-icon');
    const viewText = document.getElementById('view-text');

    if (currentView === 'list') {
        viewIcon.textContent = '📋';
        viewText.textContent = 'Liste';
    } else {
        viewIcon.textContent = '🔲';
        viewText.textContent = 'Grille';
    }

    displayNotes();
}

function showCreateNoteForm() {
    editingNoteId = null;
    document.getElementById('modal-title').textContent = 'Créer une nouvelle note';
    document.getElementById('note-title').value = '';
    document.getElementById('note-tag').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('save-note-btn').querySelector('.btn-text').textContent = '💾 Créer';

    document.getElementById('note-modal').classList.add('show');
}

function editNote(noteId) {
    const note = notes.find(n => n._id === noteId);
    if (!note) return;

    editingNoteId = noteId;
    document.getElementById('modal-title').textContent = 'Modifier la note';
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-tag').value = note.tag && note.tag.length > 0 ? note.tag.join(', ') : '';
    document.getElementById('note-content').value = note.content;
    document.getElementById('save-note-btn').querySelector('.btn-text').textContent = '💾 Modifier';

    document.getElementById('note-modal').classList.add('show');
}

function closeNoteModal() {
    document.getElementById('note-modal').classList.remove('show');
    editingNoteId = null;
}

function showDeleteConfirm(noteId) {
    const note = notes.find(n => n._id === noteId);
    if (!note) return;

    noteToDelete = noteId;
    document.getElementById('delete-note-preview').innerHTML = `
                <div class="note-preview-title">${escapeHtml(note.title)}</div>
                <div class="note-preview-content">
                    ${escapeHtml(note.content).substring(0, 100)}${note.content.length > 100 ? '...' : ''}
                </div>
            `;

    document.getElementById('delete-modal').classList.add('show');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('show');
    noteToDelete = null;
}

async function confirmDelete() {
    if (!noteToDelete) return;

    const btnText = document.querySelector('#confirm-delete-btn .btn-text');
    const loading = document.querySelector('#confirm-delete-btn .loading');
    const btn = document.getElementById('confirm-delete-btn');

    btnText.style.display = 'none';
    loading.style.display = 'inline';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/note/${noteToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeDeleteModal();
            await loadNotes();
            showSuccess('Note supprimée avec succès !');
        } else {
            showError('Erreur lors de la suppression de la note');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur de connexion');
    } finally {
        btnText.style.display = 'inline';
        loading.style.display = 'none';
        btn.disabled = false;
    }
}

// Gestionnaire de formulaire
document.addEventListener('DOMContentLoaded', function () {
    // Formulaire de note
    document.getElementById('note-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const title = document.getElementById('note-title').value;
        const tag = document.getElementById('note-tag').value;
        const content = document.getElementById('note-content').value;

        const btnText = document.querySelector('#save-note-btn .btn-text');
        const loading = document.querySelector('#save-note-btn .loading');
        const btn = document.getElementById('save-note-btn');

        btnText.style.display = 'none';
        loading.style.display = 'inline';
        btn.disabled = true;

        try {
            const url = editingNoteId ?
                `${API_BASE_URL}/note/${editingNoteId}` :
                `${API_BASE_URL}/note`;

            const method = editingNoteId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, tag, content })
            });

            if (response.ok) {
                closeNoteModal();
                await loadNotes();
                showSuccess(editingNoteId ? 'Note modifiée avec succès !' : 'Note créée avec succès !');
            } else {
                showError('Erreur lors de l\'enregistrement de la note');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showError('Erreur de connexion');
        } finally {
            btnText.style.display = 'inline';
            loading.style.display = 'none';
            btn.disabled = false;
        }
    });

    // Recherche en temps réel
    document.getElementById('search-notes').addEventListener('input', displayNotes);

    // Filtre par tag
    document.getElementById('filter-tag').addEventListener('change', displayNotes);

    // Fermer les modals avec Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeNoteModal();
            closeDeleteModal();
        }
    });

    switchModule('welcome');
});

function refreshData() {
    if (currentModule === 'notes') {
        loadNotes();
    }
}

// Utilitaires
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Aujourd\'hui';
    } else if (diffDays === 1) {
        return 'Hier';
    } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
    } else {
        return date.toLocaleDateString('fr-FR');
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showSuccess(message) {
    // Simple notification - vous pouvez améliorer avec une vraie notification
    const notification = document.createElement('div');
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #48bb78;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
            `;
    notification.textContent = '✅ ' + message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f56565;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
            `;
    notification.textContent = '❌ ' + message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
}