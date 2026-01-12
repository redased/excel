"""
AI Prompt Dialog for generating Excel configurations
"""
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit,
    QPushButton, QComboBox, QLineEdit, QGroupBox, QFormLayout,
    QProgressBar, QMessageBox, QFrame
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QFont

from core.ai_generator import AIExcelGenerator, AIConfig, AIProvider, get_provider_info
from core.models import WorkbookConfig


class AIWorker(QThread):
    """Worker thread for AI generation"""
    finished = pyqtSignal(object)  # WorkbookConfig or Exception
    
    def __init__(self, generator: AIExcelGenerator, prompt: str):
        super().__init__()
        self.generator = generator
        self.prompt = prompt
    
    def run(self):
        try:
            config = self.generator.generate_config(self.prompt)
            self.finished.emit(config)
        except Exception as e:
            self.finished.emit(e)


class AIPromptDialog(QDialog):
    """Dialog for AI-powered Excel generation"""
    
    configGenerated = pyqtSignal(object)  # WorkbookConfig
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.generator = AIExcelGenerator()
        self.worker = None
        self._setup_ui()
        self._load_saved_config()
    
    def _setup_ui(self):
        self.setWindowTitle("🤖 Génération IA - Excel BP 2026")
        self.setMinimumSize(700, 600)
        self.setModal(True)
        
        layout = QVBoxLayout(self)
        layout.setSpacing(15)
        layout.setContentsMargins(20, 20, 20, 20)
        
        # Header
        header = QLabel("🤖 Génération par Intelligence Artificielle")
        header.setStyleSheet("""
            font-size: 20px;
            font-weight: bold;
            color: #a78bfa;
            padding: 10px;
        """)
        layout.addWidget(header)
        
        # Description
        desc = QLabel(
            "Décrivez en langage naturel le fichier Excel que vous souhaitez créer.\n"
            "L'IA génèrera automatiquement toute la configuration (feuilles, colonnes, cellules, fusions, formatage)."
        )
        desc.setStyleSheet("color: #a0a0c0; padding: 5px;")
        desc.setWordWrap(True)
        layout.addWidget(desc)
        
        # API Configuration
        api_group = QGroupBox("🔑 Configuration API")
        api_layout = QFormLayout(api_group)
        
        # Provider selection
        self.provider_combo = QComboBox()
        self.provider_combo.addItem("🚀 Z.ai GLM-4.7 (Recommandé)", AIProvider.ZAI_GLM.value)
        self.provider_combo.addItem("🌐 OpenRouter (GLM-4.7)", AIProvider.OPENROUTER.value)
        self.provider_combo.addItem("✨ Google Gemini (Gratuit)", AIProvider.GEMINI.value)
        self.provider_combo.addItem("🤖 OpenAI GPT-4", AIProvider.OPENAI.value)
        self.provider_combo.currentIndexChanged.connect(self._on_provider_changed)
        api_layout.addRow("Fournisseur IA:", self.provider_combo)
        
        # API Key
        self.api_key_edit = QLineEdit()
        self.api_key_edit.setPlaceholderText("Entrez votre clé API...")
        self.api_key_edit.setEchoMode(QLineEdit.EchoMode.Password)
        api_layout.addRow("Clé API:", self.api_key_edit)
        
        # Provider info
        self.provider_info = QLabel()
        self.provider_info.setStyleSheet("color: #70AD47; font-size: 11px;")
        self.provider_info.setOpenExternalLinks(True)
        api_layout.addRow("", self.provider_info)
        
        layout.addWidget(api_group)
        
        # Prompt input
        prompt_group = QGroupBox("✍️ Votre demande")
        prompt_layout = QVBoxLayout(prompt_group)
        
        self.prompt_edit = QTextEdit()
        self.prompt_edit.setPlaceholderText(
            "Exemple:\n"
            "Créer un tableau budget BP 2026 avec:\n"
            "- Titre \"Budget Prévisionnel 2026\" fusionné sur toute la largeur, centré, gras, bleu foncé\n"
            "- Colonnes: Catégorie, Janvier, Février, Mars, Avril, Mai, Juin, Total\n"
            "- Lignes: Salaires, Fournitures, Déplacements, Formation, Divers, TOTAL\n"
            "- En-têtes avec fond bleu et texte blanc\n"
            "- Ligne TOTAL en gras avec fond gris"
        )
        self.prompt_edit.setMinimumHeight(150)
        prompt_layout.addWidget(self.prompt_edit)
        
        layout.addWidget(prompt_group)
        
        # Progress
        self.progress = QProgressBar()
        self.progress.setRange(0, 0)  # Indeterminate
        self.progress.setVisible(False)
        self.progress.setStyleSheet("""
            QProgressBar {
                border: 2px solid #3d3d5c;
                border-radius: 5px;
                background-color: #16162a;
            }
            QProgressBar::chunk {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #6366f1, stop:1 #8b5cf6);
            }
        """)
        layout.addWidget(self.progress)
        
        self.status_label = QLabel("")
        self.status_label.setStyleSheet("color: #a78bfa;")
        layout.addWidget(self.status_label)
        
        # Buttons
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        
        self.cancel_btn = QPushButton("Annuler")
        self.cancel_btn.setObjectName("secondary")
        self.cancel_btn.clicked.connect(self.reject)
        btn_layout.addWidget(self.cancel_btn)
        
        self.generate_btn = QPushButton("✨ Générer")
        self.generate_btn.setObjectName("success")
        self.generate_btn.clicked.connect(self._generate)
        btn_layout.addWidget(self.generate_btn)
        
        layout.addLayout(btn_layout)
        
        # Update provider info
        self._on_provider_changed()
    
    def _on_provider_changed(self):
        """Update UI when provider changes"""
        provider_value = self.provider_combo.currentData()
        provider = AIProvider(provider_value)
        info = get_provider_info(provider)
        
        if info:
            free_text = " (Gratuit)" if info.get("free") else ""
            self.provider_info.setText(
                f"📌 {info['description']}{free_text} - "
                f"<a href='{info['url']}' style='color: #6366f1;'>Obtenir une clé API</a>"
            )
    
    def _load_saved_config(self):
        """Load saved API configuration"""
        import os
        config_file = os.path.join(os.path.dirname(__file__), "..", "ai_config.json")
        if os.path.exists(config_file):
            try:
                import json
                with open(config_file, 'r') as f:
                    data = json.load(f)
                self.api_key_edit.setText(data.get("api_key", ""))
                provider = data.get("provider", "z.ai")
                index = self.provider_combo.findData(provider)
                if index >= 0:
                    self.provider_combo.setCurrentIndex(index)
            except:
                pass
    
    def _save_config(self):
        """Save API configuration"""
        import os
        import json
        config_file = os.path.join(os.path.dirname(__file__), "..", "ai_config.json")
        try:
            data = {
                "provider": self.provider_combo.currentData(),
                "api_key": self.api_key_edit.text()
            }
            with open(config_file, 'w') as f:
                json.dump(data, f)
        except:
            pass
    
    def _generate(self):
        """Start AI generation"""
        prompt = self.prompt_edit.toPlainText().strip()
        api_key = self.api_key_edit.text().strip()
        
        if not prompt:
            QMessageBox.warning(self, "Erreur", "Veuillez entrer une description.")
            return
        
        if not api_key:
            QMessageBox.warning(self, "Erreur", "Veuillez entrer votre clé API.")
            return
        
        # Save config
        self._save_config()
        
        # Setup generator
        provider_value = self.provider_combo.currentData()
        provider = AIProvider(provider_value)
        config = AIConfig(provider=provider, api_key=api_key)
        self.generator.set_config(config)
        
        # UI state
        self.generate_btn.setEnabled(False)
        self.progress.setVisible(True)
        self.status_label.setText("🔄 Génération en cours... L'IA analyse votre demande.")
        
        # Start worker
        self.worker = AIWorker(self.generator, prompt)
        self.worker.finished.connect(self._on_generation_finished)
        self.worker.start()
    
    def _on_generation_finished(self, result):
        """Handle generation result"""
        self.progress.setVisible(False)
        self.generate_btn.setEnabled(True)
        
        if isinstance(result, Exception):
            self.status_label.setText(f"❌ Erreur: {result}")
            QMessageBox.critical(self, "Erreur", str(result))
        else:
            self.status_label.setText("✅ Génération réussie!")
            sheet_count = len(result.sheets)
            cell_count = sum(len(s.cells) for s in result.sheets)
            merge_count = sum(len(s.merges) for s in result.sheets)
            
            QMessageBox.information(
                self, "Succès",
                f"Configuration générée avec succès!\n\n"
                f"📋 {sheet_count} feuille(s)\n"
                f"✏️ {cell_count} cellule(s) configurée(s)\n"
                f"🔗 {merge_count} fusion(s)"
            )
            
            self.configGenerated.emit(result)
            self.accept()
