// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   Dimensions,
//   Alert,
//   RefreshControl,
//   ActivityIndicator,
// } from "react-native";
// import { Plus, Receipt, DollarSign, AlertCircle } from "lucide-react-native";
// import { Expense, CreateExpenseRequest } from "./types/MoneySharingTypes";
// import { GroupDetails } from "../../types/group.types";
// import ExpenseCard from "./ExpenseCard";
// import CreateExpenseModal from "./CreateExpenseModal";
// import { useExpenses } from "./hooks/useExpense";

// interface ExpenseListProps {
//   group: GroupDetails;
//   currentUserId: string;
// }

// const { height: screenHeight } = Dimensions.get("window");

// const ExpenseList: React.FC<ExpenseListProps> = ({ group, currentUserId }) => {
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const groupId = group?.id;

//   // 🔥 Use real API hook instead of mock data
//   const {
//     expenses,
//     loading,
//     error,
//     summary,
//     userBalance,
//     refreshExpenses,
//     createExpense,
//     settleExpense,
//     deleteExpense,
//   } = useExpenses(groupId || "");

//   // Update this function in your ExpenseList component:

//   if (!group || !groupId) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007bff" />
//         <Text style={styles.loadingText}>Loading group data...</Text>
//       </View>
//     );
//   }

//   const handleCreateExpense = async (expenseData: CreateExpenseRequest) => {
//     try {
//       const result = await createExpense(expenseData);
//       setShowCreateModal(false);

//       // Show smart approval feedback
//       if (result.approval_result.auto_approve) {
//         Alert.alert(
//           "✅ Expense Auto-Approved!",
//           `Your expense was automatically approved because: ${result.approval_result.reason}\n\nThe expense is now active and ready for settlement.`,
//           [{ text: "Great!" }]
//         );
//       } else {
//         Alert.alert(
//           "⏳ Submitted for Approval",
//           "Your expense has been submitted and is waiting for approval from the group owner. You'll be notified once it's reviewed.",
//           [{ text: "Got it" }]
//         );
//       }
//     } catch (error) {
//       Alert.alert(
//         "Error",
//         error instanceof Error ? error.message : "Failed to create expense"
//       );
//       throw error; // Re-throw so CreateExpenseModal can handle loading state
//     }
//   };

//   const handleExpensePress = (expense: Expense) => {
//     // 🔧 FIX: Convert total_amount to number before calling toFixed
//     const totalAmount = Number(expense.total_amount || 0);

//     Alert.alert(
//       expense.title,
//       `Total: $${totalAmount.toFixed(2)}\nStatus: ${expense.status}\nPaid by: ${
//         expense.paid_by.username
//       }`,
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "Settle",
//           onPress: () => handleSettleExpense(expense.id),
//         },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: () => handleDeleteExpense(expense.id),
//         },
//       ]
//     );
//   };

//   const handleSettleExpense = async (expenseId: string) => {
//     try {
//       await settleExpense(expenseId);
//       Alert.alert("Success", "Expense settled successfully!");
//     } catch (error) {
//       Alert.alert(
//         "Error",
//         error instanceof Error ? error.message : "Failed to settle expense"
//       );
//     }
//   };

//   const handleDeleteExpense = async (expenseId: string) => {
//     Alert.alert(
//       "Delete Expense",
//       "Are you sure you want to delete this expense? This action cannot be undone.",
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await deleteExpense(expenseId);
//               Alert.alert("Success", "Expense deleted successfully!");
//             } catch (error) {
//               Alert.alert(
//                 "Error",
//                 error instanceof Error
//                   ? error.message
//                   : "Failed to delete expense"
//               );
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleRefresh = async () => {
//     try {
//       await refreshExpenses();
//     } catch (error) {
//       Alert.alert("Error", "Failed to refresh expenses. Please try again.");
//     }
//   };

//   // Calculate balance from API data or fallback to local calculation
//   const groupBalance = userBalance?.balance ?? 0;

//   // Show loading state on initial load
//   if (loading && expenses.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007bff" />
//         <Text style={styles.loadingText}>Loading expenses...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Error Banner */}
//       {error && (
//         <View style={styles.errorBanner}>
//           <AlertCircle size={16} color="#ef4444" />
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity onPress={handleRefresh}>
//             <Text style={styles.retryText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Header with Balance */}
//       <View style={styles.balanceCard}>
//         <Text style={styles.balanceTitle}>Your Balance</Text>
//         <Text
//           style={[
//             styles.balanceAmount,
//             groupBalance > 0
//               ? styles.positiveBalance
//               : groupBalance < 0
//               ? styles.negativeBalance
//               : styles.neutralBalance,
//           ]}
//         >
//           {groupBalance === 0
//             ? "Settled up"
//             : groupBalance > 0
//             ? `+$${groupBalance.toFixed(2)}`
//             : `-$${Math.abs(groupBalance).toFixed(2)}`}
//         </Text>
//         <Text style={styles.balanceSubtitle}>
//           {groupBalance === 0
//             ? "You're all caught up!"
//             : groupBalance > 0
//             ? "You are owed"
//             : "You owe"}
//         </Text>

//         {/* Summary Stats */}
//         {summary && (
//           <View style={styles.summaryStats}>
//             <View style={styles.statItem}>
//               <Text style={styles.statNumber}>{summary.total_expenses}</Text>
//               <Text style={styles.statLabel}>Total Expenses</Text>
//             </View>
//             <View style={styles.statItem}>
//               <Text style={styles.statNumber}>{summary.pending_count}</Text>
//               <Text style={styles.statLabel}>Pending</Text>
//             </View>
//             <View style={styles.statItem}>
//               <Text style={styles.statNumber}>{summary.settled_count}</Text>
//               <Text style={styles.statLabel}>Settled</Text>
//             </View>
//           </View>
//         )}
//       </View>

//       {/* Add Expense Button */}
//       <TouchableOpacity
//         style={styles.addExpenseButton}
//         onPress={() => setShowCreateModal(true)}
//         disabled={loading}
//       >
//         <Plus size={20} color="white" />
//         <Text style={styles.addExpenseText}>
//           {loading ? "Loading..." : "Add Expense"}
//         </Text>
//       </TouchableOpacity>

//       {/* Expenses List */}
//       <View style={styles.expensesContainer}>
//         <View style={styles.listHeader}>
//           <Receipt size={20} color="#1e293b" />
//           <Text style={styles.listTitle}>Recent Expenses</Text>
//           {loading && <ActivityIndicator size="small" color="#007bff" />}
//         </View>

//         {expenses.length > 0 ? (
//           <ScrollView
//             style={styles.scrollableExpensesList}
//             showsVerticalScrollIndicator={true}
//             nestedScrollEnabled={true}
//             refreshControl={
//               <RefreshControl
//                 refreshing={loading}
//                 onRefresh={handleRefresh}
//                 colors={["#007bff"]}
//                 tintColor="#007bff"
//               />
//             }
//           >
//             {expenses.map((expense) => (
//               <ExpenseCard
//                 key={expense.id}
//                 expense={expense}
//                 currentUserId={currentUserId}
//                 onPress={() => handleExpensePress(expense)}
//               />
//             ))}
//           </ScrollView>
//         ) : (
//           <View style={styles.emptyState}>
//             <DollarSign size={48} color="#94a3b8" />
//             <Text style={styles.emptyTitle}>No expenses yet</Text>
//             <Text style={styles.emptySubtitle}>
//               Add your first shared expense to get started
//             </Text>
//             <TouchableOpacity
//               style={styles.emptyStateButton}
//               onPress={() => setShowCreateModal(true)}
//             >
//               <Plus size={16} color="#007bff" />
//               <Text style={styles.emptyStateButtonText}>Add Expense</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>

//       {/* Create Expense Modal */}
//       <CreateExpenseModal
//         visible={showCreateModal}
//         onClose={() => setShowCreateModal(false)}
//         group={group}
//         onCreateExpense={handleCreateExpense}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#f8fafc",
//     marginBottom: 20,
//   },

//   // Loading State
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: "#64748b",
//   },

//   // Error Banner
//   errorBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fef2f2",
//     borderColor: "#fecaca",
//     borderWidth: 1,
//     marginHorizontal: 20,
//     marginBottom: 16,
//     padding: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   errorText: {
//     flex: 1,
//     fontSize: 14,
//     color: "#dc2626",
//   },
//   retryText: {
//     fontSize: 14,
//     color: "#007bff",
//     fontWeight: "600",
//   },

//   // Balance Card
//   balanceCard: {
//     backgroundColor: "white",
//     margin: 20,
//     padding: 20,
//     borderRadius: 16,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   balanceTitle: {
//     fontSize: 14,
//     color: "#64748b",
//     marginBottom: 8,
//   },
//   balanceAmount: {
//     fontSize: 32,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   positiveBalance: {
//     color: "#10b981",
//   },
//   negativeBalance: {
//     color: "#ef4444",
//   },
//   neutralBalance: {
//     color: "#64748b",
//   },
//   balanceSubtitle: {
//     fontSize: 14,
//     color: "#64748b",
//     marginBottom: 16,
//   },

//   // Summary Stats
//   summaryStats: {
//     flexDirection: "row",
//     width: "100%",
//     justifyContent: "space-around",
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: "#f1f5f9",
//   },
//   statItem: {
//     alignItems: "center",
//   },
//   statNumber: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#1e293b",
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#64748b",
//     marginTop: 4,
//   },

//   // Add Expense Button
//   addExpenseButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#007bff",
//     marginHorizontal: 20,
//     marginBottom: 20,
//     paddingVertical: 16,
//     borderRadius: 12,
//     gap: 8,
//   },
//   addExpenseText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "600",
//   },

//   // Expenses Container
//   expensesContainer: {
//     backgroundColor: "white",
//     marginHorizontal: 20,
//     borderRadius: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     height: screenHeight * 0.4,
//   },

//   listHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     padding: 20,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
//   listTitle: {
//     flex: 1,
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1e293b",
//   },

//   scrollableExpensesList: {
//     flex: 1,
//     paddingHorizontal: 0,
//   },

//   // Empty State
//   emptyState: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 40,
//     paddingHorizontal: 40,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1e293b",
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: "#64748b",
//     textAlign: "center",
//     marginBottom: 24,
//   },
//   emptyStateButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f8fafc",
//     borderColor: "#007bff",
//     borderWidth: 1,
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   emptyStateButtonText: {
//     color: "#007bff",
//     fontSize: 14,
//     fontWeight: "600",
//   },
// });

// export default ExpenseList;
