"""
Views for Excel Creator app
"""
import json
import os
from pathlib import Path

from django.shortcuts import render
from django.http import JsonResponse, FileResponse, Http404
from django.views import View
from django.views.generic import TemplateView
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from openpyxl import load_workbook

from .models import ExcelConfiguration
from .ai_generator import generate_config_with_ai
from .excel_generator import generate_excel


class IndexView(TemplateView):
    """Main page view"""
    template_name = 'excel_creator/index.html'


@method_decorator(csrf_exempt, name='dispatch')
class GenerateExcelAPIView(View):
    """API endpoint to generate Excel from configuration"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            config = data.get('config', {})
            
            if not config.get('sheets'):
                return JsonResponse({
                    'success': False,
                    'error': 'Configuration invalide: aucune feuille définie'
                }, status=400)
            
            # Generate Excel file
            filename = generate_excel(config)
            
            # Save configuration to history
            ExcelConfiguration.objects.create(
                name=data.get('name', 'BP 2026'),
                config_json=config
            )
            
            return JsonResponse({
                'success': True,
                'filename': filename,
                'download_url': f'/api/download/{filename}/'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'JSON invalide'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class AIGenerateAPIView(View):
    """API endpoint to generate configuration using AI"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            prompt = data.get('prompt', '')
            api_key = data.get('api_key', '')
            
            if not prompt:
                return JsonResponse({
                    'success': False,
                    'error': 'Veuillez entrer une description'
                }, status=400)
            
            if not api_key:
                return JsonResponse({
                    'success': False,
                    'error': 'Veuillez entrer votre clé API Z.ai'
                }, status=400)
            
            # Generate configuration using AI
            config = generate_config_with_ai(prompt, api_key)
            
            # Save to history
            ExcelConfiguration.objects.create(
                name='BP 2026 (IA)',
                config_json=config,
                prompt=prompt
            )
            
            return JsonResponse({
                'success': True,
                'config': config
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'JSON invalide'
            }, status=400)
        except ValueError as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Erreur: {str(e)}'
            }, status=500)


class DownloadExcelView(View):
    """Download generated Excel file"""
    
    def get(self, request, filename):
        filepath = Path(settings.MEDIA_ROOT) / "excel" / filename
        
        if not filepath.exists():
            raise Http404("Fichier non trouvé")
        
        response = FileResponse(
            open(filepath, 'rb'),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response


@method_decorator(csrf_exempt, name='dispatch')
class UploadFilesAPIView(View):
    """API endpoint to upload Excel files for consolidation"""
    
    def post(self, request):
        try:
            files = request.FILES.getlist('files')
            
            if not files:
                return JsonResponse({
                    'success': False,
                    'error': 'Aucun fichier uploadé'
                }, status=400)
            
            uploaded = []
            upload_dir = Path(settings.MEDIA_ROOT) / "uploads"
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            for f in files:
                filepath = upload_dir / f.name
                with open(filepath, 'wb+') as dest:
                    for chunk in f.chunks():
                        dest.write(chunk)
                uploaded.append({
                    'name': f.name,
                    'path': str(filepath),
                    'sheets': []
                })
                
                # Try to read sheets
                try:
                    wb = load_workbook(filepath, read_only=True, keep_links=False)
                    uploaded[-1]['sheets'] = wb.sheetnames
                    wb.close()
                except Exception:
                    pass
            
            return JsonResponse({
                'success': True,
                'files': uploaded
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ConsolidateAPIView(View):
    """API endpoint to consolidate Excel files"""
    
    def post(self, request):
        try:
            from .consolidator import consolidate_files
            
            data = json.loads(request.body)
            files = data.get('files', [])
            
            if not files:
                return JsonResponse({
                    'success': False,
                    'error': 'Aucun fichier à consolider'
                }, status=400)
            
            filename = consolidate_files(
                files=files,
                sheet_name=data.get('sheet_name', 'Feuille1'),
                start_column=data.get('start_column', 'E'),
                end_column=data.get('end_column', 'P'),
                start_row=data.get('start_row', 1),
                end_row=data.get('end_row', 10),
                group_by=data.get('group_by', 'branch')
            )
            
            return JsonResponse({
                'success': True,
                'filename': filename,
                'download_url': f'/api/download/{filename}/'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class AIConsolidateAPIView(View):
    """API endpoint to analyze files with AI for consolidation"""
    
    def post(self, request):
        try:
            from .consolidator import analyze_with_ai
            
            data = json.loads(request.body)
            files = data.get('files', [])
            description = data.get('description', '')
            api_key = data.get('api_key', '')
            
            if not api_key:
                return JsonResponse({
                    'success': False,
                    'error': 'Clé API requise'
                }, status=400)
            
            config = analyze_with_ai(files, description, api_key)
            
            return JsonResponse({
                'success': True,
                'config': config
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
