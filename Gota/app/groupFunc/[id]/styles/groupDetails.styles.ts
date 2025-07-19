import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerBackButton: {
    padding: 8,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  headerMoreButton: {
    padding: 8,
  },

  // Group Info Card
  groupInfoCard: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  groupIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  groupInfoContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
    lineHeight: 20,
  },
  createdAt: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 2,
  },
  ownerInfo: {
    fontSize: 12,
    color: "#007bff",
    fontWeight: "500",
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  addFriendsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addFriendsText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007bff",
    gap: 8,
  },
  shareText: {
    color: "#007bff",
    fontWeight: "600",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  settingsText: {
    color: "#64748b",
    fontWeight: "600",
  },

  // Location Sharing Card
  locationSharingCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  locationSharingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationSharingInfo: {
    flex: 1,
  },
  locationSharingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  locationSharingSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  locationToggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    padding: 2,
    justifyContent: "center",
  },
  locationToggleActive: {
    backgroundColor: "#007bff",
  },
  locationToggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  locationToggleThumbActive: {
    transform: [{ translateX: 24 }],
  },

  // Members Section
  membersSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  membersSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  membersSectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  membersSectionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  addMemberButton: {
    padding: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
  },

  // Member Item
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginRight: 8,
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  ownerText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#f59e0b",
  },
  memberEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  joinedAt: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: "#94a3b8",
  },

  // Member Actions & Status
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberStatus: {
    marginLeft: 12,
  },
  locationVisible: {
    padding: 8,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
  },
  locationHidden: {
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  removeMemberButton: {
    padding: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
  },
  memberSeparator: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 8,
  },

  // Empty States
  emptyMembers: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyMembersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMembersSubtext: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },

  // Map Placeholder
  mapCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mapPlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});

// 🎨 COLOR CONSTANTS (Optional - for consistency)
export const colors = {
  primary: "#007bff",
  primaryLight: "#eff6ff",
  gray50: "#f8fafc",
  gray100: "#f1f5f9",
  gray200: "#e2e8f0",
  gray400: "#94a3b8",
  gray500: "#64748b",
  gray800: "#1e293b",
  green50: "#ecfdf5",
  green500: "#10b981",
  red50: "#fef2f2",
  red500: "#ef4444",
  yellow50: "#fef3c7",
  yellow500: "#f59e0b",
  white: "#ffffff",
  black: "#000000",
};

// 🔧 SIZING CONSTANTS (Optional - for consistency)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
};
