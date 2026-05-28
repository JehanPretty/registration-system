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

# BOLD BACK
bold_back = """
      case 'bold':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-white rounded-[28px] overflow-hidden relative">
              {template.custom_back_bg_url && (
                <Image
                  source={{ uri: resolveImageUrl(template.custom_back_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }}
                  style={{ position: 'absolute', inset: 0, opacity: 0.3 }}
                  contentFit="cover"
                />
              )}
              <View style={{ position: 'absolute', top: 0, left: 0, width: 300 * s, height: 300 * s, borderRadius: 150 * s, backgroundColor: secondary, opacity: 0.05, marginTop: -150 * s, marginLeft: -150 * s }} />
              <View style={{ flex: 1, padding: 40 * s }}>
                <View style={{ borderBottomWidth: 1 * s, borderColor: '#f1f5f9', paddingBottom: 24 * s, marginBottom: 'auto' }}>
                  <Text style={{ fontSize: 14 * s, fontWeight: '900', color: primary, marginBottom: 16 * s }}>Terms & Conditions</Text>
                  <Text style={{ fontSize: 10 * s, fontWeight: '700', color: '#64748b', lineHeight: 18 * s }}>
                    {template.back_content || "Any alteration of this record is a criminal offense. This card must be presented upon request by authorized officials."}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 24 * s }}>
                  <View style={{ alignItems: 'center' }}>
                    {template.show_user_signature ? (
                      <>
                        <View style={{ height: 40 * s, marginBottom: -12 * s, zIndex: 20 }}>
                          {signatureImage && (
                            <Image source={{ uri: signatureImage, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 100 * s, height: 60 * s }} contentFit="contain" />
                          )}
                        </View>
                        <Text style={{ fontSize: 9 * s, fontWeight: '900', color: primary, paddingTop: 8 * s }}>{displayName}</Text>
                        <View style={{ width: 80 * s, height: 1 * s, backgroundColor: '#f1f5f9', marginVertical: 4 * s }} />
                        <Text style={{ fontSize: 7 * s, fontWeight: '900', color: '#cbd5e1' }}>Signature</Text>
                      </>
                    ) : (
                      <View style={{ alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 8 * s, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 * s }}>Support</Text>
                        <Text style={{ fontSize: 12 * s, fontWeight: '900', color: primary }}>{template.back_contact || "+1 (555) 000-0000"}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ height: 40 * s, marginBottom: -12 * s, zIndex: 20 }}>
                      {template.authorized_signature_url && (
                        <Image source={{ uri: resolveImageUrl(template.authorized_signature_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 100 * s, height: 60 * s }} contentFit="contain" />
                      )}
                    </View>
                    <Text style={{ fontSize: 9 * s, fontWeight: '900', color: primary, paddingTop: 8 * s }}>{template.authorized_name || "Registrar"}</Text>
                    <View style={{ width: 80 * s, height: 1 * s, backgroundColor: '#f1f5f9', marginVertical: 4 * s }} />
                    <Text style={{ fontSize: 7 * s, fontWeight: '900', color: '#cbd5e1' }}>{template.signature_label || "Authorized"}</Text>
                  </View>
                </View>
                {template.show_barcode && (
                  <View style={{ marginTop: 'auto', alignItems: 'center' }}>
                    <Barcode color={primary} opacity={0.3} />
                    <Text style={{ fontSize: 9 * s, fontWeight: '700', color: '#cbd5e1', letterSpacing: 6 * s, marginTop: 8 * s }}>{displayID}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        } else {
          return (
            <View className="flex-1 bg-white rounded-[24px] overflow-hidden">
              <View style={{ height: 60 * s, backgroundColor: primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 * s }}>
                <Text style={{ color: 'white', fontSize: 12 * s, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 * s }}>Official Access Card</Text>
              </View>
              <View style={{ flex: 1, padding: 32 * s }}>
                <Text style={{ fontSize: 10 * s, color: '#64748b', fontWeight: '600', lineHeight: 16 * s, marginBottom: 24 * s }}>
                  {template.back_content || "This card must be presented upon request. Property of the issuing organization. If found, please return to the nearest authorities."}
                </Text>
                <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <View style={{ flex: 1 }}>
                    <Barcode color={primary} height={40 * s} />
                    <Text style={{ fontSize: 9 * s, fontWeight: '900', color: primary, marginTop: 8 * s }}>{displayID}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    {template.authorized_signature_url && (
                      <Image source={{ uri: resolveImageUrl(template.authorized_signature_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 100 * s, height: 40 * s }} contentFit="contain" />
                    )}
                    <Text style={{ fontSize: 8 * s, fontWeight: '900', color: '#1e293b', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 4 * s }}>Authorized Signature</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        }
"""

# GOV BACK
gov_back = """
      case 'government':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-white border rounded-[16px] overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <View style={{ height: 32 * s, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontSize: 9 * s, fontWeight: '900', letterSpacing: 1 * s }}>OFFICIAL DOCUMENT</Text>
              </View>
              <View style={{ flex: 1, padding: 32 * s, alignItems: 'center' }}>
                <Text style={{ fontSize: 9 * s, color: '#64748b', fontWeight: '700', textAlign: 'center', lineHeight: 14 * s, marginBottom: 32 * s }}>
                  {template.back_content || "This identification card is issued under the authority of the government. Any alteration or misuse is punishable by law."}
                </Text>
                <View style={{ width: '100%', height: 1 * s, backgroundColor: '#f1f5f9', marginBottom: 24 * s }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 32 * s }}>
                  <View style={{ alignItems: 'center' }}>
                    {template.authorized_signature_url && (
                      <Image source={{ uri: resolveImageUrl(template.authorized_signature_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 80 * s, height: 40 * s }} contentFit="contain" />
                    )}
                    <Text style={{ fontSize: 8 * s, fontWeight: '900', color: primary, borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 4 * s, width: 100 * s, textAlign: 'center' }}>{template.authorized_name || "Official"}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 'auto', alignItems: 'center' }}>
                  <Barcode color={primary} opacity={0.2} />
                  <Text style={{ fontSize: 8 * s, fontWeight: '700', color: '#94a3b8', marginTop: 8 * s }}>{displayID}</Text>
                </View>
              </View>
            </View>
          );
        } else {
          return (
            <View className="flex-1 bg-white rounded-[12px] overflow-hidden flex-col border-4" style={{ borderColor: '#1e3a8a' }}>
               <View style={{ height: 30 * s, backgroundColor: '#1e3a8a', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 9 * s, fontWeight: '900' }}>OFFICIAL GOVERNMENT DOCUMENT</Text>
               </View>
               <View style={{ flex: 1, padding: 24 * s, alignItems: 'center' }}>
                  <Barcode color="#1e3a8a" height={40 * s} />
                  <Text style={{ fontSize: 10 * s, color: '#1e3a8a', fontWeight: '800', marginTop: 12 * s, textAlign: 'center' }}>
                    {template.back_content || "This identification card is issued under the authority of the government. Any alteration or misuse is punishable by law."}
                  </Text>
                  <View style={{ marginTop: 'auto', width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 40 * s }}>
                     <View style={{ alignItems: 'center' }}>
                        {template.authorized_signature_url && <Image source={{ uri: resolveImageUrl(template.authorized_signature_url) }} style={{ width: 100 * s, height: 40 * s }} contentFit="contain" />}
                        <Text style={{ fontSize: 8 * s, fontWeight: '900', color: '#1e3a8a', borderTopWidth: 1, borderColor: '#1e3a8a', marginTop: 4 * s, width: 120 * s, textAlign: 'center' }}>{template.authorized_name || "Official Signature"}</Text>
                     </View>
                  </View>
               </View>
            </View>
          );
        }
"""

# PRO BACK
pro_back = """
      case 'professional':
        if (isPortrait) {
          return (
            <View className="flex-1 bg-slate-900 rounded-[32px] overflow-hidden">
              <View style={{ flex: 1, padding: 32 * s }}>
                <Text style={{ fontSize: 10 * s, color: 'rgba(255,255,255,0.5)', lineHeight: 16 * s, marginBottom: 32 * s }}>
                  {template.back_content || "Professional member identification. Valid only with current subscription status. Property of the issuing body."}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 * s }}>
                   <View style={{ alignItems: 'center' }}>
                      {template.authorized_signature_url && <Image source={{ uri: resolveImageUrl(template.authorized_signature_url) }} style={{ width: 100 * s, height: 40 * s }} contentFit="contain" />}
                      <Text style={{ fontSize: 8 * s, color: 'white', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingTop: 4 * s, width: 120 * s, textAlign: 'center' }}>Authorized Official</Text>
                   </View>
                </View>
                <View style={{ marginTop: 'auto', alignItems: 'center' }}>
                  <Barcode color="white" opacity={0.3} />
                  <Text style={{ fontSize: 8 * s, color: primary, marginTop: 8 * s, fontWeight: '900' }}>{displayID}</Text>
                </View>
              </View>
              <View style={{ height: 8 * s, backgroundColor: primary }} />
            </View>
          );
        } else {
          return (
            <View className="flex-1 bg-slate-900 rounded-[24px] overflow-hidden flex-col">
              <View style={{ height: 12 * s, backgroundColor: primary }} />
              <View style={{ flex: 1, padding: 32 * s }}>
                <Text style={{ fontSize: 10 * s, color: 'rgba(255,255,255,0.6)', lineHeight: 16 * s, marginBottom: 24 * s }}>
                  {template.back_content || "Professional member identification. Valid only with current subscription status. Property of the issuing body."}
                </Text>
                <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                   <View>
                      <Barcode color="white" height={40 * s} />
                      <Text style={{ fontSize: 8 * s, color: primary, marginTop: 8 * s, fontWeight: '900' }}>{displayID}</Text>
                   </View>
                   <View style={{ alignItems: 'center' }}>
                      {template.authorized_signature_url && <Image source={{ uri: resolveImageUrl(template.authorized_signature_url) }} style={{ width: 100 * s, height: 40 * s }} contentFit="contain" />}
                      <Text style={{ fontSize: 8 * s, color: 'white', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingTop: 4 * s, width: 120 * s, textAlign: 'center' }}>Authorized Official</Text>
                   </View>
                </View>
              </View>
            </View>
          );
        }
"""

new_content = replace_case_completely(content, "renderBack", "bold", bold_back)
new_content = replace_case_completely(new_content, "renderBack", "government", gov_back)
new_content = replace_case_completely(new_content, "renderBack", "professional", pro_back)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Success: Fixed Bold, Gov, Pro Back")
