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
