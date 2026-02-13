"use client";

import Layout from "@/components/pet-sales/layout";
import PetStoreProducts from "@/components/pet-store/Products";
import AddProduct from "@/components/pet-store/AddProduct";
import { BackButton, Calender3, FourDots } from "@/public/image/SVG";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { petStoreProducts } from "@/components/pet-store/data";
import styles from "../../styles/pet-store/productDetail.module.css";
import addProductStyles from "../../styles/pet-store/addProduct.module.css";

const menuItems = [
  { name: "Dashboard", icon: <FourDots />, path: "/pet-store" },
  { name: "Products", icon: <Calender3 />, path: "/pet-store/products" },
  { name: "Reviews", icon: <Calender3 />, path: "/pet-store/reviews" },
];

const topbarButtons = [
  { label: "+ Add Product", color: "red", action: "addProduct" },
  { label: "+ Add More", color: "light", action: "addMore" },
];

const PetStoreProductsPage = () => {
  const router = useRouter();
  const [minimizedProductId, setMinimizedProductId] = useState(null);
  const [minimizedProduct, setMinimizedProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductMinimized, setAddProductMinimized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMinimizedStates = () => {
        const productId = sessionStorage.getItem("minimizedProductId");
        if (productId) {
          setMinimizedProductId(productId);
          // Try to get product name from sessionStorage first (most reliable)
          const productName = sessionStorage.getItem("minimizedProductName");
          if (productName) {
            setMinimizedProduct({ id: productId, name: productName });
          } else {
            // Fallback: try to find in static data
            const product = petStoreProducts.find((p) => String(p.id) === String(productId));
            if (product) {
              setMinimizedProduct(product);
            } else {
              // If not found, create a minimal product object with just the ID
              // The name will be fetched or shown as "Product" if needed
              setMinimizedProduct({ id: productId, name: "Product" });
            }
          }
        } else {
          setMinimizedProductId(null);
          setMinimizedProduct(null);
        }

        // Check if Add Product is minimized
        const isMinimized = sessionStorage.getItem("addProductMinimized") === "true";
        setAddProductMinimized(isMinimized);
        if (isMinimized) {
          setShowAddProduct(false); // Don't show the modal when minimized
        }
      };

      // Check immediately
      checkMinimizedStates();

      // Periodically check for changes (useful when navigating between pages)
      const interval = setInterval(checkMinimizedStates, 300);

      return () => clearInterval(interval);
    }
  }, []);

  const handleTopbarAction = (action) => {
    if (action === "addProduct") {
      setShowAddProduct(true);
      setAddProductMinimized(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("addProductMinimized");
      }
    }
  };

  const handleAddProductClose = () => {
    setShowAddProduct(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("addProductMinimized");
    }
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

  const handleRestore = () => {
    if (minimizedProductId) {
      router.push(`/pet-store/view/${minimizedProductId}`);
    }
  };

  const handleClose = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("minimizedProductId");
      sessionStorage.removeItem("minimizedProductName");
    }
    setMinimizedProductId(null);
    setMinimizedProduct(null);
  };

  return (
    <>
      <Layout
        menuItems={menuItems}
        topbarButtons={topbarButtons}
        logoText="Pet Store"
        sidebarToggleButton={<BackButton />}
        topbarActionHandler={handleTopbarAction}
      >
        <PetStoreProducts />
      </Layout>

      {showAddProduct && (
        <AddProduct
          onClose={handleAddProductClose}
          returnPath="/pet-store/products"
        />
      )}

      {/* Minimized Tabs Container - Gmail style */}
      {(minimizedProductId || addProductMinimized) && (
        <div className={styles.minimizedTabsContainer}>
          {addProductMinimized && (
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
          )}
          {minimizedProductId && minimizedProduct && (
            <div className={styles.minibar} onClick={handleRestore}>
              <span>{minimizedProduct.name}</span>
              <div className={styles.windowActions}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore();
                  }} 
                  className={styles.windowBtn}
                >
                  ☐
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }} 
                  className={styles.windowBtn}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PetStoreProductsPage;

