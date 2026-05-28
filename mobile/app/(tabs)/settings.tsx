import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../constants/Config';
import { useColorScheme } from 'nativewind';

const ToggleSwitch = ({ value, onValueChange, activeColor = 'bg-blue-600 dark:bg-blue-500' }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      className={`w-[44px] h-[24px] rounded-full justify-center px-1 ${value ? activeColor : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <View
        className={`w-4 h-4 bg-white rounded-full shadow-sm`}
        style={{ transform: [{ translateX: value ? 20 : 0 }] }}
      />
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile, setDarkMode } = useAuthStore();
  const { colorScheme, setColorScheme } = useColorScheme();

  const [twoFA, setTwoFA] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [lastChanged, setLastChanged] = useState("Never"); // Placeholder for last changed date

  // --- CHANGE NAME ---
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState(user?.name || "Admin");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  const handleChangeName = async () => {
    if (!newName.trim()) return;
    setNameLoading(true);
    setNameError("");
    try {
      const res = await fetch(`${API_BASE_URL}/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        updateProfile({ name: newName.trim() });
        setShowNameModal(false);
      } else {
        setNameError("Failed to update name.");
      }
    } catch (err) {
      console.error("Failed to update name:", err);
      setNameError("Connection error.");
    } finally {
      setNameLoading(false);
    }
  };

  // --- CHANGE PASSWORD MODAL ---
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");

    if (pwForm.newPw !== pwForm.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }

    if (!user?.id) {
      setPwError("User session not found. Please log in again.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          current_password: pwForm.current,
          new_password: pwForm.newPw,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPwSuccess("✅ Password changed successfully!");
        setPwForm({ current: "", newPw: "", confirm: "" });
        setLastChanged(new Date().toLocaleDateString());

        // Optionally logout user after 2 seconds to force re-login with new password
        setTimeout(() => {
          setShowChangeModal(false);
          setPwSuccess("");
        }, 2000);
      } else {
        setPwError(data.detail || "Failed to change password.");
      }
    } catch (err) {
      console.error("Password Change Error:", err);
      setPwError("Cannot connect to server. Check your network.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#0f172a]" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View className="mb-6">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center mb-4 self-start"
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 items-center justify-center shadow-sm mr-3">
              <Ionicons name="chevron-back" size={20} color="#1a234b" className="dark:text-white" />
            </View>
            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Back to Profile</Text>
          </TouchableOpacity>

          <Text className="text-xl font-black text-[#1f2a56] dark:text-white tracking-tight">Account Settings</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your security, notifications, and account preferences.</Text>
        </View>

        {/* APPEARANCE SECTION */}
        <View className="bg-white dark:bg-[#1e293b] p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none mb-6">
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl items-center justify-center">
              <Ionicons name="moon-outline" size={20} color="#6366f1" />
            </View>
            <View>
              <Text className="text-lg font-bold text-[#1f2a56] dark:text-white">Appearance</Text>
              <Text className="text-[10px] text-slate-400 font-medium tracking-widest mt-0.5 uppercase">Customize interface</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-slate-100 dark:border-slate-700/50">
            <View>
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Dark Mode</Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Switch to a darker theme</Text>
            </View>
            <ToggleSwitch
              value={colorScheme === 'dark'}
              onValueChange={(val) => {
                setColorScheme(val ? 'dark' : 'light');
                setDarkMode(val); // persist to AsyncStorage via zustand
              }}
              activeColor="bg-indigo-500"
            />
          </View>
        </View>

        {/* SECURITY SECTION */}
        <View className="bg-white dark:bg-[#1e293b] p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none mb-6">
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-10 h-10 bg-red-50 dark:bg-red-500/20 rounded-2xl items-center justify-center">
              <Ionicons name="lock-closed-outline" size={20} color="#ef4444" />
            </View>
            <View>
              <Text className="text-lg font-bold text-[#1f2a56] dark:text-white">Security Settings</Text>
              <Text className="text-[10px] text-slate-400 font-medium mt-0.5">Protect your access</Text>
            </View>
          </View>

          <View className="space-y-4">
            {/* ADMIN ACCOUNT CREDENTIALS */}
            <View className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-[20px] border border-blue-100/50 dark:border-blue-800/30 flex-col gap-4">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-none">
                  <Ionicons name="person-outline" size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-black text-blue-600 dark:text-blue-400 mb-1">Account</Text>

                  <TouchableOpacity 
                    onPress={() => {
                      setNewName(user?.name || "");
                      setNameError("");
                      setShowNameModal(true);
                    }}
                    className="flex-row items-center justify-between mt-1"
                  >
                    <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">{user?.name || "Admin"}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </TouchableOpacity>

                  <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">{user?.email || "admin@register.com"}</Text>
                </View>
              </View>
            </View>

            {/* CHANGE PASSWORD */}
            <TouchableOpacity 
              onPress={() => { setShowChangeModal(true); setPwError(""); setPwSuccess(""); }}
              activeOpacity={0.7}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-slate-100 dark:border-slate-700/50 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-none">
                  <Ionicons name="key-outline" size={20} color="#94a3b8" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Account Password</Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Click to update security</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748b" />
            </TouchableOpacity>

            {/* 2FA TOGGLE */}
            <View className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-slate-100 dark:border-slate-700/50 flex-row items-center justify-between">
              <View className="flex-row items-center gap-4 flex-1">
                <View className={`w-10 h-10 rounded-xl items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-none ${twoFA ? 'bg-green-100 dark:bg-green-500/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <Ionicons name="pulse-outline" size={20} color={twoFA ? "#16a34a" : "#94a3b8"} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Two-Factor Auth</Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{twoFA ? "Active & Secure" : "Disabled"}</Text>
                </View>
              </View>
              <ToggleSwitch value={twoFA} onValueChange={setTwoFA} activeColor="bg-green-500" />
            </View>
          </View>
        </View>

        {/* NOTIFICATIONS SECTION */}
        <View className="bg-white dark:bg-[#1e293b] p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none mb-6">
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-10 h-10 bg-blue-50 dark:bg-blue-500/20 rounded-2xl items-center justify-center">
              <Ionicons name="notifications-outline" size={20} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-lg font-bold text-[#1f2a56] dark:text-white">Notifications</Text>
              <Text className="text-[10px] text-slate-400 font-medium tracking-widest mt-0.5 uppercase">Manage updates</Text>
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-slate-100 dark:border-slate-700/50">
              <View>
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Email Alerts</Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Critical system updates</Text>
              </View>
              <ToggleSwitch value={notifEmail} onValueChange={setNotifEmail} />
            </View>
            <View className="flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-slate-100 dark:border-slate-700/50">
              <View>
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">SMS Alerts</Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Login & security events</Text>
              </View>
              <ToggleSwitch value={notifSms} onValueChange={setNotifSms} />
            </View>
          </View>
        </View>

        {/* ACTIVITY LOG SECTION */}
        <View className="bg-white dark:bg-[#1e293b] p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none mb-6">
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-10 h-10 bg-purple-50 dark:bg-purple-500/20 rounded-2xl items-center justify-center">
              <Ionicons name="time-outline" size={20} color="#a855f7" />
            </View>
            <View>
              <Text className="text-lg font-bold text-[#1f2a56] dark:text-white">Activity Log</Text>
              <Text className="text-[10px] text-slate-400 font-medium tracking-widest mt-0.5 uppercase">Recent actions</Text>
            </View>
          </View>

          <View className="gap-5 px-2">
            {[
              { event: "Login Attempt", status: "Successful", time: "10 mins ago", type: "success" },
              { event: "Profile Updated", status: "Admin Action", time: "2 hours ago", type: "info" },
              { event: "Password Change", status: "Secure Update", time: "3 days ago", type: "warning" },
              { event: "2FA Enabled", status: "Security Boost", time: "1 week ago", type: "success" },
            ].map((log, i) => (
              <View key={i} className="pl-6 relative">
                {i !== 3 && <View className="absolute left-1 top-4 bottom-[-24px] w-0.5 bg-slate-100 dark:bg-slate-700" />}
                <View className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-[1.5px] border-white dark:border-slate-900 
                  ${log.type === 'success' ? 'bg-green-500' : log.type === 'info' ? 'bg-blue-500' : 'bg-orange-500'}`}
                  style={{
                    shadowColor: log.type === 'success' ? '#22c55e' : log.type === 'info' ? '#3b82f6' : '#f97316',
                    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2
                  }}
                />
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{log.event}</Text>
                <Text className="text-[10px] text-slate-400 font-medium mt-1 tracking-tight uppercase">{log.status} • {log.time}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity className="w-full mt-8 py-4 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 items-center justify-center">
            <Text className="text-[10px] font-black tracking-widest text-slate-400 uppercase">View Full History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CHANGE NAME MODAL */}
      <Modal visible={showNameModal} transparent={false} animationType="slide">
        <View className="flex-1 bg-slate-50 dark:bg-[#0f172a]" style={{ paddingTop: insets.top }}>
          {/* MODAL HEADER */}
          <View className="flex-row items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <TouchableOpacity onPress={() => setShowNameModal(false)} className="w-10 h-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm">
              <Ionicons name="chevron-back" size={20} color="#1a234b" className="dark:text-white" />
            </TouchableOpacity>
            <Text className="ml-4 text-lg font-black text-[#1a234b] dark:text-white">Update Name</Text>
          </View>

          <ScrollView className="flex-1 px-6 pt-8">
            <View className="bg-white dark:bg-[#1e293b] p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <View className="w-14 h-14 bg-blue-50 dark:bg-blue-500/20 rounded-2xl items-center justify-center mb-6">
                <Ionicons name="person-outline" size={28} color="#3b82f6" />
              </View>
              
              <Text className="text-sm font-bold text-slate-500 mb-2">Display Name</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter full name"
                placeholderTextColor="#64748b"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-base font-medium bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 mb-6"
                autoFocus
              />

              {nameError ? <Text className="text-red-500 text-xs font-bold mb-4 px-2">{nameError}</Text> : null}

              <TouchableOpacity
                onPress={handleChangeName}
                disabled={nameLoading}
                className="w-full py-4 rounded-2xl bg-[#1a234b] dark:bg-blue-600 items-center justify-center shadow-lg shadow-blue-500/20"
                style={{ opacity: nameLoading ? 0.6 : 1 }}
              >
                {nameLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-base font-black">Save Name</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={showChangeModal} transparent={false} animationType="slide">
        <View className="flex-1 bg-slate-50 dark:bg-[#0f172a]" style={{ paddingTop: insets.top }}>
          {/* MODAL HEADER */}
          <View className="flex-row items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <TouchableOpacity onPress={() => setShowChangeModal(false)} className="w-10 h-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm">
              <Ionicons name="chevron-back" size={20} color="#1a234b" className="dark:text-white" />
            </TouchableOpacity>
            <Text className="ml-4 text-lg font-black text-[#1a234b] dark:text-white">Change Password</Text>
          </View>

          <ScrollView className="flex-1 px-6 pt-8">
            <View className="bg-white dark:bg-[#1e293b] p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <View className="w-14 h-14 bg-red-50 dark:bg-red-500/20 rounded-2xl items-center justify-center mb-6">
                <Ionicons name="key-outline" size={28} color="#ef4444" />
              </View>

              <View className="gap-6">
                <View>
                  <Text className="text-sm font-bold text-slate-500 mb-2">Current Password</Text>
                  <View className="relative justify-center">
                    <TextInput
                      secureTextEntry={!showCurrentPw}
                      value={pwForm.current}
                      onChangeText={(text) => setPwForm({ ...pwForm, current: text })}
                      placeholder="Enter current password"
                      placeholderTextColor="#64748b"
                      className="w-full px-5 py-4 pr-14 rounded-2xl border border-slate-200 dark:border-slate-700 text-base font-medium bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                    <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-5">
                      <Ionicons name={showCurrentPw ? "eye-off-outline" : "eye-outline"} size={22} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-bold text-slate-500 mb-2">New Password</Text>
                  <View className="relative justify-center">
                    <TextInput
                      secureTextEntry={!showNewPw}
                      value={pwForm.newPw}
                      onChangeText={(text) => setPwForm({ ...pwForm, newPw: text })}
                      placeholder="Enter new password"
                      placeholderTextColor="#64748b"
                      className="w-full px-5 py-4 pr-14 rounded-2xl border border-slate-200 dark:border-slate-700 text-base font-medium bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                    <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} className="absolute right-5">
                      <Ionicons name={showNewPw ? "eye-off-outline" : "eye-outline"} size={22} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-bold text-slate-500 mb-2">Confirm New Password</Text>
                  <TextInput
                    secureTextEntry
                    value={pwForm.confirm}
                    onChangeText={(text) => setPwForm({ ...pwForm, confirm: text })}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#64748b"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-base font-medium bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </View>

                {pwError ? <Text className="text-red-500 text-xs font-bold px-2">{pwError}</Text> : null}
                {pwSuccess ? <Text className="text-green-600 text-xs font-bold px-2">{pwSuccess}</Text> : null}

                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={pwLoading}
                  className="w-full py-4 rounded-2xl bg-[#1a234b] dark:bg-blue-600 items-center justify-center shadow-lg shadow-blue-500/20"
                  style={{ opacity: pwLoading ? 0.6 : 1 }}
                >
                  {pwLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-base font-black">Update Password</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
