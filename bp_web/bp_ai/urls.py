from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.analyze_anomalies, name='analyze_anomalies'),
]
