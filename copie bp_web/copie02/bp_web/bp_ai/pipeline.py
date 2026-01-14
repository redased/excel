import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.impute import SimpleImputer
import logging

logger = logging.getLogger(__name__)

class DataPipeline:
    """
    Pipeline de traitement des données pour l'IA.
    Responsable du chargement, nettoyage et normalisation des données Excel.
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='mean')
        self.categorical_cols = []
        self.numerical_cols = []
        
    def load_data(self, file_path):
        """
        Charge un fichier Excel dans un DataFrame pandas.
        """
        try:
            df = pd.read_excel(file_path)
            logger.info(f"Fichier chargé avec succès: {file_path}. Shape: {df.shape}")
            return df
        except Exception as e:
            logger.error(f"Erreur lors du chargement du fichier: {e}")
            raise e

    def preprocess(self, df, save_path=None):
        """
        Nettoie et prépare les données pour le modèle.
        Optionnel: Sauvegarde le fichier nettoyé si save_path est fourni.
        """
        # 1. Identifier les colonnes
        self.numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
        
        logger.info(f"Colonnes numériques: {len(self.numerical_cols)}")
        logger.info(f"Colonnes textuelles: {len(self.categorical_cols)}")
        
        df_processed = df.copy()
        
        # 2. Gestion des valeurs manquantes (Imputation)
        if self.numerical_cols:
            df_processed[self.numerical_cols] = self.imputer.fit_transform(df_processed[self.numerical_cols])
            
        # 3. Normalisation (Scaling)
        if self.numerical_cols:
            df_processed[self.numerical_cols] = self.scaler.fit_transform(df_processed[self.numerical_cols])
            
        # 4. Encodage des catégorielles (One-Hot Encoding simplifié pour l'instant)
        # Pour l'instant on les garde telles quelles ou on les ignore selon le modèle
        
        if save_path:
            try:
                # Créer le dossier parent si inexistant
                import os
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                df_processed.to_excel(save_path, index=False)
                logger.info(f"Données nettoyées sauvegardées dans: {save_path}")
            except Exception as e:
                logger.error(f"Erreur sauvegarde fichier nettoyé: {e}")

        return df_processed
    
    def get_stats(self, df):
        """
        Retourne des statistiques descriptives de base.
        """
        return df.describe().to_dict()
