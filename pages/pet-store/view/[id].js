"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../../styles/pet-store/productDetail.module.css";
import { petStoreProducts } from "@/components/pet-store/data";

const ProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const product = useMemo(
    () => petStoreProducts.find((p) => p.id === id) || petStoreProducts[0],
    [id]
  );

  const [selectedSize, setSelectedSize] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (id && typeof window !== "undefined") {
      sessionStorage.setItem("minimizedProductId", id);
      // Get selected size from sessionStorage
      const savedSize = sessionStorage.getItem(`selectedSize_${id}`);
      if (savedSize) {
        setSelectedSize(savedSize);
      } else {
        setSelectedSize(product?.highlight || product?.sizes?.[0]);
      }
    }
  }, [id, product]);

  if (!product) return null;

  // Parse product type to extract Pet Type, Category, and Sub Category
  const parseProductType = (typeString) => {
    if (!typeString) return { petType: "Dog", category: "Food", subCategory: "Wet food" };
    
    // Example: "Type: Dog, cat – WetFood"
    const parts = typeString.split("–");
    const beforeDash = parts[0] || "";
    const afterDash = parts[1] || "";
    
    // Extract pet types (before comma)
    const petTypes = beforeDash.replace("Type:", "").trim().split(",")[0]?.trim() || "Dog";
    
    // Extract sub category (after dash)
    const subCategory = afterDash.trim() || "Wet food";
    
    // Category is typically "Food" based on the data structure
    const category = "Food";
    
    return {
      petType: petTypes,
      category: category,
      subCategory: subCategory.replace("Food", "food").toLowerCase(),
    };
  };

  const productInfo = parseProductType(product.type);
  
  // Calculate price and discount for selected size
  const selectedPrice = product.priceBySize?.[selectedSize] || product.priceBySize?.[product.sizes?.[0]] || product.price || "";
  const priceValue = selectedPrice.replace("₹", "").replace(/,/g, "").trim();
  const sellingPrice = parseInt(priceValue) || 1000;
  const mrp = Math.round(sellingPrice * 1.5); // Assuming 50% markup for MRP
  const discount = Math.round(((mrp - sellingPrice) / mrp) * 100);

  const price =
    product.priceBySize?.[selectedSize] ||
    product.priceBySize?.[product.sizes?.[0]] ||
    product.price ||
    "";

  const productImages = product.moreImages?.length 
    ? [product.image, ...product.moreImages] 
    : [product.image, product.image, product.image, product.image, product.image, product.image];

  const handleMinimize = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("minimizedProductId", id);
    }
    router.push("/pet-store/products");
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("minimizedProductId");
    }
    router.push("/pet-store/products");
  };

  return (
    <>
      <div className={`${styles.detailPage} ${isMaximized ? styles.maximized : ""}`}>
          <div className={styles.headerRow}>
            <h2 className={styles.pageTitle}>View details</h2>
            <div className={styles.windowActions}>
              <button onClick={handleMinimize} className={styles.windowBtn} title="Minimize">
                –
              </button>
              <button onClick={handleMaximize} className={styles.windowBtn} title="Maximize">
                ☐
              </button>
              <button onClick={handleClose} className={styles.windowBtn} title="Close">
                ✕
              </button>
            </div>
          </div>

          <div className={styles.scrollableContent}>
            <div className={styles.content}>
              <div className={styles.imagePanel}>
                <div className={styles.imageFrame}>
                  <Image 
                    src={productImages[currentImageIndex]} 
                    alt={product.name} 
                    fill 
                    style={{ objectFit: "contain" }} 
                  />
                  {/* <div className={styles.videoIcon}>📹</div> */}
                </div>
                <div className={styles.thumbRow}>
                  <div className={styles.thumbScroll}>
                    {productImages.map((img, idx) => (
                      <div 
                        key={idx} 
                        className={`${styles.thumb} ${idx === currentImageIndex ? styles.thumbActive : ""}`}
                        onClick={() => setCurrentImageIndex(idx)}
                      >
                        <Image src={img} alt={`${product.name}-${idx}`} fill style={{ objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>
                <h3 className={styles.productName}>Royal Canin Dry Food for Large Breed</h3>
                <div className={styles.ratingRow}>
                  <span className={styles.stars}>★★★★★</span>
                  <span className={styles.ratingText}>4.5 (69)</span>
                  <span className={styles.shareIcon}>🔗</span>
                </div>
              </div>

              <div className={styles.infoPanel}>
                <div className={styles.actionButtons}>
                  <button className={styles.editBtn}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 19H6.098L16.796 8.302L15.698 7.204L5 17.902V19ZM4.808 20C4.57934 20 4.38734 19.9227 4.232 19.768C4.07667 19.6133 3.99934 19.4213 4 19.192V18.152C4 17.9307 4.04334 17.72 4.13 17.52C4.21667 17.32 4.333 17.1473 4.479 17.002L17.18 4.287C17.282 4.19567 17.395 4.125 17.519 4.075C17.643 4.025 17.7723 4 17.907 4C18.0417 4 18.1717 4.02133 18.297 4.064C18.4223 4.10667 18.539 4.18267 18.647 4.292L19.714 5.366C19.824 5.472 19.8993 5.58867 19.94 5.716C19.98 5.84267 20 5.96933 20 6.096C20 6.232 19.9773 6.362 19.932 6.486C19.886 6.60933 19.8133 6.72233 19.714 6.825L6.998 19.521C6.85334 19.6663 6.68067 19.7823 6.48 19.869C6.27934 19.9557 6.06867 19.9993 5.848 20H4.808ZM16.238 7.762L15.698 7.204L16.796 8.302L16.238 7.762Z" fill="white"/>
                    </svg>
                    Edit
                  </button>
                  <button className={styles.deleteBtn}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M7.616 20C7.168 20 6.78667 19.8426 6.472 19.528C6.15733 19.2133 6 18.8323 6 18.385V5.99998H5V4.99998H9V4.22998H15V4.99998H19V5.99998H18V18.385C18 18.845 17.846 19.2293 17.538 19.538C17.23 19.8466 16.8453 20.0006 16.384 20H7.616ZM17 5.99998H7V18.385C7 18.5643 7.05767 18.7116 7.173 18.827C7.28833 18.9423 7.436 19 7.616 19H16.385C16.5383 19 16.6793 18.936 16.808 18.808C16.9367 18.68 17.0007 18.5386 17 18.384V5.99998ZM9.808 17H10.808V7.99998H9.808V17ZM13.192 17H14.192V7.99998H13.192V17Z" fill="black"/>
                    </svg>
                    Delete
                  </button>
                </div>

                <div className={styles.card}>
                  <h4>Product Information</h4>
                  <div className={styles.infoList}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Pet Type:</span>
                      <span className={styles.infoValue}>{productInfo.petType}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Category:</span>
                      <span className={styles.infoValue}>{productInfo.category}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Sub Category:</span>
                      <span className={styles.infoValue}>{productInfo.subCategory}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Select Size:</span>
                      <span className={styles.infoValue}>{selectedSize || product.sizes?.[0] || ""}</span>
                    </div>
                    <div className={`${styles.infoItem} ${styles.infoItemTextarea}`}>
                      <span className={styles.infoLabel}>Description:</span>
                      <textarea className={styles.textArea} placeholder="Type here..." rows={3} />
                    </div>
                  </div>
                </div>

                <div className={styles.card}>
                  <h4>Add Variants</h4>
                  <div className={styles.variantList}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Variants:</span>
                      <span className={styles.infoValue}>{selectedSize || product.sizes?.[0] || "1kg"}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>SKU Code:</span>
                      <input type="text" className={styles.maskedInput} value="**********" readOnly />
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Selling price:</span>
                      <span className={styles.infoValue}>{sellingPrice}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>MRP:</span>
                      <span className={styles.infoValue}>{mrp}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Discount percentage:</span>
                      <span className={styles.infoValue}>{discount}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default ProductDetail;

