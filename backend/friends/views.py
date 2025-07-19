# friends/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import FriendShip
from .serializers import FriendShipSerializer, CreateFriendshipSerializer, UserSerializer

User = get_user_model()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    """Send a friend request to another user"""
    to_user_id = request.data.get('to_user_id')
    from_user = request.user
    
    # Validate to_user_id
    if not to_user_id:
        return Response({'error': 'to_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        to_user_id = int(to_user_id)
        to_user = User.objects.get(id=to_user_id)
    except (ValueError, User.DoesNotExist):
        return Response({'error': 'Invalid user ID'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if users are the same
    if from_user.id == to_user_id:
        return Response({'error': 'Cannot send friend request to yourself'}, 
                      status=status.HTTP_400_BAD_REQUEST)
    
    # Check if friendship already exists
    existing = FriendShip.objects.filter(
        Q(from_user=from_user, to_user=to_user) | 
        Q(from_user=to_user, to_user=from_user)
    ).first()
    
    if existing:
        if existing.status == 'accepted':
            return Response({'error': 'Already friends'}, status=status.HTTP_400_BAD_REQUEST)
        elif existing.status == 'pending':
            return Response({'error': 'Friend request already sent'}, status=status.HTTP_400_BAD_REQUEST)
        elif existing.status == 'blocked':
            return Response({'error': 'Cannot send request to this user'}, status=status.HTTP_403_FORBIDDEN)
        elif existing.status == 'rejected':
            # Update the existing rejected request to pending
            existing.status = 'pending'
            existing.from_user = from_user
            existing.to_user = to_user
            existing.save()
            
            response_serializer = FriendShipSerializer(existing)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    # Create new friendship if none exists
    try:
        friendship = FriendShip.objects.create(
            from_user=from_user,
            to_user=to_user,
            status='pending'
        )
        
        response_serializer = FriendShipSerializer(friendship)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': 'Failed to create friend request'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, request_id):
    """Accept a friend request"""
    try:
        friendship = FriendShip.objects.get(
            id=request_id, 
            to_user=request.user, 
            status='pending'
        )
        
        friendship.status = 'accepted'
        friendship.save()
        
        serializer = FriendShipSerializer(friendship)
        return Response(serializer.data)
        
    except FriendShip.DoesNotExist:
        return Response({'error': 'Friend request not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_friend_request(request, request_id):
    """Reject a friend request"""
    try:
        friendship = FriendShip.objects.get(
            id=request_id, 
            to_user=request.user, 
            status='pending'
        )
        
        # Option 1: Mark as rejected (current approach)
        # friendship.status = 'rejected'
        # friendship.save()
        # return Response({'message': 'Friend request rejected'})
        
        # Option 2: Delete the request entirely (recommended)
        friendship.delete()
        return Response({'message': 'Friend request rejected'})
        
    except FriendShip.DoesNotExist:
        return Response({'error': 'Friend request not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_friend(request, user_id):
    """Remove a friend (unfriend)"""
    try:
        # Find the friendship between current user and the specified user
        friendship = FriendShip.objects.filter(
            Q(from_user=request.user, to_user_id=user_id) | 
            Q(from_user_id=user_id, to_user=request.user),
            status='accepted'
        ).first()
        
        if not friendship:
            return Response({'error': 'Friendship not found'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        # Delete the friendship
        friendship.delete()
        
        return Response({'message': 'Friend removed successfully'}, 
                       status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': 'An error occurred while removing friend'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_requests(request):
    """Get pending friend requests for the current user"""
    requests = FriendShip.objects.filter(
        to_user=request.user, 
        status='pending'
    )
    
    serializer = FriendShipSerializer(requests, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def friends_list(request):
    """Get all friends of the current user"""
    friendships = FriendShip.objects.filter(
        Q(from_user=request.user) | Q(to_user=request.user),
        status='accepted'
    )
    
    # Extract the friend users
    friends = []
    for friendship in friendships:
        if friendship.from_user == request.user:
            friends.append(friendship.to_user)
        else:
            friends.append(friendship.from_user)
    
    serializer = UserSerializer(friends, many=True)
    return Response(serializer.data)