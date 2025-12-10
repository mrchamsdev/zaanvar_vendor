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
      const productId = sessionStorage.getItem("minimizedProductId");
      if (productId) {
        setMinimizedProductId(productId);
        const product = petStoreProducts.find((p) => p.id === productId);
        setMinimizedProduct(product);
      }

      // Check if Add Product is minimized
      const isMinimized = sessionStorage.getItem("addProductMinimized") === "true";
      if (isMinimized) {
        setAddProductMinimized(true);
        setShowAddProduct(false); // Don't show the modal when minimized
      }
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
    </>
  );
};

export default PetStoreProductsPage;

