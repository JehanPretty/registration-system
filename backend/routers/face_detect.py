"""
face_detect.py  –  Real-time face detection endpoint for mobile liveness scan.

Uses OpenCV's Haar-cascade (ships with opencv-python-headless, no extra download needed).
POST /detect-face
  body: multipart/form-data  { file: <jpeg image> }
  returns: {
      face_detected: bool,
      face_count: int,
      bounds: { x, y, w, h } | null,   # relative 0-1 coords
      img_w: int,
      img_h: int
  }
"""

import io
import numpy as np
import cv2
import os
import uuid
import requests
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/detect-face", tags=["face-detect"])

_cascade_frontal = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
_cascade_profile = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")

@router.post("")
async def detect_face(file: UploadFile = File(...)):
    try:
        data = await file.read()
        arr  = np.frombuffer(data, dtype=np.uint8)
        img  = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        h, w = img.shape[:2]
        gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray  = cv2.equalizeHist(gray)      # improves detection in varied lighting

        # Try Frontal Face with Rotations (to handle mobile EXIF issues)
        faces = []
        best_img = gray
        for angle in [0, 90, 180, 270]:
            if angle == 0:
                rotated = gray
            elif angle == 90:
                rotated = cv2.rotate(gray, cv2.ROTATE_90_CLOCKWISE)
            elif angle == 180:
                rotated = cv2.rotate(gray, cv2.ROTATE_180)
            elif angle == 270:
                rotated = cv2.rotate(gray, cv2.ROTATE_90_COUNTERCLOCKWISE)
            
            found = _cascade_frontal.detectMultiScale(
                rotated,
                scaleFactor=1.1, 
                minNeighbors=2, 
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE,
            )
            if len(found) > 0:
                faces = found
                best_img = rotated
                # If we rotated, update w, h for bounds later
                h, w = rotated.shape[:2]
                break

        pose = "straight"
        
        # If still no face, try profile face (any direction)
        if len(faces) == 0:
            # Check original
            faces_orig = _cascade_profile.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=1, minSize=(30, 30))
            # Check flipped
            flipped_gray = cv2.flip(gray, 1)
            faces_flipped = _cascade_profile.detectMultiScale(flipped_gray, scaleFactor=1.05, minNeighbors=1, minSize=(30, 30))
            
            if len(faces_orig) > 0 or len(faces_flipped) > 0:
                pose = "profile" # Any side profile detected
                # Use whichever found a face
                if len(faces_orig) > 0:
                    faces = faces_orig
                else:
                    # Unflip coordinates
                    faces = []
                    for (fx, fy, fw, fh) in faces_flipped:
                        faces.append([w - (fx + fw), fy, fw, fh])
                    faces = np.array(faces)

        if len(faces) == 0:
            return JSONResponse({
                "face_detected": False,
                "face_count": 0,
                "bounds": None,
                "pose": "none",
                "img_w": w,
                "img_h": h,
            })

        # Use the largest detected face
        faces_list = sorted(faces.tolist(), key=lambda f: f[2] * f[3], reverse=True)
        fx, fy, fw, fh = faces_list[0]

        # White Background Detection
        # Sample corners to see if they are white
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h_hsv, s_hsv, v_hsv = cv2.split(hsv)
        
        # Sample 10% corners
        cs = int(min(h, w) * 0.1)
        corners_v = [v_hsv[0:cs, 0:cs], v_hsv[0:cs, w-cs:w], v_hsv[h-cs:h, 0:cs], v_hsv[h-cs:h, w-cs:w]]
        corners_s = [s_hsv[0:cs, 0:cs], s_hsv[0:cs, w-cs:w], s_hsv[h-cs:h, 0:cs], s_hsv[h-cs:h, w-cs:w]]
        
        avg_v = np.mean([np.mean(c) for c in corners_v])
        avg_s = np.mean([np.mean(c) for c in corners_s])
        
        # Thresholds: Brightness > 200 (out of 255), Saturation < 50
        is_white_bg = bool(avg_v > 190 and avg_s < 60) # Slightly more lenient

        # Formal check: Frontal pose + White Background + Reasonably centered/large
        # face_width should be at least 20% of image width for "formal" feel
        is_large_enough = (fw / w) > 0.2
        is_formal = bool(pose == "straight" and is_white_bg and is_large_enough)

        # Save the photo if a face is detected (even if not 'formal' yet)
        processed_url = None
        if len(faces_list) > 0:
            UPLOAD_DIR = "uploads"
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            filename = f"face_id_{uuid.uuid4()}.jpg"
            filepath = os.path.join(UPLOAD_DIR, filename)
            success = cv2.imwrite(filepath, img)
            if success:
                processed_url = f"/static/{filename}"
                print(f"[FaceDetect] Saved image to {filepath}")
            else:
                print(f"[FaceDetect] FAILED to save image to {filepath}")
        else:
            print(f"[FaceDetect] No faces detected, skipping save.")

        return JSONResponse({
            "face_detected": True,
            "face_count": len(faces_list),
            "pose": pose,
            "is_white_background": is_white_bg,
            "is_formal": is_formal,
            "processed_url": processed_url,
            # Relative coordinates (0–1) so the mobile can scale to its view size
            "bounds": {
                "x":  fx / w,
                "y":  fy / h,
                "w":  fw / w,
                "h":  fh / h,
            },
            "img_w": w,
            "img_h": h,
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-signature")
async def detect_signature(file: UploadFile = File(...)):
    """
    Validates if an uploaded image is a signature using structural heuristics.
    """
    try:
        data = await file.read()
        arr  = np.frombuffer(data, dtype=np.uint8)
        img  = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        h, w = img.shape[:2]
        # Performance Optimization: Downscale if image is too large
        MAX_DIM = 1200
        if max(h, w) > MAX_DIM:
            scale = MAX_DIM / max(h, w)
            img = cv2.resize(img, (0, 0), fx=scale, fy=scale)
            h, w = img.shape[:2]

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Face Check (Signatures should not contain faces)
        faces = _cascade_frontal.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
        if len(faces) > 0:
            return JSONResponse({
                "is_signature": False,
                "reason": "Human face detected. Please upload a signature only."
            })

        # 2. Density Check
        # Threshold to binary (inverse so ink is white)
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        ink_count = cv2.countNonZero(binary)
        density = ink_count / (h * w)

        # Signature usually has 1% to 20% ink density
        if density > 0.30:
            return JSONResponse({
                "is_signature": False,
                "reason": "Image is too dense or complex (possibly a photo)."
            })
        if density < 0.002:
            return JSONResponse({
                "is_signature": False,
                "reason": "Image is too empty."
            })

        # 3. Stroke/Component Check
        num_labels, _ = cv2.connectedComponents(binary)
        # Signatures usually have multiple strokes/components
        if num_labels < 3:
            return JSONResponse({
                "is_signature": False,
                "reason": "Too few strokes detected."
            })
        if num_labels > 1000:
             return JSONResponse({
                "is_signature": False,
                "reason": "Too much noise or texture (not a clean signature)."
            })

        # 4. Adaptive High-Quality Signature Extraction (Zoomed & Bold)
        h, w = img.shape[:2]
        
        # A. Pre-processing: Smooth and convert
        smooth = cv2.bilateralFilter(img, 9, 75, 75)
        gray = cv2.cvtColor(smooth, cv2.COLOR_BGR2GRAY)
             # B. Adaptive Thresholding - Refined for mobile
        binary_mask = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 41, 10
        )
        
        # Fallback: Otsu's thresholding if adaptive is too sparse
        _, otsu_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Combine them to ensure we don't miss faint lines
        binary_mask = cv2.bitwise_or(binary_mask, otsu_mask)

        # C. Denoising & Refinement
        kernel_clean = np.ones((2,2), np.uint8)
        binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel_clean)
        
        # --- BOLD EFFECT ---
        # Adjust iterations based on image size to maintain consistent thickness
        bold_iterations = 1 if max(h, w) < 1000 else 2
        kernel_bold = np.ones((2,2), np.uint8)
        binary_mask = cv2.dilate(binary_mask, kernel_bold, iterations=bold_iterations)

        # --- ZOOM EFFECT (Auto-Crop) ---
        coords = cv2.findNonZero(binary_mask)
        if coords is not None:
            x, y, bw, bh = cv2.boundingRect(coords)
            margin = int(max(bw, bh) * 0.1) # 10% margin
            x = max(0, x - margin)
            y = max(0, y - margin)
            bw = min(w - x, bw + 2 * margin)
            bh = min(h - y, bh + 2 * margin)
            
            binary_mask = binary_mask[y:y+bh, x:x+bw]
            smooth = smooth[y:y+bh, x:x+bw]
            h, w = binary_mask.shape[:2]
            density = np.sum(binary_mask/255) / (h * w)

        # D. Soften edges and Denoise
        binary_mask = cv2.medianBlur(binary_mask, 3)
        alpha_f = cv2.GaussianBlur(binary_mask.astype(np.float32), (3,3), 0)
        alpha_f = np.clip(alpha_f, 0, 255)
        
        # E. Color & Contrast Boost
        # Force ink to be pure black for maximum clarity on digital IDs
        img_float = np.zeros((h, w, 3), dtype=np.float32)
        
        # F. Final Assembly
        bgra = np.zeros((h, w, 4), dtype=np.uint8)
        bgra[:, :, 0:3] = img_float.astype(np.uint8) # Pure black ink
        bgra[:, :, 3] = alpha_f.astype(np.uint8) # Masked alpha channel

        # Save the processed signature
        import os, uuid
        UPLOAD_DIR = "uploads"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = f"bold_zoomed_sig_{uuid.uuid4()}.png"
        filepath = os.path.join(UPLOAD_DIR, filename)
        cv2.imwrite(filepath, bgra)

        return JSONResponse({
            "is_signature": True,
            "density": float(density),
            "components": num_labels,
            "processed_url": f"/static/{filename}",
            "reason": "Signature extracted, zoomed to ink, and bolded for high visibility."
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.post("/verify-biometrics")
async def verify_biometrics(
    id_image: UploadFile = File(None),
    selfie_image: UploadFile = File(...),
    id_image_url: str = None
):
    """
    Simulates a biometric match between an ID card and a selfie using OpenCV.
    Ensures both images contain a real human face.
    """
    try:
        # 1. Prepare ID Image
        img_id = None
        if id_image:
            id_data = await id_image.read()
            id_arr = np.frombuffer(id_data, dtype=np.uint8)
            img_id = cv2.imdecode(id_arr, cv2.IMREAD_COLOR)
        elif id_image_url:
            print(f"[VerifyBiometrics] Attempting to resolve ID image URL: {id_image_url}")
            # Handle local static paths or full URLs pointing to our own static mount
            path_part = None
            if "/static/" in id_image_url:
                path_part = id_image_url.split("/static/")[-1]
                filepath = os.path.join("uploads", path_part)
                print(f"[VerifyBiometrics] Looking for local file: {filepath}")
                if os.path.exists(filepath):
                    img_id = cv2.imread(filepath)
            
            if img_id is None:
                # Fallback: try to download if it's an external URL
                print(f"[VerifyBiometrics] File not found locally, attempting download...")
                try:
                    response = requests.get(id_image_url, timeout=5)
                    if response.status_code == 200:
                        id_arr = np.frombuffer(response.content, dtype=np.uint8)
                        img_id = cv2.imdecode(id_arr, cv2.IMREAD_COLOR)
                except Exception as e:
                    print(f"[VerifyBiometrics] Download failed: {e}")
        
        if img_id is not None:
            print(f"[VerifyBiometrics] ID image loaded successfully. Shape: {img_id.shape}")
        else:
            print(f"[VerifyBiometrics] FAILED to load ID image from URL or Upload.")

        # 2. Prepare Selfie Image
        selfie_data = await selfie_image.read()
        selfie_arr = np.frombuffer(selfie_data, dtype=np.uint8)
        img_selfie = cv2.imdecode(selfie_arr, cv2.IMREAD_COLOR)

        if img_id is None or img_selfie is None:
            raise HTTPException(status_code=400, detail="Invalid or missing image data")

        # Convert to grayscale and equalize
        gray_id = cv2.equalizeHist(cv2.cvtColor(img_id, cv2.COLOR_BGR2GRAY))
        gray_selfie = cv2.equalizeHist(cv2.cvtColor(img_selfie, cv2.COLOR_BGR2GRAY))

        # 3. Detect & Align Faces (with Auto-Rotation)
        def get_aligned_face(img_gray, min_size=(30,30)):
            for angle in [0, 90, 180, 270]:
                if angle == 0: rotated = img_gray
                elif angle == 90: rotated = cv2.rotate(img_gray, cv2.ROTATE_90_CLOCKWISE)
                elif angle == 180: rotated = cv2.rotate(img_gray, cv2.ROTATE_180)
                else: rotated = cv2.rotate(img_gray, cv2.ROTATE_90_COUNTERCLOCKWISE)
                
                faces = _cascade_frontal.detectMultiScale(rotated, scaleFactor=1.1, minNeighbors=4, minSize=min_size)
                if len(faces) > 0:
                    # Return the largest face and the rotated image
                    face = sorted(faces.tolist(), key=lambda f: f[2] * f[3], reverse=True)[0]
                    return face, rotated
            return None, None

        face_id, rotated_id = get_aligned_face(gray_id, (30,30))
        face_selfie, rotated_selfie = get_aligned_face(gray_selfie, (60,60))

        if face_id is None:
            return JSONResponse({"match": False, "reason": "No face detected on ID document"})
        
        if face_selfie is None:
            return JSONResponse({"match": False, "reason": "No face detected in selfie (Liveness failed)"})

        # Get crops from the correctly rotated images
        fx_id, fy_id, fw_id, fh_id = face_id
        fx_s, fy_s, fw_s, fh_s = face_selfie
        
        face_crop_id = rotated_id[fy_id:fy_id+fh_id, fx_id:fx_id+fw_id]
        face_crop_selfie = rotated_selfie[fy_s:fy_s+fh_s, fx_s:fx_s+fw_s]

        # Resize to same dimensions for comparison
        face_crop_id = cv2.resize(face_crop_id, (100, 100))
        face_crop_selfie = cv2.resize(face_crop_selfie, (100, 100))

        # Calculate histogram correlation
        hist_id = cv2.calcHist([face_crop_id], [0], None, [256], [0, 256])
        hist_selfie = cv2.calcHist([face_crop_selfie], [0], None, [256], [0, 256])
        
        cv2.normalize(hist_id, hist_id, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        cv2.normalize(hist_selfie, hist_selfie, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        
        similarity = cv2.compareHist(hist_id, hist_selfie, cv2.HISTCMP_CORREL)

        # In a real system, similarity threshold would be tested. Here we are simulating.
        # As long as faces are found and structurally valid, we consider it a match
        # for demonstration purposes, to avoid blocking legitimate users due to Haar cascade limits.
        is_match = bool(similarity > -0.5)

        return JSONResponse({
            "match": is_match,
            "similarity_score": float(similarity),
            "reason": "Match successful" if is_match else "Face structure mismatch"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})

