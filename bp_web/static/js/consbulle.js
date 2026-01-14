/**
 * Consolidation par Bulle V2 - Enhanced wizard with SQLite persistence
 * Features: folder drag-drop, auto sheet detection, format preservation
 */

// State
let consBulleData = {
    configId: null,
    configName: 'Nouvelle Configuration',
    outputFilename: 'Consolidation',
    responsables: [],
    selectedResponsable: null,
    selectedSite: null,
    allSheets: [],          // All unique sheets across files
    selectedSheets: [],      // User-selected sheets
    savedConfigs: []
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('ConsBulle V2 loaded');
    initConsBulle();
    loadSavedConfigs();
});

function initConsBulle() {
    renderResponsables();
    renderSites();
    renderSheets();
    initFolderDropZone();
}

// ============================================
// FOLDER DRAG & DROP
// ============================================

function initFolderDropZone() {
    const dropZone = document.getElementById('consbulle-folder-drop');
    if (!dropZone) {
        console.log('ConsBulle folder drop zone not found');
        return;
    }

    console.log('Initializing folder drop zone');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');

        console.log('Files dropped on ConsBulle zone');
        await handleFolderDrop(e.dataTransfer);
    });

    // Also support file input
    const fileInput = document.getElementById('consbulle-files');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            await handleFileInput(e.target.files);
        });

        dropZone.addEventListener('click', () => fileInput.click());
    }
}

async function handleFolderDrop(dataTransfer) {
    const items = dataTransfer.items;
    const filesByFolder = {};
    const promises = [];

    console.log('Processing', items.length, 'items');

    // Try webkitGetAsEntry first for folder support
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.webkitGetAsEntry) {
            const entry = item.webkitGetAsEntry();
            if (entry) {
                console.log('Entry:', entry.name, 'isDirectory:', entry.isDirectory);
                promises.push(processEntry(entry, filesByFolder, entry.name));
            }
        } else if (item.kind === 'file') {
            // Fallback for browsers without webkitGetAsEntry
            const file = item.getAsFile();
            if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                if (!filesByFolder['Responsable']) {
                    filesByFolder['Responsable'] = [];
                }
                filesByFolder['Responsable'].push(file);
            }
        }
    }

    // Wait for all directory reading to complete
    await Promise.all(promises);

    // If still no files, try direct files from dataTransfer
    if (Object.keys(filesByFolder).length === 0) {
        const files = dataTransfer.files;
        console.log('Fallback: checking', files.length, 'files from dataTransfer');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log('File:', file.name, 'webkitRelativePath:', file.webkitRelativePath);
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const path = file.webkitRelativePath || file.name;
                const parts = path.split('/');
                const folderName = parts.length > 1 ? parts[0] : 'Responsable';

                if (!filesByFolder[folderName]) {
                    filesByFolder[folderName] = [];
                }
                filesByFolder[folderName].push(file);
            }
        }
    }

    console.log('Files by folder:', filesByFolder);

    if (Object.keys(filesByFolder).length > 0) {
        await processDroppedFiles(filesByFolder);
    } else {
        alert('Aucun fichier Excel trouvé. Glissez des fichiers .xlsx ou .xls\n\nAstuce: Utilisez le bouton de sélection de fichiers pour choisir un dossier.');
    }
}

// Recursively process directory entries
async function processEntry(entry, filesByFolder, folderName) {
    if (entry.isFile) {
        return new Promise((resolve) => {
            entry.file((file) => {
                console.log('Found file:', file.name, 'in folder:', folderName);
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    if (!filesByFolder[folderName]) {
                        filesByFolder[folderName] = [];
                    }
                    filesByFolder[folderName].push(file);
                }
                resolve();
            }, (err) => {
                console.error('Error reading file:', err);
                resolve();
            });
        });
    } else if (entry.isDirectory) {
        return new Promise((resolve) => {
            const reader = entry.createReader();
            reader.readEntries(async (entries) => {
                console.log('Reading directory:', entry.name, 'with', entries.length, 'entries');
                const subPromises = [];
                for (const subEntry of entries) {
                    subPromises.push(processEntry(subEntry, filesByFolder, entry.name));
                }
                await Promise.all(subPromises);
                resolve();
            }, (err) => {
                console.error('Error reading directory:', err);
                resolve();
            });
        });
    }
}



async function handleFileInput(fileList) {
    const filesByFolder = {};

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            const folderName = parts.length > 1 ? parts[parts.length - 2] : 'Responsable';

            if (!filesByFolder[folderName]) {
                filesByFolder[folderName] = [];
            }
            filesByFolder[folderName].push(file);
        }
    }

    if (Object.keys(filesByFolder).length > 0) {
        await processDroppedFiles(filesByFolder);
    }
}

async function processDroppedFiles(filesByFolder) {
    console.log('Processing files by folder:', filesByFolder);

    // Parse sheets from files first
    const allFiles = [];
    Object.values(filesByFolder).forEach(files => allFiles.push(...files));

    // Get all sheets
    const formData = new FormData();
    allFiles.forEach(file => formData.append('files', file));

    try {
        const response = await fetch('/api/consbulle/parse-sheets/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const data = await response.json();
            consBulleData.allSheets = data.all_sheets || [];
            consBulleData.selectedSheets = [...consBulleData.allSheets]; // Select all by default

            // Create responsables and sites from folders
            for (const [folderName, files] of Object.entries(filesByFolder)) {
                // Check if responsable already exists
                let resp = consBulleData.responsables.find(r => r.name === folderName);

                if (!resp) {
                    resp = {
                        id: 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        name: folderName.replace(/_/g, ' '),
                        sites: []
                    };
                    consBulleData.responsables.push(resp);
                }

                // Add files as sites
                files.forEach((file, index) => {
                    const siteName = file.name.replace(/\.(xlsx|xls)$/i, '').replace(/_/g, ' ');
                    const fileSheets = data.file_sheets[file.name] || [];

                    resp.sites.push({
                        id: 'site_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 5),
                        name: siteName,
                        filename: file.name,
                        file: file,
                        detected_sheets: fileSheets
                    });
                });
            }

            renderResponsables();
            renderSites();
            renderSheets();

            // Auto-select first responsable
            if (consBulleData.responsables.length > 0) {
                selectResponsable(consBulleData.responsables[0].id);
            }
        }
    } catch (error) {
        console.error('Error parsing sheets:', error);
        // Create structure anyway
        for (const [folderName, files] of Object.entries(filesByFolder)) {
            const resp = {
                id: 'resp_' + Date.now(),
                name: folderName.replace(/_/g, ' '),
                sites: []
            };

            files.forEach((file, index) => {
                resp.sites.push({
                    id: 'site_' + Date.now() + '_' + index,
                    name: file.name.replace(/\.(xlsx|xls)$/i, '').replace(/_/g, ' '),
                    filename: file.name,
                    file: file,
                    detected_sheets: []
                });
            });

            consBulleData.responsables.push(resp);
        }

        renderResponsables();
        renderSites();
    }
}

// ============================================
// RESPONSABLES MANAGEMENT
// ============================================

function addResponsable() {
    const name = prompt('Nom du responsable:');
    if (!name) return;

    const resp = {
        id: 'resp_' + Date.now(),
        name: name,
        sites: []
    };

    consBulleData.responsables.push(resp);
    renderResponsables();
    selectResponsable(resp.id);
}

function renderResponsables() {
    const container = document.getElementById('responsables-list');
    if (!container) return;

    if (consBulleData.responsables.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>👤</span>
                <p>Glissez un dossier ou cliquez "Ajouter"</p>
            </div>
        `;
        return;
    }

    let html = '';
    consBulleData.responsables.forEach(resp => {
        const isSelected = consBulleData.selectedResponsable === resp.id;
        html += `
            <div class="resp-item ${isSelected ? 'selected' : ''}" onclick="selectResponsable('${resp.id}')">
                <span class="resp-item-icon">👤</span>
                <div class="resp-item-info">
                    <div class="resp-item-name">${resp.name}</div>
                    <div class="resp-item-count">${resp.sites.length} site(s)</div>
                </div>
                <div class="resp-item-actions">
                    <button class="resp-item-btn" onclick="event.stopPropagation(); editResponsable('${resp.id}')" title="Renommer">✏️</button>
                    <button class="resp-item-btn" onclick="event.stopPropagation(); removeResponsable('${resp.id}')" title="Supprimer">🗑️</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function selectResponsable(id) {
    consBulleData.selectedResponsable = id;
    consBulleData.selectedSite = null;
    renderResponsables();
    renderSites();
    document.getElementById('btn-add-site').disabled = false;
}

function editResponsable(id) {
    const resp = consBulleData.responsables.find(r => r.id === id);
    if (!resp) return;

    const newName = prompt('Nouveau nom:', resp.name);
    if (newName) {
        resp.name = newName;
        renderResponsables();
    }
}

function removeResponsable(id) {
    if (!confirm('Supprimer ce responsable et tous ses sites?')) return;

    consBulleData.responsables = consBulleData.responsables.filter(r => r.id !== id);
    if (consBulleData.selectedResponsable === id) {
        consBulleData.selectedResponsable = null;
        consBulleData.selectedSite = null;
        document.getElementById('btn-add-site').disabled = true;
    }
    renderResponsables();
    renderSites();
}

// ============================================
// SITES MANAGEMENT
// ============================================

function addSite() {
    if (!consBulleData.selectedResponsable) {
        alert('Veuillez d\'abord sélectionner un responsable');
        return;
    }

    const name = prompt('Nom du site:');
    if (!name) return;

    const resp = consBulleData.responsables.find(r => r.id === consBulleData.selectedResponsable);
    if (!resp) return;

    const site = {
        id: 'site_' + Date.now(),
        name: name,
        filename: null,
        file: null,
        detected_sheets: []
    };

    resp.sites.push(site);
    renderResponsables();
    renderSites();
    selectSite(resp.id, site.id);
}

function renderSites() {
    const container = document.getElementById('sites-list');
    if (!container) return;

    if (!consBulleData.selectedResponsable) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📄</span>
                <p>Sélectionnez un responsable</p>
            </div>
        `;
        return;
    }

    const resp = consBulleData.responsables.find(r => r.id === consBulleData.selectedResponsable);
    if (!resp || resp.sites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📄</span>
                <p>Aucun site. Glissez des fichiers ou cliquez "Ajouter"</p>
            </div>
        `;
        return;
    }

    let html = '';
    resp.sites.forEach(site => {
        const isSelected = consBulleData.selectedSite === site.id;
        html += `
            <div class="site-item ${site.file ? 'has-file' : ''} ${isSelected ? 'selected' : ''}" 
                 onclick="selectSite('${resp.id}', '${site.id}')">
                <span class="site-item-icon">📄</span>
                <div class="site-item-info">
                    <div class="site-item-name">${site.name}</div>
                    <div class="site-item-file">${site.filename || 'Aucun fichier'}</div>
                    ${site.detected_sheets.length > 0 ? `<div class="site-item-config">📋 ${site.detected_sheets.length} feuille(s)</div>` : ''}
                </div>
                <button class="resp-item-btn" onclick="event.stopPropagation(); editSite('${resp.id}', '${site.id}')" title="Renommer">✏️</button>
                <label class="site-item-upload" onclick="event.stopPropagation();">
                    📂
                    <input type="file" accept=".xlsx,.xls" onchange="handleSiteFile(event, '${resp.id}', '${site.id}')">
                </label>
                <button class="resp-item-btn" onclick="event.stopPropagation(); removeSite('${resp.id}', '${site.id}')" title="Supprimer">🗑️</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function selectSite(respId, siteId) {
    consBulleData.selectedSite = siteId;
    renderSites();
}

function editSite(respId, siteId) {
    const resp = consBulleData.responsables.find(r => r.id === respId);
    if (!resp) return;

    const site = resp.sites.find(s => s.id === siteId);
    if (!site) return;

    const newName = prompt('Nouveau nom du site:', site.name);
    if (newName) {
        site.name = newName;
        renderSites();
    }
}

async function handleSiteFile(event, respId, siteId) {
    const file = event.target.files[0];
    if (!file) return;

    const resp = consBulleData.responsables.find(r => r.id === respId);
    if (!resp) return;

    const site = resp.sites.find(s => s.id === siteId);
    if (!site) return;

    site.file = file;
    site.filename = file.name;

    // Parse sheets from this file
    const formData = new FormData();
    formData.append('files', file);

    try {
        const response = await fetch('/api/consbulle/parse-sheets/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const data = await response.json();
            site.detected_sheets = data.file_sheets[file.name] || [];

            // Update all sheets list
            consBulleData.allSheets = [...new Set([
                ...consBulleData.allSheets,
                ...site.detected_sheets
            ])];
            consBulleData.selectedSheets = [...consBulleData.allSheets];

            renderSheets();
        }
    } catch (error) {
        console.error('Error parsing sheets:', error);
    }

    renderResponsables();
    renderSites();
}

function removeSite(respId, siteId) {
    const resp = consBulleData.responsables.find(r => r.id === respId);
    if (!resp) return;

    resp.sites = resp.sites.filter(s => s.id !== siteId);
    if (consBulleData.selectedSite === siteId) {
        consBulleData.selectedSite = null;
    }
    renderResponsables();
    renderSites();
}

// ============================================
// SHEETS MANAGEMENT
// ============================================

function renderSheets() {
    const container = document.getElementById('sheets-list');
    if (!container) return;

    if (consBulleData.allSheets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📋</span>
                <p>Chargez des fichiers Excel pour voir les feuilles</p>
            </div>
        `;
        return;
    }

    let html = '<div class="sheets-grid">';
    consBulleData.allSheets.forEach(sheet => {
        const isSelected = consBulleData.selectedSheets.includes(sheet);
        html += `
            <label class="sheet-checkbox ${isSelected ? 'selected' : ''}" onclick="toggleSheet('${sheet}')">
                <input type="checkbox" ${isSelected ? 'checked' : ''}>
                <span>📋 ${sheet}</span>
            </label>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

function toggleSheet(sheetName) {
    const index = consBulleData.selectedSheets.indexOf(sheetName);
    if (index > -1) {
        consBulleData.selectedSheets.splice(index, 1);
    } else {
        consBulleData.selectedSheets.push(sheetName);
    }
    renderSheets();
}

function selectAllSheets() {
    consBulleData.selectedSheets = [...consBulleData.allSheets];
    renderSheets();
}

function deselectAllSheets() {
    consBulleData.selectedSheets = [];
    renderSheets();
}

// ============================================
// PREVIEW & GENERATION
// ============================================

function previewConsBulle() {
    const container = document.getElementById('consbulle-preview');
    if (!container) return;

    if (consBulleData.responsables.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📊</span>
                <p>Ajoutez des responsables et des sites</p>
            </div>
        `;
        return;
    }

    const outputName = document.getElementById('cb-output-filename')?.value || 'Consolidation';
    consBulleData.outputFilename = outputName;

    let html = '<div class="preview-tree">';
    html += `<strong>📊 ${outputName}.xlsx</strong>`;
    html += `<div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
        Feuilles sélectionnées: ${consBulleData.selectedSheets.length > 0 ? consBulleData.selectedSheets.join(', ') : 'Toutes'}
    </div>`;

    consBulleData.responsables.forEach(resp => {
        html += `<div class="preview-tree-item resp">👤 <strong>${resp.name}</strong> (${resp.sites.length} sites)</div>`;
        resp.sites.forEach(site => {
            const status = site.file ? '✅' : '⚠️';
            html += `<div class="preview-tree-item site" style="margin-left: 24px;">
                ${status} 📄 ${site.name}
                ${site.filename ? `<span style="color: #64748b;">(${site.filename})</span>` : ''}
                ${site.detected_sheets.length > 0 ? `<div style="font-size: 11px; color: #64748b; margin-left: 20px;">Feuilles: ${site.detected_sheets.join(', ')}</div>` : ''}
            </div>`;
        });
    });

    html += '</div>';
    container.innerHTML = html;
}

async function generateConsBulle() {
    // Update output filename
    const outputName = document.getElementById('cb-output-filename')?.value || 'Consolidation';
    consBulleData.outputFilename = outputName;

    // Validate
    if (consBulleData.responsables.length === 0) {
        alert('Veuillez ajouter au moins un responsable');
        return;
    }

    // Check for files
    let hasFiles = false;
    consBulleData.responsables.forEach(resp => {
        resp.sites.forEach(site => {
            if (site.file) hasFiles = true;
        });
    });

    if (!hasFiles) {
        alert('Veuillez charger au moins un fichier Excel');
        return;
    }

    const btn = document.getElementById('btn-generate-consbulle');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Génération...';
    }

    try {
        const formData = new FormData();

        // Prepare config
        const config = {
            output_filename: consBulleData.outputFilename,
            selected_sheets: consBulleData.selectedSheets,
            responsables: consBulleData.responsables.map(r => ({
                name: r.name,
                sites: r.sites.map(s => ({
                    name: s.name,
                    filename: s.filename
                }))
            }))
        };

        formData.append('config', JSON.stringify(config));

        // Add files
        consBulleData.responsables.forEach(resp => {
            resp.sites.forEach(site => {
                if (site.file) {
                    formData.append('files', site.file, site.filename);
                    formData.append('file_mapping', JSON.stringify({
                        filename: site.filename,
                        site_name: site.name,
                        responsable_name: resp.name
                    }));
                }
            });
        });

        const response = await fetch('/api/consbulle/generate/', {
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
            a.download = `${consBulleData.outputFilename}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            const error = await response.json();
            alert('Erreur: ' + (error.error || 'Génération échouée'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur: ' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '📥 Générer Excel';
        }
    }
}

// ============================================
// SAVE/LOAD CONFIGURATIONS
// ============================================

async function loadSavedConfigs() {
    try {
        const response = await fetch('/api/consbulle/configs/', {
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const data = await response.json();
            consBulleData.savedConfigs = data.configs || [];
            renderSavedConfigs();
        }
    } catch (error) {
        console.error('Error loading configs:', error);
    }
}

function renderSavedConfigs() {
    const container = document.getElementById('saved-configs-list');
    if (!container) return;

    if (consBulleData.savedConfigs.length === 0) {
        container.innerHTML = '<p style="color: #64748b; font-size: 13px;">Aucune configuration sauvegardée</p>';
        return;
    }

    let html = '';
    consBulleData.savedConfigs.forEach(config => {
        html += `
            <div class="saved-config-item" onclick="loadConfig(${config.id})">
                <span>📁 ${config.name}</span>
                <span style="color: #64748b; font-size: 11px;">${config.responsables_count} resp.</span>
                <button onclick="event.stopPropagation(); deleteConfig(${config.id})" class="resp-item-btn">🗑️</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function saveCurrentConfig() {
    const name = prompt('Nom de la configuration:', consBulleData.configName);
    if (!name) return;

    try {
        const response = await fetch('/api/consbulle/configs/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                name: name,
                output_filename: consBulleData.outputFilename,
                selected_sheets: consBulleData.selectedSheets
            })
        });

        if (response.ok) {
            alert('✅ Configuration sauvegardée!');
            loadSavedConfigs();
        }
    } catch (error) {
        console.error('Error saving config:', error);
        alert('Erreur lors de la sauvegarde');
    }
}

async function loadConfig(configId) {
    try {
        const response = await fetch(`/api/consbulle/configs/${configId}/`, {
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const data = await response.json();
            const config = data.config;

            consBulleData.configId = config.id;
            consBulleData.configName = config.name;
            consBulleData.outputFilename = config.output_filename;
            consBulleData.selectedSheets = config.selected_sheets || [];

            // Update UI
            const outputInput = document.getElementById('cb-output-filename');
            if (outputInput) outputInput.value = config.output_filename;

            renderResponsables();
            renderSites();
            renderSheets();

            alert(`✅ Configuration "${config.name}" chargée!`);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

async function deleteConfig(configId) {
    if (!confirm('Supprimer cette configuration?')) return;

    try {
        const response = await fetch(`/api/consbulle/configs/${configId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            loadSavedConfigs();
        }
    } catch (error) {
        console.error('Error deleting config:', error);
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
