from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FriendShip

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']
    def get_avatar(self, obj):
        try:
            if hasattr(obj, 'profile') and obj.profile.avatar:
                return obj.profile.avatar.url
        except:
            pass
        return None

class FriendShipSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)

    class Meta:
        model = FriendShip
        fields = ['id', 'from_user', 'to_user', 'status', 'created_at', 'updated_at']

class CreateFriendshipSerializer(serializers.ModelSerializer):
    to_user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = FriendShip
        fields = ['to_user_id']
    
    def validate_to_user_id(self, value):
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        return value
    
    def create(self, validated_data):
        to_user_id = validated_data.pop('to_user_id')
        to_user = User.objects.get(id=to_user_id)
        from_user = self.context['request'].user
        
        return FriendShip.objects.create(
            from_user=from_user,
            to_user=to_user,
            status='pending'
        )