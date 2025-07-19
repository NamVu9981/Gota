# groups/utils.py - Group management utility functions
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import Count, Q
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

# ===== GROUP MEMBERSHIP UTILITIES =====

def get_user_groups(user, include_inactive=False):
    """Get all groups where user is a member"""
    from .models import Group
    
    query = Group.objects.filter(
        memberships__user=user,
        memberships__is_active=True
    )
    
    if not include_inactive:
        query = query.filter(is_active=True)
    
    return query.distinct()

def get_group_membership(group, user):
    """Get a user's membership in a specific group"""
    from .models import GroupMembership
    
    try:
        return GroupMembership.objects.get(
            group=group,
            user=user,
            is_active=True
        )
    except GroupMembership.DoesNotExist:
        return None

def is_group_member(group, user):
    """Check if user is an active member of a group"""
    from .models import GroupMembership
    
    return GroupMembership.objects.filter(
        group=group,
        user=user,
        is_active=True
    ).exists()

def is_group_owner(group, user):
    """Check if user is the owner of a group"""
    return group.owner == user

def can_user_modify_group(group, user):
    """Check if user can modify group settings"""
    return is_group_owner(group, user)

def can_user_add_members(group, user):
    """Check if user can add members to group"""
    membership = get_group_membership(group, user)
    return membership and membership.role == 'owner'

def can_user_remove_member(group, user, target_user):
    """Check if user can remove a specific member"""
    membership = get_group_membership(group, user)
    
    # Owner can remove anyone, members can remove themselves
    if membership and membership.role == 'owner':
        return True
    
    return user == target_user

# ===== GROUP CREATION AND MANAGEMENT =====

def create_group_with_owner(owner, group_data):
    """Create a new group and set the owner as a member"""
    from .models import Group, GroupMembership
    
    with transaction.atomic():
        # Create the group
        group = Group.objects.create(owner=owner, **group_data)
        
        # Create owner membership
        GroupMembership.objects.create(
            group=group,
            user=owner,
            role='owner',
            is_active=True,
            is_location_visible=True
        )
        
        logger.info(f"Created group {group.id} with owner {owner.username}")
        return group

def transfer_group_ownership(group, current_owner, new_owner):
    """Transfer group ownership to another member"""
    from .models import GroupMembership
    
    # Validate current owner
    if group.owner != current_owner:
        raise ValidationError("Only the current owner can transfer ownership")
    
    # Validate new owner is a member
    new_owner_membership = get_group_membership(group, new_owner)
    if not new_owner_membership:
        raise ValidationError("New owner must be an active group member")
    
    with transaction.atomic():
        # Update group owner
        group.owner = new_owner
        group.save()
        
        # Update memberships
        new_owner_membership.role = 'owner'
        new_owner_membership.save()
        
        # Demote old owner to member
        old_owner_membership = get_group_membership(group, current_owner)
        if old_owner_membership:
            old_owner_membership.role = 'member'
            old_owner_membership.save()
        
        logger.info(f"Transferred ownership of group {group.id} from {current_owner.username} to {new_owner.username}")

def deactivate_group(group, user):
    """Deactivate a group (soft delete)"""
    if not can_user_modify_group(group, user):
        raise ValidationError("Only group owner can deactivate the group")
    
    group.is_active = False
    group.save()
    
    logger.info(f"Deactivated group {group.id} by {user.username}")

# ===== MEMBER MANAGEMENT =====

def add_members_to_group(group, user_ids, added_by_user):
    """Add multiple members to a group"""
    from .models import GroupMembership
    
    if not can_user_add_members(group, added_by_user):
        raise ValidationError("User does not have permission to add members")
    
    processed_memberships = []
    errors = []
    
    with transaction.atomic():
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                
                membership, created = GroupMembership.objects.get_or_create(
                    group=group,
                    user=user,
                    defaults={
                        'role': 'member',
                        'is_active': True,
                        'is_location_visible': True
                    }
                )
                
                if created:
                    processed_memberships.append(membership)
                    logger.info(f"Added {user.username} to group {group.id}")
                else:
                    # Membership already exists - check if it's inactive
                    if not membership.is_active:
                        # Reactivate inactive membership
                        membership.is_active = True
                        membership.joined_at = timezone.now()
                        membership.save()
                        processed_memberships.append(membership)
                        logger.info(f"Reactivated {user.username} in group {group.id}")
                    else:
                        # Already active member
                        processed_memberships.append(membership)
                        
            except User.DoesNotExist:
                errors.append(f"User with ID {user_id} does not exist")
                logger.warning(f"Attempted to add non-existent user {user_id} to group {group.id}")
            except Exception as e:
                errors.append(f"Error processing user {user_id}: {str(e)}")
                logger.error(f"Error adding user {user_id} to group {group.id}: {str(e)}")
    
    return processed_memberships, errors

def remove_member_from_group(group, member_user, removed_by_user):
    """Remove a member from a group"""
    from .models import GroupMembership
    
    if not can_user_remove_member(group, removed_by_user, member_user):
        raise ValidationError("User does not have permission to remove this member")
    
    try:
        membership = GroupMembership.objects.get(
            group=group,
            user=member_user,
            is_active=True
        )
        
        # Prevent owner from leaving if there are other members
        if (membership.role == 'owner' and 
            group.memberships.filter(is_active=True).count() > 1):
            raise ValidationError("Group owner cannot leave while there are other members. Transfer ownership first.")
        
        membership.is_active = False
        membership.save()
        
        logger.info(f"Removed {member_user.username} from group {group.id}")
        return True
        
    except GroupMembership.DoesNotExist:
        raise ValidationError("User is not a member of this group")

def get_group_members(group, include_inactive=False):
    """Get all members of a group"""
    from .models import GroupMembership
    
    query = GroupMembership.objects.filter(group=group)
    
    if not include_inactive:
        query = query.filter(is_active=True)
    
    return query.select_related('user').order_by('joined_at')

def get_group_member_count(group, include_inactive=False):
    """Get count of group members"""
    query = group.memberships.all()
    
    if not include_inactive:
        query = query.filter(is_active=True)
    
    return query.count()

def update_member_location_sharing(group, user, is_visible):
    """Update a member's location sharing preference"""
    membership = get_group_membership(group, user)
    
    if not membership:
        raise ValidationError("User is not a member of this group")
    
    membership.is_location_visible = is_visible
    membership.save()
    
    logger.info(f"Updated location sharing for {user.username} in group {group.id}: {is_visible}")
    return membership

# ===== GROUP INVITATION UTILITIES =====

def create_group_invitations(group, user_ids, invited_by_user):
    """Create invitations for multiple users"""
    from .models import GroupInvitation, GroupMembership
    
    if not can_user_add_members(group, invited_by_user):
        raise ValidationError("User does not have permission to send invitations")
    
    invited_users = []
    errors = []
    
    with transaction.atomic():
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                
                # Check if user is already a member
                if GroupMembership.objects.filter(
                    group=group, user=user, is_active=True
                ).exists():
                    errors.append(f'{user.username} is already a member')
                    continue
                
                # Check if invitation already exists
                existing_invitation = GroupInvitation.objects.filter(
                    group=group, 
                    invited_user=user, 
                    status='pending'
                ).first()
                
                if existing_invitation and not existing_invitation.is_expired:
                    errors.append(f'{user.username} already has a pending invitation')
                    continue
                
                # Create or reuse invitation
                if existing_invitation and existing_invitation.is_expired:
                    # Reuse expired invitation
                    existing_invitation.status = 'pending'
                    existing_invitation.invited_by = invited_by_user
                    existing_invitation.created_at = timezone.now()
                    existing_invitation.save()
                    invitation = existing_invitation
                else:
                    # Create new invitation
                    invitation = GroupInvitation.objects.create(
                        group=group,
                        invited_by=invited_by_user,
                        invited_user=user
                    )
                
                invited_users.append(user.username)
                logger.info(f"Created invitation for {user.username} to group {group.id}")
                
            except User.DoesNotExist:
                errors.append(f'User with ID {user_id} does not exist')
    
    return invited_users, errors

def respond_to_group_invitation(invitation, user, action):
    """Accept or decline a group invitation"""
    from .models import GroupMembership
    
    if invitation.invited_user != user:
        raise ValidationError("You can only respond to your own invitations")
    
    if invitation.status != 'pending':
        raise ValidationError("This invitation has already been responded to")
    
    if invitation.is_expired:
        invitation.status = 'expired'
        invitation.save()
        raise ValidationError("This invitation has expired")
    
    if action not in ['accept', 'decline']:
        raise ValidationError("Action must be either 'accept' or 'decline'")
    
    with transaction.atomic():
        if action == 'accept':
            # Create group membership
            GroupMembership.objects.create(
                group=invitation.group,
                user=user,
                role='member',
                is_active=True,
                is_location_visible=True
            )
            invitation.status = 'accepted'
            logger.info(f"{user.username} accepted invitation to group {invitation.group.id}")
        else:
            invitation.status = 'declined'
            logger.info(f"{user.username} declined invitation to group {invitation.group.id}")
        
        invitation.responded_at = timezone.now()
        invitation.save()
    
    return invitation

def get_user_pending_invitations(user):
    """Get all pending invitations for a user"""
    from .models import GroupInvitation
    
    invitations = GroupInvitation.objects.filter(
        invited_user=user,
        status='pending'
    ).select_related('group', 'invited_by')
    
    # Filter out expired invitations
    active_invitations = [inv for inv in invitations if not inv.is_expired]
    
    return active_invitations

def cleanup_expired_invitations():
    """Clean up expired invitations (utility for periodic tasks)"""
    from .models import GroupInvitation
    
    expired_invitations = GroupInvitation.objects.filter(status='pending')
    expired_count = 0
    
    for invitation in expired_invitations:
        if invitation.is_expired:
            invitation.status = 'expired'
            invitation.save()
            expired_count += 1
    
    logger.info(f"Marked {expired_count} invitations as expired")
    return expired_count

# ===== GROUP STATISTICS AND ANALYTICS =====

def get_group_statistics(group):
    """Get comprehensive statistics for a group"""
    from .models import GroupMembership
    
    memberships = GroupMembership.objects.filter(group=group)
    active_memberships = memberships.filter(is_active=True)
    
    stats = {
        'total_members': active_memberships.count(),
        'total_invitations': group.invitations.filter(status='pending').count(),
        'members_with_location_sharing': active_memberships.filter(is_location_visible=True).count(),
        'creation_date': group.created_at,
        'last_activity': group.updated_at,
        'owner': {
            'id': str(group.owner.id),
            'username': group.owner.username,
            'email': group.owner.email,
        }
    }
    
    # Add expense statistics if available
    try:
        from expense.utils import get_group_expense_summary
        expense_stats = get_group_expense_summary(group)
        stats['expenses'] = expense_stats
    except ImportError:
        pass
    
    return stats

def get_user_group_summary(user):
    """Get summary of all groups for a user"""
    groups = get_user_groups(user)
    
    summary = {
        'total_groups': groups.count(),
        'owned_groups': groups.filter(owner=user).count(),
        'member_groups': groups.exclude(owner=user).count(),
        'groups': []
    }
    
    for group in groups:
        membership = get_group_membership(group, user)
        group_data = {
            'id': str(group.id),
            'name': group.name,
            'description': group.description,
            'role': membership.role if membership else 'unknown',
            'member_count': get_group_member_count(group),
            'is_owner': is_group_owner(group, user),
            'location_sharing': membership.is_location_visible if membership else False,
            'joined_at': membership.joined_at if membership else None,
        }
        
        # Add expense summary if available
        try:
            from expense.utils import get_group_expense_summary
            expense_stats = get_group_expense_summary(group, user)
            group_data['expense_summary'] = {
                'total_expenses': expense_stats.get('total_expenses', 0),
                'user_balance': expense_stats.get('user_balance', 0),
                'pending_count': expense_stats.get('user_pending_count', 0),
            }
        except ImportError:
            pass
        
        summary['groups'].append(group_data)
    
    return summary

# ===== VALIDATION UTILITIES =====

def validate_group_name(name, exclude_group_id=None):
    """Validate that group name is unique for the user"""
    from .models import Group
    
    query = Group.objects.filter(name=name, is_active=True)
    
    if exclude_group_id:
        query = query.exclude(id=exclude_group_id)
    
    if query.exists():
        raise ValidationError("A group with this name already exists")
    
    return True

def validate_group_data(group_data, user, exclude_group_id=None):
    """Validate group creation/update data"""
    errors = {}
    
    # Validate name
    if 'name' in group_data:
        name = group_data['name']
        if not name or len(name.strip()) == 0:
            errors['name'] = "Group name is required"
        elif len(name) > 100:
            errors['name'] = "Group name must be 100 characters or less"
    
    # Validate description
    if 'description' in group_data:
        description = group_data['description']
        if description and len(description) > 500:
            errors['description'] = "Description must be 500 characters or less"
    
    return errors

# ===== SEARCH AND FILTERING =====

def search_groups(query, user=None):
    """Search for groups by name or description"""
    from .models import Group
    
    groups = Group.objects.filter(
        Q(name__icontains=query) | Q(description__icontains=query),
        is_active=True
    )
    
    if user:
        # Only return groups where user is a member
        groups = groups.filter(
            memberships__user=user,
            memberships__is_active=True
        )
    
    return groups.distinct()

def get_groups_by_location_sharing(user, location_sharing_enabled=True):
    """Get groups where user has location sharing enabled/disabled"""
    from .models import GroupMembership
    
    memberships = GroupMembership.objects.filter(
        user=user,
        is_active=True,
        is_location_visible=location_sharing_enabled
    ).select_related('group')
    
    return [membership.group for membership in memberships if membership.group.is_active]

# ===== UTILITY DECORATORS =====

def require_group_membership(view_func):
    """Decorator to ensure user is a group member"""
    def wrapper(request, group_id, *args, **kwargs):
        from django.shortcuts import get_object_or_404
        from .models import Group, GroupMembership
        
        group = get_object_or_404(Group, id=group_id, is_active=True)
        
        if not is_group_member(group, request.user):
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {'error': 'You must be a group member to access this resource.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return view_func(request, group_id, *args, **kwargs)
    
    return wrapper

def require_group_owner(view_func):
    """Decorator to ensure user is the group owner"""
    def wrapper(request, group_id, *args, **kwargs):
        from django.shortcuts import get_object_or_404
        from .models import Group
        
        group = get_object_or_404(Group, id=group_id, is_active=True)
        
        if not is_group_owner(group, request.user):
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {'error': 'Only the group owner can perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return view_func(request, group_id, *args, **kwargs)
    
    return wrapper