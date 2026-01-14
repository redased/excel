import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os
import logging

logger = logging.getLogger(__name__)

class AnomalyDetector:
    """
    Détecteur d'anomalies basé sur Isolation Forest.
    """
    
    def __init__(self, contamination=0.05):
        """
        Args:
            contamination (float): Proportion estimée d'anomalies dans le dataset.
        """
        self.model = IsolationForest(contamination=contamination, random_state=42)
        self.is_trained = False
        
    def train(self, data):
        """
        Entraîne le modèle sur les données (DataFrame ou numpy array).
        Seules les colonnes numériques sont utilisées.
        """
        if isinstance(data, pd.DataFrame):
            X = data.select_dtypes(include=[np.number]).values
        else:
            X = data
            
        logger.info(f"Entraînement Isolation Forest sur {X.shape[0]} lignes...")
        self.model.fit(X)
        self.is_trained = True
        logger.info("Modèle entraîné.")
        
    def predict(self, data):
        """
        Retourne :
        - anomalies: DataFrame avec les lignes considérées comme anomalies
        - scores: Scores d'anomalie pour toutes les lignes
        """
        if not self.is_trained:
            raise Exception("Le modèle n'est pas entraîné.")
            
        if isinstance(data, pd.DataFrame):
            X = data.select_dtypes(include=[np.number]).values
            df_result = data.copy()
        else:
            X = data
            df_result = pd.DataFrame(data)
            
        # -1 = anomalie, 1 = normal
        predictions = self.model.predict(X)
        scores = self.model.decision_function(X)
        
        df_result['anomaly_score'] = scores
        df_result['is_anomaly'] = predictions == -1
        
        anomalies = df_result[df_result['is_anomaly']]
        
        return anomalies, df_result

    def save_model(self, path):
        joblib.dump(self.model, path)
        
    def load_model(self, path):
        if os.path.exists(path):
            self.model = joblib.load(path)
            self.is_trained = True
        else:
            logger.warning(f"Modèle non trouvé à {path}")
