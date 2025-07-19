// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   Modal,
//   SafeAreaView,
//   ScrollView,
//   Switch,
// } from "react-native";
// import {
//   X,
//   DollarSign,
//   Users,
//   Receipt,
//   CheckCircle,
//   Clock,
// } from "lucide-react-native";
// import { GroupDetails } from "../../types/group.types";
// import { CreateExpenseRequest } from "./types/MoneySharingTypes";
// import { styles } from "./styles/styles";

// interface CreateExpenseModalProps {
//   visible: boolean;
//   onClose: () => void;
//   group: GroupDetails;
//   onCreateExpense: (expense: CreateExpenseRequest) => Promise<void>;
// }

// const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
//   visible,
//   onClose,
//   group,
//   onCreateExpense,
// }) => {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [amount, setAmount] = useState("");
//   const [hasReceipt, setHasReceipt] = useState(false); // 🆕 Receipt toggle
//   const [loading, setLoading] = useState(false);

//   const handleCreate = async () => {
//     if (!title.trim()) {
//       Alert.alert("Error", "Please enter an expense title");
//       return;
//     }

//     if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
//       Alert.alert("Error", "Please enter a valid amount");
//       return;
//     }

//     setLoading(true);
//     try {
//       // 🆕 Enhanced expense data with smart approval info
//       const expenseData = {
//         title: title.trim(),
//         description: description.trim() || undefined,
//         total_amount: Number(amount),
//         currency: "USD",
//         split_type: "equal" as const,
//         has_receipt: hasReceipt, // 🆕 Include receipt info
//       };

//       await onCreateExpense(expenseData);

//       // 🆕 Show smart approval feedback
//       const expectedStatus = getExpectedApprovalStatus();
//       if (expectedStatus.willAutoApprove) {
//         Alert.alert(
//           "✅ Expense Auto-Approved!",
//           `Your expense was automatically approved because: ${expectedStatus.reason}\n\nThe expense is now active and ready for settlement.`,
//           [{ text: "Great!", onPress: resetAndClose }]
//         );
//       } else {
//         Alert.alert(
//           "⏳ Submitted for Approval",
//           "Your expense has been submitted and is waiting for approval from the group owner. You'll be notified once it's reviewed.",
//           [{ text: "Got it", onPress: resetAndClose }]
//         );
//       }
//     } catch (error) {
//       Alert.alert("Error", "Failed to create expense");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetAndClose = () => {
//     setTitle("");
//     setDescription("");
//     setAmount("");
//     setHasReceipt(false);
//     onClose();
//   };

//   // 🆕 Smart approval prediction logic
//   const getExpectedApprovalStatus = () => {
//     const numericAmount = Number(amount) || 0;

//     // Simple prediction logic based on common auto-approval rules
//     if (numericAmount <= 25) {
//       return {
//         willAutoApprove: true,
//         reason: "small amount under auto-approval limit ($25)",
//       };
//     } else if (hasReceipt && numericAmount <= 100) {
//       return {
//         willAutoApprove: true,
//         reason: "has receipt and amount under receipt limit ($100)",
//       };
//     } else if (numericAmount <= 50) {
//       return {
//         willAutoApprove: true,
//         reason: "moderate amount that may be auto-approved for trusted members",
//       };
//     } else {
//       return {
//         willAutoApprove: false,
//         reason: "Amount requires manual approval from group owner",
//       };
//     }
//   };

//   const numericAmount = Number(amount) || 0;
//   const splitAmount = numericAmount / (group.members?.length || 1);
//   const expectedStatus = getExpectedApprovalStatus();

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//     >
//       <SafeAreaView style={styles.modalContainer}>
//         <View style={styles.modalHeader}>
//           <TouchableOpacity onPress={onClose}>
//             <X size={24} color="#64748b" />
//           </TouchableOpacity>
//           <Text style={styles.modalTitle}>Add Expense</Text>
//           <TouchableOpacity
//             onPress={handleCreate}
//             disabled={loading || !title.trim() || !amount}
//             style={[
//               styles.createButton,
//               (!title.trim() || !amount) && styles.createButtonDisabled,
//             ]}
//           >
//             <Text
//               style={[
//                 styles.createButtonText,
//                 (!title.trim() || !amount) && styles.createButtonTextDisabled,
//               ]}
//             >
//               {loading ? "Creating..." : "Create"}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <ScrollView style={styles.modalContent}>
//           <View style={styles.inputGroup}>
//             <Text style={styles.inputLabel}>What's this expense for?</Text>
//             <TextInput
//               style={styles.textInput}
//               value={title}
//               onChangeText={setTitle}
//               placeholder="e.g., Dinner, Gas, Hotel"
//               placeholderTextColor="#94a3b8"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.inputLabel}>Amount</Text>
//             <View style={styles.amountInputContainer}>
//               <DollarSign size={20} color="#64748b" />
//               <TextInput
//                 style={styles.amountInput}
//                 value={amount}
//                 onChangeText={setAmount}
//                 placeholder="0.00"
//                 placeholderTextColor="#94a3b8"
//                 keyboardType="numeric"
//               />
//             </View>
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.inputLabel}>Description (Optional)</Text>
//             <TextInput
//               style={[styles.textInput, styles.descriptionInput]}
//               value={description}
//               onChangeText={setDescription}
//               placeholder="Add details about this expense"
//               placeholderTextColor="#94a3b8"
//               multiline
//               numberOfLines={3}
//             />
//           </View>

//           {/* 🆕 Receipt Toggle */}
//           <View style={styles.inputGroup}>
//             <View style={smartStyles.receiptContainer}>
//               <View style={smartStyles.receiptHeader}>
//                 <Receipt size={20} color="#007bff" />
//                 <Text style={smartStyles.receiptLabel}>I have a receipt</Text>
//               </View>
//               <Switch
//                 value={hasReceipt}
//                 onValueChange={setHasReceipt}
//                 trackColor={{ false: "#e2e8f0", true: "#007bff" }}
//                 thumbColor={hasReceipt ? "#ffffff" : "#f4f3f4"}
//               />
//             </View>
//             {hasReceipt && (
//               <Text style={smartStyles.receiptHint}>
//                 💡 Having a receipt increases your auto-approval limit!
//               </Text>
//             )}
//           </View>

//           {/* 🆕 Smart Approval Preview */}
//           {amount && (
//             <View style={smartStyles.approvalPreview}>
//               <View style={smartStyles.approvalHeader}>
//                 {expectedStatus.willAutoApprove ? (
//                   <CheckCircle size={20} color="#10b981" />
//                 ) : (
//                   <Clock size={20} color="#f59e0b" />
//                 )}
//                 <Text style={smartStyles.approvalTitle}>
//                   {expectedStatus.willAutoApprove
//                     ? "Likely Auto-Approved"
//                     : "Will Need Approval"}
//                 </Text>
//               </View>
//               <Text style={smartStyles.approvalReason}>
//                 {expectedStatus.reason}
//               </Text>
//             </View>
//           )}

//           {/* Split Preview */}
//           <View style={styles.splitPreview}>
//             <View style={styles.splitHeader}>
//               <Users size={20} color="#007bff" />
//               <Text style={styles.splitTitle}>Split equally</Text>
//             </View>

//             <View style={styles.splitDetails}>
//               <Text style={styles.splitText}>
//                 {group.members?.length || 0} people • ${splitAmount.toFixed(2)}{" "}
//                 each
//               </Text>
//             </View>

//             <View style={styles.membersList}>
//               {group.members?.slice(0, 5).map((member) => (
//                 <View key={member.id} style={styles.memberItem}>
//                   <View style={styles.memberAvatar}>
//                     <Text style={styles.memberAvatarText}>
//                       {member.user.username.charAt(0).toUpperCase()}
//                     </Text>
//                   </View>
//                   <View style={styles.memberInfo}>
//                     <Text style={styles.memberName}>
//                       {member.user.username}
//                     </Text>
//                     <Text style={styles.memberAmount}>
//                       ${splitAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>
//               ))}

//               {(group.members?.length || 0) > 5 && (
//                 <Text style={styles.moreMembers}>
//                   +{(group.members?.length || 0) - 5} more
//                 </Text>
//               )}
//             </View>
//           </View>
//         </ScrollView>
//       </SafeAreaView>
//     </Modal>
//   );
// };

// // 🆕 Add these smart approval styles
// const smartStyles = StyleSheet.create({
//   receiptContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     backgroundColor: "#f8fafc",
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//   },
//   receiptHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   receiptLabel: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#1e293b",
//   },
//   receiptHint: {
//     fontSize: 12,
//     color: "#10b981",
//     marginTop: 8,
//     fontStyle: "italic",
//   },
//   approvalPreview: {
//     backgroundColor: "#eff6ff",
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#dbeafe",
//     marginBottom: 20,
//   },
//   approvalHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 8,
//   },
//   approvalTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1e293b",
//   },
//   approvalReason: {
//     fontSize: 14,
//     color: "#64748b",
//     lineHeight: 20,
//   },
// });

// export default CreateExpenseModal;
