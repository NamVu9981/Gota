import { useState, useEffect, useCallback } from "react";

// Types
interface PendingApproval {
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

interface UserTrustLevel {
  trust_level: "new" | "trusted" | "co_admin";
  total_expenses_created: number;
  total_expenses_approved: number;
  rejection_count: number;
  auto_approve_limit: number;
  trust_score: number;
}

interface GroupApprovalSettings {
  auto_approve_limit: number;
  receipt_auto_approve_limit: number;
  batch_notifications: boolean;
  notification_time: string;
  auto_approve_recurring: boolean;
  require_receipt_above: number;
}

// API Service (you'll need to implement these API calls)
export const smartApprovalApi = {
  async getPendingApprovals(groupId: string): Promise<PendingApproval[]> {
    const response = await fetch(
      `/api/expenses/groups/${groupId}/pending-approvals/`,
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch pending approvals");
    }

    return response.json();
  },

  async getUserTrustLevel(groupId: string): Promise<UserTrustLevel> {
    const response = await fetch(
      `/api/expenses/groups/${groupId}/trust-level/`,
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch trust level");
    }

    return response.json();
  },

  async getApprovalSettings(groupId: string): Promise<GroupApprovalSettings> {
    const response = await fetch(
      `/api/expenses/groups/${groupId}/approval-settings/`,
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch approval settings");
    }

    return response.json();
  },

  async approveExpense(groupId: string, expenseId: string): Promise<void> {
    const response = await fetch(
      `/api/expenses/groups/${groupId}/expenses/${expenseId}/approve/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to approve expense");
    }
  },

  async rejectExpense(
    groupId: string,
    expenseId: string,
    reason?: string
  ): Promise<void> {
    const response = await fetch(
      `/api/expenses/groups/${groupId}/expenses/${expenseId}/reject/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to reject expense");
    }
  },

  async batchApprove(groupId: string, expenseIds: string[]): Promise<void> {
    const response = await fetch(
      `/api/expenses/groups/${groupId}/batch-approve/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expense_ids: expenseIds }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to batch approve expenses");
    }
  },

  async updateApprovalSettings(
    groupId: string,
    settings: Partial<GroupApprovalSettings>
  ): Promise<void> {
    const response = await fetch(
      `/api/expenses/groups/${groupId}/approval-settings/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update approval settings");
    }
  },
};

// Helper function to get auth token (implement based on your auth system)
async function getAuthToken(): Promise<string> {
  // Implementation depends on your auth system
  // Example: return await AsyncStorage.getItem('auth_token');
  return "your-auth-token";
}

// Main Hook
export const useSmartApproval = (groupId: string) => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(
    []
  );
  const [trustLevel, setTrustLevel] = useState<UserTrustLevel | null>(null);
  const [approvalSettings, setApprovalSettings] =
    useState<GroupApprovalSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingApprovals = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);
      const approvals = await smartApprovalApi.getPendingApprovals(groupId);
      setPendingApprovals(approvals);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch pending approvals"
      );
      console.error("Error fetching pending approvals:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const fetchTrustLevel = useCallback(async () => {
    if (!groupId) return;

    try {
      const trust = await smartApprovalApi.getUserTrustLevel(groupId);
      setTrustLevel(trust);
    } catch (err) {
      console.error("Error fetching trust level:", err);
      // Don't set error state for trust level as it's not critical
    }
  }, [groupId]);

  const fetchApprovalSettings = useCallback(async () => {
    if (!groupId) return;

    try {
      const settings = await smartApprovalApi.getApprovalSettings(groupId);
      setApprovalSettings(settings);
    } catch (err) {
      console.error("Error fetching approval settings:", err);
    }
  }, [groupId]);

  const approveExpense = useCallback(
    async (expenseId: string) => {
      try {
        setLoading(true);
        await smartApprovalApi.approveExpense(groupId, expenseId);
        await fetchPendingApprovals(); // Refresh the list
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [groupId, fetchPendingApprovals]
  );

  const rejectExpense = useCallback(
    async (expenseId: string, reason?: string) => {
      try {
        setLoading(true);
        await smartApprovalApi.rejectExpense(groupId, expenseId, reason);
        await fetchPendingApprovals(); // Refresh the list
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [groupId, fetchPendingApprovals]
  );

  const batchApprove = useCallback(
    async (expenseIds: string[]) => {
      try {
        setLoading(true);
        await smartApprovalApi.batchApprove(groupId, expenseIds);
        await fetchPendingApprovals(); // Refresh the list
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [groupId, fetchPendingApprovals]
  );

  const updateApprovalSettings = useCallback(
    async (settings: Partial<GroupApprovalSettings>) => {
      try {
        setLoading(true);
        await smartApprovalApi.updateApprovalSettings(groupId, settings);
        await fetchApprovalSettings(); // Refresh settings
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [groupId, fetchApprovalSettings]
  );

  // Initial fetch
  useEffect(() => {
    if (groupId) {
      fetchPendingApprovals();
      fetchTrustLevel();
      fetchApprovalSettings();
    }
  }, [groupId, fetchPendingApprovals, fetchTrustLevel, fetchApprovalSettings]);

  return {
    // Data
    pendingApprovals,
    trustLevel,
    approvalSettings,

    // State
    loading,
    error,

    // Actions
    fetchPendingApprovals,
    fetchTrustLevel,
    fetchApprovalSettings,
    approveExpense,
    rejectExpense,
    batchApprove,
    updateApprovalSettings,

    // Utilities
    refreshAll: useCallback(() => {
      fetchPendingApprovals();
      fetchTrustLevel();
      fetchApprovalSettings();
    }, [fetchPendingApprovals, fetchTrustLevel, fetchApprovalSettings]),
  };
};
