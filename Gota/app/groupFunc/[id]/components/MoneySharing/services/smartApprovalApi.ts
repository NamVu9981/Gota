// services/smartApprovalApi.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL as API_BASE_URL } from "@/config/apiConfig";

// Helper function to get auth token from AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("accessToken");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Smart Approval Types
export interface ApprovalResult {
  auto_approve: boolean;
  reason: string;
  details: string;
}

export interface PendingApproval {
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

export interface ApprovalSettings {
  auto_approve_limit: number;
  receipt_auto_approve_limit: number;
  batch_notifications: boolean;
  notification_time: string;
  auto_approve_recurring: boolean;
  require_receipt_above: number;
}

export interface UserTrustLevel {
  user_id: string;
  group_id: string;
  trust_level: "new" | "trusted" | "co_admin";
  auto_approve_limit: number;
  total_expenses_created: number;
  total_expenses_approved: number;
  approval_rate: number;
  trust_score: number;
}

export interface ApprovalStats {
  total_expenses: number;
  auto_approved_count: number;
  auto_approval_rate: number;
  pending_approvals: number;
}

class SmartApprovalApiService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await getAuthToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }
    return response.json();
  }

  // ===== PENDING APPROVALS =====

  async getPendingApprovals(groupId: string): Promise<PendingApproval[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses/groups/${groupId}/pending-approvals/`,
        {
          method: "GET",
          headers: await this.getHeaders(),
        }
      );
      return this.handleResponse<PendingApproval[]>(response);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      throw error;
    }
  }

  async approveExpense(
    groupId: string,
    expenseId: string
  ): Promise<{
    success: boolean;
    message: string;
    expense: any;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses/groups/${groupId}/expenses/${expenseId}/approve/`,
        {
          method: "POST",
          headers: await this.getHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error approving expense:", error);
      throw error;
    }
  }

  async rejectExpense(
    groupId: string,
    expenseId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    expense_id: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses/groups/${groupId}/expenses/${expenseId}/reject/`,
        {
          method: "POST",
          headers: await this.getHeaders(),
          body: JSON.stringify({ reason: reason || "" }),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error rejecting expense:", error);
      throw error;
    }
  }

  async batchApproveExpenses(
    groupId: string,
    expenseIds: string[]
  ): Promise<{
    success: boolean;
    message: string;
    approved_count: number;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses/groups/${groupId}/batch-approve/`,
        {
          method: "POST",
          headers: await this.getHeaders(),
          body: JSON.stringify({ expense_ids: expenseIds }),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error batch approving expenses:", error);
      throw error;
    }
  }

  // ===== APPROVAL SETTINGS =====

  async getApprovalSettings(groupId: string): Promise<ApprovalSettings> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses/groups/${groupId}/approval-settings/`,
        {
          method: "GET",
          headers: await this.getHeaders(),
        }
      );
      return this.handleResponse<ApprovalSettings>(response);
    } catch (error) {
      console.error("Error fetching approval settings:", error);
      throw error;
    }
  }

  async updateApprovalSettings(
    groupId: string,
    settings: Partial<ApprovalSettings>
  ): Promise<ApprovalSettings> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses/groups/${groupId}/approval-settings/`,
        {
          method: "PATCH",
          headers: await this.getHeaders(),
          body: JSON.stringify(settings),
        }
      );
      return this.handleResponse<ApprovalSettings>(response);
    } catch (error) {
      console.error("Error updating approval settings:", error);
      throw error;
    }
  }

  // ===== USER TRUST LEVEL =====

  async getUserTrustLevel(groupId: string): Promise<UserTrustLevel> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses/groups/${groupId}/my-trust-level/`,
        {
          method: "GET",
          headers: await this.getHeaders(),
        }
      );
      return this.handleResponse<UserTrustLevel>(response);
    } catch (error) {
      console.error("Error fetching user trust level:", error);
      throw error;
    }
  }

  // ===== CREATE EXPENSE WITH SMART APPROVAL =====

  async createSmartExpense(
    groupId: string,
    expenseData: {
      title: string;
      description?: string;
      total_amount: number;
      currency?: string;
      split_type?: string;
      participant_ids?: string[];
      has_receipt?: boolean;
    },
    receiptImage?: any
  ): Promise<{
    expense: any;
    approval_result: ApprovalResult;
  }> {
    try {
      const formData = new FormData();

      // Add expense data
      Object.entries(expenseData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Add receipt image if provided
      if (receiptImage) {
        formData.append("receipt_image", receiptImage);
      }

      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/expenses/groups/${groupId}/expenses/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData - let browser set it
          },
          body: formData,
        }
      );

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error creating smart expense:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const smartApprovalApi = new SmartApprovalApiService();
