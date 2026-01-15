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
    savedConfigs: [],
    templateFile: null,      // Template file for template mode
    sheetGroupRules: []      // Custom grouping rules: [{prefix: 'BP', name: 'Budget Prévisionnel'}]
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('ConsBulle V2 loaded');
    initConsBulle();
    loadSavedConfigs();
    loadSheetGroupRules();
});

function initConsBulle() {
    renderResponsables();
    renderSites();
    renderSheets();
    initFolderDropZone();
    initTemplateDropZone();
    updateModeOptions(); // Initialize mode options

    // Force initialize tab
    if (typeof switchConsBulleTab === 'function') {
        switchConsBulleTab('config');
    }
}

// Initialize template file drop zone
function initTemplateDropZone() {
    const dropZone = document.getElementById('template-file-drop-zone');
    const fileInput = document.getElementById('template-file-input');
    const label = document.getElementById('template-file-label');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#f59e0b';
            dropZone.style.backgroundColor = '#fef3c7';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#fbbf24';
            dropZone.style.backgroundColor = 'white';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#fbbf24';
            dropZone.style.backgroundColor = 'white';
            if (e.dataTransfer.files.length > 0) {
                handleTemplateFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleTemplateFile(e.target.files[0]);
            }
        });
    }
}

function handleTemplateFile(file) {
    consBulleData.templateFile = file;
    const label = document.getElementById('template-file-label');
    if (label) {
        label.textContent = '✅ ' + file.name;
        label.style.color = '#059669';
    }
}

// ============================================
// MODE OPTIONS MANAGEMENT
// ============================================

function updateModeOptions() {
    const mode = document.getElementById('cb-mode')?.value || 'simple';

    // Hide all options panels
    document.querySelectorAll('.mode-options').forEach(el => {
        el.style.display = 'none';
    });

    // Show relevant options panel
    const optionsPanel = document.getElementById(`options-${mode}`);
    if (optionsPanel) {
        optionsPanel.style.display = 'block';
    }
}

function getModeOptions() {
    const mode = document.getElementById('cb-mode')?.value || 'simple';
    const options = { mode };

    // Collect statistics options
    if (mode === 'statistics' || mode === 'complete') {
        options.stats = {
            sum: document.querySelector('[name="stat-sum"]')?.checked || false,
            avg: document.querySelector('[name="stat-avg"]')?.checked || false,
            min: document.querySelector('[name="stat-min"]')?.checked || false,
            max: document.querySelector('[name="stat-max"]')?.checked || false,
            count: document.querySelector('[name="stat-count"]')?.checked || false,
            stdev: document.querySelector('[name="stat-stdev"]')?.checked || false
        };
    }

    // Collect synthesis options
    if (mode === 'synthesis' || mode === 'complete') {
        options.synthesis = {
            recap: document.querySelector('[name="synth-recap"]')?.checked || false,
            compare: document.querySelector('[name="synth-compare"]')?.checked || false,
            diff: document.querySelector('[name="synth-diff"]')?.checked || false,
            rank: document.querySelector('[name="synth-rank"]')?.checked || false
        };
    }

    // Collect graph options
    if (mode === 'graphs' || mode === 'complete') {
        options.charts = {
            bar: document.querySelector('[name="chart-bar"]')?.checked || false,
            line: document.querySelector('[name="chart-line"]')?.checked || false,
            pie: document.querySelector('[name="chart-pie"]')?.checked || false,
            area: document.querySelector('[name="chart-area"]')?.checked || false
        };
    }

    // Complete mode options
    if (mode === 'complete') {
        options.complete = {
            dashboard: document.querySelector('[name="complete-dashboard"]')?.checked || false,
            synthesis: document.querySelector('[name="complete-synthesis"]')?.checked || false,
            stats: document.querySelector('[name="complete-stats"]')?.checked || false,
            charts: document.querySelector('[name="complete-charts"]')?.checked || false
        };
    }

    return options;
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

    // Populate Modal
    document.getElementById('site-modal-resp-id').value = respId;
    document.getElementById('site-modal-site-id').value = siteId;
    document.getElementById('site-modal-name').value = site.name || '';
    document.getElementById('site-modal-city').value = site.city || '';
    document.getElementById('site-modal-country').value = site.country || '';
    document.getElementById('site-modal-service').value = site.service || '';
    document.getElementById('site-modal-manager').value = site.manager || '';

    // Show Modal
    document.getElementById('site-details-modal').style.display = 'block';
}

function closeSiteDetailsModal() {
    document.getElementById('site-details-modal').style.display = 'none';
}

function saveSiteDetails() {
    const respId = document.getElementById('site-modal-resp-id').value;
    const siteId = document.getElementById('site-modal-site-id').value;

    const resp = consBulleData.responsables.find(r => r.id === respId);
    if (!resp) return;

    const site = resp.sites.find(s => s.id === siteId);
    if (!site) return;

    // Update Data
    site.name = document.getElementById('site-modal-name').value;
    site.city = document.getElementById('site-modal-city').value;
    site.country = document.getElementById('site-modal-country').value;
    site.service = document.getElementById('site-modal-service').value;
    site.manager = document.getElementById('site-modal-manager').value;

    renderSites();
    closeSiteDetailsModal();
}

// TREE VISUALIZATION
function viewTree() {
    const rootName = "Entreprise Mère"; // Could be configurable

    let html = `
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="border: 2px solid #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 8px; font-weight: bold; color: #1e3a8a; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                🏢 ${rootName}
            </div>
            <div style="width: 2px; height: 30px; background: #cbd5e1;"></div>
            <div style="display: flex; gap: 40px; margin-top: 0;">
    `;

    if (consBulleData.responsables.length === 0) {
        html += `<div style="color: #64748b;">Aucune donnée</div>`;
    } else {
        consBulleData.responsables.forEach(resp => {
            html += `
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <div style="border: 2px solid #059669; background: #ecfdf5; padding: 10px 20px; border-radius: 8px; font-weight: 600; color: #065f46; margin-top: -2px; position: relative;">
                         👤 ${resp.name}
                    </div>
                    
                    ${resp.sites.length > 0 ? `
                        <div style="width: 2px; height: 30px; background: #cbd5e1;"></div>
                        <div style="display: flex; gap: 20px; align-items: flex-start;">
                            ${resp.sites.map(site => `
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    <div style="border: 1px solid #94a3b8; background: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); min-width: 120px;">
                                        <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${site.name}</div>
                                        ${site.manager ? `<div style="font-size: 11px; color: #475569;">👤 ${site.manager}</div>` : ''}
                                        ${site.service ? `<div style="font-size: 11px; color: #64748b;">🔧 ${site.service}</div>` : ''}
                                        ${(site.city || site.country) ? `<div style="font-size: 11px; color: #94a3b8;">📍 ${site.city || ''} ${site.country || ''}</div>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    html += `
            </div>
        </div>
    `;

    document.getElementById('tree-visualization').innerHTML = html;
    document.getElementById('tree-view-modal').style.display = 'block';
}

function closeTreeModal() {
    document.getElementById('tree-view-modal').style.display = 'none';
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

    // Group sheets by custom rules or first word
    const groups = {};
    consBulleData.allSheets.forEach(sheet => {
        // Use custom grouping function (respects rules from Settings)
        const groupKey = getSheetGroupName(sheet);
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(sheet);
    });

    let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

    // Sort group names alphabetically
    Object.keys(groups).sort().forEach(groupName => {
        const sheets = groups[groupName];
        const allSelected = sheets.every(s => consBulleData.selectedSheets.includes(s));
        const someSelected = sheets.some(s => consBulleData.selectedSheets.includes(s));

        html += `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 10px 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <span>📁 ${groupName} (${sheets.length})</span>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: normal;">
                        <input type="checkbox" ${allSelected ? 'checked' : ''} onchange="toggleSheetGroup('${groupName}')">
                        <span>${allSelected ? 'Désélectionner' : 'Tout sélectionner'}</span>
                    </label>
                </div>
                <div style="padding: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
        `;

        sheets.forEach(sheet => {
            const isSelected = consBulleData.selectedSheets.includes(sheet);
            const safeSheet = sheet.replace(/'/g, "\\'");
            html += `
                <label style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: ${isSelected ? '#dbeafe' : '#f1f5f9'}; border-radius: 6px; cursor: pointer; border: 1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}; font-size: 13px;">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSheet('${safeSheet}')">
                    <span>📋 ${sheet}</span>
                </label>
            `;
        });

        html += '</div></div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

// Toggle all sheets in a group
function toggleSheetGroup(groupName) {
    const allSheets = consBulleData.allSheets;
    const groupSheets = allSheets.filter(sheet => {
        return getSheetGroupName(sheet) === groupName;
    });

    const allSelected = groupSheets.every(s => consBulleData.selectedSheets.includes(s));

    if (allSelected) {
        // Deselect all in group
        groupSheets.forEach(sheet => {
            const index = consBulleData.selectedSheets.indexOf(sheet);
            if (index > -1) consBulleData.selectedSheets.splice(index, 1);
        });
    } else {
        // Select all in group
        groupSheets.forEach(sheet => {
            if (!consBulleData.selectedSheets.includes(sheet)) {
                consBulleData.selectedSheets.push(sheet);
            }
        });
    }

    renderSheets();
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

    // Check for files and prepare them with Responsable names
    let hasFiles = false;
    let allFiles = [];
    consBulleData.responsables.forEach(resp => {
        resp.sites.forEach(site => {
            if (site.file) {
                hasFiles = true;
                // Create a new File object with modified name to include Responsable
                // This is a trick to pass metadata to backend via filename
                const newName = `${resp.name} - ${site.file.name}`;
                const newFile = new File([site.file], newName, { type: site.file.type });
                allFiles.push(newFile);
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
        formData.append('sheet_name', ''); // Empty to allow multiple selection via selected_sheets
        formData.append('selected_sheets', JSON.stringify(consBulleData.selectedSheets));

        // Add all files directly
        allFiles.forEach(file => {
            formData.append('files', file);
        });

        // Add template file if template mode is selected
        if (mode === 'template' && consBulleData.templateFile) {
            formData.append('template_file', consBulleData.templateFile);
        }

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
            if (site.file) {
                // Prepend Responsable Name also for fallback
                const newName = `${resp.name} - ${site.file.name}`;
                const newFile = new File([site.file], newName, { type: site.file.type });
                allFiles.push(newFile);
            }
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

        // Get and append advanced options
        const options = getModeOptions();
        formData.append('options', JSON.stringify(options));

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
                selected_sheets: consBulleData.selectedSheets,
                responsables: consBulleData.responsables
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
            consBulleData.responsables = config.responsables || [];

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

// ============================================
// SHEET GROUPING RULES MANAGEMENT
// ============================================

function loadSheetGroupRules() {
    const saved = localStorage.getItem('sheetGroupRules');
    if (saved) {
        try {
            consBulleData.sheetGroupRules = JSON.parse(saved);
        } catch (e) {
            consBulleData.sheetGroupRules = [];
        }
    }

    // Initialize with default rules if empty
    if (consBulleData.sheetGroupRules.length === 0) {
        consBulleData.sheetGroupRules = [
            { prefix: 'BP', name: '📊 Budget Prévisionnel' },
            { prefix: 'CC', name: '🏢 Centre de Coûts' },
            { prefix: 'SRV', name: '🔧 Services' },
            { prefix: 'STAT', name: '📈 Statistiques' },
            { prefix: 'RECAP', name: '📋 Récapitulatif' }
        ];
        // Save defaults
        localStorage.setItem('sheetGroupRules', JSON.stringify(consBulleData.sheetGroupRules));
    }

    renderSheetGroupRules();
}

function saveSheetGroupRules() {
    localStorage.setItem('sheetGroupRules', JSON.stringify(consBulleData.sheetGroupRules));
    alert('✅ Règles de groupement sauvegardées !');
    renderSheets(); // Refresh sheet display with new rules
}

function addSheetGroupRule() {
    const prefixInput = document.getElementById('new-group-prefix');
    const nameInput = document.getElementById('new-group-name');

    const prefix = prefixInput?.value.trim().toUpperCase();
    const name = nameInput?.value.trim();

    if (!prefix || !name) {
        alert('Veuillez remplir le préfixe et le nom du groupe');
        return;
    }

    // Check if prefix already exists
    const exists = consBulleData.sheetGroupRules.some(r => r.prefix === prefix);
    if (exists) {
        alert('Ce préfixe existe déjà');
        return;
    }

    consBulleData.sheetGroupRules.push({ prefix, name });
    prefixInput.value = '';
    nameInput.value = '';

    renderSheetGroupRules();
}

function deleteSheetGroupRule(prefix) {
    consBulleData.sheetGroupRules = consBulleData.sheetGroupRules.filter(r => r.prefix !== prefix);
    renderSheetGroupRules();
}

function resetSheetGroupRules() {
    if (confirm('Réinitialiser toutes les règles de groupement ?')) {
        consBulleData.sheetGroupRules = [];
        localStorage.removeItem('sheetGroupRules');
        renderSheetGroupRules();
        renderSheets();
    }
}

function renderSheetGroupRules() {
    const container = document.getElementById('sheet-group-rules-list');
    if (!container) return;

    if (consBulleData.sheetGroupRules.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; font-size: 13px;">Aucune règle définie. Les feuilles seront groupées par premier mot.</p>';
        return;
    }

    let html = '';
    consBulleData.sheetGroupRules.forEach(rule => {
        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f1f5f9; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div>
                    <span style="font-weight: 600; color: #3b82f6;">${rule.prefix}</span>
                    <span style="color: #64748b; margin: 0 8px;">→</span>
                    <span style="color: #0f172a;">${rule.name}</span>
                </div>
                <button onclick="deleteSheetGroupRule('${rule.prefix}')" class="btn btn-sm" style="background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 4px 10px;">🗑️</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Helper function to get group name for a sheet based on rules
function getSheetGroupName(sheetName) {
    const words = sheetName.split(/[\s_-]+/);
    const firstWord = (words[0] || '').toUpperCase();

    // Check custom rules first
    const rule = consBulleData.sheetGroupRules.find(r => firstWord.startsWith(r.prefix));
    if (rule) {
        return rule.name;
    }

    // Fallback to first word
    return words[0] || 'Autres';
}

// ============================================
// EXCEL FILE PREVIEW MODAL
// ============================================

let previewCurrentFile = null;

async function openExcelPreview(file, fileName) {
    const modal = document.getElementById('excel-preview-modal');
    const title = document.getElementById('preview-modal-title');
    const loading = document.getElementById('preview-loading');
    const tableContainer = document.getElementById('preview-table-container');

    if (!modal) return;

    // Store file reference
    previewCurrentFile = file;

    // Show modal and loading
    modal.style.display = 'block';
    if (title) title.textContent = fileName || 'Aperçu du fichier';
    if (loading) loading.style.display = 'block';
    if (tableContainer) tableContainer.innerHTML = '';

    // Load file content
    await loadPreviewSheet(file, '');
}

async function loadPreviewSheet(file, sheetName) {
    const loading = document.getElementById('preview-loading');
    const tableContainer = document.getElementById('preview-table-container');
    const sheetTabs = document.getElementById('preview-sheet-tabs');

    const formData = new FormData();
    formData.append('file', file);
    if (sheetName) formData.append('sheet_name', sheetName);

    try {
        const response = await fetch('/api/verify/preview/', {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': getCSRFToken() }
        });

        if (response.ok) {
            const data = await response.json();

            // Render sheet tabs
            if (sheetTabs && data.sheet_names) {
                sheetTabs.innerHTML = data.sheet_names.map(name => `
                    <button onclick="changePreviewSheet('${name}')" 
                        style="padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; 
                        ${name === data.current_sheet ? 'background: #3b82f6; color: white;' : 'background: white; color: #64748b; border: 1px solid #e2e8f0;'}">
                        ${name}
                    </button>
                `).join('');
            }

            // Render table
            if (tableContainer) {
                tableContainer.innerHTML = renderPreviewTable(data);
            }
        } else {
            if (tableContainer) tableContainer.innerHTML = '<p style="color: red; text-align: center;">Erreur de chargement</p>';
        }
    } catch (error) {
        console.error('Preview error:', error);
        if (tableContainer) tableContainer.innerHTML = '<p style="color: red; text-align: center;">Erreur: ' + error.message + '</p>';
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function changePreviewSheet(sheetName) {
    if (previewCurrentFile) {
        loadPreviewSheet(previewCurrentFile, sheetName);
    }
}

function renderPreviewTable(data) {
    if (!data.rows || data.rows.length === 0) {
        return '<p style="text-align: center; color: #94a3b8;">Aucune donnée</p>';
    }

    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: monospace;">';

    // Header row with column letters
    html += '<thead><tr style="background: #f1f5f9; position: sticky; top: 0;">';
    html += '<th style="padding: 8px; border: 1px solid #e2e8f0; background: #f1f5f9; min-width: 40px;"></th>';
    data.headers.forEach(h => {
        html += `<th style="padding: 8px; border: 1px solid #e2e8f0; background: #e2e8f0; min-width: 80px; font-weight: 600;">${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Data rows
    data.rows.forEach((row, rowIdx) => {
        const bgColor = rowIdx % 2 === 0 ? 'white' : '#f8fafc';
        html += `<tr style="background: ${bgColor};">`;
        html += `<td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f1f5f9; font-weight: 600; text-align: center;">${rowIdx + 1}</td>`;
        row.forEach(cell => {
            html += `<td style="padding: 6px 8px; border: 1px solid #e2e8f0; white-space: nowrap;">${cell}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';

    if (data.total_rows > 100) {
        html += `<p style="text-align: center; color: #94a3b8; margin-top: 16px; font-size: 12px;">Affichage limité à 100 lignes (total: ${data.total_rows})</p>`;
    }

    return html;
}

function closeExcelPreview() {
    const modal = document.getElementById('excel-preview-modal');
    if (modal) modal.style.display = 'none';
    previewCurrentFile = null;
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeExcelPreview();
    }
});

// ============================================
// BOTTOM PREVIEW BAR
// ============================================

let previewBarCollapsed = false;
let generatedFileBlob = null;
let generatedFileName = '';

function showPreviewBar() {
    const bar = document.getElementById('file-preview-bar');
    if (bar) bar.style.display = 'block';
}

function hidePreviewBar() {
    const bar = document.getElementById('file-preview-bar');
    if (bar) bar.style.display = 'none';
}

function togglePreviewBar() {
    const content = document.getElementById('preview-bar-content');
    const icon = document.getElementById('preview-bar-toggle-icon');

    if (content) {
        previewBarCollapsed = !previewBarCollapsed;
        content.style.display = previewBarCollapsed ? 'none' : 'flex';
        if (icon) icon.textContent = previewBarCollapsed ? '▲' : '▼';
    }
}

function updatePreviewBarSourceFiles(files) {
    const container = document.getElementById('preview-source-files-list');
    const countEl = document.getElementById('preview-source-count');

    if (!container) return;

    // Store files reference globally
    window.previewSourceFiles = files;

    if (countEl) countEl.textContent = files.length;

    if (files.length === 0) {
        container.innerHTML = '<span style="color: #94a3b8; font-size: 12px;">Aucun fichier</span>';
        return;
    }

    container.innerHTML = files.map((file, idx) => `
        <button onclick="previewSourceFile(${idx})" 
            style="padding: 6px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;"
            onmouseover="this.style.background='#dbeafe'; this.style.borderColor='#3b82f6';"
            onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0';">
            <span>📄</span>
            <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
        </button>
    `).join('');

    // Show the bar
    showPreviewBar();
}

// ============================================
// ANALYSIS DETECTOR
// ============================================

async function triggerAnalysis() {
    const scanDepth = document.getElementById('cons-scan-depth').value || 50;

    // Collect all unique filenames that need analysis
    const uniqueFiles = new Set();
    consBulleData.responsables.forEach(r => r.sites.forEach(s => {
        if (s.detected_sheets && s.detected_sheets.length > 0) {
            uniqueFiles.add(s.filename);
        }
    }));

    if (uniqueFiles.size === 0) {
        alert('Veuillez d\'abord charger des fichiers.');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('scan_depth', scanDepth);
        uniqueFiles.forEach(f => formData.append('filenames', f));

        const response = await fetch('/api/consbulle/analyze-structure/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderSheetConfigTable(data.sheet_configs);
        } else {
            alert('Erreur lors de l\'analyse');
        }

    } catch (e) {
        console.error(e);
        alert('Erreur technique: ' + e.message);
    }
}

function renderSheetConfigTable(configs) {
    const tbody = document.getElementById('sheet-config-body');
    tbody.innerHTML = '';

    // Configs is { "filename": { "SheetName": { row: 3, col: "C" } } }

    for (const [filename, sheets] of Object.entries(configs)) {
        for (const [sheetName, config] of Object.entries(sheets)) {
            const tr = document.createElement('tr');

            const fileId = filename.replace(/[^a-zA-Z0-9]/g, '_');
            const sheetId = sheetName.replace(/[^a-zA-Z0-9]/g, '_');
            const uniqueKey = `${fileId}__${sheetId}`; // Double underscore separator

            tr.innerHTML = `
                <td title="${filename}" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${filename}
                </td>
                <td>${sheetName}</td>
                <td>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <input type="number" class="config-row-start" data-key="${uniqueKey}" value="1" style="width: 40px;">
                        -
                        <input type="number" class="config-row-end" data-key="${uniqueKey}" value="${config.row}" style="width: 40px; font-weight: bold; color: #1e40af;">
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <input type="text" class="config-col-start" data-key="${uniqueKey}" value="A" style="width: 30px; text-transform: uppercase;">
                        -
                        <input type="text" class="config-col-end" data-key="${uniqueKey}" value="${config.col}" style="width: 30px; font-weight: bold; color: #1e40af; text-transform: uppercase;">
                    </div>
                </td>
                <td>
                    <button class="btn-sm btn-light" onclick="openCbPreviewModal('${filename}', '${sheetName}')">👁️</button>
                    <input type="hidden" class="config-filename" data-key="${uniqueKey}" value="${filename}">
                    <input type="hidden" class="config-sheetname" data-key="${uniqueKey}" value="${sheetName}">
                </td>
            `;
            tbody.appendChild(tr);
        }
    }
}

// ============================================
// PREVIEW MODAL
// ============================================
function openCbPreviewModal(filename, sheetName) {
    const modal = document.getElementById('cb-preview-modal');
    modal.style.display = 'block';
    document.getElementById('cb-preview-modal-title').innerText = `Aperçu : ${filename} / ${sheetName}`;

    const container = document.getElementById('cb-preview-modal-content');
    container.innerHTML = '<div class="spinner"></div>';

    // Reuse existing API to fetch content
    fetch('/api/sheet-content/', {
        method: 'POST',
        body: JSON.stringify({ filename: filename, sheet_name: sheetName, max_rows: 50 }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                container.innerHTML = `<div class="error-msg">${data.error}</div>`;
            } else {
                renderGrid(data.data, container.id); // Reuse renderGrid
            }
        })
        .catch(err => {
            container.innerHTML = `<div class="error-msg">${err.message}</div>`;
        });
}

function closeCbPreviewModal() {
    document.getElementById('cb-preview-modal').style.display = 'none';
}

// ============================================
// CONSOLIDATION GENERATION
// ============================================

async function generateConsolidation() {
    const btn = document.getElementById('btn-generate-cons');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Génération en cours...';
    }

    try {
        const formData = new FormData();
        const allFiles = [];

        // Collect all files
        consBulleData.responsables.forEach(resp => {
            resp.sites.forEach(site => {
                if (site.file) {
                    allFiles.push(site.file);
                    formData.append('files', site.file);
                }
            });
        });

        if (allFiles.length === 0 && consBulleData.sheetMode !== 'manual') {
            alert('Veuillez ajouter des fichiers Excel');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '🚀 Lancer la Consolidation';
            }
            return;
        }

        // Collect Sheet Configs from Table
        const sheetConfigs = {};
        document.querySelectorAll('.config-row-end').forEach(input => {
            const key = input.dataset.key;
            const filename = document.querySelector(`.config-filename[data-key="${key}"]`).value;
            const sheetName = document.querySelector(`.config-sheetname[data-key="${key}"]`).value;

            if (!sheetConfigs[filename]) sheetConfigs[filename] = {};

            sheetConfigs[filename][sheetName] = {
                row_start: parseInt(document.querySelector(`.config-row-start[data-key="${key}"]`).value) || 1,
                row_end: parseInt(input.value) || 1,
                col_start: document.querySelector(`.config-col-start[data-key="${key}"]`).value || 'A',
                col_end: document.querySelector(`.config-col-end[data-key="${key}"]`).value || 'A'
            };
        });

        // Prepare Config
        const config = {
            output_filename: document.getElementById('cb-output-filename').value || 'Consolidation',
            responsables: consBulleData.responsables.map(r => ({
                id: r.id,
                name: r.name,
                sites: r.sites.map(s => ({
                    id: s.id,
                    name: s.name,
                    filename: s.filename
                }))
            })),
            sheet_mode: consBulleData.sheetMode, // auto/manual
            selected_sheets: consBulleData.selectedSheets,
            sheet_ranges: consBulleData.sheetRanges,
            mode_options: getModeOptions(),
            fixed_headers: null, // Deprecated global config
            sheet_configs: sheetConfigs // New Per-Sheet Config
        };

        formData.append('config', JSON.stringify(config));

        const response = await fetch('/api/consbulle/generate/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = (config.output_filename || 'Consolidation') + '.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();

            // Show success in preview bar
            updatePreviewBarGeneratedFile(blob, a.download);

            alert('✅ Consolidation terminée avec succès !');
        } else {
            const errorData = await response.json();
            alert('Erreur: ' + (errorData.error || 'Erreur inconnue lors de la consolidation'));
        }

    } catch (error) {
        console.error('Error generating consolidation:', error);
        alert('Erreur technique: ' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '🚀 Lancer la Consolidation';
        }
    }
}

function previewSourceFile(idx) {
    if (window.previewSourceFiles && window.previewSourceFiles[idx]) {
        const file = window.previewSourceFiles[idx];
        openExcelPreview(file, file.name);
    }
}

function updatePreviewBarGeneratedFile(blob, filename) {
    const container = document.getElementById('preview-generated-file');

    if (!container) return;

    generatedFileBlob = blob;
    generatedFileName = filename;

    if (!blob || !filename) {
        container.innerHTML = '<span style="color: #94a3b8; font-size: 12px;">Aucun fichier généré</span>';
        return;
    }

    container.innerHTML = `
        <button onclick="previewGeneratedFile()" 
            style="padding: 8px 16px; background: white; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;"
            onmouseover="this.style.background='#dcfce7'; this.style.borderColor='#10b981';"
            onmouseout="this.style.background='white'; this.style.borderColor='#bbf7d0';">
            <span style="font-size: 18px;">📊</span>
            <span style="font-weight: 600; color: #10b981;">${filename}</span>
            <span style="color: #94a3b8; font-size: 11px;">(cliquez pour voir)</span>
        </button>
    `;

    // Show the bar
    showPreviewBar();
}

function previewGeneratedFile() {
    if (generatedFileBlob && generatedFileName) {
        const file = new File([generatedFileBlob], generatedFileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        openExcelPreview(file, generatedFileName);
    }
}


/* ============================================
   TEST MODE & PREVIEW
   ============================================ */

let testState = {
    activeTab: 'config', // 'config' or 'test'
    currentFile: null,   // Currently previewed file object or 'result'
    previewResult: null  // Store result info {filename: '...', url: '...'}
};

function switchConsBulleTab(tabName) {
    testState.activeTab = tabName;

    // Update buttons
    document.querySelectorAll('.btn-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-cb-${tabName}`).classList.add('active');

    // Update content
    document.querySelectorAll('.consbulle-tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(`cb-content-${tabName}`).style.display = 'block';

    if (tabName === 'test') {
        renderTestTabs();
    }
}

function renderTestTabs() {
    const container = document.getElementById('test-consbulle-tabs');
    if (!container) return;

    let html = '';

    // 1. Result Tab
    const isResultActive = testState.currentFile === 'result';
    html += `
        <button class="file-tab ${isResultActive ? 'active' : ''} ${testState.previewResult ? 'has-result' : ''}" 
                onclick="renderSheetPreview('result')">
            Output: ${consBulleData.outputFilename || 'Consolidation'}
        </button>
    `;

    // 2. Source Files Tabs
    consBulleData.responsables.forEach(resp => {
        resp.sites.forEach(site => {
            if (site.file || site.filename) {
                const isActive = testState.currentFile && testState.currentFile.id === site.id;
                html += `
                    <button class="file-tab ${isActive ? 'active' : ''}" 
                            onclick="selectTestFile('${resp.id}', '${site.id}')">
                        ${site.name}
                    </button>
                `;
            }
        });
    });

    container.innerHTML = html;

    // Select result by default if nothing selected
    if (!testState.currentFile) {
        renderSheetPreview('result');
    }
}

function selectTestFile(respId, siteId) {
    const resp = consBulleData.responsables.find(r => r.id === respId);
    if (!resp) return;
    const site = resp.sites.find(s => s.id === siteId);
    if (!site) return;

    renderSheetPreview(site);
}

async function renderSheetPreview(fileOrResult) {
    testState.currentFile = fileOrResult;
    renderTestTabs(); // Update active class

    const table = document.getElementById('cb-test-preview-table');
    const infoName = document.getElementById('cb-preview-sheet-name');
    const infoRows = document.getElementById('cb-preview-rows');
    const infoCols = document.getElementById('cb-preview-cols');

    // Clear current view
    if (table && table.querySelector('thead')) {
        table.querySelector('thead').innerHTML = '';
        table.querySelector('tbody').innerHTML = '<tr><td style="padding:20px; text-align:center;">Chargement...</td></tr>';
    }

    // Handle Result View
    if (fileOrResult === 'result') {
        if (!testState.previewResult) {
            if (table) {
                table.querySelector('tbody').innerHTML = `
                    <tr><td style="padding:40px; text-align:center; color:#64748b;">
                        <div style="font-size:24px; margin-bottom:10px;">🧮</div>
                        Cliquez sur "Calculer Excel" pour générer la consolidation
                    </td></tr>`;
            }
            if (infoName) infoName.textContent = '-';
            if (infoRows) infoRows.textContent = '-';
            if (infoCols) infoCols.textContent = '-';
            return;
        }
        // Fetch Result Content
        await fetchAndRenderSheet(testState.previewResult.filename, 'Résultat');
        return;
    }

    // Handle Source File View
    if (fileOrResult.filename) {
        // Use first detected sheet or default
        const sheetName = (fileOrResult.detected_sheets && fileOrResult.detected_sheets.length > 0)
            ? fileOrResult.detected_sheets[0]
            : null;

        await fetchAndRenderSheet(fileOrResult.filename, sheetName, fileOrResult);
    }
}

async function fetchAndRenderSheet(filename, sheetName, siteObj = null) {
    try {
        const response = await fetch('/api/sheet-content/', {
            method: 'POST',
            body: JSON.stringify({
                filename: filename,
                sheet_name: sheetName,
                site: siteObj, // Pass site object for fallback if filename is pathless
                max_rows: 50
            }),
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            renderGrid(data.data, data.sheet_name, data.dimensions);
        } else {
            showErrorInGrid(data.error);
        }
    } catch (error) {
        showErrorInGrid(error.message);
    }
}

function renderGrid(rows, sheetName, dims) {
    const table = document.getElementById('cb-test-preview-table');
    if (!table) return;

    // Update Info Bar
    const infoName = document.getElementById('cb-preview-sheet-name');
    const infoRows = document.getElementById('cb-preview-rows');
    const infoCols = document.getElementById('cb-preview-cols');

    if (infoName) infoName.textContent = sheetName;
    if (infoRows) infoRows.textContent = dims.rows;
    if (infoCols) infoCols.textContent = dims.cols;

    // Headers (A, B, C...)
    let theadHtml = '<tr><th></th>'; // Corner cell
    if (rows.length > 0) {
        for (let i = 0; i < rows[0].length; i++) {
            theadHtml += `<th>${getColumnLetter(i + 1)}</th>`;
        }
    }
    theadHtml += '</tr>';
    table.querySelector('thead').innerHTML = theadHtml;

    // Body
    let tbodyHtml = '';
    rows.forEach((row, idx) => {
        tbodyHtml += `<tr><td class="row-header">${idx + 1}</td>`;
        row.forEach(cell => {
            tbodyHtml += `<td>${cell || ''}</td>`;
        });
        tbodyHtml += '</tr>';
    });
    table.querySelector('tbody').innerHTML = tbodyHtml;
}

function getColumnLetter(colIndex) {
    let letter = "";
    while (colIndex > 0) {
        let temp = (colIndex - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        colIndex = (colIndex - temp - 1) / 26;
    }
    return letter;
}

function showErrorInGrid(msg) {
    const table = document.getElementById('cb-test-preview-table');
    if (table) {
        table.querySelector('tbody').innerHTML = `
            <tr><td style="padding:20px; text-align:center; color:#ef4444;">
                Erreur: ${msg}
            </td></tr>`;
    }
}

async function calculateConsBulleTest() {
    const btn = document.querySelector('#cb-content-test .btn-success');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Calcul...';
    btn.disabled = true;

    try {
        // Collect Data
        const payload = {
            output_filename: consBulleData.outputFilename,
            responsables: consBulleData.responsables,
            mode_options: getModeOptions(),
            // Ensure we tell backend this is a PREVIEW
            is_preview: true
        };

        const response = await fetch('/api/preview-consolidation/', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            testState.previewResult = {
                filename: data.filename,
                url: data.download_url
            };
            // Render Result
            renderSheetPreview('result');
        } else {
            alert('Erreur: ' + data.error);
        }

    } catch (e) {
        alert('Erreur technique: ' + e.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

