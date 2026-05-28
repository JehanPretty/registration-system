import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../constants/Config';

type NotifType = 'success' | 'info' | 'warning' | 'alert';

interface Notification {
  id: string | number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  isPersistent?: boolean;
}

const iconMap: Record<NotifType, { name: any; color: string; bg: string; darkBg: string }> = {
  success: { name: 'checkmark-circle', color: '#10b981', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-500/10' },
  info:    { name: 'information-circle', color: '#3b82f6', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-500/10' },
  warning: { name: 'time', color: '#f59e0b', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-500/10' },
  alert:   { name: 'alert-circle', color: '#ef4444', bg: 'bg-red-50', darkBg: 'dark:bg-red-500/10' },
};

import { useNotificationStore } from '../../store/notificationStore';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore() as any;
  const { 
    userApp, 
    adminPendingCount, 
    unreadIds, 
    dismissedIds, 
    fetchNotifications, 
    markRead, 
    markAllRead, 
    dismiss 
  } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifications = useMemo(() => {
    const list: Notification[] = [];

    // Admin Notification
    if (adminPendingCount > 0 && !dismissedIds.has('admin-pending')) {
      list.push({
        id: 'admin-pending',
        type: 'info',
        title: 'Pending ID Applications',
        message: `There are ${adminPendingCount} new applications waiting for review in the dock.`,
        time: 'Real-time',
        read: false,
        isPersistent: true
      });
    }

    // User Application Status Notification (Mirror Web Logic)
    if (userApp && !dismissedIds.has(`user-app-${userApp.status}`)) {
      let title = "PVC ID Request Status";
      let message = "";
      let type: NotifType = 'info';

      switch (userApp.status) {
        case 'pending':
          message = "Your PVC Request has been submitted and is currently pending registrar review.";
          type = 'warning';
          break;
        case 'rejected':
          message = "Your PVC Request was rejected by the registrar. Please check your profile details.";
          type = 'alert';
          break;
        case 'approved':
          message = "Your PVC card has been approved! It is currently queued in print production.";
          type = 'success';
          break;
        case 'printed':
          if (userApp.fulfillment_method === 'delivery') {
            message = userApp.tracking_number 
              ? `Your PVC card has been shipped via J&T Express! Tracking No: ${userApp.tracking_number}.`
              : "Your PVC card has been printed! We are packaging it for shipment.";
          } else {
            message = userApp.is_ready
              ? `ID Ready for Pickup! Your physical PVC ID is ready for pick-up at: ${userApp.collection_location || "Main Registrar Windows"}.`
              : "Your PVC card has been printed! Our team is currently filing it in organizing drawers.";
          }
          type = 'success';
          break;
        case 'completed':
          message = "Fulfillment Complete! Your physical PVC ID card handover is successfully recorded.";
          type = 'success';
          break;
      }

      if (message) {
        list.push({
          id: `user-app-${userApp.status}`,
          type,
          title,
          message,
          time: 'Active',
          read: false,
          isPersistent: true
        });
      }
    }

    return list;
  }, [adminPendingCount, userApp, dismissedIds]);

  const unreadCount = notifications.filter((n: Notification) => unreadIds.has(n.id)).length;
  const displayed = filter === 'unread' ? notifications.filter((n: Notification) => unreadIds.has(n.id)) : notifications;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={{ paddingTop: insets.top }}>
      
      {/* HEADER */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-[#1a234b] dark:text-white tracking-tight">Notifications</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllRead}
              className="bg-[#1a234b] dark:bg-blue-600 px-4 py-2 rounded-xl"
            >
              <Text className="text-white text-[10px] font-black tracking-widest uppercase">Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FILTER PILLS */}
        <View className="flex-row gap-2 mt-4">
          {(['all', 'unread'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              className={`px-5 py-2 rounded-full border ${
                filter === tab
                  ? 'bg-[#1a234b] dark:bg-blue-600 border-transparent'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text className={`text-xs font-bold capitalize ${
                filter === tab ? 'text-white' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {tab}{tab === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* NOTIFICATION LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, gap: 12 }}
      >
        {displayed.length === 0 ? (
          <View className="items-center justify-center py-24">
            <View className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-4">
              <Ionicons name="notifications-off-outline" size={36} color="#94a3b8" />
            </View>
            <Text className="text-slate-400 dark:text-slate-500 font-bold text-sm">No notifications here</Text>
          </View>
        ) : (
          displayed.map((notif: Notification) => {
            const icon = iconMap[notif.type];
            const isUnread = unreadIds.has(notif.id);
            return (
              <TouchableOpacity
                key={notif.id}
                activeOpacity={0.85}
                onPress={() => markRead(notif.id)}
                className={`rounded-[24px] p-4 border ${
                  !isUnread
                    ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-800 border-[#1a234b]/20 dark:border-blue-600/30'
                }`}
                style={!isUnread ? {} : { shadowColor: '#1a234b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
              >
                <View className="flex-row items-start gap-3">
                  {/* Icon */}
                  <View className={`w-11 h-11 rounded-2xl items-center justify-center flex-shrink-0 ${icon.bg} ${icon.darkBg}`}>
                    <Ionicons name={icon.name} size={22} color={icon.color} />
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text className={`text-sm font-black tracking-tight ${!isUnread ? 'text-slate-600 dark:text-slate-300' : 'text-[#1a234b] dark:text-white'}`}>
                        {notif.title}
                      </Text>
                      {isUnread && (
                        <View className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 ml-2 mt-1 flex-shrink-0" />
                      )}
                    </View>
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {notif.message}
                    </Text>
                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                        {notif.time}
                      </Text>
                      <TouchableOpacity
                        onPress={() => dismiss(notif.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text className="text-[10px] text-slate-300 dark:text-slate-600 font-black">Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
