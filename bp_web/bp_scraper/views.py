from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import json
from .services import ScraperService

@method_decorator(csrf_exempt, name='dispatch')
class AnalyzeURLView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            url = data.get('url')
            
            if not url:
                return JsonResponse({'success': False, 'error': 'URL manquante'}, status=400)
                
            service = ScraperService()
            result = service.analyze_url(url)
            
            if result['success']:
                return JsonResponse(result)
            else:
                return JsonResponse(result, status=500)
                
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
