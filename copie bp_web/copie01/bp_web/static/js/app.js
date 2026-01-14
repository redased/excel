/**
 * Excel Creator BP 2026 - Web Application
 * JavaScript for UI interactions and API calls
 */

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    sheets: [
        {
            name: 'Feuille1',
            columns: [],
            rows: [],
            cells: [],
            merges: []
        }
    ],
    currentSheetIndex: 0,
    downloadUrl: null
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    sheetList: document.getElementById('sheet-list'),
    sheetName: document.getElementById('sheet-name'),
    columnsTable: document.getElementById('columns-table').querySelector('tbody'),
    rowsTable: document.getElementById('rows-table').querySelector('tbody'),
    cellsTable: document.getElementById('cells-table').querySelector('tbody'),
    mergesTable: document.getElementById('merges-table').querySelector('tbody'),
    previewTable: document.getElementById('preview-table').querySelector('tbody'),
    aiModal: document.getElementById('ai-modal'),
    loadingOverlay: document.getElementById('loading-overlay'),
    btnDownload: document.getElementById('btn-download'),
    aiStatus: document.getElementById('ai-status')
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSheets();
    initColumns();
    initRows();
    initCells();
    initMerges();
    initAI();
    initButtons();
    updatePreview();
});

// ============================================
// TABS
// ============================================
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

// ============================================
// SHEETS
// ============================================
function initSheets() {
    renderSheetList();
    
    document.getElementById('btn-add-sheet').addEventListener('click', addSheet);
    
    elements.sheetName.addEventListener('input', (e) => {
        state.sheets[state.currentSheetIndex].name = e.target.value;
        renderSheetList();
    });
}

function renderSheetList() {
    elements.sheetList.innerHTML = state.sheets.map((sheet, index) => `
        <li class="sheet-item ${index === state.currentSheetIndex ? 'active' : ''}" data-index="${index}">
            <span class="sheet-icon">📄</span>
            <span class="sheet-name">${sheet.name}</span>
            <button class="btn-delete-sheet" title="Supprimer" onclick="event.stopPropagation(); deleteSheet(${index})">🗑️</button>
        </li>
    `).join('');
    
    elements.sheetList.querySelectorAll('.sheet-item').forEach(item => {
        item.addEventListener('click', () => selectSheet(parseInt(item.dataset.index)));
    });
}

function selectSheet(index) {
    state.currentSheetIndex = index;
    const sheet = state.sheets[index];
    
    elements.sheetName.value = sheet.name;
    renderSheetList();
    renderColumns();
    renderRows();
    renderCells();
    renderMerges();
    updatePreview();
}

function addSheet() {
    const newSheet = {
        name: `Feuille${state.sheets.length + 1}`,
        columns: [],
        rows: [],
        cells: [],
        merges: []
    };
    state.sheets.push(newSheet);
    selectSheet(state.sheets.length - 1);
}

function deleteSheet(index) {
    if (state.sheets.length <= 1) {
        alert('Vous devez garder au moins une feuille.');
        return;
    }
    
    state.sheets.splice(index, 1);
    if (state.currentSheetIndex >= state.sheets.length) {
        state.currentSheetIndex = state.sheets.length - 1;
    }
    selectSheet(state.currentSheetIndex);
}

// ============================================
// COLUMNS
// ============================================
function initColumns() {
    document.getElementById('btn-add-cols').addEventListener('click', () => {
        const count = parseInt(document.getElementById('col-count').value) || 1;
        const sheet = state.sheets[state.currentSheetIndex];
        const startIndex = sheet.columns.length + 1;
        
        for (let i = 0; i < count; i++) {
            sheet.columns.push({
                index: startIndex + i,
                width: 12,
                header: ''
            });
        }
        
        renderColumns();
        updatePreview();
    });
}

function renderColumns() {
    const sheet = state.sheets[state.currentSheetIndex];
    elements.columnsTable.innerHTML = sheet.columns.map((col, i) => `
        <tr>
            <td>${getColumnLetter(col.index)}</td>
            <td><input type="number" value="${col.width}" min="1" max="100" onchange="updateColumn(${i}, 'width', this.value)"></td>
            <td><input type="text" value="${col.header}" placeholder="En-tête..." onchange="updateColumn(${i}, 'header', this.value)"></td>
            <td><button class="btn-delete" onclick="deleteColumn(${i})">🗑️</button></td>
        </tr>
    `).join('');
}

function updateColumn(index, field, value) {
    const sheet = state.sheets[state.currentSheetIndex];
    sheet.columns[index][field] = field === 'width' ? parseFloat(value) : value;
    updatePreview();
}

function deleteColumn(index) {
    state.sheets[state.currentSheetIndex].columns.splice(index, 1);
    renderColumns();
    updatePreview();
}

// ============================================
// ROWS
// ============================================
function initRows() {
    document.getElementById('btn-add-rows').addEventListener('click', () => {
        const count = parseInt(document.getElementById('row-count').value) || 1;
        const sheet = state.sheets[state.currentSheetIndex];
        const startIndex = sheet.rows.length + 1;
        
        for (let i = 0; i < count; i++) {
            sheet.rows.push({
                index: startIndex + i,
                height: 15
            });
        }
        
        renderRows();
        updatePreview();
    });
}

function renderRows() {
    const sheet = state.sheets[state.currentSheetIndex];
    elements.rowsTable.innerHTML = sheet.rows.map((row, i) => `
        <tr>
            <td>${row.index}</td>
            <td><input type="number" value="${row.height}" min="5" max="500" onchange="updateRow(${i}, 'height', this.value)"></td>
            <td><button class="btn-delete" onclick="deleteRow(${i})">🗑️</button></td>
        </tr>
    `).join('');
}

function updateRow(index, field, value) {
    state.sheets[state.currentSheetIndex].rows[index][field] = parseFloat(value);
    updatePreview();
}

function deleteRow(index) {
    state.sheets[state.currentSheetIndex].rows.splice(index, 1);
    renderRows();
    updatePreview();
}

// ============================================
// CELLS
// ============================================
function initCells() {
    document.getElementById('btn-add-cell').addEventListener('click', addCell);
}

function addCell() {
    const sheet = state.sheets[state.currentSheetIndex];
    
    const bgColor = document.getElementById('cell-bg-color').value.slice(1).toUpperCase();
    const fontColor = document.getElementById('cell-font-color').value.slice(1).toUpperCase();
    
    const cell = {
        row: parseInt(document.getElementById('cell-row').value),
        col: parseInt(document.getElementById('cell-col').value),
        value: document.getElementById('cell-value').value,
        style: {
            bold: document.getElementById('cell-bold').checked,
            italic: document.getElementById('cell-italic').checked,
            underline: document.getElementById('cell-underline').checked,
            bg_color: bgColor === 'FFFFFF' ? null : bgColor,
            font_color: fontColor,
            font_size: parseInt(document.getElementById('cell-font-size').value),
            alignment: document.getElementById('cell-align').value,
            border_style: document.getElementById('cell-border').value || null
        }
    };
    
    sheet.cells.push(cell);
    renderCells();
    updatePreview();
    
    // Clear inputs
    document.getElementById('cell-value').value = '';
}

function renderCells() {
    const sheet = state.sheets[state.currentSheetIndex];
    elements.cellsTable.innerHTML = sheet.cells.map((cell, i) => {
        const styleDesc = [];
        if (cell.style.bold) styleDesc.push('B');
        if (cell.style.italic) styleDesc.push('I');
        if (cell.style.underline) styleDesc.push('U');
        styleDesc.push(`${cell.style.font_size}pt`);
        
        return `
            <tr>
                <td>${getColumnLetter(cell.col)}${cell.row}</td>
                <td>${cell.value}</td>
                <td>${styleDesc.join(' ')}</td>
                <td><button class="btn-delete" onclick="deleteCell(${i})">🗑️</button></td>
            </tr>
        `;
    }).join('');
}

function deleteCell(index) {
    state.sheets[state.currentSheetIndex].cells.splice(index, 1);
    renderCells();
    updatePreview();
}

// ============================================
// MERGES
// ============================================
function initMerges() {
    document.getElementById('btn-add-merge').addEventListener('click', addMerge);
}

function addMerge() {
    const sheet = state.sheets[state.currentSheetIndex];
    
    const merge = {
        start_row: parseInt(document.getElementById('merge-start-row').value),
        start_col: parseInt(document.getElementById('merge-start-col').value),
        end_row: parseInt(document.getElementById('merge-end-row').value),
        end_col: parseInt(document.getElementById('merge-end-col').value)
    };
    
    if (merge.end_row < merge.start_row || merge.end_col < merge.start_col) {
        alert('La cellule de fin doit être après la cellule de début.');
        return;
    }
    
    sheet.merges.push(merge);
    renderMerges();
    updatePreview();
}

function renderMerges() {
    const sheet = state.sheets[state.currentSheetIndex];
    elements.mergesTable.innerHTML = sheet.merges.map((merge, i) => {
        const range = `${getColumnLetter(merge.start_col)}${merge.start_row}:${getColumnLetter(merge.end_col)}${merge.end_row}`;
        const cellCount = (merge.end_row - merge.start_row + 1) * (merge.end_col - merge.start_col + 1);
        
        return `
            <tr>
                <td>${range}</td>
                <td>${cellCount} cellules</td>
                <td><button class="btn-delete" onclick="deleteMerge(${i})">🗑️</button></td>
            </tr>
        `;
    }).join('');
}

function deleteMerge(index) {
    state.sheets[state.currentSheetIndex].merges.splice(index, 1);
    renderMerges();
    updatePreview();
}

// ============================================
// PREVIEW
// ============================================
function updatePreview() {
    const sheet = state.sheets[state.currentSheetIndex];
    
    let maxRow = 5;
    let maxCol = 5;
    
    sheet.columns.forEach(c => maxCol = Math.max(maxCol, c.index));
    sheet.cells.forEach(c => {
        maxRow = Math.max(maxRow, c.row);
        maxCol = Math.max(maxCol, c.col);
    });
    sheet.merges.forEach(m => {
        maxRow = Math.max(maxRow, m.end_row);
        maxCol = Math.max(maxCol, m.end_col);
    });
    
    // Build header
    let html = '<tr><th></th>';
    for (let c = 1; c <= maxCol; c++) {
        const colConfig = sheet.columns.find(col => col.index === c);
        const header = colConfig?.header || getColumnLetter(c);
        html += `<th>${header}</th>`;
    }
    html += '</tr>';
    
    // Build rows
    for (let r = 1; r <= maxRow; r++) {
        html += `<tr><td style="background:#4472C4;color:white;font-weight:bold;">${r}</td>`;
        
        for (let c = 1; c <= maxCol; c++) {
            const cell = sheet.cells.find(cell => cell.row === r && cell.col === c);
            let style = '';
            let content = '';
            
            if (cell) {
                content = cell.value;
                if (cell.style.bold) style += 'font-weight:bold;';
                if (cell.style.italic) style += 'font-style:italic;';
                if (cell.style.underline) style += 'text-decoration:underline;';
                if (cell.style.bg_color) style += `background:#${cell.style.bg_color};`;
                if (cell.style.font_color) style += `color:#${cell.style.font_color};`;
                if (cell.style.alignment) style += `text-align:${cell.style.alignment};`;
            }
            
            html += `<td style="${style}">${content}</td>`;
        }
        
        html += '</tr>';
    }
    
    elements.previewTable.innerHTML = html;
}

// ============================================
// AI MODAL
// ============================================
function initAI() {
    document.getElementById('btn-ai').addEventListener('click', () => {
        elements.aiModal.classList.add('show');
    });
    
    document.querySelector('.modal-close').addEventListener('click', closeAIModal);
    document.querySelector('.modal-cancel').addEventListener('click', closeAIModal);
    
    elements.aiModal.addEventListener('click', (e) => {
        if (e.target === elements.aiModal) closeAIModal();
    });
    
    document.getElementById('btn-ai-generate').addEventListener('click', generateWithAI);
}

function closeAIModal() {
    elements.aiModal.classList.remove('show');
    elements.aiStatus.className = 'ai-status';
    elements.aiStatus.textContent = '';
}

async function generateWithAI() {
    const apiKey = document.getElementById('ai-api-key').value.trim();
    const prompt = document.getElementById('ai-prompt').value.trim();
    
    if (!apiKey) {
        showAIStatus('Veuillez entrer votre clé API Z.ai', 'error');
        return;
    }
    
    if (!prompt) {
        showAIStatus('Veuillez entrer une description', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/ai-generate/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, api_key: apiKey })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Apply generated configuration
            state.sheets = data.config.sheets || [{ name: 'Feuille1', columns: [], rows: [], cells: [], merges: [] }];
            state.currentSheetIndex = 0;
            
            selectSheet(0);
            closeAIModal();
            
            showAIStatus('Configuration générée avec succès!', 'success');
        } else {
            showAIStatus(data.error, 'error');
        }
    } catch (error) {
        showAIStatus(`Erreur: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function showAIStatus(message, type) {
    elements.aiStatus.textContent = message;
    elements.aiStatus.className = `ai-status ${type}`;
}

// ============================================
// BUTTONS
// ============================================
function initButtons() {
    document.getElementById('btn-new').addEventListener('click', () => {
        if (confirm('Créer un nouveau projet? Les modifications non sauvegardées seront perdues.')) {
            state.sheets = [{ name: 'Feuille1', columns: [], rows: [], cells: [], merges: [] }];
            state.currentSheetIndex = 0;
            state.downloadUrl = null;
            selectSheet(0);
            elements.btnDownload.disabled = true;
        }
    });
    
    elements.btnDownload.addEventListener('click', () => {
        if (state.downloadUrl) {
            window.location.href = state.downloadUrl;
        } else {
            generateExcel();
        }
    });
}

async function generateExcel() {
    showLoading(true);
    
    try {
        const config = { sheets: state.sheets };
        
        const response = await fetch('/api/generate/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config, name: 'BP 2026' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            state.downloadUrl = data.download_url;
            elements.btnDownload.disabled = false;
            window.location.href = data.download_url;
        } else {
            alert(`Erreur: ${data.error}`);
        }
    } catch (error) {
        alert(`Erreur: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// ============================================
// UTILITIES
// ============================================
function getColumnLetter(index) {
    let letter = '';
    while (index > 0) {
        const mod = (index - 1) % 26;
        letter = String.fromCharCode(65 + mod) + letter;
        index = Math.floor((index - 1) / 26);
    }
    return letter;
}

function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}
