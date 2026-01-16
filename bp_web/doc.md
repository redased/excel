# Documentation du Projet BP Web (Excel Tools - BP 2026)

## 📌 Vue d'ensemble
Ce projet est une application web bâtie avec Django conçue pour automatiser les processus liés au Budget Prévisionnel 2026 (BP 2026). Elle sert principalement à la consolidation, la création et l'analyse de fichiers Excel financiers, avec une interface utilisateur riche et moderne ("Glassmorphism").

---

## 🏗️ Architecture du Projet

Le projet est situé à la racine : `c:\Users\reda\Desktop\python automatisation\bp_web`

### Stack Technique
*   **Backend** : Python 3.x, Django
*   **Frontend** : HTML5, Vanilla JS, CSS3 (Variables CSS, Flexbox/Grid)
*   **Traitement de Données** : Pandas, OpenPyXL
*   **IA / Machine Learning** : TensorFlow, Scikit-learn (en cours d'intégration)
*   **Base de Données** : SQLite (par défaut)

### Structure des Applications (Django Apps)
1.  **`bp_web`** : Configuration principale du projet (settings, urls, wsgi).
2.  **`excel_creator`** : Application cœur gérant l'interface principale et la logique métier Excel.
3.  **`bp_ai`** : Module dédié à l'intelligence artificielle (détection d'anomalies, prédictions).
4.  **`bp_scraper`** : Module futur pour le web scraping.

---

## 🚀 Fonctionnalités Détaillées

### 1. 📊 Consolidation Avancée ("ConsBulle")
Module phare de l'application permettant de fusionner des budgets de différents sites.
*   **Concept** : Approche hiérarchique _Responsable > Site (Fichier Excel) > Feuilles_.
*   **Workflow** :
    1.  **Chargement** : Drag & Drop d'un **dossier racine**. L'application détecte automatiquement les sous-dossiers (Responsables) et les fichiers Excel (Sites).
    2.  **Configuration** :
        *   Gestion visuelle des responsables et des sites.
        *   Détection automatique des feuilles à consolider ou sélection manuelle de plages (Lignes/Colonnes).
    3.  **Génération** : Plusieurs modes de sortie disponibles (Simple, Template, Synthèse, Statistiques).
*   **Modifications Récentes** :
    *   Correction du sélecteur de dossier pour une meilleure compatibilité navigateur.
    *   Suppression du mode "Fichier unique" pour renforcer la structure par dossier.

### 2. 🔍 Test & Vérification (Test Fichiers)
Outil de contrôle qualité post-consolidation.
*   Permet de comparer les fichiers sources (dossier local) avec le fichier consolidé généré.
*   Identifie les écarts de montants et les erreurs d'intégration.

### 3. 📄 Excel Creator
Interface de création manuelle de templates Excel.
*   Configuration visuelle des colonnes, lignes et styles de cellules.
*   Génération du fichier `.xlsx` à la volée.

### 4. 🤖 Labo IA (TensorFlow)
Espace expérimental pour l'application de l'IA aux données financières.
*   Pipeline de données : Nettoyage et normalisation.
*   Modèles : Isolation Forest pour la détection d'anomalies.

### 5. ⚙️ Paramètres
*   Personnalisation du branding (Logo, Nom de l'app).
*   Règles de groupement des feuilles.

---

## 📂 Organisation des Fichiers Importants

*   **Templates** : `excel_creator/templates/excel_creator/index.html`
    *   Contient l'intégralité de la structure HTML (Application Single Page 'Like' avec onglets).
*   **Logique JS** :
    *   `static/js/consbulle.js` : Logique complexe du wizard de consolidation (Gestion d'état, Drag&Drop).
    *   `static/js/app.js` : Navigation et UI générale.
*   **Styles** :
    *   `static/css/style.css` : Thème global.
    *   `static/css/consbulle.css` : Styles spécifiques au module de consolidation.

## 📝 Justification des Dernières Corrections
*   **Problème corrigé** : L'input de type `directory` avait un attribut `accept` qui empêchait le navigateur de sélectionner correctement le contenu du dossier sur Windows.
*   **Action** : Nettoyage de l'interface de chargement pour ne conserver que l'option explicite "Sélectionner un DOSSIER", plus alignée avec la logique de consolidation par Responsable.
