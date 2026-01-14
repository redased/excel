"""
Models for Excel Creator
"""
from django.db import models
import json


class ExcelConfiguration(models.Model):
    """Stores Excel configuration for history"""
    name = models.CharField(max_length=255, default="BP 2026")
    config_json = models.JSONField(default=dict)
    prompt = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Configuration Excel"
        verbose_name_plural = "Configurations Excel"
    
    def __str__(self):
        return f"{self.name} - {self.created_at.strftime('%d/%m/%Y %H:%M')}"


# ============================================
# CONSOLIDATION PAR BULLE - Models
# ============================================

class ConsolidationConfig(models.Model):
    """Configuration de consolidation sauvegardée"""
    name = models.CharField(max_length=255, help_text="Nom de la configuration")
    output_filename = models.CharField(max_length=255, default="Consolidation", help_text="Nom du fichier de sortie")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Configuration globale des feuilles sélectionnées
    selected_sheets = models.JSONField(default=list, help_text="Liste des feuilles sélectionnées")
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = "Configuration de Consolidation"
        verbose_name_plural = "Configurations de Consolidation"
    
    def __str__(self):
        return f"{self.name} ({self.updated_at.strftime('%d/%m/%Y %H:%M')})"
    
    def to_dict(self):
        """Convertir en dictionnaire pour l'API"""
        return {
            'id': self.id,
            'name': self.name,
            'output_filename': self.output_filename,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'selected_sheets': self.selected_sheets,
            'responsables': [r.to_dict() for r in self.responsables.all()]
        }


class Responsable(models.Model):
    """Un responsable dans la consolidation"""
    config = models.ForeignKey(ConsolidationConfig, on_delete=models.CASCADE, related_name='responsables')
    name = models.CharField(max_length=255, help_text="Nom du responsable")
    order = models.IntegerField(default=0, help_text="Ordre d'affichage")
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Responsable"
        verbose_name_plural = "Responsables"
    
    def __str__(self):
        return self.name
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'order': self.order,
            'sites': [s.to_dict() for s in self.sites.all()]
        }


class Site(models.Model):
    """Un site (fichier Excel) appartenant à un responsable"""
    responsable = models.ForeignKey(Responsable, on_delete=models.CASCADE, related_name='sites')
    name = models.CharField(max_length=255, help_text="Nom du site (modifiable)")
    original_filename = models.CharField(max_length=255, help_text="Nom original du fichier")
    file_path = models.CharField(max_length=500, blank=True, null=True, help_text="Chemin du fichier uploadé")
    order = models.IntegerField(default=0, help_text="Ordre d'affichage")
    
    # Feuilles détectées dans ce fichier
    detected_sheets = models.JSONField(default=list, help_text="Feuilles détectées dans le fichier")
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Site"
        verbose_name_plural = "Sites"
    
    def __str__(self):
        return f"{self.name} ({self.original_filename})"
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'original_filename': self.original_filename,
            'file_path': self.file_path,
            'order': self.order,
            'detected_sheets': self.detected_sheets,
            'sheet_configs': [sc.to_dict() for sc in self.sheet_configs.all()]
        }


class SiteSheetConfig(models.Model):
    """Configuration d'extraction pour une feuille d'un site"""
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='sheet_configs')
    sheet_name = models.CharField(max_length=255, help_text="Nom de la feuille")
    col_start = models.CharField(max_length=5, default="A", help_text="Colonne de début")
    col_end = models.CharField(max_length=5, default="Z", help_text="Colonne de fin")
    row_start = models.IntegerField(default=1, help_text="Ligne de début")
    row_end = models.IntegerField(default=100, help_text="Ligne de fin")
    is_selected = models.BooleanField(default=True, help_text="Feuille sélectionnée pour extraction")
    
    class Meta:
        ordering = ['sheet_name']
        verbose_name = "Configuration de Feuille"
        verbose_name_plural = "Configurations de Feuilles"
        unique_together = ['site', 'sheet_name']
    
    def __str__(self):
        return f"{self.site.name} - {self.sheet_name}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'sheet_name': self.sheet_name,
            'col_start': self.col_start,
            'col_end': self.col_end,
            'row_start': self.row_start,
            'row_end': self.row_end,
            'is_selected': self.is_selected
        }
