from .serializers import UserSerializer, LoginSerializer, UserProfileSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import generics
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        }) 
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        print("Serializer is valid") 
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user.profile

    def update(self, request, *args, **kwargs):
        # Store old username for comparison
        old_username = request.user.username
        print(f"Current username before update: {old_username}")

        # Standard update procedure
        partial = kwargs.pop('partial', True)
        instance = self.get_object()  # Fixed the typo: "instace" -> "instance"
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # After update, check if username changed
        request.user.refresh_from_db()  # Make sure we have the latest data
        new_username = request.user.username
        print(f"Username after update: {new_username}")

        if old_username != new_username:
            print(f"Username changed from '{old_username}' to '{new_username}' - sending WebSocket message")
            self.send_websocket_update(request.user)
        else:
            print("Username did not change - checking if other fields changed")
            # Check if avatar or other profile fields changed
            if 'avatar' in request.data or 'location' in request.data:
                print("Profile fields changed - sending profile update WebSocket message")
                self.send_profile_websocket_update(instance)

        return Response(serializer.data)

    def send_websocket_update(self, user):
        """Send WebSocket update for user details"""
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(
                    f'profile_{user.id}',
                    {
                        'type': 'profile_update',
                        'username': user.username,
                        'email': user.email,
                        'update_type': 'user_details'
                    }
                )
                print(f"✅ WebSocket message sent for user details update (user {user.id})")
            except Exception as e:
                print(f"❌ Error sending WebSocket message: {str(e)}")
        else:
            print("❌ Channel layer not available")

    def send_profile_websocket_update(self, profile):
        """Send WebSocket update for profile details"""
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                # Generate avatar URL if available
                avatar_url = profile.avatar.url if profile.avatar else None

                async_to_sync(channel_layer.group_send)(
                    f'profile_{profile.user.id}',
                    {
                        'type': 'profile_update',
                        'avatar_url': avatar_url,
                        'location': profile.location,
                        'has_completed_onboarding': profile.has_completed_onboarding,
                        'update_type': 'profile_details'
                    }
                )
                print(f"✅ WebSocket message sent for profile details update (user {profile.user.id})")
            except Exception as e:
                print(f"❌ Error sending WebSocket message: {str(e)}")
        else:
            print("❌ Channel layer not available")
