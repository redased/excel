"""
Enhanced modern dark theme styles for PyQt6
With glassmorphism, animations, and premium effects
"""

DARK_THEME = """
/* ============================================
   MAIN WINDOW & BASE
   ============================================ */
QMainWindow {
    background-color: #0f0f1a;
}

QWidget {
    background-color: transparent;
    color: #e0e0e0;
    font-family: 'Segoe UI', 'SF Pro Display', Arial, sans-serif;
    font-size: 13px;
}

/* ============================================
   LABELS & TYPOGRAPHY
   ============================================ */
QLabel {
    color: #e0e0e0;
    background: transparent;
}

QLabel#title {
    font-size: 22px;
    font-weight: bold;
    color: #a78bfa;
    letter-spacing: 1px;
}

QLabel#section-title {
    font-size: 15px;
    font-weight: bold;
    color: #c4b5fd;
    padding: 8px 0;
    border-bottom: 2px solid qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #6366f1, stop:1 transparent);
    margin-bottom: 8px;
}

QLabel#subtitle {
    font-size: 12px;
    color: #8b8ba7;
    font-weight: normal;
}

/* ============================================
   BUTTONS - GLASSMORPHISM STYLE
   ============================================ */
QPushButton {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(99, 102, 241, 0.9), 
        stop:0.5 rgba(79, 70, 229, 0.95),
        stop:1 rgba(67, 56, 202, 1));
    color: white;
    border: 1px solid rgba(139, 92, 246, 0.3);
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    min-width: 90px;
}

QPushButton:hover {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(129, 140, 248, 1), 
        stop:0.5 rgba(99, 102, 241, 1),
        stop:1 rgba(79, 70, 229, 1));
    border: 1px solid rgba(167, 139, 250, 0.5);
}

QPushButton:pressed {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(67, 56, 202, 1), 
        stop:1 rgba(55, 48, 163, 1));
}

QPushButton:disabled {
    background: rgba(61, 61, 92, 0.5);
    color: #6b6b8c;
    border: 1px solid rgba(61, 61, 92, 0.3);
}

QPushButton#danger {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(239, 68, 68, 0.9), 
        stop:1 rgba(185, 28, 28, 1));
    border: 1px solid rgba(248, 113, 113, 0.3);
}

QPushButton#danger:hover {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(248, 113, 113, 1), 
        stop:1 rgba(220, 38, 38, 1));
}

QPushButton#success {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(34, 197, 94, 0.9), 
        stop:1 rgba(21, 128, 61, 1));
    border: 1px solid rgba(74, 222, 128, 0.3);
}

QPushButton#success:hover {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(74, 222, 128, 1), 
        stop:1 rgba(34, 197, 94, 1));
}

QPushButton#secondary {
    background: rgba(45, 45, 74, 0.8);
    color: #c4b5fd;
    border: 1px solid rgba(99, 102, 241, 0.3);
}

QPushButton#secondary:hover {
    background: rgba(61, 61, 92, 0.9);
    border: 1px solid rgba(139, 92, 246, 0.5);
}

QPushButton#ai-button {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 rgba(236, 72, 153, 0.9), 
        stop:0.5 rgba(168, 85, 247, 0.95),
        stop:1 rgba(99, 102, 241, 1));
    border: 1px solid rgba(236, 72, 153, 0.4);
    font-size: 14px;
    padding: 12px 24px;
}

QPushButton#ai-button:hover {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 rgba(244, 114, 182, 1), 
        stop:0.5 rgba(192, 132, 252, 1),
        stop:1 rgba(129, 140, 248, 1));
}

/* ============================================
   INPUT FIELDS - GLASSMORPHISM
   ============================================ */
QLineEdit {
    background-color: rgba(22, 22, 42, 0.8);
    border: 2px solid rgba(61, 61, 92, 0.8);
    border-radius: 8px;
    padding: 10px 14px;
    color: #e0e0e0;
    selection-background-color: #6366f1;
}

QLineEdit:focus {
    border: 2px solid rgba(99, 102, 241, 0.9);
    background-color: rgba(22, 22, 42, 0.95);
}

QLineEdit:hover:!focus {
    border: 2px solid rgba(99, 102, 241, 0.5);
}

QLineEdit::placeholder {
    color: #6b6b8c;
}

QTextEdit {
    background-color: rgba(22, 22, 42, 0.8);
    border: 2px solid rgba(61, 61, 92, 0.8);
    border-radius: 8px;
    padding: 10px;
    color: #e0e0e0;
    selection-background-color: #6366f1;
}

QTextEdit:focus {
    border: 2px solid rgba(99, 102, 241, 0.9);
}

/* ============================================
   SPIN BOXES
   ============================================ */
QSpinBox, QDoubleSpinBox {
    background-color: rgba(22, 22, 42, 0.8);
    border: 2px solid rgba(61, 61, 92, 0.8);
    border-radius: 8px;
    padding: 8px 12px;
    color: #e0e0e0;
    min-width: 90px;
}

QSpinBox:focus, QDoubleSpinBox:focus {
    border: 2px solid rgba(99, 102, 241, 0.9);
}

QSpinBox::up-button, QDoubleSpinBox::up-button,
QSpinBox::down-button, QDoubleSpinBox::down-button {
    background: rgba(61, 61, 92, 0.8);
    border: none;
    width: 22px;
    border-radius: 4px;
    margin: 2px;
}

QSpinBox::up-button:hover, QDoubleSpinBox::up-button:hover,
QSpinBox::down-button:hover, QDoubleSpinBox::down-button:hover {
    background: rgba(99, 102, 241, 0.8);
}

/* ============================================
   COMBO BOX
   ============================================ */
QComboBox {
    background-color: rgba(22, 22, 42, 0.8);
    border: 2px solid rgba(61, 61, 92, 0.8);
    border-radius: 8px;
    padding: 10px 14px;
    color: #e0e0e0;
    min-width: 140px;
}

QComboBox:focus, QComboBox:on {
    border: 2px solid rgba(99, 102, 241, 0.9);
}

QComboBox::drop-down {
    border: none;
    width: 35px;
    background: transparent;
}

QComboBox::down-arrow {
    width: 12px;
    height: 12px;
}

QComboBox QAbstractItemView {
    background-color: rgba(22, 22, 42, 0.98);
    border: 2px solid rgba(99, 102, 241, 0.5);
    border-radius: 8px;
    selection-background-color: rgba(99, 102, 241, 0.8);
    color: #e0e0e0;
    padding: 4px;
}

QComboBox QAbstractItemView::item {
    padding: 8px 12px;
    border-radius: 4px;
}

QComboBox QAbstractItemView::item:hover {
    background-color: rgba(99, 102, 241, 0.4);
}

/* ============================================
   CHECK BOX
   ============================================ */
QCheckBox {
    spacing: 10px;
    color: #e0e0e0;
    font-size: 13px;
}

QCheckBox::indicator {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 2px solid rgba(61, 61, 92, 0.8);
    background: rgba(22, 22, 42, 0.8);
}

QCheckBox::indicator:checked {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #6366f1, stop:1 #8b5cf6);
    border: 2px solid rgba(139, 92, 246, 0.8);
}

QCheckBox::indicator:hover {
    border: 2px solid rgba(99, 102, 241, 0.8);
}

/* ============================================
   LIST WIDGET - GLASSMORPHISM
   ============================================ */
QListWidget {
    background-color: rgba(22, 22, 42, 0.6);
    border: 1px solid rgba(61, 61, 92, 0.5);
    border-radius: 12px;
    padding: 8px;
    outline: none;
}

QListWidget::item {
    background-color: transparent;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 3px 0;
    color: #c4b5fd;
    font-weight: 500;
}

QListWidget::item:selected {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 rgba(99, 102, 241, 0.9), 
        stop:1 rgba(139, 92, 246, 0.8));
    color: white;
    border: 1px solid rgba(167, 139, 250, 0.4);
}

QListWidget::item:hover:!selected {
    background-color: rgba(99, 102, 241, 0.2);
}

/* ============================================
   TABLE WIDGET - PREMIUM STYLE
   ============================================ */
QTableWidget {
    background-color: rgba(22, 22, 42, 0.6);
    border: 1px solid rgba(61, 61, 92, 0.5);
    border-radius: 12px;
    gridline-color: rgba(61, 61, 92, 0.4);
    outline: none;
}

QTableWidget::item {
    padding: 10px;
    border: none;
}

QTableWidget::item:selected {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 rgba(99, 102, 241, 0.8), 
        stop:1 rgba(139, 92, 246, 0.7));
    color: white;
}

QTableWidget::item:hover:!selected {
    background-color: rgba(99, 102, 241, 0.15);
}

QHeaderView::section {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(45, 45, 74, 0.9), 
        stop:1 rgba(30, 30, 50, 0.95));
    color: #c4b5fd;
    padding: 12px;
    border: none;
    border-right: 1px solid rgba(61, 61, 92, 0.5);
    border-bottom: 2px solid rgba(99, 102, 241, 0.6);
    font-weight: bold;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* ============================================
   TAB WIDGET - MODERN TABS
   ============================================ */
QTabWidget::pane {
    background-color: rgba(22, 22, 42, 0.7);
    border: 1px solid rgba(61, 61, 92, 0.5);
    border-radius: 12px;
    border-top-left-radius: 0;
    padding: 15px;
    margin-top: -1px;
}

QTabBar::tab {
    background: rgba(45, 45, 74, 0.6);
    color: #8b8ba7;
    padding: 12px 24px;
    border: none;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    margin-right: 3px;
    font-weight: 500;
}

QTabBar::tab:selected {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(99, 102, 241, 0.9), 
        stop:1 rgba(79, 70, 229, 0.95));
    color: white;
    font-weight: 600;
}

QTabBar::tab:hover:!selected {
    background: rgba(61, 61, 92, 0.8);
    color: #c4b5fd;
}

/* ============================================
   SCROLL BAR - SLIM MODERN
   ============================================ */
QScrollBar:vertical {
    background: rgba(22, 22, 42, 0.3);
    width: 10px;
    border-radius: 5px;
    margin: 2px;
}

QScrollBar::handle:vertical {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(99, 102, 241, 0.6), 
        stop:1 rgba(139, 92, 246, 0.6));
    border-radius: 5px;
    min-height: 40px;
}

QScrollBar::handle:vertical:hover {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(129, 140, 248, 0.8), 
        stop:1 rgba(167, 139, 250, 0.8));
}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0;
}

QScrollBar:horizontal {
    background: rgba(22, 22, 42, 0.3);
    height: 10px;
    border-radius: 5px;
    margin: 2px;
}

QScrollBar::handle:horizontal {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 rgba(99, 102, 241, 0.6), 
        stop:1 rgba(139, 92, 246, 0.6));
    border-radius: 5px;
    min-width: 40px;
}

QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {
    width: 0;
}

/* ============================================
   GROUP BOX - CARD STYLE
   ============================================ */
QGroupBox {
    font-weight: bold;
    font-size: 13px;
    border: 1px solid rgba(61, 61, 92, 0.5);
    border-radius: 12px;
    margin-top: 16px;
    padding-top: 16px;
    color: #c4b5fd;
    background: rgba(22, 22, 42, 0.4);
}

QGroupBox::title {
    subcontrol-origin: margin;
    subcontrol-position: top left;
    left: 16px;
    padding: 4px 12px;
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 rgba(99, 102, 241, 0.3), 
        stop:1 rgba(139, 92, 246, 0.3));
    border-radius: 6px;
}

/* ============================================
   SPLITTER
   ============================================ */
QSplitter::handle {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 rgba(99, 102, 241, 0.3), 
        stop:1 rgba(139, 92, 246, 0.3));
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
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 rgba(129, 140, 248, 0.6), 
        stop:1 rgba(167, 139, 250, 0.6));
}

/* ============================================
   STATUS BAR - MINIMAL
   ============================================ */
QStatusBar {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(22, 22, 42, 0.95), 
        stop:1 rgba(15, 15, 26, 1));
    border-top: 1px solid rgba(61, 61, 92, 0.5);
    color: #8b8ba7;
    padding: 8px 16px;
    font-size: 12px;
}

/* ============================================
   TOOL BAR - GLASS EFFECT
   ============================================ */
QToolBar {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(30, 30, 50, 0.98), 
        stop:1 rgba(22, 22, 42, 0.98));
    border: none;
    border-bottom: 1px solid rgba(99, 102, 241, 0.3);
    padding: 10px 12px;
    spacing: 10px;
}

QToolBar::separator {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 transparent, 
        stop:0.5 rgba(99, 102, 241, 0.5),
        stop:1 transparent);
    width: 2px;
    margin: 6px 12px;
}

QToolBar QToolButton {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 12px;
    color: #c4b5fd;
    font-weight: 500;
}

QToolBar QToolButton:hover {
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid rgba(99, 102, 241, 0.4);
}

QToolBar QToolButton:pressed {
    background: rgba(99, 102, 241, 0.3);
}

/* ============================================
   MENU - FLOATING STYLE
   ============================================ */
QMenuBar {
    background: transparent;
    border: none;
    padding: 4px;
}

QMenuBar::item {
    padding: 8px 16px;
    border-radius: 6px;
    color: #c4b5fd;
}

QMenuBar::item:selected {
    background: rgba(99, 102, 241, 0.3);
}

QMenu {
    background-color: rgba(22, 22, 42, 0.98);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 12px;
    padding: 8px;
}

QMenu::item {
    padding: 10px 40px 10px 20px;
    border-radius: 6px;
    color: #e0e0e0;
}

QMenu::item:selected {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 rgba(99, 102, 241, 0.8), 
        stop:1 rgba(139, 92, 246, 0.7));
}

QMenu::separator {
    height: 1px;
    background: rgba(61, 61, 92, 0.5);
    margin: 6px 12px;
}

/* ============================================
   FRAME - GLASS PANELS
   ============================================ */
QFrame#panel {
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(30, 30, 50, 0.8), 
        stop:1 rgba(22, 22, 42, 0.9));
    border: 1px solid rgba(61, 61, 92, 0.4);
    border-radius: 16px;
}

QFrame#card {
    background: rgba(22, 22, 42, 0.6);
    border: 1px solid rgba(61, 61, 92, 0.3);
    border-radius: 12px;
    padding: 16px;
}

/* ============================================
   COLOR BUTTON
   ============================================ */
QPushButton#colorButton {
    min-width: 50px;
    min-height: 35px;
    border: 2px solid rgba(61, 61, 92, 0.8);
    border-radius: 8px;
}

QPushButton#colorButton:hover {
    border: 2px solid rgba(139, 92, 246, 0.8);
}

/* ============================================
   PROGRESS BAR - ANIMATED GRADIENT
   ============================================ */
QProgressBar {
    border: none;
    border-radius: 6px;
    background-color: rgba(22, 22, 42, 0.8);
    height: 8px;
    text-align: center;
}

QProgressBar::chunk {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #6366f1, 
        stop:0.5 #a855f7,
        stop:1 #ec4899);
    border-radius: 6px;
}

/* ============================================
   TOOLTIPS
   ============================================ */
QToolTip {
    background-color: rgba(30, 30, 50, 0.98);
    color: #e0e0e0;
    border: 1px solid rgba(99, 102, 241, 0.5);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
}
"""

HEADER_STYLE = """
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 rgba(99, 102, 241, 0.95), 
        stop:0.3 rgba(139, 92, 246, 0.9),
        stop:0.6 rgba(168, 85, 247, 0.9),
        stop:1 rgba(236, 72, 153, 0.85));
    border-radius: 0px;
    padding: 20px 25px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
"""

CARD_STYLE = """
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(30, 30, 50, 0.9), 
        stop:1 rgba(22, 22, 42, 0.95));
    border: 1px solid rgba(61, 61, 92, 0.5);
    border-radius: 16px;
    padding: 20px;
"""

AI_BUTTON_STYLE = """
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 rgba(236, 72, 153, 0.95), 
        stop:0.5 rgba(168, 85, 247, 0.95),
        stop:1 rgba(99, 102, 241, 0.95));
    color: white;
    border: 1px solid rgba(236, 72, 153, 0.4);
    border-radius: 10px;
    padding: 12px 24px;
    font-weight: bold;
    font-size: 14px;
"""
