import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { API_BASE_URL } from "../constants/Config";

export default function RoleSelection() {
  const router = useRouter();
  const { updateProfile } = useAuthStore((state: any) => state);
  const pathname = usePathname();
  const setLastLocation = useAuthStore((state: any) => state.setLastLocation);

  useEffect(() => {
    if (pathname) {
      setLastLocation(pathname);
    }
  }, [pathname]);
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/roles`, {
          headers: {
            "Bypass-Tunnel-Reminder": "true"
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRoles(data);
        } else {
          // Fallback if no roles in DB yet
          setRoles([
            { id: "student", name: "Student", title: "Student", icon: "school-outline", description: "Access student services." },
            { id: "teacher", name: "Teacher", title: "Teacher", icon: "book-outline", description: "Manage courses." }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      }
    };
    fetchRoles();
  }, []);

  const handleContinue = () => {
    if (!selectedRole) return;
    updateProfile({ role: selectedRole });
    router.push("/complete-registration");
  };


  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mb-6"
        >
          <Ionicons name="arrow-back" size={20} color="#1a234b" />
        </TouchableOpacity>

        {/* Header Section */}
        <View className="mb-8">
          <Text className="text-3xl font-extrabold text-[#1a234b] mb-2">
            Choose Your Role
          </Text>
          <Text className="text-sm color-[#64748b] leading-5">
            How will you be using the Central Hub? Select your account type to get the correct registration form.
          </Text>
        </View>

        {/* Role Cards */}
        <View className="w-full space-y-4 mb-10">
          {roles.map((role) => {
            const isSelected = selectedRole === role.name;

            return (
              <TouchableOpacity
                key={role.id || role.name}
                onPress={() => setSelectedRole(role.name)}
                activeOpacity={0.7}
                className={`p-5 rounded-2xl border-2 flex-row items-center mb-4 ${
                  isSelected 
                    ? "bg-blue-50 border-blue-600 shadow-sm shadow-blue-200" 
                    : "bg-white border-slate-200 shadow-sm shadow-slate-100"
                }`}
              >
                {/* Icon Container */}
                <View 
                  className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${
                    isSelected ? "bg-blue-600" : "bg-slate-100"
                  }`}
                >
                  <Ionicons 
                    name={(role.icon || "person-outline") as any} 
                    size={28} 
                    color={isSelected ? "#ffffff" : "#64748b"} 
                  />
                </View>

                {/* Text Content */}
                <View className="flex-1">
                  <Text 
                    className={`text-lg font-extrabold mb-1 ${
                      isSelected ? "text-blue-700" : "text-[#1a234b]"
                    }`}
                  >
                    {role.title || role.name}
                  </Text>
                  <Text className="text-xs text-slate-500 leading-4 pr-2">
                    {role.description}
                  </Text>
                </View>

                {/* Selection Checkmark (Only shows if selected) */}
                <View 
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>


        {/* Spacer to push button to bottom if screen is tall */}
        <View className="flex-1" />

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedRole}
          className={`p-4 rounded-2xl items-center shadow-lg mb-4 ${
            selectedRole 
              ? "bg-[#1a234b] shadow-[#1a234b]/30" 
              : "bg-slate-300 shadow-transparent"
          }`}
          activeOpacity={0.8}
        >
          <Text 
            className={`font-bold text-lg ${
              selectedRole ? "text-white" : "text-slate-500"
            }`}
          >
            Continue
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}