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

def replace_case_completely(text, switch_name, case_name, new_case_code):
    switch_idx = text.find(f"const {switch_name} = () =>")
    if switch_idx == -1: return text
    case_pattern = f"case '{case_name}':"
    case_idx = text.find(case_pattern, switch_idx)
    if case_idx == -1: return text
    next_case_idx = text.find("case '", case_idx + 1)
    if next_case_idx == -1:
        next_case_idx = text.find("default:", case_idx + 1)
        if next_case_idx == -1:
            next_case_idx = find_matching_brace(text, text.find("{", switch_idx))
    if next_case_idx == -1: return text
    return text[:case_idx] + new_case_code.strip() + "\n\n      " + text[next_case_idx:]

# BOLD FRONT
bold_front = """
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
"""

# GOV FRONT
gov_front = """
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
"""

# PRO FRONT
pro_front = """
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
"""

new_content = replace_case_completely(content, "renderFront", "bold", bold_front)
new_content = replace_case_completely(new_content, "renderFront", "government", gov_front)
new_content = replace_case_completely(new_content, "renderFront", "professional", pro_front)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Success: Fixed Bold, Gov, Pro Front")
