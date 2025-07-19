# expenses/views.py - Your existing views updated with Smart Approval System

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from groups.models import Group, GroupMembership
from .models import Expense, ExpenseParticipant, GroupApprovalSettings, ApprovalQueue
from .serializers import (
    ExpenseSerializer, CreateExpenseSerializer, 
    GroupExpenseSummarySerializer, ExpenseParticipantSerializer,
    SmartCreateExpenseSerializer, ApprovalQueueSerializer,
    GroupApprovalSettingsSerializer, BatchApprovalSerializer,
    RejectExpenseSerializer
)
from .utils import get_group_expense_summary, settle_expense_for_user, get_user_group_balance
from .services.smart_approval_service import SmartApprovalService

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def group_expenses(request, group_id):
    """Get expenses for a group or create a new expense with smart approval"""
    
    # Get group and verify user is a member
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    if request.method == 'GET':
        # Get expenses for this group - filter based on user role
        if membership.role == 'owner':
            # Owners see all expenses including pending approval
            expenses = Expense.objects.filter(
                group=group,
                is_active=True
            ).select_related('paid_by').prefetch_related(
                'participants__user'
            ).order_by('-created_at')
        else:
            # Members only see approved/active expenses
            expenses = Expense.objects.filter(
                group=group,
                is_active=True,
                status__in=['auto_approved', 'approved', 'pending', 'partial', 'settled']
            ).select_related('paid_by').prefetch_related(
                'participants__user'
            ).order_by('-created_at')
        
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # 🆕 Create new expense with smart approval
        serializer = SmartCreateExpenseSerializer(
            data=request.data,
            context={'group': group, 'request': request}
        )
        
        if serializer.is_valid():
            # Use smart approval service
            approval_service = SmartApprovalService(group)
            
            expense_data = {
                'title': serializer.validated_data['title'],
                'description': serializer.validated_data.get('description', ''),
                'total_amount': serializer.validated_data['total_amount'],
                'currency': serializer.validated_data.get('currency', 'USD'),
                'split_type': serializer.validated_data.get('split_type', 'equal'),
            }
            
            # Handle receipt
            has_receipt = serializer.validated_data.get('has_receipt', False)
            receipt_image = request.FILES.get('receipt_image')
            
            expense, approval_result = approval_service.create_expense_with_smart_approval(
                paid_by_user=request.user,
                expense_data=expense_data,
                participant_user_ids=serializer.validated_data.get('participant_ids'),
                has_receipt=has_receipt,
                receipt_image=receipt_image
            )
            
            # Return the created expense with approval info
            response_serializer = ExpenseSerializer(expense)
            response_data = response_serializer.data
            response_data['approval_result'] = approval_result
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def expense_detail(request, group_id, expense_id):
    """Get, update, or delete a specific expense"""
    
    # Get group and expense
    group = get_object_or_404(Group, id=group_id, is_active=True)
    expense = get_object_or_404(
        Expense, 
        id=expense_id, 
        group=group, 
        is_active=True
    )
    
    # Verify user is a group member
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    if request.method == 'GET':
        # 🆕 Only show approved expenses to non-owners (unless they created it)
        if (expense.status == 'pending_approval' and 
            membership.role != 'owner' and 
            expense.paid_by != request.user):
            return Response(
                {'error': 'Expense not found or not accessible.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ExpenseSerializer(expense)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        # Only the person who paid can edit the expense
        if expense.paid_by != request.user:
            return Response(
                {'error': 'Only the person who paid can edit this expense.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 🆕 Check if expense can be edited based on status
        if expense.status not in ['pending_approval', 'pending']:
            return Response(
                {'error': 'Cannot edit expense in current status.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Allow updating title, description, total_amount
        allowed_fields = ['title', 'description', 'total_amount']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        if not update_data:
            return Response(
                {'error': 'No valid fields to update.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ExpenseSerializer(expense, data=update_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # 🆕 Re-run smart approval if it was pending approval
            if expense.status == 'pending_approval':
                approval_service = SmartApprovalService(group)
                approval_result = approval_service._evaluate_auto_approval(expense, request.user)
                
                if approval_result['auto_approve']:
                    approval_service._auto_approve_expense(expense, approval_result['reason'])
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Only the person who paid can delete the expense
        if expense.paid_by != request.user:
            return Response(
                {'error': 'Only the person who paid can delete this expense.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        expense.is_active = False
        expense.save()
        
        return Response({'message': 'Expense deleted successfully.'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def group_expense_summary(request, group_id):
    """Get expense summary for a group"""
    
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Verify user is a group member
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    summary = get_group_expense_summary(group, request.user)
    
    # 🆕 Add smart approval stats for owners
    if membership.role == 'owner':
        approval_service = SmartApprovalService(group)
        approval_stats = approval_service.get_group_approval_stats()
        summary.update(approval_stats)
    
    serializer = GroupExpenseSummarySerializer(summary)
    
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def settle_expense(request, group_id, expense_id):
    """Mark an expense as settled for the current user"""
    
    group = get_object_or_404(Group, id=group_id, is_active=True)
    expense = get_object_or_404(
        Expense, 
        id=expense_id, 
        group=group, 
        is_active=True
    )
    
    # Verify user is a group member
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    # 🆕 Only allow settlement of approved expenses
    if expense.status not in ['pending', 'partial']:
        return Response(
            {'error': 'Expense must be approved before settlement.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        participant = settle_expense_for_user(expense, request.user)
        serializer = ExpenseParticipantSerializer(participant)
        
        return Response({
            'success': True,
            'message': 'Expense marked as settled.',
            'participant': serializer.data
        })
        
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_group_balance(request, group_id):
    """Get current user's balance in a specific group"""
    
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Verify user is a group member
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    balance = get_user_group_balance(group, request.user)
    
    return Response({
        'user_id': str(request.user.id),
        'group_id': str(group.id),
        'balance': balance,
        'status': 'settled' if balance == 0 else 'owed' if balance > 0 else 'owes'
    })

# 🆕 NEW SMART APPROVAL ENDPOINTS

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pending_approvals(request, group_id):
    """Get expenses pending approval (owners only)"""
    
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Verify user is group owner
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    if membership.role != 'owner':
        return Response(
            {'error': 'Only group owners can view pending approvals.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    approval_service = SmartApprovalService(group)
    pending_queue = approval_service.get_pending_approvals()
    
    serializer = ApprovalQueueSerializer(pending_queue, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_expense(request, group_id, expense_id):
    """Approve a pending expense (owners only)"""
    
    group = get_object_or_404(Group, id=group_id, is_active=True)
    expense = get_object_or_404(
        Expense,
        id=expense_id,
        group=group,
        status='pending_approval'
    )
    
    # Verify user is group owner
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    if membership.role != 'owner':
        return Response(
            {'error': 'Only group owners can approve expenses.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Approve the expense
    approval_service = SmartApprovalService(group)
    approval_service.manually_approve_expense(expense, request.user)
    
    # Return updated expense
    serializer = ExpenseSerializer(expense)
    return Response({
        'success': True,
        'message': 'Expense approved successfully.',
        'expense': serializer.data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_expense(request, group_id, expense_id):
    """Reject a pending expense (owners only)"""
    
    group = get_object_or_404(Group, id=group_id, is_active=True)
    expense = get_object_or_404(
        Expense,
        id=expense_id,
        group=group,
        status='pending_approval'
    )
    
    # Verify user is group owner
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    if membership.role != 'owner':
        return Response(
            {'error': 'Only group owners can reject expenses.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get rejection reason
    serializer = RejectExpenseSerializer(data=request.data)
    if serializer.is_valid():
        reason = serializer.validated_data.get('reason', '')
        
        # Reject the expense
        approval_service = SmartApprovalService(group)
        approval_service.reject_expense(expense, request.user, reason)
        
        return Response({
            'success': True,
            'message': 'Expense rejected successfully.',
            'expense_id': str(expense.id)
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def batch_approve_expenses(request, group_id):
    """Batch approve multiple expenses (owners only)"""
    
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Verify user is group owner
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    if membership.role != 'owner':
        return Response(
            {'error': 'Only group owners can batch approve expenses.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = BatchApprovalSerializer(data=request.data)
    if serializer.is_valid():
        expense_ids = serializer.validated_data['expense_ids']
        
        # Batch approve expenses
        approval_service = SmartApprovalService(group)
        approved_count = approval_service.batch_approve_expenses(expense_ids, request.user)
        
        return Response({
            'success': True,
            'message': f'Successfully approved {approved_count} expenses.',
            'approved_count': approved_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def approval_settings(request, group_id):
    """Get or update group approval settings (owners only)"""
    
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Verify user is group owner
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    if membership.role != 'owner':
        return Response(
            {'error': 'Only group owners can manage approval settings.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    approval_service = SmartApprovalService(group)
    settings = approval_service.settings
    
    if request.method == 'GET':
        serializer = GroupApprovalSettingsSerializer(settings)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = GroupApprovalSettingsSerializer(
            settings, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_trust_level(request, group_id):
    """Get current user's trust level in the group"""
    
    group = get_object_or_404(Group, id=group_id, is_active=True)
    
    # Verify user is a group member
    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        is_active=True
    )
    
    approval_service = SmartApprovalService(group)
    trust = approval_service._get_user_trust(request.user)
    
    return Response({
        'user_id': str(request.user.id),
        'group_id': str(group.id),
        'trust_level': trust.trust_level,
        'auto_approve_limit': trust.auto_approve_limit,
        'total_expenses_created': trust.total_expenses_created,
        'total_expenses_approved': trust.total_expenses_approved,
        'approval_rate': (trust.total_expenses_approved / trust.total_expenses_created * 100) 
                       if trust.total_expenses_created > 0 else 0,
        'trust_score': trust.calculate_trust_score()
    })