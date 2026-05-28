import sys
import re

file_path = r"c:\Users\Admin\OneDrive\Desktop\registration-system\mobile\app\(tabs)\digital-id.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# ---------------------------------------------------------
# ACADEMIC FRONT LANDSCAPE
# ---------------------------------------------------------
replacement_academic_front = """        } else {
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
        }"""

# ---------------------------------------------------------
# ACADEMIC BACK LANDSCAPE
# ---------------------------------------------------------
replacement_academic_back = """        } else {
          return (
            <View className="flex-1 bg-white border-2 rounded-[24px] overflow-hidden flex-col" style={{ borderColor: primary }}>
              <View style={{ height: 40 * s, backgroundColor: primary, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {template.custom_back_bg_url && (
                  <Image source={{ uri: resolveImageUrl(template.custom_back_bg_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ position: 'absolute', inset: 0, opacity: 0.3 }} contentFit="cover" />
                )}
                <Text style={{ color: 'white', fontSize: 10 * s, fontWeight: '900', letterSpacing: 1 * s, textTransform: 'uppercase' }}>Property of Institution</Text>
              </View>
              <View style={{ height: 8 * s, backgroundColor: secondary }} />
              <View style={{ flex: 1, padding: 32 * s, alignItems: 'center' }}>
                <View style={{ marginBottom: 32 * s, width: '100%', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11 * s, fontWeight: '900', color: primary, marginBottom: 8 * s }}>Official Usage & Terms</Text>
                  <Text style={{ fontSize: 9 * s, color: '#64748b', fontWeight: '700', fontStyle: 'italic', paddingHorizontal: 24 * s, textAlign: 'center', lineHeight: 14 * s }}>
                    "{template.back_content || "Carry this card at all times. Use of campus facilities requires valid institutional identification."}"
                  </Text>
                </View>

                <View style={{ marginTop: 'auto', width: '100%' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', paddingHorizontal: 8 * s, marginBottom: 24 * s }}>
                    {/* Left Signature */}
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{ height: 48 * s, marginBottom: -12 * s, zIndex: 20 }}>
                        {signatureImage ? (
                          <Image source={{ uri: signatureImage, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 120 * s, height: 48 * s }} contentFit="contain" />
                        ) : (
                          <View style={{ height: 40 * s }} />
                        )}
                      </View>
                      <Text style={{ fontSize: 9 * s, fontWeight: '900', color: '#1e293b', paddingTop: 8 * s }}>{displayName}</Text>
                      <View style={{ width: 120 * s, height: 1 * s, backgroundColor: 'rgba(30,41,59,0.1)', marginVertical: 2 * s }} />
                      <Text style={{ fontSize: 6 * s, fontWeight: '900', color: secondary, textTransform: 'uppercase', letterSpacing: 1 * s }}>Signature</Text>
                    </View>

                    {/* Right Signature */}
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{ height: 40 * s, marginBottom: -10 * s, zIndex: 20 }}>
                        {template.authorized_signature_url ? (
                          <Image source={{ uri: resolveImageUrl(template.authorized_signature_url), headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: 100 * s, height: 40 * s }} contentFit="contain" />
                        ) : (
                          <View style={{ height: 40 * s }} />
                        )}
                      </View>
                      <Text style={{ fontSize: 9 * s, fontWeight: '900', color: '#1e293b', paddingTop: 8 * s }}>{template.authorized_name || "Registrar"}</Text>
                      <View style={{ width: 120 * s, height: 1 * s, backgroundColor: 'rgba(30,41,59,0.1)', marginVertical: 2 * s }} />
                      <Text style={{ fontSize: 6 * s, fontWeight: '900', color: secondary, textTransform: 'uppercase', letterSpacing: 1 * s }}>{template.signature_label || "Authorized"}</Text>
                    </View>
                  </View>

                  {template.show_barcode && (
                    <View style={{ alignItems: 'center', width: '100%', pt: 16 * s, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                      <Barcode color={primary} />
                      <Text style={{ fontSize: 8 * s, fontWeight: '700', color: '#cbd5e1', letterSpacing: 4 * s, marginTop: 6 * s, textTransform: 'uppercase' }}>{displayID}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }"""

# ---------------------------------------------------------
# FIXING THE FILE
# ---------------------------------------------------------

# First, let's identify the renderFront and renderBack blocks
render_front_match = re.search(r"const renderFront = \(\) => \{(.*?)\s*const renderBack", content, re.DOTALL)
render_back_match = re.search(r"const renderBack = \(\) => \{(.*?)\s*return \(", content, re.DOTALL)

if render_front_match and render_back_match:
    render_front_code = render_front_match.group(1)
    render_back_code = render_back_match.group(1)
    
    # Replace Academic in Front
    render_front_code = re.sub(r"case\s+'academic':\s*if\s*\(isPortrait\)\s*\{.*?\}\s*else\s*\{.*?\}", 
                               lambda m: "case 'academic':\n        if (isPortrait) {" + m.group(0).split("if (isPortrait) {")[1].split("} else {")[0] + "} else {\n" + replacement_academic_front.strip() + "\n        }",
                               render_front_code, flags=re.DOTALL)
                               
    # Replace Academic in Back
    render_back_code = re.sub(r"case\s+'academic':\s*if\s*\(isPortrait\)\s*\{.*?\}\s*else\s*\{.*?\}", 
                               lambda m: "case 'academic':\n        if (isPortrait) {" + m.group(0).split("if (isPortrait) {")[1].split("} else {")[0] + "} else {\n" + replacement_academic_back.strip() + "\n        }",
                               render_back_code, flags=re.DOTALL)

    # Reconstruct content
    new_content = content[:render_front_match.start(1)] + render_front_code + content[render_front_match.end(1):render_back_match.start(1)] + render_back_code + content[render_back_match.end(1):]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success: Updated Academic Front and Back")
else:
    print("Error: Could not find renderFront or renderBack blocks")
