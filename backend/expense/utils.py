# expenses/utils.py - Group-specific utility functions
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.db.models import Sum, Count, Q, F
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from collections import defaultdict
from typing import List, Dict, Optional, Tuple
import logging
from .models import Expense, ExpenseParticipant

logger = logging.getLogger(__name__)
User = get_user_model()

# ===== GROUP MEMBER UTILITIES =====
# Import group utilities to avoid duplication
from groups.utils import (
    get_group_members, is_group_member, get_group_membership
)

def get_active_group_members(group):
    """Get all active members of a group - using groups.utils"""
    return get_group_members(group, include_inactive=False)

def validate_group_membership(group, user):
    """Validate that a user is an active member of a group - using groups.utils"""
    return is_group_member(group, user)

def validate_multiple_group_memberships(group, user_ids):
    """Validate that multiple users are active members of a group"""
    from groups.models import GroupMembership
    
    valid_member_ids = set(
        GroupMembership.objects.filter(
            group=group,
            user_id__in=user_ids,
            is_active=True
        ).values_list('user_id', flat=True)
    )
    
    invalid_ids = set(user_ids) - valid_member_ids
    return valid_member_ids, invalid_ids

# ===== EXPENSE CALCULATION UTILITIES =====

def calculate_equal_split(total_amount: Decimal, participant_count: int) -> List[Decimal]:
    """
    Calculate equal split amounts, handling rounding properly.
    Ensures the sum of all splits equals the total amount exactly.
    """
    if participant_count == 0:
        return []
    
    # Calculate base amount per person
    base_amount = (total_amount / participant_count).quantize(
        Decimal('0.01'), 
        rounding=ROUND_HALF_UP
    )
    
    # Create list of amounts
    amounts = [base_amount] * participant_count
    
    # Calculate total assigned and remainder
    total_assigned = base_amount * participant_count
    remainder = total_amount - total_assigned
    
    # Distribute remainder (usually just 1-2 cents) to first participants
    remainder_cents = int(remainder * 100)
    for i in range(abs(remainder_cents)):
        if remainder_cents > 0:
            amounts[i] += Decimal('0.01')
        else:
            amounts[i] -= Decimal('0.01')
    
    return amounts

def calculate_percentage_split(total_amount: Decimal, percentages: List[float]) -> List[Decimal]:
    """
    Calculate split based on percentages.
    Percentages should sum to 100.0
    """
    if abs(sum(percentages) - 100.0) > 0.01:
        raise ValueError("Percentages must sum to 100")
    
    amounts = []
    total_assigned = Decimal('0.00')
    
    # Calculate amounts for all but the last participant
    for i, percentage in enumerate(percentages[:-1]):
        amount = (total_amount * Decimal(str(percentage)) / 100).quantize(
            Decimal('0.01'),
            rounding=ROUND_HALF_UP
        )
        amounts.append(amount)
        total_assigned += amount
    
    # Last participant gets the remainder to ensure exact total
    last_amount = total_amount - total_assigned
    amounts.append(last_amount)
    
    return amounts

def calculate_custom_split(total_amount: Decimal, custom_amounts: List[Decimal]) -> List[Decimal]:
    """
    Validate and return custom split amounts.
    Must sum to total_amount exactly.
    """
    total_custom = sum(custom_amounts)
    if total_custom != total_amount:
        raise ValueError(f"Custom amounts sum to {total_custom}, but total is {total_amount}")
    
    return custom_amounts

# ===== EXPENSE CREATION UTILITIES =====

def create_group_expense(group, paid_by_user, expense_data, participant_user_ids=None, 
                        split_amounts=None, split_percentages=None):
    """
    Create an expense for a specific group with proper validation.
    Uses groups.utils for membership validation.
    
    Args:
        group: Group instance
        paid_by_user: User who paid for the expense
        expense_data: Dict containing expense fields (title, description, total_amount, etc.)
        participant_user_ids: List of user IDs to include (optional)
        split_amounts: List of custom amounts for custom split (optional)
        split_percentages: List of percentages for percentage split (optional)
    
    Returns:
        Created Expense instance
    """
    from .models import Expense, ExpenseParticipant
    
    # Validate that paid_by_user is a member of the group using groups.utils
    if not validate_group_membership(group, paid_by_user):
        raise ValueError("User must be an active member of the group to create expenses.")
    
    # If no specific participants provided, include all active group members
    if participant_user_ids is None:
        participant_memberships = get_active_group_members(group)
        participant_user_ids = [membership.user.id for membership in participant_memberships]
    
    # Validate all participants are group members
    valid_member_ids, invalid_ids = validate_multiple_group_memberships(group, participant_user_ids)
    if invalid_ids:
        raise ValueError(f"Users {invalid_ids} are not active members of this group.")
    
    # Convert to list to maintain order
    participant_user_ids = list(valid_member_ids)
    
    with transaction.atomic():
        # Create the expense
        expense = Expense.objects.create(
            group=group,
            paid_by=paid_by_user,
            **expense_data
        )
        
        # Calculate split amounts based on split type
        split_type = expense_data.get('split_type', 'equal')
        total_amount = expense_data['total_amount']
        
        if split_type == 'equal':
            amounts = calculate_equal_split(total_amount, len(participant_user_ids))
        elif split_type == 'percentage':
            if not split_percentages:
                raise ValueError("Percentage split requires split_percentages")
            amounts = calculate_percentage_split(total_amount, split_percentages)
        elif split_type == 'custom':
            if not split_amounts:
                raise ValueError("Custom split requires split_amounts")
            amounts = calculate_custom_split(total_amount, split_amounts)
        else:
            raise ValueError(f"Invalid split type: {split_type}")
        
        # Create participants
        participants = []
        for i, user_id in enumerate(participant_user_ids):
            # If this is the person who paid, they've already paid their share
            is_payer = str(user_id) == str(paid_by_user.id)
            amount_paid = amounts[i] if is_payer else Decimal('0.00')
            
            participant = ExpenseParticipant.objects.create(
                expense=expense,
                user_id=user_id,
                amount_owed=amounts[i],
                amount_paid=amount_paid,
                status='paid' if is_payer else 'pending'
            )
            participants.append(participant)
        
        # Update expense status
        expense.update_status()
        
        logger.info(f"Created expense {expense.id} for group {group.id} with {len(participants)} participants")
        
        return expense

# ===== BALANCE CALCULATION UTILITIES =====

def get_user_group_balance(group, user):
    """Get a user's total balance across all expenses in a group"""
    from django.db.models import Sum
    from decimal import Decimal
    
    user_data = ExpenseParticipant.objects.filter(
        expense__group=group,
        user=user,
        is_active=True
    ).aggregate(
        total_owed=Sum('amount_owed'),
        total_paid=Sum('amount_paid')
    )
    
    # 🔧 FIX: Handle None values from aggregate
    total_owed = user_data['total_owed'] or Decimal('0.00')
    total_paid = user_data['total_paid'] or Decimal('0.00')
    
    return total_paid - total_owed

def get_group_balances_matrix(group):
    """
    Get a matrix of who owes whom in the group.
    Uses groups.utils for member management.
    """
    # Get all active members using groups.utils
    members = get_active_group_members(group)
    balances = {}
    
    # Calculate balances for each member
    for member in members:
        user_balance = get_user_group_balance(group, member.user)
        balances[str(member.user.id)] = {
            'user': {
                'id': str(member.user.id),
                'username': member.user.username,
                'email': member.user.email,
            },
            'balance': user_balance,
            'status': 'settled' if user_balance == 0 else 'owed' if user_balance > 0 else 'owes'
        }
    
    return balances

def calculate_optimal_settlements(group):
    """
    Calculate the optimal way to settle debts within a group.
    Returns a list of settlements that minimize the number of transactions.
    """
    balances = get_group_balances_matrix(group)
    
    # Separate creditors (positive balance) and debtors (negative balance)
    creditors = []
    debtors = []
    
    for user_id, data in balances.items():
        balance = data['balance']
        if balance > 0:
            creditors.append({'user_id': user_id, 'amount': balance, 'user': data['user']})
        elif balance < 0:
            debtors.append({'user_id': user_id, 'amount': abs(balance), 'user': data['user']})
    
    # Calculate settlements
    settlements = []
    
    # Sort creditors and debtors by amount (descending)
    creditors.sort(key=lambda x: x['amount'], reverse=True)
    debtors.sort(key=lambda x: x['amount'], reverse=True)
    
    i, j = 0, 0
    while i < len(creditors) and j < len(debtors):
        creditor = creditors[i]
        debtor = debtors[j]
        
        # Calculate settlement amount
        settlement_amount = min(creditor['amount'], debtor['amount'])
        
        if settlement_amount > 0:
            settlements.append({
                'from_user': debtor['user'],
                'to_user': creditor['user'],
                'amount': settlement_amount
            })
            
            # Update balances
            creditor['amount'] -= settlement_amount
            debtor['amount'] -= settlement_amount
        
        # Move to next creditor or debtor
        if creditor['amount'] == 0:
            i += 1
        if debtor['amount'] == 0:
            j += 1
    
    return settlements

# ===== EXPENSE MANAGEMENT UTILITIES =====

# In expenses/utils.py - Fix the get_group_expense_summary function

def get_group_expense_summary(group, user=None):
    """Get comprehensive expense summary for a group, optionally for a specific user"""
    from .models import Expense, ExpenseParticipant
    from decimal import Decimal
    
    base_query = Expense.objects.filter(group=group, is_active=True)
    
    summary = {
        'total_expenses': base_query.count(),
        'total_amount': base_query.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00'),
        'pending_count': base_query.filter(status='pending').count(),
        'partial_count': base_query.filter(status='partial').count(),
        'settled_count': base_query.filter(status='settled').count(),
    }
    
    if user:
        # Get user-specific data
        user_balance = get_user_group_balance(group, user)
        summary['user_balance'] = user_balance
        
        # Get expenses user participated in
        user_expenses = base_query.filter(
            participants__user=user,
            participants__is_active=True
        ).distinct()
        
        summary['user_expense_count'] = user_expenses.count()
        
        user_participant_data = ExpenseParticipant.objects.filter(
            expense__group=group,
            user=user,
            is_active=True
        ).aggregate(
            total_owed=Sum('amount_owed'),
            total_paid=Sum('amount_paid')
        )
        
        # 🔧 FIX: Handle None values from aggregate
        summary['user_total_owed'] = user_participant_data['total_owed'] or Decimal('0.00')
        summary['user_total_paid'] = user_participant_data['total_paid'] or Decimal('0.00')
        
        # Count of expenses where user owes money
        summary['user_pending_count'] = ExpenseParticipant.objects.filter(
            expense__group=group,
            user=user,
            is_active=True,
            status='pending'
        ).count()
    
    return summary

def settle_expense_for_user(expense, user, amount=None):
    """Mark an expense as settled for a specific user"""
    from .models import ExpenseParticipant
    
    try:
        participant = ExpenseParticipant.objects.get(
            expense=expense,
            user=user,
            is_active=True
        )
        
        if amount is None:
            # Pay the full amount owed
            amount = participant.amount_owed - participant.amount_paid
        
        # Validate amount
        if amount <= 0:
            raise ValueError("Settlement amount must be positive")
        
        max_settable = participant.amount_owed - participant.amount_paid
        if amount > max_settable:
            raise ValueError(f"Cannot settle more than owed. Maximum: {max_settable}")
        
        participant.amount_paid += amount
        if participant.amount_paid >= participant.amount_owed:
            participant.status = 'paid'
        
        participant.save()
        expense.update_status()
        
        logger.info(f"Settled {amount} for user {user.id} on expense {expense.id}")
        
        return participant
        
    except ExpenseParticipant.DoesNotExist:
        raise ValueError("User is not a participant in this expense.")

def get_user_expenses_in_group(group, user, status_filter=None):
    """Get all expenses for a user in a specific group"""
    from .models import Expense
    
    query = Expense.objects.filter(
        group=group,
        participants__user=user,
        participants__is_active=True,
        is_active=True
    ).distinct().select_related('paid_by').prefetch_related('participants__user')
    
    if status_filter:
        query = query.filter(status=status_filter)
    
    return query.order_by('-created_at')

def get_group_recent_activity(group, limit=10):
    """Get recent expense activity for a group"""
    from .models import Expense
    
    return Expense.objects.filter(
        group=group,
        is_active=True
    ).select_related('paid_by').order_by('-created_at')[:limit]

# ===== VALIDATION UTILITIES =====

def validate_expense_data(expense_data, group=None):
    """Validate expense data before creation"""
    errors = {}
    
    # Required fields
    required_fields = ['title', 'total_amount']
    for field in required_fields:
        if field not in expense_data or not expense_data[field]:
            errors[field] = f"{field} is required"
    
    # Validate total_amount
    if 'total_amount' in expense_data:
        try:
            amount = Decimal(str(expense_data['total_amount']))
            if amount <= 0:
                errors['total_amount'] = "Amount must be positive"
        except (ValueError, TypeError):
            errors['total_amount'] = "Invalid amount format"
    
    # Validate split_type
    valid_split_types = ['equal', 'custom', 'percentage']
    split_type = expense_data.get('split_type', 'equal')
    if split_type not in valid_split_types:
        errors['split_type'] = f"Invalid split type. Must be one of: {valid_split_types}"
    
    # Validate currency
    if 'currency' in expense_data:
        currency = expense_data['currency']
        if len(currency) != 3:
            errors['currency'] = "Currency must be a 3-letter code (e.g., USD)"
    
    return errors

def can_user_modify_expense(expense, user):
    """Check if a user can modify an expense"""
    # Only the person who paid can modify the expense
    return expense.paid_by == user

def can_user_delete_expense(expense, user):
    """Check if a user can delete an expense"""
    # Only the person who paid can delete the expense
    # And only if no one else has paid anything yet
    if expense.paid_by != user:
        return False
    
    # Check if anyone else has made payments
    from .models import ExpenseParticipant
    other_payments = ExpenseParticipant.objects.filter(
        expense=expense,
        is_active=True,
        amount_paid__gt=0
    ).exclude(user=user).exists()
    
    return not other_payments

# ===== NOTIFICATION UTILITIES =====

def get_expense_notifications_for_user(user, group=None):
    """Get pending expense notifications for a user"""
    from .models import ExpenseParticipant
    
    query = ExpenseParticipant.objects.filter(
        user=user,
        is_active=True,
        status='pending',
        expense__is_active=True
    ).select_related('expense', 'expense__paid_by', 'expense__group')
    
    if group:
        query = query.filter(expense__group=group)
    
    return query.order_by('-expense__created_at')

def format_currency(amount, currency='USD'):
    """Format currency amount for display"""
    if currency == 'USD':
        return f"${amount:.2f}"
    else:
        return f"{amount:.2f} {currency}"

# ===== EXPORT UTILITIES =====

def export_group_expenses_data(group, start_date=None, end_date=None):
    """Export group expenses data for reporting"""
    from .models import Expense
    
    query = Expense.objects.filter(
        group=group,
        is_active=True
    ).select_related('paid_by').prefetch_related('participants__user')
    
    if start_date:
        query = query.filter(created_at__gte=start_date)
    if end_date:
        query = query.filter(created_at__lte=end_date)
    
    expenses_data = []
    for expense in query:
        expense_data = {
            'id': str(expense.id),
            'title': expense.title,
            'description': expense.description,
            'total_amount': expense.total_amount,
            'currency': expense.currency,
            'paid_by': expense.paid_by.username,
            'split_type': expense.split_type,
            'status': expense.status,
            'created_at': expense.created_at.isoformat(),
            'participants': []
        }
        
        for participant in expense.participants.filter(is_active=True):
            expense_data['participants'].append({
                'user': participant.user.username,
                'amount_owed': participant.amount_owed,
                'amount_paid': participant.amount_paid,
                'status': participant.status
            })
        
        expenses_data.append(expense_data)
    
    return expenses_data