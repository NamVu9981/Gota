// services/expenseApi.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL as API_BASE_URL } from "@/config/apiConfig";
import {
  Expense,
  CreateExpenseRequest,
  ExpenseParticipant,
  GroupExpenseSummary,
  UserGroupBalance,
  SettleExpenseRequest,
  SmartExpenseCreationResult,
} from "../types/MoneySharingTypes";

// Helper function to get auth token from AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("accessToken");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

class ExpenseApiService {
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

  // ===== EXPENSE MANAGEMENT =====

  /**
   * Get all expenses for a specific group
   */
  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/groups/${groupId}/expenses/`,
        {
          method: "GET",
          headers: await this.getHeaders(),
        }
      );

      return this.handleResponse<Expense[]>(response);
    } catch (error) {
      console.error("Error fetching group expenses:", error);
      throw error;
    }
  }

  /**
   * Create a new expense in a group
   */
  async createSmartExpense(
    groupId: string,
    expenseData: CreateExpenseRequest
  ): Promise<SmartExpenseCreationResult> {
    try {
      const formData = new FormData();

      // Add expense fields
      formData.append("title", expenseData.title);
      formData.append("total_amount", expenseData.total_amount.toString());
      formData.append("currency", expenseData.currency || "USD");
      formData.append("split_type", expenseData.split_type || "equal");
      formData.append(
        "has_receipt",
        expenseData.has_receipt ? "true" : "false"
      );

      if (expenseData.description) {
        formData.append("description", expenseData.description);
      }

      if (expenseData.participant_ids) {
        expenseData.participant_ids.forEach((id) => {
          formData.append("participant_ids", id);
        });
      }

      // Add receipt image if provided
      if (expenseData.receipt_image) {
        formData.append("receipt_image", {
          uri: expenseData.receipt_image.uri,
          type: expenseData.receipt_image.type || "image/jpeg",
          name: expenseData.receipt_image.name || "receipt.jpg",
        } as any);
      }

      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/groups/${groupId}/expenses/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData
          },
          body: formData,
        }
      );

      return this.handleResponse<SmartExpenseCreationResult>(response);
    } catch (error) {
      console.error("Error creating smart expense:", error);
      throw error;
    }
  }

  /**
   * Get details of a specific expense
   */
  async getExpenseDetails(
    groupId: string,
    expenseId: string
  ): Promise<Expense> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/groups/${groupId}/expenses/${expenseId}/`,
        {
          method: "GET",
          headers: await this.getHeaders(),
        }
      );

      return this.handleResponse<Expense>(response);
    } catch (error) {
      console.error("Error fetching expense details:", error);
      throw error;
    }
  }

  /**
   * Update an expense (only if user is the payer)
   */
  async updateExpense(
    groupId: string,
    expenseId: string,
    updateData: Partial<CreateExpenseRequest>
  ): Promise<Expense> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/groups/${groupId}/expenses/${expenseId}/`,
        {
          method: "PATCH",
          headers: await this.getHeaders(),
          body: JSON.stringify(updateData),
        }
      );

      return this.handleResponse<Expense>(response);
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  }

  /**
   * Delete an expense (only if user is the payer)
   */
  async deleteExpense(groupId: string, expenseId: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/groups/${groupId}/expenses/${expenseId}/`,
        {
          method: "DELETE",
          headers: await this.getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  // ===== EXPENSE SETTLEMENT =====

  /**
   * Mark an expense as settled for the current user
   */
  async settleExpense(
    groupId: string,
    expenseId: string
  ): Promise<{
    success: boolean;
    message: string;
    participant: ExpenseParticipant;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/groups/${groupId}/expenses/${expenseId}/settle/`,
        {
          method: "POST",
          headers: await this.getHeaders(),
        }
      );

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error settling expense:", error);
      throw error;
    }
  }

  // ===== BALANCE AND SUMMARY =====

  /**
   * Get expense summary for a group
   */
  async getGroupExpenseSummary(groupId: string): Promise<GroupExpenseSummary> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/groups/${groupId}/summary/`,
        {
          method: "GET",
          headers: await this.getHeaders(),
        }
      );

      return this.handleResponse<GroupExpenseSummary>(response);
    } catch (error) {
      console.error("Error fetching group expense summary:", error);
      throw error;
    }
  }

  /**
   * Get enhanced summary with smart approval stats
   */
  async getEnhancedExpenseSummary(
    groupId: string
  ): Promise<GroupExpenseSummary> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/groups/${groupId}/enhanced-summary/`,
        {
          method: "GET",
          headers: await this.getHeaders(),
        }
      );

      return this.handleResponse<GroupExpenseSummary>(response);
    } catch (error) {
      console.error("Error fetching enhanced expense summary:", error);
      // Fallback to regular summary if enhanced isn't available
      return this.getGroupExpenseSummary(groupId);
    }
  }

  /**
   * Get current user's balance in a specific group
   */
  async getUserGroupBalance(groupId: string): Promise<UserGroupBalance> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/groups/${groupId}/balance/`,
        {
          method: "GET",
          headers: await this.getHeaders(),
        }
      );

      return this.handleResponse<UserGroupBalance>(response);
    } catch (error) {
      console.error("Error fetching user group balance:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const expenseApi = new ExpenseApiService();
