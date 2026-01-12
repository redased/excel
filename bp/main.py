"""
Création de Fichier Excel Vierge - BP 2026
Application Python avec interface PyQt6 pour créer des fichiers Excel configurables.

Usage:
    python main.py
"""
import sys
from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

from ui.main_window import MainWindow


def main():
    # Enable high DPI scaling
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )
    
    app = QApplication(sys.argv)
    
    # Set application properties
    app.setApplicationName("Création de Fichier Excel - BP 2026")
    app.setApplicationVersion("1.0.0")
    
    # Set default font
    font = QFont("Segoe UI", 10)
    app.setFont(font)
    
    # Create and show main window
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
