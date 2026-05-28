import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

// Load models from CDN to avoid huge local bundle
const loadModels = async () => {
    if (modelsLoaded) return;
    try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
            // Using standard landmark model because tiny landmark model is sometimes less accurate with heavy tilt
        ]);
        modelsLoaded = true;
    } catch (e) {
        console.error("Failed to load face-api models", e);
    }
};

export const analyzePhoto = async (imageSrc) => {
    const warnings = [];

    return new Promise(async (resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = async () => {
            try {
                // 1. Basic Canvas Lighting Check
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                let totalLuminance = 0;
                
                // Sample every 4th pixel for speed
                for (let i = 0; i < data.length; i += 16) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    // Perceived luminance formula
                    const luminance = 0.299*r + 0.587*g + 0.114*b;
                    totalLuminance += luminance;
                }
                
                const avgLuminance = totalLuminance / (data.length / 16);
                const warnings = [];
                const errors = [];

                if (avgLuminance < 60) {
                    warnings.push("Lighting is a bit low. This might be rejected by the admin.");
                } else if (avgLuminance > 220) {
                    warnings.push("The photo appears overexposed or too bright.");
                }

                // 2. AI Face Tracking (Tilt & Confidence)
                await loadModels();
                if (!modelsLoaded) {
                    return resolve({ warnings, errors }); // Return early if AI fails
                }

                const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 })).withFaceLandmarks();
                
                if (detections.length === 0) {
                    errors.push("No face detected. Please ensure your face is clearly visible.");
                } else if (detections.length > 1) {
                    errors.push("Multiple faces detected. Please upload a solo formal photo.");
                } else {
                    const landmarks = detections[0].landmarks;
                    const leftEye = landmarks.getLeftEye();
                    const rightEye = landmarks.getRightEye();

                    // Calculate average eye centers
                    const leftEyeCenter = leftEye.reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), { x: 0, y: 0 });
                    leftEyeCenter.x /= leftEye.length;
                    leftEyeCenter.y /= leftEye.length;

                    const rightEyeCenter = rightEye.reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), { x: 0, y: 0 });
                    rightEyeCenter.x /= rightEye.length;
                    rightEyeCenter.y /= rightEye.length;

                    // Calculate angle (roll) of the head based on eyes
                    const dy = rightEyeCenter.y - leftEyeCenter.y;
                    const dx = rightEyeCenter.x - leftEyeCenter.x;
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                    if (Math.abs(angle) > 15) {
                        errors.push("Head is heavily tilted. Please look straight at the camera.");
                    } else if (Math.abs(angle) > 10) {
                        warnings.push("Head seems slightly tilted. A straight pose is preferred for formal photos.");
                    }
                }
                
                resolve({ warnings, errors });
            } catch (err) {
                console.error("Photo analysis failed", err);
                resolve({ warnings: [], errors: ["Internal analysis failure. Please try another image."] });
            }
        };

        img.onerror = () => {
            resolve({ warnings: [], errors: ["Failed to load image for analysis."] });
        };
    });
};
