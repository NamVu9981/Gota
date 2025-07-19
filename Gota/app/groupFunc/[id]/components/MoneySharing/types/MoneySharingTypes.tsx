export interface Expense {
  id: string;
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  paid_by: {
    id: string;
    username: string;
    email: string;
  };
  split_type: "equal" | "custom" | "percentage";
  status:
    | "pending_approval"
    | "auto_approved"
    | "approved"
    | "pending"
    | "partial"
    | "settled"
    | "rejected";
  participants: ExpenseParticipant[];
  participant_count: number;

  // Smart approval fields
  has_receipt: boolean;
  approved_by?: {
    id: string;
    username: string;
    email: string;
  };
  approved_at?: string;
  approval_type?:
    | "auto_amount"
    | "auto_trust"
    | "auto_receipt"
    | "manual"
    | "batch";
  rejection_reason?: string;

  created_at: string;
  updated_at: string;
}

export interface ExpenseParticipant {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  amount_owed: number;
  amount_paid: number;
  status: "pending" | "paid" | "settled";
}

// (Removed duplicate CreateExpenseRequest interface)

export interface GroupExpenseSummary {
  total_expenses: number;
  total_amount: number;
  pending_count: number;
  partial_count?: number;
  settled_count: number;
  user_balance?: number;
  user_expense_count?: number;
  user_total_owed?: number;
  user_total_paid?: number;

  // Smart approval specific fields
  pending_approvals?: number;
  auto_approved_count?: number;
  manually_approved_count?: number;
  auto_approval_rate?: number;
}

export interface UserGroupBalance {
  user_id: string;
  group_id: string;
  balance: number;
  status: "settled" | "owed" | "owes";
}

export interface SettleExpenseRequest {
  amount?: number;
}

// Add these to your existing MoneySharingTypes.ts

export interface CreateExpenseRequest {
  title: string;
  description?: string;
  total_amount: number;
  currency?: string;
  split_type?: "equal" | "custom" | "percentage";
  participant_ids?: string[];
  has_receipt?: boolean;
  receipt_image?: {
    uri: string;
    type?: string;
    name?: string;
  };
}

export interface SmartExpenseCreationResult {
  expense: Expense;
  approval_result: {
    auto_approve: boolean;
    reason: string;
    details: string;
  };
}

export interface UserTrustLevel {
  trust_level: "new" | "trusted" | "co_admin";
  total_expenses_created: number;
  total_expenses_approved: number;
  rejection_count: number;
  auto_approve_limit: number;
  trust_score: number;
}

export interface GroupApprovalSettings {
  auto_approve_limit: number;
  receipt_auto_approve_limit: number;
  batch_notifications: boolean;
  notification_time: string;
  auto_approve_recurring: boolean;
  require_receipt_above: number;
}

export interface PendingApproval {
  id: string;
  expense: {
    id: string;
    title: string;
    description?: string;
    total_amount: number;
    currency: string;
    has_receipt: boolean;
    paid_by: {
      id: string;
      username: string;
      email: string;
    };
    created_at: string;
  };
  priority: number;
  created_at: string;
}

export interface ExpenseSummary {
  total_expenses: number;
  total_amount: number;
  pending_count: number;
  partial_count: number;
  settled_count: number;
  user_balance?: number;
  user_expense_count?: number;
  user_total_owed?: number;
  user_total_paid?: number;
  // Smart approval specific fields
  pending_approvals?: number;
  auto_approved_count?: number;
  manually_approved_count?: number;
  auto_approval_rate?: number;
}

// Enhanced Expense type with smart approval fields
export interface Expense {
  id: string;
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  paid_by: {
    id: string;
    username: string;
    email: string;
  };
  split_type: "equal" | "custom" | "percentage";
  status:
    | "pending_approval"
    | "auto_approved"
    | "approved"
    | "pending"
    | "partial"
    | "settled"
    | "rejected";
  participants: ExpenseParticipant[];
  participant_count: number;

  // Smart approval fields
  has_receipt: boolean;
  approved_by?: {
    id: string;
    username: string;
    email: string;
  };
  approved_at?: string;
  approval_type?:
    | "auto_amount"
    | "auto_trust"
    | "auto_receipt"
    | "manual"
    | "batch";
  rejection_reason?: string;

  created_at: string;
  updated_at: string;
}

export interface ExpenseParticipant {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  amount_owed: number;
  amount_paid: number;
  status: "pending" | "paid" | "settled";
  balance: number;
  created_at: string;
}

export interface ExpenseParticipant {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  amount_owed: number;
  amount_paid: number;
  status: "pending" | "paid" | "settled";
  balance: number;
  created_at: string;
}
