from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import pandas as pd
import os
import json
from django.conf import settings
from .pipeline import DataPipeline
from .models import AnomalyDetector

@csrf_exempt
@require_POST
def analyze_anomalies(request):
    """
    API pour recevoir un fichier, le traiter et détecter des anomalies.
    """
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'Aucun fichier fourni'}, status=400)
    
    file = request.FILES['file']
    
    # 1. Sauvegarder le fichier brut temporairement
    upload_dir = os.path.join(settings.MEDIA_ROOT, 'ai_uploads')
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.name)
    
    with open(file_path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)
            
    try:
        # 2. Pipeline: Chargement + Nettoyage + Sauvegarde Processed
        pipeline = DataPipeline()
        df = pipeline.load_data(file_path)
        
        # Save processed version
        processed_dir = os.path.join(settings.MEDIA_ROOT, 'ai_processed')
        processed_path = os.path.join(processed_dir, f"processed_{file.name}")
        df_processed = pipeline.preprocess(df, save_path=processed_path)
        
        # 3. Modèle: Détection d'anomalies
        detector = AnomalyDetector(contamination=0.05) # 5% d'anomalies supposées
        detector.train(df_processed) # On entraîne sur les données (mode unsupervised)
        anomalies, df_results = detector.predict(df_processed)
        
        # 4. Préparer la réponse
        # Convertir les anomalies en dictionnaire pour JSON
        # On ne renvoie que les colonnes pertinentes + score
        result_json = []
        if not anomalies.empty:
            # On prend les 100 premières anomalies max pour l'IHM
            anomalies_top = anomalies.head(100) 
            result_json = anomalies_top.to_dict(orient='records')
            
        stats = {
            'total_rows': len(df),
            'anomalies_count': len(anomalies),
            'processed_file': processed_path
        }
        
        return JsonResponse({
            'status': 'success',
            'stats': stats,
            'anomalies': result_json
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)
