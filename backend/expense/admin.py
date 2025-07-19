from django.contrib import admin
from .models import Expense, ExpenseParticipant

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'group', 'paid_by', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'split_type', 'created_at', 'group']
    search_fields = ['title', 'description', 'paid_by__username', 'group__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'total_amount', 'currency')
        }),
        ('Group & Payment', {
            'fields': ('group', 'paid_by', 'split_type', 'status')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'is_active'),
            'classes': ('collapse',)
        })
    )

@admin.register(ExpenseParticipant)
class ExpenseParticipantAdmin(admin.ModelAdmin):
    list_display = ['user', 'expense', 'amount_owed', 'amount_paid', 'status']
    list_filter = ['status', 'expense__group', 'created_at']
    search_fields = ['user__username', 'expense__title']
    readonly_fields = ['id', 'balance', 'created_at', 'updated_at']