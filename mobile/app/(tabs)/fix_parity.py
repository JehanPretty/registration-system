import os
import re

FILE_PATH = r"c:\Users\Admin\OneDrive\Desktop\registration-system\mobile\app\(tabs)\digital-id.tsx"

def get_brand_header_replacement():
    return r"""  const BrandHeader = ({ light = true, compact = false }) => {
    const headerText = (template.header_text !== undefined && template.header_text !== null) ? template.header_text : "Republic of the Philippines";
    const instName = (template.institution_name !== undefined && template.institution_name !== null) ? template.institution_name : "Philceb Innovation";
    const instSub = (template.institution_subtitle !== undefined && template.institution_subtitle !== null) ? template.institution_subtitle : "Empowering Technology";
    
    const hSize = (template.header_font_size || (compact ? 5 : 6)) * s;
    const iSize = (template.institution_font_size || (compact ? 10 : 12)) * s;
    const sSize = (template.subtitle_font_size || (compact ? 6 : 7)) * s;
    const lSize = (template.logo_size || (compact ? 36 : 48)) * s;

    const getAutoColor = (customColor, defaultLight, defaultDark) => {
      if (!customColor || customColor === "") return light ? defaultLight : defaultDark;
      if (!light && (customColor.toLowerCase() === '#ffffff' || customColor.toLowerCase() === 'white')) return defaultDark;
      return customColor;
    };

    const hColor = getAutoColor(template.header_color, 'rgba(255,255,255,0.6)', 'rgba(100,116,139,0.6)');
    const iColor = getAutoColor(template.institution_color, '#ffffff', '#1e1b4b');
    const sColor = getAutoColor(template.subtitle_color, 'rgba(255,255,255,0.5)', 'rgba(100,116,139,0.5)');

    return (
      <View style={{ flexDirection: compact ? 'row' : 'column', alignItems: 'center', gap: compact ? 12 * s : 8 * s }}>
        {logoUrl ? (
          <Image 
            source={{ uri: logoUrl, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} 
            style={{ width: lSize, height: lSize }} 
            contentFit="contain" 
          />
        ) : null}
        <View style={{ alignItems: compact ? 'flex-start' : 'center' }}>
          {headerText ? (
            <Text style={{ fontSize: hSize, fontWeight: '900', color: hColor, letterSpacing: 1.5 * s, textTransform: 'uppercase', marginBottom: 2 * s }}>{headerText}</Text>
          ) : null}
          <Text style={{ fontSize: iSize, fontWeight: '900', color: iColor, letterSpacing: 0.5 * s, textAlign: compact ? 'left' : 'center' }}>{instName}</Text>
          {instSub ? (
            <Text style={{ fontSize: sSize, fontWeight: '700', color: sColor, letterSpacing: 1 * s, marginTop: 2 * s, textAlign: compact ? 'left' : 'center', textTransform: 'uppercase' }}>{instSub}</Text>
          ) : null}
        </View>
      </View>
    );
  };"""

def get_corporate_landscape_replacement():
    return r"""        } else {
          return (
            <View className="flex-1 bg-white rounded-[24px] overflow-hidden border border-slate-100 flex-row">
              <View style={{ width: 40 * s, height: '100%', backgroundColor: primary }} />
              <View style={{ flex: 1, padding: 32 * s, position: 'relative', overflow: 'hidden' }}>
                {template.custom_front_bg_url && (
                  <View style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: primary }}>
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

                {template.show_avatar && (
                  <View style={{ position: 'absolute', left: 32 * s, top: 48 * s + 60 * s, zIndex: 15 }}>
                    <View style={{ width: 140 * s, height: 140 * s, borderRadius: 16 * s, overflow: 'hidden', borderWidth: 4 * s, borderColor: '#f8fafc', shadowColor: '#000', shadowOffset: { width: 0, height: 4 * s }, shadowOpacity: 0.1, shadowRadius: 10 * s, elevation: 5, backgroundColor: 'white' }}>
                      <Image source={{ uri: avatar, headers: { 'Bypass-Tunnel-Reminder': 'true' } }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    </View>
                  </View>
                )}

                <View style={{ flex: 1, paddingTop: 112 * s, paddingLeft: template.show_avatar ? 160 * s : 0, position: 'relative', zIndex: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: (template.name_font_size || 24) * s, fontWeight: '900', color: template.name_color || primary }} numberOfLines={1}>{displayName}</Text>
                    <Text style={{ fontSize: (template.role_font_size || 10) * s, fontWeight: '700', color: template.role_color || secondary, marginTop: 2 * s }}>{displayRole}</Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingBottom: 8 * s }}>
                      {template.show_id_number && (
                        <View>
                          <Text style={{ fontSize: 7 * s, color: template.custom_front_bg_url ? 'rgba(0,0,0,0.4)' : '#cbd5e1', fontWeight: '900', textTransform: 'uppercase' }}>System ID</Text>
                          <Text style={{ fontSize: (template.id_number_font_size || 9) * s, fontWeight: '900', color: template.id_number_color || primary, letterSpacing: 3 * s }}>{displayID}</Text>
                        </View>
                      )}
                      {template.show_qr && (
                        <View style={{ padding: 6 * s, backgroundColor: 'white', borderRadius: 12 * s, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 }}>
                          <QRCode value={qrPayload} size={44 * s} color={primary} />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
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

    # 1. Replace BrandHeader
    bh_pattern = re.compile(r'const BrandHeader = \({ light = true, compact = false }\) => \{.*?^\s*};', re.MULTILINE | re.DOTALL)
    content = bh_pattern.sub(get_brand_header_replacement(), content)

    # 2. Replace Corporate Landscape Front
    # Need to find the correct switch case block
    corp_pattern = re.compile(r"case 'corporate':.*?if \(isPortrait\) \{.*?\} else \{.*?\}", re.MULTILINE | re.DOTALL)
    
    # Actually, the switch is inside renderFront
    # I'll look for the specific block
    # Let's use a more precise regex for the corporate landscape part
    corp_landscape_pattern = re.compile(r"\} else \{\s+return \(\s+<View className=\"flex-1 bg-white rounded-\[24px\] overflow-hidden border border-slate-100 flex-row\">.*?</View>\s+\);\s+\}", re.MULTILINE | re.DOTALL)
    # This might match other templates if I'm not careful. 
    # But since I know the structure of my corporate template:
    # I'll target the one that has width: 40 * s
    
    if "width: 40 * s, height: '100%', backgroundColor: primary" in content:
        content = corp_landscape_pattern.sub(get_corporate_landscape_replacement(), content)

    # 3. Ensure Contrast logic
    # Adding a helper function inside DigitalIDCardComponent if not present
    if "const ensureContrast =" not in content:
        helper = r"""  const ensureContrast = (color) => {
    if (color && (color.toLowerCase() === "#ffffff" || color.toLowerCase() === "white")) return "#1e293b";
    return color;
  };
"""
        # Insert before renderFront
        content = content.replace("const renderFront = () => {", helper + "  const renderFront = () => {")

    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Parity fix applied successfully")

if __name__ == "__main__":
    main()
