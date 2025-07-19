// app/api/friends/friendApi.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "@/config/apiConfig";

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export interface FriendRequest {
  id: number;
  from_user: User;
  to_user: User;
  status: "pending" | "accepted" | "rejected" | "blocked";
  created_at: string;
  updated_at: string;
}

// Search for users (same pattern as your getUser function)
const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");

    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(
      `${API_URL}/api/users/search/?q=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

// Send friend request (same pattern as your updateUser function)
const sendFriendRequest = async (toUserId: number): Promise<FriendRequest> => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_URL}/api/friends/request/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to_user_id: toUserId }),
    });

    if (response.ok) {
      const responseData = await response.json();
      return responseData;
    } else {
      // Parse error response (same pattern as your updateUser)
      const errorData = await response.json();

      if (errorData.error) {
        throw new Error(errorData.error);
      } else if (errorData.detail) {
        throw new Error(errorData.detail);
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    }
  } catch (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
};

// Get pending requests
const getPendingRequests = async (): Promise<FriendRequest[]> => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");

    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_URL}/api/friends/pending/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    throw error;
  }
};

// Accept friend request
const acceptFriendRequest = async (
  requestId: number
): Promise<FriendRequest> => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(
      `${API_URL}/api/friends/accept/${requestId}/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      const responseData = await response.json();
      return responseData;
    } else {
      const errorData = await response.json();
      throw new Error(
        errorData.error || errorData.detail || `API error: ${response.status}`
      );
    }
  } catch (error) {
    console.error("Error accepting friend request:", error);
    throw error;
  }
};

// Reject friend request
const rejectFriendRequest = async (
  requestId: number
): Promise<{ message: string }> => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(
      `${API_URL}/api/friends/reject/${requestId}/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      const responseData = await response.json();
      return responseData;
    } else {
      const errorData = await response.json();
      throw new Error(
        errorData.error || errorData.detail || `API error: ${response.status}`
      );
    }
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    throw error;
  }
};

const removeFriend = async (friendId: number): Promise<{ message: string }> => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_URL}/api/friends/remove/${friendId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const responseData = await response.json();
      return responseData;
    } else {
      const errorData = await response.json();
      throw new Error(
        errorData.error || errorData.detail || `API error: ${response.status}`
      );
    }
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
};

// Get friends list
const getFriendsList = async (): Promise<User[]> => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");

    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_URL}/api/friends/list/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching friends list:", error);
    throw error;
  }
};

export {
  removeFriend,
  searchUsers,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
};
