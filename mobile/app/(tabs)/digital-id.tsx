import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, useWindowDimensions, Alert, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../constants/Config';
import FormalPhoto from '../../assets/images/Formal_photo.jpg';
import InformalPhoto from '../../assets/images/Informal_photo.png';
import AddressForm from '../../components/AddressForm';

const CHALLENGES = [
  { id: 'left',   instruction: 'Turn your head left ←',    frames: 6,  check: (face: any) => face.yawAngle > 18 },
  { id: 'right',  instruction: 'Turn your head right →',   frames: 6,  check: (face: any) => face.yawAngle < -18 },
  { id: 'center', instruction: 'Look straight at camera', frames: 8,  check: (face: any) => Math.abs(face.yawAngle) < 6 },
];

const TOTAL_FRAMES = 20;

const ProgressTracker = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, label: "Data & Uploads" },
    { id: 2, label: "Biometric Syncing" },
    { id: 3, label: "Submission" },
  ];

  return (
    <View style={{ width: '100%', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: 'white', borderColor: '#f1f5f9', borderWidth: 1, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', paddingHorizontal: 12 }}>
        <View style={{ position: 'absolute', top: 12, left: 24, right: 24, height: 2, backgroundColor: '#f1f5f9', zIndex: 0 }}>
          <View
            style={{ height: '100%', backgroundColor: '#1a234b', width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </View>

        {steps.map((step) => {
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;

          return (
            <View key={step.id} style={{ position: 'relative', zIndex: 10, alignItems: 'center' }}>
              <View
                style={{
                  width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
                  backgroundColor: isActive ? '#1a234b' : 'white',
                  borderColor: isActive ? '#1a234b' : '#e2e8f0',
                  transform: isCurrent ? [{ scale: 1.1 }] : [{ scale: 1 }],
                  ...(isCurrent && { shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 })
                }}
              >
                {isActive ? (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                ) : (
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#94a3b8' }}>{step.id}</Text>
                )}
              </View>
              <Text style={{ fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5, color: isActive ? '#1a234b' : '#cbd5e1', textAlign: 'center' }}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export function DigitalIDCardComponent({ user, template: propTemplate }: { user: any, template?: any }) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  const template = {
    primary_color: '#1a234b',
    secondary_color: '#2563eb',
    header_text: null,
    institution_name: 'Philceb Innovation',
    institution_subtitle: 'Empowering Technology',
    template_style: 'corporate',
    orientation: 'portrait',
    show_avatar: true,
    show_qr: true,
    show_id_number: true,
    show_barcode: true,
    show_user_signature: true,
    authorized_name: 'Registrar',
    signature_label: 'Authorized Signature',
    ...propTemplate
  };

  const isLandscapeTemplate = (template?.orientation || propTemplate?.orientation || '').toLowerCase() === 'landscape';
  const isPortrait = !isLandscapeTemplate;

  const CARD_WIDTH = isPortrait ? (windowWidth * 0.88) : (windowWidth * 0.95);
  const CARD_HEIGHT = isPortrait ? (CARD_WIDTH * 500) / 320 : (CARD_WIDTH * 320) / 500;
  const s = isPortrait ? (CARD_WIDTH / 320) : (CARD_WIDTH / 500);

  const primary = template.primary_color || '#1a234b';
  const secondary = template.secondary_color || '#2563eb';
  const style = template.template_style || 'corporate';
  const displayName = user?.name || "Alex Johnson";
  const displayRole = user?.role || user?.role_context || "Representative";
  const displayID = user?.external_id || "REG-2026-0001";

  const resolveImageUrl = (url: string) => {
    if (!url) return url;
    if (typeof url === 'string') {
      if (url.startsWith('data:')) return url;
      if (url.startsWith('/static')) return `${API_BASE_URL}${url}`;
      if (url.startsWith('/uploads')) return `${API_BASE_URL}${url.replace('/uploads', '/static')}`;
      if (url.includes('/static/') && url.startsWith('http')) {
        const path = '/static/' + url.split('/static/').pop();
        return `${API_BASE_URL}${path}`;
      }
    }
    return url;
  };

  const resolveImageSource = (url: string) => {
    const resolvedUrl = resolveImageUrl(url);
    if (!resolvedUrl) return null;
    if (resolvedUrl && typeof resolvedUrl === 'string' && resolvedUrl.startsWith('http')) {
      return { uri: resolvedUrl, headers: { 'Bypass-Tunnel-Reminder': 'true' } };
    }
    return { uri: resolvedUrl };
  };

  const avatar = resolveImageUrl(user?.attributes?.id_picture) || user?.id_picture || user?.profilePictureUri || user?.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop";
  const signatureImage = resolveImageUrl(user?.attributes?.signature) || user?.signature || user?.signatureUri || user?.signatureUrl;
  const logoUrl = resolveImageUrl(template.logo_url);

  const qrPayload = JSON.stringify({
    id: displayID,
    name: displayName,
    role: displayRole,
    sys_id: user?.id || "preview"
  }) || "invalid-payload";

  const ensureContrast = (color) => {
    if (color && (color.toLowerCase() === "#ffffff" || color.toLowerCase() === "white")) {
        return "#1e293b";
    }
    return color;
  };

  const Barcode = ({ color = '#000', opacity = 0.3 }) => (
    <View style={{ height: 48 * s, width: '100%', maxWidth: 240 * s, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', opacity }}>
      {[1, 2, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 2, 1, 2].map((w, i) => (
        <View key={i} style={{ width: w * s, height: '100%', backgroundColor: color, marginRight: 2 * s }} />
      ))}
    </View>
  );

  const BrandHeader = ({ light = true, compact = false }) => {
    const headerText = (template.header_text !== undefined && template.header_text !== null) ? template.header_text : "Republic of the Philippines";
    const instName = (template.institution_name !== undefined && template.institution_name !== null) ? template.institution_name : "Philceb Innovation";
    const instSub = (template.institution_subtitle !== undefined && template.institution_subtitle !== null) ? template.institution_subtitle : "Empowering Technology";
    
    const hSize = (template.header_font_size || (compact ? 5 : 6)) * s;
    const iSize = (template.institution_font_size || (compact ? 10 : 12)) * s;
    const sSize = (template.subtitle_font_size || (compact ? 6 : 7)) * s;
    const lSize = (template.logo_size || (compact ? 36 : 48)) * s;

    const getBrandColor = (customColor, defaultLight, defaultDark) => {
      if (!customColor) return light ? defaultLight : defaultDark;
      if (!light && (customColor.toLowerCase() === '#ffffff' || customColor.toLowerCase() === 'white')) {
          return defaultDark;
      }
      return customColor;
    };

    const hColor = getBrandColor(template.header_color, 'rgba(255,255,255,0.6)', 'rgba(100,116,139,0.6)');
    const iColor = getBrandColor(template.institution_color, '#ffffff', '#1e1b4b');
    const sColor = getBrandColor(template.subtitle_color, 'rgba(255,255,255,0.5)', 'rgba(100,116,139,0.5)');

    return (
      <View style={{ flexDirection: compact ? 'row' : 'column', alignItems: 'center', gap: 12 * s }}>
        {logoUrl && <Image source={resolveImageSource(logoUrl)} style={{ width: lSize, height: lSize }} contentFit="contain" />}
        <View style={{ alignItems: compact ? 'flex-start' : 'center' }}>
          {headerText ? <Text style={{ fontSize: hSize, fontWeight: '900', color: hColor, letterSpacing: 1.5 * s, marginBottom: 1 * s }}>{headerText}</Text> : null}
          <Text style={{ fontSize: iSize, fontWeight: '900', color: iColor, letterSpacing: 0.5 * s, textAlign: compact ? 'left' : 'center' }}>{instName}</Text>
          {instSub ? <Text style={{ fontSize: sSize, fontWeight: '700', color: sColor, letterSpacing: 1 * s, marginTop: 1 * s, textAlign: compact ? 'left' : 'center' }}>{instSub}</Text> : null}
        </View>
      </View>
    );
  };

  if (!propTemplate) {
    return (
      <View style={{ width: '100%', height: 400, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1a234b" />
        <Text style={{ marginTop: 12, fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>Digital ID Loading...</Text>
      </View>
    );
  }

  const renderFront = () => {
    switch (style) {
      case 'corporate':
        if (isPortrait) {
          return (
            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 24 * s, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
              <View style={{ height: 200 * s, backgroundColor: primary, position: 'relative', overflow: 'hidden', paddingTop: 24 * s }}>
                {template.custom_front_bg_url ? (
                  <View style={{ position: 'absolute', inset: 0, backgroundColor: primary }}>
                    {/* Use raw image with opacity for deeper color blending on mobile */}
                    <Image source={resolveImageSource(template.custom_front_bg_url)} style={{ width: '100%', height: '100%', opacity: 0.4 }} contentFit="cover" />
                    <LinearGradient colors={['transparent', 'rgba(255,255,255,0.4)', 'white']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 * s }} />
                  </View>
                ) : (
                  <View style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundColor: secondary }} />
                )}
                <View style={{ paddingHorizontal: 16 * s, zIndex: 10 }}><BrandHeader light={true} compact={false} /></View>
              </View>
              {template.show_avatar && (
                <View style={{ alignItems: 'center', marginTop: -65 * s, zIndex: 20 }}>
                  <View style={{ width: 130 * s, height: 130 * s, borderRadius: 65 * s, borderWidth: 6 * s, borderColor: 'white', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 * s, elevation: 15, backgroundColor: 'white' }}>
                    <Image source={resolveImageSource(avatar)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                </View>
              )}
              <View style={{ flex: 1, alignItems: 'center', paddingTop: 24 * s, paddingHorizontal: 32 * s }}>
                <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.custom_front_bg_url ? (template.name_color || '#ffffff') : ensureContrast(template.name_color || primary) }}>{displayName}</Text>
                <View style={{ height: 2 * s, width: 32 * s, backgroundColor: secondary, marginVertical: 12 * s }} />
                <Text style={{ fontSize: (template.role_font_size || 11) * s, fontWeight: '900', color: template.custom_front_bg_url ? (template.role_color || secondary) : ensureContrast(template.role_color || secondary), letterSpacing: 3 * s }}>{displayRole}</Text>
                <View style={{ flex: 1, width: '100%', borderTopWidth: 1, borderColor: '#f8fafc', marginTop: 'auto', marginBottom: 16 * s }} />
              </View>
              <View style={{ paddingHorizontal: 32 * s, paddingBottom: 32 * s, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                {template.show_qr && <View style={{ padding: 10 * s, backgroundColor: '#f8fafc', borderRadius: 16 * s, borderWidth: 1, borderColor: '#f1f5f9' }}><QRCode value={qrPayload} size={60 * s} color={primary} /></View>}
                {template.show_id_number && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 8 * s, fontWeight: '900', color: '#cbd5e1', letterSpacing: 3 * s, textTransform: 'uppercase', marginBottom: 4 * s }}>ID Number</Text>
                    <Text style={{ fontSize: (template.id_number_font_size || 11) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 3 * s }}>{displayID}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        } else {
          return (
            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 24 * s, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row' }}>
              <View style={{ width: 40 * s, height: '100%', backgroundColor: primary }} />
              <View style={{ flex: 1, padding: 32 * s, position: 'relative', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 32 * s }}>
                {template.custom_front_bg_url && (
                  <View style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: primary }}>
                    <Image source={resolveImageSource(template.custom_front_bg_url)} style={{ width: '100%', height: '100%', opacity: 0.5 }} contentFit="cover" />
                    <LinearGradient colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.2)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', inset: 0 }} />
                  </View>
                )}
                <View style={{ position: 'absolute', top: 24 * s, left: 32 * s, zIndex: 20 }}>
                    <BrandHeader light={false} compact={true} />
                </View>
                {template.show_avatar && (
                  <View style={{ width: 140 * s, height: 140 * s, borderRadius: 16 * s, overflow: 'hidden', borderWidth: 4 * s, borderColor: '#f8fafc', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 * s, elevation: 5, backgroundColor: 'white', marginTop: 48 * s, position: 'relative', zIndex: 10 }}>
                    <Image source={resolveImageSource(avatar)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1, height: '100%', paddingTop: 100 * s, position: 'relative', zIndex: 10 }}>
                  <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.custom_front_bg_url ? (template.name_color || '#ffffff') : ensureContrast(template.name_color || primary) }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '900', color: template.custom_front_bg_url ? (template.role_color || secondary) : ensureContrast(template.role_color || secondary), marginTop: 2 * s, letterSpacing: 3 * s }}>{displayRole}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 7 * s, color: template.custom_front_bg_url ? 'rgba(255,255,255,0.5)' : '#cbd5e1', fontWeight: '900', textTransform: 'uppercase' }}>ID Number</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 9) * s, fontWeight: '900', color: template.custom_front_bg_url ? (template.id_number_color || '#ffffff') : ensureContrast(template.id_number_color || primary), letterSpacing: 3 * s }}>{displayID}</Text>
                      </View>
                    )}
                    {template.show_qr && <View style={{ padding: 6 * s, backgroundColor: 'white', borderRadius: 12 * s, borderWidth: 1, borderColor: '#f1f5f9' }}><QRCode value={qrPayload} size={44 * s} color={ensureContrast(primary)} /></View>}
                  </View>
                </View>
              </View>
            </View>
          );
        }
      case 'modern':
        return (
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 40 * s, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
            <View style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              <LinearGradient colors={[primary, secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
              <View style={{ position: 'absolute', top: -20 * s, right: -20 * s, width: 256 * s, height: 256 * s, borderRadius: 128 * s, backgroundColor: 'rgba(255,255,255,0.1)' }} />
              {template.custom_front_bg_url && <Image source={resolveImageSource(template.custom_front_bg_url)} style={{ position: 'absolute', inset: 0, opacity: 0.4 }} contentFit="cover" />}
            </View>
            <View style={{ zIndex: 10, flex: 1, alignItems: 'center', paddingTop: 48 * s, paddingHorizontal: 24 * s }}>
              <View style={{ marginBottom: 32 * s }}><BrandHeader light={true} compact={false} /></View>
              {template.show_avatar && (
                <View style={{ width: 160 * s, height: 160 * s, borderRadius: 48 * s, overflow: 'hidden', borderWidth: 4 * s, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 * s, elevation: 15, marginBottom: 32 * s }}>
                  <Image source={resolveImageSource(avatar)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
              )}
              <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.name_color || 'white', textAlign: 'center' }}>{displayName}</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16 * s, paddingVertical: 6 * s, borderRadius: 20 * s, marginTop: 12 * s, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '900', color: template.role_color || 'white', letterSpacing: 2 * s }}>{displayRole}</Text>
              </View>
              <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 40 * s, paddingHorizontal: 32 * s }}>
                {template.show_qr && <View style={{ backgroundColor: 'white', padding: 12 * s, borderRadius: 16 * s }}><QRCode value={qrPayload} size={64 * s} color={primary} /></View>}
                {template.show_id_number && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 8 * s, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>ID Number</Text>
                    <Text style={{ fontSize: (template.id_number_font_size || 16) * s, fontWeight: '900', color: template.id_number_color || 'white', letterSpacing: 4 * s }}>{displayID}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      case 'academic':
        return (
          <View style={{ flex: 1, backgroundColor: 'white', borderWidth: 2, borderColor: primary, borderRadius: 20 * s, overflow: 'hidden' }}>
            <View style={{ height: 64 * s, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
              {template.custom_front_bg_url && <Image source={resolveImageSource(template.custom_front_bg_url)} style={{ position: 'absolute', inset: 0, opacity: 0.4 }} contentFit="cover" />}
              <BrandHeader light={true} compact={true} />
            </View>
            <View style={{ height: 3 * s, backgroundColor: secondary }} />
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 32 * s, paddingTop: 24 * s }}>
              {template.show_avatar && (
                <View style={{ width: 110 * s, height: 140 * s, borderWidth: 2 * s, borderColor: primary, overflow: 'hidden', marginBottom: 16 * s }}>
                  <Image source={resolveImageSource(avatar)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
              )}
              <Text style={{ fontSize: (template.name_font_size || 18) * s, fontWeight: '900', color: template.name_color || primary, textAlign: 'center' }}>{displayName}</Text>
              <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: template.role_color || secondary, marginTop: 4 * s }}>{displayRole}</Text>
              <View style={{ width: '100%', borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#e2e8f0', marginVertical: 16 * s }} />
              {template.show_id_number && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 * s, color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase' }}>ID Number</Text>
                  <Text style={{ fontSize: (template.id_number_font_size || 14) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 4 * s }}>{displayID}</Text>
                </View>
              )}
              {template.show_qr && <View style={{ marginTop: 'auto', marginBottom: 24 * s, padding: 12 * s, borderWidth: 2, borderStyle: 'dashed', borderColor: primary + '30', borderRadius: 16 * s }}><QRCode value={qrPayload} size={64 * s} color={primary} /></View>}
            </View>
          </View>
        );
      case 'minimal':
        return (
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 28 * s, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
            <View style={{ height: 4 * s, backgroundColor: secondary }} />
            <View style={{ flex: 1, padding: 32 * s, alignItems: 'center' }}>
              <BrandHeader light={false} compact={true} />
              {template.show_avatar && (
                <View style={{ width: 100 * s, height: 100 * s, borderRadius: 50 * s, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', marginVertical: 24 * s }}>
                  <Image source={resolveImageSource(avatar)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
              )}
              <Text style={{ fontSize: (template.name_font_size || 22) * s, fontWeight: '900', color: template.name_color || '#1e293b' }}>{displayName}</Text>
              <View style={{ width: 32 * s, height: 2 * s, backgroundColor: secondary, marginVertical: 12 * s }} />
              <Text style={{ fontSize: (template.role_font_size || 10) * s, color: template.role_color || secondary, fontWeight: '900', letterSpacing: 2 * s }}>{displayRole}</Text>
              <View style={{ marginTop: 'auto', width: '100%', borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 16 * s, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                 {template.show_id_number && <Text style={{ fontSize: (template.id_number_font_size || 9) * s, fontWeight: '900', color: template.id_number_color || '#cbd5e1', letterSpacing: 3 * s }}>{displayID}</Text>}
                 {template.show_qr && <QRCode value={qrPayload} size={48 * s} color={primary} />}
              </View>
            </View>
          </View>
        );
      case 'bold':
        return (
          <View style={{ flex: 1, backgroundColor: primary, borderRadius: 32 * s, overflow: 'hidden', position: 'relative' }}>
            <View style={{ position: 'absolute', top: -40 * s, right: -40 * s, width: 240 * s, height: 240 * s, borderRadius: 120 * s, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            {template.custom_front_bg_url && <Image source={resolveImageSource(template.custom_front_bg_url)} style={{ position: 'absolute', inset: 0, opacity: 0.4 }} contentFit="cover" />}
            <View style={{ flex: 1, padding: 32 * s, alignItems: isPortrait ? 'center' : 'flex-start', justifyContent: 'center' }}>
              <View style={{ marginBottom: 32 * s }}><BrandHeader light={true} compact={false} /></View>
              <View style={{ flexDirection: isPortrait ? 'column' : 'row', alignItems: 'center', gap: 32 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 140 * s, height: 140 * s, borderRadius: 70 * s, borderWidth: 4 * s, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                    <Image source={resolveImageSource(avatar)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ alignItems: isPortrait ? 'center' : 'flex-start' }}>
                  <Text style={{ fontSize: (template.name_font_size || 28) * s, fontWeight: '900', color: template.name_color || 'white', textAlign: isPortrait ? 'center' : 'left' }}>{displayName}</Text>
                  <View style={{ backgroundColor: secondary, paddingHorizontal: 16 * s, paddingVertical: 6 * s, borderRadius: 20 * s, marginTop: 8 * s }}>
                    <Text style={{ fontSize: (template.role_font_size || 9) * s, fontWeight: '900', color: template.role_color || 'white' }}>{displayRole}</Text>
                  </View>
                </View>
              </View>
              <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                 {template.show_qr && <View style={{ backgroundColor: 'white', padding: 8 * s, borderRadius: 12 * s }}><QRCode value={qrPayload} size={56 * s} color={primary} /></View>}
                 {template.show_id_number && (
                   <View style={{ alignItems: 'flex-end' }}>
                     <Text style={{ fontSize: 7 * s, color: 'rgba(255,255,255,0.4)', fontWeight: '900' }}>ID Number</Text>
                     <Text style={{ fontSize: (template.id_number_font_size || 11) * s, fontWeight: '900', color: template.id_number_color || 'white', letterSpacing: 4 * s }}>{displayID}</Text>
                   </View>
                 )}
              </View>
            </View>
          </View>
        );
      default: return null;
    }
  };

  const renderBack = () => {
    const isBackDark = !!template.custom_back_bg_url || style === "modern" || style === "bold" || style === "professional";
    const mainColor = isBackDark ? "#ffffff" : "#1e293b";
    const subColor = isBackDark ? "rgba(255,255,255,0.6)" : "#94a3b8";
    const accentColor = isBackDark ? "rgba(255,255,255,0.8)" : (secondary || "#6366f1");
    
    return (
      <View style={{ flex: 1, backgroundColor: isBackDark ? primary : 'white', borderRadius: 24 * s, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
        <View style={{ height: 40 * s, backgroundColor: primary, opacity: 0.8 }} />
        <View style={{ flex: 1, padding: 32 * s, alignItems: 'center' }}>
          {template.custom_back_bg_url && (
            <View style={{ position: 'absolute', inset: 0, backgroundColor: primary }}>
              <Image source={resolveImageSource(template.custom_back_bg_url)} style={{ width: '100%', height: '100%', opacity: 0.5 }} contentFit="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </View>
          )}
          <View style={{ marginBottom: 32 * s, width: '100%', alignItems: 'center', zIndex: 10 }}>
            <Text style={{ fontSize: 11 * s, fontWeight: '900', color: mainColor, marginBottom: 8 * s }}>Terms & Conditions</Text>
            <Text style={{ fontSize: 8 * s, color: subColor, fontWeight: '700', fontStyle: 'italic', textAlign: 'center', lineHeight: 14 * s }}>
              {template.back_content || "This card is the property of the issuing institution. If found, please return to the nearest security office."}
            </Text>
          </View>
          <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ height: 40 * s, marginBottom: -10 * s, zIndex: 10 }}>
                {signatureImage && <Image source={resolveImageSource(signatureImage)} style={{ width: 100 * s, height: 60 * s }} contentFit="contain" />}
              </View>
              <Text style={{ fontSize: 9 * s, fontWeight: '900', color: mainColor, paddingTop: 8 * s }}>{displayName}</Text>
              <View style={{ width: 80 * s, height: 1, backgroundColor: isBackDark ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.1)", marginVertical: 4 * s }} />
              <Text style={{ fontSize: 6 * s, fontWeight: '900', color: accentColor }}>{displayRole}'s Signature</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ height: 40 * s, marginBottom: -10 * s, zIndex: 10 }}>
                {template.authorized_signature_url && <Image source={resolveImageSource(template.authorized_signature_url)} style={{ width: 100 * s, height: 60 * s }} contentFit="contain" />}
              </View>
              <Text style={{ fontSize: 9 * s, fontWeight: '900', color: mainColor, paddingTop: 8 * s }}>{template.authorized_name || "Registrar"}</Text>
              <View style={{ width: 80 * s, height: 1, backgroundColor: isBackDark ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.1)", marginVertical: 4 * s }} />
              <Text style={{ fontSize: 6 * s, fontWeight: '900', color: accentColor }}>{template.signature_label || "Authorized"}</Text>
            </View>
          </View>
          {template.show_barcode && (
            <View style={{ marginTop: 32 * s, alignItems: 'center', width: '100%', zIndex: 10 }}>
              <Barcode color={isBackDark ? 'white' : primary} />
              <Text style={{ fontSize: 8 * s, fontWeight: '900', color: subColor, letterSpacing: 4 * s, marginTop: 4 * s }}>{displayID}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 20, padding: 4, marginBottom: 24 }}>
        <TouchableOpacity onPress={() => setSide('front')} style={{ paddingHorizontal: 24, paddingVertical: 8, borderRadius: 16, backgroundColor: side === 'front' ? '#1a234b' : 'transparent' }}>
          <Text style={{ color: side === 'front' ? 'white' : '#64748b', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>Front Side</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSide('back')} style={{ paddingHorizontal: 24, paddingVertical: 8, borderRadius: 16, backgroundColor: side === 'back' ? '#1a234b' : 'transparent' }}>
          <Text style={{ color: side === 'back' ? 'white' : '#64748b', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>Back Side</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20 }}>
        {side === 'front' ? renderFront() : renderBack()}
      </View>
    </View>
  );
}

export default function DigitalIDScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [idPhoto, setIdPhoto] = useState<string | null>(user?.attributes?.id_picture || null);
  const [signature, setSignature] = useState<string | null>(user?.attributes?.signature || null);
  const [localIdPhotoUri, setLocalIdPhotoUri] = useState<string | null>(null);
  const [localSignatureUri, setLocalSignatureUri] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [isAnalyzingSignature, setIsAnalyzingSignature] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<'idle' | 'analyzing' | 'verified' | 'error'>(user?.attributes?.id_picture ? 'verified' : 'idle');
  const [signatureStatus, setSignatureStatus] = useState<'idle' | 'analyzing' | 'verified' | 'error'>(user?.attributes?.signature ? 'verified' : 'idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClaimingModal, setShowClaimingModal] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'delivery' | null>(null);
  const [shippingAddress, setShippingAddress] = useState<any>({});

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!user?.role) return;
      try {
        const response = await fetch(`${API_BASE_URL}/id-builder/${encodeURIComponent(user.role)}`, {
          headers: { 'bypass-tunnel-reminder': 'true' }
        });
        if (response.ok) {
          const data = await response.json();
          setTemplate(data);
        }
      } catch (error) {
        console.error("Failed to fetch ID template:", error);
      }
    };
    const fetchApplicationStatus = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`${API_BASE_URL}/applications/user/${user.id}`, { headers: { 'bypass-tunnel-reminder': 'true' } });
        if (response.ok) {
          const app = await response.json();
          setApplication(app);
          if (app && app.status !== 'rejected') {
            updateProfile({ attributes: { ...user.attributes, has_applied_for_id: true } });
          }
        }
      } catch (error) {
        console.log("No existing application found:", error);
      }
    };
    fetchTemplate();
    const interval = setInterval(fetchApplicationStatus, 10000);
    fetchApplicationStatus();
    return () => clearInterval(interval);
  }, [user?.role, user?.id]);

  useEffect(() => {
    if (application) {
      if (application.fulfillment_method) {
        setFulfillmentMethod(application.fulfillment_method);
      }
      if (application.status && application.status !== 'rejected') {
        updateProfile({ attributes: { ...user.attributes, has_applied_for_id: true } });
      }
    }
  }, [application]);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [livenessPhase, setLivenessPhase] = useState<'idle' | 'aligning' | 'scanning' | 'matching' | 'success'>('idle');
  const [livenessInstruction, setLivenessInstruction] = useState('Position your face in the frame');
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const [facePositionHint, setFacePositionHint] = useState('');
  const livenessRef = useRef({ challengeIndex: 0, holdFrames: 0, accumulated: 0 });
  const isDetecting = useRef(false);
  const currentPoseRef = useRef('none');
  const challengeTimerRef = useRef<any>(null);
  const detectionTimerRef = useRef<any>(null);

  const hasApplied = user?.attributes?.has_applied_for_id === true;

  const verifyFaceOnBackend = async (uri: string) => {
    try {
      setIsAnalyzingPhoto(true);
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', { uri, name: 'formal_photo.jpg', type: 'image/jpeg' });
      const response = await fetch(`${API_BASE_URL}/detect-face`, { method: 'POST', body: formData, headers: { 'bypass-tunnel-reminder': 'true' } });
      const result = await response.json();
      if (result.face_detected && result.is_formal) {
        setPhotoStatus('verified');
        if (result.processed_url) setIdPhoto(`${API_BASE_URL}${result.processed_url}`);
      } else {
        setPhotoStatus('error');
        setIdPhoto(null);
        Alert.alert("Invalid Photo", result.reason || "Please ensure the photo is formal with a white background.");
      }
    } catch (error) {
      setPhotoStatus('error');
      Alert.alert("Error", "Face verification failed.");
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const verifySignatureOnBackend = async (uri: string) => {
    try {
      setIsAnalyzingSignature(true);
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', { uri, name: 'signature.jpg', type: 'image/jpeg' });
      const response = await fetch(`${API_BASE_URL}/detect-face/detect-signature`, { method: 'POST', body: formData, headers: { 'bypass-tunnel-reminder': 'true' } });
      const result = await response.json();
      if (result.is_signature) {
        setSignatureStatus('verified');
        if (result.processed_url) setSignature(`${API_BASE_URL}${result.processed_url}`);
      } else {
        setSignatureStatus('error');
        setSignature(null);
        Alert.alert("Invalid Signature", "The image does not appear to be a valid signature.");
      }
    } catch (error) {
      setSignatureStatus('error');
      Alert.alert("Error", "Signature verification failed.");
    } finally {
      setIsAnalyzingSignature(false);
    }
  };

  const pickImage = async (type: 'id' | 'signature') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'id' ? [1, 1] : undefined,
        quality: 1.0,
      });
      if (!result.canceled && result.assets?.[0]) {
        let uri = result.assets[0].uri;
        const manipResult = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: type === 'signature' ? 800 : 1024 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG });
        uri = manipResult.uri;
        if (type === 'id') { setIdPhoto(uri); setLocalIdPhotoUri(uri); verifyFaceOnBackend(uri); }
        else { setLocalSignatureUri(uri); verifySignatureOnBackend(uri); }
      }
    } catch (error) { Alert.alert("Error", "Failed to pick image."); }
  };

  const handleNextToBiometrics = async () => {
    if (!idPhoto || !signature || photoStatus !== 'verified' || signatureStatus !== 'verified') {
      Alert.alert("Incomplete", "Please upload and verify both photo and signature.");
      return;
    }
    const { granted } = await requestPermission();
    if (!granted) { Alert.alert("Permission Required", "Camera access is needed."); return; }
    setCurrentStep(2);
    setShowCamera(true);
  };

  const captureAndVerify = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      setLivenessPhase("matching");
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      const formData = new FormData();
      if (localIdPhotoUri) {
        // @ts-ignore
        formData.append("id_image", { uri: localIdPhotoUri, name: "id.jpg", type: "image/jpeg" });
      }
      // @ts-ignore
      formData.append("selfie_image", { uri: photo.uri, name: "selfie.jpg", type: "image/jpeg" });
      const res = await fetch(`${API_BASE_URL}/detect-face/verify-biometrics`, { method: "POST", headers: { "bypass-tunnel-reminder": "true" }, body: formData });
      const result = await res.json();
      if (result.match) {
        setLivenessPhase("success");
        setTimeout(() => { setShowCamera(false); setCurrentStep(3); simulateProcessing(); }, 1000);
      } else {
        setLivenessPhase("idle");
        Alert.alert("Failed", result.reason || "Biometric mismatch.");
      }
    } catch (err) { setLivenessPhase("idle"); Alert.alert("Error", "Verification failed."); }
  }, [idPhoto, localIdPhotoUri]);

  const simulateProcessing = () => {
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); setCurrentStep(4); }, 2500);
  };

  const uploadImageIfNeeded = async (uri: string | null) => {
    if (!uri || !uri.startsWith('file://')) return uri;
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'upload.jpg';
      // @ts-ignore
      formData.append('file', { uri, name: filename, type: 'image/jpeg' });
      const res = await fetch(`${API_BASE_URL}/uploads`, { method: 'POST', body: formData, headers: { 'bypass-tunnel-reminder': 'true' } });
      if (res.ok) { const data = await res.json(); return data.file_url; }
    } catch (err) { console.error("Upload failed", err); }
    return uri;
  };

  const handleFinish = async () => {
    setIsProcessing(true);
    try {
      const serverIdPhoto = await uploadImageIfNeeded(idPhoto);
      const serverSignature = await uploadImageIfNeeded(signature);
      const relativeIdPhoto = serverIdPhoto?.replace(API_BASE_URL, '') || serverIdPhoto;
      const relativeSignature = serverSignature?.replace(API_BASE_URL, '') || serverSignature;
      
      const userUpdateRes = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
        body: JSON.stringify({ 
          attributes: { 
            ...user.attributes, 
            has_applied_for_id: true, 
            id_picture: relativeIdPhoto, 
            signature: relativeSignature,
            fulfillment_method: fulfillmentMethod,
            shipping_address: fulfillmentMethod === 'delivery' ? shippingAddress : null
          } 
        })
      });
      const updatedUser = await userUpdateRes.json();
      
      const appRes = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
        body: JSON.stringify({ 
          user_id: user.id, 
          status: 'pending', 
          template_id: template?.id || null,
          fulfillment_method: fulfillmentMethod,
          shipping_address: fulfillmentMethod === 'delivery' ? JSON.stringify(shippingAddress) : null
        })
      });
      const newApp = await appRes.json();
      setApplication(newApp);
      
      updateProfile({ status: updatedUser.status, attributes: updatedUser.attributes });
      setCurrentStep(4);
      Alert.alert("Success", "Application submitted.");
    } catch (error) { 
      console.error("Submission error:", error);
      Alert.alert("Error", "Submission failed."); 
    }
    finally { setIsProcessing(false); }
  };

  const renderContent = () => {
    const isVerified = user?.status === 'verified';

    if (!isVerified) {
      return (
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View className="bg-white dark:bg-slate-800 rounded-[40px] p-10 items-center shadow-xl border border-slate-100 dark:border-slate-700">
            <View className="w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-full items-center justify-center mb-8">
              <Ionicons name="shield-checkmark" size={48} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-black text-[#1a234b] dark:text-white text-center mb-4 tracking-tighter">Verification Required</Text>
            <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm text-center leading-relaxed mb-10">
              Your account must be fully verified before you can access your Digital ID and secure QR code.
            </Text>
            <TouchableOpacity 
              onPress={() => {
                // Navigation to complete-registration
                // Assuming it's available via a router or props
                Alert.alert("Action Required", "Please complete your registration in the 'Complete Registration' section of the app.");
              }}
              className="w-full h-16 bg-[#1a234b] dark:bg-blue-600 rounded-3xl items-center justify-center flex-row shadow-lg shadow-blue-900/20"
            >
              <Text className="text-white font-black uppercase tracking-[2px] text-xs">Verify Account Now</Text>
              <Ionicons name="arrow-forward" size={16} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    if (hasApplied) {
      return (
        <ScrollView className="flex-1">
          <View className="px-6 pt-12 pb-6 flex-row justify-between items-center">
            <View>
              <Text className="text-3xl font-black text-[#1a234b] dark:text-white tracking-tighter">Digital ID</Text>
              <View className="flex-row items-center mt-1 gap-1.5">
                <Ionicons name="shield-checkmark" size={14} color={user?.status === 'verified' ? '#10b981' : '#f59e0b'} />
                <Text className={`text-[10px] font-black uppercase tracking-[2px] ${user?.status === 'verified' ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {user?.status === 'verified' ? 'Verified Identity' : 'Pending'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowClaimingModal(true)} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
              <Ionicons name="qr-code-outline" size={24} color="#1a234b" />
            </TouchableOpacity>
          </View>
          <DigitalIDCardComponent user={user} template={template} />
          <View className="px-6 mt-4">
            <View className="bg-white dark:bg-slate-800 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
              <Text className="font-black text-[#1a234b] dark:text-white text-base mb-6 pb-4 border-b border-slate-50 dark:border-slate-700">Identity Details</Text>
              <View className="gap-6">
                <View><Text className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Full Name</Text><Text className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name || "—"}</Text></View>
                <View><Text className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Role Designation</Text><Text className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.role || "—"}</Text></View>
              </View>
            </View>
          </View>
        </ScrollView>
      );
    }
    switch (currentStep) {
      case 0: return (
        <View className="px-6 pt-8 flex-1 justify-center">
          <View className="mb-8 items-center"><Text className="text-4xl font-black text-[#1a234b] dark:text-white tracking-tighter mb-2">Digital ID/QR</Text></View>
          <TouchableOpacity onPress={() => { setCurrentStep(1); setShowGuidelinesModal(true); }} className="bg-[#1a234b] dark:bg-blue-600 h-14 rounded-[20px] items-center justify-center flex-row">
            <Text className="text-white font-black tracking-[2px] mr-2 text-xs">Start Application</Text>
          </TouchableOpacity>
        </View>
      );
      case 1: return (
        <View className="px-6 pt-4 flex-1">
          <ProgressTracker currentStep={1} />
          <Text className="text-2xl font-black text-[#1a234b] dark:text-white mb-4">Data & Uploads</Text>
          <View className="flex-1 gap-4">
            <TouchableOpacity onPress={() => pickImage('id')} className="flex-1 bg-white dark:bg-slate-900 rounded-[24px] border-2 border-dashed items-center justify-center">
              {idPhoto ? <Image source={{ uri: idPhoto, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} /> : <Text>Upload Photo</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickImage('signature')} className="flex-1 bg-white dark:bg-slate-900 rounded-[24px] border-2 border-dashed items-center justify-center">
              {signature ? <Image source={{ uri: signature, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} /> : <Text>Capture Signature</Text>}
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleNextToBiometrics} className="h-14 bg-[#1a234b] rounded-[20px] items-center justify-center mt-6"><Text className="text-white font-black">Next</Text></TouchableOpacity>
        </View>
      );
      case 2: return (
        <View className="flex-1 p-6 items-center">
          <ProgressTracker currentStep={2} />
          <View className="flex-1 w-full bg-black rounded-[40px] overflow-hidden mb-6">
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" onCameraReady={() => setIsCameraReady(true)} />
            {livenessPhase === 'matching' && <View className="absolute inset-0 bg-black/60 items-center justify-center"><ActivityIndicator color="white" /><Text className="text-white mt-4">Verifying...</Text></View>}
          </View>
          <TouchableOpacity onPress={captureAndVerify} className="w-16 h-16 bg-[#1a234b] rounded-full items-center justify-center"><Ionicons name="scan" size={32} color="white" /></TouchableOpacity>
        </View>
      );
      case 3: return (
        <ScrollView className="flex-1 px-6 pt-4">
          <ProgressTracker currentStep={3} />
          <Text className="text-2xl font-black text-[#1a234b] mb-2">Fulfillment</Text>
          <Text className="text-slate-500 font-bold mb-6 text-xs leading-relaxed">Choose how you want to receive your physical ID card once it's ready.</Text>
          
          <View className="gap-4">
            <TouchableOpacity 
              onPress={() => setFulfillmentMethod('pickup')}
              className={`p-6 rounded-[32px] border-2 ${fulfillmentMethod === 'pickup' ? 'border-[#1a234b] bg-[#1a234b]/5' : 'border-slate-100 bg-white'}`}
            >
              <View className="flex-row items-center gap-4">
                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${fulfillmentMethod === 'pickup' ? 'bg-[#1a234b]' : 'bg-slate-100'}`}>
                  <Ionicons name="business" size={24} color={fulfillmentMethod === 'pickup' ? 'white' : '#64748b'} />
                </View>
                <View className="flex-1">
                  <Text className={`font-black text-sm ${fulfillmentMethod === 'pickup' ? 'text-[#1a234b]' : 'text-slate-700'}`}>Branch Pickup</Text>
                  <Text className="text-[10px] font-bold text-slate-500 mt-0.5">Collect at MSU Registrar Office</Text>
                </View>
                {fulfillmentMethod === 'pickup' && <Ionicons name="checkmark-circle" size={24} color="#1a234b" />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setFulfillmentMethod('delivery')}
              className={`p-6 rounded-[32px] border-2 ${fulfillmentMethod === 'delivery' ? 'border-[#1a234b] bg-[#1a234b]/5' : 'border-slate-100 bg-white'}`}
            >
              <View className="flex-row items-center gap-4">
                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${fulfillmentMethod === 'delivery' ? 'bg-[#1a234b]' : 'bg-slate-100'}`}>
                  <Ionicons name="car" size={24} color={fulfillmentMethod === 'delivery' ? 'white' : '#64748b'} />
                </View>
                <View className="flex-1">
                  <Text className={`font-black text-sm ${fulfillmentMethod === 'delivery' ? 'text-[#1a234b]' : 'text-slate-700'}`}>Doorstep Delivery</Text>
                  <Text className="text-[10px] font-bold text-slate-500 mt-0.5">Delivered to your preferred address</Text>
                </View>
                {fulfillmentMethod === 'delivery' && <Ionicons name="checkmark-circle" size={24} color="#1a234b" />}
              </View>
            </TouchableOpacity>
          </View>

          {fulfillmentMethod === 'delivery' && (
            <View className="mt-8">
              <Text className="text-sm font-black text-[#1a234b] mb-4">Delivery Address</Text>
              <AddressForm values={shippingAddress} onChange={(k: string, v: any) => setShippingAddress({...shippingAddress, [k]: v})} />
            </View>
          )}

          <TouchableOpacity 
            disabled={!fulfillmentMethod || (fulfillmentMethod === 'delivery' && (!shippingAddress.street || !shippingAddress.city))}
            onPress={handleFinish} 
            className={`h-16 rounded-[24px] items-center justify-center mt-10 mb-20 flex-row gap-2 ${(!fulfillmentMethod || (fulfillmentMethod === 'delivery' && (!shippingAddress.street || !shippingAddress.city))) ? 'bg-slate-200' : 'bg-[#1a234b]'}`}
          >
            <Text className="text-white font-black tracking-widest uppercase text-xs">Submit Application</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </ScrollView>
      );
      case 4: return (
        <View className="flex-1 px-8 items-center justify-center bg-white">
          <LinearGradient colors={['#f8fafc', 'white']} style={{ position: 'absolute', inset: 0 }} />
          <View className="w-24 h-24 bg-emerald-50 rounded-full items-center justify-center mb-8">
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          </View>
          <Text className="text-4xl font-black text-[#1a234b] tracking-tighter text-center mb-4">Congratulations!</Text>
          <Text className="text-slate-500 font-bold text-sm text-center leading-relaxed mb-10 px-4">
            Your Digital ID application has been submitted successfully and is now being processed.
          </Text>
          <TouchableOpacity 
            onPress={() => { setCurrentStep(0); setShowClaimingModal(true); }}
            className="w-full h-16 bg-[#1a234b] rounded-3xl items-center justify-center shadow-xl shadow-blue-900/20"
          >
            <Text className="text-white font-black uppercase tracking-[2px] text-xs">View Claim Stub</Text>
          </TouchableOpacity>
        </View>
      );
      default: return null;
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50 dark:bg-slate-900">
      {renderContent()}
      <Modal animationType="fade" transparent visible={showGuidelinesModal}>
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
          <View className="bg-white p-8 rounded-[40px] items-center">
            <Text className="text-2xl font-black mb-4">Guidelines</Text>
            <TouchableOpacity onPress={() => setShowGuidelinesModal(false)} className="bg-[#1a234b] px-8 py-3 rounded-xl"><Text className="text-white font-bold">Got it</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal animationType="slide" transparent visible={showClaimingModal}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white rounded-[40px] w-full overflow-hidden shadow-2xl">
            <View className="bg-[#1a234b] p-8 items-center">
              <View className="w-12 h-1 bg-white/20 rounded-full mb-6" />
              <Text className="text-white text-2xl font-black tracking-tighter">Digital Claim Stub</Text>
              <Text className="text-white/60 text-[10px] font-black uppercase tracking-[3px] mt-2">Official Receipt</Text>
            </View>
            
            <View className="p-8 items-center">
              <View className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-8">
                <QRCode 
                  value={JSON.stringify({ 
                    user_id: user?.id,
                    ticket_id: application?.tracking_id || `CLAIM-${(String(user?.id || "").slice(0, 8)).toUpperCase()}`,
                    type: "ID_CARD_CLAIM",
                    fulfillment: fulfillmentMethod 
                  })} 
                  size={180} 
                  color="#1a234b"
                />
              </View>

              <View className="w-full gap-6">
                <View className="flex-row justify-between items-center pb-4 border-b border-slate-50">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</Text>
                  <View className="bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    <Text className="text-[10px] font-black text-amber-600 uppercase tracking-wider">{application?.status || 'Pending Verification'}</Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center pb-4 border-b border-slate-50">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</Text>
                  <Text className="text-sm font-bold text-[#1a234b] uppercase">{fulfillmentMethod || 'Branch Pickup'}</Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking No.</Text>
                  <Text className="text-sm font-bold text-[#1a234b] tracking-wider">{application?.tracking_id || 'Generating...'}</Text>
                </View>
              </View>

              <View className="mt-10 bg-slate-50 p-4 rounded-2xl w-full flex-row items-center gap-3">
                <View className="w-8 h-8 bg-white rounded-xl items-center justify-center shadow-sm">
                  <Ionicons name="information-circle" size={18} color="#1a234b" />
                </View>
                <Text className="flex-1 text-[10px] font-bold text-slate-500 leading-relaxed">
                  Present this QR code to the authorized registrar once your status is marked as 'Ready for Collection'.
                </Text>
              </View>

              <TouchableOpacity 
                onPress={() => setShowClaimingModal(false)} 
                className="w-full h-16 bg-[#1a234b] rounded-3xl items-center justify-center mt-8"
              >
                <Text className="text-white font-black uppercase tracking-[2px] text-xs">Close Stub</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
