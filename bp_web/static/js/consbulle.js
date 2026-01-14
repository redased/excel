/**
 * Consolidation par Bulle - Structured wizard for Excel consolidation
 * Version 2 with per-site configuration
 */

// State
let consBulleData = {
    responsables: [],
    selectedResponsable: null,
    selectedSite: null,
    config: {
        sheetName: 'Branche',
        colStart: 'A',
        colEnd: 'F',
        rowStart: 1,
        rowEnd: 10
    }
};

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

    if (consBulleData.responsables.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>👤</span>
                <p>Cliquez sur "Ajouter" pour créer un responsable</p>
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
                    <button class="resp-item-btn" onclick="event.stopPropagation(); editResponsable('${resp.id}')">✏️</button>
                    <button class="resp-item-btn" onclick="event.stopPropagation(); removeResponsable('${resp.id}')">🗑️</button>
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
    updateConfigDisplay();
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

    // Get default config values
    const site = {
        id: 'site_' + Date.now(),
        name: name,
        file: null,
        filename: null,
        config: {
            sheetName: document.getElementById('cb-sheet-name').value || 'Branche',
            colStart: document.getElementById('cb-col-start').value.toUpperCase() || 'A',
            colEnd: document.getElementById('cb-col-end').value.toUpperCase() || 'F',
            rowStart: parseInt(document.getElementById('cb-row-start').value) || 1,
            rowEnd: parseInt(document.getElementById('cb-row-end').value) || 10
        }
    };

    resp.sites.push(site);
    renderResponsables();
    renderSites();
    selectSite(resp.id, site.id);
}

function renderSites() {
    const container = document.getElementById('sites-list');

    if (!consBulleData.selectedResponsable) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📄</span>
                <p>Sélectionnez un responsable puis ajoutez des sites</p>
            </div>
        `;
        return;
    }

    const resp = consBulleData.responsables.find(r => r.id === consBulleData.selectedResponsable);
    if (!resp || resp.sites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📄</span>
                <p>Cliquez sur "Ajouter Site" pour créer un site</p>
            </div>
        `;
        return;
    }

    let html = '';
    resp.sites.forEach(site => {
        const isSelected = consBulleData.selectedSite === site.id;
        const hasConfig = site.config && site.config.colStart;
        html += `
            <div class="site-item ${site.file ? 'has-file' : ''} ${isSelected ? 'selected' : ''}" 
                 onclick="selectSite('${resp.id}', '${site.id}')">
                <span class="site-item-icon">📄</span>
                <div class="site-item-info">
                    <div class="site-item-name">${site.name}</div>
                    <div class="site-item-file">${site.filename || 'Aucun fichier'}</div>
                    ${hasConfig ? `<div class="site-item-config">📊 ${site.config.sheetName}: Col ${site.config.colStart}-${site.config.colEnd}, Lig ${site.config.rowStart}-${site.config.rowEnd}</div>` : ''}
                </div>
                <label class="site-item-upload" onclick="event.stopPropagation();">
                    📂 ${site.file ? 'Changer' : 'Charger'}
                    <input type="file" accept=".xlsx,.xls" onchange="handleSiteFile(event, '${resp.id}', '${site.id}')">
                </label>
                <button class="resp-item-btn" onclick="event.stopPropagation(); removeSite('${resp.id}', '${site.id}')">🗑️</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function selectSite(respId, siteId) {
    consBulleData.selectedSite = siteId;

    // Load site config into form
    const resp = consBulleData.responsables.find(r => r.id === respId);
    if (resp) {
        const site = resp.sites.find(s => s.id === siteId);
        if (site && site.config) {
            document.getElementById('cb-sheet-name').value = site.config.sheetName || 'Branche';
            document.getElementById('cb-col-start').value = site.config.colStart || 'A';
            document.getElementById('cb-col-end').value = site.config.colEnd || 'F';
            document.getElementById('cb-row-start').value = site.config.rowStart || 1;
            document.getElementById('cb-row-end').value = site.config.rowEnd || 10;
        }
    }

    renderSites();
    updateConfigDisplay();
}

function updateConfigDisplay() {
    const configTitle = document.querySelector('.consbulle-step:nth-child(3) .card-header h3');
    if (configTitle) {
        if (consBulleData.selectedSite) {
            const resp = consBulleData.responsables.find(r => r.id === consBulleData.selectedResponsable);
            if (resp) {
                const site = resp.sites.find(s => s.id === consBulleData.selectedSite);
                if (site) {
                    configTitle.innerHTML = `⚙️ Config: <span style="color: #10b981;">${site.name}</span>`;
                }
            }
        } else {
            configTitle.innerHTML = "⚙️ Étape 3: Configuration d'extraction";
        }
    }
}

function handleSiteFile(event, respId, siteId) {
    const file = event.target.files[0];
    if (!file) return;

    const resp = consBulleData.responsables.find(r => r.id === respId);
    if (!resp) return;

    const site = resp.sites.find(s => s.id === siteId);
    if (!site) return;

    site.file = file;
    site.filename = file.name;

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
    updateConfigDisplay();
}

// Save config for selected site
function saveCurrentSiteConfig() {
    if (!consBulleData.selectedSite) return;

    const resp = consBulleData.responsables.find(r => r.id === consBulleData.selectedResponsable);
    if (!resp) return;

    const site = resp.sites.find(s => s.id === consBulleData.selectedSite);
    if (!site) return;

    site.config = {
        sheetName: document.getElementById('cb-sheet-name').value || 'Branche',
        colStart: document.getElementById('cb-col-start').value.toUpperCase() || 'A',
        colEnd: document.getElementById('cb-col-end').value.toUpperCase() || 'F',
        rowStart: parseInt(document.getElementById('cb-row-start').value) || 1,
        rowEnd: parseInt(document.getElementById('cb-row-end').value) || 10
    };

    renderSites();
    console.log('Config saved for site:', site.name, site.config);
}

// ============================================
// PREVIEW & GENERATION
// ============================================

function previewConsBulle() {
    // Save current site config first
    saveCurrentSiteConfig();

    const container = document.getElementById('consbulle-preview');

    if (consBulleData.responsables.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📊</span>
                <p>Ajoutez des responsables et des sites pour voir l'aperçu</p>
            </div>
        `;
        return;
    }

    let html = '<div class="preview-tree">';
    html += `<strong>📊 Consolidation Structurée</strong>`;

    consBulleData.responsables.forEach(resp => {
        html += `<div class="preview-tree-item resp">👤 <strong>${resp.name}</strong> (${resp.sites.length} sites)</div>`;
        resp.sites.forEach(site => {
            const status = site.file ? '✅' : '⚠️';
            const cfg = site.config || {};
            html += `<div class="preview-tree-item site" style="margin-left: 24px;">
                ${status} 📄 ${site.name} ${site.filename ? `(${site.filename})` : ''}
                <div style="font-size: 11px; color: #64748b; margin-left: 20px;">
                    Feuille: ${cfg.sheetName || 'N/A'} | Col: ${cfg.colStart || '?'}-${cfg.colEnd || '?'} | Lig: ${cfg.rowStart || '?'}-${cfg.rowEnd || '?'}
                </div>
            </div>`;
        });
    });

    html += '</div>';
    container.innerHTML = html;
}

async function generateConsBulle() {
    // Save current config first
    saveCurrentSiteConfig();

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
    btn.disabled = true;
    btn.textContent = '⏳ Génération...';

    try {
        const formData = new FormData();
        formData.append('config', JSON.stringify(consBulleData));

        // Add files
        consBulleData.responsables.forEach(resp => {
            resp.sites.forEach(site => {
                if (site.file) {
                    formData.append('files', site.file, site.filename);
                    formData.append('file_mapping', JSON.stringify({
                        respId: resp.id,
                        siteId: site.id,
                        filename: site.filename,
                        config: site.config
                    }));
                }
            });
        });

        const response = await fetch('/api/generate-consbulle/', {
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
            a.download = 'Consolidation_Structuree.xlsx';
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
        btn.disabled = false;
        btn.textContent = '📥 Générer Excel';
    }
}

// Apply config to all sites of selected responsable
function applyConfigToAllSites() {
    if (!consBulleData.selectedResponsable) {
        alert('Veuillez sélectionner un responsable');
        return;
    }

    const config = {
        sheetName: document.getElementById('cb-sheet-name').value || 'Branche',
        colStart: document.getElementById('cb-col-start').value.toUpperCase() || 'A',
        colEnd: document.getElementById('cb-col-end').value.toUpperCase() || 'F',
        rowStart: parseInt(document.getElementById('cb-row-start').value) || 1,
        rowEnd: parseInt(document.getElementById('cb-row-end').value) || 10
    };

    const resp = consBulleData.responsables.find(r => r.id === consBulleData.selectedResponsable);
    if (resp) {
        resp.sites.forEach(site => {
            site.config = { ...config };
        });
        renderSites();
        alert(`Configuration appliquée à ${resp.sites.length} site(s)`);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    renderResponsables();
    renderSites();

    // Add change listeners to config inputs
    const configInputs = ['cb-sheet-name', 'cb-col-start', 'cb-col-end', 'cb-row-start', 'cb-row-end'];
    configInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', saveCurrentSiteConfig);
            el.addEventListener('blur', saveCurrentSiteConfig);
        }
    });
});
