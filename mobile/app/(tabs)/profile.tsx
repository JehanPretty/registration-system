import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image, Alert, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../constants/Config';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, updateProfile, updateProfilePicture, updateSignature, login } = useAuthStore((state: any) => state);
  const [showSkip, setShowSkip] = React.useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        login(userData);
      }
    } catch (error) {
      console.error("Refresh Error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      
      // 1. Update local state immediately for instant feedback
      updateProfilePicture(selectedUri);

      // 2. Upload to backend for persistence
      try {
        const formData = new FormData();
        const filename = selectedUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        formData.append('file', {
          uri: selectedUri,
          name: filename,
          type: type,
        } as any);

        const uploadRes = await fetch(`${API_BASE_URL}/uploads`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadRes.ok) {
          const { file_url } = await uploadRes.json();
          
          // 3. Update User on Server
          const updateRes = await fetch(`${API_BASE_URL}/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: file_url })
          });

          if (updateRes.ok) {
            // 4. Update local store with the server URL as well
            updateProfile({ avatar_url: file_url });
          }
        }
      } catch (error) {
        console.error("Profile Upload Error:", error);
        Alert.alert("Error", "Failed to sync profile picture to server.");
      }
    }
  };

  const pickSignature = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload your signature.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      
      // 1. Update local state immediately
      updateSignature(selectedUri);

      // 2. Upload to backend
      try {
        const formData = new FormData();
        const filename = selectedUri.split('/').pop() || 'signature.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        formData.append('file', {
          uri: selectedUri,
          name: filename,
          type: type,
        } as any);

        const uploadRes = await fetch(`${API_BASE_URL}/uploads`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadRes.ok) {
          const { file_url } = await uploadRes.json();
          
          // 3. Update User on Server
          const updateRes = await fetch(`${API_BASE_URL}/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signature_url: file_url })
          });

          if (updateRes.ok) {
            // 4. Update local store
            updateProfile({ signature_url: file_url });
          }
        }
      } catch (error) {
        console.error("Signature Upload Error:", error);
        Alert.alert("Error", "Failed to sync signature to server.");
      }
    }
  };

  // Resolve avatar: local URI wins, then try backend URL (prepend API_BASE_URL if relative)
  const resolveAvatar = () => {
    if (user?.profilePictureUri) return user.profilePictureUri;
    if (user?.avatarUrl) {
      if (user.avatarUrl.startsWith('http')) return user.avatarUrl;
      return `${API_BASE_URL}${user.avatarUrl}`;
    }
    return 'https://via.placeholder.com/150';
  };

  const resolveSignature = () => {
    if (user?.signatureUri) return user.signatureUri;
    if (user?.signatureUrl) {
      if (user.signatureUrl.startsWith('http')) return user.signatureUrl;
      return `${API_BASE_URL}${user.signatureUrl}`;
    }
    return null;
  };

  const avatarUri = resolveAvatar();
  const signatureUri = resolveSignature();

  return (
    <View className="flex-1 bg-white dark:bg-slate-900" style={{ paddingTop: insets.top + 12 }}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#1a234b"
            colors={["#1a234b"]}
          />
        }
      >

        {/* HEADER BAR */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <Text className="text-2xl font-black text-[#1a234b] dark:text-white">Profile</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} className="p-2">
            <Ionicons name="settings-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* PROFILE PICTURE & IDENTITY */}
        <View className="items-center mt-4">
          <View className="relative">
            <Image
              source={{
                uri: avatarUri
              }}
              className="w-32 h-32 rounded-full border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
            />

            <TouchableOpacity
              onPress={pickImage}
              className="absolute bottom-0 right-0 bg-[#1a234b] dark:bg-blue-600 p-2 rounded-full border-4 border-white dark:border-slate-900 shadow-sm"
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          </View>

          <View className="items-center mt-4">
            <Text className="text-xl font-black text-[#1a234b] dark:text-white">
              {user?.name || "User"}
            </Text>
            <Text className="text-slate-400 font-medium text-sm">
              {user?.email || "user@example.com"}
            </Text>

            {/* DYNAMIC VERIFICATION BADGE */}
            <View className="mt-4">
              {user?.status === 'verified' ? (
                <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 px-4 py-2 rounded-full shadow-sm shadow-emerald-900/10">
                  <Ionicons name="shield-checkmark" size={14} color="#059669" />
                  <Text className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] ml-2 tracking-tight uppercase">Verified Account</Text>
                </View>
              ) : user?.status === 'completed' || user?.isProfileComplete ? (
                <View className="flex-row items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 px-4 py-2 rounded-full shadow-sm shadow-blue-900/10">
                  <Ionicons name="time-outline" size={14} color="#3b82f6" />
                  <Text className="text-blue-700 dark:text-blue-400 font-bold text-[10px] ml-2 tracking-tight uppercase">Verification Pending</Text>
                </View>
              ) : (
                <View className="flex-row items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 px-4 py-2 rounded-full shadow-sm shadow-amber-900/10">
                  <Ionicons name="alert-circle-outline" size={14} color="#d97706" />
                  <Text className="text-amber-700 dark:text-amber-400 font-bold text-[10px] ml-2 tracking-tight uppercase">Registration Pending</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* VERIFICATION CTA - Profile Alert */}
        {!user?.isProfileComplete && !showSkip && (
          <View className="px-6 mt-8">
            <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 shadow-sm">
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
          </View>
        )}

        {/* SIGNATURE SECTION */}
        <View className="px-6 mt-10">
          <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-[#1a234b] dark:text-white">Personal Signature</Text>
              <TouchableOpacity onPress={pickSignature} accessibilityLabel={user?.signatureUri ? "Change signature" : "Upload signature"}>
                <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">{user?.signatureUri ? "Edit" : "Upload"}</Text>
              </TouchableOpacity>
          </View>

          {/* APPLICATION TIPS */}
          <View className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 rounded-2xl p-4 mb-4 flex-row items-center">
            <View className="w-8 h-8 bg-white dark:bg-slate-800 rounded-xl items-center justify-center shadow-sm border border-blue-100 dark:border-transparent">
              <Ionicons name="information-circle" size={18} color="#3b82f6" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-0.5">Application Tip</Text>
              <Text className="text-[9px] text-blue-700/70 dark:text-blue-200/70 font-bold leading-tight">
                Sign on clean <Text className="font-black text-blue-800 dark:text-blue-100">white paper</Text> using a <Text className="font-black text-blue-800 dark:text-blue-100">black pen</Text>. Ensure good lighting for best results.
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={pickSignature}
            className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-100 dark:border-slate-700 h-32 rounded-3xl items-center justify-center overflow-hidden"
          >
            {signatureUri ? (
              <Image 
                source={{ uri: signatureUri }} 
                className="w-full h-full" 
                resizeMode="contain" 
                style={{ mixBlendMode: 'multiply' } as any}
              />
            ) : (
              <View className="items-center">
                 <Ionicons name="pencil" size={32} color="#cbd5e1" className="dark:text-slate-600" />
                 <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-2">Tap to Upload Signature</Text>
                 <Text className="text-slate-300 dark:text-slate-600 font-medium text-[10px] mt-1 italic">Use a white background for best results</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* PERSONAL DETAILS SECTION */}
        <View className="px-6 mt-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-black text-[#1a234b] dark:text-white">Identity Profile</Text>
            <TouchableOpacity onPress={() => router.push('/complete-registration')}>
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">Update</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-2">
            <DetailField label="Full Identity" value={user?.name || "User"} />
            <DetailField label="Account Role" value={user?.role || "User"} />
            <DetailField label="System Email" value={user?.email || "user@example.com"} />
            
            {/* DYNAMIC ATTRIBUTES (Accuracy Fix) */}
            {user?.attributes && Object.entries(user.attributes)
              .filter(([key]) => !['completed_at', 'is_profile_complete', 'registration_step'].includes(key))
              .map(([key, value]: [string, any]) => (
                <DetailField 
                  key={key} 
                  label={formatKey(key)} 
                  value={String(value || "Not provided")} 
                />
              ))
            }
          </View>
        </View>

        {/* UPLOADED DOCUMENTS SECTION */}
        <View className="px-6 mt-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-black text-[#1a234b] dark:text-white">Uploaded Documents</Text>
            <TouchableOpacity className="bg-[#1a234b] dark:bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center">
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-white font-bold text-xs ml-1">Add New</Text>
            </TouchableOpacity>
          </View>

          <DocumentCard title="Passport_Copy.pdf" date="12 Oct 2023" type="pdf" />
          <DocumentCard title="Driver_License_Front.jpg" date="15 Oct 2023" type="image" />
        </View>

        {/* LOGOUT BUTTON */}
        <View className="px-6 mt-10">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-[#1a234b] dark:bg-red-500/20 dark:border dark:border-red-500/50 flex-row items-center justify-center py-4 rounded-2xl shadow-lg shadow-blue-900/20 dark:shadow-none"
          >
            <Ionicons name="log-out-outline" size={20} color="white" className="dark:text-red-400" />
            <Text className="text-white dark:text-red-400 font-bold text-lg ml-2">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, ' ');
};

const DetailField = ({ label, value }: { label: string, value: string }) => (
  <View className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl mt-2">
    <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">{label}</Text>
    <Text className="text-[#1a234b] dark:text-white font-bold text-base">{value}</Text>
  </View>
);

const DocumentCard = ({ title, date, type }: { title: string, date: string, type: 'pdf' | 'image' }) => (
  <View className="flex-row items-center bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-4 rounded-2xl mb-3">
    <View className={`p-3 rounded-xl ${type === 'pdf' ? 'bg-red-50 dark:bg-red-500/20' : 'bg-blue-50 dark:bg-blue-500/20'}`}>
      <Ionicons name={type === 'pdf' ? "document-text" : "image"} size={24} color={type === 'pdf' ? "#ef4444" : "#3b82f6"} />
    </View>
    <View className="flex-1 ml-4">
      <Text className="text-[#1a234b] dark:text-slate-200 font-bold text-sm" numberOfLines={1}>{title}</Text>
      <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Uploaded {date}</Text>
    </View>
    <TouchableOpacity className="p-2">
      <Ionicons name="trash-outline" size={20} color="#94a3b8" className="dark:text-slate-500" />
    </TouchableOpacity>
  </View>
);
