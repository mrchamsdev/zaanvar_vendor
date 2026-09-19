import React, { useState, useEffect } from "react";
import styles from "../styles/mediaViewerModal.module.css";
import { WebApimanager } from "./utilities/WebApiManager";
import useStore from "./state/useStore";
import { IMAGE_URL } from "./utilities/Constants";
import { toast } from "sonner";

export default function MediaViewerModal({
  open,
  onClose,
  images = [],
  rawImages = [],
  initialIndex = 0,
  branchId,
  onSuccess,
  onOpenUpload
}) {
  const { jwtToken } = useStore();

  const [imageList, setImageList] = useState([]);
  const [rawList, setRawList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to format photo URL
  const formatPhotoUrl = (img) => {
    if (!img) return "";
    const str = typeof img === "string" ? img : img.url || img.photoUrl || img.image || "";
    if (!str) return "";
    if (str.startsWith("http") || str.startsWith("data:") || str.startsWith("blob:")) return str;
    const baseUrl = IMAGE_URL?.endsWith("/") ? IMAGE_URL : `${IMAGE_URL}/`;
    const cleanPath = str.startsWith("/") ? str.slice(1) : str;
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    if (open) {
      const formatted = (Array.isArray(images) ? images : []).filter(Boolean).map(formatPhotoUrl);
      const raws = (Array.isArray(rawImages) && rawImages.length > 0 ? rawImages : images).filter(Boolean);
      setImageList(formatted);
      setRawList(raws);
      setSelectedIndex(initialIndex >= 0 && initialIndex < formatted.length ? initialIndex : 0);
    }
  }, [open, images, rawImages, initialIndex]);

  if (!open) return null;

  const currentFormattedUrl = imageList[selectedIndex] || "";
  const currentRawUrl = rawList[selectedIndex] || currentFormattedUrl;

  // Handle Photo Deletion via DELETE /api/companies/vendor/media
  const handleDeletePhoto = async () => {
    if (!currentRawUrl && !currentFormattedUrl) {
      toast.error("No photo selected to delete.");
      return;
    }
    if (!branchId) {
      toast.error("Branch ID is missing.");
      return;
    }

    setIsDeleting(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
      const webApi = new WebApimanager(token);

      // Construct deletion payload as requested:
      // { "branchId": 280, "type": "image", "imageUrl": "..." }
      const payload = {
        branchId: Number(branchId),
        type: "image",
        imageUrl: currentRawUrl
      };

      const res = await webApi.delete("companies/vendor/media", payload);

      if (res && res.status >= 200 && res.status < 300) {
        toast.success("Photo deleted successfully!");

        // Remove deleted photo from local lists
        const newFormatted = imageList.filter((_, idx) => idx !== selectedIndex);
        const newRaws = rawList.filter((_, idx) => idx !== selectedIndex);

        setImageList(newFormatted);
        setRawList(newRaws);

        if (newFormatted.length === 0) {
          if (onSuccess) await onSuccess();
          onClose();
        } else {
          setSelectedIndex((prev) => (prev >= newFormatted.length ? newFormatted.length - 1 : prev));
          if (onSuccess) await onSuccess();
        }
      } else {
        toast.error("Failed to delete photo. Please try again.");
      }
    } catch (err) {
      console.error("DELETE companies/vendor/media error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "An error occurred while deleting the photo.";
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Branch Gallery</h2>
            <span className={styles.counterBadge}>
              {imageList.length > 0 ? `${selectedIndex + 1} of ${imageList.length}` : "0 Photos"}
            </span>
          </div>
          <div className={styles.headerActions}>

            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close viewer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Split: Left Sidebar & Right Main Stage */}
        <div className={styles.contentSplit}>
          {/* Left Sidebar (Thumbnails) */}
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>All Photos ({imageList.length})</h3>
            {imageList.map((url, idx) => (
              <div
                key={idx}
                className={`${styles.thumbCard} ${idx === selectedIndex ? styles.thumbActive : ""}`}
                onClick={() => setSelectedIndex(idx)}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className={styles.thumbImg}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://zaanvarprods3.b-cdn.net/media/1773901815100-petsales.png";
                  }}
                />
                <span className={styles.thumbIndex}>{idx + 1}</span>
              </div>
            ))}
          </div>

          {/* Right Main Stage View */}
          <div className={styles.mainStage}>
            <div className={styles.stageImageWrap}>
              {currentFormattedUrl ? (
                <img
                  src={currentFormattedUrl}
                  alt={`Selected photo ${selectedIndex + 1}`}
                  className={styles.stageImg}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://zaanvarprods3.b-cdn.net/media/1773901815100-petsales.png";
                  }}
                />
              ) : (
                <div style={{ color: "#94a3b8", fontSize: "14px" }}>No photo selected</div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {imageList.length > 0 && (
              <div className={styles.stageActionBar}>
                <button
                  type="button"
                  className={styles.navPrevNextBtn}
                  disabled={selectedIndex === 0}
                  onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                  title="Previous photo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={handleDeletePhoto}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>Deleting...</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Delete Photo
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={styles.navPrevNextBtn}
                  disabled={selectedIndex === imageList.length - 1}
                  onClick={() => setSelectedIndex((prev) => Math.min(imageList.length - 1, prev + 1))}
                  title="Next photo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
