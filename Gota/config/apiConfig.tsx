// app/config/apiConfig.ts
import { Platform } from "react-native";

const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "ios") {
      return "http://127.0.0.1:8000";
    } else if (Platform.OS === "android") {
      return "http://192.168.2.127:8000"; // ← Change this!
    } else {
      return "http://localhost:8000";
    }
  } else {
    return "https://app.com";
  }
};

export const API_URL = getApiUrl();

// For debugging - shows which URL is being used
console.log(
  `🌐 API Configuration: ${API_URL} (Platform: ${Platform.OS}, Dev: ${__DEV__})`
);

export default API_URL;
