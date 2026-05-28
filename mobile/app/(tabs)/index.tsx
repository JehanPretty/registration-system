import { View, Text, ScrollView, TouchableOpacity, Image, Animated, RefreshControl, Alert } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../constants/Config';

export default function DashboardScreen() {
  const router = useRouter();
  // Get the logged-in user's data from our global state
  const { user, login } = useAuthStore() as any;
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Greeting Logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const greeting = getGreeting();
  const [showSkip, setShowSkip] = React.useState(false);
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Wave Animation logic
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous waving loop
    const wave = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    wave.start();
    return () => wave.stop();
  }, []);

  const waveRotation = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '25deg'],
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // update every minute
    return () => clearInterval(timer);
  }, []);

  const onRefresh = React.useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        // Update store with fresh backend data
        login(userData);
      }
    } catch (error) {
      console.error("Refresh Error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Resolve avatar: local URI wins, then try backend URL (prepend API_BASE_URL if relative)
  const resolveAvatar = () => {
    if (user?.profilePictureUri) return user.profilePictureUri;
    if (user?.avatarUrl) {
      if (user.avatarUrl.startsWith('http')) return user.avatarUrl;
      return `${API_BASE_URL}${user.avatarUrl}`;
    }
    return null;
  };
  const avatarUri = resolveAvatar();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={{ paddingTop: insets.top + 12 }}>
      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#1a234b"
            colors={["#1a234b"]} // Android
          />
        }
      >

        {/* 1. Welcome Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full mr-3 border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 items-center justify-center">
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-slate-400 dark:text-slate-500 font-bold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <View>
              <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium">{greeting},</Text>
               <View className="flex-row items-center">
                <Text className="text-xl font-extrabold text-[#1a234b] dark:text-white mr-1.5">
                  Hi {user?.name || 'User'}
                </Text>
                <Animated.View style={{ transform: [{ rotate: waveRotation }] }} pointerEvents="none">
                  <Text style={{ fontSize: 20 }}>👋</Text>
                </Animated.View>
              </View>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Ionicons name="calendar-outline" size={10} color="#94a3b8" />
                <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {formatDate(currentTime)} • {formatTime(currentTime)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 1.5 Verification CTA - Only shows if not complete and not skipped */}
        {!user?.isProfileComplete && !showSkip && (
          <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 mb-8 shadow-sm">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-full items-center justify-center">
                <Ionicons name="shield-outline" size={18} color="#d97706" />
              </View>
              <Text className="ml-3 text-amber-800 dark:text-amber-400 font-bold text-sm">Verification Pending</Text>
            </View>
            <Text className="text-amber-700 dark:text-amber-500/80 text-xs leading-5 mb-5 font-medium">
              Please complete your registration to verify your identity and unlock all system features.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => router.push('/complete-registration')}
                className="bg-[#1a234b] dark:bg-blue-600 px-6 py-3 rounded-xl flex-1 items-center"
              >
                <Text className="text-white font-bold text-xs">Complete Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowSkip(true)}
                className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 px-6 py-3 rounded-xl items-center"
              >
                <Text className="text-amber-700 dark:text-slate-300 font-bold text-xs">Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2. Digital ID Quick Access (Modern CTA) */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/digital-id')}
          className="bg-[#1a234b] dark:bg-blue-900/40 border border-transparent dark:border-blue-800/30 rounded-[32px] p-6 mb-8 shadow-xl shadow-[#1a234b]/20 dark:shadow-none relative overflow-hidden group active:scale-[0.98] transition-all"
        >
          {/* Decorative Elements */}
          <View className="absolute top-0 right-0 w-32 h-32 bg-white/5 dark:bg-blue-500/10 rounded-full -mr-12 -mt-12" pointerEvents="none" />
          <View className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 dark:bg-blue-500/10 rounded-full -ml-8 -mb-8" pointerEvents="none" />

          <View className="flex-row justify-between items-center z-10">
            <View className="flex-1">
              <View className="bg-emerald-500/20 self-start px-3 py-1 rounded-full mb-3 border border-emerald-500/30">
                <Text className="text-emerald-400 font-black text-[8px] uppercase tracking-[2px]">Verified Identity</Text>
              </View>
              <Text className="text-white text-2xl font-black tracking-tight mb-1">Digital Identity</Text>
              <Text className="text-white/60 text-xs font-medium">Access your official ID & QR pass</Text>
            </View>

            <View className="w-16 h-16 bg-white/10 dark:bg-blue-500/20 rounded-2xl items-center justify-center border border-white/20 dark:border-blue-400/20">
              <Ionicons name="id-card" size={32} color="#fff" />
            </View>
          </View>

          <View className="mt-6 flex-row items-center gap-2">
            <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Tap to expand</Text>
            <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.4)" />
          </View>
        </TouchableOpacity>

        {/* 3. Quick Actions Grid (Interconnected Modules) */}
        <Text className="text-lg font-bold text-[#1a234b] dark:text-white mb-4">Quick Access</Text>
        <View className="flex-row flex-wrap justify-between mb-8">

          {/* Attendance Module Button */}
          <TouchableOpacity 
            onPress={() => Alert.alert("Coming Soon", "The Attendance module is being synchronized with your local region.")}
            className="w-[48%] bg-white dark:bg-slate-800 p-5 rounded-2xl mb-4 border border-slate-100 dark:border-slate-700 shadow-sm items-center"
          >
            <View className="w-12 h-12 bg-blue-50 dark:bg-blue-500/20 rounded-full items-center justify-center mb-3">
              <Ionicons name="calendar-outline" size={24} color="#3b82f6" />
            </View>
            <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">Attendance</Text>
          </TouchableOpacity>

          {/* Document Module Button */}
          <TouchableOpacity 
            onPress={() => Alert.alert("Coming Soon", "The Document Vault is being prepared for your account.")}
            className="w-[48%] bg-white dark:bg-slate-800 p-5 rounded-2xl mb-4 border border-slate-100 dark:border-slate-700 shadow-sm items-center"
          >
            <View className="w-12 h-12 bg-amber-50 dark:bg-amber-500/20 rounded-full items-center justify-center mb-3">
              <Ionicons name="document-text-outline" size={24} color="#f59e0b" />
            </View>
            <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">Documents</Text>
          </TouchableOpacity>

          {/* Feedback Module Button */}
          <TouchableOpacity 
            onPress={() => Alert.alert("Feedback", "We value your input. This module will be available after your first successful ID scan.")}
            className="w-[48%] bg-white dark:bg-slate-800 p-5 rounded-2xl mb-4 border border-slate-100 dark:border-slate-700 shadow-sm items-center"
          >
            <View className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/20 rounded-full items-center justify-center mb-3">
              <Ionicons name="chatbubbles-outline" size={24} color="#10b981" />
            </View>
            <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">Feedback</Text>
          </TouchableOpacity>

          {/* Registration Settings Button */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/settings')}
            className="w-[48%] bg-white dark:bg-slate-800 p-5 rounded-2xl mb-4 border border-slate-100 dark:border-slate-700 shadow-sm items-center"
          >
            <View className="w-12 h-12 bg-purple-50 dark:bg-purple-500/20 rounded-full items-center justify-center mb-3">
              <Ionicons name="settings-outline" size={24} color="#8b5cf6" />
            </View>
            <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">Settings</Text>
          </TouchableOpacity>

        </View>

        {/* 4. Recent Activity */}
        <Text className="text-lg font-bold text-[#1a234b] dark:text-white mb-4">Recent Activity</Text>
        <View className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 mb-10 shadow-sm">
          <View className="flex-row items-center mb-4">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
            <View>
              <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">Account Verified</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">Today, 10:30 AM</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
            <View>
              <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">Registered for System Access</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">Yesterday</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}