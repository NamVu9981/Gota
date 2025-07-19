import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "@/config/apiConfig";

const getUser = async () => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");

    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_URL}/api/profile/`, {
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
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

interface UpdateUserResponse {
  [key: string]: any;
}

const updateUser = async (data: FormData) => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_URL}/api/profile/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Don't set Content-Type for FormData
      },
      body: data,
    });

    if (response.ok) {
      const responseData = await response.json();
      return responseData;
    } else {
      // Parse error response
      const errorData = await response.json();

      // Check for username existence error
      if (errorData.username && Array.isArray(errorData.username)) {
        throw new Error(errorData.username[0]);
      }
      // Check for other field errors
      else if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      // Generic error fallback
      else {
        throw new Error(`API error: ${response.status}`);
      }
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

const updateUsername = async (
  newUsername: string
): Promise<UpdateUserResponse> => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    // Use your existing profile endpoint - NOT /update-username/
    const response = await fetch(`${API_URL}/api/profile/`, {
      method: "PATCH", // Your view supports PATCH
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: newUsername }),
    });

    // Rest of error handling code...
    if (response.ok) {
      const responseData = await response.json();
      return responseData;
    } else {
      // Parse error response
      const errorData = await response.json();
      // Error handling as before...
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating username:", error);
    throw error;
  }
};

export { getUser, updateUser, updateUsername };
