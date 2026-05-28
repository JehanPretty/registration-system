import sys
import re

file_path = r"c:\Users\Admin\OneDrive\Desktop\registration-system\mobile\app\(tabs)\digital-id.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def find_matching_brace(text, start_index):
    count = 0
    for i in range(start_index, len(text)):
        if text[i] == '{': count += 1
        elif text[i] == '}':
            count -= 1
            if count == 0: return i
    return -1

# --- RENDER FRONT FULL ---
render_front_full = """
  const renderFront = () => {
    switch (style) {
      case 'corporate':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm relative">
              <View style={{ height: 200 * s, backgroundColor: primary, position: 'relative', overflow: 'hidden' }}>
                {template.custom_front_bg_url ? (
                  <View style={{ position: 'absolute', inset: 0 }}>
                    <Image
                      source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }}
                      style={{ width: '100%', height: '100%', opacity: 0.4 }}
                      contentFit="cover"
                    />
                    <View style={{ position: 'absolute', inset: 0, backgroundColor: primary, opacity: 0.3 }} />
                  </View>
                ) : (
                  <View style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundColor: secondary }} />
                )}
                <View style={{ paddingHorizontal: 16 * s, paddingTop: 24 * s, zIndex: 10 }}>
                  <BrandHeader light={true} compact={false} />
                </View>
              </View>

              {template.show_avatar && (
                <View style={{ alignItems: 'center', marginTop: -65 * s, zIndex: 20 }}>
                  <View style={{ width: 130 * s, height: 130 * s, borderRadius: 65 * s, borderWidth: 6 * s, borderColor: 'white', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 * s }, shadowOpacity: 0.1, shadowRadius: 20 * s, elevation: 10, backgroundColor: 'white' }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                </View>
              )}

              <View style={{ flex: 1, alignItems: 'center', paddingTop: 24 * s, paddingHorizontal: 32 * s }}>
                <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.name_color || '#0f172a', textAlign: 'center', marginBottom: 4 * s }} numberOfLines={1}>{displayName}</Text>
                <View style={{ height: 2 * s, width: 32 * s, borderRadius: 1 * s, backgroundColor: secondary, marginBottom: 12 * s }} />
                <Text style={{ fontSize: (template.role_font_size || 11) * s, fontWeight: '900', color: template.role_color || secondary, textAlign: 'center', letterSpacing: 3 * s, textTransform: 'uppercase' }}>{displayRole}</Text>
                <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: '#f8fafc', marginTop: 'auto', marginBottom: 16 * s }} />
              </View>

              <View style={{ paddingHorizontal: 32 * s, paddingBottom: 32 * s, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                {template.show_qr && (
                  <View style={{ padding: 10 * s, backgroundColor: '#f8fafc', borderRadius: 16 * s, borderWidth: 1, borderColor: '#f1f5f9' }}>
                    <QRCode value={qrPayload} size={60 * s} color={primary} />
                  </View>
                )}
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
            <View className="flex-1 bg-white rounded-[24px] overflow-hidden border border-slate-100 flex-row">
              <View style={{ width: 40 * s, height: '100%', backgroundColor: primary }} />
              <View style={{ flex: 1, padding: 32 * s, position: 'relative', overflow: 'hidden' }}>
                {template.custom_front_bg_url && (
                  <View style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <Image
                      source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }}
                      style={{ width: '100%', height: '100%', opacity: 0.4 }}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.2)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                  </View>
                )}
                
                <View style={{ position: 'absolute', top: 24 * s, left: 32 * s, zIndex: 20 }}>
                  <BrandHeader light={false} compact={true} />
                </View>

                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 32 * s, paddingTop: 40 * s }}>
                  {template.show_avatar && (
                    <View style={{ width: 140 * s, height: 140 * s, borderRadius: 16 * s, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 * s }, shadowOpacity: 0.1, shadowRadius: 10 * s, elevation: 5, backgroundColor: 'white' }}>
                      <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    </View>
                  )}
                  <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
                    <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.name_color || primary }} numberOfLines={1}>{displayName}</Text>
                    <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: template.role_color || secondary }}>{displayRole}</Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                      {template.show_id_number && (
                        <View>
                          <Text style={{ fontSize: 7 * s, color: '#94a3b8', textTransform: 'uppercase' }}>ID Number</Text>
                          <Text style={{ fontSize: (template.id_number_font_size || 12) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 4 * s }}>{displayID}</Text>
                        </View>
                      )}
                      {template.show_qr && (
                        <View style={{ padding: 6 * s, backgroundColor: '#f8fafc', borderRadius: 12 * s }}>
                          <QRCode value={qrPayload} size={40 * s} color={primary} />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        }

      case 'modern':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-white rounded-[32px] shadow-sm relative overflow-hidden flex-col border border-slate-100">
              <View style={{ height: 160 * s, position: 'relative' }}>
                {template.custom_front_bg_url ? (
                  <View style={{ position: 'absolute', inset: 0 }}>
                    <Image
                      source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    <View style={{ position: 'absolute', inset: 0, backgroundColor: primary, opacity: 0.3 }} />
                  </View>
                ) : (
                  <LinearGradient colors={[primary, secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
                )}
                <View style={{ paddingHorizontal: 24 * s, paddingTop: 32 * s }}>
                  <BrandHeader light={true} compact={false} />
                </View>
              </View>

              <View style={{ flex: 1, padding: 32 * s, alignItems: 'center' }}>
                {template.show_avatar && (
                  <View style={{ marginTop: -110 * s, marginBottom: 24 * s }}>
                    <View style={{ width: 140 * s, height: 160 * s, borderRadius: 24 * s, overflow: 'hidden', borderWidth: 6 * s, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 10 * s }, shadowOpacity: 0.2, shadowRadius: 20 * s, elevation: 15, backgroundColor: 'white' }}>
                      <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    </View>
                  </View>
                )}
                <Text style={{ fontSize: (template.name_font_size || 28) * s, fontWeight: '900', color: template.name_color || '#1e293b', textAlign: 'center' }} numberOfLines={1}>{displayName}</Text>
                <Text style={{ fontSize: (template.role_font_size || 12) * s, fontWeight: '800', color: template.role_color || secondary, marginTop: 4 * s, letterSpacing: 2 * s, textTransform: 'uppercase' }}>{displayRole}</Text>
                
                <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  {template.show_id_number && (
                    <View>
                      <Text style={{ fontSize: 7 * s, fontWeight: '900', color: '#cbd5e1', textTransform: 'uppercase' }}>System ID</Text>
                      <Text style={{ fontSize: (template.id_number_font_size || 14) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 4 * s }}>{displayID}</Text>
                    </View>
                  )}
                  {template.show_qr && (
                    <View style={{ padding: 4 * s, backgroundColor: 'white', borderRadius: 12 * s, borderWidth: 1, borderColor: '#f1f5f9' }}>
                      <QRCode value={qrPayload} size={50 * s} color={primary} />
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        } else {
          return (
            <View className="flex-1 bg-white rounded-[32px] shadow-sm relative overflow-hidden flex-row border border-slate-100">
              <View style={{ width: 220 * s, position: 'relative' }}>
                {template.custom_front_bg_url ? (
                  <View style={{ position: 'absolute', inset: 0 }}>
                    <Image
                      source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    <View style={{ position: 'absolute', inset: 0, backgroundColor: primary, opacity: 0.4 }} />
                  </View>
                ) : (
                  <LinearGradient colors={[primary, secondary]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }} />
                )}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 * s }}>
                  <BrandHeader light={true} compact={false} />
                </View>
              </View>

              <View style={{ flex: 1, padding: 32 * s, flexDirection: 'row', alignItems: 'center', gap: 32 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 140 * s, height: 180 * s, borderRadius: 24 * s, overflow: 'hidden', borderWidth: 6 * s, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 10 * s }, shadowOpacity: 0.2, shadowRadius: 20 * s, elevation: 15, backgroundColor: 'white' }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
                  <Text style={{ fontSize: (template.name_font_size || 26) * s, fontWeight: '900', color: template.name_color || '#1e293b' }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 12) * s, fontWeight: '800', color: template.role_color || secondary, marginTop: 4 * s, letterSpacing: 2 * s, textTransform: 'uppercase' }}>{displayRole}</Text>
                  <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 7 * s, fontWeight: '900', color: '#cbd5e1', textTransform: 'uppercase' }}>System ID</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 14) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 4 * s }}>{displayID}</Text>
                      </View>
                    )}
                    {template.show_qr && <QRCode value={qrPayload} size={50 * s} color={primary} />}
                  </View>
                </View>
              </View>
            </View>
          );
        }

      case 'academic':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-white border-2 overflow-hidden" style={{ borderColor: primary }}>
              <View style={{ height: 60 * s, backgroundColor: primary, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {template.custom_front_bg_url && (
                  <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ position: 'absolute', inset: 0, opacity: 0.3 }} contentFit="cover" />
                )}
                <BrandHeader light={true} compact={true} />
              </View>
              <View style={{ height: 4 * s, backgroundColor: secondary }} />
              <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 32 * s, paddingTop: 24 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 110 * s, height: 140 * s, borderWidth: 2 * s, borderColor: primary, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 * s }, shadowOpacity: 0.1, shadowRadius: 10 * s, elevation: 5, marginBottom: 16 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <Text style={{ fontSize: (template.name_font_size || 18) * s, fontWeight: '900', color: template.name_color || primary, textAlign: 'center' }} numberOfLines={2}>{displayName}</Text>
                <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: template.role_color || secondary, marginTop: 4 * s }}>{displayRole}</Text>
                <View style={{ width: '100%', borderTopWidth: 1 * s, borderTopColor: '#e2e8f0', borderStyle: 'dashed', marginVertical: 16 * s }} />
                {template.show_id_number && (
                  <View style={{ alignItems: 'center', marginBottom: 16 * s }}>
                    <Text style={{ fontSize: 8 * s, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 * s, textTransform: 'uppercase', marginBottom: 4 * s }}>Student Number</Text>
                    <Text style={{ fontSize: (template.id_number_font_size || 14) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 4 * s }}>{displayID}</Text>
                  </View>
                )}
                {template.show_qr && (
                  <View style={{ marginTop: 'auto', marginBottom: 24 * s, padding: 12 * s, borderWidth: 2 * s, borderColor: `${primary}30`, borderStyle: 'dashed', borderRadius: 16 * s }}>
                    <QRCode value={qrPayload} size={64 * s} color={primary} />
                  </View>
                )}
              </View>
            </View>
          );
        } else {
          return (
            <View className="flex-1 bg-white border-2 rounded-[24px] overflow-hidden" style={{ borderColor: primary }}>
              <View style={{ height: 64 * s, backgroundColor: primary, justifyContent: 'center', paddingHorizontal: 32 * s, position: 'relative' }}>
                {template.custom_front_bg_url && (
                  <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ position: 'absolute', inset: 0, opacity: 0.3 }} contentFit="cover" />
                )}
                <BrandHeader light={true} compact={true} />
              </View>
              <View style={{ height: 8 * s, backgroundColor: secondary }} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 32 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 140 * s, height: 170 * s, borderWidth: 4 * s, borderColor: primary, borderRadius: 8 * s, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 * s }, shadowOpacity: 0.2, shadowRadius: 10 * s, elevation: 8, marginRight: 32 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1, height: '100%' }}>
                  <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.name_color || primary }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 12) * s, fontWeight: '700', color: template.role_color || secondary, marginTop: 4 * s }}>{displayRole}</Text>
                  <View style={{ width: '100%', borderTopWidth: 2 * s, borderTopColor: '#f1f5f9', borderStyle: 'dashed', marginVertical: 16 * s }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 8 * s, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 * s }}>Student ID</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 14) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 4 * s }}>{displayID}</Text>
                      </View>
                    )}
                    {template.show_qr && (
                      <View style={{ padding: 6 * s, backgroundColor: 'white', borderRadius: 12 * s, borderWidth: 1, borderColor: '#f1f5f9' }}>
                        <QRCode value={qrPayload} size={50 * s} color={primary} />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        }

      case 'minimal':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-white relative overflow-hidden">
              <View style={{ height: 4 * s, backgroundColor: secondary }} />
              <View style={{ flex: 1, padding: 32 * s, alignItems: 'center' }}>
                <BrandHeader light={false} compact={true} />
                {template.show_avatar && (
                  <View style={{ width: 150 * s, height: 150 * s, borderRadius: 75 * s, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', marginVertical: 32 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: (template.name_font_size || 22) * s, fontWeight: '800', color: '#1e293b' }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 10) * s, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 * s }}>{displayRole}</Text>
                </View>
                <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  {template.show_id_number && (
                    <View>
                      <Text style={{ fontSize: 7 * s, color: '#94a3b8', textTransform: 'uppercase' }}>ID No.</Text>
                      <Text style={{ fontSize: (template.id_number_font_size || 12) * s, fontWeight: '700', color: '#1e293b' }}>{displayID}</Text>
                    </View>
                  )}
                  {template.show_qr && (
                    <QRCode value={qrPayload} size={48 * s} color="#1e293b" />
                  )}
                </View>
              </View>
            </View>
          );
        } else {
          return (
            <View className="flex-1 bg-white rounded-[16px] overflow-hidden border border-slate-200">
              <View style={{ height: 6 * s, backgroundColor: primary }} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 32 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 130 * s, height: 130 * s, borderRadius: 65 * s, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 32 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <BrandHeader light={false} compact={true} />
                  <View style={{ marginTop: 24 * s }}>
                    <Text style={{ fontSize: (template.name_font_size || 22) * s, fontWeight: '800', color: '#1e293b' }}>{displayName}</Text>
                    <Text style={{ fontSize: (template.role_font_size || 10) * s, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 * s }}>{displayRole}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24 * s }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 7 * s, color: '#94a3b8', textTransform: 'uppercase' }}>ID No.</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 12) * s, fontWeight: '700', color: '#1e293b' }}>{displayID}</Text>
                      </View>
                    )}
                    {template.show_qr && (
                      <QRCode value={qrPayload} size={40 * s} color="#1e293b" />
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        }

      case 'bold':
        if (isPortrait) {
          return (
            <View className="flex-1 rounded-[28px] overflow-hidden relative" style={{ backgroundColor: primary }}>
              {template.custom_front_bg_url && (
                <Image
                  source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }}
                  style={{ position: 'absolute', inset: 0, opacity: 0.4 }}
                  contentFit="cover"
                />
              )}
              <View style={{ position: 'absolute', top: 0, right: 0, width: 200 * s, height: 200 * s, borderRadius: 100 * s, backgroundColor: secondary, opacity: 0.2, marginTop: -80 * s, marginRight: -80 * s }} />
              <View style={{ position: 'absolute', bottom: 0, left: 0, width: 150 * s, height: 150 * s, borderRadius: 75 * s, backgroundColor: secondary, opacity: 0.1, marginLeft: -64 * s, marginBottom: -64 * s }} />
              <View style={{ flex: 1, paddingTop: 32 * s, paddingHorizontal: 32 * s }}>
                <View style={{ marginBottom: 32 * s, paddingHorizontal: 32 * s }}>
                  <BrandHeader light={true} compact={true} />
                </View>
                {template.show_avatar && (
                  <View style={{ alignSelf: 'center', width: 140 * s, height: 140 * s, borderRadius: 24 * s, overflow: 'hidden', borderWidth: 4 * s, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 * s }, shadowOpacity: 0.3, shadowRadius: 20 * s, elevation: 10, marginBottom: 24 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ paddingHorizontal: 32 * s }}>
                  <Text style={{ fontSize: (template.name_font_size || 30) * s, fontWeight: '900', color: template.name_color || 'white', textAlign: 'left', lineHeight: 32 * s }} numberOfLines={2}>{displayName}</Text>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: secondary, paddingHorizontal: 16 * s, paddingVertical: 6 * s, borderRadius: 20 * s, marginTop: 8 * s }}>
                    <Text style={{ fontSize: (template.role_font_size || 9) * s, fontWeight: '900', color: template.role_color || 'white', textTransform: 'uppercase' }}>{displayRole}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 'auto', paddingHorizontal: 32 * s, paddingBottom: 32 * s, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  {template.show_qr && (
                    <View style={{ backgroundColor: 'white', padding: 10 * s, borderRadius: 16 * s, shadowColor: '#000', shadowOffset: { width: 0, height: 4 * s }, shadowOpacity: 0.1, shadowRadius: 10 * s, elevation: 5 }}>
                      <QRCode value={qrPayload} size={56 * s} color={primary} />
                    </View>
                  )}
                  {template.show_id_number && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 7 * s, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1 * s, textTransform: 'uppercase' }}>ID number</Text>
                      <Text style={{ fontSize: 11 * s, fontWeight: '900', color: 'white', letterSpacing: 4 * s }}>{displayID}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        } else {
          return (
            <View className="flex-1 rounded-[24px] overflow-hidden relative">
              <View style={{ position: 'absolute', inset: 0, backgroundColor: primary }} />
              <View style={{ position: 'absolute', bottom: -50 * s, right: -50 * s, width: 250 * s, height: 250 * s, borderRadius: 125 * s, backgroundColor: secondary, opacity: 0.3 }} />
              <View style={{ flex: 1, padding: 32 * s, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'absolute', top: 24 * s, left: 32 * s }}>
                  <BrandHeader light={true} compact={true} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 * s }}>
                  {template.show_avatar && (
                    <View style={{ width: 140 * s, height: 140 * s, borderRadius: 70 * s, overflow: 'hidden', borderWidth: 6 * s, borderColor: 'rgba(255,255,255,0.2)' }}>
                      <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    </View>
                  )}
                  <View>
                    <Text style={{ fontSize: (template.name_font_size || 28) * s, fontWeight: '900', color: 'white' }}>{displayName}</Text>
                    <Text style={{ fontSize: (template.role_font_size || 12) * s, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2 * s }}>{displayRole}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 * s }}>
                      {template.show_id_number && (
                        <View>
                          <Text style={{ fontSize: 7 * s, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>System ID</Text>
                          <Text style={{ fontSize: (template.id_number_font_size || 14) * s, fontWeight: '900', color: 'white' }}>{displayID}</Text>
                        </View>
                      )}
                      {template.show_qr && (
                        <View style={{ backgroundColor: 'white', padding: 4 * s, borderRadius: 8 * s, marginLeft: 24 * s }}>
                          <QRCode value={qrPayload} size={40 * s} color={primary} />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        }

      case 'government':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-[#fafbfc] border rounded-[16px] overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <View style={{ height: 52 * s, backgroundColor: primary, justifyContent: 'center', paddingHorizontal: 20 * s }}>
                {template.custom_front_bg_url && (
                  <Image source={{ uri: resolveImageUrl(template.custom_front_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ position: 'absolute', inset: 0, opacity: 0.4 }} contentFit="cover" />
                )}
                <BrandHeader light={true} compact={true} />
              </View>
              <View style={{ height: 3 * s, backgroundColor: secondary }} />
              <View style={{ flex: 1, alignItems: 'center', padding: 24 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 100 * s, height: 120 * s, borderWidth: 1 * s, borderColor: '#e2e8f0', backgroundColor: 'white', overflow: 'hidden', marginBottom: 16 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ width: '100%', gap: 12 * s }}>
                  <View style={{ borderBottomWidth: 1 * s, borderBottomColor: '#f1f5f9', paddingBottom: 4 * s, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 8 * s, fontWeight: '900', color: '#94a3b8' }}>Full Name</Text>
                    <Text style={{ fontSize: (template.name_font_size || 11) * s, fontWeight: '900', color: primary }}>{displayName}</Text>
                  </View>
                  <View style={{ borderBottomWidth: 1 * s, borderBottomColor: '#f1f5f9', paddingBottom: 4 * s, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 8 * s, fontWeight: '900', color: '#94a3b8' }}>Designation</Text>
                    <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: secondary }}>{displayRole}</Text>
                  </View>
                  {template.show_id_number && (
                    <View style={{ borderBottomWidth: 1 * s, borderBottomColor: '#f1f5f9', paddingBottom: 4 * s, flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 8 * s, fontWeight: '900', color: '#94a3b8' }}>ID Number</Text>
                      <Text style={{ fontSize: (template.id_number_font_size || 10) * s, fontWeight: '900', color: primary }}>{displayID}</Text>
                    </View>
                  )}
                </View>
                <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  {template.show_qr && <QRCode value={qrPayload} size={52 * s} color={primary} />}
                </View>
              </View>
            </View>
          );
        } else {
          return (
            <View className="flex-1 bg-white rounded-[12px] overflow-hidden border-4" style={{ borderColor: '#1e3a8a' }}>
              <View style={{ height: 50 * s, backgroundColor: '#1e3a8a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 * s, justifyContent: 'space-between' }}>
                <BrandHeader light={true} compact={true} />
                <View style={{ width: 40 * s, height: 40 * s, backgroundColor: 'white', borderRadius: 20 * s, padding: 4 * s }}>
                   {logoUrl && <Image source={{ uri: logoUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />}
                </View>
              </View>
              <View style={{ height: 4 * s, backgroundColor: '#ef4444' }} />
              <View style={{ flex: 1, flexDirection: 'row', padding: 20 * s, alignItems: 'center' }}>
                {template.show_avatar && (
                  <View style={{ width: 120 * s, height: 120 * s, borderWidth: 2, borderColor: '#1e3a8a', padding: 2, marginRight: 24 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: (template.name_font_size || 22) * s, fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase' }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: '#ef4444' }}>{displayRole}</Text>
                  <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 * s }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 7 * s, color: '#64748b' }}>REGISTRATION NUMBER</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 11) * s, fontWeight: '900', color: '#1e3a8a' }}>{displayID}</Text>
                      </View>
                    )}
                    {template.show_qr && <QRCode value={qrPayload} size={44 * s} color="#1e3a8a" />}
                  </View>
                </View>
              </View>
            </View>
          );
        }

      case 'professional':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-slate-900 rounded-[32px] overflow-hidden">
              <View style={{ height: 8 * s, backgroundColor: primary }} />
              <View style={{ flex: 1, padding: 32 * s }}>
                <BrandHeader light={true} compact={true} />
                {template.show_avatar && (
                  <View style={{ alignSelf: 'center', width: 160 * s, height: 160 * s, borderRadius: 80 * s, overflow: 'hidden', borderWidth: 4 * s, borderColor: primary, marginVertical: 32 * s }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '800', color: 'white' }}>{displayName}</Text>
                  <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: primary, textTransform: 'uppercase', letterSpacing: 2 * s }}>{displayRole}</Text>
                </View>
                <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  {template.show_id_number && (
                    <View>
                      <Text style={{ fontSize: 7 * s, color: 'rgba(255,255,255,0.4)' }}>MEMBER ID</Text>
                      <Text style={{ fontSize: (template.id_number_font_size || 12) * s, fontWeight: '900', color: 'white' }}>{displayID}</Text>
                    </View>
                  )}
                  {template.show_qr && (
                    <View style={{ backgroundColor: 'white', padding: 4 * s, borderRadius: 8 * s }}>
                      <QRCode value={qrPayload} size={44 * s} color="#0f172a" />
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        } else {
          return (
            <View className="flex-1 bg-slate-900 rounded-[24px] overflow-hidden relative">
              <View style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', backgroundColor: primary, opacity: 0.2 }} />
              <View style={{ position: 'absolute', bottom: 0, left: 0, height: 12 * s, width: '100%', backgroundColor: primary }} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 32 * s }}>
                {template.show_avatar && (
                  <View style={{ width: 140 * s, height: 140 * s, borderRadius: 70 * s, overflow: 'hidden', borderWidth: 4 * s, borderColor: primary }}>
                    <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                )}
                <View style={{ flex: 1, paddingLeft: 32 * s }}>
                  <BrandHeader light={true} compact={true} />
                  <View style={{ marginTop: 24 * s }}>
                    <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '800', color: 'white' }}>{displayName}</Text>
                    <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: primary, textTransform: 'uppercase', letterSpacing: 2 * s }}>{displayRole}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24 * s }}>
                    {template.show_id_number && (
                      <View>
                        <Text style={{ fontSize: 7 * s, color: 'rgba(255,255,255,0.4)' }}>MEMBER ID</Text>
                        <Text style={{ fontSize: (template.id_number_font_size || 12) * s, fontWeight: '900', color: 'white' }}>{displayID}</Text>
                      </View>
                    )}
                    {template.show_qr && (
                      <View style={{ backgroundColor: 'white', padding: 4 * s, borderRadius: 4 * s }}>
                        <QRCode value={qrPayload} size={36 * s} color="#0f172a" />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        }
      default:
        return null;
    }
  };
"""

# I'll just replace the entire renderFront function in the file
pattern = re.compile(r"const renderFront = \(\) => \{(.*?)\s*const renderBack", re.DOTALL)
new_content = pattern.sub(lambda m: "const renderFront = () => {" + render_front_full + "\n\n  const renderBack", content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success: Restored and Synced renderFront")
else:
    print("Error: Could not replace renderFront")
