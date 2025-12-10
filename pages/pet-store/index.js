"use client";

import Layout from "@/components/pet-sales/layout";
import PetStoreDashboard from "@/components/pet-store/Dashboard";
import AddProduct from "@/components/pet-store/AddProduct";
import { BackButton, Calender3, FourDots } from "@/public/image/SVG";
import React, { useState, useEffect } from "react";
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

const PetStoreHome = () => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductMinimized, setAddProductMinimized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
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

export default PetStoreHome;

