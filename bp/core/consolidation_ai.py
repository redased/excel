"""
AI-powered consolidation analyzer
Uses Z.ai to analyze Excel files and suggest consolidation settings
"""
import json
from typing import List, Dict, Optional


CONSOLIDATION_PROMPT = """Tu es un expert en analyse de fichiers Excel pour la consolidation budgétaire.

L'utilisateur te fournit des informations sur des fichiers Excel à consolider.
Tu dois analyser et suggérer la meilleure configuration de consolidation.

Informations fournies:
{file_info}

Description utilisateur:
{user_description}

Génère une configuration JSON pour la consolidation:
{{
    "sheet_name": "Nom de la feuille à extraire",
    "start_column": "Lettre colonne début (ex: E)",
    "end_column": "Lettre colonne fin (ex: P)", 
    "start_row": 1,
    "end_row": 10,
    "group_by": "branch ou responsible ou cost_center",
    "files": [
        {{
            "filepath": "chemin du fichier",
            "responsible": "Nom du responsable",
            "branch": "Nom de la branche",
            "cost_center": "Centre de coût"
        }}
    ],
    "suggestions": "Notes et suggestions pour l'utilisateur"
}}

IMPORTANT: Génère UNIQUEMENT du JSON valide.
"""


def analyze_for_consolidation(
    files: List[str],
    user_description: str,
    api_key: str
) -> Dict:
    """
    Use AI to analyze files and suggest consolidation settings
    
    Args:
        files: List of file paths
        user_description: User's description of what they want
        api_key: Z.ai API key
        
    Returns:
        Dict with suggested configuration
    """
    import requests
    
    if not api_key:
        raise ValueError("Clé API non configurée")
    
    # Build file info
    file_info = "\n".join([f"- {f}" for f in files])
    
    prompt = CONSOLIDATION_PROMPT.format(
        file_info=file_info,
        user_description=user_description
    )
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": "glm-4.7",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 2048
    }
    
    response = requests.post(
        "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        headers=headers,
        json=payload,
        timeout=60
    )
    
    if response.status_code != 200:
        raise ValueError(f"Erreur API: {response.status_code}")
    
    result = response.json()
    content = result["choices"][0]["message"]["content"]
    
    # Extract JSON
    import re
    text = content.strip()
    
    if "```json" in text:
        match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
        if match:
            text = match.group(1)
    elif "```" in text:
        match = re.search(r'```\s*([\s\S]*?)\s*```', text)
        if match:
            text = match.group(1)
    
    # Find JSON
    start = text.find("{")
    if start == -1:
        raise ValueError("L'IA n'a pas généré de JSON valide")
    
    depth = 0
    for i, char in enumerate(text[start:], start):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                json_str = text[start:i+1]
                return json.loads(json_str)
    
    raise ValueError("JSON incomplet")
