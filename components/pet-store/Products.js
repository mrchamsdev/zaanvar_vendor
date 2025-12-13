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
  
  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [petTypes, setPetTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  
  // Temporary filter selections (before applying)
  const [tempFilters, setTempFilters] = useState({
    petType: null,
    category: null,
    subCategory: null,
    brand: null
  });
  
  // Applied filters (active filters)
  const [appliedFilters, setAppliedFilters] = useState({
    petType: null,
    category: null,
    subCategory: null,
    brand: null
  });
  
  // Show more state for each section
  const [showMorePetTypes, setShowMorePetTypes] = useState(false);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showMoreSubCategories, setShowMoreSubCategories] = useState(false);
  const [showMoreBrands, setShowMoreBrands] = useState(false);

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
            const allSellingPrices = []; // Store all selling prices for range calculation
            
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
                
                const sellingPrice = parseFloat(variant.sellingPrice || 0);
                const price = `₹ ${sellingPrice.toFixed(2)}`;
                
                // Store selling price for range calculation
                if (!isNaN(sellingPrice) && sellingPrice > 0) {
                  allSellingPrices.push(sellingPrice);
                }
                
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
            
            // Calculate price range (lowest to highest) for products with multiple variants
            let priceRange = null;
            if (allSellingPrices.length > 1) {
              const sortedPrices = [...allSellingPrices].sort((a, b) => a - b);
              const lowest = sortedPrices[0];
              const highest = sortedPrices[sortedPrices.length - 1];
              // Always show range if there are multiple variants (even if prices are same)
              priceRange = `₹ ${lowest.toFixed(2)} - ₹ ${highest.toFixed(2)}`;
            }

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
              priceRange: priceRange, // Store price range for products with multiple variants
              image: imageUrl,
              highlight: sizes[0] || null,
              createdAt: product.createdAt, // Store createdAt for filtering
              petType: product.petType, // Store petType for filtering
              categoryId: product.categoryId || product.category?.id, // Store categoryId for filtering
              categoryName: product.category?.name, // Store category name for filtering
              subCategoryId: product.subCategoryId || product.subCategory?.id, // Store subCategoryId for filtering
              subCategoryName: product.subCategory?.name, // Store subCategory name for filtering
              brandName: product.brandName, // Store brandName for filtering
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

  // Fetch categories, subcategories, and extract pet types and brands
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await webApi.get("vendor/petstore/categories");
        if (categoriesResponse?.data?.data) {
          setCategories(categoriesResponse.data.data);
        }

        // Extract unique pet types from products
        const uniquePetTypes = new Set();
        const uniqueBrands = new Set();
        
        allProducts.forEach((product) => {
          // Handle petType - can be string or array
          const petType = product.petType || product._fullData?.petType;
          if (petType) {
            if (Array.isArray(petType)) {
              petType.forEach(pt => {
                if (pt) uniquePetTypes.add(pt);
              });
            } else {
              uniquePetTypes.add(petType);
            }
          }
          
          // Extract brand names
          const brandName = product.brandName || product._fullData?.brandName;
          if (brandName && typeof brandName === 'string') {
            uniqueBrands.add(brandName.trim());
          }
        });
        
        // Default pet types if none found
        const defaultPetTypes = ['Dog', 'Cat', 'Fish', 'Birds', 'Small Pets'];
        const petTypesList = Array.from(uniquePetTypes).length > 0 
          ? Array.from(uniquePetTypes).sort() 
          : defaultPetTypes;
        
        setPetTypes(petTypesList);
        setBrands(Array.from(uniqueBrands).sort());
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };

    if (allProducts.length > 0) {
      fetchFilterData();
    }
  }, [allProducts, jwt]);

  // Fetch subcategories when category is selected in temp filters
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (tempFilters.category) {
        try {
          const response = await webApi.get("vendor/petstore/subcategories", { 
            categoryId: tempFilters.category 
          });
          if (response?.data?.data) {
            setSubCategories(response.data.data);
          } else {
            setSubCategories([]);
          }
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          setSubCategories([]);
        }
      } else {
        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [tempFilters.category, jwt]);

  // Filter products based on selected date filter and applied filters
  const products = useMemo(() => {
    let filtered = allProducts;
    
    // Apply date filter
    if (dateFilter !== "All Products") {
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
          break;
      }
      
      filtered = filtered.filter((product) => {
        if (!product.createdAt) return false;
        const productDate = new Date(product.createdAt);
        return productDate >= startDate && productDate <= now;
      });
    }
    
    // Apply pet type filter
    if (appliedFilters.petType) {
      filtered = filtered.filter((product) => {
        const productPetType = product.petType || product._fullData?.petType;
        if (Array.isArray(productPetType)) {
          return productPetType.includes(appliedFilters.petType);
        }
        return productPetType === appliedFilters.petType;
      });
    }
    
    // Apply category filter
    if (appliedFilters.category) {
      filtered = filtered.filter((product) => {
        const productCategoryId = product.categoryId || product._fullData?.categoryId || product._fullData?.category?.id;
        return productCategoryId === appliedFilters.category || 
               parseInt(productCategoryId) === parseInt(appliedFilters.category);
      });
    }
    
    // Apply subcategory filter
    if (appliedFilters.subCategory) {
      filtered = filtered.filter((product) => {
        const productSubCategoryId = product.subCategoryId || product._fullData?.subCategoryId || product._fullData?.subCategory?.id;
        return productSubCategoryId === appliedFilters.subCategory || 
               parseInt(productSubCategoryId) === parseInt(appliedFilters.subCategory);
      });
    }
    
    // Apply brand filter
    if (appliedFilters.brand) {
      filtered = filtered.filter((product) => 
        product.brandName === appliedFilters.brand
      );
    }
    
    return filtered;
  }, [allProducts, dateFilter, appliedFilters]);

  const initialSelection = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      // Only set initial selection if product has only one variant
      // For multiple variants, leave it undefined to show price range
      if (p.sizes && p.sizes.length === 1) {
        map[p.id] = p.sizes[0];
      }
      // For products with multiple variants, don't set initial selection (will show price range)
    });
    return map;
  }, [products]);

  const [selectedSizes, setSelectedSizes] = useState(initialSelection);

  const handleSizeChange = (id, size) => {
    setSelectedSizes((prev) => {
      // If clicking the already selected size, deselect it
      if (prev[id] === size) {
        return { ...prev, [id]: undefined };
      }
      // Otherwise, select the new size
      return { ...prev, [id]: size };
    });
  };

  const formatPrice = (product) => {
    const size = selectedSizes[product.id];
    
    // If a specific size is selected, show that price
    if (size && product.priceBySize?.[size]) {
      return product.priceBySize[size];
    }
    
    // If no size is selected and product has multiple variants, show price range
    if (!size && product.priceRange) {
      return product.priceRange;
    }
    
    // Fallback to first size price or default
    return product.priceBySize?.[product.sizes?.[0]] || "—";
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

  // Filter handlers
  const handleTempFilterChange = (filterType, value) => {
    setTempFilters((prev) => {
      const newFilters = { ...prev, [filterType]: value };
      // If category changes, reset subcategory
      if (filterType === 'category') {
        newFilters.subCategory = null;
        setSubCategories([]);
      }
      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setShowFilters(false);
  };

  const handleClearAllFilters = () => {
    setTempFilters({
      petType: null,
      category: null,
      subCategory: null,
      brand: null
    });
    setAppliedFilters({
      petType: null,
      category: null,
      subCategory: null,
      brand: null
    });
    setSubCategories([]);
  };

  const handleRemoveFilter = (filterType) => {
    setAppliedFilters((prev) => {
      const newFilters = { ...prev, [filterType]: null };
      // If category is removed, also remove subcategory
      if (filterType === 'category') {
        newFilters.subCategory = null;
      }
      return newFilters;
    });
    // Also update temp filters to match
    setTempFilters((prev) => {
      const newFilters = { ...prev, [filterType]: null };
      if (filterType === 'category') {
        newFilters.subCategory = null;
        setSubCategories([]);
      }
      return newFilters;
    });
  };

  // Get filter display names
  const getFilterDisplayName = (filterType, value) => {
    if (!value) return '';
    switch (filterType) {
      case 'petType':
        return value;
      case 'category':
        const category = categories.find(c => c.id === value);
        return category?.name || value;
      case 'subCategory':
        const subCategory = subCategories.find(sc => sc.id === value);
        return subCategory?.name || value;
      case 'brand':
        return value;
      default:
        return value;
    }
  };

  // Helper to get items to show (first 5 or all if showMore is true)
  const getItemsToShow = (items, showMore, limit = 5) => {
    if (!items || items.length === 0) return [];
    if (showMore || items.length <= limit) return items;
    return items.slice(0, limit);
  };

  // Helper to get remaining count
  const getRemainingCount = (items, showMore, limit = 5) => {
    if (!items || items.length <= limit) return 0;
    return items.length - limit;
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
    <div className={styles.pageWrapper} style={{ position: 'relative' }}>
      {/* Applied Filters Tags */}
      {(appliedFilters.petType || appliedFilters.category || appliedFilters.subCategory || appliedFilters.brand) && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          marginBottom: '16px',
          padding: '0 20px'
        }}>
          {appliedFilters.petType && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              backgroundColor: '#FFE5E5',
              color: '#333',
              borderRadius: '20px',
              fontSize: '14px',
              gap: '8px'
            }}>
              {getFilterDisplayName('petType', appliedFilters.petType)}
              <button
                onClick={() => handleRemoveFilter('petType')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666',
                  padding: 0,
                  marginLeft: '4px'
                }}
              >
                ×
              </button>
            </span>
          )}
          {appliedFilters.category && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              backgroundColor: '#FFE5E5',
              color: '#333',
              borderRadius: '20px',
              fontSize: '14px',
              gap: '8px'
            }}>
              {getFilterDisplayName('category', appliedFilters.category)}
              <button
                onClick={() => handleRemoveFilter('category')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666',
                  padding: 0,
                  marginLeft: '4px'
                }}
              >
                ×
              </button>
            </span>
          )}
          {appliedFilters.subCategory && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              backgroundColor: '#FFE5E5',
              color: '#333',
              borderRadius: '20px',
              fontSize: '14px',
              gap: '8px'
            }}>
              {getFilterDisplayName('subCategory', appliedFilters.subCategory)}
              <button
                onClick={() => handleRemoveFilter('subCategory')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666',
                  padding: 0,
                  marginLeft: '4px'
                }}
              >
                ×
              </button>
            </span>
          )}
          {appliedFilters.brand && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              backgroundColor: '#FFE5E5',
              color: '#333',
              borderRadius: '20px',
              fontSize: '14px',
              gap: '8px'
            }}>
              {getFilterDisplayName('brand', appliedFilters.brand)}
              <button
                onClick={() => handleRemoveFilter('brand')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666',
                  padding: 0,
                  marginLeft: '4px'
                }}
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={handleClearAllFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              backgroundColor: '#FFE5E5',
              color: '#333',
              borderRadius: '20px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              gap: '8px'
            }}
          >
            Clear all
            <span style={{ fontSize: '16px' }}>×</span>
          </button>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Products</h3>
          <div className={styles.actionRow}>
            <button 
              className={`${styles.secondaryBtn} ${styles.withIcon}`} 
              type="button"
              onClick={() => {
                // Sync temp filters with applied filters when opening
                if (!showFilters) {
                  setTempFilters({ ...appliedFilters });
                }
                setShowFilters(!showFilters);
              }}
            >
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
                    // Store referrer to know where to navigate back
                    sessionStorage.setItem("productViewReferrer", "products");
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

      {/* Filters Panel */}
      {showFilters && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '300px',
            height: '100vh',
            backgroundColor: '#fff',
            boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Fixed Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Filters</h3>
            <button
              onClick={handleClearAllFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              Clear all
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px'
          }}>

          {/* Pet Type Section */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Select Pet Type</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getItemsToShow(petTypes, showMorePetTypes, 5).map((petType) => (
                <label key={petType} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="petType"
                    value={petType}
                    checked={tempFilters.petType === petType}
                    onChange={() => {
                      // Toggle: if already selected, deselect; otherwise select
                      handleTempFilterChange('petType', tempFilters.petType === petType ? null : petType);
                    }}
                    className={styles.radioButton}
                  />
                  {petType}
                </label>
              ))}
              {getRemainingCount(petTypes, showMorePetTypes, 5) > 0 && (
                <button
                  onClick={() => setShowMorePetTypes(!showMorePetTypes)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    padding: '8px 0',
                    textDecoration: 'underline'
                  }}
                >
                  +{getRemainingCount(petTypes, showMorePetTypes, 5)} more
                </button>
              )}
            </div>
          </div>

          {/* Category Section */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Category</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getItemsToShow(categories, showMoreCategories, 5).map((category) => (
                <label key={category.id} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    checked={tempFilters.category === category.id}
                    onChange={() => {
                      // Toggle: if already selected, deselect; otherwise select
                      handleTempFilterChange('category', tempFilters.category === category.id ? null : category.id);
                    }}
                    className={styles.radioButton}
                  />
                  {category.name}
                </label>
              ))}
              {getRemainingCount(categories, showMoreCategories, 5) > 0 && (
                <button
                  onClick={() => setShowMoreCategories(!showMoreCategories)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    padding: '8px 0',
                    textDecoration: 'underline'
                  }}
                >
                  +{getRemainingCount(categories, showMoreCategories, 5)} more
                </button>
              )}
            </div>
          </div>

          {/* Sub Category Section */}
          {tempFilters.category && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Sub Category</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getItemsToShow(subCategories, showMoreSubCategories, 5).map((subCategory) => (
                  <label key={subCategory.id} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="subCategory"
                      value={subCategory.id}
                      checked={tempFilters.subCategory === subCategory.id}
                      onChange={() => {
                        // Toggle: if already selected, deselect; otherwise select
                        handleTempFilterChange('subCategory', tempFilters.subCategory === subCategory.id ? null : subCategory.id);
                      }}
                      className={styles.radioButton}
                    />
                    {subCategory.name}
                  </label>
                ))}
                {getRemainingCount(subCategories, showMoreSubCategories, 5) > 0 && (
                  <button
                    onClick={() => setShowMoreSubCategories(!showMoreSubCategories)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      padding: '8px 0',
                      textDecoration: 'underline'
                    }}
                  >
                    +{getRemainingCount(subCategories, showMoreSubCategories, 5)} more
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Brand Section */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Brand Name</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getItemsToShow(brands, showMoreBrands, 5).map((brand) => (
                <label key={brand} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="brand"
                    value={brand}
                    checked={tempFilters.brand === brand}
                    onChange={() => {
                      // Toggle: if already selected, deselect; otherwise select
                      handleTempFilterChange('brand', tempFilters.brand === brand ? null : brand);
                    }}
                    className={styles.radioButton}
                  />
                  {brand}
                </label>
              ))}
              {getRemainingCount(brands, showMoreBrands, 5) > 0 && (
                <button
                  onClick={() => setShowMoreBrands(!showMoreBrands)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    padding: '8px 0',
                    textDecoration: 'underline'
                  }}
                >
                  +{getRemainingCount(brands, showMoreBrands, 5)} more
                </button>
              )}
            </div>
          </div>

          {/* Apply Filter Button */}
          <button
            onClick={handleApplyFilters}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#f18a19',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '24px'
            }}
          >
            Apply Filter
          </button>
          </div>
        </div>
      )}

      {/* Overlay when filters are open */}
      {showFilters && (
        <div
          onClick={() => setShowFilters(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999
          }}
        />
      )}
    </div>
  );
};

export default PetStoreProducts;

