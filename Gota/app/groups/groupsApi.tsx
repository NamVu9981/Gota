import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "@/config/apiConfig";

export interface Group {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_owner: boolean;
  created_at: string;
  last_activity?: string;
  owner: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  role: "owner" | "member";
  joined_at: string;
  is_location_visible: boolean;
  last_seen?: string;
  is_owner: boolean;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface AddMembersRequest {
  member_ids: number[];
}

export interface GroupInvitation {
  id: string;
  group: Group;
  invited_by: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  created_at: string;
  status: "pending" | "accepted" | "declined";
}

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Create a new group
export const createGroup = async (
  groupData: CreateGroupRequest
): Promise<Group> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/groups/create/`, {
      method: "POST",
      headers,
      body: JSON.stringify(groupData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.message || "Failed to create group"
      );
    }

    const data = await response.json();
    return {
      ...data,
      member_count: data.member_count || 1,
      is_owner: data.is_owner || true,
      last_activity: data.last_activity || "Just now",
    };
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

// Get all user's groups
export const getUserGroups = async (): Promise<Group[]> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/groups/`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.message || "Failed to fetch groups"
      );
    }

    const data = await response.json();
    const groups = data.results || data;

    // Transform data to match frontend expectations
    return groups.map((group: any) => ({
      ...group,
      member_count: group.member_count || 1,
      is_owner: group.is_owner || false,
      last_activity:
        group.last_activity || formatLastActivity(group.created_at),
    }));
  } catch (error) {
    console.error("Error fetching groups:", error);
    throw error;
  }
};

// Get group details by ID
export const getGroupDetails = async (groupId: string): Promise<Group> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/groups/${groupId}/`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.message || "Failed to fetch group details"
      );
    }

    const data = await response.json();
    return {
      ...data,
      member_count: data.member_count || 1,
      is_owner: data.is_owner || false,
      last_activity: data.last_activity || formatLastActivity(data.created_at),
    };
  } catch (error) {
    console.error("Error fetching group details:", error);
    throw error;
  }
};

// Add members to a group
export const addMembersToGroup = async (
  groupId: string,
  memberIds: number[]
): Promise<{
  success: boolean;
  message: string;
  added_members: GroupMember[];
}> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${API_URL}/api/groups/${groupId}/add-members/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ member_ids: memberIds }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail ||
          errorData.message ||
          "Failed to add members to group"
      );
    }

    const data = await response.json();
    return {
      success: data.success || true,
      message: data.message || "Members added successfully",
      added_members: data.added_members || [],
    };
  } catch (error) {
    console.error("Error adding members to group:", error);
    throw error;
  }
};

// Remove member from group
export const removeMemberFromGroup = async (
  groupId: string,
  memberId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${API_URL}/api/groups/${groupId}/remove-member/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ member_id: memberId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail ||
          errorData.message ||
          "Failed to remove member from group"
      );
    }

    const data = await response.json();
    return {
      success: data.success || true,
      message: data.message || "Member removed successfully",
    };
  } catch (error) {
    console.error("Error removing member from group:", error);
    throw error;
  }
};

// Update group details
export const updateGroup = async (
  groupId: string,
  updates: Partial<CreateGroupRequest>
): Promise<Group> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/groups/${groupId}/update/`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.message || "Failed to update group"
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating group:", error);
    throw error;
  }
};

// Delete group
export const deleteGroup = async (
  groupId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/groups/${groupId}/delete/`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.message || "Failed to delete group"
      );
    }

    return { success: true, message: "Group deleted successfully" };
  } catch (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
};

// Update location sharing preference for user in group
export const updateLocationSharing = async (
  groupId: string,
  isVisible: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${API_URL}/api/groups/${groupId}/location-sharing/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ is_location_visible: isVisible }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail ||
          errorData.message ||
          "Failed to update location sharing"
      );
    }

    const data = await response.json();
    return {
      success: data.success || true,
      message: data.message || "Location sharing updated",
    };
  } catch (error) {
    console.error("Error updating location sharing:", error);
    throw error;
  }
};

// Get group members
export const getGroupMembers = async (
  groupId: string
): Promise<GroupMember[]> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/groups/${groupId}/members/`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.message || "Failed to fetch group members"
      );
    }

    const data = await response.json();
    return data.results || data;
  } catch (error) {
    console.error("Error fetching group members:", error);
    throw error;
  }
};

// Get pending group invitations
export const getGroupInvitations = async (): Promise<GroupInvitation[]> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/groups/invitations/`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.message || "Failed to fetch invitations"
      );
    }

    const data = await response.json();
    return data.results || data;
  } catch (error) {
    console.error("Error fetching invitations:", error);
    throw error;
  }
};

// Respond to group invitation
export const respondToInvitation = async (
  invitationId: string,
  response: "accept" | "decline"
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = await getAuthHeaders();

    const apiResponse = await fetch(
      `${API_URL}/api/groups/invitations/${invitationId}/respond/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ response }),
      }
    );

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(
        errorData.detail ||
          errorData.message ||
          "Failed to respond to invitation"
      );
    }

    const data = await apiResponse.json();
    return {
      success: data.success || true,
      message: data.message || `Invitation ${response}ed successfully`,
    };
  } catch (error) {
    console.error("Error responding to invitation:", error);
    throw error;
  }
};

// Send group invitation
export const inviteToGroup = async (
  groupId: string,
  inviteData: { email?: string; username?: string; user_id?: string }
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/groups/${groupId}/invite/`, {
      method: "POST",
      headers,
      body: JSON.stringify(inviteData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.message || "Failed to send invitation"
      );
    }

    const data = await response.json();
    return {
      success: data.success || true,
      message: data.message || "Invitation sent successfully",
    };
  } catch (error) {
    console.error("Error sending invitation:", error);
    throw error;
  }
};

// Helper function to format last activity
const formatLastActivity = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};
