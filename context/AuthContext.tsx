import { useContext, createContext, useState, ReactNode } from "react";
import { Text, SafeAreaView } from "react-native";

// Define the shape of your context data
interface AuthContextType {
  session: boolean;
  user: boolean;
  signin: () => Promise<void>;
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
  const [user, setUser] = useState(false);

  const signin = async () => {};
  const signout = async () => {};

  const contextData: AuthContextType = { session, user, signin, signout };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? (
        <SafeAreaView>
          <Text>Loading ...</Text>
        </SafeAreaView>
      ) : (
        children
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
