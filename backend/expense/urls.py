# expenses/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Group expense endpoints
    path('groups/<uuid:group_id>/expenses/', views.group_expenses, name='group_expenses'),
    path('groups/<uuid:group_id>/expenses/<uuid:expense_id>/', views.expense_detail, name='expense_detail'),
    path('groups/<uuid:group_id>/expenses/<uuid:expense_id>/settle/', views.settle_expense, name='settle_expense'),
    
    # Group summary and balance endpoints
    path('groups/<uuid:group_id>/summary/', views.group_expense_summary, name='group_expense_summary'),
    path('groups/<uuid:group_id>/balance/', views.user_group_balance, name='user_group_balance'),
    
    # 🆕 Smart Approval System endpoints
    path('groups/<uuid:group_id>/pending-approvals/', views.pending_approvals, name='pending_approvals'),
    path('groups/<uuid:group_id>/expenses/<uuid:expense_id>/approve/', views.approve_expense, name='approve_expense'),
    path('groups/<uuid:group_id>/expenses/<uuid:expense_id>/reject/', views.reject_expense, name='reject_expense'),
    path('groups/<uuid:group_id>/batch-approve/', views.batch_approve_expenses, name='batch_approve_expenses'),
    
    # Group approval settings and trust levels
    path('groups/<uuid:group_id>/approval-settings/', views.approval_settings, name='approval_settings'),
    path('groups/<uuid:group_id>/my-trust-level/', views.user_trust_level, name='user_trust_level'),
]