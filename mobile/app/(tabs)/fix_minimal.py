import sys
import re

file_path = r"c:\Users\Admin\OneDrive\Desktop\registration-system\mobile\app\(tabs)\digital-id.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Helper to find matching brace
def find_matching_brace(text, start_index):
    count = 0
    for i in range(start_index, len(text)):
        if text[i] == '{':
            count += 1
        elif text[i] == '}':
            count -= 1
            if count == 0:
                return i
    return -1

def replace_case_completely(text, switch_name, case_name, new_case_code):
    # Find the switch
    switch_idx = text.find(f"const {switch_name} = () =>")
    if switch_idx == -1: return text
    
    # Find the case within the switch
    case_pattern = f"case '{case_name}':"
    case_idx = text.find(case_pattern, switch_idx)
    if case_idx == -1: return text
    
    # We need to find where this case ends. 
    # Usually it ends before the next 'case' or the end of the switch.
    next_case_idx = text.find("case '", case_idx + 1)
    if next_case_idx == -1:
        # Might be the last case
        next_case_idx = text.find("default:", case_idx + 1)
        if next_case_idx == -1:
            # End of switch?
            next_case_idx = find_matching_brace(text, text.find("{", switch_idx))
    
    if next_case_idx == -1: return text
    
    return text[:case_idx] + new_case_code.strip() + "\n\n" + text[next_case_idx:]

# Define all cases
# (I'll define them as I go in the script)

# --- MINIMAL FRONT ---
minimal_front = """
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
"""

# --- MINIMAL BACK ---
minimal_back = """
      case 'minimal':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-white relative overflow-hidden">
              <View style={{ height: 4 * s, backgroundColor: secondary }} />
              <View style={{ flex: 1, padding: 40 * s, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10 * s, fontWeight: '900', color: '#cbd5e1', textAlign: 'center', marginBottom: 40 * s, fontStyle: 'italic', lineHeight: 16 * s }}>
                  {template.back_content || "Unauthorized use of this identity document is prohibited by law."}
                </Text>
                <View style={{ flexDirection: 'row', gap: 40 * s }}>
                  <View style={{ alignItems: 'center' }}>
                    {template.show_user_signature ? (
                      <>
                        <View style={{ height: 40 * s, marginBottom: -8 * s, zIndex: 20 }}>
                          {signatureImage && (
                            <Image source={{ uri: signatureImage, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 80 * s, height: 48 * s }} contentFit="contain" />
                          )}
                        </View>
                        <Text style={{ fontSize: 9 * s, fontWeight: '900', color: '#94a3b8', paddingTop: 8 * s }}>{displayName}</Text>
                        <View style={{ width: 60 * s, height: 1 * s, backgroundColor: '#f1f5f9', marginVertical: 4 * s }} />
                        <Text style={{ fontSize: 7 * s, fontWeight: '900', color: '#cbd5e1' }}>Signature</Text>
                      </>
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 7 * s, fontWeight: '900', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 4 * s }}>Contact</Text>
                        <Text style={{ fontSize: 10 * s, fontWeight: '900', color: '#94a3b8' }}>{template.back_contact || "000-0000"}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ height: 40 * s, marginBottom: -8 * s, zIndex: 20 }}>
                      {template.authorized_signature_url && (
                        <Image source={{ uri: resolveImageUrl(template.authorized_signature_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 80 * s, height: 48 * s }} contentFit="contain" />
                      )}
                    </View>
                    <Text style={{ fontSize: 9 * s, fontWeight: '900', color: '#94a3b8', paddingTop: 8 * s }}>{template.authorized_name || "Registrar"}</Text>
                    <View style={{ width: 60 * s, height: 1 * s, backgroundColor: '#f1f5f9', marginVertical: 4 * s }} />
                    <Text style={{ fontSize: 7 * s, fontWeight: '900', color: '#cbd5e1' }}>Authorized</Text>
                  </View>
                </View>
                {template.show_barcode && (
                  <View style={{ marginTop: 40 * s }}>
                    <Barcode color="#cbd5e1" height={32 * s} />
                  </View>
                )}
              </View>
            </View>
          );
        } else {
          return (
            <View className="flex-1 bg-white rounded-[16px] overflow-hidden flex-row border border-slate-200">
              <View style={{ flex: 1.5, padding: 24 * s, borderRightWidth: 1, borderRightColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 10 * s, fontWeight: '800', color: '#1e293b', marginBottom: 8 * s }}>Information</Text>
                <Text style={{ fontSize: 8 * s, color: '#64748b', lineHeight: 12 * s }}>
                  {template.back_content || "This digital ID is valid for official identification within the system network."}
                </Text>
                <View style={{ marginTop: 'auto' }}>
                   <Barcode color="#1e293b" height={30 * s} />
                </View>
              </View>
              <View style={{ flex: 1, padding: 24 * s, justifyContent: 'center' }}>
                <View style={{ alignItems: 'center', marginBottom: 24 * s }}>
                  {template.authorized_signature_url && (
                    <Image source={{ uri: resolveImageUrl(template.authorized_signature_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 80 * s, height: 40 * s }} contentFit="contain" />
                  )}
                  <Text style={{ fontSize: 8 * s, fontWeight: '700', color: '#1e293b', borderTopWidth: 1, borderTopColor: '#e2e8f0', width: '100%', textAlign: 'center', marginTop: 4 * s }}>{template.authorized_name || "Authorized"}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  {signatureImage && (
                    <Image source={{ uri: signatureImage, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 80 * s, height: 40 * s }} contentFit="contain" />
                  )}
                  <Text style={{ fontSize: 8 * s, fontWeight: '700', color: '#1e293b', borderTopWidth: 1, borderTopColor: '#e2e8f0', width: '100%', textAlign: 'center', marginTop: 4 * s }}>{displayName}</Text>
                </View>
              </View>
            </View>
          );
        }
"""

# ... (I'll do the same for bold, government, professional in the final script)

# Applying fixes
new_content = replace_case_completely(content, "renderFront", "minimal", minimal_front)
new_content = replace_case_completely(new_content, "renderBack", "minimal", minimal_back)

# (Add other cases here in the actual file)
# I'll just save the script and run it.
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Success: Fixed Minimal cases")
