import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Calendar,
  Receipt,
  AlertCircle,
  CheckSquare,
} from "lucide-react-native";
import {
  smartApprovalApi,
  PendingApproval,
} from "./MoneySharing/services/smartApprovalApi";

interface PendingApprovalsScreenProps {
  groupId: string;
  onClose: () => void;
}

const PendingApprovalsScreen: React.FC<PendingApprovalsScreenProps> = ({
  groupId,
  onClose,
}) => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const approvals = await smartApprovalApi.getPendingApprovals(groupId);
      setPendingApprovals(approvals);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch pending approvals");
      console.error("Error fetching pending approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, [groupId]);

  const handleApproveExpense = async (expenseId: string) => {
    setActionLoading(expenseId);
    try {
      await smartApprovalApi.approveExpense(groupId, expenseId);
      Alert.alert("Success", "Expense approved successfully!");
      await fetchPendingApprovals(); // Refresh list
    } catch (error) {
      Alert.alert("Error", "Failed to approve expense");
      console.error("Error approving expense:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectExpense = (expenseId: string) => {
    Alert.prompt(
      "Reject Expense",
      "Please provide a reason for rejection (optional):",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason) => {
            setActionLoading(expenseId);
            try {
              await smartApprovalApi.rejectExpense(groupId, expenseId, reason);
              Alert.alert("Success", "Expense rejected successfully!");
              await fetchPendingApprovals();
            } catch (error) {
              Alert.alert("Error", "Failed to reject expense");
              console.error("Error rejecting expense:", error);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleBatchApprove = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("No Selection", "Please select expenses to approve");
      return;
    }

    Alert.alert(
      "Batch Approve",
      `Are you sure you want to approve ${selectedItems.length} expenses?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve All",
          onPress: async () => {
            setActionLoading("batch");
            try {
              const result = await smartApprovalApi.batchApproveExpenses(
                groupId,
                selectedItems
              );
              Alert.alert(
                "Success",
                `${result.approved_count} expenses approved successfully!`
              );
              setSelectedItems([]);
              await fetchPendingApprovals();
            } catch (error) {
              Alert.alert("Error", "Failed to batch approve expenses");
              console.error("Error batch approving:", error);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const toggleSelection = (expenseId: string) => {
    setSelectedItems((prev) =>
      prev.includes(expenseId)
        ? prev.filter((id) => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return "#ef4444"; // High priority - red
    if (priority >= 1) return "#f59e0b"; // Medium priority - amber
    return "#10b981"; // Low priority - green
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (loading && pendingApprovals.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading pending approvals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <View style={styles.headerRight}>
          <Text style={styles.countBadge}>{pendingApprovals.length}</Text>
        </View>
      </View>

      {/* Batch Actions */}
      {selectedItems.length > 0 && (
        <View style={styles.batchActionsContainer}>
          <Text style={styles.selectedCount}>
            {selectedItems.length} selected
          </Text>
          <TouchableOpacity
            onPress={handleBatchApprove}
            style={styles.batchApproveButton}
            disabled={actionLoading === "batch"}
          >
            {actionLoading === "batch" ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <CheckSquare size={16} color="white" />
                <Text style={styles.batchApproveText}>Approve All</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Pending Approvals List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchPendingApprovals}
            colors={["#007bff"]}
            tintColor="#007bff"
          />
        }
      >
        {pendingApprovals.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color="#10b981" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              No expenses pending approval at the moment.
            </Text>
          </View>
        ) : (
          pendingApprovals.map((approval) => (
            <View key={approval.expense.id} style={styles.approvalCard}>
              {/* Priority Indicator */}
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor(approval.priority) },
                ]}
              />

              {/* Selection Checkbox */}
              <TouchableOpacity
                onPress={() => toggleSelection(approval.expense.id)}
                style={styles.selectionCheckbox}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedItems.includes(approval.expense.id) &&
                      styles.checkboxSelected,
                  ]}
                >
                  {selectedItems.includes(approval.expense.id) && (
                    <CheckSquare size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Expense Details */}
              <View style={styles.expenseDetails}>
                <View style={styles.expenseHeader}>
                  <Text style={styles.expenseTitle} numberOfLines={1}>
                    {approval.expense.title}
                  </Text>
                  <Text style={styles.expenseAmount}>
                    ${Number(approval.expense.total_amount).toFixed(2)}
                  </Text>
                </View>

                {approval.expense.description && (
                  <Text style={styles.expenseDescription} numberOfLines={2}>
                    {approval.expense.description}
                  </Text>
                )}

                <View style={styles.expenseMetadata}>
                  <View style={styles.metadataItem}>
                    <User size={14} color="#64748b" />
                    <Text style={styles.metadataText}>
                      {approval.expense.paid_by.username}
                    </Text>
                  </View>

                  <View style={styles.metadataItem}>
                    <Calendar size={14} color="#64748b" />
                    <Text style={styles.metadataText}>
                      {formatDate(approval.expense.created_at)}
                    </Text>
                  </View>

                  {approval.expense.has_receipt && (
                    <View style={styles.metadataItem}>
                      <Receipt size={14} color="#10b981" />
                      <Text style={[styles.metadataText, { color: "#10b981" }]}>
                        Has receipt
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleRejectExpense(approval.expense.id)}
                    style={styles.rejectButton}
                    disabled={actionLoading === approval.expense.id}
                  >
                    <XCircle size={16} color="#ef4444" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleApproveExpense(approval.expense.id)}
                    style={styles.approveButton}
                    disabled={actionLoading === approval.expense.id}
                  >
                    {actionLoading === approval.expense.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <CheckCircle size={16} color="white" />
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerLeft: {
    width: 60,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    color: "#007bff",
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  headerRight: {
    width: 60,
    alignItems: "flex-end",
  },
  countBadge: {
    backgroundColor: "#ef4444",
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    textAlign: "center",
  },

  // Batch Actions
  batchActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#eff6ff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  selectedCount: {
    fontSize: 14,
    color: "#1e40af",
    fontWeight: "500",
  },
  batchApproveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  batchApproveText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },

  // Approval Cards
  approvalCard: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: "hidden",
  },
  priorityIndicator: {
    width: 4,
  },
  selectionCheckbox: {
    padding: 16,
    justifyContent: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  expenseDetails: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  expenseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginRight: 12,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  expenseDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    lineHeight: 20,
  },
  expenseMetadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: "#64748b",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  rejectButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  approveButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default PendingApprovalsScreen;
