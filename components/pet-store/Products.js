"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "../../styles/pet-store/petStore.module.css";
import { petStoreProducts } from "./data";
import { useRouter } from "next/router";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import { IMAGE_URL } from "@/components/utilities/Constants";

const PetStoreProducts = ({ products: propProducts }) => {
  const router = useRouter();
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);
  
  const [allProducts, setAllProducts] = useState(propProducts || []);
  const [loading, setLoading] = useState(!propProducts);
  const [dateFilter, setDateFilter] = useState("All Products");

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      if (propProducts) return; // Don't fetch if products are passed as props
      
      try {
        setLoading(true);
        const response = await webApi.get("vendor/petstore/products");
        if (response?.data?.data) {
          // Transform API response to component format
          const transformedProducts = response.data.data.map((product) => {
            // Extract sizes from variants (variantType) - split comma-separated values
            const allSizes = [];
            const priceBySize = {};
            
            product.variants?.forEach((variant) => {
              if (variant.variantType) {
                // Combine quantityValue and variantType for display
                let size = "";
                if (variant.quantityValue) {
                  // Show quantityValue first, then variantType
                  size = `${variant.quantityValue} ${variant.variantType}`.trim();
                } else {
                  // If no quantityValue, just show variantType
                  size = String(variant.variantType).trim();
                }
                
                const price = `₹ ${parseFloat(variant.sellingPrice || 0).toFixed(2)}`;
                
                // Add size if not already present
                if (size && !allSizes.includes(size)) {
                  allSizes.push(size);
                }
                // If multiple variants have same size, use the first one's price
                if (size && !priceBySize[size]) {
                  priceBySize[size] = price;
                }
              }
            });
            
            const sizes = allSizes.length > 0 ? allSizes : ["Default"];

            // Build type string
            const typeParts = [];
            if (product.petType) typeParts.push(product.petType);
            if (product.category?.name) typeParts.push(product.category.name);
            if (product.subCategory?.name) typeParts.push(product.subCategory.name);
            const type = typeParts.length > 0 ? typeParts.join(" – ") : "Product";

            // Handle image URL - prepend IMAGE_URL if needed
            let imageUrl = "";
            if (product.frontImageUrl) {
              imageUrl = product.frontImageUrl.startsWith('http') 
                ? product.frontImageUrl 
                : `${IMAGE_URL}${product.frontImageUrl}`;
            }

            return {
              id: product.id,
              name: product.productName,
              type: type,
              sizes: sizes.length > 0 ? sizes : ["Default"],
              priceBySize: priceBySize,
              image: imageUrl,
              highlight: sizes[0] || null,
              createdAt: product.createdAt, // Store createdAt for filtering
              // Store full product data for navigation
              _fullData: product,
            };
          });
          setAllProducts(transformedProducts);
          
          // Clear the productAdded flag after successful fetch
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("productAdded");
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        // Fallback to default data on error
        setAllProducts(petStoreProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Check if product was just added and refetch
    const checkProductAdded = () => {
      if (typeof window !== "undefined") {
        const productAdded = sessionStorage.getItem("productAdded");
        if (productAdded === "true") {
          fetchProducts();
        }
      }
    };

    // Check immediately
    checkProductAdded();

    // Also check periodically when on products page
    const interval = setInterval(() => {
      if (router.pathname === '/pet-store/products') {
        checkProductAdded();
      }
    }, 500);

    // Refetch when navigating to this page
    const handleRouteChange = (url) => {
      if (url === '/pet-store/products' || url.startsWith('/pet-store/products')) {
        fetchProducts();
      }
    };

    if (router.events) {
      router.events.on('routeChangeComplete', handleRouteChange);
    }
    
    // Also refetch on page focus (when user comes back to the tab)
    const handleFocus = () => {
      if (router.pathname === '/pet-store/products') {
        checkProductAdded();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      if (router.events) {
        router.events.off('routeChangeComplete', handleRouteChange);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [propProducts, jwt, router.pathname, router.events]);

  // Filter products based on selected date filter
  const products = useMemo(() => {
    if (dateFilter === "All Products") {
      return allProducts;
    }
    
    const now = new Date();
    let startDate = new Date();
    
    switch (dateFilter) {
      case "Today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "This Week":
        const dayOfWeek = now.getDay();
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "This Month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        return allProducts;
    }
    
    return allProducts.filter((product) => {
      if (!product.createdAt) return false;
      const productDate = new Date(product.createdAt);
      return productDate >= startDate && productDate <= now;
    });
  }, [allProducts, dateFilter]);

  const initialSelection = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.id] = p.highlight || p.sizes?.[0];
    });
    return map;
  }, [products]);

  const [selectedSizes, setSelectedSizes] = useState(initialSelection);

  const handleSizeChange = (id, size) => {
    setSelectedSizes((prev) => ({ ...prev, [id]: size }));
  };

  const formatPrice = (product) => {
    const size = selectedSizes[product.id];
    const price = product.priceBySize?.[size];
    return price || product.priceBySize?.[product.sizes?.[0]] || "—";
  };

  const getNoProductsMessage = () => {
    switch (dateFilter) {
      case "Today":
        return "No products found today";
      case "This Week":
        return "No products found this week";
      case "This Month":
        return "No products found this month";
      default:
        return "No products found";
    }
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Products</h3>
          </div>
          <div style={{ padding: "20px", textAlign: "center" }}>Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Products</h3>
          <div className={styles.actionRow}>
            <button className={`${styles.secondaryBtn} ${styles.withIcon}`} type="button">
              <span className={styles.filterIcon}>⇅</span>
              Filter
            </button>
            <select 
              className={styles.filterSelectSmall} 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option>All Products</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
        </div>

        <div className={styles.productList}>
          {products.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" }}>{getNoProductsMessage()}</div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className={styles.productCard}
                onClick={() => {
                  const selectedSize = selectedSizes[product.id] || product.highlight || product.sizes?.[0];
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem(`selectedSize_${product.id}`, selectedSize);
                    // Store product name for minimized tab display
                    if (product.name) {
                      sessionStorage.setItem("minimizedProductName", product.name);
                    }
                  }
                  router.push(`/pet-store/view/${product.id}`);
                }}
              >
                <div className={styles.productThumb}>
                  <Image 
                    src={
                      product.image
                        ? (product.image.startsWith('http') 
                            ? product.image 
                            : `${IMAGE_URL}${product.image}`)
                        : `https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg`
                    }
                    alt={product.name || "Product"} 
                    width={90} 
                    height={90} 
                  />
                </div>
                <p className={styles.productTitle}>{product.name || "Untitled Product"}</p>
                <p className={styles.productType}>{product.type || "Product"}</p>
                {product.sizes && product.sizes.length > 0 && (
                  <div className={styles.chipRow}>
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        className={`${styles.chip} ${
                          size === selectedSizes[product.id] ? styles.chipActive : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSizeChange(product.id, size);
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
                <div className={styles.productPrice}>{formatPrice(product)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PetStoreProducts;

