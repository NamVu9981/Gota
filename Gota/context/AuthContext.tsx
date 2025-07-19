import { useContext, createContext, useState, ReactNode } from "react";
import {
  Text,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/config/apiConfig";

// Define the shape of the context data
interface AuthContextType {
  session: boolean;
  user: string | null;
  signin: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  signup: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  signout: () => Promise<void>;
}

// Define the props for your AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(false);
  const [user, setUser] = useState<string | null>("");

  const signin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem("accessToken", data.access);
        await AsyncStorage.setItem("refreshToken", data.refresh);
        setSession(true);
        setUser(email);
        return { success: true, message: "" };
      } else {
        // Return error message instead of showing Alert
        return {
          success: false,
          message: "Invalid email or password. Please try again.",
        };
      }
    } catch (error: any) {
      // Handle network or other unexpected errors
      return {
        success: false,
        message:
          "Unable to connect. Please check your connection and try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem("accessToken", data.access);
        await AsyncStorage.setItem("refreshToken", data.refresh);
        setSession(true);
        setUser(email);
        return { success: true, message: "Signup successful" };
      } else {
        // Extract the actual error message from the response
        let errorMessage = "An error occurred";
        if (data.email && Array.isArray(data.email) && data.email.length > 0) {
          errorMessage = data.email[0];
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === "string") {
          errorMessage = data;
        }

        return { success: false, message: errorMessage };
      }
    } catch (error: any) {
      console.error("Signup Error:", error);
      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const signout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");

      setSession(false);
      setUser(null);
      Alert.alert("Logged Out", "You have successfully logged out.");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoading(false);
    }
  };

  const contextData: AuthContextType = {
    session,
    user,
    signin,
    signup,
    signout,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {children}
      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <ActivityIndicator size="large" color="#5e7ede" />
          <Text style={{ marginTop: 10, color: "#333" }}>Loading...</Text>
        </View>
      )}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export { AuthProvider, useAuth, AuthContext };
