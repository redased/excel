/**
 * Consolidation functionality for Excel Creator
 */

// State
const consolidationState = {
    files: [],
    uploadedPaths: [],
    uploadedFilesInfo: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-consolidation').addEventListener('click', openConsolidationModal);

    document.getElementById('consolidation-files').addEventListener('change', handleFileSelect);

    document.getElementById('cons-use-ai').addEventListener('change', (e) => {
        document.getElementById('cons-ai-section').style.display = e.target.checked ? 'block' : 'none';
    });
});

function openConsolidationModal() {
    document.getElementById('consolidation-modal').classList.add('show');
}

function closeConsolidationModal() {
    document.getElementById('consolidation-modal').classList.remove('show');
    consolidationState.files = [];
    consolidationState.uploadedPaths = [];
    consolidationState.uploadedFilesInfo = [];
    document.getElementById('files-list').innerHTML = '';
    document.getElementById('cons-status').className = 'ai-status';
    document.getElementById('cons-status').textContent = '';
    document.getElementById('consolidation-files').value = ''; // Reset input
}

async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    consolidationState.files = files;

    // Show loading
    document.getElementById('files-list').innerHTML = `
        <div style="padding:20px; text-align:center; color:#666;">
            <div class="loading-spinner" style="border-width:2px; width:20px; height:20px; border-top-color:#6366f1; margin:0 auto 10px;"></div>
            Chargement et analyse des fichiers...
        </div>
    `;

    try {
        await uploadFiles();
        renderFilesList();
        showConsolidationStatus('✅ Fichiers chargés et analysés', 'success');
    } catch (error) {
        showConsolidationStatus(`Erreur: ${error.message}`, 'error');
        document.getElementById('files-list').innerHTML = '';
    }
}

function renderFilesList() {
    const files = consolidationState.uploadedFilesInfo || [];

    if (files.length === 0) {
        document.getElementById('files-list').innerHTML = '<div style="padding:10px; text-align:center; color:red;">Aucun fichier chargé</div>';
        return;
    }

    const listHtml = files.map((f, i) => {
        // Create sheet options
        // Default select all sheets or just the first one? User usually wants one specific sheet per file or all. 
        // Let's select all by default if there are few, or let user decide. 
        // Better: Select ALL by default as per "check all" behavior.
        const sheetOptions = f.sheets && f.sheets.length > 0
            ? f.sheets.map(s => `<option value="${s}" selected>${s}</option>`).join('')
            : '<option value="Feuille1" selected>Feuille1</option>'; // Fallback

        return `
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px; padding:12px; background:rgba(99,102,241,0.05); border:1px solid rgba(99,102,241,0.2); border-radius:8px;">
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <span style="flex:1; font-weight:600; color:#333; min-width:200px;">📄 ${f.name}</span>
                <input type="text" class="form-input" placeholder="Responsable" data-field="responsible" data-index="${i}" style="width:120px; padding:4px 8px; border:1px solid #ddd; border-radius:4px;">
                <input type="text" class="form-input" placeholder="Branche" data-field="branch" data-index="${i}" style="width:100px; padding:4px 8px; border:1px solid #ddd; border-radius:4px;">
                <input type="text" class="form-input" placeholder="Centre" data-field="cost_center" data-index="${i}" style="width:80px; padding:4px 8px; border:1px solid #ddd; border-radius:4px;">
            </div>
            <div style="display:flex; gap:10px; align-items:start;">
                <span style="font-size:12px; color:#666; margin-top:5px; width:60px;">Feuilles:</span>
                <select multiple data-field="sheets" data-index="${i}" style="flex:1; height:60px; font-size:12px; border:1px solid #ddd; border-radius:4px; padding:4px;">
                    ${sheetOptions}
                </select>
            </div>
            <div style="font-size:11px; color:#888; text-align:right;">Maintenez Ctrl pour sélectionner plusieurs feuilles</div>
        </div>
    `}).join('');

    document.getElementById('files-list').innerHTML = listHtml;
}

function getFileInfos() {
    const infos = [];
    consolidationState.uploadedFilesInfo.forEach((fileInfo, i) => {
        // Get metadata inputs
        const respInput = document.querySelector(`[data-index="${i}"][data-field="responsible"]`);
        const branchInput = document.querySelector(`[data-index="${i}"][data-field="branch"]`);
        const costInput = document.querySelector(`[data-index="${i}"][data-field="cost_center"]`);

        // Get selected sheets
        const sheetSelect = document.querySelector(`[data-index="${i}"][data-field="sheets"]`);
        const selectedSheets = Array.from(sheetSelect && sheetSelect.selectedOptions ? sheetSelect.selectedOptions : []).map(opt => opt.value);

        infos.push({
            filepath: fileInfo.path, // Use stored path from upload response
            responsible: respInput ? respInput.value : `Site ${i + 1}`,
            branch: branchInput ? branchInput.value : `Branche ${i + 1}`,
            cost_center: costInput ? costInput.value : '',
            sheets: selectedSheets.length > 0 ? selectedSheets : ['Feuille1']
        });
    });
    return infos;
}

async function uploadFiles() {
    const formData = new FormData();
    consolidationState.files.forEach(f => formData.append('files', f));

    const response = await fetch('/api/upload-files/', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (data.success) {
        consolidationState.uploadedFilesInfo = data.files;
        consolidationState.uploadedPaths = data.files.map(f => f.path);
        return true;
    } else {
        throw new Error(data.error);
    }
}

async function analyzeWithAI() {
    const apiKey = document.getElementById('cons-api-key').value.trim();
    const description = document.getElementById('cons-description').value.trim();

    if (!apiKey) {
        showConsolidationStatus('Entrez votre clé API Z.ai', 'error');
        return;
    }

    showLoading(true);

    try {
        // Files should already be uploaded if they are in the list
        if (consolidationState.uploadedPaths.length === 0) {
            // Only try upload if files selected but not uploaded (edge case)
            if (consolidationState.files.length > 0) {
                await uploadFiles();
                renderFilesList();
            } else {
                throw new Error("Veuillez sélectionner des fichiers d'abord");
            }
        }

        const response = await fetch('/api/ai-consolidate/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: consolidationState.uploadedPaths,
                description: description,
                api_key: apiKey
            })
        });

        const data = await response.json();

        if (data.success && data.config) {
            // Apply AI suggestions
            if (data.config.sheet_name) document.getElementById('cons-sheet').value = data.config.sheet_name;
            if (data.config.start_column) document.getElementById('cons-start-col').value = data.config.start_column;
            if (data.config.end_column) document.getElementById('cons-end-col').value = data.config.end_column;
            if (data.config.start_row) document.getElementById('cons-start-row').value = data.config.start_row;
            if (data.config.end_row) document.getElementById('cons-end-row').value = data.config.end_row;

            showConsolidationStatus('✅ Configuration IA appliquée!', 'success');
        } else {
            showConsolidationStatus(data.error || 'Erreur IA', 'error');
        }
    } catch (error) {
        showConsolidationStatus(`Erreur: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function startConsolidation() {
    if (consolidationState.uploadedFilesInfo.length === 0) {
        showConsolidationStatus('Sélectionnez des fichiers', 'error');
        return;
    }

    showLoading(true);

    try {
        const fileInfos = getFileInfos();

        const response = await fetch('/api/consolidate/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: fileInfos,
                sheet_name: document.getElementById('cons-sheet').value, // Global fallback
                start_column: document.getElementById('cons-start-col').value.toUpperCase(),
                end_column: document.getElementById('cons-end-col').value.toUpperCase(),
                start_row: parseInt(document.getElementById('cons-start-row').value),
                end_row: parseInt(document.getElementById('cons-end-row').value),
                group_by: document.getElementById('cons-group-by').value
            })
        });

        const data = await response.json();

        if (data.success) {
            showConsolidationStatus('✅ Consolidation réussie!', 'success');
            closeConsolidationModal();
            window.location.href = data.download_url;
        } else {
            showConsolidationStatus(data.error, 'error');
        }
    } catch (error) {
        showConsolidationStatus(`Erreur: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function showConsolidationStatus(message, type) {
    const statusEl = document.getElementById('cons-status');
    statusEl.textContent = message;
    statusEl.className = `ai-status ${type}`;
}

// ============================================
// TEST CONSOLIDATION FEATURE
// ============================================

function switchConsTab(tab) {
    // Update buttons
    document.querySelectorAll('.cons-mode-tabs .btn-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-cons-${tab}`).classList.add('active');

    // Update content
    document.querySelectorAll('.cons-tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.cons-tab-content').forEach(content => content.style.display = 'none');

    const activeContent = document.getElementById(`cons-content-${tab}`);
    activeContent.classList.add('active');
    activeContent.style.display = 'block';

    if (tab === 'test') {
        renderTestTabs();
    }
}

function renderTestTabs() {
    const tabsContainer = document.getElementById('test-file-tabs');
    const files = consolidationState.uploadedFilesInfo || [];

    if (files.length === 0) {
        tabsContainer.innerHTML = '<button class="file-tab active">Aucun fichier chargé</button>';
        return;
    }

    let html = '';
    files.forEach((file, index) => {
        html += `<button class="file-tab ${index === 0 ? 'active' : ''}" onclick="loadTestFileContent('${file.filepath}', this)">📄 ${file.name}</button>`;
    });

    // Add result tab placeholder (disabled until calculated)
    html += `<button class="file-tab result-tab" id="tab-result" onclick="loadResultContent()" style="display:none; background:#dcfce7; color:#166534; border-color:#86efac;">📊 Résultat Consolidation</button>`;

    tabsContainer.innerHTML = html;

    // Load first file by default
    if (files.length > 0) {
        loadTestFileContent(files[0].filepath, tabsContainer.children[0]);
    }
}

let currentTestFilename = null;

async function loadTestFileContent(filename, tabElement) {
    if (tabElement) {
        document.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));
        tabElement.classList.add('active');
    }

    currentTestFilename = filename;
    showTestLoading();

    try {
        const response = await fetch('/api/sheet-content/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: filename,
                max_rows: 50 // Preview limit
            })
        });

        const data = await response.json();

        if (data.success) {
            renderExcelGrid(data.data, data.sheet_name, data.dimensions);
        } else {
            showTestError(data.error);
        }
    } catch (error) {
        showTestError(error.message);
    }
}

async function calculateConsolidationTest() {
    if (consolidationState.uploadedFilesInfo.length === 0) {
        alert("Veuillez d'abord charger des fichiers dans l'onglet Configuration");
        return;
    }

    const btn = document.querySelector('button[onclick="calculateConsolidationTest()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Calcul en cours...';
    btn.disabled = true;

    try {
        const fileInfos = getFileInfos();

        const response = await fetch('/api/preview-consolidation/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: fileInfos,
                sheet_name: document.getElementById('cons-sheet').value,
                start_column: document.getElementById('cons-start-col').value.toUpperCase(),
                end_column: document.getElementById('cons-end-col').value.toUpperCase(),
                start_row: parseInt(document.getElementById('cons-start-row').value),
                end_row: parseInt(document.getElementById('cons-end-row').value),
                group_by: document.getElementById('cons-group-by').value
            })
        });

        const data = await response.json();

        if (data.success) {
            // Show result tab
            const resultTab = document.getElementById('tab-result');
            resultTab.style.display = 'inline-block';
            resultTab.setAttribute('data-filename', data.filename);

            // Switch to it
            loadResultContent();
        } else {
            alert('Erreur: ' + data.error);
        }

    } catch (error) {
        console.error(error);
        alert('Erreur de communication avec le serveur');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function loadResultContent() {
    const resultTab = document.getElementById('tab-result');
    const filename = resultTab.getAttribute('data-filename');

    if (filename) {
        loadTestFileContent(filename, resultTab);
    }
}

function renderExcelGrid(data, sheetName, dimensions) {
    const table = document.getElementById('test-preview-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    // Update info bar
    document.getElementById('preview-sheet-name').textContent = sheetName || 'Inconnu';
    document.getElementById('preview-rows').textContent = dimensions ? dimensions.rows : data.length;
    document.getElementById('preview-cols').textContent = dimensions ? dimensions.cols : (data[0] ? data[0].length : 0);

    // Clear
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td style="padding:20px; text-align:center;">Aucune donnée</td></tr>';
        return;
    }

    // Header (A, B, C...)
    let headHtml = '<tr><th class="row-header"></th>'; // Corner cell
    const colCount = data[0].length;

    for (let i = 0; i < colCount; i++) {
        headHtml += `<th>${getColumnLetter(i + 1)}</th>`;
    }
    headHtml += '</tr>';
    thead.innerHTML = headHtml;

    // Body
    let bodyHtml = '';
    data.forEach((row, rowIndex) => {
        bodyHtml += `<tr>`;
        bodyHtml += `<td class="row-header">${rowIndex + 1}</td>`; // Row number

        row.forEach(cell => {
            const val = cell === null || cell === undefined ? '' : cell;
            bodyHtml += `<td>${val}</td>`;
        });

        bodyHtml += `</tr>`;
    });
    tbody.innerHTML = bodyHtml;
}

function getColumnLetter(colIndex) {
    let temp, letter = '';
    while (colIndex > 0) {
        temp = (colIndex - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        colIndex = (colIndex - temp - 1) / 26;
    }
    return letter;
}

function showTestLoading() {
    const tbody = document.querySelector('#test-preview-table tbody');
    tbody.innerHTML = '<tr><td colspan="100" style="padding:40px; text-align:center;"><div class="loading-spinner" style="margin:0 auto 10px;"></div>Chargement des données...</td></tr>';
}

function showTestError(msg) {
    const tbody = document.querySelector('#test-preview-table tbody');
    tbody.innerHTML = `<tr><td colspan="100" style="padding:40px; text-align:center; color:#ef4444;">❌ ${msg}</td></tr>`;
}
