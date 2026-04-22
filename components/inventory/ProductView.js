import React from "react";
import styles from "../../styles/inventory/productView.module.css";

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ProductView = ({ data, onBack, isSplit }) => {
  if (!data) return <div style={{padding: 40, textAlign: 'center'}}>No product data available.</div>;

  // Flatten the category for display
  const renderList = (arr) => {
    if (!Array.isArray(arr)) return arr || "-";
    return arr.join(" | ") || "-";
  };
  const renderCategory = (cat) => {
    if (Array.isArray(cat)) return cat.join(", ");
    if (typeof cat === 'object' && cat !== null) return cat.category || cat.name || "-";
    return cat || "-";
  };

  // Ensure we get variants from any potential data key
  const allVariants = data.variants || data.productVariants || [];

  return (
    <div className={`${styles.viewContainer} ${isSplit ? styles.splitView : ""}`}>
      {/* Header Info Grid & Sidebar */}
      <div className={styles.viewHeaderGrid}>
        <div className={styles.viewHeaderLeft}>
          <div className={styles.infoGridRow}>
            <div className={styles.infoGridItem}>
              <label>Product Name</label>
              <strong>{data.productName || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Brand Name</label>
              <strong>{data.brandName || data.brand || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Category</label>
              <strong>{renderCategory(data.category || data.categoryId)}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Sub-Category</label>
              <strong>{renderCategory(data.subCategory || data.subCategoryId)}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Pet Type</label>
              <strong>{renderList(data.productPetType)}</strong>
            </div>
          </div>
          <div className={styles.infoGridRow}>
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
              <strong>{data.gst || "5"}%</strong>
            </div>
            <div className={styles.infoGridItem}></div>
          </div>
        </div>

        <div className={styles.viewHeaderRight}>
          <div>
            <label className={styles.galleryTitle}>Product Images</label>
            <div className={styles.viewImageGallery}>
               {/* Use variant images if available, else placeholders */}
               {(allVariants?.[0]?.productImgs || [1,2,3]).slice(0,3).map((img, i) => (
                  <div key={i} className={styles.viewImageThumb}>
                      {typeof img === 'string' ? (
                         <img src={img} alt="product" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:8}} />
                      ) : (
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                             <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                             <circle cx="8.5" cy="8.5" r="1.5" />
                             <polyline points="21 15 16 10 5 21" />
                         </svg>
                      )}
                  </div>
               ))}
               <div className={`${styles.viewImageThumb} ${styles.addImageThumb}`}>+</div>
            </div>
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
            {(allVariants || []).map((v) => (
              <tr key={v.variantId}>
                <td>{v.SKU || v.variantId || "-"}</td>
                <td>{v.eanUpcNumber || v.barcode || "-"}</td>
                <td>{v.packType || "Litres"}</td>
                <td>{v.variantMeasure} {typeof v.variantType === 'object' ? Object.values(v.variantType)[0] : "kgs"}</td>
                <td>{v.numberOfPieces || "-"}</td>
                <td>{v.mrp || "-"}</td>
                <td>{v.sellingPrice || "-"}</td>
                <td>400</td> {/* Placeholder as per screenshot */}
                <td>200</td> {/* Placeholder as per screenshot */}
                <td>50</td>  {/* Placeholder as per screenshot */}
                <td>150</td> {/* Placeholder as per screenshot */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.viewHistorySection}>
        <div className={styles.viewSectionTitle}>Product History</div>
        
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
              {(data.productsBillItems || []).map((bill, idx) => (
                <tr key={idx}>
                  <td>#{bill.productsPurchaseRqstId || bill.productsBillId}</td>
                  <td>{bill.bill?.vendor?.supplierName || "Global Pet Supplies"}</td>
                  <td>₹{bill.mrp}</td>
                  <td>₹{bill.costPrice}</td>
                  <td>{bill.qty}</td>
                  <td>{bill.receivedQuantity}</td>
                  <td>{bill.damagedQuantity}</td>
                  <td>{bill.bill?.receivedDate || "-"}</td>
                  <td>{bill.expiryDate || "-"}</td>
                </tr>
              ))}
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
              {(data.stockHistory || []).map((stock, idx) => (
                <tr key={idx}>
                  <td>{stock.createdDate?.split("T")[0] || "-"}</td>
                  <td>{stock.itemName || data.productName}</td>
                  <td>{stock.productCode || "-"}</td>
                  <td>{stock.currentQty}</td>
                  <td>{stock.add}</td>
                  <td>{stock.remove}</td>
                  <td>{stock.updatedQty}</td>
                  <td style={{color: '#E9315D', fontWeight: 600}}>{stock.reason || "MISCOUNT"}</td>
                  <td>{stock.expDate || "-"}</td>
                  <td>₹{stock.billItem?.costPrice || "-"}</td>
                  <td>₹{stock.totalValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.viewActions}>
          <button className={styles.nextBtn} onClick={onBack}>Close View</button>
      </div>
    </div>
  );
};

export default ProductView;
