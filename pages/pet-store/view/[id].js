"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../../styles/pet-store/productDetail.module.css";
import addProductStyles from "../../../styles/pet-store/addProduct.module.css";
import AddProduct from "@/components/pet-store/AddProduct";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import { IMAGE_URL } from "@/components/utilities/Constants";

const ProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductMinimized, setAddProductMinimized] = useState(false);
  const [editProductData, setEditProductData] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  // Fetch product data from API
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await webApi.get(`vendor/petstore/products/${id}`);
        if (response?.data?.data) {
          const productData = response.data.data;
          setProduct(productData);
          
          // Store product name for minimized tab
          if (typeof window !== "undefined") {
            sessionStorage.setItem("minimizedProductId", String(id));
            if (productData.productName) {
              sessionStorage.setItem("minimizedProductName", productData.productName);
            }
            
            // Get selected size from sessionStorage
            const savedSize = sessionStorage.getItem(`selectedSize_${id}`);
            if (savedSize) {
              setSelectedSize(savedSize);
            } else if (productData.variants && productData.variants.length > 0) {
              // Set first variant as default
              setSelectedSize(productData.variants[0].variantType);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, jwt]);

  // Check for minimized Add Product
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMinimized = () => {
        const isMinimized = sessionStorage.getItem("addProductMinimized") === "true";
        setAddProductMinimized(isMinimized);
        if (isMinimized) {
          setShowAddProduct(false);
        }
      };

      checkMinimized();
      const interval = setInterval(checkMinimized, 300);
      return () => clearInterval(interval);
    }
  }, []);

  // Get selected variant based on selectedSize
  const selectedVariant = product?.variants?.find(
    (v) => v.variantType === selectedSize
  ) || product?.variants?.[0];

  // Get product images - use frontImageUrl and backImageUrl, plus variant images
  // Helper function to format image URL
  const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_URL}${url}`;
  };

  const productImages = [];
  if (product?.frontImageUrl) {
    productImages.push(formatImageUrl(product.frontImageUrl));
  }
  if (product?.backImageUrl) {
    productImages.push(formatImageUrl(product.backImageUrl));
  }
  // Add variant images
  if (product?.variants) {
    product.variants.forEach((variant) => {
      // Handle both imageUrl (single) and imageUrls (array)
      if (variant.imageUrls && Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0) {
        variant.imageUrls.forEach((url) => {
          if (url) {
            const formattedUrl = formatImageUrl(url);
            if (!productImages.includes(formattedUrl)) {
              productImages.push(formattedUrl);
            }
          }
        });
      } else if (variant.imageUrl) {
        const formattedUrl = formatImageUrl(variant.imageUrl);
        if (!productImages.includes(formattedUrl)) {
          productImages.push(formattedUrl);
        }
      }
    });
  }
  // If no images, add placeholder
  if (productImages.length === 0) {
    productImages.push("https://via.placeholder.com/400");
  }

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.detailPage}>
        <div style={{ padding: "40px", textAlign: "center" }}>Product not found</div>
      </div>
    );
  }

  const handleMinimize = () => {
    if (typeof window !== "undefined" && id) {
      sessionStorage.setItem("minimizedProductId", String(id));
      // Also store product name for display in minimized tab
      if (product?.name) {
        sessionStorage.setItem("minimizedProductName", product.name);
      } else if (product?.productName) {
        sessionStorage.setItem("minimizedProductName", product.productName);
      }
    }
    router.push("/pet-store/products");
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("minimizedProductId");
      sessionStorage.removeItem("minimizedProductName");
    }
    router.push("/pet-store/products");
  };

  const handleMaximizeAddProduct = () => {
    setAddProductMinimized(false);
    setShowAddProduct(true);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("addProductMinimized");
    }
  };

  const handleCloseMinimizedAddProduct = () => {
    setAddProductMinimized(false);
    setShowAddProduct(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("addProductMinimized");
      sessionStorage.removeItem("addProductReturnPath");
    }
  };

  const handleAddProductClose = () => {
    setShowAddProduct(false);
    setEditProductData(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("addProductMinimized");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const response = await webApi.delete(`vendor/petstore/products/${id}`);
      if (response?.data || response?.status === "success") {
        // Navigate back to products list after successful deletion
        router.push("/pet-store/products");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  return (
    <>
      {showAddProduct && (
        <AddProduct
          onClose={handleAddProductClose}
          returnPath={`/pet-store/view/${id}`}
          editProductId={editProductData ? id : null}
          editProductData={editProductData}
        />
      )}

      <div className={`${styles.detailPage} ${isMaximized ? styles.maximized : ""} ${showAddProduct ? styles.hidden : ""}`}>
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
                    src={productImages[currentImageIndex] || "https://via.placeholder.com/400"} 
                    alt={product.productName || "Product"} 
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
                        <Image src={img || "https://via.placeholder.com/100"} alt={`${product.productName || "Product"}-${idx}`} fill style={{ objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>
                <h3 className={styles.productName}>{product.productName || "Product"}</h3>
                <div className={styles.ratingRow}>
                  <span className={styles.stars}>★★★★★</span>
                  <span className={styles.ratingText}>4.5 (69)</span>
                  <span className={styles.shareIcon}>🔗</span>
                </div>
              </div>

              <div className={styles.infoPanel}>
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.editBtn}
                    onClick={() => {
                      setEditProductData(product);
                      setShowAddProduct(true);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 19H6.098L16.796 8.302L15.698 7.204L5 17.902V19ZM4.808 20C4.57934 20 4.38734 19.9227 4.232 19.768C4.07667 19.6133 3.99934 19.4213 4 19.192V18.152C4 17.9307 4.04334 17.72 4.13 17.52C4.21667 17.32 4.333 17.1473 4.479 17.002L17.18 4.287C17.282 4.19567 17.395 4.125 17.519 4.075C17.643 4.025 17.7723 4 17.907 4C18.0417 4 18.1717 4.02133 18.297 4.064C18.4223 4.10667 18.539 4.18267 18.647 4.292L19.714 5.366C19.824 5.472 19.8993 5.58867 19.94 5.716C19.98 5.84267 20 5.96933 20 6.096C20 6.232 19.9773 6.362 19.932 6.486C19.886 6.60933 19.8133 6.72233 19.714 6.825L6.998 19.521C6.85334 19.6663 6.68067 19.7823 6.48 19.869C6.27934 19.9557 6.06867 19.9993 5.848 20H4.808ZM16.238 7.762L15.698 7.204L16.796 8.302L16.238 7.762Z" fill="white"/>
                    </svg>
                    Edit
                  </button>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => setShowDeletePopup(true)}
                  >
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
                      <span className={styles.infoValue}>{product.petType || "N/A"}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Category:</span>
                      <span className={styles.infoValue}>{product.category?.name || "N/A"}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Sub Category:</span>
                      <span className={styles.infoValue}>{product.subCategory?.name || "N/A"}</span>
                    </div>
                    {/* <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Brand Name:</span>
                      <span className={styles.infoValue}>{product.brandName || "N/A"}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Select Size:</span>
                      <span className={styles.infoValue}>{selectedSize || product.variants?.[0]?.variantType || "N/A"}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Color:</span>
                      <span className={styles.infoValue}>{product.color || "N/A"}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Breed Size:</span>
                      <span className={styles.infoValue}>{product.breedSize || "N/A"}</span>
                    </div>
                    {product.clothType && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Cloth Type:</span>
                        <span className={styles.infoValue}>{product.clothType}</span>
                      </div>
                    )}
                    {product.materialType && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Material Type:</span>
                        <span className={styles.infoValue}>{product.materialType}</span>
                      </div>
                    )}
                    {product.features && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Features:</span>
                        <span className={styles.infoValue}>{product.features}</span>
                      </div>
                    )}
                    <div className={`${styles.infoItem} ${styles.infoItemTextarea}`}>
                      <span className={styles.infoLabel}>Description:</span>
                      <textarea 
                        className={styles.textArea} 
                        value={product.description || ""} 
                        readOnly 
                        rows={3} 
                      />
                    </div> */}
                  </div>
                </div>

                <div className={styles.card}>
                  <h4>Variants</h4>
                  <div className={styles.variantList}>
                    {product.variants && product.variants.length > 0 ? (
                      product.variants.map((variant, index) => (
                        <div key={variant.id || index} style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: index < product.variants.length - 1 ? "1px solid #e5e5e5" : "none" }}>
                          <div className={styles.infoItem} style={{ marginBottom: "12px" }}>
                            <span className={styles.infoLabel}>Variant Type:</span>
                            <span className={styles.infoValue}>{variant.variantType || "N/A"}</span>
                          </div>
                          <div className={styles.infoItem} style={{ marginBottom: "12px" }}>
                            <span className={styles.infoLabel}>SKU Code:</span>
                            <span className={styles.infoValue}>{variant.skuCode || "N/A"}</span>
                          </div>
                          <div className={styles.infoItem} style={{ marginBottom: "12px" }}>
                            <span className={styles.infoLabel}>Selling Price:</span>
                            <span className={styles.infoValue}>₹ {parseFloat(variant.sellingPrice || 0).toFixed(2)}</span>
                          </div>
                          <div className={styles.infoItem} style={{ marginBottom: "12px" }}>
                            <span className={styles.infoLabel}>MRP:</span>
                            <span className={styles.infoValue}>₹ {parseFloat(variant.mrp || 0).toFixed(2)}</span>
                          </div>
                          <div className={styles.infoItem} style={{ marginBottom: "12px" }}>
                            <span className={styles.infoLabel}>Discount Percentage:</span>
                            <span className={styles.infoValue}>{parseFloat(variant.discountPercentage || 0).toFixed(2)}%</span>
                          </div>
                          {/* {variant.description && (
                            <div className={styles.infoItem}>
                              <span className={styles.infoLabel}>Description:</span>
                              <span className={styles.infoValue}>{variant.description}</span>
                            </div>
                          )} */}
                        </div>
                      ))
                    ) : (
                      <div className={styles.infoItem}>
                        <span className={styles.infoValue}>No variants available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Minimized Tabs Container - Gmail style */}
      {addProductMinimized && (
        <div className={styles.minimizedTabsContainer}>
          <div className={addProductStyles.minimizedBar} onClick={handleMaximizeAddProduct}>
            <span>Add new product</span>
            <div className={addProductStyles.minimizedBarActions} onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={handleMaximizeAddProduct}
                className={addProductStyles.windowBtn}
              >
                ☐
              </button>
              <button 
                onClick={handleCloseMinimizedAddProduct}
                className={addProductStyles.windowBtn}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowDeletePopup(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Delete Product</h3>
            <p style={{ marginBottom: '24px', color: '#666' }}>
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeletePopup(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeletePopup(false);
                  handleDelete();
                }}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;

