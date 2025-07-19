# expenses/serializers.py - Updated with Smart Approval Serializers

from rest_framework import serializers
from django.contrib.auth import get_user_model
from groups.models import Group, GroupMembership
from .models import (
    Expense, ExpenseParticipant, GroupApprovalSettings, 
    GroupMemberTrust, ApprovalQueue
)
from .utils import create_group_expense
from decimal import Decimal

User = get_user_model()

# Existing serializers remain the same...
class ExpenseParticipantSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    balance = serializers.ReadOnlyField()
    
    class Meta:
        model = ExpenseParticipant
        fields = [
            'id', 'user', 'amount_owed', 'amount_paid', 
            'status', 'balance', 'created_at'
        ]
    
    def get_user(self, obj):
        return {
            'id': str(obj.user.id),
            'username': obj.user.username,
            'email': obj.user.email,
        }

class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = serializers.SerializerMethodField()
    participants = ExpenseParticipantSerializer(many=True, read_only=True)
    participant_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'description', 'total_amount', 'currency',
            'paid_by', 'split_type', 'status', 'participants',
            'participant_count', 'has_receipt', 'approved_by', 
            'approved_at', 'approval_type', 'rejection_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'approved_by', 'approved_at', 
            'approval_type', 'created_at', 'updated_at'
        ]
    
    def get_paid_by(self, obj):
        return {
            'id': str(obj.paid_by.id),
            'username': obj.paid_by.username,
            'email': obj.paid_by.email,
        }
    
    def get_participant_count(self, obj):
        return obj.participants.filter(is_active=True).count()

# 🆕 Smart Approval Serializers

class SmartCreateExpenseSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    currency = serializers.CharField(max_length=3, default='USD')
    split_type = serializers.ChoiceField(choices=Expense.SPLIT_TYPE_CHOICES, default='equal')
    participant_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="List of user IDs to include. If empty, includes all group members."
    )
    has_receipt = serializers.BooleanField(default=False)
    # receipt_image handled in view via request.FILES
    
    def validate_participant_ids(self, value):
        if not value:
            return value
            
        # Remove duplicates
        return list(set(value))
    
    def validate(self, data):
        group = self.context['group']
        request = self.context['request']
        participant_ids = data.get('participant_ids', [])
        
        # Validate that request user is a group member
        if not GroupMembership.objects.filter(
            group=group,
            user=request.user,
            is_active=True
        ).exists():
            raise serializers.ValidationError("You must be a group member to create expenses.")
        
        # If participant_ids provided, validate they are group members
        if participant_ids:
            valid_member_ids = set(
                GroupMembership.objects.filter(
                    group=group,
                    user_id__in=participant_ids,
                    is_active=True
                ).values_list('user_id', flat=True)
            )
            
            invalid_ids = set(participant_ids) - {str(uid) for uid in valid_member_ids}
            if invalid_ids:
                raise serializers.ValidationError(
                    f"Users {list(invalid_ids)} are not active members of this group."
                )
        
        return data

class GroupApprovalSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupApprovalSettings
        fields = [
            'auto_approve_limit', 'receipt_auto_approve_limit',
            'batch_notifications', 'notification_time',
            'auto_approve_recurring', 'require_receipt_above',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class GroupMemberTrustSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    trust_score = serializers.ReadOnlyField(source='calculate_trust_score')
    
    class Meta:
        model = GroupMemberTrust
        fields = [
            'user', 'trust_level', 'total_expenses_created',
            'total_expenses_approved', 'rejection_count',
            'auto_approve_limit', 'trust_score', 'created_at'
        ]
    
    def get_user(self, obj):
        return {
            'id': str(obj.user.id),
            'username': obj.user.username,
            'email': obj.user.email,
        }

class ApprovalQueueSerializer(serializers.ModelSerializer):
    expense = serializers.SerializerMethodField()
    
    class Meta:
        model = ApprovalQueue
        fields = ['expense', 'priority', 'created_at']
    
    def get_expense(self, obj):
        return {
            'id': str(obj.expense.id),
            'title': obj.expense.title,
            'description': obj.expense.description,
            'total_amount': obj.expense.total_amount,
            'currency': obj.expense.currency,
            'has_receipt': obj.expense.has_receipt,
            'paid_by': {
                'id': str(obj.expense.paid_by.id),
                'username': obj.expense.paid_by.username,
                'email': obj.expense.paid_by.email,
            },
            'created_at': obj.expense.created_at,
        }

class BatchApprovalSerializer(serializers.Serializer):
    expense_ids = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        help_text="List of expense IDs to approve"
    )

class RejectExpenseSerializer(serializers.Serializer):
    reason = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Reason for rejection"
    )

# Update existing serializers to handle approval status
class GroupExpenseSummarySerializer(serializers.Serializer):
    total_expenses = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_count = serializers.IntegerField()
    settled_count = serializers.IntegerField()
    user_balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    user_expense_count = serializers.IntegerField()
    user_total_owed = serializers.DecimalField(max_digits=10, decimal_places=2)
    user_total_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    # 🆕 Smart approval fields
    pending_approvals = serializers.IntegerField(default=0)
    auto_approved_count = serializers.IntegerField(default=0)
    manually_approved_count = serializers.IntegerField(default=0)
    auto_approval_rate = serializers.FloatField(default=0.0)

class CreateExpenseSerializer(serializers.Serializer):
    """Original expense creation serializer (for backward compatibility)"""
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    currency = serializers.CharField(max_length=3, default='USD')
    split_type = serializers.ChoiceField(choices=Expense.SPLIT_TYPE_CHOICES, default='equal')
    participant_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="List of user IDs to include. If empty, includes all group members."
    )
    
    def validate_participant_ids(self, value):
        if not value:
            return value
        return list(set(value))
    
    def validate(self, data):
        group = self.context['group']
        request = self.context['request']
        participant_ids = data.get('participant_ids', [])
        
        # Validate that request user is a group member
        if not GroupMembership.objects.filter(
            group=group,
            user=request.user,
            is_active=True
        ).exists():
            raise serializers.ValidationError("You must be a group member to create expenses.")
        
        # If participant_ids provided, validate they are group members
        if participant_ids:
            valid_member_ids = set(
                GroupMembership.objects.filter(
                    group=group,
                    user_id__in=participant_ids,
                    is_active=True
                ).values_list('user_id', flat=True)
            )
            
            invalid_ids = set(participant_ids) - {str(uid) for uid in valid_member_ids}
            if invalid_ids:
                raise serializers.ValidationError(
                    f"Users {list(invalid_ids)} are not active members of this group."
                )
        
        return data
    
    def create(self, validated_data):
        group = self.context['group']
        request = self.context['request']
        participant_ids = validated_data.pop('participant_ids', None)
        
        # Create expense using utility function
        expense = create_group_expense(
            group=group,
            paid_by_user=request.user,
            expense_data=validated_data,
            participant_user_ids=participant_ids
        )
        
        return expense