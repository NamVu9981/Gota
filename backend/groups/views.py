# groups/views.py
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import Group, GroupMembership, GroupInvitation
from .serializers import (
    GroupSerializer, CreateGroupSerializer, GroupMemberSerializer,
    AddMembersSerializer, UpdateLocationSharingSerializer,
    GroupInvitationSerializer
)

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_groups(request):
    """Get all groups where user is a member"""
    groups = Group.objects.filter(
        memberships__user=request.user,
        memberships__is_active=True,
        is_active=True
    ).distinct()
    
    serializer = GroupSerializer(groups, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    """Create a new group"""
    serializer = CreateGroupSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        with transaction.atomic():
            group = serializer.save()
        
        # Return the created group with full details
        response_serializer = GroupSerializer(group, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_group_details(request, group_id):
    """Get group details with members"""
    group = get_object_or_404(
        Group,
        id=group_id,
        memberships__user=request.user,
        memberships__is_active=True,
        is_active=True
    )
    
    serializer = GroupSerializer(group, context={'request': request, 'include_members': True})
    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_group(request, group_id):
    """Update group details (owner only)"""
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Check if user is owner
    if group.owner != request.user:
        return Response(
            {'error': 'Only the group owner can update this group.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = CreateGroupSerializer(group, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        
        response_serializer = GroupSerializer(group, context={'request': request})
        return Response(response_serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_group(request, group_id):
    """Delete group (owner only)"""
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Only owner can delete the group
    if group.owner != request.user:
        return Response(
            {'error': 'Only the group owner can delete this group.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    group.is_active = False
    group.save()
    
    return Response({'message': 'Group deleted successfully.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_members_to_group(request, group_id):
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Check if user has permission to add members (owner only)
    user_membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    if user_membership.role != 'owner':
        return Response(
            {'error': 'Only group owners can add members.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = AddMembersSerializer(
        data=request.data,
        context={'group': group}
    )
    
    if serializer.is_valid():
        member_ids = serializer.validated_data['member_ids']
        
        with transaction.atomic():
            processed_memberships = []
            
            for user_id in member_ids:
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
                        print(f"✅ Created new membership for {user.username}")
                        processed_memberships.append(membership)
                    else:
                        # 🔍 Membership already exists - check if it's inactive
                        if not membership.is_active:
                            # 🔄 Reactivate inactive membership
                            membership.is_active = True
                            membership.joined_at = timezone.now()  # Update join time
                            membership.save()
                            print(f"🔄 Reactivated membership for {user.username}")
                            processed_memberships.append(membership)
                        else:
                            print(f"⚠️ {user.username} is already an active member")
                            processed_memberships.append(membership)
                            
                except User.DoesNotExist:
                    print(f"❌ User with ID {user_id} does not exist")
                    continue
                except Exception as e:
                    print(f"❌ Error processing user {user_id}: {str(e)}")
                    continue
        
        # Serialize the processed memberships
        response_serializer = GroupMemberSerializer(processed_memberships, many=True)
        
        return Response({
            'success': True,
            'message': f'Successfully processed {len(processed_memberships)} member(s).',
            'added_members': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_member_from_group(request, group_id):
    """Remove a member from the group"""
    group = get_object_or_404(Group, id=group_id, is_active=True)
    member_id = request.data.get('member_id')
    
    if not member_id:
        return Response(
            {'error': 'member_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user has permission to remove members
    user_membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    # Only owner can remove members, or members can remove themselves
    target_membership = get_object_or_404(
        GroupMembership,
        group=group,
        user_id=member_id,
        is_active=True
    )
    
    if user_membership.role != 'owner' and target_membership.user != request.user:
        return Response(
            {'error': 'You do not have permission to remove this member.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Prevent owner from removing themselves if there are other members
    if (target_membership.role == 'owner' and 
        group.memberships.filter(is_active=True).count() > 1):
        return Response(
            {'error': 'Group owner cannot leave while there are other members. Transfer ownership first.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    target_membership.is_active = False
    target_membership.save()
    
    return Response({
        'success': True,
        'message': 'Member removed successfully.'
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_group_members(request, group_id):
    """Get all members of a group"""
    group = get_object_or_404(
        Group,
        id=group_id,
        memberships__user=request.user,
        memberships__is_active=True,
        is_active=True
    )
    
    memberships = group.memberships.filter(is_active=True).select_related('user')
    serializer = GroupMemberSerializer(memberships, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_location_sharing(request, group_id):
    """Update user's location sharing preference for this group"""
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    serializer = UpdateLocationSharingSerializer(data=request.data)
    if serializer.is_valid():
        serializer.update_membership(membership)
        
        return Response({
            'success': True,
            'message': 'Location sharing preference updated.',
            'is_location_visible': membership.is_location_visible
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_group_invitations(request):
    """Get pending group invitations for the current user"""
    invitations = GroupInvitation.objects.filter(
        invited_user=request.user,
        status='pending'
    ).select_related('group', 'invited_by')
    
    # Filter out expired invitations
    active_invitations = [inv for inv in invitations if not inv.is_expired]
    
    serializer = GroupInvitationSerializer(active_invitations, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_invitation(request, invitation_id):
    """Accept or decline a group invitation"""
    invitation = get_object_or_404(
        GroupInvitation,
        id=invitation_id,
        invited_user=request.user,
        status='pending'
    )
    
    if invitation.is_expired:
        invitation.status = 'expired'
        invitation.save()
        return Response(
            {'error': 'This invitation has expired.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    action = request.data.get('action')  # 'accept' or 'decline'
    
    if action not in ['accept', 'decline']:
        return Response(
            {'error': 'Action must be either "accept" or "decline".'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    with transaction.atomic():
        if action == 'accept':
            # Create group membership
            GroupMembership.objects.create(
                group=invitation.group,
                user=request.user,
                role='member'
            )
            invitation.status = 'accepted'
        else:
            invitation.status = 'declined'
        
        invitation.responded_at = timezone.now()
        invitation.save()
    
    message = f'Group invitation {"accepted" if action == "accept" else "declined"} successfully.'
    return Response({
        'success': True,
        'message': message,
        'action': action
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_to_group(request, group_id):
    """Invite users to a group"""
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Check if user has permission to invite
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    if membership.role != 'owner':
        return Response(
            {'error': 'Only group owners can send invitations.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    user_ids = request.data.get('user_ids', [])
    if not user_ids:
        return Response(
            {'error': 'user_ids is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
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
                    errors.append(f'{user.username} is already a member.')
                    continue
                
                # Check if invitation already exists
                if GroupInvitation.objects.filter(
                    group=group, invited_user=user, status='pending'
                ).exists():
                    errors.append(f'{user.username} already has a pending invitation.')
                    continue
                
                # Create invitation
                GroupInvitation.objects.create(
                    group=group,
                    invited_by=request.user,
                    invited_user=user
                )
                invited_users.append(user.username)
                
            except User.DoesNotExist:
                errors.append(f'User with ID {user_id} does not exist.')
    
    return Response({
        'success': True,
        'message': f'Invitations sent to {len(invited_users)} user(s).',
        'invited_users': invited_users,
        'errors': errors
    })