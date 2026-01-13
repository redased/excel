"""
Modern light blue theme styles for PyQt6
With sidebar navigation and clean design
"""

# Light blue color palette
LIGHT_BLUE_THEME = """
/* ============================================
   MAIN WINDOW & BASE
   ============================================ */
QMainWindow {
    background-color: #f0f9ff;
}

QWidget {
    background-color: transparent;
    color: #1e293b;
    font-family: 'Segoe UI', 'SF Pro Display', Arial, sans-serif;
    font-size: 13px;
}

/* ============================================
   SIDEBAR
   ============================================ */
QWidget#sidebar {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #0284c7, stop:1 #0369a1);
    min-width: 220px;
    max-width: 220px;
}

QLabel#sidebar-logo {
    font-size: 28px;
    padding: 5px;
}

QLabel#sidebar-title {
    font-size: 18px;
    font-weight: bold;
    color: white;
}

QLabel#sidebar-subtitle {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
}

QPushButton#nav-item {
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    border: none;
    border-radius: 10px;
    padding: 14px 16px;
    text-align: left;
    font-size: 14px;
    font-weight: 500;
}

QPushButton#nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

QPushButton#nav-item:checked {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

/* ============================================
   LABELS & TYPOGRAPHY
   ============================================ */
QLabel {
    color: #1e293b;
    background: transparent;
}

QLabel#title {
    font-size: 24px;
    font-weight: bold;
    color: #0284c7;
    letter-spacing: -0.5px;
}

QLabel#section-title {
    font-size: 14px;
    font-weight: bold;
    color: #0284c7;
    padding: 8px 0;
    border-bottom: 2px solid #0ea5e9;
    margin-bottom: 8px;
}

QLabel#subtitle {
    font-size: 13px;
    color: #64748b;
    font-weight: normal;
}

QLabel#page-title {
    font-size: 26px;
    font-weight: bold;
    color: #1e293b;
}

QLabel#page-subtitle {
    font-size: 14px;
    color: #64748b;
}

/* ============================================
   BUTTONS - LIGHT BLUE STYLE
   ============================================ */
QPushButton {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #0ea5e9, stop:1 #0284c7);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    min-width: 90px;
}

QPushButton:hover {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #38bdf8, stop:1 #0ea5e9);
}

QPushButton:pressed {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #0284c7, stop:1 #0369a1);
}

QPushButton:disabled {
    background: #cbd5e1;
    color: #94a3b8;
}

QPushButton#danger {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #ef4444, stop:1 #dc2626);
}

QPushButton#danger:hover {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #f87171, stop:1 #ef4444);
}

QPushButton#success {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #10b981, stop:1 #059669);
}

QPushButton#success:hover {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #34d399, stop:1 #10b981);
}

QPushButton#secondary {
    background: white;
    color: #1e293b;
    border: 1px solid #e2e8f0;
}

QPushButton#secondary:hover {
    background: #f1f5f9;
    border: 1px solid #0ea5e9;
    color: #0284c7;
}

QPushButton#ai-button {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #8b5cf6, stop:1 #a855f7);
    font-size: 14px;
    padding: 12px 24px;
}

QPushButton#ai-button:hover {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #a78bfa, stop:1 #c084fc);
}

/* ============================================
   INPUT FIELDS
   ============================================ */
QLineEdit {
    background-color: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    color: #1e293b;
    selection-background-color: #0ea5e9;
}

QLineEdit:focus {
    border: 2px solid #0ea5e9;
}

QLineEdit:hover:!focus {
    border: 2px solid #7dd3fc;
}

QLineEdit::placeholder {
    color: #94a3b8;
}

QTextEdit {
    background-color: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px;
    color: #1e293b;
}

QTextEdit:focus {
    border: 2px solid #0ea5e9;
}

/* ============================================
   SPIN BOXES
   ============================================ */
QSpinBox, QDoubleSpinBox {
    background-color: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    color: #1e293b;
    min-width: 90px;
}

QSpinBox:focus, QDoubleSpinBox:focus {
    border: 2px solid #0ea5e9;
}

QSpinBox::up-button, QDoubleSpinBox::up-button,
QSpinBox::down-button, QDoubleSpinBox::down-button {
    background: #f1f5f9;
    border: none;
    width: 22px;
    border-radius: 4px;
    margin: 2px;
}

QSpinBox::up-button:hover, QDoubleSpinBox::up-button:hover,
QSpinBox::down-button:hover, QDoubleSpinBox::down-button:hover {
    background: #0ea5e9;
}

/* ============================================
   COMBO BOX
   ============================================ */
QComboBox {
    background-color: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    color: #1e293b;
    min-width: 140px;
}

QComboBox:focus, QComboBox:on {
    border: 2px solid #0ea5e9;
}

QComboBox::drop-down {
    border: none;
    width: 35px;
    background: transparent;
}

QComboBox QAbstractItemView {
    background-color: white;
    border: 2px solid #0ea5e9;
    border-radius: 8px;
    selection-background-color: #0ea5e9;
    color: #1e293b;
    padding: 4px;
}

QComboBox QAbstractItemView::item {
    padding: 8px 12px;
    border-radius: 4px;
}

QComboBox QAbstractItemView::item:hover {
    background-color: #e0f2fe;
}

/* ============================================
   CHECK BOX
   ============================================ */
QCheckBox {
    spacing: 10px;
    color: #1e293b;
    font-size: 13px;
}

QCheckBox::indicator {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #e2e8f0;
    background: white;
}

QCheckBox::indicator:checked {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #0ea5e9, stop:1 #0284c7);
    border: 2px solid #0284c7;
}

QCheckBox::indicator:hover {
    border: 2px solid #0ea5e9;
}

/* ============================================
   LIST WIDGET
   ============================================ */
QListWidget {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 8px;
    outline: none;
}

QListWidget::item {
    background-color: transparent;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 3px 0;
    color: #1e293b;
    font-weight: 500;
}

QListWidget::item:selected {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #0ea5e9, stop:1 #38bdf8);
    color: white;
}

QListWidget::item:hover:!selected {
    background-color: #e0f2fe;
}

/* ============================================
   TABLE WIDGET
   ============================================ */
QTableWidget {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    gridline-color: #e2e8f0;
    outline: none;
}

QTableWidget::item {
    padding: 10px;
    border: none;
}

QTableWidget::item:selected {
    background: #0ea5e9;
    color: white;
}

QTableWidget::item:hover:!selected {
    background-color: #f0f9ff;
}

QHeaderView::section {
    background: #f1f5f9;
    color: #0284c7;
    padding: 12px;
    border: none;
    border-right: 1px solid #e2e8f0;
    border-bottom: 2px solid #0ea5e9;
    font-weight: bold;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* ============================================
   TAB WIDGET
   ============================================ */
QTabWidget::pane {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    border-top-left-radius: 0;
    padding: 15px;
    margin-top: -1px;
}

QTabBar::tab {
    background: #f1f5f9;
    color: #64748b;
    padding: 12px 24px;
    border: none;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    margin-right: 3px;
    font-weight: 500;
}

QTabBar::tab:selected {
    background: white;
    color: #0284c7;
    font-weight: 600;
    border-bottom: 2px solid #0ea5e9;
}

QTabBar::tab:hover:!selected {
    background: #e0f2fe;
    color: #0ea5e9;
}

/* ============================================
   SCROLL BAR
   ============================================ */
QScrollBar:vertical {
    background: #f1f5f9;
    width: 10px;
    border-radius: 5px;
    margin: 2px;
}

QScrollBar::handle:vertical {
    background: #7dd3fc;
    border-radius: 5px;
    min-height: 40px;
}

QScrollBar::handle:vertical:hover {
    background: #0ea5e9;
}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0;
}

QScrollBar:horizontal {
    background: #f1f5f9;
    height: 10px;
    border-radius: 5px;
    margin: 2px;
}

QScrollBar::handle:horizontal {
    background: #7dd3fc;
    border-radius: 5px;
    min-width: 40px;
}

QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {
    width: 0;
}

/* ============================================
   GROUP BOX
   ============================================ */
QGroupBox {
    font-weight: bold;
    font-size: 13px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-top: 16px;
    padding-top: 16px;
    color: #0284c7;
    background: white;
}

QGroupBox::title {
    subcontrol-origin: margin;
    subcontrol-position: top left;
    left: 16px;
    padding: 4px 12px;
    background: #e0f2fe;
    border-radius: 6px;
}

/* ============================================
   SPLITTER
   ============================================ */
QSplitter::handle {
    background: #e2e8f0;
    border-radius: 2px;
}

QSplitter::handle:horizontal {
    width: 4px;
    margin: 8px 0;
}

QSplitter::handle:vertical {
    height: 4px;
    margin: 0 8px;
}

QSplitter::handle:hover {
    background: #0ea5e9;
}

/* ============================================
   STATUS BAR
   ============================================ */
QStatusBar {
    background: white;
    border-top: 1px solid #e2e8f0;
    color: #64748b;
    padding: 8px 16px;
    font-size: 12px;
}

/* ============================================
   TOOL BAR
   ============================================ */
QToolBar {
    background: white;
    border: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 12px;
    spacing: 8px;
}

QToolBar::separator {
    background: #e2e8f0;
    width: 1px;
    margin: 6px 8px;
}

QToolBar QToolButton {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 12px;
    color: #1e293b;
    font-weight: 500;
}

QToolBar QToolButton:hover {
    background: #e0f2fe;
    border: 1px solid #7dd3fc;
    color: #0284c7;
}

QToolBar QToolButton:pressed {
    background: #bae6fd;
}

/* ============================================
   FRAME - PANELS
   ============================================ */
QFrame#panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
}

QFrame#card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
}

/* ============================================
   COLOR BUTTON
   ============================================ */
QPushButton#colorButton {
    min-width: 50px;
    min-height: 35px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
}

QPushButton#colorButton:hover {
    border: 2px solid #0ea5e9;
}

/* ============================================
   PROGRESS BAR
   ============================================ */
QProgressBar {
    border: none;
    border-radius: 6px;
    background-color: #e2e8f0;
    height: 8px;
    text-align: center;
}

QProgressBar::chunk {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #0ea5e9, stop:1 #38bdf8);
    border-radius: 6px;
}

/* ============================================
   TOOLTIPS
   ============================================ */
QToolTip {
    background-color: #1e293b;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
}

/* ============================================
   STACKED WIDGET PAGE
   ============================================ */
QWidget#page {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #f0f9ff, stop:0.5 #e0f2fe, stop:1 #f0f9ff);
}
"""

# Keep backward compatibility
DARK_THEME = LIGHT_BLUE_THEME

HEADER_STYLE = """
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #0284c7, stop:1 #0ea5e9);
    border-radius: 0px;
    padding: 20px 25px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
"""

CARD_STYLE = """
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
"""

AI_BUTTON_STYLE = """
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #8b5cf6, stop:1 #a855f7);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-weight: bold;
    font-size: 14px;
"""

SIDEBAR_STYLE = """
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #0284c7, stop:1 #0369a1);
"""
