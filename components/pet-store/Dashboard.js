"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import styles from "../../styles/pet-store/petStore.module.css";
import {
  petStoreSummaryCards,
  petStoreCategoryBreakdown,
  petStoreRecentProducts,
  petStoreReviews,
} from "./data";
import Reviews from "./Reviews";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import { IMAGE_URL } from "@/components/utilities/Constants";

const chartColors = ["#FFB200", "#FF6B6B", "#3DD598", "#56CCF2", "#5A6ACF", "#FFC107"];

const PetStoreDashboard = ({
  summaryCards = petStoreSummaryCards,
  categoryData = petStoreCategoryBreakdown,
  recentProducts: propRecentProducts,
  reviews = petStoreReviews,
}) => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);
  
  const [summaryRange, setSummaryRange] = useState("This Month");
  const [recentRange, setRecentRange] = useState("Today");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(!propRecentProducts);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      if (propRecentProducts) {
        setAllProducts(propRecentProducts);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await webApi.get("vendor/petstore/products");
        if (response?.data?.data) {
          // Transform API response to component format (same as Products.js)
          const transformedProducts = response.data.data.map((product) => {
            const allSizes = [];
            const priceBySize = {};
            
            product.variants?.forEach((variant) => {
              if (variant.variantType) {
                const size = String(variant.variantType).trim();
                const price = `₹ ${parseFloat(variant.sellingPrice || 0).toFixed(2)}`;
                
                if (size && !allSizes.includes(size)) {
                  allSizes.push(size);
                }
                if (size && !priceBySize[size]) {
                  priceBySize[size] = price;
                }
              }
            });
            
            const sizes = allSizes.length > 0 ? allSizes : ["Default"];

            const typeParts = [];
            if (product.petType) typeParts.push(product.petType);
            if (product.category?.name) typeParts.push(product.category.name);
            if (product.subCategory?.name) typeParts.push(product.subCategory.name);
            const type = typeParts.length > 0 ? typeParts.join(" – ") : "Product";

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
              _fullData: product,
            };
          });
          setAllProducts(transformedProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setAllProducts(petStoreRecentProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [propRecentProducts, jwt]);

  // Filter products based on selected timeline
  const filteredRecentProducts = useMemo(() => {
    if (!allProducts.length) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (recentRange) {
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
        startDate = new Date(0); // All time
    }
    
    return allProducts.filter((product) => {
      if (!product.createdAt) return false;
      const productDate = new Date(product.createdAt);
      return productDate >= startDate && productDate <= now;
    });
  }, [allProducts, recentRange]);

  const initialRecentSelection = useMemo(() => {
    const map = {};
    filteredRecentProducts.forEach((p) => {
      map[p.id] = p.highlight || p.sizes?.[0];
    });
    return map;
  }, [filteredRecentProducts]);

  const [recentSelection, setRecentSelection] = useState(initialRecentSelection);

  // Update selection when filtered products change
  useEffect(() => {
    const map = {};
    filteredRecentProducts.forEach((p) => {
      map[p.id] = p.highlight || p.sizes?.[0];
    });
    setRecentSelection(map);
  }, [filteredRecentProducts]);

  const handleRecentSize = (productId, size) => {
    setRecentSelection((prev) => ({ ...prev, [productId]: size }));
  };

  const formatPrice = (product) => {
    const size = recentSelection[product.id];
    const price = product.priceBySize?.[size];
    return price || product.priceBySize?.[product.sizes?.[0]] || "—";
  };

  const getNoProductsMessage = () => {
    switch (recentRange) {
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

  const renderIcon = (key) => {
    switch (key) {
      case "brands":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M2.8125 0.5625C1.56986 0.5625 0.5625 1.56986 0.5625 2.8125V6.1875C0.5625 7.43015 1.56986 8.4375 2.8125 8.4375H6.1875C7.43015 8.4375 8.4375 7.43015 8.4375 6.1875V2.8125C8.4375 1.56986 7.43015 0.5625 6.1875 0.5625H2.8125Z" fill="#19A868"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M14.0485 1.00028C13.9903 0.744207 13.7626 0.5625 13.5 0.5625C13.2374 0.5625 13.0097 0.744207 12.9515 1.00028L12.6403 2.36895C12.4963 3.00201 12.002 3.49633 11.3689 3.64028L10.0003 3.95151C9.74422 4.00973 9.5625 4.2374 9.5625 4.5C9.5625 4.7626 9.74422 4.99027 10.0003 5.04849L11.3689 5.35972C12.002 5.50367 12.4963 5.99799 12.6403 6.63106L12.9515 7.99973C13.0097 8.25578 13.2374 8.4375 13.5 8.4375C13.7626 8.4375 13.9903 8.25578 14.0485 7.99973L14.3597 6.63106C14.5037 5.99799 14.998 5.50367 15.6311 5.35972L16.9997 5.04849C17.2558 4.99027 17.4375 4.7626 17.4375 4.5C17.4375 4.2374 17.2558 4.00973 16.9997 3.95151L15.6311 3.64028C14.998 3.49633 14.5037 3.00201 14.3597 2.36895L14.0485 1.00028Z" fill="#19A868"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M0.5625 11.8125C0.5625 10.5699 1.56986 9.5625 2.8125 9.5625H6.1875C7.43015 9.5625 8.4375 10.5699 8.4375 11.8125V15.1875C8.4375 16.4301 7.43015 17.4375 6.1875 17.4375H2.8125C1.56986 17.4375 0.5625 16.4301 0.5625 15.1875V11.8125Z" fill="#19A868"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M11.8125 9.5625C10.5699 9.5625 9.5625 10.5699 9.5625 11.8125V15.1875C9.5625 16.4301 10.5699 17.4375 11.8125 17.4375H15.1875C16.4301 17.4375 17.4375 16.4301 17.4375 15.1875V11.8125C17.4375 10.5699 16.4301 9.5625 15.1875 9.5625H11.8125Z" fill="#19A868"/>
          </svg>
        );
      case "tags":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="none">
            <path d="M14.0401 0.957031H8.51352C8.16373 0.957031 7.8278 1.09629 7.58031 1.34378L0.38658 8.53619C-0.12886 9.05163 -0.12886 9.88716 0.38658 10.4033L5.91321 15.9299C6.42865 16.4453 7.26418 16.4453 7.77962 15.9299L14.9734 8.73748C15.2208 8.48933 15.3601 8.1534 15.3601 7.80296V2.27698C15.3601 1.54771 14.7694 0.957031 14.0401 0.957031ZM11.7302 5.57686C11.1838 5.57686 10.7403 5.13335 10.7403 4.5869C10.7403 4.04044 11.1838 3.59693 11.7302 3.59693C12.2767 3.59693 12.7202 4.04044 12.7202 4.5869C12.7202 5.13335 12.2767 5.57686 11.7302 5.57686Z" fill="#E69F00"/>
            <path d="M16.6784 2.27734L16.6777 8.42105C16.6777 8.7253 16.5569 9.01767 16.3411 9.23282L9.03125 16.5427L9.14345 16.6549C9.65889 17.1703 10.4944 17.1703 11.0099 16.6549L17.6109 10.0552C17.8591 9.80766 17.9983 9.47173 17.9983 9.12195V3.59729C17.9983 2.86802 17.4077 2.27734 16.6784 2.27734Z" fill="#E69F00"/>
          </svg>
        );
      case "products":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M14.3582 1.11579V3.2091H12.8762V1.11579H12.055C11.9022 1.11579 11.7783 0.991934 11.7783 0.839145C11.7783 0.686391 11.9022 0.5625 12.055 0.5625H15.1794C15.2825 0.5625 15.3724 0.618855 15.42 0.702457L16.2391 1.94027C16.3232 2.0674 16.2884 2.23868 16.1613 2.32281C16.0341 2.40697 15.8628 2.37213 15.7787 2.24501L15.0315 1.11579H14.3582ZM1.73056 14.276C1.57214 14.2519 1.44822 14.1209 1.43704 13.9563L0.759049 3.95409C0.738553 3.65129 0.975331 3.39789 1.2788 3.39789H5.62692C5.92997 3.39789 6.16664 3.65059 6.14674 3.953L5.48992 13.9555C5.47909 14.1205 5.35503 14.2518 5.19637 14.276C4.04113 14.276 2.88586 14.276 1.73056 14.276ZM1.8419 4.71649H5.06379C5.21658 4.71649 5.34044 4.59264 5.34044 4.43985C5.34044 4.28706 5.21658 4.1632 5.06379 4.1632H1.8419C1.68911 4.1632 1.56525 4.28706 1.56525 4.43985C1.56529 4.59264 1.68914 4.71649 1.8419 4.71649ZM3.45286 6.04948C2.88882 6.04948 2.43157 7.2984 2.43157 8.83898C2.43157 10.3796 2.88882 11.6285 3.45286 11.6285C4.01691 11.6285 4.47415 10.3796 4.47415 8.83898C4.47415 7.2984 4.01691 6.04948 3.45286 6.04948ZM7.12377 9.56735H9.83759C10.1111 9.56735 10.3349 9.79116 10.3349 10.0647V10.713C10.3349 10.9865 10.1111 11.2103 9.83759 11.2103H7.12377C6.85022 11.2103 6.62642 10.9865 6.62642 10.713V10.0647C6.62642 9.79116 6.85022 9.56735 7.12377 9.56735ZM8.46319 6.76424C8.88401 6.76424 9.22752 7.06194 9.22752 7.49359V9.01406H7.7338V7.49359C7.7338 7.09189 8.06146 6.76424 8.46319 6.76424ZM10.0012 11.7507C10.3959 12.0368 10.6819 12.3501 10.6819 12.9479V16.5583C10.6819 17.0419 10.2863 17.4375 9.80275 17.4375H7.15861C6.67504 17.4375 6.27942 17.0419 6.27942 16.5583V12.9479C6.27942 12.3501 6.56549 12.0368 6.96019 11.7507C7.01352 11.7591 7.06816 11.7636 7.12377 11.7636H9.83755C9.89317 11.7636 9.94784 11.7591 10.0012 11.7507ZM10.688 6.82931C10.3465 6.82931 10.0613 7.06539 10.0039 7.37444H16.0142C16.172 7.37444 16.2999 7.4983 16.2999 7.65109C16.2999 7.80388 16.172 7.92773 16.0142 7.92773H9.99337V9.02577C10.498 9.10164 10.8882 9.53979 10.8882 10.0647V10.713C10.8882 11.0152 10.7588 11.2886 10.5528 11.4808C11.0048 11.87 11.2352 12.3312 11.2352 12.948V15.0154H17.241V7.48905C17.241 7.12568 16.929 6.82931 16.5464 6.82931H10.688ZM17.241 15.5686V15.8286C17.241 16.0466 17.0538 16.2244 16.8243 16.2244H11.2352V15.5686H17.241ZM13.7438 9.62497C13.8805 9.83493 14.0519 10.1553 14.2191 10.4746C14.463 10.9401 14.8582 11.5763 14.8297 12.1206C14.7895 12.8886 14.2142 13.4731 13.5448 13.4261C12.8754 13.3791 12.3653 12.7184 12.4055 11.9504C12.4334 11.4179 12.8423 10.9087 13.122 10.4964C13.3401 10.1748 13.57 9.8337 13.7438 9.62497ZM11.3039 5.35841H15.9305C16.0257 5.35841 16.1034 5.43607 16.1034 5.53131V6.27602H11.131V5.53131C11.131 5.43607 11.2087 5.35841 11.3039 5.35841ZM11.8828 3.76239H15.3516C15.4659 3.76239 15.5591 3.85559 15.5591 3.96988V4.80519H11.6753V3.96988C11.6753 3.85559 11.7685 3.76239 11.8828 3.76239ZM4.79587 14.8293V15.33C4.79587 15.44 4.7059 15.5299 4.59597 15.5299H2.30976C2.19979 15.5299 2.10982 15.44 2.10982 15.33V14.8293H4.79587Z" fill="#52A6F0"/>
          </svg>
        );
      case "spark":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="none">
            <g clipPath="url(#clip0)">
              <path fillRule="evenodd" clipRule="evenodd" d="M11.8946 11.2422C8.60457 11.2422 5.94728 8.57436 5.94728 5.29492C5.94728 8.57436 3.27944 11.2422 0 11.2422C3.27944 11.2422 5.94728 13.8995 5.94728 17.1789C5.94728 13.8995 8.60457 11.2422 11.8946 11.2422Z" fill="#FFD93B"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M17.9933 14.3091C16.1901 14.3091 14.7349 12.8434 14.7349 11.0508C14.7349 12.8434 13.2692 14.3091 11.4766 14.3091C13.2692 14.3091 14.7349 15.7643 14.7349 17.5675C14.7349 15.7643 16.1901 14.3091 17.9933 14.3091Z" fill="#FFB030"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M16.1172 4.39844C13.9239 4.39844 12.1524 2.62692 12.1524 0.433594C12.1524 2.62692 10.3808 4.39844 8.1875 4.39844C10.3808 4.39844 12.1524 6.16997 12.1524 8.3633C12.1524 6.16997 13.9239 4.39844 16.1172 4.39844Z" fill="#FFB030"/>
            </g>
            <defs>
              <clipPath id="clip0">
                <rect width="18" height="18" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.summaryRow}>
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className={`${styles.summaryCard} ${card.wide ? styles.summaryCardWide : ""} ${
              styles[`tone-${card.tone}`] || ""
            }`}
          >
            <div className={styles.summaryLeft}>
              <span className={styles.iconBubble}>{renderIcon(card.icon)}</span>
              <div>
                <p className={styles.summaryValue}>{card.value}</p>
                <p className={styles.summaryLabel}>{card.subText}</p>
              </div>
            </div>
            {card.wide && <span className={styles.summaryMeta}>{card.title}</span>}
          </div>
        ))}
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Dashboard</h3>
            <select
              className={styles.filterSelect}
              value={summaryRange}
              onChange={(e) => setSummaryRange(e.target.value)}
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.legendRow}>
            {categoryData.map((entry, index) => (
              <span key={entry.name} className={styles.legendItem}>
                <span
                  className={styles.legendColor}
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                {entry.name}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Recently added products</h3>
            <select
              className={styles.filterSelect}
              value={recentRange}
              onChange={(e) => setRecentRange(e.target.value)}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>Loading products...</div>
          ) : (
            <>
              {filteredRecentProducts.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center" }}>{getNoProductsMessage()}</div>
              ) : (
                <div className={styles.recentList}>
                  {filteredRecentProducts.map((product) => (
                    <div key={product.id} className={styles.recentItem}>
                      <div className={styles.recentThumb}>
                        <Image
                          src={
                            product.image
                              ? (product.image.startsWith('http') 
                                  ? product.image 
                                  : `${IMAGE_URL}${product.image}`)
                              : `https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg`
                          }
                          alt={product.name || "Product"}
                          width={80}
                          height={80}
                        />
                      </div>
                      <div className={styles.recentMeta}>
                        <p className={styles.recentTitle}>{product.name || "Untitled Product"}</p>
                        <p className={styles.recentType}>{product.type || "Product"}</p>
                        {product.sizes && product.sizes.length > 0 && (
                          <div className={styles.chipRow}>
                            {product.sizes.map((size) => (
                              <button
                                key={size}
                                className={`${styles.chip} ${
                                  size === recentSelection[product.id] ? styles.chipActive : ""
                                }`}
                                onClick={() => handleRecentSize(product.id, size)}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        )}
                        <p className={styles.price}>{formatPrice(product)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <div className={styles.cardFooter}>
            <button className={styles.linkButton}>View all</button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>User Reviews</h3>
        </div>
        <Reviews reviews={reviews} hideHeader />
        <div className={styles.cardFooter}>
          <button className={styles.linkButton}>View all</button>
        </div>
      </div>
    </div>
  );
};

export default PetStoreDashboard;

