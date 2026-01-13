/**
 * Consolidation par Bulle - Structured wizard for Excel consolidation
 */

// State
let consBulleData = {
    responsables: [],
    selectedResponsable: null,
    config: {
        sheetName: 'Branche',
        colStart: 'E',
        colEnd: 'P',
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
        file: null,
        filename: null
    };

    resp.sites.push(site);
    renderResponsables();
    renderSites();
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
        html += `
            <div class="site-item ${site.file ? 'has-file' : ''}">
                <span class="site-item-icon">📄</span>
                <div class="site-item-info">
                    <div class="site-item-name">${site.name}</div>
                    <div class="site-item-file">${site.filename || 'Aucun fichier'}</div>
                </div>
                <label class="site-item-upload">
                    📂 ${site.file ? 'Changer' : 'Charger'} fichier
                    <input type="file" accept=".xlsx,.xls" onchange="handleSiteFile(event, '${resp.id}', '${site.id}')">
                </label>
                <button class="resp-item-btn" onclick="removeSite('${resp.id}', '${site.id}')">🗑️</button>
            </div>
        `;
    });

    container.innerHTML = html;
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
    renderResponsables();
    renderSites();
}

// ============================================
// PREVIEW & GENERATION
// ============================================

function previewConsBulle() {
    // Update config from inputs
    consBulleData.config.sheetName = document.getElementById('cb-sheet-name').value;
    consBulleData.config.colStart = document.getElementById('cb-col-start').value.toUpperCase();
    consBulleData.config.colEnd = document.getElementById('cb-col-end').value.toUpperCase();
    consBulleData.config.rowStart = parseInt(document.getElementById('cb-row-start').value);
    consBulleData.config.rowEnd = parseInt(document.getElementById('cb-row-end').value);

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
    html += `<strong>📊 Consolidation</strong>`;
    html += `<div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
        Feuille: ${consBulleData.config.sheetName} | 
        Colonnes: ${consBulleData.config.colStart}-${consBulleData.config.colEnd} | 
        Lignes: ${consBulleData.config.rowStart}-${consBulleData.config.rowEnd}
    </div>`;

    consBulleData.responsables.forEach(resp => {
        html += `<div class="preview-tree-item resp">👤 <strong>${resp.name}</strong> (${resp.sites.length} sites)</div>`;
        resp.sites.forEach(site => {
            const status = site.file ? '✅' : '⚠️';
            html += `<div class="preview-tree-item site" style="margin-left: 24px;">
                ${status} 📄 ${site.name} ${site.filename ? `(${site.filename})` : ''}
            </div>`;
        });
    });

    html += '</div>';
    container.innerHTML = html;
}

async function generateConsBulle() {
    // Validate
    if (consBulleData.responsables.length === 0) {
        alert('Veuillez ajouter au moins un responsable');
        return;
    }

    // Update config
    previewConsBulle();

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
                        filename: site.filename
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    renderResponsables();
    renderSites();
});
