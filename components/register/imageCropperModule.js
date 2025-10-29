import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Modal from "@mui/material/Modal";

const cropWidth = 326;
const cropHeight = 210;

function getCroppedImg(imageSrc, crop, zoom, aspect) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext("2d");

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelCrop = {
        x: crop.x * scaleX,
        y: crop.y * scaleY,
        width: crop.width * scaleX,
        height: crop.height * scaleY,
      };

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        cropWidth,
        cropHeight
      );
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    };
    image.onerror = reject;
  });
}

const ImageCropperModal = ({ open, image, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (newCrop) => setCrop(newCrop);
  const onZoomChange = (newZoom) => setZoom(newZoom);

  const onCropCompleteInternal = useCallback(
    (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleDone = async () => {
    const imageSrc =
      typeof image === "string" ? image : URL.createObjectURL(image);
    const croppedBlob = await getCroppedImg(
      imageSrc,
      croppedAreaPixels,
      zoom,
      cropWidth / cropHeight
    );
    onCropComplete(croppedBlob);
    onClose();
  };

  if (!open) return null;

  const imageSrc =
    typeof image === "string" ? image : URL.createObjectURL(image);

  return (
    <>
      <style>
        {`
        .reactEasyCrop_Container {
            border-radius: 5px 5px 0px 0px !important;
          }
            .reactEasyCrop_Image{
            padding: 5px !important;
            }
        `}
      </style>
      <Modal open={open} onClose={onClose}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#fff",
            borderRadius: 8,
            outline: "none",
            width: 326,
            maxWidth: "90vw",
          }}
        >
          <div
            style={{
              position: "relative",
              width: cropWidth,
              height: cropHeight,
              background: "#333",
              borderRadius: "5px 5px 0px 0px",
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={cropWidth / cropHeight}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteInternal}
              cropShape="rect"
              showGrid={false}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              padding: "10px",
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: "rgba(31, 191, 194, 0.10)",
                color: "#1FBFC2",
                
                fontSize: "12px",
                fontStyle: "normal",
                fontWeight: "500",
                borderRadius: "5px",
                padding: "3px 20px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              style={{
                background: "#1FBFC2",
                color: "#fff",
                border: "none",
                padding: "3px 20px",
                borderRadius: 4,
              }}
            >
              Crop
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ImageCropperModal;
