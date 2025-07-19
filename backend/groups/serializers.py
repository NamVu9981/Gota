# groups/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Group, GroupMembership, GroupInvitation, LocationShare

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

class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_owner = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupMembership
        fields = [
            'id', 'user', 'role', 'joined_at', 'is_location_visible', 
            'last_seen', 'is_owner'
        ]
    
    def get_is_owner(self, obj):
        return obj.role == 'owner'

class GroupSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    member_count = serializers.ReadOnlyField()
    last_activity = serializers.ReadOnlyField()
    is_owner = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'owner', 'created_at', 
            'updated_at', 'member_count', 'last_activity', 'is_owner', 'members'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner']
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.owner == request.user
        return False
    
    def get_members(self, obj):
        # Only include members in detailed view
        if self.context.get('include_members', False):
            memberships = obj.memberships.filter(is_active=True).select_related('user')
            return GroupMemberSerializer(memberships, many=True).data
        return None

class CreateGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['name', 'description']
    
    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Group name must be at least 2 characters long.")
        return value.strip()
    
    def create(self, validated_data):
        request = self.context['request']
        group = Group.objects.create(
            owner=request.user,
            **validated_data
        )
        
        # Create owner membership
        GroupMembership.objects.create(
            group=group,
            user=request.user,
            role='owner'
        )
        
        return group

class AddMembersSerializer(serializers.Serializer):
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=50,  # Limit bulk additions
        help_text="List of user IDs to add to the group"
    )
    
    def validate_member_ids(self, value):
        # Remove duplicates
        value = list(set(value))
        
        # Check if all users exist
        existing_users = User.objects.filter(id__in=value)
        if len(existing_users) != len(value):
            existing_ids = set(existing_users.values_list('id', flat=True))
            invalid_ids = set(value) - existing_ids
            raise serializers.ValidationError(
                f"Users with IDs {list(invalid_ids)} do not exist."
            )
        
        return value
    
    def validate(self, data):
        group = self.context['group']
        member_ids = data['member_ids']
        
        # Check if any users are already members
        existing_memberships = GroupMembership.objects.filter(
            group=group,
            user_id__in=member_ids,
            is_active=True
        ).values_list('user_id', flat=True)
        
        if existing_memberships:
            existing_usernames = User.objects.filter(
                id__in=existing_memberships
            ).values_list('username', flat=True)
            raise serializers.ValidationError(
                f"Users {list(existing_usernames)} are already members of this group."
            )
        
        return data

class GroupInvitationSerializer(serializers.ModelSerializer):
    invited_user = UserSerializer(read_only=True)
    invited_by = UserSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = GroupInvitation
        fields = [
            'id', 'group', 'invited_by', 'invited_user', 'status',
            'created_at', 'responded_at', 'expires_at', 'is_expired'
        ]

class LocationShareSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = LocationShare
        fields = [
            'id', 'user', 'latitude', 'longitude', 'accuracy',
            'timestamp', 'battery_level'
        ]
    
    def get_user(self, obj):
        return UserSerializer(obj.membership.user).data

class UpdateLocationSharingSerializer(serializers.Serializer):
    is_location_visible = serializers.BooleanField()
    
    def update_membership(self, membership):
        membership.is_location_visible = self.validated_data['is_location_visible']
        membership.save()
        return membership