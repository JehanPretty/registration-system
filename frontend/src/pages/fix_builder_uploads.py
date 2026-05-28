import os
import re

FILE_PATH = r"c:\Users\Admin\OneDrive\Desktop\registration-system\frontend\src\pages\IDBuilder.jsx"

def fix_id_builder_uploads():
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update handleFrontBgUpload
    old_front = r"""    const handleFrontBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const rawReader = new FileReader();
        rawReader.onload = async (ev) => {
            updateTemplate('custom_front_bg_url', ev.target.result);
            e.target.value = ""; // Reset input
        };
        rawReader.readAsDataURL(file);
    };"""

    new_front = r"""    const handleFrontBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const hide = message.loading('Uploading front template...', 0);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch(`${API_BASE_URL}/uploads`, {
                method: 'POST',
                body: formData,
                headers: { 'bypass-tunnel-reminder': 'true' }
            });
            
            if (res.ok) {
                const data = await res.json();
                updateTemplate('custom_front_bg_url', data.file_url);
                message.success('Front template uploaded!');
            } else {
                message.error('Failed to upload template.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            message.error('Network error during upload.');
        } finally {
            hide();
            e.target.value = ""; // Reset input
        }
    };"""

    # 2. Update handleBackBgUpload
    old_back = r"""    const handleBackBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const rawReader = new FileReader();
        rawReader.onload = async (ev) => {
            updateTemplate('custom_back_bg_url', ev.target.result);
            e.target.value = ""; // Reset input
        };
        rawReader.readAsDataURL(file);
    };"""

    new_back = r"""    const handleBackBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const hide = message.loading('Uploading back template...', 0);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch(`${API_BASE_URL}/uploads`, {
                method: 'POST',
                body: formData,
                headers: { 'bypass-tunnel-reminder': 'true' }
            });
            
            if (res.ok) {
                const data = await res.json();
                updateTemplate('custom_back_bg_url', data.file_url);
                message.success('Back template uploaded!');
            } else {
                message.error('Failed to upload template.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            message.error('Network error during upload.');
        } finally {
            hide();
            e.target.value = ""; // Reset input
        }
    };"""

    # 3. Update handleLogoUpload (Bonus: Server-side upload after BG removal)
    # Actually, keep it simple for now or use a two-step?
    # Let's do it right: upload the processed blob.
    
    old_logo = r"""    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setRemovingBg(true);
        const rawReader = new FileReader();
        rawReader.onload = async (ev) => {
            try {
                const transparent = await removeBackground(ev.target.result);
                updateTemplate('logo_url', transparent);
            } catch (err) {
                console.error('Background removal failed:', err);
                updateTemplate('logo_url', ev.target.result); // fallback: raw image
            } finally {
                setRemovingBg(false);
                e.target.value = ""; // Reset input
            }
        };
        rawReader.readAsDataURL(file);
    };"""

    new_logo = r"""    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setRemovingBg(true);
        const rawReader = new FileReader();
        rawReader.onload = async (ev) => {
            try {
                const transparentBase64 = await removeBackground(ev.target.result);
                
                // Convert base64 back to Blob to upload to server
                const fetchRes = await fetch(transparentBase64);
                const blob = await fetchRes.blob();
                const formData = new FormData();
                formData.append('file', blob, 'logo.png');
                
                const uploadRes = await fetch(`${API_BASE_URL}/uploads`, {
                    method: 'POST',
                    body: formData,
                    headers: { 'bypass-tunnel-reminder': 'true' }
                });
                
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    updateTemplate('logo_url', data.file_url);
                } else {
                    updateTemplate('logo_url', transparentBase64); // fallback to base64 if upload fails
                }
            } catch (err) {
                console.error('Logo process failed:', err);
                updateTemplate('logo_url', ev.target.result);
            } finally {
                setRemovingBg(false);
                e.target.value = ""; // Reset input
            }
        };
        rawReader.readAsDataURL(file);
    };"""

    content = content.replace(old_front, new_front)
    content = content.replace(old_back, new_back)
    content = content.replace(old_logo, new_logo)

    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("IDBuilder.jsx updated to use server-side file uploads")

if __name__ == "__main__":
    fix_id_builder_uploads()
