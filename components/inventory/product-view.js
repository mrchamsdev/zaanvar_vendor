import React from "react";
import styles from "../../styles/inventory/product-view.module.css";

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ProductView = ({ data, onBack, isSplit }) => {
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = React.useState(null);

  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>No product data available.</div>;

  const formatExpiryDate = (date) => {
    if (!date) return "-";
    if (typeof date === "string" && (date.startsWith("0000-00-00") || date === "0000-00-00")) {
      return "-";
    }
    return date;
  };

  const formatSourceStatus = (status) => {
    if (!status) return "-";
    if (status === "openStock") return "Open Stock";
    return status;
  };

  const getVariantTypeDisplay = (bill) => {
    const rawSizeVal = bill.variant?.variantType?.size || bill.variant?.size || "";
    const rawSize = (rawSizeVal && rawSizeVal.toString().toUpperCase() !== "N/A" && rawSizeVal !== "undefined") ? rawSizeVal : "";
    let parsedSize = null;
    if (typeof rawSize === 'string' && rawSize.trim().startsWith('{')) {
      try { parsedSize = JSON.parse(rawSize); } catch (e) { }
    }

    if (parsedSize) {
      const parts = [];
      if (parsedSize.height) parts.push(`${parsedSize.height}${parsedSize.heightUnit || 'mm'}H`);
      if (parsedSize.width) parts.push(`${parsedSize.width}${parsedSize.widthUnit || 'mm'}W`);
      if (parsedSize.length) parts.push(`${parsedSize.length}${parsedSize.lengthUnit || 'mm'}L`);
      if (parsedSize.radius) parts.push(`${parsedSize.radius}${parsedSize.radiusUnit || 'mm'}R`);
      if (parsedSize.weight) parts.push(`${parsedSize.weight}${parsedSize.weightUnit || 'g'}`);
      return parts.length > 0 ? parts.join(" x ") : "-";
    }

    return rawSize || "-";
  };

  // Flatten the category for display
  const renderList = (arr) => {
    if (!arr) return "-";
    let listStr = "";
    if (typeof arr === 'object' && !Array.isArray(arr)) {
      const val = arr.petType || arr.name || arr;
      listStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
    } else if (!Array.isArray(arr)) {
      listStr = String(arr);
    } else {
      listStr = arr.map(item => {
        if (typeof item === 'object' && item !== null) return item.petType || item.name || JSON.stringify(item);
        return item;
      }).join(" | ");
    }

    if (!listStr || listStr === "-") return "-";
    const items = listStr.split(/\s*(?:and|\||,)\s*/i).map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return "-";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
  };
  const renderCategory = (cat) => {
    if (!cat) return "-";
    if (Array.isArray(cat)) return cat.map(c => renderCategory(c)).join(", ");
    if (typeof cat === 'object') {
      const val = cat.subCategory || cat.category || cat.name || cat.categoryName || "-";
      if (typeof val === 'object' && val !== null) {
        return val.subCategory || val.category || val.name || JSON.stringify(val);
      }
      return String(val);
    }
    return String(cat);
  };

  // Ensure we get variants from any potential data key
  const allVariants = data.variants || data.productVariants || [];

  // Calculate total stock across all variants
  const totalStock = allVariants.reduce((sum, v) => sum + (Number(v.stockUpdates?.totalQuantity || v.stockQty || 0)), 0);

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
          </div>
          <div className={styles.infoGridRow}>
            <div className={styles.infoGridItem}>
              <label>Product Code</label>
              <strong>{data.ProductCode || data.productCode || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>HSN Code</label>
              <strong>{data.hsnCode || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>GST(%)</label>
              <strong>{(data.taxGroupId || data.gst) && (data.taxGroupId !== "-" && data.gst !== "-") ? `${data.taxGroupId || data.gst}%` : "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>Pet Type</label>
              <strong>{renderList(data.productPetType)}</strong>
            </div>
          </div>
        </div>

        <div className={styles.viewHeaderRight}>
          <div>
            <label className={styles.galleryTitle}>Product Images</label>
            <div className={styles.viewImageGallery}>
              {/* Collect all variant images into one unique list */}
              {(() => {
                const allImages = (allVariants || []).reduce((acc, v) => {
                  const imgs = v.productImgs || v.productImages || [];
                  imgs.forEach(img => { if (img && !acc.includes(img)) acc.push(img); });
                  return acc;
                }, []);

                const displayImages = allImages.slice(0, 3);
                const remainingCount = allImages.length - 3;

                return (
                  <>
                    {displayImages.map((img, i) => (
                      <div key={i} className={styles.viewImageThumb} onClick={() => { setSelectedGalleryImage(img); setIsGalleryOpen(true); }}>
                        <img src={img} alt="product" />
                      </div>
                    ))}
                    {remainingCount > 0 ? (
                      <div className={`${styles.viewImageThumb} ${styles.overflowThumb}`} onClick={() => { setSelectedGalleryImage(allImages[3]); setIsGalleryOpen(true); }}>
                        <img src={allImages[3]} alt="more" />
                        <div className={styles.overflowBadge}>+{remainingCount}</div>
                      </div>
                    ) : (
                      allImages.length < 3 && <div className={`${styles.viewImageThumb} ${styles.addImageThumb}`}>+</div>
                    )}

                    {/* Image Modal Popup */}
                    {isGalleryOpen && (
                      <div className={styles.imageModalOverlay} onClick={() => setIsGalleryOpen(false)}>
                        <div className={styles.imageModalContent} onClick={e => e.stopPropagation()}>
                          <button className={styles.closeModalBtn} onClick={() => setIsGalleryOpen(false)}>×</button>
                          <div className={styles.modalBody}>
                            <div className={styles.thumbnailsSidebar}>
                              {allImages.map((img, idx) => (
                                <div
                                  key={idx}
                                  className={`${styles.sidebarThumb} ${selectedGalleryImage === img ? styles.activeSidebarThumb : ""}`}
                                  onClick={() => setSelectedGalleryImage(img)}
                                >
                                  <img src={img} alt={`Thumb ${idx}`} />
                                </div>
                              ))}
                            </div>
                            <div className={styles.mainImageContainer}>
                              <img src={selectedGalleryImage} alt="Selected" className={styles.mainModalImage} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          <div className={styles.totalCountBox}>
            <label>Total :</label>
            <span className={styles.totalValue}>{String(totalStock).padStart(6, '0')}</span>
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
              <th>Size</th>
              <th>Unit</th>
              <th>Min Stock</th>
              <th>Pack Count</th>
              <th>MRP</th>
              <th>Selling Price</th>
              <th>Total Stock</th>
              <th>Opening Stock</th>
              <th>Hold Qty</th>
              <th>Sold Products</th>
              <th>Damaged Products</th>
            </tr>
          </thead>
          <tbody>
            {(allVariants || []).map((v) => {
              const rawPackType = v.variantType?.packType || v.packType || "-";
              const packTypeStr = (rawPackType && rawPackType.toUpperCase() !== "N/A" && rawPackType !== "undefined") ? rawPackType : "-";
              const packTypeLow = packTypeStr.toLowerCase();
              const catStr = (renderCategory(data.category) || "").toLowerCase();
              const subCatStr = (renderCategory(data.subCategory) || "").toLowerCase();
              const isClothing = catStr.includes('cloth') || subCatStr.includes('cloth');
              const isSizeBased = ["PIECES (Pcs)", "PAIRS (Prs)"].includes(packTypeStr);

              const rawSizeVal = v.variantType?.size || v.size || "";
              const rawSize = (rawSizeVal && rawSizeVal.toString().toUpperCase() !== "N/A" && rawSizeVal !== "undefined") ? rawSizeVal : "";
              let parsedSize = null;
              if (typeof rawSize === 'string' && rawSize.trim().startsWith('{')) {
                try { parsedSize = JSON.parse(rawSize); } catch (e) { }
              }

              // Size Column
              let displaySize = "-";
              if (isSizeBased) {
                displaySize = (rawSize && !rawSize.toString().startsWith('{')) ? rawSize : "-";
              } else if (parsedSize) {
                const parts = [];
                if (parsedSize.height) parts.push(`${parsedSize.height}${parsedSize.heightUnit || 'mm'}H`);
                if (parsedSize.width) parts.push(`${parsedSize.width}${parsedSize.widthUnit || 'mm'}W`);
                if (parsedSize.length) parts.push(`${parsedSize.length}${parsedSize.lengthUnit || 'mm'}L`);
                if (parsedSize.radius) parts.push(`${parsedSize.radius}${parsedSize.radiusUnit || 'mm'}R`);
                displaySize = parts.length > 0 ? parts.join(" x ") : "-";
              } else if (isClothing && (packTypeLow.includes("piece") || packTypeLow.includes("pair"))) {
                displaySize = packTypeStr;
              }

              // Weight / Unit Column
              let weightUnitVal = "-";
              if (!isSizeBased) {
                if (v.unitMeasure) {
                  weightUnitVal = `${v.unitMeasure}${v.unitType || v.sizeType?.[0] || ""}`;
                } else if (rawSize && !rawSize.toString().startsWith('{')) {
                  weightUnitVal = rawSize;
                }
              }

              return (
                <tr key={v.variantId}>
                  <td>{v.SKU || v.variantId || "-"}</td>
                  <td>{v.barcode || v.eanUpcNumber || "-"}</td>
                  <td>{packTypeStr}</td>
                  <td>{displaySize}</td>
                  <td>{weightUnitVal}</td>
                  <td style={{ fontWeight: 600, color: '#ff4d4f' }}>{v.minStockAlert || "0"}</td>
                  <td>{v.numberOfPieces || v.variantType?.packCount || "-"}</td>
                  <td>{v.mrp || "-"}</td>
                  <td>{v.sellingPrice || "-"}</td>
                  <td>{
                    v.batchNumbers?.length > 0
                      ? v.batchNumbers.reduce((sum, b) => sum + Number(b.stockUpdates?.totalQuantity || b.quantity || 0), 0)
                      : (v.stockUpdates?.totalQuantity || v.stockQty || 0)
                  }</td>
                  <td>{
                    v.batchNumbers?.length > 0
                      ? v.batchNumbers.reduce((sum, b) => sum + Number(b.stockUpdates?.openStockQuantity || b.openStockQuantity || b.openQty || b.openingStock || b.quantity || 0), 0)
                      : (v.stockUpdates?.openStockQuantity || v.openingStock || v.openStockQuantity || 0)
                  }</td>
                  <td>{
                    v.batchNumbers?.length > 0
                      ? v.batchNumbers.reduce((sum, b) => sum + Number(b.stockUpdates?.onHoldQuantity || b.onHoldQuantity || b.holdQty || b.holdQuantity || 0), 0)
                      : (v.stockUpdates?.onHoldQuantity || v.holdQuantity || v.holdQty || v.onHoldQuantity || 0)
                  }</td>
                  <td>{v.stockUpdates?.qtySold ?? v.soldQty ?? 0}</td>
                  <td>{v.stockUpdates?.excludedDamageQty ?? v.damagedQty ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(data.productsBillItems?.length > 0 || data.stockHistory?.length > 0) && (
        <div className={styles.viewHistorySection}>
          <div className={styles.viewSectionTitle}>Product History</div>

          {/* Purchase Order Table */}
          {data.productsBillItems?.length > 0 && (
            <>
              <div className={styles.viewSubTitle}>Purchase Order</div>
              <div className={styles.viewTableWrapper}>
                <table className={styles.viewTable}>
                  <thead>
                    <tr>
                      <th>Order No</th>
                      <th>Product Bill ID</th>
                      <th>Supplier Name</th>
                      <th>Variant Type</th>
                      <th>Batch No</th>
                      <th>Total Qty</th>
                      <th>Open Qty</th>
                      <th>Hold Qty</th>
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
                    {data.productsBillItems.map((bill, idx) => {
                      const batchObj = allVariants
                        .flatMap(v => v.batchNumbers || [])
                        .find(b => b.batchNumber === bill.batchNumber);
                      const totalQty = batchObj?.stockUpdates?.totalQuantity ?? batchObj?.quantity ?? "-";
                      const openQty = batchObj?.stockUpdates?.openStockQuantity ?? batchObj?.openStockQuantity ?? "-";
                      const holdQty = batchObj?.stockUpdates?.onHoldQuantity ?? batchObj?.onHoldQuantity ?? "-";

                      return (
                        <tr key={idx}>
                          <td>{bill.productsPurchaseRqstId || bill.productsBillId}</td>
                          <td>{bill.productsBillId || "-"}</td>
                          <td>{bill.bill?.vendor?.supplierName || "Global Pet Supplies"}</td>
                          <td>{getVariantTypeDisplay(bill)}</td>
                          <td>{bill.batchNumber || "-"}</td>
                          <td style={{ fontWeight: 600 }}>{totalQty}</td>
                          <td style={{ fontWeight: 600 }}>{openQty}</td>
                          <td style={{ fontWeight: 600, color: holdQty > 0 ? '#ff4d4f' : 'inherit' }}>{holdQty}</td>
                          <td>₹{bill.mrp}</td>
                          <td>₹{bill.costPrice}</td>
                          <td>{bill.qty}</td>
                          <td>{bill.receivedQuantity}</td>
                          <td>{bill.damagedQuantity}</td>
                          <td>{bill.bill?.receivedDate || "-"}</td>
                          <td>{formatExpiryDate(bill.expiryDate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Stock History Table */}
          {data.stockHistory?.length > 0 && (
            <>
              <div className={styles.viewSubTitle} style={{ marginTop: 24 }}>Stock History</div>
              <div className={styles.viewTableWrapper}>
                <table className={styles.viewTable}>
                  <thead>
                    <tr>
                      <th>UPDATED DATE</th>
                      <th>Batch No</th>
                      <th>CURRENT QTY</th>
                      <th>ADD</th>
                      <th>REMOVE</th>
                      <th>UPDATED QTY</th>
                      <th>REASON</th>
                      <th>SOURCE STATUS</th>
                      <th>EXP. DATE</th>
                      <th>TOTAL (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.stockHistory].sort((a, b) => {
                      const dateA = new Date(a.modifiedDate || a.createdDate || 0).getTime();
                      const dateB = new Date(b.modifiedDate || b.createdDate || 0).getTime();
                      if (dateB !== dateA) return dateB - dateA;
                      return (b.stockUpdateId || 0) - (a.stockUpdateId || 0);
                    }).map((stock, idx) => {
                      const isOS = stock.sourceStatus === "openStock" || stock.sourceStatus === "Open Stock";
                      const isHold = stock.sourceStatus === "onHold" || stock.sourceStatus === "hold" || stock.sourceStatus === "Hold Qty";
                      const isNegative = stock.remove > 0 || (stock.reason?.toLowerCase().includes('damaged') || stock.reason?.toLowerCase().includes('expired') || stock.reason?.toLowerCase().includes('theft') || stock.reason?.toLowerCase().includes('internal purpose') || stock.reason?.toLowerCase().includes('onhold'));
                      const val = parseFloat(stock.totalValue || 0);
                      const displayColor = isNegative ? '#e74c3c' : '#27ae60';
                      const displayText = isNegative ? `- ₹ ${Math.abs(val).toFixed(2)}` : `+ ₹ ${Math.abs(val).toFixed(2)}`;
                      return (
                        <tr key={idx}>
                          <td>{stock.createdDate?.split("T")[0] || "-"}</td>
                          <td>{stock.batchNumber || stock.billItem?.batchNumber || "-"}</td>
                          <td>
                            {(() => {
                              if (stock.stock !== undefined && stock.stock !== null) {
                                return stock.stock;
                              }
                              if (stock.stockUpdates) {
                                if (isOS) {
                                  const openStock = Number(stock.stockUpdates.openStockQuantity || 0);
                                  return openStock + Number(stock.remove || 0) - Number(stock.add || 0);
                                }
                                if (isHold) {
                                  const onHold = Number(stock.stockUpdates.onHoldQuantity || 0);
                                  return onHold + Number(stock.remove || 0) - Number(stock.add || 0);
                                }
                              }
                              return stock.currentQty;
                            })()}
                          </td>
                          <td>{stock.add}</td>
                          <td>{stock.remove}</td>
                          <td>
                            {(() => {
                              if (isOS && stock.openQty !== undefined && stock.openQty !== null) {
                                return stock.openQty;
                              }
                              if (isHold && stock.holdQty !== undefined && stock.holdQty !== null) {
                                return stock.holdQty;
                              }
                              if (stock.stockUpdates) {
                                if (isOS) {
                                  return Number(stock.stockUpdates.openStockQuantity || 0);
                                }
                                if (isHold) {
                                  return Number(stock.stockUpdates.onHoldQuantity || 0);
                                }
                              }
                              return stock.updatedQty;
                            })()}
                          </td>
                          <td style={{ color: '#E9315D', fontWeight: 600 }}>{stock.reason || "MISCOUNT"}</td>
                          <td>{formatSourceStatus(stock.sourceStatus)}</td>
                          <td>{formatExpiryDate(stock.expDate)}</td>
                          <td style={{ color: displayColor, fontWeight: 600 }}>{displayText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* <div className={styles.viewActions}>
          <button className={styles.nextBtn} onClick={onBack}>Close View</button>
      </div> */}
    </div>
  );
};

export default ProductView;
