# groups/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} (Owner: {self.owner.username})"
    
    @property
    def member_count(self):
        return self.memberships.filter(is_active=True).count()
    
    @property
    def last_activity(self):
        # Get the most recent activity from group memberships
        latest_membership = self.memberships.filter(is_active=True).order_by('-joined_at').first()
        if latest_membership:
            return latest_membership.joined_at
        return self.created_at

class GroupMembership(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('member', 'Member'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_location_visible = models.BooleanField(default=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['group', 'user']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.username} in {self.group.name} ({self.role})"
    
    def save(self, *args, **kwargs):
        # Set role to owner if user is the group owner
        if self.user == self.group.owner:
            self.role = 'owner'
        super().save(*args, **kwargs)

class GroupInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='invitations')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_group_invitations')
    invited_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_group_invitations')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        unique_together = ['group', 'invited_user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation to {self.invited_user.username} for {self.group.name}"
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Set expiration to 7 days from now
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at and self.status == 'pending'

class LocationShare(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    membership = models.ForeignKey(GroupMembership, on_delete=models.CASCADE, related_name='location_shares')
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    accuracy = models.FloatField(null=True, blank=True)  # GPS accuracy in meters
    timestamp = models.DateTimeField(auto_now_add=True)
    battery_level = models.IntegerField(null=True, blank=True)  # 0-100
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"Location for {self.membership.user.username} in {self.membership.group.name}"