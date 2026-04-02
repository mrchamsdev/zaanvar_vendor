import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "../../styles/utilities/Sharepopup.module.css"; 


// User provided these specific imports
import { FacebookIcon, Instagram, Link, LinkdinIcon, Mail, Message, Twitter, Whatsup } from '../../public/images/SVG';

const SharePopup = ({ pet, onClose }) => {
  const [isClient, setIsClient] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getShareUrl = () => {
    if (typeof window === 'undefined' || !pet) return "";
    
    const isPuppy = pet.postId || window.location.pathname.includes('my-puppies');
    const typePath = isPuppy ? 'my-puppies' : 'my-pets';
    const id = pet.slug || pet.postId || pet.id || pet._id;
    
    return `${window.location.origin}/${typePath}/${id}`;
  };

  const placeholderText = getShareUrl();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Scroll Stop - prevent background scrolling when popup is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const copyToClipboard = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(placeholderText)
        .then(() => toast.success("Copied to clipboard!"))
        .catch(() => toast.error("Failed to copy"));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = placeholderText;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const success = document.execCommand("copy");
        if (success) toast.success("Copied to clipboard!");
        else toast.error("Copy failed");
      } catch (err) {
        toast.error("Copy not supported on this browser");
      }

      document.body.removeChild(textArea);
    }
  };

  // Function to detect mobile device
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  // Function to handle Instagram click
  const handleInstagramClick = () => {
    const isMobile = isMobileDevice();
    const webUrl = 'https://www.instagram.com/zaanvar_tailtalks/';
    
    if (isMobile) {
      // Try to open Instagram app first using deep link
      const instagramUsername = 'zaanvar_tailtalks';
      const appUrl = `instagram://user?username=${instagramUsername}`;
      
      let appOpened = false;
      const handleBlur = () => {
        appOpened = true;
        window.removeEventListener('blur', handleBlur);
      };
      window.addEventListener('blur', handleBlur);
      window.location.href = appUrl;
      
      setTimeout(() => {
        window.removeEventListener('blur', handleBlur);
        if (!appOpened) {
          window.location.href = webUrl;
        }
      }, 1500);
    } else {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Function to open social media share links
  const openSocialMedia = (platform) => {
    const isMobile = isMobileDevice();
    let shareUrl = encodeURIComponent(placeholderText);
    let url = "";

    switch (platform) {
      case "facebook":
        url =`https://www.facebook.com/dialog/send?link=${shareUrl}&app_id=536334085954411`;	
        if (isMobile) {
          window.location.href = url;
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        return;
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${shareUrl}`;
        if (isMobile) {
          window.location.href = url;
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        return;
      case "linkedin":
        const linkedinWebUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        if (isMobile) {
           window.location.href = linkedinWebUrl;
        } else {
          window.open(linkedinWebUrl, "_blank", "noopener,noreferrer");
        }
        return;
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${shareUrl}`;
        if (isMobile) {
          window.location.href = url;
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        return;
      case "instagram":
        handleInstagramClick();
        return;
      case "email":
        url = `mailto:?subject=Check this out!&body=${shareUrl}`;
        window.location.href = url;
        return;
      case "message":
        url = `sms:?body=${shareUrl}`;
        window.location.href = url;
        return;
      default:
        return;
    }
  };

  if (!isClient) return null;

  const popupContent = (
    <div className={styles["sharepost-classname-overlay"]}>
      <div className={styles["sharepost-classname-modal"]} ref={modalRef}>
        <div className={styles["sharePost-header-names"]}>
          <p>Share</p>
          <button className={styles["sharepost-classname-close"]} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={styles["sharepost-classname-content"]}>
          <div className={styles["sharePost-container"]}>
            <input
              type="text"
              value={placeholderText}
              className={styles["sharePost-input"]}
              readOnly
            />
            <button onClick={copyToClipboard} className={styles["copy-button"]}>
              Copy
            </button>
          </div>

          {/* Social Media Icons with Click Actions */}
          <div className={styles["sharepost-container"]}>
            <button onClick={() => openSocialMedia("linkedin")}>
              <LinkdinIcon className={styles["icon"]}/>
            </button>
            <button onClick={() => openSocialMedia("twitter")}>
              <Twitter className={styles["icon"]}/>
            </button>
            <button onClick={() => openSocialMedia("whatsapp")}>
              <Whatsup className={styles["icon"]} />
            </button>
            <button onClick={() => openSocialMedia("instagram")}>
              <Instagram />
            </button>
            <button onClick={() => openSocialMedia("facebook")}>
              <FacebookIcon className={styles["icon"]} />
            </button>
            <button onClick={copyToClipboard}>
              <Link />
            </button>
            <button onClick={() => openSocialMedia("message")}>
              <Message />
            </button>
            <button onClick={() => openSocialMedia("email")}>
              <Mail />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render via portal
  return createPortal(popupContent, document.body);
};

export default SharePopup;
