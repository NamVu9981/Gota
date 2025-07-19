# expenses/models.py - Updated with Smart Approval System

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid

User = get_user_model()

class Expense(models.Model):
    SPLIT_TYPE_CHOICES = [
        ('equal', 'Equal Split'),
        ('custom', 'Custom Split'),
        ('percentage', 'Percentage Split'),
    ]
    
    STATUS_CHOICES = [
        ('pending_approval', 'Pending Approval'),
        ('auto_approved', 'Auto Approved'),
        ('approved', 'Manually Approved'),
        ('pending', 'Active - Pending Payment'),
        ('partial', 'Partially Paid'),
        ('settled', 'Settled'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='USD')
    
    # Group relationship
    group = models.ForeignKey(
        'groups.Group', 
        on_delete=models.CASCADE, 
        related_name='expenses'
    )
    
    # Who paid for this expense
    paid_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='paid_expenses'
    )
    
    split_type = models.CharField(max_length=20, choices=SPLIT_TYPE_CHOICES, default='equal')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_approval')
    
    # 🆕 Smart Approval Fields
    has_receipt = models.BooleanField(default=False)
    receipt_image = models.ImageField(upload_to='receipts/', blank=True, null=True)
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_expenses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_type = models.CharField(
        max_length=20,
        choices=[
            ('auto_amount', 'Auto-approved (Small Amount)'),
            ('auto_trust', 'Auto-approved (Trusted Member)'),
            ('auto_receipt', 'Auto-approved (Has Receipt)'),
            ('manual', 'Manually Approved'),
            ('batch', 'Batch Approved'),
        ],
        null=True,
        blank=True
    )
    rejection_reason = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['group', '-created_at']),
            models.Index(fields=['group', 'status']),
            models.Index(fields=['paid_by', '-created_at']),
            models.Index(fields=['status', 'created_at']),  # For pending approvals
        ]
    
    def __str__(self):
        return f"{self.title} - ${self.total_amount} ({self.group.name})"
    
    def is_approved(self):
        """Check if expense is approved and active"""
        return self.status in ['auto_approved', 'approved', 'pending', 'partial', 'settled']
    
    def needs_approval(self):
        """Check if expense needs approval"""
        return self.status == 'pending_approval'
    
    def update_status(self):
        """
        Update expense status based on approval state and payment progress.
        This is called after expense creation and when payments are made.
        """
        # Don't change status for rejected expenses
        if self.status == 'rejected':
            return
        
        # Handle approval-to-payment transition
        if self.status in ['auto_approved', 'approved']:
            # Move approved expenses to payment tracking
            self._transition_to_payment_tracking()
        
        # Handle payment status updates for active expenses
        elif self.status in ['pending', 'partial']:
            self._update_payment_status()

    def _transition_to_payment_tracking(self):
        """Transition from approved state to payment tracking"""
        # Check if participants exist (they should after create_group_expense)
        if not self.participants.exists():
            # If no participants yet, stay in current approval status
            return
        
        # Move to payment tracking
        self.status = 'pending'
        self.save(update_fields=['status', 'updated_at'])

    def _update_payment_status(self):
        """Update status based on current payment state"""
        participants = self.participants.filter(is_active=True)
        
        if not participants.exists():
            return
        
        # Calculate payment totals
        total_owed = sum(p.amount_owed for p in participants)
        total_paid = sum(p.amount_paid for p in participants)
        
        # Determine new status
        if total_paid >= total_owed:
            new_status = 'settled'
        elif total_paid > 0:
            new_status = 'partial'  
        else:
            new_status = 'pending'
        
        # Only save if status changed
        if self.status != new_status:
            self.status = new_status
            self.save(update_fields=['status', 'updated_at'])

    def refresh_status(self):
        """Force recalculate status - useful for manual corrections"""
        old_status = self.status
        
        # Reset to appropriate state and recalculate
        if self.status in ['pending', 'partial', 'settled']:
            self._update_payment_status()
        
        return old_status != self.status

class GroupApprovalSettings(models.Model):
    """Smart approval settings for each group"""
    group = models.OneToOneField(
        'groups.Group',
        on_delete=models.CASCADE,
        related_name='approval_settings'
    )
    
    # Threshold settings
    auto_approve_limit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('25.00'),
        help_text="Auto-approve expenses under this amount"
    )
    receipt_auto_approve_limit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('100.00'),
        help_text="Auto-approve expenses with receipts under this amount"
    )
    
    # Notification settings
    batch_notifications = models.BooleanField(
        default=True,
        help_text="Send daily digest instead of instant notifications"
    )
    notification_time = models.TimeField(
        default=timezone.now().time().replace(hour=18, minute=0),
        help_text="Time to send daily digest"
    )
    
    # Auto-approval rules
    auto_approve_recurring = models.BooleanField(
        default=True,
        help_text="Auto-approve similar recurring expenses"
    )
    require_receipt_above = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('50.00'),
        null=True,
        blank=True,
        help_text="Require receipt for expenses above this amount"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Approval Settings - {self.group.name}"

class ExpenseParticipant(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('settled', 'Settled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    expense = models.ForeignKey(
        Expense, 
        on_delete=models.CASCADE, 
        related_name='participants'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='expense_participations'
    )
    
    amount_owed = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    amount_paid = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['expense', 'user']
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['expense', 'user']),
            models.Index(fields=['user', 'status']),
        ]
    
    @property
    def balance(self):
        """Returns the balance for this participant (negative = owes money)"""
        return self.amount_paid - self.amount_owed

# 🆕 Trust Level System
class GroupMemberTrust(models.Model):
    """Track trust levels for group members"""
    TRUST_LEVELS = [
        ('new', 'New Member'),           # 0-2 approved expenses
        ('trusted', 'Trusted Member'),   # 3+ approved expenses, good history
        ('co_admin', 'Co-Admin'),        # Designated by owner
    ]
    
    group = models.ForeignKey('groups.Group', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    trust_level = models.CharField(max_length=20, choices=TRUST_LEVELS, default='new')
    
    # Trust metrics
    total_expenses_created = models.IntegerField(default=0)
    total_expenses_approved = models.IntegerField(default=0)
    rejection_count = models.IntegerField(default=0)
    last_rejection_date = models.DateTimeField(null=True, blank=True)
    
    # Trust limits based on level
    auto_approve_limit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['group', 'user']
        indexes = [
            models.Index(fields=['group', 'trust_level']),
            models.Index(fields=['user', 'trust_level']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.trust_level} in {self.group.name}"
    
    def calculate_trust_score(self):
        """Calculate trust score based on history"""
        if self.total_expenses_created == 0:
            return 0.0
        
        approval_rate = self.total_expenses_approved / self.total_expenses_created
        rejection_penalty = min(self.rejection_count * 0.1, 0.3)  # Max 30% penalty
        
        return max(0.0, approval_rate - rejection_penalty)
    
    def update_trust_level(self):
        """Auto-update trust level based on metrics"""
        trust_score = self.calculate_trust_score()
        
        if (self.total_expenses_approved >= 10 and 
            trust_score >= 0.9 and 
            self.rejection_count <= 1):
            self.trust_level = 'trusted'
            self.auto_approve_limit = Decimal('75.00')
        elif (self.total_expenses_approved >= 3 and 
              trust_score >= 0.8):
            self.trust_level = 'trusted'
            self.auto_approve_limit = Decimal('50.00')
        else:
            self.trust_level = 'new'
            self.auto_approve_limit = Decimal('0.00')
        
        self.save()

# 🆕 Approval Queue for batch processing
class ApprovalQueue(models.Model):
    """Queue for batch approval processing"""
    group = models.ForeignKey('groups.Group', on_delete=models.CASCADE)
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE)
    priority = models.IntegerField(default=0)  # Higher = more urgent
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-priority', 'created_at']
        indexes = [
            models.Index(fields=['group', '-priority', 'created_at']),
        ]