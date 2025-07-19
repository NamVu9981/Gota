# expenses/services/smart_approval_service.py

from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from ..models import Expense, GroupApprovalSettings, GroupMemberTrust, ApprovalQueue
from ..utils import create_group_expense
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class SmartApprovalService:
    """
    Smart approval system that automatically approves expenses based on:
    1. Amount thresholds
    2. User trust levels  
    3. Receipt availability
    4. Pattern recognition
    """
    
    def __init__(self, group):
        self.group = group
        self.settings = self._get_or_create_settings()
    
    def _get_or_create_settings(self):
        """Get or create approval settings for the group"""
        settings, created = GroupApprovalSettings.objects.get_or_create(
            group=self.group,
            defaults={
                'auto_approve_limit': Decimal('25.00'),
                'receipt_auto_approve_limit': Decimal('100.00'),
                'batch_notifications': True,
                'auto_approve_recurring': True,
                'require_receipt_above': Decimal('50.00'),
            }
        )
        return settings
    
    def create_expense_with_smart_approval(self, paid_by_user, expense_data, 
                                         participant_user_ids=None, has_receipt=False, 
                                         receipt_image=None):
        """
        Create expense and automatically determine if it needs approval
        """
        with transaction.atomic():
            # Create expense with pending_approval status initially
            expense_data['status'] = 'pending_approval'
            
            # Add receipt info
            if has_receipt:
                expense_data['has_receipt'] = True
                if receipt_image:
                    expense_data['receipt_image'] = receipt_image
            
            # Create the expense
            expense = create_group_expense(
                group=self.group,
                paid_by_user=paid_by_user,
                expense_data=expense_data,
                participant_user_ids=participant_user_ids
            )
            
            # Apply smart approval logic
            approval_result = self._evaluate_auto_approval(expense, paid_by_user)
            
            if approval_result['auto_approve']:
                self._auto_approve_expense(expense, approval_result['reason'])
                logger.info(f"Auto-approved expense {expense.id}: {approval_result['reason']}")
            else:
                self._queue_for_approval(expense, approval_result.get('priority', 0))
                logger.info(f"Queued expense {expense.id} for manual approval")
            
            return expense, approval_result
    
    def _evaluate_auto_approval(self, expense, creator):
        """
        Evaluate if expense should be auto-approved
        Returns: {'auto_approve': bool, 'reason': str, 'priority': int}
        """
        amount = expense.total_amount
        
        # Rule 1: Small amounts auto-approve
        if amount <= self.settings.auto_approve_limit:
            return {
                'auto_approve': True,
                'reason': f'auto_amount',
                'details': f'Amount ${amount} under limit ${self.settings.auto_approve_limit}'
            }
        
        # Rule 2: Trusted member limits
        trust = self._get_user_trust(creator)
        if trust and amount <= trust.auto_approve_limit:
            return {
                'auto_approve': True,
                'reason': 'auto_trust',
                'details': f'Trusted member {creator.username} under limit ${trust.auto_approve_limit}'
            }
        
        # Rule 3: Receipt + reasonable amount
        if (expense.has_receipt and 
            amount <= self.settings.receipt_auto_approve_limit):
            return {
                'auto_approve': True,
                'reason': 'auto_receipt',
                'details': f'Has receipt and amount ${amount} under receipt limit'
            }
        
        # Rule 4: Recurring expense pattern (future enhancement)
        if self.settings.auto_approve_recurring:
            if self._is_recurring_expense(expense, creator):
                return {
                    'auto_approve': True,
                    'reason': 'auto_recurring',
                    'details': 'Similar expense pattern previously approved'
                }
        
        # Needs manual approval - set priority
        priority = self._calculate_approval_priority(expense, creator)
        return {
            'auto_approve': False,
            'reason': 'manual_approval_required',
            'priority': priority,
            'details': f'Amount ${amount} requires manual approval'
        }
    
    def _get_user_trust(self, user):
        """Get or create user trust level in this group"""
        trust, created = GroupMemberTrust.objects.get_or_create(
            group=self.group,
            user=user,
            defaults={
                'trust_level': 'new',
                'auto_approve_limit': Decimal('0.00'),
            }
        )
        return trust
    
    def _is_recurring_expense(self, expense, creator):
        """Check if this is a recurring expense pattern"""
        # Look for similar expenses from same user in past 30 days
        similar_expenses = Expense.objects.filter(
            group=self.group,
            paid_by=creator,
            title__icontains=expense.title[:10],  # Similar title
            total_amount__range=(
                expense.total_amount * Decimal('0.8'),  # ±20% amount range
                expense.total_amount * Decimal('1.2')
            ),
            status__in=['auto_approved', 'approved', 'settled'],
            created_at__gte=timezone.now() - timezone.timedelta(days=30)
        ).exists()
        
        return similar_expenses
    
    def _calculate_approval_priority(self, expense, creator):
        """Calculate priority for manual approval queue"""
        priority = 0
        
        # Higher priority for larger amounts
        if expense.total_amount > 100:
            priority += 2
        if expense.total_amount > 200:
            priority += 3
        
        # Lower priority for trusted members
        trust = self._get_user_trust(creator)
        if trust.trust_level == 'trusted':
            priority -= 1
        elif trust.trust_level == 'new':
            priority += 1
        
        # Higher priority if no receipt for large amount
        if (expense.total_amount > self.settings.require_receipt_above and 
            not expense.has_receipt):
            priority += 2
        
        return max(0, priority)  # Don't go below 0
    
    def _auto_approve_expense(self, expense, reason):
        """Auto-approve an expense"""
        expense.status = 'auto_approved'
        expense.approved_by = None  # System approval
        expense.approved_at = timezone.now()
        expense.approval_type = reason
        expense.save()
        
        # Update user trust metrics
        self._update_user_trust_metrics(expense.paid_by, approved=True)
        
        # Set expense to active status
        expense.status = 'pending'  # Now active for payments
        expense.save()
    
    def _queue_for_approval(self, expense, priority=0):
        """Add expense to approval queue"""
        ApprovalQueue.objects.create(
            group=self.group,
            expense=expense,
            priority=priority
        )
        
        # Send notification (batch or instant based on settings)
        if not self.settings.batch_notifications:
            self._send_instant_approval_notification(expense)
    
    def _update_user_trust_metrics(self, user, approved=True):
        """Update user's trust metrics"""
        trust = self._get_user_trust(user)
        trust.total_expenses_created += 1
        
        if approved:
            trust.total_expenses_approved += 1
        else:
            trust.rejection_count += 1
            trust.last_rejection_date = timezone.now()
        
        trust.save()
        
        # Auto-update trust level based on new metrics
        trust.update_trust_level()
    
    def manually_approve_expense(self, expense, approver, batch_approval=False):
        """Manually approve an expense"""
        with transaction.atomic():
            expense.status = 'approved'
            expense.approved_by = approver
            expense.approved_at = timezone.now()
            expense.approval_type = 'batch' if batch_approval else 'manual'
            expense.save()
            
            # Remove from approval queue
            ApprovalQueue.objects.filter(expense=expense).delete()
            
            # Update trust metrics
            self._update_user_trust_metrics(expense.paid_by, approved=True)
            
            # Set to active status
            expense.status = 'pending'
            expense.save()
            
            logger.info(f"Manually approved expense {expense.id} by {approver.username}")
    
    def reject_expense(self, expense, approver, reason=""):
        """Reject an expense"""
        with transaction.atomic():
            expense.status = 'rejected'
            expense.approved_by = approver
            expense.approved_at = timezone.now()
            expense.rejection_reason = reason
            expense.save()
            
            # Remove from approval queue
            ApprovalQueue.objects.filter(expense=expense).delete()
            
            # Update trust metrics
            self._update_user_trust_metrics(expense.paid_by, approved=False)
            
            logger.info(f"Rejected expense {expense.id} by {approver.username}: {reason}")
    
    def get_pending_approvals(self, limit=50):
        """Get expenses pending approval, ordered by priority"""
        return ApprovalQueue.objects.filter(
            group=self.group
        ).select_related('expense', 'expense__paid_by')[:limit]
    
    def batch_approve_expenses(self, expense_ids, approver):
        """Batch approve multiple expenses"""
        approved_count = 0
        
        with transaction.atomic():
            for expense_id in expense_ids:
                try:
                    expense = Expense.objects.get(
                        id=expense_id,
                        group=self.group,
                        status='pending_approval'
                    )
                    self.manually_approve_expense(expense, approver, batch_approval=True)
                    approved_count += 1
                except Expense.DoesNotExist:
                    continue
        
        logger.info(f"Batch approved {approved_count} expenses by {approver.username}")
        return approved_count
    
    def _send_instant_approval_notification(self, expense):
        """Send instant notification for approval needed"""
        # This will be implemented in notification service
        pass
    
    def get_group_approval_stats(self):
        """Get approval statistics for the group"""
        total_expenses = Expense.objects.filter(group=self.group).count()
        auto_approved = Expense.objects.filter(
            group=self.group,
            status__in=['auto_approved']
        ).count()
        
        pending = ApprovalQueue.objects.filter(group=self.group).count()
        
        return {
            'total_expenses': total_expenses,
            'auto_approved_count': auto_approved,
            'auto_approval_rate': (auto_approved / total_expenses * 100) if total_expenses > 0 else 0,
            'pending_approvals': pending,
        }