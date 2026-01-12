"""
AI-powered Excel configuration generator
Supports multiple AI providers: Z.ai GLM-4.7, Google Gemini, OpenAI
"""
import json
import os
import re
from typing import Optional
from dataclasses import dataclass
from enum import Enum
import urllib.request
import urllib.error

from .models import (
    WorkbookConfig, SheetConfig, CellContent, CellStyle,
    MergeRange, ColumnConfig, RowConfig, Alignment, VerticalAlignment, BorderStyle
)


class AIProvider(Enum):
    ZAI_GLM = "z.ai"
    OPENROUTER = "openrouter"
    GEMINI = "gemini"
    OPENAI = "openai"


SYSTEM_PROMPT = """Tu es un assistant expert en création de fichiers Excel. 
L'utilisateur te décrit ce qu'il veut créer et tu génères une configuration JSON structurée.

RÈGLES IMPORTANTES:
1. Génère UNIQUEMENT du JSON valide, sans texte avant ou après
2. Utilise les indices à partir de 1 (pas 0)
3. Les couleurs sont en format hexadécimal SANS le # (ex: "4472C4" pour bleu)
4. Pour les fusions, start_row/col doivent être <= end_row/col

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
            "font_name": "Calibri",
            "font_size": 11,
            "font_color": "000000",
            "bg_color": "FFFFFF",
            "bold": false,
            "italic": false,
            "underline": false,
            "alignment": "left",
            "vertical_alignment": "center",
            "border_style": null,
            "border_color": "000000",
            "wrap_text": false
          }
        }
      ],
      "merges": [
        {"start_row": 1, "start_col": 1, "end_row": 1, "end_col": 5}
      ],
      "default_column_width": 12.0,
      "default_row_height": 15.0
    }
  ]
}

COULEURS UTILES:
- Bleu foncé: 4472C4
- Vert: 70AD47
- Rouge: FF0000
- Orange: ED7D31
- Gris clair: D9D9D9
- Gris foncé: 404040
- Blanc: FFFFFF
- Noir: 000000

ALIGNEMENTS: "left", "center", "right"
BORDURES: null, "thin", "medium", "thick", "double"

EXEMPLE - Si l'utilisateur demande "Tableau budget avec mois Janvier-Mars":
{
  "sheets": [
    {
      "name": "Budget",
      "columns": [
        {"index": 1, "width": 20.0, "header": "Catégorie"},
        {"index": 2, "width": 12.0, "header": "Janvier"},
        {"index": 3, "width": 12.0, "header": "Février"},
        {"index": 4, "width": 12.0, "header": "Mars"}
      ],
      "rows": [],
      "cells": [
        {"row": 1, "col": 1, "value": "Catégorie", "style": {"bold": true, "bg_color": "4472C4", "font_color": "FFFFFF", "alignment": "center"}},
        {"row": 1, "col": 2, "value": "Janvier", "style": {"bold": true, "bg_color": "4472C4", "font_color": "FFFFFF", "alignment": "center"}},
        {"row": 1, "col": 3, "value": "Février", "style": {"bold": true, "bg_color": "4472C4", "font_color": "FFFFFF", "alignment": "center"}},
        {"row": 1, "col": 4, "value": "Mars", "style": {"bold": true, "bg_color": "4472C4", "font_color": "FFFFFF", "alignment": "center"}}
      ],
      "merges": [],
      "default_column_width": 12.0,
      "default_row_height": 15.0
    }
  ]
}
"""


@dataclass
class AIConfig:
    """Configuration for AI provider"""
    provider: AIProvider
    api_key: str
    model: str = ""
    base_url: str = ""
    
    def __post_init__(self):
        if not self.model:
            if self.provider == AIProvider.ZAI_GLM:
                self.model = "glm-4.7"
                self.base_url = "https://open.bigmodel.cn/api/paas/v4"
            elif self.provider == AIProvider.OPENROUTER:
                self.model = "zhipu/glm-4.7"
                self.base_url = "https://openrouter.ai/api/v1"
            elif self.provider == AIProvider.GEMINI:
                self.model = "gemini-pro"
            elif self.provider == AIProvider.OPENAI:
                self.model = "gpt-4"
                self.base_url = "https://api.openai.com/v1"


class AIExcelGenerator:
    """Generates Excel configuration from natural language prompts using AI"""

    def __init__(self, config: Optional[AIConfig] = None):
        self.config = config
        
    def set_config(self, config: AIConfig):
        """Set the AI configuration"""
        self.config = config

    def generate_config(self, prompt: str) -> Optional[WorkbookConfig]:
        """
        Generate Excel configuration from natural language prompt
        
        Args:
            prompt: Natural language description of the desired Excel file
            
        Returns:
            WorkbookConfig if successful, None otherwise
        """
        if not self.config or not self.config.api_key:
            raise ValueError("Configuration IA non définie. Veuillez configurer l'API.")

        try:
            if self.config.provider == AIProvider.GEMINI:
                response_text = self._call_gemini(prompt)
            else:
                # OpenAI-compatible API (Z.ai, OpenRouter, OpenAI)
                response_text = self._call_openai_compatible(prompt)
            
            # Extract JSON from response
            json_str = self._extract_json(response_text)
            
            if not json_str:
                raise ValueError("L'IA n'a pas généré de JSON valide.")

            # Parse JSON
            data = json.loads(json_str)
            
            # Convert to WorkbookConfig
            config = WorkbookConfig.from_dict(data)
            
            return config

        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON: {e}")
        except urllib.error.HTTPError as e:
            raise ValueError(f"Erreur API HTTP {e.code}: {e.reason}")
        except Exception as e:
            raise ValueError(f"Erreur lors de la génération: {e}")

    def _call_gemini(self, prompt: str) -> str:
        """Call Google Gemini API"""
        import google.generativeai as genai
        
        genai.configure(api_key=self.config.api_key)
        model = genai.GenerativeModel(self.config.model)
        
        full_prompt = f"{SYSTEM_PROMPT}\n\nDemande de l'utilisateur:\n{prompt}\n\nGénère le JSON:"
        response = model.generate_content(full_prompt)
        
        return response.text

    def _call_openai_compatible(self, prompt: str) -> str:
        """Call OpenAI-compatible API (Z.ai, OpenRouter, OpenAI)"""
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.config.api_key}"
        }
        
        # Add extra headers for OpenRouter
        if self.config.provider == AIProvider.OPENROUTER:
            headers["HTTP-Referer"] = "https://bp2026-excel-creator.local"
            headers["X-Title"] = "BP 2026 Excel Creator"
        
        payload = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 4096
        }
        
        data = json.dumps(payload).encode("utf-8")
        url = f"{self.config.base_url}/chat/completions"
        
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
        
        return result["choices"][0]["message"]["content"]

    def _extract_json(self, text: str) -> Optional[str]:
        """Extract JSON from response text"""
        text = text.strip()
        
        # Remove markdown code blocks if present
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
            
        # Find matching closing brace
        depth = 0
        for i, char in enumerate(text[start:], start):
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    return text[start:i+1]
        
        return None


def get_provider_info(provider: AIProvider) -> dict:
    """Get information about an AI provider"""
    info = {
        AIProvider.ZAI_GLM: {
            "name": "Z.ai GLM-4.7",
            "description": "Modèle open-source performant de Zhipu AI",
            "url": "https://open.bigmodel.cn",
            "model": "glm-4.7",
            "free": False
        },
        AIProvider.OPENROUTER: {
            "name": "OpenRouter (GLM-4.7)",
            "description": "Accès à GLM-4.7 via OpenRouter",
            "url": "https://openrouter.ai",
            "model": "zhipu/glm-4.7",
            "free": False
        },
        AIProvider.GEMINI: {
            "name": "Google Gemini",
            "description": "API Google Gemini gratuite",
            "url": "https://makersuite.google.com/app/apikey",
            "model": "gemini-pro",
            "free": True
        },
        AIProvider.OPENAI: {
            "name": "OpenAI GPT-4",
            "description": "API OpenAI (payant)",
            "url": "https://platform.openai.com/api-keys",
            "model": "gpt-4",
            "free": False
        }
    }
    return info.get(provider, {})
