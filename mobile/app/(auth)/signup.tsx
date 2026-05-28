import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { API_BASE_URL } from "../../constants/Config";

export default function Signup() {
  const router = useRouter();
  const loginAction = useAuthStore((state: any) => state.login);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Role detection state
  const [detectedRole, setDetectedRole] = useState<any>(null);
  const [isResolvingRole, setIsResolvingRole] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Live role detection: fires 600ms after the user stops typing their email
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = email.trim();
    const hasValidDomain =
      trimmed.includes("@") && trimmed.split("@")[1]?.includes(".");

    if (!hasValidDomain) {
      setDetectedRole(null);
      return;
    }

    setIsResolvingRole(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const encodedEmail = encodeURIComponent(trimmed);
        const res = await fetch(
          `${API_BASE_URL}/roles/resolve?email=${encodedEmail}`,
          {
            headers: {
              "Bypass-Tunnel-Reminder": "true",
              Accept: "application/json",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setDetectedRole(data); // null if no match, role object if matched
        } else {
          setDetectedRole(null);
        }
      } catch (err) {
        console.error("Role Detection Error:", err);
        // Special marker to indicate a network failure vs just "not found"
        setDetectedRole({ error: "connection_error" });
      } finally {
        setIsResolvingRole(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert(
        "Missing Info",
        "Please fill out all fields to create an account."
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Wait a minute!", "Your passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting signup fetch...");
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Bypass-Tunnel-Reminder": "true",
        },
        body: JSON.stringify({
          name: fullName,
          email: email.trim(),
          password: password,
          external_id: email.split("@")[0],
          // role_context intentionally omitted → backend resolves from email domain
          attributes: { signed_up_at: new Date().toISOString() },
        }),
      });

      console.log("Signup response status:", res.status);
      const contentType = res.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      console.log("Response is JSON:", isJson);

      if (res.ok) {
        if (!isJson) {
           const errorText = await res.text();
           console.error("Non-JSON Response Body (Signup Success):", errorText);
           
           if (res.status === 503) {
             Alert.alert("Tunnel Offline", "The backend tunnel (LocalTunnel) is currently offline.");
             return;
           }
           
           throw new Error(`Invalid server response (Status: ${res.status})`);
        }
        const newUser = await res.json();
        console.log("New user created:", newUser?.id);
        
        if (!newUser || !newUser.id) {
           throw new Error("Server created user but returned empty data.");
        }

        // Registration Success - Direct redirect to login
        router.replace("/(auth)/login");
      } else if (res.status === 403) {
        const errorData = isJson ? await res.json() : null;
        if (!isJson) {
            const errorText = await res.text();
            console.error("Non-JSON Response Body (403):", errorText);
        }
        Alert.alert(
          "Access Denied",
          errorData?.detail || "This email domain is not authorized for registration."
        );
      } else {
        const errorData = isJson ? await res.json() : null;
        if (!isJson) {
            const errorText = await res.text();
            console.error("Non-JSON Response Body (Error):", errorText);
        }
        Alert.alert(
          "Signup Failed",
          errorData?.detail || "Could not create account. Please try again."
        );
      }
    } catch (err: any) {
      console.error("Critical Signup Error:", err);
      Alert.alert(
        "Signup Failed",
        err.message || "Could not connect to the registration server. Please check your network."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Derived: does email have a domain part?
  const emailHasDomain =
    email.includes("@") && email.split("@")[1]?.includes(".");

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
          {/* Header Section */}
          <View className="items-center mt-12 mb-8">
            <View className="w-20 h-20 bg-[#f1f4ff] rounded-3xl items-center justify-center mb-4">
              <Ionicons name="person-add-outline" size={40} color="#1a234b" />
            </View>
            <Text className="text-3xl font-extrabold text-[#1a234b] text-center">
              Create Account
            </Text>
            <Text className="text-sm color-[#64748b] text-center mt-2">
              Join the RegiSys Ecosystem
            </Text>
          </View>

          {/* Form Section */}
          <View className="w-full">
            {/* Full Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#1a234b] mb-2 ml-1">
                Full Name
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base text-slate-800"
                placeholder="Enter full name"
                placeholderTextColor="#94a3b8"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Email + Live Role Badge */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#1a234b] mb-2 ml-1">
                Email
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base text-slate-800"
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#1a234b] mb-2 ml-1">
                Password
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl pr-4">
                <TextInput
                  className="flex-1 p-4 text-base text-slate-800"
                  secureTextEntry={!showPassword}
                  placeholder="Create password"
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

            {/* Confirm Password Field */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-[#1a234b] mb-2 ml-1">
                Confirm Password
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl pr-4">
                <TextInput
                  className="flex-1 p-4 text-base text-slate-800"
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Re-type password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={isLoading}
              className="bg-[#1a234b] p-4 rounded-2xl items-center shadow-lg shadow-[#1a234b]/30"
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-lg">Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-[1px] bg-slate-200" />
              <Text className="mx-3 text-slate-400 text-sm">
                or continue with
              </Text>
              <View className="flex-1 h-[1px] bg-slate-200" />
            </View>

            {/* Google Signup Button */}
            <TouchableOpacity
              className="flex-row border border-slate-200 bg-white p-4 rounded-2xl items-center justify-center shadow-sm"
              activeOpacity={0.7}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="#DB4437"
                style={{ marginRight: 8 }}
              />
              <Text className="text-slate-800 font-bold text-base">Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <View className="flex-row justify-center mt-10 mb-8">
            <Text className="text-slate-500 text-sm">
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className="text-[#1a234b] font-extrabold text-sm">
                {" "}
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}