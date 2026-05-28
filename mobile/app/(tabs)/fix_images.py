import os
import re

FILE_PATH = r"c:\Users\Admin\OneDrive\Desktop\registration-system\mobile\app\(tabs)\digital-id.tsx"

def fix_image_resolution():
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update resolveImageUrl to be more robust
    old_resolve = r"""  const resolveImageUrl = (url: string) => {
    if (!url) return url;
    if (typeof url === 'string') {
      if (url.startsWith('/static')) return `${API_BASE_URL}${url}`;
      if (url.includes('/static/') && url.startsWith('http')) {
        const path = '/static/' + url.split('/static/').pop();
        return `${API_BASE_URL}${path}`;
      }
    }
    return url;
  };"""

    new_resolve = r"""  const resolveImageUrl = (url: string) => {
    if (!url) return url;
    if (typeof url === 'string') {
      // If it's a data URL (base64), return as is
      if (url.startsWith('data:')) return url;
      
      // Handle relative paths for static assets or uploads
      if (url.startsWith('/static')) return `${API_BASE_URL}${url}`;
      if (url.startsWith('/uploads')) return `${API_BASE_URL}${url.replace('/uploads', '/static')}`;
      
      // If it's an absolute URL but points to an old tunnel/domain, redirect to current API
      if (url.includes('/static/') && url.startsWith('http')) {
        const path = '/static/' + url.split('/static/').pop();
        return `${API_BASE_URL}${path}`;
      }
    }
    return url;
  };

  // Helper to get image source object safely (avoiding headers on data URLs)
  const resolveImageSource = (url: string) => {
    const resolvedUrl = resolveImageUrl(url);
    if (!resolvedUrl) return null;
    
    // Only apply tunnel bypass headers to remote HTTP URLs
    if (resolvedUrl && typeof resolvedUrl === 'string' && resolvedUrl.startsWith('http')) {
      return { uri: resolvedUrl, headers: { 'Bypass-Tunnel-Reminder': 'true' } };
    }
    
    // For data URLs or local files, return just the uri
    return { uri: resolvedUrl };
  };"""

    if old_resolve in content:
        content = content.replace(old_resolve, new_resolve)
    else:
        print("Could not find old_resolve precisely, trying fuzzy match...")
        content = re.sub(r'const resolveImageUrl = \(url: string\) => \{.*?  \};', new_resolve, content, flags=re.DOTALL)

    # 2. Update all Image source calls to use resolveImageSource
    content = re.sub(
        r"source=\{\{\s*uri:\s*resolveImageUrl\((.*?)\),\s*headers:\s*\{\s*'Bypass-Tunnel-Reminder':\s*'true'\s*\}\s*\}\}",
        r"source={resolveImageSource(\1)}",
        content
    )
    
    content = re.sub(
        r"source=\{\{\s*uri:\s*resolveImageUrl\((.*?)\)\s*\}\}",
        r"source={resolveImageSource(\1)}",
        content
    )

    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Image resolution fix applied to digital-id.tsx")

if __name__ == "__main__":
    fix_image_resolution()
