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
    selectedSheets: [],      // User-selected sheets (for auto mode)
    sheetMode: 'auto',       // 'auto' or 'manual'
    sheetRanges: [],         // Manual ranges: [{sheet, colStart, colEnd, rowStart, rowEnd}]
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
                // Skip folders with no files
                if (!files || files.length === 0) {
                    console.log('Skipping empty folder:', folderName);
                    continue;
                }

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
        console.log('Creating structure without API - files will still work');

        // Create structure anyway from local files
        for (const [folderName, files] of Object.entries(filesByFolder)) {
            // Skip empty folders or folders with only temp files
            const validFiles = files.filter(f => !f.name.startsWith('~$'));
            if (validFiles.length === 0) continue;

            // Check if responsable already exists
            let resp = consBulleData.responsables.find(r => r.name === folderName.replace(/_/g, ' '));

            if (!resp) {
                resp = {
                    id: 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    name: folderName.replace(/_/g, ' '),
                    sites: []
                };
                consBulleData.responsables.push(resp);
            }

            validFiles.forEach((file, index) => {
                resp.sites.push({
                    id: 'site_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 5),
                    name: file.name.replace(/\.(xlsx|xls)$/i, '').replace(/_/g, ' '),
                    filename: file.name,
                    file: file,
                    detected_sheets: []
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

    // Check if we have any files loaded
    let hasFiles = false;
    consBulleData.responsables.forEach(resp => {
        if (resp.sites && resp.sites.length > 0) hasFiles = true;
    });

    if (consBulleData.allSheets.length === 0) {
        if (hasFiles) {
            // Files loaded but no sheets detected (API failed)
            container.innerHTML = `
                <div class="empty-state" style="text-align: left; padding: 16px;">
                    <p style="margin-bottom: 12px;">⚠️ <strong>Feuilles non détectées automatiquement</strong></p>
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">
                        L'API de détection n'est pas disponible. Vous avez 2 options :
                    </p>
                    <ul style="color: #64748b; font-size: 13px; margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 4px;">Utilisez le mode <strong>✏️ Manuel</strong> pour définir les feuilles et plages</li>
                        <li>Ou cliquez <button onclick="generateWithAllSheets()" class="btn btn-sm btn-primary" style="font-size: 11px; padding: 4px 8px;">📥 Générer toutes les feuilles</button></li>
                    </ul>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📋</span>
                    <p>Chargez des fichiers Excel pour voir les feuilles</p>
                </div>
            `;
        }
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
// SHEET MODE & RANGES (Manual Configuration)
// ============================================

function toggleSheetMode(mode) {
    consBulleData.sheetMode = mode;
    const autoDiv = document.getElementById('sheets-mode-auto');
    const manualDiv = document.getElementById('sheets-mode-manual');

    if (autoDiv && manualDiv) {
        if (mode === 'auto') {
            autoDiv.style.display = 'block';
            manualDiv.style.display = 'none';
        } else {
            autoDiv.style.display = 'none';
            manualDiv.style.display = 'block';
        }
    }

    // Update mode option styling
    document.querySelectorAll('.mode-option').forEach(label => {
        const input = label.querySelector('input');
        if (input && input.checked) {
            label.style.borderColor = '#3B82F6';
            label.style.background = '#EFF6FF';
        } else {
            label.style.borderColor = '#e2e8f0';
            label.style.background = 'white';
        }
    });
}

function addSheetRange() {
    const sheet = document.getElementById('range-sheet')?.value?.trim() || 'Feuil1';
    const colStart = document.getElementById('range-col-start')?.value?.toUpperCase()?.trim() || 'A';
    const colEnd = document.getElementById('range-col-end')?.value?.toUpperCase()?.trim() || 'Z';
    const rowStart = parseInt(document.getElementById('range-row-start')?.value) || 1;
    const rowEnd = parseInt(document.getElementById('range-row-end')?.value) || 100;

    // Validate
    if (!sheet) {
        alert('Veuillez saisir un nom de feuille');
        return;
    }

    // Add range
    consBulleData.sheetRanges.push({
        id: 'range_' + Date.now(),
        sheet: sheet,
        colStart: colStart,
        colEnd: colEnd,
        rowStart: rowStart,
        rowEnd: rowEnd
    });

    // Clear inputs
    document.getElementById('range-sheet').value = '';
    document.getElementById('range-col-start').value = '';
    document.getElementById('range-col-end').value = '';
    document.getElementById('range-row-start').value = '';
    document.getElementById('range-row-end').value = '';

    renderSheetRanges();
}

function removeSheetRange(rangeId) {
    consBulleData.sheetRanges = consBulleData.sheetRanges.filter(r => r.id !== rangeId);
    renderSheetRanges();
}

function renderSheetRanges() {
    const container = document.getElementById('sheet-ranges-list');
    if (!container) return;

    if (consBulleData.sheetRanges.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📋</span>
                <p>Aucune configuration ajoutée</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    consBulleData.sheetRanges.forEach(range => {
        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f1f5f9; border-radius: 8px;">
                <div>
                    <strong style="color: #1E293B;">📋 ${range.sheet}</strong>
                    <span style="color: #64748b; font-size: 12px; margin-left: 12px;">
                        Colonnes: ${range.colStart} → ${range.colEnd} | Lignes: ${range.rowStart} → ${range.rowEnd}
                    </span>
                </div>
                <button onclick="removeSheetRange('${range.id}')" 
                    style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">
                    🗑️
                </button>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
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

    // Get selected mode
    const mode = document.getElementById('cb-mode')?.value || 'simple';

    // Get first selected sheet for target
    const targetSheet = consBulleData.selectedSheets.length > 0 ? consBulleData.selectedSheets[0] : '';

    // Validate
    if (consBulleData.responsables.length === 0) {
        alert('Veuillez ajouter au moins un responsable');
        return;
    }

    // Check for files
    let hasFiles = false;
    let allFiles = [];
    consBulleData.responsables.forEach(resp => {
        resp.sites.forEach(site => {
            if (site.file) {
                hasFiles = true;
                allFiles.push(site.file);
            }
        });
    });

    if (!hasFiles) {
        alert('Veuillez charger au moins un fichier Excel');
        return;
    }

    const btn = document.getElementById('btn-generate-consbulle');
    let progressInterval = null;
    let progress = 0;

    // Start animated progress
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ 0%';
        progress = 0;
        progressInterval = setInterval(() => {
            // Slow down as we approach 90%
            if (progress < 30) {
                progress += Math.random() * 8;
            } else if (progress < 60) {
                progress += Math.random() * 5;
            } else if (progress < 85) {
                progress += Math.random() * 2;
            } else if (progress < 95) {
                progress += Math.random() * 0.5;
            }
            progress = Math.min(progress, 95);
            btn.textContent = `⏳ ${Math.round(progress)}%`;
        }, 200);
    }

    try {
        const formData = new FormData();

        // Add mode and output filename
        formData.append('mode', mode);
        formData.append('output_filename', outputName);
        formData.append('sheet_name', targetSheet);

        // Add all files directly
        allFiles.forEach(file => {
            formData.append('files', file);
        });

        // Use the multi-mode consolidation API
        const response = await fetch('/api/consolidation/generate/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        // Complete progress
        if (btn) {
            clearInterval(progressInterval);
            btn.textContent = '⏳ 100%';
        }

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${consBulleData.outputFilename}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);

            if (btn) btn.textContent = '✅ Terminé!';
            setTimeout(() => {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '📥 Générer Excel';
                }
            }, 1500);
        } else {
            const error = await response.json();
            alert('Erreur: ' + (error.error || 'Génération échouée'));
            if (btn) {
                btn.disabled = false;
                btn.textContent = '📥 Générer Excel';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur: ' + error.message);
        if (progressInterval) clearInterval(progressInterval);
        if (btn) {
            btn.disabled = false;
            btn.textContent = '📥 Générer Excel';
        }
    }
}

// Quick generate all sheets (fallback when API fails)
async function generateWithAllSheets() {
    // Use simple mode with no sheet filter (generates all)
    const mode = document.getElementById('cb-mode')?.value || 'simple';
    const outputName = document.getElementById('cb-output-filename')?.value || 'Consolidation';

    // Collect all files
    let allFiles = [];
    consBulleData.responsables.forEach(resp => {
        resp.sites.forEach(site => {
            if (site.file) allFiles.push(site.file);
        });
    });

    if (allFiles.length === 0) {
        alert('Veuillez charger des fichiers Excel');
        return;
    }

    const btn = document.getElementById('btn-generate-consbulle');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Génération...';
    }

    try {
        const formData = new FormData();
        formData.append('mode', mode);
        formData.append('output_filename', outputName);
        formData.append('sheet_name', ''); // Empty = all sheets

        allFiles.forEach(file => {
            formData.append('files', file);
        });

        const response = await fetch('/api/consolidation/generate/', {
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
            a.download = `${outputName}.xlsx`;
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
