import { useState, useEffect, useCallback } from "react";
import {
  Expense,
  CreateExpenseRequest,
  GroupExpenseSummary,
  UserGroupBalance,
  SmartExpenseCreationResult,
} from "../types/MoneySharingTypes";
import { expenseApi } from "../services/expenseApi";

export interface UseExpensesResult {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  summary: GroupExpenseSummary | null;
  userBalance: UserGroupBalance | null;
  refreshExpenses: () => Promise<void>;
  createExpense: (
    expenseData: CreateExpenseRequest
  ) => Promise<SmartExpenseCreationResult>;
  settleExpense: (expenseId: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
}

export const useExpenses = (groupId: string): UseExpensesResult => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<GroupExpenseSummary | null>(null);
  const [userBalance, setUserBalance] = useState<UserGroupBalance | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!groupId) {
      console.log("No groupId provided, skipping fetch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [expensesData, summaryData, balanceData] = await Promise.all([
        expenseApi.getGroupExpenses(groupId),
        expenseApi.getGroupExpenseSummary(groupId),
        expenseApi.getUserGroupBalance(groupId),
      ]);

      setExpenses(expensesData);
      setSummary(summaryData);
      setUserBalance(balanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const createExpense = useCallback(
    async (
      expenseData: CreateExpenseRequest
    ): Promise<SmartExpenseCreationResult> => {
      try {
        setError(null);

        // Use smart expense creation directly
        const result = await expenseApi.createSmartExpense(
          groupId,
          expenseData
        );

        // Add to local state immediately for optimistic UI
        setExpenses((prev) => [result.expense, ...prev]);

        // Refresh data to get updated balances
        await fetchExpenses();

        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create expense"
        );
        throw err;
      }
    },
    [groupId, fetchExpenses]
  );

  const settleExpense = useCallback(
    async (expenseId: string): Promise<void> => {
      try {
        setError(null);
        await expenseApi.settleExpense(groupId, expenseId);

        // Refresh expenses to get updated status
        await fetchExpenses();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to settle expense"
        );
        throw err;
      }
    },
    [groupId, fetchExpenses]
  );

  const deleteExpense = useCallback(
    async (expenseId: string): Promise<void> => {
      try {
        setError(null);
        await expenseApi.deleteExpense(groupId, expenseId);

        // Remove from local state immediately
        setExpenses((prev) =>
          prev.filter((expense) => expense.id !== expenseId)
        );

        // Refresh data to get updated balances
        await fetchExpenses();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete expense"
        );
        throw err;
      }
    },
    [groupId, fetchExpenses]
  );

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    summary,
    userBalance,
    refreshExpenses: fetchExpenses,
    createExpense,
    settleExpense,
    deleteExpense,
  };
};
