
"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/pet-sales/layout";
import ProductTable from "@/components/pet-store/ProductTable";
import AddProduct from "@/components/pet-store/AddProduct";
import ViewProduct from "@/components/pet-store/ViewProduct";
import { BackButton, FourDots, SearchIcon } from "@/public/images/SVG";
import { productService } from "../../services/productService";
import { FiGrid, FiSearch } from "react-icons/fi";
import useStore from "@/components/state/useStore";
import styles from "../../styles/pet-store/products.module.css";

const menuItems = [
  { name: "Dashboard", icon: <FiGrid />, path: "/pet-store" },
  { name: "Products", icon: <FiSearch />, path: "/pet-store/products" },
  { name: "Reviews", icon: <FiGrid />, path: "/pet-store/reviews" },
];

const topbarButtons = [
  // { label: "+ Add Product", color: "red", action: "addProduct" },
  // { label: "+ Add More", color: "light", action: "addMore" },
];

const ProductsPage = () => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();

  const [products, setProducts] = useState([]);
  const [productType, setProductType] = useState("retail"); // retail or medical
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showViewProduct, setShowViewProduct] = useState(false);
  const [viewedProduct, setViewedProduct] = useState(null);
  const [editProductId, setEditProductId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await productService.getProducts(jwt, productType);
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [productType, jwt]);

  const handleTopbarAction = (action) => {
    if (action === "addProduct") {
      setEditProductId(null);
      setShowAddProduct(true);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} item(s)?`)) {
      try {
        for (const id of selectedIds) {
          await productService.deleteProduct(jwt, id);
        }
        setSelectedIds([]);
        fetchProducts();
      } catch (error) {
        console.error("Error deleting products:", error);
        alert("Failed to delete some products");
      }
    }
  };

  const handleEdit = () => {
    if (selectedIds.length === 1) {
      setEditProductId(selectedIds[0]);
      setShowAddProduct(true);
    }
  };

  const handleView = (product) => {
    setViewedProduct(product);
    setShowViewProduct(true);
  };

  return (
    <Layout
      menuItems={menuItems}
      topbarButtons={topbarButtons}
      logoText="Products"
      sidebarToggleButton={<BackButton />}
      topbarActionHandler={handleTopbarAction}
    >
      <div className={styles.pageWrapper}>
        <div className={styles.header}>
          <div className={styles.searchBar}>
            <SearchIcon />
            <input type="text" placeholder="Search here" />
          </div>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${productType === "retail" ? styles.activeTab : ""}`}
              onClick={() => setProductType("retail")}
            >
              Retail Product
            </button>
            <button 
              className={`${styles.tab} ${productType === "medical" ? styles.activeTab : ""}`}
              onClick={() => setProductType("medical")}
            >
              Medical Products
            </button>
          </div>
        </div>

        <div className={styles.statusCards}>
          <span className={styles.statusLabel}>Overall Status :</span>
          <div className={styles.statusCard}>TOTAL Products: {products.length.toString().padStart(2, '0')}</div>
          <div className={styles.statusCard}>Expired Products : 10</div>
          <div className={styles.statusCard}>Damaged Products : 10</div>
        </div>

        <ProductTable 
          products={products} 
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onView={handleView}
          onDelete={handleDelete}
          onEdit={(id) => {
            setEditProductId(id);
            setShowAddProduct(true);
          }}
          loading={loading}
        />

        {showAddProduct && (
          <AddProduct 
            onClose={() => {
              setShowAddProduct(false);
              fetchProducts();
            }}
            editProductId={editProductId}
            productType={productType}
          />
        )}

        {showViewProduct && (
          <ViewProduct 
            product={viewedProduct}
            onClose={() => setShowViewProduct(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default ProductsPage;
