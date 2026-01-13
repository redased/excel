"""
URL patterns for excel_creator app
"""
from django.urls import path
from . import views

app_name = 'excel_creator'

urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('api/generate/', views.GenerateExcelAPIView.as_view(), name='generate'),
    path('api/ai-generate/', views.AIGenerateAPIView.as_view(), name='ai_generate'),
    path('api/download/<str:filename>/', views.DownloadExcelView.as_view(), name='download'),
    # Consolidation
    path('api/upload-files/', views.UploadFilesAPIView.as_view(), name='upload_files'),
    path('api/consolidate/', views.ConsolidateAPIView.as_view(), name='consolidate'),
    path('api/ai-consolidate/', views.AIConsolidateAPIView.as_view(), name='ai_consolidate'),
    # Bubble Consolidation
    path('api/parse-bubble-files/', views.ParseBubbleFilesAPIView.as_view(), name='parse_bubble_files'),
    path('api/generate-bubble-excel/', views.GenerateBubbleExcelAPIView.as_view(), name='generate_bubble_excel'),
    # Structured ConsBulle
    path('api/generate-consbulle/', views.GenerateConsBulleAPIView.as_view(), name='generate_consbulle'),
]
