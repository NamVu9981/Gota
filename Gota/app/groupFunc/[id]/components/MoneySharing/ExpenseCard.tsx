// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import {
//   DollarSign,
//   Users,
//   Clock,
//   CheckCircle,
//   MoreVertical,
//   CreditCard,
//   Trash2,
//   Edit3,
// } from "lucide-react-native";
// import { Expense } from "./types/MoneySharingTypes";

// interface ExpenseCardProps {
//   expense: Expense;
//   currentUserId: string;
//   onPress: () => void;
//   onSettle?: (expenseId: string) => Promise<void>;
//   onDelete?: (expenseId: string) => Promise<void>;
//   onEdit?: (expense: Expense) => void;
// }

// const ExpenseCard: React.FC<ExpenseCardProps> = ({
//   expense,
//   currentUserId,
//   onPress,
//   onSettle,
//   onDelete,
//   onEdit,
// }) => {
//   const [actionLoading, setActionLoading] = useState<string | null>(null);

//   const userParticipant = expense.participants.find(
//     (p) => p.user.id === currentUserId
//   );

//   // 🔧 FIX: Convert string amounts to numbers
//   const amountOwed = Number(userParticipant?.amount_owed || 0);
//   const amountPaid = Number(userParticipant?.amount_paid || 0);
//   const totalAmount = Number(expense.total_amount || 0);

//   const userBalance = amountPaid - amountOwed;
//   const isUserPayer = expense.paid_by.id === currentUserId;
//   const canSettle = userBalance < 0 && userParticipant?.status !== "paid";
//   const canEdit = isUserPayer && expense.status === "pending";
//   const canDelete = isUserPayer;

//   const getStatusColor = () => {
//     switch (expense.status) {
//       case "settled":
//         return "#10b981";
//       case "partial":
//         return "#f59e0b";
//       default:
//         return "#ef4444";
//     }
//   };

//   const getStatusIcon = () => {
//     switch (expense.status) {
//       case "settled":
//         return <CheckCircle size={16} color="#10b981" />;
//       case "partial":
//         return <Clock size={16} color="#f59e0b" />;
//       default:
//         return <DollarSign size={16} color="#ef4444" />;
//     }
//   };

//   const handleSettleExpense = async () => {
//     if (!onSettle || !canSettle) return;

//     Alert.alert(
//       "Settle Expense",
//       `Are you sure you want to settle your share of $${Math.abs(
//         userBalance
//       ).toFixed(2)}?`,
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "Settle",
//           onPress: async () => {
//             try {
//               setActionLoading("settle");
//               await onSettle(expense.id);
//             } catch (error) {
//               Alert.alert(
//                 "Error",
//                 error instanceof Error
//                   ? error.message
//                   : "Failed to settle expense"
//               );
//             } finally {
//               setActionLoading(null);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleDeleteExpense = async () => {
//     if (!onDelete || !canDelete) return;

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
//               setActionLoading("delete");
//               await onDelete(expense.id);
//             } catch (error) {
//               Alert.alert(
//                 "Error",
//                 error instanceof Error
//                   ? error.message
//                   : "Failed to delete expense"
//               );
//             } finally {
//               setActionLoading(null);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleMoreActions = () => {
//     const actions = [];

//     if (canSettle) {
//       actions.push({
//         text: `Settle $${Math.abs(userBalance).toFixed(2)}`,
//         onPress: handleSettleExpense,
//         icon: "settle",
//       });
//     }

//     if (canEdit && onEdit) {
//       actions.push({
//         text: "Edit",
//         onPress: () => onEdit(expense),
//         icon: "edit",
//       });
//     }

//     if (canDelete) {
//       actions.push({
//         text: "Delete",
//         onPress: handleDeleteExpense,
//         style: "destructive",
//         icon: "delete",
//       });
//     }

//     if (actions.length === 0) {
//       Alert.alert("No Actions", "No actions available for this expense.");
//       return;
//     }

//     const alertActions = actions.map((action) => ({
//       text: action.text,
//       onPress: action.onPress,
//       style:
//         (action.style as "cancel" | "default" | "destructive" | undefined) ||
//         "default",
//     }));

//     alertActions.push({
//       text: "Cancel",
//       style: "cancel",
//       onPress: () => {},
//     });

//     Alert.alert("Expense Actions", "Choose an action:", alertActions);
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffTime = Math.abs(now.getTime() - date.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     if (diffDays === 1) return "Today";
//     if (diffDays === 2) return "Yesterday";
//     if (diffDays <= 7) return `${diffDays - 1} days ago`;

//     return date.toLocaleDateString();
//   };

//   return (
//     <TouchableOpacity style={styles.expenseCard} onPress={onPress}>
//       {/* Header */}
//       <View style={styles.expenseHeader}>
//         <View style={styles.expenseTitle}>
//           <Text style={styles.expenseName} numberOfLines={1}>
//             {expense.title}
//           </Text>
//           <View style={styles.statusContainer}>
//             {getStatusIcon()}
//             <Text style={[styles.statusText, { color: getStatusColor() }]}>
//               {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.headerRight}>
//           <Text style={styles.expenseAmount}>${totalAmount.toFixed(2)}</Text>

//           {/* Action Button */}
//           {(canSettle || canEdit || canDelete) && (
//             <TouchableOpacity
//               style={styles.actionButton}
//               onPress={handleMoreActions}
//               disabled={actionLoading !== null}
//             >
//               {actionLoading ? (
//                 <ActivityIndicator size="small" color="#64748b" />
//               ) : (
//                 <MoreVertical size={16} color="#64748b" />
//               )}
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Details */}
//       <View style={styles.expenseDetails}>
//         <View style={styles.expenseInfo}>
//           <Users size={14} color="#64748b" />
//           <Text style={styles.participantCount}>
//             {expense.participants.length} people
//           </Text>
//         </View>

//         <View style={styles.userBalance}>
//           {userBalance === 0 ? (
//             <Text style={styles.balanceText}>You're settled up</Text>
//           ) : userBalance > 0 ? (
//             <Text style={[styles.balanceText, styles.positiveBalance]}>
//               You're owed ${Math.abs(userBalance).toFixed(2)}
//             </Text>
//           ) : (
//             <Text style={[styles.balanceText, styles.negativeBalance]}>
//               You owe ${Math.abs(userBalance).toFixed(2)}
//             </Text>
//           )}
//         </View>
//       </View>

//       {/* Description */}
//       {expense.description && (
//         <Text style={styles.expenseDescription} numberOfLines={2}>
//           {expense.description}
//         </Text>
//       )}

//       {/* Footer */}
//       <View style={styles.expenseFooter}>
//         <Text style={styles.createdBy}>
//           Paid by {isUserPayer ? "You" : expense.paid_by.username}
//         </Text>
//         <Text style={styles.createdDate}>{formatDate(expense.created_at)}</Text>
//       </View>

//       {/* Quick Action Buttons */}
//       {canSettle && (
//         <View style={styles.quickActions}>
//           <TouchableOpacity
//             style={[styles.quickActionButton, styles.settleButton]}
//             onPress={handleSettleExpense}
//             disabled={actionLoading === "settle"}
//           >
//             {actionLoading === "settle" ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <>
//                 <CreditCard size={14} color="white" />
//                 <Text style={styles.settleButtonText}>
//                   Settle ${Math.abs(userBalance).toFixed(2)}
//                 </Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       )}
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   expenseCard: {
//     backgroundColor: "#ffffff",
//     marginHorizontal: 16,
//     marginVertical: 6,
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#f1f5f9",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },

//   // Header
//   expenseHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: 12,
//   },
//   expenseTitle: {
//     flex: 1,
//     marginRight: 12,
//   },
//   expenseName: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1e293b",
//     marginBottom: 4,
//   },
//   statusContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: "500",
//     textTransform: "capitalize",
//   },
//   headerRight: {
//     alignItems: "flex-end",
//     gap: 8,
//   },
//   expenseAmount: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#1e293b",
//   },
//   actionButton: {
//     padding: 4,
//     borderRadius: 4,
//   },

//   // Details
//   expenseDetails: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   expenseInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   participantCount: {
//     fontSize: 12,
//     color: "#64748b",
//   },
//   userBalance: {
//     alignItems: "flex-end",
//   },
//   balanceText: {
//     fontSize: 12,
//     fontWeight: "500",
//   },
//   positiveBalance: {
//     color: "#10b981",
//   },
//   negativeBalance: {
//     color: "#ef4444",
//   },

//   // Description
//   expenseDescription: {
//     fontSize: 14,
//     color: "#64748b",
//     marginBottom: 8,
//     lineHeight: 18,
//   },

//   // Footer
//   expenseFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: "#f8fafc",
//   },
//   createdBy: {
//     fontSize: 12,
//     color: "#64748b",
//   },
//   createdDate: {
//     fontSize: 12,
//     color: "#94a3b8",
//   },

//   // Quick Actions
//   quickActions: {
//     marginTop: 12,
//     gap: 8,
//   },
//   quickActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     gap: 6,
//   },
//   settleButton: {
//     backgroundColor: "#10b981",
//   },
//   settleButtonText: {
//     color: "white",
//     fontSize: 12,
//     fontWeight: "600",
//   },
// });

// export default ExpenseCard;
