/**
 * Test Fichiers - File Comparison and Verification
 */

// State
let testFilesData = {
    sourceFiles: [],
    responsableName: '',
    resultFile: null,
    resultBlob: null,  // Store generated file blob
    allSheets: [],
    selectedSheet: '',
    comparisonErrors: []
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('Test Fichiers module loaded');
    initTestFilesDropZones();
});

function initTestFilesDropZones() {
    // Folder drop zone (source files)
    const folderDropZone = document.getElementById('testfiles-folder-drop');
    const folderInput = document.getElementById('testfiles-folder-input');

    if (folderDropZone) {
        // Click to open folder picker
        folderDropZone.addEventListener('click', () => {
            if (folderInput) folderInput.click();
        });

        folderDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderDropZone.style.borderColor = '#2563eb';
            folderDropZone.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
        });

        folderDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderDropZone.style.borderColor = '#3b82f6';
            folderDropZone.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
        });

        folderDropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderDropZone.style.borderColor = '#3b82f6';
            folderDropZone.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';

            // Handle folder drop
            await handleFolderDrop(e.dataTransfer);
        });
    }

    // Folder input change (for click-to-select)
    if (folderInput) {
        folderInput.addEventListener('change', (e) => {
            handleFolderInputChange(e.target.files);
        });
    }

    // Result file drop zone
    const resultDropZone = document.getElementById('testfiles-result-drop');
    const resultInput = document.getElementById('testfiles-result-input');

    if (resultDropZone && resultInput) {
        resultDropZone.addEventListener('click', () => resultInput.click());

        resultDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            resultDropZone.style.borderColor = '#059669';
        });

        resultDropZone.addEventListener('dragleave', () => {
            resultDropZone.style.borderColor = '#10b981';
        });

        resultDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            resultDropZone.style.borderColor = '#10b981';
            if (e.dataTransfer.files.length > 0) {
                handleResultFile(e.dataTransfer.files[0]);
            }
        });

        resultInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleResultFile(e.target.files[0]);
            }
        });
    }
}

// ============================================
// FOLDER HANDLING
// ============================================

async function handleFolderDrop(dataTransfer) {
    const items = dataTransfer.items;
    const files = [];
    let folderName = '';

    // Process all items to find Excel files
    for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
            if (item.isDirectory) {
                folderName = item.name;
                await traverseDirectory(item, files);
            } else if (item.isFile && (item.name.endsWith('.xlsx') || item.name.endsWith('.xls'))) {
                const file = await getFileFromEntry(item);
                if (file && !file.name.startsWith('~$')) {
                    files.push(file);
                }
            }
        }
    }

    // Update state
    testFilesData.sourceFiles = files;
    testFilesData.responsableName = folderName || 'Fichiers';

    // Update UI
    updateResponsableInfo();
    renderSourceFilesList();
    parseSourceSheets();
    updateCompareButton();
}

// Handle folder selection via click (webkitdirectory input)
function handleFolderInputChange(fileList) {
    const files = [];
    let folderName = '';

    // Get folder name from first file's path
    if (fileList.length > 0) {
        const firstPath = fileList[0].webkitRelativePath || fileList[0].name;
        const pathParts = firstPath.split('/');
        if (pathParts.length > 1) {
            folderName = pathParts[0];
        }
    }

    // Filter Excel files
    for (const file of fileList) {
        if ((file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) && !file.name.startsWith('~$')) {
            files.push(file);
        }
    }

    // Update state
    testFilesData.sourceFiles = files;
    testFilesData.responsableName = folderName || 'Fichiers';

    // Update UI
    updateResponsableInfo();
    renderSourceFilesList();
    parseSourceSheets();
    updateCompareButton();
}

async function traverseDirectory(directoryEntry, files) {
    const reader = directoryEntry.createReader();
    const entries = await new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
    });

    for (const entry of entries) {
        if (entry.isFile && (entry.name.endsWith('.xlsx') || entry.name.endsWith('.xls')) && !entry.name.startsWith('~$')) {
            const file = await getFileFromEntry(entry);
            if (file) files.push(file);
        } else if (entry.isDirectory) {
            await traverseDirectory(entry, files);
        }
    }
}

function getFileFromEntry(fileEntry) {
    return new Promise((resolve, reject) => {
        fileEntry.file(resolve, reject);
    });
}

function updateResponsableInfo() {
    const infoBox = document.getElementById('testfiles-responsable-info');
    const nameEl = document.getElementById('testfiles-responsable-name');
    const countEl = document.getElementById('testfiles-file-count');

    if (infoBox && testFilesData.sourceFiles.length > 0) {
        infoBox.style.display = 'block';
        if (nameEl) nameEl.textContent = testFilesData.responsableName;
        if (countEl) countEl.textContent = testFilesData.sourceFiles.length;
    } else if (infoBox) {
        infoBox.style.display = 'none';
    }
}

function handleResultFile(file) {
    testFilesData.resultFile = file;

    const label = document.getElementById('result-file-label');
    const status = document.getElementById('result-file-status');

    if (label) label.textContent = '✅ ' + file.name;
    if (status) {
        status.textContent = 'Chargé';
        status.style.background = '#10b981';
    }

    updateCompareButton();
}

function renderSourceFilesList() {
    const container = document.getElementById('source-files-list');
    const countEl = document.getElementById('source-files-count');

    if (!container) return;

    if (testFilesData.sourceFiles.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; font-size: 13px; text-align: center;">Aucun dossier chargé</p>';
        if (countEl) countEl.textContent = '0 fichiers';
        return;
    }

    let html = '';
    testFilesData.sourceFiles.forEach((file, idx) => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f1f5f9; border-radius: 6px; margin-bottom: 6px;">
                <span style="font-size: 13px;">📄 ${file.name}</span>
                <button onclick="removeTestSourceFile(${idx})" style="background: none; border: none; cursor: pointer; color: #ef4444;">✕</button>
            </div>
        `;
    });

    container.innerHTML = html;
    if (countEl) countEl.textContent = testFilesData.sourceFiles.length + ' fichiers';
}

function removeTestSourceFile(idx) {
    testFilesData.sourceFiles.splice(idx, 1);
    renderSourceFilesList();
    updateResponsableInfo();
    parseSourceSheets();
    updateCompareButton();
}

async function parseSourceSheets() {
    if (testFilesData.sourceFiles.length === 0) {
        document.getElementById('testfiles-sheet-select').innerHTML = '<option value="">-- Chargez des fichiers --</option>';
        return;
    }

    // Use first file to get sheets
    const formData = new FormData();
    formData.append('files', testFilesData.sourceFiles[0]);

    try {
        const response = await fetch('/api/consbulle/parse-sheets/', {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': getCSRFToken() }
        });

        if (response.ok) {
            const data = await response.json();
            const fileName = testFilesData.sourceFiles[0].name;
            testFilesData.allSheets = data.file_sheets[fileName] || [];

            const select = document.getElementById('testfiles-sheet-select');
            if (select) {
                select.innerHTML = testFilesData.allSheets.map(s =>
                    `<option value="${s}">${s}</option>`
                ).join('');
                testFilesData.selectedSheet = testFilesData.allSheets[0] || '';
            }
        }
    } catch (error) {
        console.error('Error parsing sheets:', error);
    }
}

function updateCompareButton() {
    const btn = document.getElementById('btn-compare-files');
    if (btn) {
        btn.disabled = !(testFilesData.sourceFiles.length > 0 && testFilesData.resultFile);
    }
}

// ============================================
// COMPARISON LOGIC
// ============================================

async function compareFiles() {
    const sheetSelect = document.getElementById('testfiles-sheet-select');
    const selectedSheet = sheetSelect?.value || testFilesData.selectedSheet;

    if (!selectedSheet) {
        alert('Sélectionnez une feuille à comparer');
        return;
    }

    const formData = new FormData();
    testFilesData.sourceFiles.forEach(f => formData.append('source_files', f));
    formData.append('result_file', testFilesData.resultFile);
    formData.append('sheet_name', selectedSheet);

    const btn = document.getElementById('btn-compare-files');
    if (btn) btn.textContent = '⏳ Comparaison...';

    try {
        const response = await fetch('/api/verify/compare/', {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': getCSRFToken() }
        });

        if (response.ok) {
            const data = await response.json();
            displayComparisonResults(data);
        } else {
            const errorData = await response.json();
            alert('Erreur: ' + (errorData.error || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Comparison error:', error);
        alert('Erreur de comparaison: ' + error.message);
    } finally {
        if (btn) btn.textContent = '🔍 Comparer';
    }
}

function displayComparisonResults(data) {
    const container = document.getElementById('comparison-table-container');
    const statCorrect = document.getElementById('stat-correct');
    const statErrors = document.getElementById('stat-errors');
    const errorCard = document.getElementById('error-details-card');
    const errorList = document.getElementById('error-list');
    const correctBtn = document.getElementById('btn-correct-errors');

    testFilesData.comparisonErrors = data.errors || [];

    // Update stats
    if (statCorrect) statCorrect.textContent = data.correct_count || 0;
    if (statErrors) statErrors.textContent = data.error_count || 0;

    // Build comparison table
    if (container && data.comparison_table) {
        let html = '<table style="width: 100%; border-collapse: collapse; font-size: 13px;">';

        // Header row
        html += '<thead><tr style="background: #f8fafc;">';
        html += '<th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Cellule</th>';
        data.source_file_names?.forEach(name => {
            html += `<th style="padding: 10px; border: 1px solid #e2e8f0;">${name}</th>`;
        });
        html += '<th style="padding: 10px; border: 1px solid #e2e8f0; background: #dbeafe;">Résultat</th>';
        html += '<th style="padding: 10px; border: 1px solid #e2e8f0; background: #d1fae5;">Attendu</th>';
        html += '<th style="padding: 10px; border: 1px solid #e2e8f0;">Status</th>';
        html += '</tr></thead><tbody>';

        // Data rows
        data.comparison_table.forEach(row => {
            const isError = row.status === 'error';
            const rowStyle = isError ? 'background: #fef2f2;' : '';

            html += `<tr style="${rowStyle}">`;
            html += `<td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">${row.cell}</td>`;

            row.source_values?.forEach(val => {
                html += `<td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${formatNumber(val)}</td>`;
            });

            const resultStyle = isError ? 'color: #dc2626; font-weight: bold;' : '';
            html += `<td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; background: #eff6ff; ${resultStyle}">${formatNumber(row.result_value)}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; background: #ecfdf5;">${formatNumber(row.expected_value)}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${isError ? '❌' : '✅'}</td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    // Show error details if any
    if (errorCard && errorList) {
        if (testFilesData.comparisonErrors.length > 0) {
            errorCard.style.display = 'block';
            correctBtn.style.display = 'inline-block';

            let errorHtml = '';
            testFilesData.comparisonErrors.forEach(err => {
                errorHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 10px; background: #fef2f2; border-radius: 6px; margin-bottom: 8px; border: 1px solid #fecaca;">
                        <span><strong>${err.cell}</strong>: Résultat = ${formatNumber(err.actual)}</span>
                        <span>Attendu = <strong>${formatNumber(err.expected)}</strong></span>
                        <span style="color: #dc2626;">Différence: ${formatNumber(err.difference)}</span>
                    </div>
                `;
            });
            errorList.innerHTML = errorHtml;
        } else {
            errorCard.style.display = 'none';
            correctBtn.style.display = 'none';
        }
    }
}

function formatNumber(val) {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') return val.toLocaleString('fr-FR');
    return val;
}

// ============================================
// ERROR CORRECTION
// ============================================

async function correctErrors() {
    if (testFilesData.comparisonErrors.length === 0) {
        alert('Aucune erreur à corriger');
        return;
    }

    const sheetSelect = document.getElementById('testfiles-sheet-select');
    const selectedSheet = sheetSelect?.value || testFilesData.selectedSheet;

    const formData = new FormData();
    formData.append('result_file', testFilesData.resultFile);
    formData.append('sheet_name', selectedSheet);
    formData.append('corrections', JSON.stringify(testFilesData.comparisonErrors.map(e => ({
        cell: e.cell,
        value: e.expected
    }))));

    const btn = document.getElementById('btn-correct-errors');
    if (btn) btn.textContent = '⏳ Correction...';

    try {
        const response = await fetch('/api/verify/correct/', {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': getCSRFToken() }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Consolidation_Corrigee.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);

            alert('✅ Fichier corrigé téléchargé !');
        } else {
            const errorData = await response.json();
            alert('Erreur: ' + (errorData.error || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Correction error:', error);
        alert('Erreur de correction: ' + error.message);
    } finally {
        if (btn) btn.textContent = '🔧 Corriger les erreurs';
    }
}

// ============================================
// AUTO-LOAD GENERATED FILE
// ============================================

// This function is called from consbulle.js after successful generation
function autoLoadGeneratedFile(blob, filename) {
    testFilesData.resultBlob = blob;
    testFilesData.resultFile = new File([blob], filename, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const label = document.getElementById('result-file-label');
    const status = document.getElementById('result-file-status');

    if (label) label.textContent = '✅ ' + filename + ' (auto-chargé)';
    if (status) {
        status.textContent = 'Auto-chargé';
        status.style.background = '#10b981';
    }

    updateCompareButton();
}
