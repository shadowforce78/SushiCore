
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
    } else if (moduleName === 'discord-messages') {
        loadDiscordMessages();
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
        case 'discord-messages':
            titleElement.textContent = 'Messages Discord';
            primaryAction.style.display = 'flex';
            primaryAction.innerHTML = '<span>➕</span>Ajouter un message';
            primaryAction.onclick = showAddDiscordMessageForm;
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
        const response = await fetch(`${API_BASE_URL}/note`);

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

// Gestion des messages Discord
let discordMessages = [];
let messageToDelete = null;

function showAddDiscordMessageForm() {
    document.getElementById('add-discord-message-modal').style.display = 'block';
    document.getElementById('discord-message-link').focus();
}

function closeAddDiscordMessageModal() {
    const modal = document.getElementById('add-discord-message-modal');
    const form = document.getElementById('discord-message-form');
    
    modal.style.display = 'none';
    form.reset();
    
    // Reset button state
    const btn = document.getElementById('save-discord-message-btn');
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.loading').style.display = 'none';
}

async function saveDiscordMessageFromLink(messageLink) {
    const btn = document.getElementById('save-discord-message-btn');
    
    // Set loading state
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.loading').style.display = 'inline';
    
    try {
        const response = await fetch(`${API_BASE_URL}/discord-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messageLink })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erreur lors de la sauvegarde');
        }
        
        showSuccess('Message Discord sauvegardé avec succès!');
        closeAddDiscordMessageModal();
        
        // Reload the messages to show the new one
        await loadDiscordMessages();
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showError(error.message || 'Erreur lors de la sauvegarde');
        
        // Reset button state
        btn.disabled = false;
        btn.querySelector('.btn-text').style.display = 'inline';
        btn.querySelector('.loading').style.display = 'none';
    }
}

async function loadDiscordMessages() {
    const loading = document.getElementById('discord-messages-loading');
    const grid = document.getElementById('discord-messages-grid');
    const empty = document.getElementById('discord-messages-empty');

    if (loading) loading.style.display = 'flex';
    if (grid) grid.style.display = 'none';
    if (empty) empty.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/discord-message`);
        const data = await response.json();

        if (response.ok) {
            discordMessages = data;
            displayDiscordMessages();
        } else {
            throw new Error(data.error || 'Erreur lors du chargement des messages');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des messages Discord:', error);
        showError('Impossible de charger les messages Discord');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function displayDiscordMessages() {
    const grid = document.getElementById('discord-messages-grid');
    const empty = document.getElementById('discord-messages-empty');
    
    if (discordMessages.length === 0) {
        empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    
    const filteredMessages = filterDiscordMessages();
    grid.innerHTML = filteredMessages.map(message => createDiscordMessageCard(message)).join('');
}

function createDiscordMessageCard(message) {
    const date = new Date(message.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const truncatedText = message.messageText 
        ? (message.messageText.length > 100 
            ? message.messageText.substring(0, 100) + '...' 
            : message.messageText)
        : 'Aucun texte';

    return `
        <div class="note-card">
            <div class="note-header">
                <div class="note-meta">
                    <span class="note-date">💬 ${date}</span>
                </div>
                <div class="note-actions">
                    <button class="btn-icon" onclick="openDiscordMessage('${message.uuid}')" title="Ouvrir le lien">
                        <span>🔗</span>
                    </button>
                    <button class="btn-icon btn-danger" onclick="showDeleteDiscordMessageModal('${message.uuid}')" title="Supprimer">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
            <div class="note-content">
                <p class="note-text">${truncatedText}</p>
                ${message.messageImage ? `<div class="message-image-preview">
                    <img src="${message.messageImage}" alt="Image du message" onclick="openImageFullscreen('${message.messageImage}')" style="max-width: 100%; height: auto; border-radius: 8px; cursor: pointer; margin-top: 10px;">
                </div>` : ''}
            </div>
            <div class="note-footer">
                <span class="note-uuid">UUID: ${message.uuid}</span>
            </div>
        </div>
    `;
}

function filterDiscordMessages() {
    const searchTerm = document.getElementById('search-discord-messages').value.toLowerCase();
    
    return discordMessages.filter(message => {
        const matchesSearch = !searchTerm || 
            (message.messageText && message.messageText.toLowerCase().includes(searchTerm)) ||
            message.uuid.toLowerCase().includes(searchTerm);
        
        return matchesSearch;
    });
}

function openDiscordMessage(uuid) {
    const message = discordMessages.find(m => m.uuid === uuid);
    if (message && message.messageLink) {
        window.open(message.messageLink, '_blank');
    }
}

function openImageFullscreen(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 8px;';
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.onclick = () => document.body.removeChild(modal);
}

function showDeleteDiscordMessageModal(uuid) {
    const message = discordMessages.find(m => m.uuid === uuid);
    if (!message) return;

    messageToDelete = message;
    
    const modal = document.getElementById('delete-discord-message-modal');
    const preview = document.getElementById('delete-discord-message-preview');
    
    preview.innerHTML = `
        <div class="message-preview-content">
            <strong>UUID:</strong> ${message.uuid}<br>
            <strong>Date:</strong> ${new Date(message.createdAt).toLocaleDateString('fr-FR')}<br>
            <strong>Texte:</strong> ${message.messageText ? message.messageText.substring(0, 100) + (message.messageText.length > 100 ? '...' : '') : 'Aucun texte'}
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeDeleteDiscordMessageModal() {
    document.getElementById('delete-discord-message-modal').style.display = 'none';
    messageToDelete = null;
}

async function confirmDeleteDiscordMessage() {
    if (!messageToDelete) return;

    const btn = document.getElementById('confirm-delete-discord-message-btn');
    const btnText = btn.querySelector('.btn-text');
    const loading = btn.querySelector('.loading');

    btnText.style.display = 'none';
    loading.style.display = 'inline';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/discord-message/${messageToDelete.uuid}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Message Discord supprimé avec succès');
            closeDeleteDiscordMessageModal();
            await loadDiscordMessages(); // Recharger la liste
        } else {
            throw new Error(data.error || 'Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de supprimer le message');
    } finally {
        btnText.style.display = 'inline';
        loading.style.display = 'none';
        btn.disabled = false;
    }
}

function refreshDiscordMessages() {
    loadDiscordMessages();
}

// Recherche en temps réel pour les messages Discord
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-discord-messages');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (currentModule === 'discord-messages') {
                displayDiscordMessages();
            }
        });
    }
    
    // Event listener pour le formulaire d'ajout de message Discord
    const discordMessageForm = document.getElementById('discord-message-form');
    if (discordMessageForm) {
        discordMessageForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const messageLink = document.getElementById('discord-message-link').value.trim();
            
            if (!messageLink) {
                showNotification('Veuillez entrer un lien de message Discord', 'error');
                return;
            }
            
            // Validation basique du format de lien Discord
            if (!messageLink.includes('discord.com/channels/')) {
                showNotification('Format de lien Discord invalide', 'error');
                return;
            }
            
            await saveDiscordMessageFromLink(messageLink);
        });
    }
});