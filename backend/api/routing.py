from django.urls import re_path
from . import consumers

# Define WebSocket URL patterns
websocket_urlpatterns = [
    re_path(r'ws/user/(?P<user_id>\w+)/$', consumers.UsernameConsumer.as_asgi()),
]