import sys
import re

file_path = r"c:\Users\Admin\OneDrive\Desktop\registration-system\mobile\app\(tabs)\digital-id.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicate "} else { } else {"
new_content = re.sub(r"\}\s*else\s*\{\s*\}\s*else\s*\{", "} else {", content)

# Fix "} else { } else {" where there might be some indentation
new_content = re.sub(r"\}\s*else\s*\{\s*\n\s*\}\s*else\s*\{", "} else {", new_content)

# Specifically target the exact lines I saw in view_file
# Line 882-883
new_content = new_content.replace("        } else {\n} else {", "        } else {")

# Check for other similar patterns
new_content = re.sub(r"\}\s*else\s*\{\s*\}\s*else\s*\{", "} else {", new_content)

# Fix the "}}> " error I saw earlier too, just in case
new_content = new_content.replace("        }\n        }}>\n", "        }\n")

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success: Cleaned up duplicate else blocks and syntax errors")
else:
    print("Error: No changes made")
