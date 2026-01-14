"""
WSGI config for bp_web project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bp_web.settings')
application = get_wsgi_application()
