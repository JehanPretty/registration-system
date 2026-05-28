import os

FILE_PATH = r"c:\Users\Admin\OneDrive\Desktop\registration-system\mobile\app\(tabs)\digital-id.tsx"

def get_master_component():
    return r"""export function DigitalIDCardComponent({ user, template: propTemplate }: { user: any, template?: any }) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  
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

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscapeTemplate = (template?.orientation || propTemplate?.orientation || '').toLowerCase() === 'landscape';
  const isLandscapeDevice = windowWidth > windowHeight;
  const isPortrait = !isLandscapeTemplate && !isLandscapeDevice;

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
      if (url.startsWith('/static')) return `${API_BASE_URL}${url}`;
      if (url.includes('/static/') && url.startsWith('http')) {
        const path = '/static/' + url.split('/static/').pop();
        return `${API_BASE_URL}${path}`;
      }
    }
    return url;
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
    if (color && (color.toLowerCase() === "#ffffff" || color.toLowerCase() === "white")) return "#1e293b";
    return color;
  };

  const getAutoColor = (customColor, defaultLight, defaultDark, isLightBg = true) => {
    if (!customColor) return isLightBg ? defaultDark : defaultLight;
    if (isLightBg && (customColor.toLowerCase() === '#ffffff' || customColor.toLowerCase() === 'white')) {
      return defaultDark;
    }
    return customColor;
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

    const hColor = getAutoColor(template.header_color, 'rgba(255,255,255,0.6)', 'rgba(100,116,139,0.6)', !light);
    const iColor = getAutoColor(template.institution_color, '#ffffff', '#1e1b4b', !light);
    const sColor = getAutoColor(template.subtitle_color, 'rgba(255,255,255,0.5)', 'rgba(100,116,139,0.5)', !light);

    return (
      <View style={{ flexDirection: compact ? 'row' : 'column', alignItems: 'center', gap: 12 * s }}>
        {logoUrl && <Image source={{ uri: logoUrl, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: lSize, height: lSize }} contentFit="contain" />}
        <View style={{ alignItems: compact ? 'flex-start' : 'center' }}>
          {headerText ? <Text style={{ fontSize: hSize, fontWeight: '900', color: hColor, letterSpacing: 1.5 * s, textTransform: 'uppercase', marginBottom: 1 * s }}>{headerText}</Text> : null}
          <Text style={{ fontSize: iSize, fontWeight: '900', color: iColor, letterSpacing: 0.5 * s, textAlign: compact ? 'left' : 'center' }}>{instName}</Text>
          {instSub ? <Text style={{ fontSize: sSize, fontWeight: '700', color: sColor, letterSpacing: 1 * s, marginTop: 1 * s, textAlign: compact ? 'left' : 'center', textTransform: 'uppercase' }}>{instSub}</Text> : null}
        </View>
      </View>
    );
  };

  const renderFront = () => {
    switch (style) {
      case 'corporate':
        if (isPortrait) {
          return (
            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 24 * s, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
              <View style={{ height: 200 * s, backgroundColor: primary, position: 'relative', overflow: 'hidden', paddingTop: 24 * s }}>
                {template.custom_front_bg_url ? (
                  <View style={{ position: 'absolute', inset: 0, backgroundColor: primary }}>
                    <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%', opacity: 0.4 }} contentFit="cover" />
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
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                </View>
              )}
              <View style={{ flex: 1, alignItems: 'center', paddingTop: 24 * s, paddingHorizontal: 32 * s }}>
                <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.name_color || primary }}>{displayName}</Text>
                <View style={{ height: 2 * s, width: 32 * s, backgroundColor: secondary, marginVertical: 12 * s }} />
                <Text style={{ fontSize: (template.role_font_size || 11) * s, fontWeight: '900', color: template.role_color || secondary, letterSpacing: 3 * s, textTransform: 'uppercase' }}>{displayRole}</Text>
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
                    <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%', opacity: 0.4 }} contentFit="cover" />
                    <LinearGradient colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.2)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', inset: 0 }} />
                  </View>
                )}
                <View style={{ position: 'absolute', top: 24 * s, left: 32 * s, zIndex: 20 }}><BrandHeader light={false} compact={true} /></View>
                {template.show_avatar && (
                  <View style={{ width: 140 * s, height: 140 * s, borderRadius: 16 * s, overflow: 'hidden', borderWidth: 4 * s, borderColor: '#f8fafc', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 * s, elevation: 5, backgroundColor: 'white', marginTop: 48 * s, position: 'relative', zIndex: 10 }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1, height: '100%', paddingTop: 112 * s, position: 'relative', zIndex: 10 }}>
                  <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.custom_front_bg_url ? (template.name_color || primary) : ensureContrast(template.name_color || primary) }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: template.custom_front_bg_url ? (template.role_color || secondary) : ensureContrast(template.role_color || secondary), marginTop: 2 * s }}>{displayRole}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 7 * s, color: template.custom_front_bg_url ? 'rgba(255,255,255,0.4)' : '#cbd5e1', fontWeight: '900', textTransform: 'uppercase' }}>System ID</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 9) * s, fontWeight: '900', color: template.custom_front_bg_url ? (template.id_number_color || primary) : ensureContrast(template.id_number_color || primary), letterSpacing: 3 * s }}>{displayID}</Text>
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
        if (isPortrait) {
          return (
            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 40 * s, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
              <View style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <LinearGradient colors={[primary, secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
                <View style={{ position: 'absolute', top: -20 * s, right: -20 * s, width: 256 * s, height: 256 * s, borderRadius: 128 * s, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <View style={{ position: 'absolute', bottom: -16 * s, left: -16 * s, width: 192 * s, height: 192 * s, borderRadius: 96 * s, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                {template.custom_front_bg_url && <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ position: 'absolute', inset: 0, opacity: 0.4 }} contentFit="cover" />}
              </View>
              <View style={{ zIndex: 10, flex: 1, alignItems: 'center', paddingTop: 48 * s }}>
                <View style={{ marginBottom: 32 * s }}><BrandHeader light={true} compact={false} /></View>
                {template.show_avatar && (
                  <View style={{ width: 160 * s, height: 160 * s, borderRadius: 48 * s, overflow: 'hidden', borderWidth: 4 * s, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 * s, elevation: 15, marginBottom: 32 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.name_color || 'white', textAlign: 'center' }}>{displayName}</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16 * s, paddingVertical: 6 * s, borderRadius: 20 * s, marginTop: 12 * s, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '900', color: template.role_color || 'white', textTransform: 'uppercase', letterSpacing: 2 * s }}>{displayRole}</Text>
                </View>
                <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 40 * s, paddingHorizontal: 32 * s }}>
                  {template.show_qr && <View style={{ backgroundColor: 'white', padding: 12 * s, borderRadius: 16 * s }}><QRCode value={qrPayload} size={64 * s} color={primary} /></View>}
                  {template.show_id_number && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 8 * s, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>System ID</Text>
                      <Text style={{ fontSize: (template.id_number_font_size || 16) * s, fontWeight: '900', color: template.id_number_color || 'white', letterSpacing: 4 * s }}>{displayID}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        } else {
          return (
            <View style={{ flex: 1, borderRadius: 32 * s, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: '#f1f5f9' }}>
              <View style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <LinearGradient colors={[primary, secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
                <View style={{ position: 'absolute', top: -32 * s, right: -32 * s, width: 320 * s, height: 320 * s, borderRadius: 160 * s, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                {template.custom_front_bg_url && <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ position: 'absolute', inset: 0, opacity: 0.4 }} contentFit="cover" />}
              </View>
              <View style={{ width: 140 * s, height: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 * s }}>
                <BrandHeader light={true} compact={false} />
              </View>
              <View style={{ flex: 1, padding: 24 * s, flexDirection: 'row', alignItems: 'center', gap: 24 * s, zIndex: 10 }}>
                {template.show_avatar && (
                  <View style={{ width: 140 * s, height: 140 * s, borderRadius: 32 * s, overflow: 'hidden', borderWidth: 4 * s, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'white' }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
                  <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.name_color || 'white' }}>{displayName}</Text>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12 * s, paddingVertical: 4 * s, borderRadius: 20 * s, marginTop: 8 * s, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '900', color: template.role_color || 'white', textTransform: 'uppercase' }}>{displayRole}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 7 * s, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>System ID</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 9) * s, fontWeight: '900', color: template.id_number_color || 'white', letterSpacing: 3 * s }}>{displayID}</Text>
                      </View>
                    )}
                    {template.show_qr && <View style={{ backgroundColor: 'white', padding: 6 * s, borderRadius: 8 * s }}><QRCode value={qrPayload} size={44 * s} color={primary} /></View>}
                  </View>
                </View>
              </View>
            </View>
          );
        }
      case 'academic':
        if (isPortrait) {
          return (
            <View style={{ flex: 1, backgroundColor: 'white', borderWidth: 2, borderColor: primary, borderRadius: 20 * s, overflow: 'hidden' }}>
              <View style={{ height: 64 * s, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                {template.custom_front_bg_url && <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ position: 'absolute', inset: 0, opacity: 0.5 }} contentFit="cover" />}
                <BrandHeader light={true} compact={true} />
              </View>
              <View style={{ height: 3 * s, backgroundColor: secondary }} />
              <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 32 * s, paddingTop: 24 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 110 * s, height: 140 * s, borderWidth: 2 * s, borderColor: primary, overflow: 'hidden', marginBottom: 16 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <Text style={{ fontSize: (template.name_font_size || 18) * s, fontWeight: '900', color: template.name_color || primary, textAlign: 'center' }}>{displayName}</Text>
                <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: template.role_color || secondary, marginTop: 4 * s }}>{displayRole}</Text>
                <View style={{ width: '100%', borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#e2e8f0', marginVertical: 16 * s }} />
                {template.show_id_number && (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 8 * s, color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase' }}>Student Number</Text>
                    <Text style={{ fontSize: (template.id_number_font_size || 14) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 4 * s }}>{displayID}</Text>
                  </View>
                )}
                {template.show_qr && <View style={{ marginTop: 'auto', marginBottom: 24 * s, padding: 12 * s, borderWidth: 2, borderStyle: 'dashed', borderColor: primary + '30', borderRadius: 16 * s }}><QRCode value={qrPayload} size={64 * s} color={primary} /></View>}
              </View>
            </View>
          );
        } else {
          return (
            <View style={{ flex: 1, backgroundColor: 'white', borderWidth: 2, borderColor: primary, borderRadius: 20 * s, overflow: 'hidden' }}>
              <View style={{ height: 44 * s, backgroundColor: primary, justifyContent: 'center', paddingHorizontal: 24 * s }}>
                {template.custom_front_bg_url && <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ position: 'absolute', inset: 0, opacity: 0.5 }} contentFit="cover" />}
                <BrandHeader light={true} compact={true} />
              </View>
              <View style={{ height: 3 * s, backgroundColor: secondary }} />
              <View style={{ flex: 1, flexDirection: 'row', padding: 24 * s, gap: 24 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 120 * s, height: 150 * s, borderWidth: 2 * s, borderColor: primary, overflow: 'hidden' }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1, height: '100%' }}>
                  <Text style={{ fontSize: (template.name_font_size || 20) * s, fontWeight: '900', color: template.name_color || primary }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: template.role_color || secondary }}>{displayRole}</Text>
                  <View style={{ flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#e2e8f0', marginVertical: 8 * s }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 7 * s, color: '#94a3b8', fontWeight: '900' }}>Student No.</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 10) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 3 * s }}>{displayID}</Text>
                      </View>
                    )}
                    {template.show_qr && <View style={{ padding: 6 * s, borderWidth: 2, borderStyle: 'dashed', borderColor: primary + '30', borderRadius: 8 * s }}><QRCode value={qrPayload} size={42 * s} color={primary} /></View>}
                  </View>
                </View>
              </View>
            </View>
          );
        }
      case 'minimal':
        if (isPortrait) {
          return (
            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 28 * s, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
              <View style={{ height: 4 * s, backgroundColor: secondary }} />
              <View style={{ flex: 1, padding: 32 * s, alignItems: 'center' }}>
                <BrandHeader light={false} compact={true} />
                {template.show_avatar && (
                  <View style={{ width: 100 * s, height: 100 * s, borderRadius: 50 * s, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', marginVertical: 24 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <Text style={{ fontSize: (template.name_font_size || 22) * s, fontWeight: '900', color: template.name_color || '#1e293b' }}>{displayName}</Text>
                <View style={{ width: 32 * s, height: 2 * s, backgroundColor: secondary, marginVertical: 12 * s }} />
                <Text style={{ fontSize: (template.role_font_size || 10) * s, color: template.role_color || secondary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 * s }}>{displayRole}</Text>
                <View style={{ marginTop: 'auto', width: '100%', borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 16 * s, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                   {template.show_id_number && <Text style={{ fontSize: (template.id_number_font_size || 9) * s, fontWeight: '900', color: template.id_number_color || '#cbd5e1', letterSpacing: 3 * s }}>{displayID}</Text>}
                   {template.show_qr && <QRCode value={qrPayload} size={48 * s} color={primary} />}
                </View>
              </View>
            </View>
          );
        } else {
          return (
            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 28 * s, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row' }}>
              <View style={{ width: 6 * s, height: '100%', backgroundColor: secondary }} />
              <View style={{ flex: 1, padding: 32 * s }}>
                <BrandHeader light={false} compact={true} />
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 32 * s }}>
                  {template.show_avatar && (
                    <View style={{ width: 120 * s, height: 120 * s, borderRadius: 60 * s, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: (template.name_font_size || 22) * s, fontWeight: '900', color: template.name_color || '#1e293b' }}>{displayName}</Text>
                    <Text style={{ fontSize: (template.role_font_size || 10) * s, color: template.role_color || secondary, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 * s }}>{displayRole}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                      {template.show_id_number && <Text style={{ fontSize: (template.id_number_font_size || 9) * s, fontWeight: '900', color: template.id_number_color || '#cbd5e1', letterSpacing: 3 * s }}>{displayID}</Text>}
                      {template.show_qr && <QRCode value={qrPayload} size={44 * s} color={primary} />}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        }
      case 'bold':
        return (
          <View style={{ flex: 1, backgroundColor: primary, borderRadius: 32 * s, overflow: 'hidden', position: 'relative' }}>
            <View style={{ position: 'absolute', top: -40 * s, right: -40 * s, width: 240 * s, height: 240 * s, borderRadius: 120 * s, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            {template.custom_front_bg_url && <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ position: 'absolute', inset: 0, opacity: 0.4 }} contentFit="cover" />}
            <View style={{ flex: 1, padding: 32 * s, alignItems: isPortrait ? 'center' : 'flex-start', justifyContent: 'center' }}>
              <View style={{ marginBottom: 32 * s }}><BrandHeader light={true} compact={false} /></View>
              <View style={{ flexDirection: isPortrait ? 'column' : 'row', alignItems: 'center', gap: 32 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 140 * s, height: 140 * s, borderRadius: 70 * s, borderWidth: 4 * s, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ alignItems: isPortrait ? 'center' : 'flex-start' }}>
                  <Text style={{ fontSize: (template.name_font_size || 28) * s, fontWeight: '900', color: template.name_color || 'white', textAlign: isPortrait ? 'center' : 'left' }}>{displayName}</Text>
                  <View style={{ backgroundColor: secondary, paddingHorizontal: 16 * s, paddingVertical: 6 * s, borderRadius: 20 * s, marginTop: 8 * s }}>
                    <Text style={{ fontSize: (template.role_font_size || 9) * s, fontWeight: '900', color: template.role_color || 'white', textTransform: 'uppercase' }}>{displayRole}</Text>
                  </View>
                </View>
              </View>
              <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                 {template.show_qr && <View style={{ backgroundColor: 'white', padding: 8 * s, borderRadius: 12 * s }}><QRCode value={qrPayload} size={56 * s} color={primary} /></View>}
                 {template.show_id_number && (
                   <View style={{ alignItems: 'flex-end' }}>
                     <Text style={{ fontSize: 7 * s, color: 'rgba(255,255,255,0.4)', fontWeight: '900' }}>System ID</Text>
                     <Text style={{ fontSize: (template.id_number_font_size || 11) * s, fontWeight: '900', color: template.id_number_color || 'white', letterSpacing: 4 * s }}>{displayID}</Text>
                   </View>
                 )}
              </View>
            </View>
          </View>
        );
      case 'government':
        return (
          <View style={{ flex: 1, backgroundColor: 'white', borderWidth: 4, borderColor: primary, borderRadius: 16 * s, overflow: 'hidden' }}>
             <View style={{ height: 50 * s, backgroundColor: primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 * s }}>
               <BrandHeader light={true} compact={true} />
             </View>
             <View style={{ height: 4 * s, backgroundColor: secondary }} />
             <View style={{ flex: 1, flexDirection: isPortrait ? 'column' : 'row', padding: 24 * s, gap: 24 * s, alignItems: 'center' }}>
                {template.show_avatar && (
                  <View style={{ width: 120 * s, height: 140 * s, borderWidth: 2, borderColor: primary, padding: 2 }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1, width: '100%' }}>
                  <Text style={{ fontSize: (template.name_font_size || 22) * s, fontWeight: '900', color: template.name_color || primary, textTransform: 'uppercase' }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: template.role_color || secondary }}>{displayRole}</Text>
                  <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 * s }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 7 * s, color: '#94a3b8', fontWeight: '900' }}>ID NUMBER</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 11) * s, fontWeight: '900', color: template.id_number_color || primary }}>{displayID}</Text>
                      </View>
                    )}
                    {template.show_qr && <QRCode value={qrPayload} size={44 * s} color={primary} />}
                  </View>
                </View>
             </View>
          </View>
        );
      case 'professional':
        return (
          <View style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: 32 * s, overflow: 'hidden', position: 'relative' }}>
            <View style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', backgroundColor: primary, opacity: 0.15 }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 12 * s, backgroundColor: primary }} />
            <View style={{ flex: 1, padding: 32 * s, alignItems: 'center', justifyContent: 'center' }}>
              <BrandHeader light={true} compact={false} />
              <View style={{ flexDirection: isPortrait ? 'column' : 'row', alignItems: 'center', gap: 32 * s, marginVertical: 32 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 140 * s, height: 140 * s, borderRadius: 70 * s, borderWidth: 4 * s, borderColor: primary, overflow: 'hidden' }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ alignItems: isPortrait ? 'center' : 'flex-start' }}>
                  <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.name_color || 'white' }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: template.role_color || primary, textTransform: 'uppercase', marginTop: 4 * s }}>{displayRole}</Text>
                </View>
              </View>
              <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                {template.show_id_number && (
                  <View>
                    <Text style={{ fontSize: 7 * s, color: 'rgba(255,255,255,0.3)', fontWeight: '900' }}>MEMBER ID</Text>
                    <Text style={{ fontSize: (template.id_number_font_size || 12) * s, fontWeight: '900', color: template.id_number_color || 'white' }}>{displayID}</Text>
                  </View>
                )}
                {template.show_qr && <View style={{ backgroundColor: 'white', padding: 4 * s, borderRadius: 8 * s }}><QRCode value={qrPayload} size={40 * s} color="#0f172a" /></View>}
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
              <Image source={{ uri: resolveImageUrl(template.custom_back_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%', opacity: 0.4 }} contentFit="cover" />
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
                {signatureImage && <Image source={{ uri: signatureImage, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 100 * s, height: 60 * s }} contentFit="contain" />}
              </View>
              <Text style={{ fontSize: 9 * s, fontWeight: '900', color: mainColor, paddingTop: 8 * s }}>{displayName}</Text>
              <View style={{ width: 80 * s, height: 1, backgroundColor: isBackDark ? 'rgba(255,255,255,0.2)' : 'rgba(30,41,59,0.1)', marginVertical: 4 * s }} />
              <Text style={{ fontSize: 6 * s, fontWeight: '900', color: accentColor, textTransform: 'uppercase' }}>{displayRole}'s Signature</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ height: 40 * s, marginBottom: -10 * s, zIndex: 10 }}>
                {template.authorized_signature_url && <Image source={{ uri: resolveImageUrl(template.authorized_signature_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 100 * s, height: 60 * s }} contentFit="contain" />}
              </View>
              <Text style={{ fontSize: 9 * s, fontWeight: '900', color: mainColor, paddingTop: 8 * s }}>{template.authorized_name || "Registrar"}</Text>
              <View style={{ width: 80 * s, height: 1, backgroundColor: isBackDark ? 'rgba(255,255,255,0.2)' : 'rgba(30,41,59,0.1)', marginVertical: 4 * s }} />
              <Text style={{ fontSize: 6 * s, fontWeight: '900', color: accentColor, textTransform: 'uppercase' }}>{template.signature_label || "Authorized"}</Text>
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
}"""

def main():
    if not os.path.exists(FILE_PATH):
        print("File not found")
        return

    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    start_marker = "export function DigitalIDCardComponent"
    end_marker = "export default function DigitalIDScreen"
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx != -1 and end_idx != -1:
        new_content = content[:start_idx] + get_master_component() + "\n\n" + content[end_idx:]
        with open(FILE_PATH, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Master reconstruction V2 completed successfully")
    else:
        print(f"Markers not found: start={start_idx != -1}, end={end_idx != -1}")

if __name__ == "__main__":
    main()
