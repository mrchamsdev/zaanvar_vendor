"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import styles from "../../styles/pet-store/petStore.module.css";
import { petStoreProducts } from "./data";
import { useRouter } from "next/router";


const PetStoreProducts = ({ products = petStoreProducts }) => {
  const router = useRouter();

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
    return price || product.priceBySize?.[product.sizes?.[0]] || product.price || "—";
  };

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
            <select className={styles.filterSelectSmall} defaultValue="This Month">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        <div className={styles.productList}>
          {products.map((product) => (
            <div
              key={product.id}
              className={styles.productCard}
              onClick={() => {
                const selectedSize = selectedSizes[product.id] || product.highlight || product.sizes?.[0];
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(`selectedSize_${product.id}`, selectedSize);
                }
                router.push(`/pet-store/view/${product.id}`);
              }}
            >
              <div className={styles.productThumb}>
                <Image src={product.image} alt={product.name} width={90} height={90} />
              </div>
              <p className={styles.productTitle}>{product.name}</p>
              <p className={styles.productType}>{product.type}</p>
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
              <div className={styles.productPrice}>{formatPrice(product)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PetStoreProducts;

