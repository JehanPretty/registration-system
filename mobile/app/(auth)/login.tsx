import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { API_BASE_URL } from "../../constants/Config";

export default function Login() {
  const router = useRouter();

  // Bring in the login function from Zustand
  // (Using 'any' here just in case you haven't set up your Zustand TS interfaces yet!)
  const loginAction = useAuthStore((state: any) => state.login);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "online" | "offline">("connecting");

  // Connection Check
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ping`, {
          headers: { "Bypass-Tunnel-Reminder": "true" }
        });
        if (res.ok) setConnectionStatus("online");
        else setConnectionStatus("offline");
      } catch (err) {
        setConnectionStatus("offline");
      }
    };
    checkConnection();
  }, []);

  const handleLogin = async () => {
    // 1. Basic validation
    if (!email || !password) {
      Alert.alert("Hold on!", "Please enter your email and password.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true"
        },
        body: JSON.stringify({ email, password }),
      });

      // Defensive check for content-type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.warn("Non-JSON Response Body:", errorText);

        // Specialized diagnostic messages
        if (response.status === 503) {
          Alert.alert("Tunnel Offline", "The backend tunnel (LocalTunnel) is currently offline. Please restart it or use your local IP address.");
          return;
        }
        if (response.status === 404) {
          Alert.alert("Server Not Found", "The backend server returned a 404. Please check if the API is running and the URL is correct.");
          return;
        }

        throw new Error(`Invalid server response (Status: ${response.status})`);
      }

      const data = await response.json();

      if (response.ok) {
        // 2. Log the user into our global state with the full user object
        loginAction(data.user);

        // 3. Navigate to the Hub with a larger safety delay
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 500);
      } else {
        Alert.alert("Login Failed", data.detail || "Invalid email or password.");
      }
    } catch (error: any) {
      console.warn("Mobile Login Error:", error);
      
      // Check if this is the navigation timing error
      if (error?.message?.includes("mounting the Root Layout")) {
        console.log("Navigation triggered too early, retrying...");
        return;
      }

      Alert.alert(
        "Connection Error",
        "Cannot reach the server. The tunnel might be offline or unstable (502/504)."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="px-6"
        >
          {/* Header */}
          <View className="items-center mt-16 mb-10">
            <View className="w-20 h-20 bg-[#f1f4ff] rounded-3xl items-center justify-center mb-5 shadow-sm">
              <Ionicons name="globe-outline" size={40} color="#1a234b" />
            </View>

            <Text className="text-3xl font-extrabold text-[#1a234b]">
              Welcome
            </Text>

            <Text className="text-sm text-slate-500 mt-2 text-center">
              Log in to your account to continue
            </Text>


          </View>

          {/* Form */}
          <View className="w-full">
            <View className="mb-5">
              <Text className="text-sm font-semibold text-[#1a234b] mb-2 ml-1">
                Email Address
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base text-slate-800 focus:border-[#1a234b]"
                placeholder="Enter you email"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field with Eye Icon */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-[#1a234b] mb-2 ml-1">
                Password
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl pr-4 focus:border-[#1a234b]">
                <TextInput
                  className="flex-1 p-4 text-base text-slate-800"
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity className="items-end mb-8">
              <Text className="text-[#1a234b] font-semibold text-sm">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              className="bg-[#1a234b] p-4 rounded-2xl items-center shadow-lg shadow-[#1a234b]/30"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Login</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-auto py-8">
            <Text className="text-slate-500 text-sm">Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text className="text-[#1a234b] font-extrabold text-sm"> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}