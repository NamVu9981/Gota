import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // ExpenseCard styles
  expenseCard: {
    backgroundColor: "white",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  expenseTitle: {
    flex: 1,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  expenseDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  expenseInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  participantCount: {
    fontSize: 12,
    color: "#64748b",
  },
  userBalance: {},
  balanceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  positiveBalance: {
    color: "#10b981",
  },
  negativeBalance: {
    color: "#ef4444",
  },
  expenseDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  createdBy: {
    fontSize: 12,
    color: "#94a3b8",
  },

  // CreateExpenseModal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#007bff",
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
  },
  createButtonTextDisabled: {
    color: "#f8fafc",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "white",
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 18,
    fontWeight: "600",
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: "top",
  },
  splitPreview: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  splitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  splitDetails: {
    marginBottom: 16,
  },
  splitText: {
    fontSize: 14,
    color: "#64748b",
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  memberInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: {
    fontSize: 14,
    color: "#1e293b",
  },
  memberAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007bff",
  },
  moreMembers: {
    fontSize: 12,
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 4,
  },

  // ExpenseList styles
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  balanceCard: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceTitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addExpenseText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  expensesList: {
    flex: 1,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});
