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

  if (!data) return <div style={{padding: 40, textAlign: 'center'}}>No product data available.</div>;

  // Flatten the category for display
  const renderList = (arr) => {
    if (arr && typeof arr === 'object' && !Array.isArray(arr)) {
      return arr.petType || "-";
    }
    if (!Array.isArray(arr)) return arr || "-";
    return arr.join(" | ") || "-";
  };
  const renderCategory = (cat) => {
    if (Array.isArray(cat)) return cat.join(", ");
    if (typeof cat === 'object' && cat !== null) {
        return cat.subCategory || cat.category || cat.name || "-";
    }
    return cat || "-";
  };

  // Ensure we get variants from any potential data key
  const allVariants = data.variants || data.productVariants || [];

  // Calculate total stock across all variants
  const totalStock = allVariants.reduce((sum, v) => sum + (Number(v.stockQty) || 0), 0);

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
            <div className={styles.infoGridItem}></div>
          </div>
          <div className={styles.infoGridRow}>
            <div className={styles.infoGridItem}>
              <label>Pet Type</label>
              <strong>{renderList(data.productPetType)}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>HSN Code</label>
              <strong>{data.hsnCode || "-"}</strong>
            </div>
            <div className={styles.infoGridItem}>
              <label>GST(%)</label>
              <strong>{data.gst || "-"}%</strong>
            </div>
            <div className={styles.infoGridItem}></div>
            <div className={styles.infoGridItem}></div>
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
              <th>Min Stock</th>
              <th>Length</th>
              <th>Height</th>
              <th>Weight/Unit</th>
              <th>Radius</th>
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
            {(allVariants || []).map((v) => {
              const dimensions = v.variantType?.dimensions || "";
              // Dimensions format typically HxWxL
              const dimParts = dimensions.split('x');
              const h = dimParts[0] || "-";
              const w = dimParts[1] || "-";
              const l = dimParts[2] || "-";

              return (
                <tr key={v.variantId}>
                  <td>{v.SKU || v.variantId || "-"}</td>
                  <td>{v.barcode || v.eanUpcNumber || "-"}</td>
                  <td>{v.packType || "-"}</td>
                  <td>{v.variantType?.size || v.size || "-"}</td>
                  <td style={{fontWeight: 600, color: '#ff4d4f'}}>{v.minStockAlert || "0"}</td>
                  <td>{l}</td>
                  <td>{h}</td>
                  <td>
                    {v.variantType?.size || "-"}
                  </td>
                  <td>{v.variantType?.radius || "-"}</td>
                  <td>{v.numberOfPieces || v.variantType?.packCount || "-"}</td>
                  <td>{v.mrp || "-"}</td>
                  <td>{v.sellingPrice || "-"}</td>
                  <td>{v.stockQty ?? 0}</td> 
                  <td>{v.soldQty ?? 0}</td> 
                  <td>{v.damagedQty ?? 0}</td>  
                  <td>{v.openingStock ?? 0}</td> 
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
                    {data.productsBillItems.map((bill, idx) => (
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
            </>
          )}

          {/* Stock History Table */}
          {data.stockHistory?.length > 0 && (
            <>
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
                    {data.stockHistory.map((stock, idx) => (
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
