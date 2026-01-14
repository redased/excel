from django.urls import path
from .views import AnalyzeURLView

urlpatterns = [
    path('analyze/', AnalyzeURLView.as_view(), name='scraper_analyze'),
]
