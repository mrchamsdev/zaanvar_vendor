import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/editPhotosModal.module.css";
import { WebApimanager } from "./utilities/WebApiManager";
import useStore from "./state/useStore";
import { IMAGE_URL } from "./utilities/Constants";
import { toast } from "sonner";

export default function EditPhotosModal({
  open,
  onClose,
  branchId,
  companyId,
  branchName = "",
  initialPhotos = [],
  onSuccess
}) {
  const { jwtToken } = useStore();
  const fileInputRef = useRef(null);

  // States
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Helper to format photo URL properly
  const formatPhotoUrl = (img) => {
    if (!img) return "";
    const str = typeof img === "string" ? img : img.url || img.photoUrl || img.image || "";
    if (!str) return "";
    if (str.startsWith("http") || str.startsWith("data:") || str.startsWith("blob:")) return str;
    const baseUrl = IMAGE_URL?.endsWith("/") ? IMAGE_URL : `${IMAGE_URL}/`;
    const cleanPath = str.startsWith("/") ? str.slice(1) : str;
    return `${baseUrl}${cleanPath}`;
  };

  // Sync existing photos when modal opens or initialPhotos changes
  useEffect(() => {
    if (open) {
      const arr = Array.isArray(initialPhotos) ? initialPhotos.filter(Boolean) : [];
      setExistingPhotos(arr);
      // Clean up previous blob previews
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setLightboxImage(null);
    }
  }, [open, initialPhotos]);

  if (!open) return null;

  // Handle clicking on "Add Photos" / Dropzone to trigger file picker
  const handleTriggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle selecting new files from computer or mobile gallery
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Filter valid images
    const validImages = files.filter(f => f.type.startsWith("image/"));
    if (validImages.length !== files.length) {
      toast.warning("Some non-image files were skipped.");
    }
    if (!validImages.length) return;

    // Generate local preview URLs
    const newPreviews = validImages.map(file => URL.createObjectURL(file));

    setSelectedFiles(prev => [...prev, ...validImages]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);

    // Reset input so re-selecting same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove a newly selected file before upload
  const handleRemoveSelectedFile = (index) => {
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Remove an existing photo
  const handleRemoveExistingPhoto = (index) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    toast.info("Photo removed. Upload new photos or close when finished.");
  };

  // REJECT file selection: discard all newly selected files
  const handleReject = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    toast.info("Selected photos rejected and cleared.");
  };

  // ACCEPT file selection: submit files to PUT /api/companies/vendor/images
  const handleAccept = async () => {
    if (!selectedFiles.length) {
      toast.error("Please select at least one photo to upload.");
      return;
    }
    if (!branchId) {
      toast.error("Branch ID missing. Cannot upload photos.");
      return;
    }

    setIsUploading(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
      const webApi = new WebApimanager(token);

      const formData = new FormData();
      formData.append("branchId", String(branchId));
      if (companyId) {
        formData.append("companyId", String(companyId));
      }

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const res = await webApi.imagePut("companies/vendor/images", formData);

      if (res && res.status >= 200 && res.status < 300) {
        toast.success("Photos uploaded successfully!");

        // Clean up preview URLs
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setPreviewUrls([]);

        if (onSuccess) {
          await onSuccess();
        }
        onClose();
      } else {
        toast.error("Failed to upload photos. Please try again.");
      }
    } catch (err) {
      console.error("PUT /api/companies/vendor/images error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "An error occurred while uploading photos.";
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <h2 className={styles.modalTitle}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5790c" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Manage Business Photos
            </h2>
            <p className={styles.modalSubtitle}>
              {branchName ? `Branch: ${branchName}` : "Upload photos from your computer or mobile gallery"}
            </p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Upload Dropzone / Trigger */}
          <div className={styles.uploadDropzone} onClick={handleTriggerFilePicker}>
            <div className={styles.uploadIconWrap}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className={styles.uploadDropzoneText}>
              Click to select photos from Computer or Mobile Gallery
            </p>
            <p className={styles.uploadDropzoneSub}>
              Supports PNG, JPG, JPEG, WEBP. Multiple photos allowed.
            </p>
            <button type="button" className={styles.browseBtn} onClick={(e) => { e.stopPropagation(); handleTriggerFilePicker(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Photos
            </button>
          </div>

          {/* Newly Selected Files Preview Section (with Accept / Reject) */}
          {selectedFiles.length > 0 && (
            <div className={styles.newFilesSection}>
              <div className={styles.newFilesHeader}>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Selected Photos
                  <span className={styles.countBadgeNew}>{selectedFiles.length} file(s) ready</span>
                </h3>
              </div>

              {/* Grid of new file previews */}
              <div className={styles.photoGrid}>
                {previewUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className={styles.photoCard}
                    onClick={() => setLightboxImage({ url, index: idx, isNew: true })}
                    style={{ cursor: "pointer" }}
                    title="Click to view full preview"
                  >
                    <img src={url} alt={`Preview ${idx + 1}`} className={styles.photoImg} />
                    <span className={styles.fileDetailBadge}>
                      {formatFileSize(selectedFiles[idx]?.size)}
                    </span>
                    <button
                      type="button"
                      className={styles.deleteBadge}
                      title="Remove file"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSelectedFile(idx);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Accept or Reject Action Bar */}
              {/* <div className={styles.actionBar}>
                <button
                  type="button"
                  className={styles.rejectBtn}
                  onClick={handleReject}
                  disabled={isUploading}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Reject Selection
                </button>
                <button
                  type="button"
                  className={styles.acceptBtn}
                  onClick={handleAccept}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Accept & Upload ({selectedFiles.length})
                    </>
                  )}
                </button>
              </div> */}
            </div>
          )}


        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <p className={styles.footerNote}>
            {selectedFiles.length > 0
              ? `${selectedFiles.length} new photo(s) selected.`
              : "Select photos to upload."}
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className={styles.rejectBtn}
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleAccept}
              disabled={isUploading}
            >
              {isUploading ? (
                <>Submitting...</>
              ) : (
                <>

                  Submit
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enlarged Image Lightbox Overlay */}
      {lightboxImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(6px)",
            zIndex: 100000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt="Full Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "72vh",
                borderRadius: "14px",
                objectFit: "contain",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
            />
            {/* Action Bar inside Lightbox */}
            <div
              style={{
                display: "flex",
                gap: "14px",
                marginTop: "18px",
                alignItems: "center"
              }}
            >
              <button
                type="button"
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: "20px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
                }}
                onClick={() => {
                  if (lightboxImage.isNew) {
                    handleRemoveSelectedFile(lightboxImage.index);
                  } else {
                    handleRemoveExistingPhoto(lightboxImage.index);
                  }
                  setLightboxImage(null);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete Photo
              </button>

              <button
                type="button"
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  border: "1.5px solid rgba(255, 255, 255, 0.4)",
                  padding: "10px 22px",
                  borderRadius: "20px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                onClick={() => setLightboxImage(null)}
              >
                ✕ Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
