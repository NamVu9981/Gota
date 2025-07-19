// app/config/websocketConfig.ts
import { Platform } from "react-native";

const getWebSocketUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "ios") {
      return "ws://127.0.0.1:8000";
    } else if (Platform.OS === "android") {
      return "ws://192.168.2.127:8000";
    } else {
      return "ws://localhost:8000";
    }
  } else {
    return "wss://app.com";
  }
};

export const WS_URL = getWebSocketUrl();

console.log(
  `🔌 WebSocket Configuration: ${WS_URL} (Platform: ${Platform.OS}, Dev: ${__DEV__})`
);

export default WS_URL;
