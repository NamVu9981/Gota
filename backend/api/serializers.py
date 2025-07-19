from django.contrib.auth import get_user_model
from .models import UserProfile
from rest_framework import serializers
from django.contrib.auth import authenticate
import uuid

User=get_user_model()

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
    def validate_email(self, value):
        """Check if the email already exists."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists. Please log in instead.")
        return value
    def validate_username(self, value):
        """Check if the username already exists."""
        return validate_username_unique(value)

    def create(self, validated_data):
        temp_username = f"user_{uuid.uuid4().hex[:10]}"
        user = User.objects.create_user(
            username=temp_username,
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    has_completed_onboarding = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('username', 'email', 'avatar', 'location', 'has_completed_onboarding')
    def to_representation(self, instance):
        # Get the default representation
        representation = super().to_representation(instance)
        # Add the user ID
        representation['user_id'] = instance.user.id
        return representation
    def validate_username(self, value):
        """Check if the username already exists, excluding current user."""
        request = self.context.get('request')
        user_id = request.user.id if request and hasattr(request, 'user') else None
        return validate_username_unique(value, user_id)

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        # Log for debugging
        print(f"UserProfileSerializer.update called with user_data: {user_data}")

        if user_data:
            user = instance.user

            for attr, value in user_data.items():
                setattr(user, attr, value)

            # Save the user
            user.save()

            # Get avatar URL for logging
            avatar_url = None
            if instance.avatar:
                avatar_url = instance.avatar.url

            print(f"Profile has avatar URL: {avatar_url}")

            # Send WebSocket with complete data
            self.send_websocket_update(user, instance)

        # Update the profile instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If avatar changed, send a WebSocket update
        if 'avatar' in validated_data:
            print(f"Avatar changed - sending WebSocket update")
            self.send_websocket_update(instance.user, instance)

        return instance

    def send_websocket_update(self, user, profile):
        """Send WebSocket update with complete profile data"""
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                # Get avatar URL
                avatar_url = None
                if hasattr(profile, 'avatar') and profile.avatar:
                    avatar_url = profile.avatar.url
                    print(f"Including avatar URL in WebSocket: {avatar_url}")

                # Send complete data
                async_to_sync(channel_layer.group_send)(
                    f'profile_{user.id}',
                    {
                        'type': 'profile_update',
                        'username': user.username,
                        'email': user.email,
                        'avatar_url': avatar_url,
                        'location': profile.location if hasattr(profile, 'location') else None,
                        'has_completed_onboarding': profile.has_completed_onboarding if hasattr(profile,
                                                                                                'has_completed_onboarding') else False,
                        'user_id': str(user.id),
                        'update_type': 'user_details'
                    }
                )
                print(f"✅ Complete WebSocket message sent with avatar_url: {avatar_url}")
            except Exception as e:
                print(f"❌ Error sending WebSocket message: {str(e)}")
                import traceback
                traceback.print_exc()
        else:
            print("❌ Channel layer not available")



class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No such user")
        if not user.check_password(password):
            raise serializers.ValidationError("Incorrect password")
        if user and user.is_active:
            return {
                'user': user
            }
        raise serializers.ValidationError("No such user")

def validate_username_unique(value, user_id=None):
    """
    Validate that a username is unique.
    If user_id is provided, exclude that user from the check (for updates).
    """
    query = User.objects.filter(username=value)
    if user_id:
        query = query.exclude(id=user_id)
    if query.exists():
        raise serializers.ValidationError("This username is already taken. Please choose a different one.")
    return value
