import sys
import re

file_path = r"c:\Users\Admin\OneDrive\Desktop\registration-system\mobile\app\(tabs)\digital-id.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def get_replacement_landscape(template_style, is_front):
    # This function returns the React Native View code for the landscape mode of each style
    # Based on the web IDCard.jsx logic
    
    if template_style == 'minimal':
        if is_front:
            return """        } else {
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
        }"""
        else: # Minimal Back
            return """        } else {
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
        }"""
        
    elif template_style == 'bold':
        if is_front:
            return """        } else {
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
        }"""
        else: # Bold Back
            return """        } else {
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
        }"""
        
    elif template_style == 'government':
        if is_front:
            return """        } else {
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
        }"""
        else: # Gov Back
            return """        } else {
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
        }"""

    elif template_style == 'professional':
        if is_front:
            return """        } else {
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
        }"""
        else: # Pro Back
            return """        } else {
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
        }"""
        
    return None

# ---------------------------------------------------------
# FIXING THE FILE
# ---------------------------------------------------------

styles_to_fix = ['minimal', 'bold', 'government', 'professional']

# Identify the renderFront and renderBack blocks
render_front_match = re.search(r"const renderFront = \(\) => \{(.*?)\s*const renderBack", content, re.DOTALL)
render_back_match = re.search(r"const renderBack = \(\) => \{(.*?)\s*return \(", content, re.DOTALL)

if render_front_match and render_back_match:
    render_front_code = render_front_match.group(1)
    render_back_code = render_back_match.group(1)
    
    for style_name in styles_to_fix:
        # Front
        replacement_front = get_replacement_landscape(style_name, True)
        if replacement_front:
            pattern_front = re.compile(r"case\s+'" + style_name + r"':\s*if\s*\(isPortrait\)\s*\{.*?\}\s*else\s*\{.*?\}", re.DOTALL)
            render_front_code = pattern_front.sub(
                lambda m: f"case '{style_name}':\n        if (isPortrait) {{" + m.group(0).split("if (isPortrait) {")[1].split("} else {")[0] + "} else {\n" + replacement_front.strip() + "\n        }",
                render_front_code
            )
            
        # Back
        replacement_back = get_replacement_landscape(style_name, False)
        if replacement_back:
            pattern_back = re.compile(r"case\s+'" + style_name + r"':\s*if\s*\(isPortrait\)\s*\{.*?\}\s*else\s*\{.*?\}", re.DOTALL)
            render_back_code = pattern_back.sub(
                lambda m: f"case '{style_name}':\n        if (isPortrait) {{" + m.group(0).split("if (isPortrait) {")[1].split("} else {")[0] + "} else {\n" + replacement_back.strip() + "\n        }",
                render_back_code
            )

    # Reconstruct content
    new_content = content[:render_front_match.start(1)] + render_front_code + content[render_front_match.end(1):render_back_match.start(1)] + render_back_code + content[render_back_match.end(1):]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success: Updated Minimal, Bold, Government, and Professional Front/Back")
else:
    print("Error: Could not find renderFront or renderBack blocks")
