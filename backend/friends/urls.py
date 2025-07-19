# friends/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.send_friend_request, name='send_friend_request'),
    path('accept/<int:request_id>/', views.accept_friend_request, name='accept_friend_request'),
    path('reject/<int:request_id>/', views.reject_friend_request, name='reject_friend_request'),
    path('pending/', views.pending_requests, name='pending_requests'),
    path('list/', views.friends_list, name='friends_list'),
    path('remove/<int:user_id>/', views.remove_friend, name='remove_friend'),
]