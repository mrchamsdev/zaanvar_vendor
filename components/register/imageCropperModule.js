import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";

const cropWidth = 350;
const cropHeight = 230;

/* ✅ Create final image with blurred background and cropped foreground */
function getCroppedImgWithBlur(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext("2d");

      /* -----------------------------
         1️⃣ Draw BLURRED background (full image scaled to cover)
      ------------------------------ */
      // Calculate scale to cover the entire canvas (like background-size: cover)
      const scale = Math.max(cropWidth / image.width, cropHeight / image.height);
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      const x = (cropWidth - scaledWidth) / 2;
      const y = (cropHeight - scaledHeight) / 2;

      // Apply blur filter and draw the full image as background
      ctx.filter = "blur(25px)";
      ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

      /* -----------------------------
         2️⃣ Draw CROPPED image on top (clear, no blur)
      ------------------------------ */
      ctx.filter = "none";
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        cropWidth,
        cropHeight
      );

      /* -----------------------------
         3️⃣ Export final image (single blob with background + foreground)
      ------------------------------ */
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.9
      );
    };

    image.onerror = reject;
  });
}

const ImageCropperModule = ({ open, image, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.1); // Allow zooming out more
  const [calculatedMinZoom, setCalculatedMinZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const cropperContainerRef = useRef(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const hasInitializedZoom = useRef(false);
  const [smoothCrop, setSmoothCrop] = useState({ x: 0, y: 0 });
  const [smoothZoom, setSmoothZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (newCrop) => setCrop(newCrop);
  const onZoomChange = (newZoom) => setZoom(newZoom);

  // Handle mouse down - start dragging
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Only left mouse button
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  
  // Handle mouse movement - only when dragging
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !cropperContainerRef.current) return;

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate movement delta from last position
    const deltaX = mouseX - lastMousePos.current.x;
    const deltaY = mouseY - lastMousePos.current.y;
    
    // Update crop position - image moves in same direction as mouse
    setCrop((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
    
    lastMousePos.current = { x: mouseX, y: mouseY };
    e.preventDefault();
  }, []);

  // Handle mouse up - stop dragging
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Add global mouse event listeners for smooth dragging outside container
  useEffect(() => {
    if (!open) return;

    const handleGlobalMouseMove = (e) => {
      if (isDragging.current) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const deltaX = mouseX - lastMousePos.current.x;
        const deltaY = mouseY - lastMousePos.current.y;
        
        setCrop((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        
        lastMousePos.current = { x: mouseX, y: mouseY };
      }
    };

    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [open]);

  const onCropCompleteInternal = useCallback(
    (_, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  /* ✅ IMPORTANT LOGIC: allow image adjust freely */
  const onMediaLoaded = useCallback((mediaSize) => {
    const zoomX = cropWidth / mediaSize.width;
    const zoomY = cropHeight / mediaSize.height;
    const minZoomValue = Math.max(zoomX, zoomY);

    setCalculatedMinZoom(minZoomValue);
    
    // Only set initial zoom once when modal first opens
    if (!hasInitializedZoom.current) {
      setZoom(minZoomValue); // image perfectly fits crop box initially
      hasInitializedZoom.current = true;
    }
  }, []);

  // Reset zoom initialization when modal closes
  useEffect(() => {
    if (!open) {
      hasInitializedZoom.current = false;
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setSmoothCrop({ x: 0, y: 0 });
      setSmoothZoom(1);
      setIsProcessing(false);
    }
  }, [open]);

  // Throttle smooth state updates to prevent flickering (updates at ~60fps)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSmoothCrop(crop);
    }, 16);
    return () => clearTimeout(timer);
  }, [crop]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSmoothZoom(zoom);
    }, 16);
    return () => clearTimeout(timer);
  }, [zoom]);
  const handleOverlayClick = (e) => {
  // Do nothing - prevent closing
  e.stopPropagation();
};

  const handleDone = async () => {
    // Prevent double-clicks
    if (isProcessing) return;
    
    if (!croppedAreaPixels) {
      console.warn("No cropped area available");
      return;
    }

    setIsProcessing(true);
    
    try {
      const imageSrc =
        typeof image === "string" ? image : URL.createObjectURL(image);

      // Generate single image with blurred background and cropped foreground
      const croppedBlob = await getCroppedImgWithBlur(
        imageSrc,
        croppedAreaPixels
      );

      onCropComplete(croppedBlob);
      onClose();
    } catch (error) {
      console.error("Error processing crop:", error);
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  const imageSrc =
    typeof image === "string" ? image : URL.createObjectURL(image);

  const modalContent = (
    <>
      <style>
        {`
          .reactEasyCrop_Container {
            border-radius: 5px 5px 0px 0px !important;
            background: transparent !important;
          }
          .reactEasyCrop_Image {
            padding: 5px !important;
          }
          .reactEasyCrop_CropArea {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3) !important;
          }
        `}
      </style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          // zIndex: 99999999,
          zIndex: 2147483647,
        }}
        onClick={handleOverlayClick} 
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            width: cropWidth,
            maxWidth: "90vw",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={cropperContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              position: "relative",
              width: cropWidth,
              height: cropHeight,
              background: "#333",
              borderRadius: "5px 5px 0px 0px",
              cursor: "grab",
              userSelect: "none",
              overflow: "hidden",
            }}
          >
            {/* Blurred background image layer - shows blurred image on sides */}
            <img
              src={imageSrc}
              alt="Image to crop"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${50 + (smoothCrop.x / cropWidth) * 25}% ${50 + (smoothCrop.y / cropHeight) * 25}%`,
                transform: `scale(${smoothZoom * 1.15})`,
                filter: "blur(25px)",
                WebkitFilter: "blur(25px)",
                zIndex: 0,
                pointerEvents: "none",
              }}
            />
            
            {/* Clear cropper on top */}
            <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={0.1}             // Allow zooming out below calculated minimum
                maxZoom={5}               // ✅ added
                aspect={cropWidth / cropHeight}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteInternal}
                onMediaLoaded={onMediaLoaded} // ✅ added
                cropShape="rect"
                showGrid={false}
                restrictPosition={false}
              />
            </div>
          </div>

          {/* Zoom Control - Mouse drag for position */}
          <div
            style={{
              padding: "15px",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#333",
                  marginBottom: "8px",
                }}
              >
                Zoom: {Math.round(zoom * 100)}%
              </label>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  background: "#e0e0e0",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "#666",
                margin: 0,
                textAlign: "center",
              }}
            >
              Click and drag to adjust image position
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              padding: "10px",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: "#FEF2E7",
                color: "#F5790C",
                fontSize: "12px",
                fontWeight: "500",
                borderRadius: "5px",
                padding: "3px 20px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleDone}
              disabled={isProcessing || !croppedAreaPixels}
              style={{
                background: isProcessing || !croppedAreaPixels ? "#ccc" : "#F5790C",
                color: "#fff",
                border: "none",
                padding: "3px 20px",
                borderRadius: 4,
                cursor: isProcessing || !croppedAreaPixels ? "not-allowed" : "pointer",
                opacity: isProcessing || !croppedAreaPixels ? 0.6 : 1,
              }}
            >
              {isProcessing ? "Processing..." : "Crop"}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (typeof window !== "undefined" && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default ImageCropperModule;
