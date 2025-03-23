import {
  Image,
  StyleSheet,
  Platform,
  Button,
  Pressable,
  Text,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const { signout } = useAuth();
  const handleSignout = async () => {
    await signout();
  };
  return (
    <SafeAreaView>
      <Link href="/authentication/Login" asChild>
        <Pressable style={styles.button} onPress={handleSignout}>
          <Text style={styles.buttonText}>Sing out</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
