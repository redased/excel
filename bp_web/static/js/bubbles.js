/**
 * Bubbles Consolidation - Interactive bubble-based Excel consolidation
 */

// Global state for bubbles
let bubbleData = {
    responsables: []
};

let droppedItems = [];

// Initialize bubbles functionality
document.addEventListener('DOMContentLoaded', function () {
    initBubbleUpload();
    initDropZone();
});

// ============================================
// FILE UPLOAD & PARSING
// ============================================

function initBubbleUpload() {
    const folderZone = document.getElementById('folder-drop-zone');
    const fileInput = document.getElementById('bubble-files');

    if (!folderZone || !fileInput) return;

    // Click to upload
    folderZone.addEventListener('click', () => fileInput.click());

    // Drag & drop
    folderZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        folderZone.classList.add('dragover');
    });

    folderZone.addEventListener('dragleave', () => {
        folderZone.classList.remove('dragover');
    });

    folderZone.addEventListener('drop', (e) => {
        e.preventDefault();
        folderZone.classList.remove('dragover');
        handleFileDrop(e.dataTransfer);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files);
    });
}

async function handleFileDrop(dataTransfer) {
    const items = dataTransfer.items;
    const files = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                files.push(file);
            }
        }
    }

    if (files.length > 0) {
        await parseFiles(files);
    }
}

async function handleFileSelect(fileList) {
    const files = Array.from(fileList).filter(f =>
        f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );

    if (files.length > 0) {
        await parseFiles(files);
    }
}

async function parseFiles(files) {
    // Group files by folder (responsable)
    const groupedFiles = {};

    files.forEach(file => {
        // Try to extract responsable from path
        const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
        const responsable = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Responsable';

        if (!groupedFiles[responsable]) {
            groupedFiles[responsable] = [];
        }
        groupedFiles[responsable].push(file);
    });

    // Upload and parse files
    const formData = new FormData();
    files.forEach((file, index) => {
        formData.append('files', file);
        formData.append('paths', file.webkitRelativePath || file.name);
    });

    try {
        const response = await fetch('/api/parse-bubble-files/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const data = await response.json();
            bubbleData = data;
            renderBubbleTree();
        } else {
            // Fallback: create structure from file names
            createLocalBubbleStructure(groupedFiles);
        }
    } catch (error) {
        console.error('Error parsing files:', error);
        createLocalBubbleStructure(groupedFiles);
    }
}

function createLocalBubbleStructure(groupedFiles) {
    bubbleData.responsables = [];

    for (const [responsable, files] of Object.entries(groupedFiles)) {
        const respData = {
            id: 'resp_' + Date.now() + Math.random().toString(36).substr(2, 9),
            name: responsable.replace(/_/g, ' '),
            sites: []
        };

        files.forEach((file, index) => {
            const siteName = file.name.replace(/\.(xlsx|xls)$/i, '').replace(/_/g, ' ');
            respData.sites.push({
                id: 'site_' + Date.now() + '_' + index,
                name: siteName,
                filename: file.name,
                file: file,
                sheets: [
                    { id: 'sh_1_' + index, name: 'Branche', columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
                    { id: 'sh_2_' + index, name: 'Coût Service', columns: ['A', 'B', 'C', 'D', 'E'] }
                ]
            });
        });

        bubbleData.responsables.push(respData);
    }

    renderBubbleTree();
}

// ============================================
// BUBBLE TREE RENDERING
// ============================================

function renderBubbleTree() {
    const container = document.getElementById('bubble-tree');
    if (!container) return;

    if (bubbleData.responsables.length === 0) {
        container.innerHTML = `
            <div class="bubble-empty-state">
                <span>📂</span>
                <p>Chargez un dossier pour voir les bulles</p>
            </div>
        `;
        return;
    }

    let html = '';

    bubbleData.responsables.forEach(resp => {
        html += `
            <div class="bubble-group" data-id="${resp.id}">
                <div class="bubble-group-header">
                    <button class="bubble-toggle" onclick="toggleBubbleGroup(this)">▼</button>
                    <div class="bubble bubble-responsable" 
                         draggable="true" 
                         ondragstart="handleDragStart(event, 'responsable', '${resp.id}')"
                         ondragend="handleDragEnd(event)">
                        👤 ${resp.name}
                        <span class="bubble-count">${resp.sites.length} sites</span>
                    </div>
                </div>
                <div class="bubble-children">
        `;

        resp.sites.forEach(site => {
            html += `
                <div class="bubble-group" data-id="${site.id}">
                    <div class="bubble-group-header">
                        <button class="bubble-toggle" onclick="toggleBubbleGroup(this)">▼</button>
                        <div class="bubble bubble-site" 
                             draggable="true"
                             ondragstart="handleDragStart(event, 'site', '${site.id}', '${resp.id}')"
                             ondragend="handleDragEnd(event)">
                            📄 ${site.name}
                        </div>
                    </div>
                    <div class="bubble-children">
            `;

            site.sheets.forEach(sheet => {
                html += `
                    <div class="bubble-group" data-id="${sheet.id}">
                        <div class="bubble-group-header">
                            <button class="bubble-toggle" onclick="toggleBubbleGroup(this)">▼</button>
                            <div class="bubble bubble-sheet" 
                                 draggable="true"
                                 ondragstart="handleDragStart(event, 'sheet', '${sheet.id}', '${site.id}')"
                                 ondragend="handleDragEnd(event)"
                                 onclick="showColumnSelector(event, '${sheet.id}')">
                                📋 ${sheet.name}
                            </div>
                        </div>
                        <div class="bubble-children">
                            ${sheet.columns.map(col => `
                                <div class="bubble bubble-column" 
                                     draggable="true"
                                     ondragstart="handleDragStart(event, 'column', '${sheet.id}_${col}', '${sheet.id}')"
                                     ondragend="handleDragEnd(event)">
                                    ${col}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function toggleBubbleGroup(button) {
    button.classList.toggle('collapsed');
    const children = button.closest('.bubble-group').querySelector('.bubble-children');
    if (children) {
        children.classList.toggle('hidden');
    }
}

// ============================================
// DRAG & DROP
// ============================================

let draggedData = null;

function handleDragStart(event, type, id, parentId = null) {
    event.target.classList.add('dragging');
    draggedData = { type, id, parentId };
    event.dataTransfer.setData('text/plain', JSON.stringify(draggedData));
    event.dataTransfer.effectAllowed = 'copy';
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
    draggedData = null;
}

function initDropZone() {
    const dropZone = document.getElementById('design-drop-zone');
    if (!dropZone) return;

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        if (draggedData) {
            addDroppedItem(draggedData);
        }
    });
}

function addDroppedItem(data) {
    // Find the actual item data
    let itemInfo = findItemById(data.type, data.id, data.parentId);
    if (!itemInfo) return;

    // Check if already added
    if (droppedItems.find(i => i.id === data.id)) {
        return;
    }

    droppedItems.push({
        ...data,
        info: itemInfo
    });

    renderDroppedItems();
    updateGenerateButton();
}

function findItemById(type, id, parentId) {
    for (const resp of bubbleData.responsables) {
        if (type === 'responsable' && resp.id === id) {
            return { name: resp.name, type: 'responsable', sites: resp.sites.length };
        }
        for (const site of resp.sites) {
            if (type === 'site' && site.id === id) {
                return { name: site.name, type: 'site', responsable: resp.name, sheets: site.sheets.length };
            }
            for (const sheet of site.sheets) {
                if (type === 'sheet' && sheet.id === id) {
                    return { name: sheet.name, type: 'sheet', site: site.name, responsable: resp.name };
                }
            }
        }
    }
    return null;
}

function renderDroppedItems() {
    const container = document.getElementById('dropped-items');
    const placeholder = document.getElementById('drop-placeholder');

    if (droppedItems.length === 0) {
        container.innerHTML = '';
        placeholder.classList.remove('hidden');
        return;
    }

    placeholder.classList.add('hidden');

    let html = '';
    droppedItems.forEach((item, index) => {
        const iconClass = item.type;
        const icon = item.type === 'responsable' ? '👤' :
            item.type === 'site' ? '📄' : '📋';

        html += `
            <div class="dropped-item" data-index="${index}">
                <div class="dropped-item-info">
                    <div class="dropped-item-icon ${iconClass}">${icon}</div>
                    <div class="dropped-item-details">
                        <h4>${item.info.name}</h4>
                        <span>${getItemDescription(item)}</span>
                    </div>
                </div>
                <button class="dropped-item-remove" onclick="removeDroppedItem(${index})">✕</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function getItemDescription(item) {
    switch (item.type) {
        case 'responsable':
            return `${item.info.sites} sites`;
        case 'site':
            return `${item.info.responsable} • ${item.info.sheets} feuilles`;
        case 'sheet':
            return `${item.info.responsable} → ${item.info.site}`;
        default:
            return '';
    }
}

function removeDroppedItem(index) {
    droppedItems.splice(index, 1);
    renderDroppedItems();
    updateGenerateButton();
}

function clearDesignZone() {
    droppedItems = [];
    renderDroppedItems();
    updateGenerateButton();
}

function updateGenerateButton() {
    const btn = document.getElementById('btn-generate-bubbles');
    if (btn) {
        btn.disabled = droppedItems.length === 0;
    }
}

// ============================================
// EXCEL GENERATION
// ============================================

async function generateBubbleExcel() {
    if (droppedItems.length === 0) return;

    const btn = document.getElementById('btn-generate-bubbles');
    btn.disabled = true;
    btn.textContent = '⏳ Génération...';

    try {
        const formData = new FormData();
        formData.append('structure', JSON.stringify(droppedItems));
        formData.append('bubbleData', JSON.stringify(bubbleData));

        // Add actual files
        bubbleData.responsables.forEach(resp => {
            resp.sites.forEach(site => {
                if (site.file) {
                    formData.append('files', site.file, site.filename);
                }
            });
        });

        const response = await fetch('/api/generate-bubble-excel/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Consolidation_Bulles.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert('Erreur lors de la génération');
        }
    } catch (error) {
        console.error('Error generating Excel:', error);
        alert('Erreur: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '📥 Générer le fichier Excel';
    }
}

// ============================================
// UTILITIES
// ============================================

function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return '';
}

function showColumnSelector(event, sheetId) {
    event.stopPropagation();
    // TODO: Implement column selection modal
    console.log('Show column selector for sheet:', sheetId);
}
