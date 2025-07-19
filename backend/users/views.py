from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search for users by username or email"""
    query = request.GET.get('q', '').strip()
    
    if not query:
        return Response({'error': 'Search query is required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if len(query) < 2:
        return Response({'error': 'Search query must be at least 2 characters'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Search users by username or email (case insensitive)
    # Exclude the current user from results
    users = User.objects.filter(
        Q(username__icontains=query) | Q(email__icontains=query)
    ).exclude(id=request.user.id)[:20]  # Limit to 20 results
    
    # Create simple user data
    user_data = []
    for user in users:
        user_info = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'avatar': None,
        }
        
        # Add avatar if user has a profile with avatar
        try:
            if hasattr(user, 'profile') and user.profile.avatar:
                user_info['avatar'] = user.profile.avatar.url
        except Exception as e:
            pass
            
        user_data.append(user_info)
    
    return Response(user_data)
