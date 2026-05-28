import sys
import re

file_path = r"c:\Users\Admin\OneDrive\Desktop\registration-system\mobile\app\(tabs)\digital-id.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the specific broken pattern " } } }}\n style={{ position: 'absolute' "
new_content = re.sub(r"\}\s*\}\s*\}\s*\}\s*style=\{\{\s*position:\s*'absolute'", " style={{ position: 'absolute'", content)

# Also fix the duplicate else blocks again just to be sure
new_content = re.sub(r"\}\s*else\s*\{\s*\}\s*else\s*\{", "} else {", new_content)

# Fix the dangling closing braces
new_content = new_content.replace("        }\n        } } }}", "        }")
new_content = new_content.replace("        }\n        }}", "        }")

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success: Attempted to fix broken JSX structure")
else:
    print("Error: No changes made")
