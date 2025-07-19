# groups/admin.py
from django.contrib import admin
from .models import Group, GroupMembership, GroupInvitation, LocationShare

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'member_count', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'owner__username', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at', 'member_count', 'last_activity']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'owner', 'is_active')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'member_count', 'last_activity'),
            'classes': ('collapse',)
        }),
    )

@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'group', 'role', 'joined_at', 'is_active', 'is_location_visible']
    list_filter = ['role', 'is_active', 'is_location_visible', 'joined_at']
    search_fields = ['user__username', 'group__name']
    readonly_fields = ['id', 'joined_at']
    
    fieldsets = (
        (None, {
            'fields': ('group', 'user', 'role', 'is_active')
        }),
        ('Location Settings', {
            'fields': ('is_location_visible', 'last_seen')
        }),
        ('Metadata', {
            'fields': ('id', 'joined_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(GroupInvitation)
class GroupInvitationAdmin(admin.ModelAdmin):
    list_display = ['invited_user', 'group', 'invited_by', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'created_at', 'expires_at']
    search_fields = ['invited_user__username', 'group__name', 'invited_by__username']
    readonly_fields = ['id', 'created_at', 'is_expired']
    
    fieldsets = (
        (None, {
            'fields': ('group', 'invited_by', 'invited_user', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'responded_at', 'expires_at', 'is_expired')
        }),
        ('Metadata', {
            'fields': ('id',),
            'classes': ('collapse',)
        }),
    )

@admin.register(LocationShare)
class LocationShareAdmin(admin.ModelAdmin):
    list_display = ['membership', 'latitude', 'longitude', 'timestamp', 'accuracy']
    list_filter = ['timestamp', 'accuracy']
    search_fields = ['membership__user__username', 'membership__group__name']
    readonly_fields = ['id', 'timestamp']
    
    fieldsets = (
        (None, {
            'fields': ('membership', 'latitude', 'longitude', 'accuracy')
        }),
        ('Additional Info', {
            'fields': ('battery_level', 'timestamp')
        }),
        ('Metadata', {
            'fields': ('id',),
            'classes': ('collapse',)
        }),
    )