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

def fix_case(text, case_name, replacement_landscape, is_front):
    # Find the case
    case_pattern = f"case '{case_name}':"
    case_idx = text.find(case_pattern)
    if case_idx == -1: return text
    
    # Find if (isPortrait)
    if_idx = text.find("if (isPortrait)", case_idx)
    if if_idx == -1: return text
    
    # Find start of if block
    brace_start = text.find("{", if_idx)
    if brace_start == -1: return text
    
    # Find end of if block
    brace_end = find_matching_brace(text, brace_start)
    if brace_end == -1: return text
    
    # Find else
    else_idx = text.find("else", brace_end)
    if else_idx == -1: return text
    
    # Find start of else block
    else_brace_start = text.find("{", else_idx)
    if else_brace_start == -1: return text
    
    # Find end of else block
    else_brace_end = find_matching_brace(text, else_brace_start)
    if else_brace_end == -1: return text
    
    # Replace the else block content
    # Note: we want to keep the "else {" and "}" but replace everything inside
    # Actually, let's replace from else_idx to else_brace_end + 1
    
    new_else_block = "else {\n" + replacement_landscape.strip() + "\n        }"
    
    # If the replacement_landscape already includes "else { ... }", we need to adjust
    if "else {" in replacement_landscape:
        # Extract content between else { and last }
        m = re.search(r"else\s*\{(.*)\}\s*$", replacement_landscape, re.DOTALL)
        if m:
            inner_content = m.group(1).strip()
            new_else_block = "else {\n" + inner_content + "\n        }"
    
    return text[:else_idx] + new_else_block + text[else_brace_end+1:]

# Definitions from before (shortened for the script)
def get_landscape(style, front, s_var="s", primary="primary", secondary="secondary", avatar="avatar", displayName="displayName", displayRole="displayRole", displayID="displayID", qrPayload="qrPayload", template="template", signatureImage="signatureImage", resolveImageUrl="resolveImageUrl"):
    # (Omitted full code for brevity, will use direct strings in the script)
    pass

# I'll just use the strings directly in the script for reliability

minimal_front = """
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
"""

# ... (and so on for all templates)

# Actually, I'll just restore the file structure first by removing the garbage
new_content = re.sub(r"\}\s*;\s*style=\{\{.*?\}\s*\}\s*\)\s*;\s*\}", "          );\n        }", content, flags=re.DOTALL)

# Let's try to fix the "dangling style" issue specifically
new_content = re.sub(r"\);\s*\n\s*style=\{\{", ");\n          return (\n            <View style={{", new_content)

# This is too complex. I'll use a simpler approach: 
# Find all "return (\n            <View" and check if they are inside an "else {"

# I'll try to find the "garbage" strings and replace them with correct structure
garbage_pattern = r"\);\s*\}\s*\}\s*\}\s*\}\s*style=\{\{.*?\}\s*\)\s*;\s*\}"
new_content = re.sub(garbage_pattern, ");\n        }", content, flags=re.DOTALL)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success: Fixed garbage structure")
else:
    print("Error: Garbage pattern not found")
