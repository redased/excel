"""
URL patterns for excel_creator app
"""
from django.urls import path
from . import views
from . import consbulle_api
from . import consolidation_modes
from . import verify_api

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
    # Structured ConsBulle (old)
    path('api/generate-consbulle/', views.GenerateConsBulleAPIView.as_view(), name='generate_consbulle'),
    
    # ============================================
    # ConsBulle V2 APIs with SQLite persistence
    # ============================================
    
    # Config CRUD
    path('api/consbulle/configs/', consbulle_api.ConsolidationConfigListAPIView.as_view(), name='consbulle_configs'),
    path('api/consbulle/configs/<int:config_id>/', consbulle_api.ConsolidationConfigDetailAPIView.as_view(), name='consbulle_config_detail'),
    
    # Responsable CRUD
    path('api/consbulle/configs/<int:config_id>/responsables/', consbulle_api.ResponsableAPIView.as_view(), name='consbulle_responsables'),
    path('api/consbulle/configs/<int:config_id>/responsables/<int:resp_id>/', consbulle_api.ResponsableAPIView.as_view(), name='consbulle_responsable_detail'),
    
    # Site CRUD
    path('api/consbulle/responsables/<int:resp_id>/sites/', consbulle_api.SiteAPIView.as_view(), name='consbulle_sites'),
    path('api/consbulle/responsables/<int:resp_id>/sites/<int:site_id>/', consbulle_api.SiteAPIView.as_view(), name='consbulle_site_detail'),
    
    # Parse Excel sheets
    path('api/consbulle/parse-sheets/', consbulle_api.ParseExcelSheetsAPIView.as_view(), name='consbulle_parse_sheets'),
    path('api/consbulle/analyze-structure/', consbulle_api.AnalyzeStructureAPIView.as_view(), name='consbulle_analyze_structure'),
    
    # Generate Excel V2 with format preservation
    path('api/consbulle/generate/', consbulle_api.GenerateConsBulleV2APIView.as_view(), name='consbulle_generate_v2'),
    
    # ============================================
    # Multi-Mode Consolidation APIs
    # ============================================
    path('api/consolidation/modes/', consolidation_modes.ConsolidationModesAPIView.as_view(), name='consolidation_modes'),
    path('api/consolidation/generate/', consolidation_modes.MultiModeConsolidationAPIView.as_view(), name='consolidation_generate'),
    
    # ============================================
    # File Preparation Module APIs
    # ============================================
    path('api/prep-file/analyze/', views.PrepFileAnalyzeAPIView.as_view(), name='prep_file_analyze'),
    path('api/prep-file/generate/', views.PrepFileGenerateAPIView.as_view(), name='prep_file_generate'),
    
    # ============================================
    # File Verification/Test APIs
    # ============================================
    path('api/verify/compare/', verify_api.FileCompareAPIView.as_view(), name='verify_compare'),
    path('api/verify/correct/', verify_api.FileCorrectAPIView.as_view(), name='verify_correct'),
    path('api/verify/preview/', verify_api.FilePreviewAPIView.as_view(), name='verify_preview'),
    
    # Test Consolidation
    path('api/sheet-content/', views.GetSheetContentAPIView.as_view(), name='sheet_content'),
    path('api/preview-consolidation/', views.PreviewConsolidationAPIView.as_view(), name='preview_consolidation'),
]

