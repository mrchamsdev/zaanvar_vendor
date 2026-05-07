
"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/pet-store/viewProduct.module.css";
import Image from "next/image";
import { FiX, FiMinus, FiSquare } from "react-icons/fi";

const ViewProduct = ({ product, onClose }) => {
  const modalRef = useRef(null);
  const [windowState, setWindowState] = useState("fullscreen"); // 'standard', 'minimized', 'fullscreen'
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!product) return null;

  const handleMouseDown = (e) => {
    if (windowState === 'minimized') return;
    
    // Don't trigger drag on interactive elements
    const interactiveTags = ['BUTTON', 'A', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'];
    if (interactiveTags.includes(e.target.tagName) || e.target.closest('button') || e.target.closest('table')) return;

    if (windowState === 'fullscreen') {
      setWindowState('standard');
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || windowState !== 'standard') return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, windowState]);

  useEffect(() => {
    if (modalRef.current && windowState === 'standard') {
      modalRef.current.style.setProperty('--modal-left', `calc(50% + ${position.x}px)`);
      modalRef.current.style.setProperty('--modal-top', `calc(50% + ${position.y}px)`);
      modalRef.current.style.setProperty('--modal-transform', `translate(-50%, -50%)`);
    } else if (modalRef.current) {
      modalRef.current.style.removeProperty('--modal-left');
      modalRef.current.style.removeProperty('--modal-top');
      modalRef.current.style.removeProperty('--modal-transform');
    }
  }, [position, windowState]);

  return (
    <div className={`${styles.modalOverlay} ${windowState === 'minimized' ? styles.minimizedOverlay : ''}`}>
      <div 
        ref={modalRef}
        className={`${styles.viewProductModal} ${styles[windowState]} ${isDragging ? styles.dragging : ''}`}
        onClick={() => { if(windowState === 'minimized') setWindowState('standard'); }}
        onMouseDown={handleMouseDown}
      >
      <div className={styles.modalHeader}>
        <h2>View Product Details</h2>
        <div className={styles.headerActions}>
          <button 
            className={styles.iconBtn} 
            onClick={(e) => { e.stopPropagation(); setWindowState('minimized'); }}
            title="Minimize"
          >
            <FiMinus />
          </button>
          {windowState === 'fullscreen' ? (
            <button 
              className={styles.iconBtn} 
              onClick={(e) => { e.stopPropagation(); setWindowState('standard'); }}
              title="Restore"
            >
              <FiSquare />
            </button>
          ) : (
            <button 
              className={styles.iconBtn} 
              onClick={(e) => { e.stopPropagation(); setWindowState('fullscreen'); }}
              title="Maximize"
            >
              <FiSquare />
            </button>
          )}
          <button 
            className={styles.iconBtn} 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            title="Close"
          >
            <FiX />
          </button>
        </div>
      </div>

      <div className={styles.modalBody}>
        <div className={styles.topSection}>
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Product Name</span>
              <span className={styles.metaValue}>{product.productName || "Bottle"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Brand Name</span>
              <span className={styles.metaValue}>{product.brandName || "Kinley"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Category</span>
              <span className={styles.metaValue}>{product.category?.category || product.category?.name || "Bottles"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Sub-Category</span>
              <span className={styles.metaValue}>{product.subCategory?.subCategory || product.subCategory?.name || "Liters"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Pet Type</span>
              <span className={styles.metaValue}>{Array.isArray(product.petType) ? product.petType.join(", ") : product.petType || "Cat"}</span>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Order Number</span>
              <span className={styles.metaValue}>#0000212</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>EAN /UPC Number</span>
              <span className={styles.metaValue}>{product.eanUpc || "12365489652"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>SKU Number</span>
              <span className={styles.metaValue}>{product.sku || "00000000000000"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Product Code</span>
              <span className={styles.metaValue}>{product.productCode || "0000"}</span>
            </div>
            <div className={styles.hiddenSpacer}></div>

            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Unit Type</span>
              <span className={styles.metaValue}>{product.unitType || "Liters"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={`${styles.metaLabel} ${styles.required}`}>Min Stock Alert</span>
              <span className={styles.metaValue}>{product.minStockAlert || "2135"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>GST(%) ⓘ</span>
              <span className={styles.metaValue}>{product.gst || "5%"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={`${styles.metaLabel} ${styles.required}`}>HSN Code</span>
              <span className={styles.metaValue}>{product.hsnCode || "321456"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={`${styles.metaLabel} ${styles.required}`}>MRP</span>
              <span className={styles.metaValue}>{product.mrp || "321456"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={`${styles.metaLabel} ${styles.required}`}>Selling Price</span>
              <span className={styles.metaValue}>{product.sellingPrice || "10000"}</span>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.imagesSection}>
              <label>Product Images</label>
              <div className={styles.imageGrid}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={styles.imageBox}>
                    <Image src="/image/placeholder-img.png" width={30} height={30} alt="placeholder" />
                  </div>
                ))}
                <div className={styles.imageBox}>+</div>
              </div>
            </div>

            <div className={styles.statsSection}>
              {(() => {
                const variants = product.variants || [];
                const totalQty = variants.reduce((sum, v) => sum + (v.stockUpdates?.totalQuantity || v.stockQty || 0), 0);
                const availableQty = variants.reduce((sum, v) => sum + (v.stockUpdates?.qtyForSale || v.stockQty || 0), 0);
                const onHoldQty = variants.reduce((sum, v) => sum + (v.stockUpdates?.onHoldQuantity || v.holdQuantity || 0), 0);
                const openStockQty = variants.reduce((sum, v) => sum + (v.stockUpdates?.openStockQuantity || v.openingStock || 0), 0);
                const damagedQty = variants.reduce((sum, v) => sum + (v.damagedQty || 0), 0);
                const soldQty = variants.reduce((sum, v) => sum + (v.soldQty || 0), 0);

                return (
                  <>
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>Total :</span>
                      <span className={styles.statValue}>{String(totalQty).padStart(6, '0')}</span>
                    </div>
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>Available products :</span>
                      <span className={styles.statValue}>{String(availableQty).padStart(6, '0')}</span>
                    </div>
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>Soldout products :</span>
                      <span className={styles.statValue}>{String(soldQty).padStart(6, '0')}</span>
                    </div>
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>Open Stock products :</span>
                      <span className={styles.statValue}>{String(openStockQty).padStart(6, '0')}</span>
                    </div>
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>Damaged products :</span>
                      <span className={styles.statValue}>{String(damagedQty).padStart(6, '0')}</span>
                    </div>
                    {onHoldQty > 0 && (
                      <div className={styles.statRow}>
                        <span className={styles.statLabel}>On Hold products :</span>
                        <span className={styles.statValue} style={{color: '#E9315D'}}>{String(onHoldQty).padStart(6, '0')}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

          </div>
        </div>

        <div className={styles.historySection}>
          <h3>Product History</h3>
          
          <div className={styles.subSection}>
            <h4>Purchase Order</h4>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Supplier Name</th>
                  <th>MRP</th>
                  <th>Cost Price</th>
                  <th>ORDERED</th>
                  <th>Received</th>
                  <th>Defective</th>
                  <th>STOCK RECEIVED DATE</th>
                  <th>EXPIRY DATE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#0001</td>
                  <td>NOBITA</td>
                  <td>₹200</td>
                  <td>₹150</td>
                  <td>50</td>
                  <td>3</td>
                  <td>3</td>
                  <td>29 JAN 2026</td>
                  <td>22 MAY 2026</td>
                </tr>
                <tr>
                  <td>#0002</td>
                  <td>....</td>
                  <td>₹200</td>
                  <td>₹150</td>
                  <td>1</td>
                  <td>0</td>
                  <td>0</td>
                  <td>29 JAN 2026</td>
                  <td>22 MAY 2026</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.subSection}>
            <h4>Stock History</h4>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>UPDATED DATE</th>
                  <th>ADD PRODUCT NAME</th>
                  <th>Product Code</th>
                  <th>CURRENT QTY</th>
                  <th>ADD</th>
                  <th>REMOVE</th>
                  <th>UPDATED QTY</th>
                  <th>REASON</th>
                  <th>EXP. DATE</th>
                  <th>COST PRICE</th>
                  <th>TOTAL (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>29 JAN 2026</td>
                  <td>TABLETS</td>
                  <td>#00001</td>
                  <td>12</td>
                  <td>5</td>
                  <td>0</td>
                  <td>7</td>
                  <td className={styles.bold}>MISCOUNT</td>
                  <td>29 JAN 2026</td>
                  <td>₹200</td>
                  <td>₹1400.00</td>
                </tr>
                <tr>
                  <td>29 JAN 2026</td>
                  <td>TABLETS</td>
                  <td>#00001</td>
                  <td>12</td>
                  <td>5</td>
                  <td>0</td>
                  <td>7</td>
                  <td className={styles.bold}>MISCOUNT</td>
                  <td>29 JAN 2026</td>
                  <td>₹200</td>
                  <td>₹1400.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ViewProduct;
