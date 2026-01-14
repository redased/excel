"""
AI Generator for Excel configurations using Z.ai GLM-4.7
"""
import json
import requests
from django.conf import settings

SYSTEM_PROMPT = """Tu es un assistant expert en création de fichiers Excel. 
L'utilisateur te décrit ce qu'il veut créer et tu génères une configuration JSON structurée.

RÈGLES IMPORTANTES:
1. Génère UNIQUEMENT du JSON valide, sans texte avant ou après
2. Utilise les indices à partir de 1 (pas 0)
3. Les couleurs sont en format hexadécimal SANS le # (ex: "4472C4" pour bleu)

STRUCTURE JSON ATTENDUE:
{
  "sheets": [
    {
      "name": "Nom de la feuille",
      "columns": [
        {"index": 1, "width": 15.0, "header": "Titre colonne"}
      ],
      "rows": [
        {"index": 1, "height": 20.0}
      ],
      "cells": [
        {
          "row": 1, "col": 1,
          "value": "Texte",
          "style": {
            "font_size": 11,
            "font_color": "000000",
            "bg_color": "FFFFFF",
            "bold": false,
            "italic": false,
            "underline": false,
            "alignment": "left",
            "border_style": null
          }
        }
      ],
      "merges": [
        {"start_row": 1, "start_col": 1, "end_row": 1, "end_col": 5}
      ]
    }
  ]
}

COULEURS: Bleu=4472C4, Vert=70AD47, Orange=ED7D31, Gris=D9D9D9
ALIGNEMENTS: "left", "center", "right"
BORDURES: null, "thin", "medium", "thick"
"""


def generate_config_with_ai(prompt: str, api_key: str = None) -> dict:
    """
    Generate Excel configuration from natural language prompt using Z.ai GLM-4.7
    """
    api_key = api_key or settings.ZAI_API_KEY
    
    if not api_key:
        raise ValueError("Clé API Z.ai non configurée")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": settings.ZAI_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 4096
    }
    
    response = requests.post(
        settings.ZAI_API_URL,
        headers=headers,
        json=payload,
        timeout=60
    )
    
    if response.status_code != 200:
        raise ValueError(f"Erreur API Z.ai: {response.status_code} - {response.text}")
    
    result = response.json()
    content = result["choices"][0]["message"]["content"]
    
    # Extract JSON from response
    json_str = extract_json(content)
    if not json_str:
        raise ValueError("L'IA n'a pas généré de JSON valide")
    
    return json.loads(json_str)


def extract_json(text: str) -> str:
    """Extract JSON from response text"""
    import re
    
    text = text.strip()
    
    # Remove markdown code blocks
    if "```json" in text:
        match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
        if match:
            text = match.group(1)
    elif "```" in text:
        match = re.search(r'```\s*([\s\S]*?)\s*```', text)
        if match:
            text = match.group(1)
    
    text = text.strip()
    
    # Find JSON object
    start = text.find("{")
    if start == -1:
        return None
    
    depth = 0
    for i, char in enumerate(text[start:], start):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start:i+1]
    
    return None
