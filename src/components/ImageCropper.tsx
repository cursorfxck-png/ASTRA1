"use client";

import { useCallback, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob, aspectRatio: string) => void;
  onCancel: () => void;
}

const ASPECT_RATIOS = [
  { label: "Free", value: undefined },
  { label: "Square (1:1)", value: 1 / 1 },
  { label: "Portrait (4:5)", value: 4 / 5 },
  { label: "Landscape (16:9)", value: 16 / 9 },
  { label: "Widescreen (21:9)", value: 21 / 9 },
  { label: "Mobile (9:16)", value: 9 / 16 },
  { label: "Classic (4:3)", value: 4 / 3 },
  { label: "Photo (3:2)", value: 3 / 2 }
];

export function ImageCropper({ imageFile, onCropComplete, onCancel }: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(16 / 9);
  const imgRef = useRef<HTMLImageElement>(null);
  const [busy, setBusy] = useState(false);

  // Load image when component mounts
  useState(() => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result?.toString() || "");
    });
    reader.readAsDataURL(imageFile);
  });

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Set initial crop to center 80% of image
    const aspect = selectedAspect || width / height;
    const cropWidth = Math.min(width * 0.8, width);
    const cropHeight = selectedAspect ? cropWidth / selectedAspect : height * 0.8;
    
    const x = (width - cropWidth) / 2;
    const y = (height - cropHeight) / 2;

    setCrop({
      unit: "px",
      x,
      y,
      width: cropWidth,
      height: cropHeight
    });
  }, [selectedAspect]);

  const getCroppedImg = async (): Promise<Blob> => {
    const image = imgRef.current;
    const pixelCrop = completedCrop;

    if (!image || !pixelCrop) {
      throw new Error("No crop area selected");
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = pixelCrop.width * scaleX;
    canvas.height = pixelCrop.height * scaleY;

    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.95
      );
    });
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    setBusy(true);
    try {
      const croppedBlob = await getCroppedImg();
      const aspectLabel = ASPECT_RATIOS.find((a) => a.value === selectedAspect)?.label || "Free";
      onCropComplete(croppedBlob, aspectLabel);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Failed to crop image. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleAspectChange = (aspect: number | undefined) => {
    setSelectedAspect(aspect);
    
    // Reset crop when aspect changes
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newAspect = aspect || width / height;
      const cropWidth = Math.min(width * 0.8, width);
      const cropHeight = aspect ? cropWidth / aspect : height * 0.8;
      
      const x = (width - cropWidth) / 2;
      const y = (height - cropHeight) / 2;

      setCrop({
        unit: "px",
        x,
        y,
        width: cropWidth,
        height: cropHeight
      });
    }
  };

  return (
    <div className="image-cropper-modal">
      <div className="image-cropper-overlay" onClick={onCancel} />
      <div className="image-cropper-content">
        <div className="image-cropper-header">
          <h3>Crop & Adjust Image</h3>
          <button
            type="button"
            className="image-cropper-close"
            onClick={onCancel}
            disabled={busy}
          >
            ✕
          </button>
        </div>

        <div className="aspect-ratio-selector">
          <label>Aspect Ratio:</label>
          <div className="aspect-ratio-buttons">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                type="button"
                className={`aspect-btn ${selectedAspect === ratio.value ? "active" : ""}`}
                onClick={() => handleAspectChange(ratio.value)}
                disabled={busy}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        <div className="image-cropper-canvas">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={selectedAspect}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{ maxWidth: "100%", maxHeight: "60vh" }}
              />
            </ReactCrop>
          )}
        </div>

        <div className="image-cropper-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleCropComplete}
            disabled={busy || !completedCrop}
          >
            {busy ? "Processing..." : "Apply Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
