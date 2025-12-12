"use client";

import Layout from "@/components/pet-sales/layout";
import PetStoreDashboard from "@/components/pet-store/Dashboard";
import AddProduct from "@/components/pet-store/AddProduct";
import { BackButton, Calender3, FourDots, FourDotsActive } from "@/public/image/SVG";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { petStoreProducts } from "@/components/pet-store/data";
import addProductStyles from "../../styles/pet-store/addProduct.module.css";
import styles from "../../styles/pet-store/productDetail.module.css";

const menuItems = [
  { name: "Dashboard", icon: <FourDotsActive />, path: "/pet-store" },
  { name: "Products", icon: <Calender3 />, path: "/pet-store/products" },
  { name: "Reviews", icon: <Calender3 />, path: "/pet-store/reviews" },
];

const topbarButtons = [
  { label: "+ Add Product", color: "red", action: "addProduct" },
  { label: "+ Add More", color: "light", action: "addMore" },
];

const PetStoreHome = () => {
  const router = useRouter();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductMinimized, setAddProductMinimized] = useState(false);
  const [minimizedProductId, setMinimizedProductId] = useState(null);
  const [minimizedProduct, setMinimizedProduct] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if Add Product is minimized
      const isMinimized = sessionStorage.getItem("addProductMinimized") === "true";
      if (isMinimized) {
        setAddProductMinimized(true);
        setShowAddProduct(false); // Don't show the modal when minimized
      }

      // Check if product view is minimized
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
            setMinimizedProduct({ id: productId, name: "Product" });
          }
        }
      }

      // Periodically check for minimized state changes
      const interval = setInterval(() => {
        const isMinimized = sessionStorage.getItem("addProductMinimized") === "true";
        setAddProductMinimized(isMinimized);
        if (isMinimized) {
          setShowAddProduct(false);
        }

        const prodId = sessionStorage.getItem("minimizedProductId");
        if (prodId) {
          setMinimizedProductId(prodId);
          // Try to get product name from sessionStorage first
          const productName = sessionStorage.getItem("minimizedProductName");
          if (productName) {
            setMinimizedProduct({ id: prodId, name: productName });
          } else {
            // Fallback: try to find in static data
            const product = petStoreProducts.find((p) => String(p.id) === String(prodId));
            if (product) {
              setMinimizedProduct(product);
            } else {
              setMinimizedProduct({ id: prodId, name: "Product" });
            }
          }
        } else {
          setMinimizedProductId(null);
          setMinimizedProduct(null);
        }
      }, 300);

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

  return (
    <>
      <Layout
        menuItems={menuItems}
        topbarButtons={topbarButtons}
        logoText="Pet Store"
        sidebarToggleButton={<BackButton />}
        topbarActionHandler={handleTopbarAction}
      >
        <PetStoreDashboard />
      </Layout>

      {showAddProduct && (
        <AddProduct
          onClose={handleAddProductClose}
          returnPath="/pet-store"
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
            <div className={styles.minibar} onClick={() => router.push(`/pet-store/view/${minimizedProductId}`)}>
              <span>{minimizedProduct.name}</span>
              <div className={styles.windowActions}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/pet-store/view/${minimizedProductId}`);
                  }} 
                  className={styles.windowBtn}
                >
                  ☐
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window !== "undefined") {
                      sessionStorage.removeItem("minimizedProductId");
                      sessionStorage.removeItem("minimizedProductName");
                    }
                    setMinimizedProductId(null);
                    setMinimizedProduct(null);
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

export default PetStoreHome;

