import React from "react";
import styles from "../../styles/inventory/inventory.module.css";

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconMinimize = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconResize = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );

const ProductView = ({ data, onBack }) => {
  if (!data) return <div style={{padding: 40, textAlign: 'center'}}>No product data available.</div>;

  return (
    <div className={styles.viewContainer}>
      {/* Header Info Grid */}
      <div className={styles.viewHeaderGrid}>
        <div className={styles.viewHeaderLeft}>
          <div className={styles.infoGridRow}>
            <div className={styles.infoGridItem}>
              <label>Product Name</label>
              <strong>{data.productName}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Brand Name</label>
              <strong>{data.brand || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Category</label>
              <strong>{Array.isArray(data.categoryId) ? data.categoryId.join(", ") : data.categoryId || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Sub-Category</label>
              <strong>{Array.isArray(data.subCategoryId) ? data.subCategoryId.join(", ") : data.subCategoryId || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Pet Type</label>
              <strong>{data.productPetType || "-"}</strong>
            </div>
          </div>
          <div className={styles.infoGridRow} style={{marginTop: 20}}>
            <div className={styles.infoGridItem}>
              <label>Product Code</label>
              <strong>{data.ProductCode || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Min Stock Alert</label>
              <strong>{data.minStockAlert || "0"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>HSN Code</label>
              <strong>{data.hsnCode || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>GST(%)</label>
              <strong>{data.gst || "0"}%</strong>
            </div>
          </div>
        </div>

        <div className={styles.viewHeaderRight}>
          <label style={{display: 'block', marginBottom: 12, fontWeight: 600, color: '#333'}}>Product Images</label>
          <div className={styles.viewImageGallery}>
             {[1,2,3].map(i => (
                <div key={i} className={styles.viewImageThumb}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </div>
             ))}
             <div className={`${styles.viewImageThumb} ${styles.addImageThumb}`}>+</div>
          </div>
          <div className={styles.totalCountBox}>
             <label>Total :</label>
             <span className={styles.totalValue}>000000</span>
          </div>
        </div>
      </div>

      {/* Variants Table */}
      <div className={styles.viewSectionTitle}>VARIANTS</div>
      <div className={styles.viewTableWrapper}>
        <table className={styles.viewTable}>
          <thead>
            <tr>
              <th>SKU Code</th>
              <th>EAN/UPC Number</th>
              <th>Pack Type</th>
              <th>Unit Measure</th>
              <th>Pack Count</th>
              <th>MRP</th>
              <th>Selling Price</th>
              <th>Available Products</th>
              <th>Soldout Products</th>
              <th>Damaged Products</th>
              <th>Open Stock Products</th>
            </tr>
          </thead>
          <tbody>
            {(data.variants || [{}]).map((v, idx) => (
              <tr key={idx}>
                <td>{v.skuNumber || "000000"}</td>
                <td>{v.eanUpc || "-"}</td>
                <td>{v.packType || "-"}</td>
                <td>{v.unitMeasure || v.variantMeasure || "-"}</td>
                <td>{v.packCount || "-"}</td>
                <td>{v.mrp || "-"}</td>
                <td>{v.sellingPrice || "-"}</td>
                <td>{v.available || "0"}</td>
                <td>{v.soldout || "0"}</td>
                <td>{v.damaged || "0"}</td>
                <td>{v.openStock || "0"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.viewSectionTitle} style={{marginTop: 32}}>Product History</div>
      
      {/* Purchase Order Table */}
      <div className={styles.viewSubTitle}>Purchase Order</div>
      <div className={styles.viewTableWrapper}>
        <table className={styles.viewTable}>
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
          </tbody>
        </table>
      </div>

      {/* Stock History Table */}
      <div className={styles.viewSubTitle} style={{marginTop: 24}}>Stock History</div>
      <div className={styles.viewTableWrapper}>
        <table className={styles.viewTable}>
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
              <td>{data.productName}</td>
              <td>{data.ProductCode || "#00001"}</td>
              <td>12</td>
              <td>5</td>
              <td>0</td>
              <td>7</td>
              <td style={{color: '#E9315D', fontWeight: 600}}>MISCOUNT</td>
              <td>29 JAN 2026</td>
              <td>₹200</td>
              <td>₹1400.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{marginTop: 40, display: 'flex', justifyContent: 'flex-end'}}>
          <button className={styles.pageBtn} onClick={onBack}>Close View</button>
      </div>
    </div>
  );
};

export default ProductView;
