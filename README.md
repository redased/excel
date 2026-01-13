# 📊 Excel Tools - BP 2026

Une suite d'outils puissants pour créer et consolider des fichiers Excel, disponible en version **Desktop (PyQt6)** et **Web (Django)**.

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![PyQt6](https://img.shields.io/badge/PyQt6-Desktop-green.svg)
![Django](https://img.shields.io/badge/Django-Web-purple.svg)

## ✨ Fonctionnalités

### 📁 Consolidation de Fichiers Excel
- Combinez plusieurs fichiers Excel en un seul
- Sélection des feuilles à inclure par fichier
- Configuration des colonnes et lignes à extraire
- Groupement par branche, responsable ou centre de coût
- Analyse IA optionnelle avec Z.ai 5b8e0330b2144624bf191c06b6cdc5a4.bae7eYG2RjNdx6jL

### 🔮 Consolidation par Bulles
- Visualisation interactive des fichiers sous forme de bulles
- Glisser-déposer pour construire la consolidation
- Hiérarchie : Responsable → Sites → Feuilles → Colonnes

### 🧩 Consolidation par Bulle (Structurée)
- Assistant étape par étape
- **Étape 1** : Créer les responsables
- **Étape 2** : Ajouter des sites et charger les fichiers Excel
- **Étape 3** : Configurer l'extraction (colonnes E-P, lignes 1-10)
- **Étape 4** : Aperçu et génération du fichier consolidé

### 📄 Excel Creator
- Créez des fichiers Excel vierges avec structure personnalisée
- Configuration des colonnes, lignes et cellules
- Fusion de cellules
- Styles (couleurs, polices, bordures)
- Prévisualisation en temps réel
- Génération par IA
https://drive.google.com/drive/folders/1cfP2fkB791vq1rtpglC5AqWACAZB53fc?usp=sharing
### ⚙️ Paramètres Personnalisables
- Nom de l'application configurable
- Sous-titre personnalisable
- Logo d'entreprise via URL (SVG, PNG, JPG)
- Sauvegarde persistante des paramètres

## 🖥️ Application Desktop (PyQt6)

### Installation

```bash
cd bp
pip install -r requirements.txt
```

### Lancement

```bash
python main.py
```

### Dépendances
- PyQt6
- openpyxl
- pandas
- requests

## 🌐 Application Web (Django)

### Installation

```bash
cd bp_web
pip install -r requirements.txt
```

### Lancement

```bash
python manage.py runserver
```

Accédez à l'application : [http://127.0.0.1:8000](http://127.0.0.1:8000)

### Dépendances
- Django
- openpyxl
- pandas

## 📸 Captures d'écran

### Interface Web
- Sidebar moderne avec navigation (5 sections)
- Design bleu clair épuré
- Logo d'entreprise en haut à droite

### Interface Desktop
- Même design que la version web
- Sidebar avec Consolidation, Bulles, Cons. par Bulle, Excel Creator, Paramètres
- Interface PyQt6 native

## 🔧 Configuration

### Personnalisation du Branding

1. Allez dans **⚙️ Paramètres**
2. Modifiez :
   - **Nom de l'application** : Ex: "Budget Prévisionnel 2026"
   - **Sous-titre** : Ex: "En développement version 1"
   - **URL du logo** : Lien vers votre logo (SVG recommandé)
3. Cliquez sur **💾 Sauvegarder**

## 📁 Structure du Projet

```
python automatisation/
├── bp/                          # Application Desktop
│   ├── main.py                  # Point d'entrée
│   ├── core/                    # Logique métier
│   │   ├── models.py           # Modèles de données
│   │   ├── excel_generator.py  # Générateur Excel
│   │   └── consolidator.py     # Consolidateur
│   └── ui/                      # Interface utilisateur
│       ├── main_window.py      # Fenêtre principale
│       ├── styles.py           # Styles PyQt6
│       ├── ai_dialog.py        # Dialog IA
│       ├── consolidation_dialog.py
│       └── bubble_consolidation_dialog.py
│
├── bp_web/                      # Application Web Django
│   ├── manage.py
│   ├── bp_web/                 # Configuration Django
│   ├── excel_creator/          # App principale
│   │   ├── views.py
│   │   └── templates/
│   └── static/
│       ├── css/
│       │   ├── style.css
│       │   ├── bubbles.css
│       │   └── consbulle.css
│       └── js/
│           ├── bubbles.js
│           └── consbulle.js
│
├── TestResponsables/            # Fichiers de test
│   ├── Jean_Dupont/
│   ├── Marie_Martin/
│   └── Pierre_Bernard/
│
└── README.md
```

## 🤖 Intégration IA

L'application supporte l'intégration avec **Z.ai** pour :
- Génération automatique de structures Excel
- Analyse intelligente des fichiers à consolider
- Configuration automatique des paramètres d'extraction

Pour utiliser l'IA, entrez votre clé API Z.ai dans les paramètres.

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteur

Développé pour la gestion du Budget Prévisionnel 2026.
