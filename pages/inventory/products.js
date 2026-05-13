import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/inventory/products.module.css";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import ProductFormManager from "../../components/inventory/product-form-manager";
import ConfirmationModal from "../../components/inventory/confirmation-modal";
import { IconSearch } from "../../components/dashboard/DashboardLayout"; 
import { toast } from "sonner";
import EmptyState from "../../components/utilities/EmptyState";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { useRouter } from "next/router";

/* ── Inline Icons ────────────────────────────────────────── */
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ProductsPage = () => {
  const router = useRouter();
  const { userInfo, jwtToken, _hasHydrated: isHydrated } = useStore();
  const { branches, branchId } = useDashboardData({ skipReviews: true });
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, expired: 0, damaged: 0, saleReturn: 0 });
  const [productType, setProductType] = useState("Retail");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [formMode, setFormMode] = useState("Add");
  const [editProductData, setEditProductData] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (router.isReady && router.query.action === 'add') {
      setIsAddingProduct(true);
      setFormMode("Add");
      // Clear query param
      const { action, ...restQuery } = router.query;
      router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.action]);

  useEffect(() => {
    if (router.isReady) {
      fetchStats();
      fetchProducts();
    }
  }, [router.isReady, branchId, jwtToken, productType, debouncedSearchTerm, currentPage, rowsPerPage]);

  const fetchStats = async () => {
    try {
      const bid = branchId || 91;
      const data = await productService.getDamagedExpiredReports(jwtToken, bid);
      if (data && data.counts) {
        setStats({
          total: data.counts.totalBranchProducts || 0,
          expired: data.counts.expiredProducts || 0,
          damaged: data.counts.damagedBillItems || 0,
          saleReturn: data.counts.damagedReturns || 0
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const bid = branchId || 91;
      const result = await productService.getProducts(
        jwtToken, 
        bid, 
        productType, 
        debouncedSearchTerm,
        currentPage,
        rowsPerPage
      );
      setProducts(result.products);
      setTotalProducts(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allCurrentIds = products.map(p => p.productId);
    const areAllCurrentSelected = allCurrentIds.every(id => selectedIds.includes(id));
    
    if (areAllCurrentSelected) {
      setSelectedIds(prev => prev.filter(id => !allCurrentIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allCurrentIds])]);
    }
  };

  const handlePageChange = (direction) => {
    if (direction === "next" && (currentPage * rowsPerPage < totalProducts)) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]);
  };

  const getUnitDisplay = (v) => {
    if (!v) return "-";

    const vt = (v.variantType && typeof v.variantType === 'object') ? v.variantType : {};
    
    // 1. Get main measure
    const rawStrength = v.strength || "";
    const strength = (rawStrength && rawStrength.toUpperCase() !== "N/A" && rawStrength !== "undefined") ? rawStrength : "";
    
    let size = (vt.size && vt.size !== "1" && vt.size !== 1 && vt.size !== "undefined") ? vt.size : 
               (v.size && v.size !== "1" && v.size !== 1 && v.size !== "undefined" ? v.size : "");
    
    if (typeof size === 'string' && size.trim().startsWith('{')) {
      try {
        const dim = JSON.parse(size);
        const parts = [];
        if (dim.height) parts.push(`H:${dim.height}${dim.heightUnit || 'mm'}`);
        if (dim.width) parts.push(`W:${dim.width}${dim.widthUnit || 'mm'}`);
        if (dim.length) parts.push(`L:${dim.length}${dim.lengthUnit || 'mm'}`);
        if (dim.radius) parts.push(`R:${dim.radius}${dim.radiusUnit || 'mm'}`);
        size = parts.join(" x ");
      } catch (e) {
        console.warn("Failed to parse dimension JSON for display", e);
      }
    }

    const flavor = vt.flavor || "";
    let detailInfo = (strength || size || "").toString().trim();
    if (flavor) detailInfo = `${detailInfo} ${flavor}`.trim();
    
    // 2. Get packaging info
    const count = v.numberOfPieces || vt.packCount || "";
    const type = vt.packType || vt.type || "";
    const packagingInfo = `${count} ${type}`.trim();
    
    if (packagingInfo && detailInfo) {
        return `${packagingInfo} (${detailInfo})`;
    }
    
    return (packagingInfo || detailInfo || "-");
  };

  const isSizeBasedVariant = (v) => {
    if (!v) return false;
    const vt = (v.variantType && typeof v.variantType === 'object') ? v.variantType : {};
    const packType = vt.packType || v.packType || "";
    return ["PIECES (Pcs)", "PAIRS (Prs)"].includes(packType);
  };

  const handleDelete = () => {
    const selectedProducts = products.filter(p => selectedIds.includes(p.productId));
    const hasRestrictedProducts = selectedProducts.some(p => p.hasOrders);

    if (hasRestrictedProducts) {
      toast.error("Some selected products have active orders and cannot be deleted.");
      return;
    }

    if (selectedIds.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const executeDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          const res = await productService.deleteProduct(jwtToken, id);
          if (res?.status === 200 || res?.data?.status === "success" || res?.statusText === "OK") {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Failed to delete product ${id}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} product(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} product(s)`);
      }

      setSelectedIds([]);
      fetchProducts();
      fetchStats();
    } catch (e) {
      console.error("Bulk delete error:", e);
      toast.error("An error occurred during deletion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      customTopbarRight={(
        <div className={styles.addBtnWrapper}>
          <button 
            className={styles.addBtn} 
            onClick={() => setShowAddDropdown(!showAddDropdown)}
          >
            <IconPlus /> Add Product <IconChevronDown />
          </button>
          {showAddDropdown && (
            <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dropdownItem} onClick={() => { setFormMode("Add"); setIsAddingProduct(true); setShowAddDropdown(false); }}>
                <IconPlus /> Add Product
              </div>
              <hr style={{margin: 0, border: 'none', borderTop: '1px solid #eee'}} />
              <div className={styles.dropdownItem}>
                <IconPlus /> Add Bulk Product
              </div>
            </div>
          )}
        </div>
      )}
    >
      <div className={styles.container}>
        {/* Multi-tasking Manager Overlay */}
        {isAddingProduct && (
          <ProductFormManager 
            mode={formMode} 
            initialData={formMode === "Add" ? null : editProductData}
            onClose={() => {
              setIsAddingProduct(false);
              fetchProducts();
              if (router.query.returnUrl) {
                router.push(router.query.returnUrl);
              }
            }} 
          />
        )}

        {/* Fixed Top Section */}
        <div className={styles.topSection}>
          {/* Status & Tabs Row */}
          <div className={styles.statusTabsRow}>
            <div className={styles.statusGroup}>
              <span className={styles.statusLabel}>Overall Status :</span>
              <div className={styles.statusBadge}>TOTAL Products: {String(stats.total).padStart(2, '0')}</div>
              <div className={styles.statusBadge}>Expired Products : {stats.expired}</div>
              <div className={styles.statusBadge}>Damaged Products : {stats.damaged}</div>
              <div className={styles.statusBadge}>Sale Return : {stats.saleReturn}</div>
            </div>

            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${productType === "Retail" ? styles.tabActive : ""}`}
                onClick={() => { setProductType("Retail"); setCurrentPage(1); }}
              >
                Retail Product
              </button>
              <button 
                className={`${styles.tab} ${productType === "Medical" ? styles.tabActive : ""}`}
                onClick={() => { setProductType("Medical"); setCurrentPage(1); }}
              >
                Medical Products
              </button>
            </div>
          </div>

          {/* Search Row */}
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input 
                type="text" 
                placeholder="Search products here" 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px 0', flexDirection: 'column', gap: '20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #f5790c', 
              borderTopColor: 'transparent', 
              borderRadius: '50%', 
              animation: 'spin 0.8s linear infinite' 
            }} />
            <p style={{ color: '#666', fontSize: '14px' }}>Loading products...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : products.length === 0 ? (
          <EmptyState 
            buttonText="Add Product"
            onAddClick={() => { setFormMode("Add"); setIsAddingProduct(true); }}
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{width: 40}}>
                    <input 
                      type="checkbox" 
                      onChange={selectAll} 
                      checked={products.length > 0 && products.every(p => selectedIds.includes(p.productId))} 
                    />
                  </th>
                  <th rowSpan="2">Product Code</th>
                  <th rowSpan="2">Product Name</th>
                  <th rowSpan="2">Brand</th>
                  <th rowSpan="2">Category Type</th>
                  <th colSpan="5" className={styles.variantsHeader}>VARIANTS</th>
                </tr>
                <tr className={styles.subHeaderRow}>
                  <th>Unit</th>
                  <th>Quantity</th>
                  <th>Open Stock Qty</th>
                  <th>Hold Qty</th>
                  <th>MRP</th>
                </tr>
              </thead>
              <tbody>
                {(searchTerm ? products.filter(p => 
                    (p.productName || p.name || "")?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (p.ProductCode || p.productCode || "")?.toLowerCase().includes(searchTerm.toLowerCase())
                  ) : products).length === 0 ? (
                  <tr><td colSpan="11" style={{textAlign: 'center', padding: 40}}>No products matching search</td></tr>
                ) : (
                  (searchTerm ? products.filter(p => 
                    (p.productName || p.name || "")?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (p.ProductCode || p.productCode || "")?.toLowerCase().includes(searchTerm.toLowerCase())
                  ) : products).map((product) => {
                    const isExpanded = expandedRows.includes(product.productId);
                    const firstVariant = product.variants?.[0] || {};
                    const otherVariants = product.variants?.slice(1) || [];
                    const hasMultipleVariants = product.variants?.length > 1;
  
                    const productId = product.productId || product.id || product.ID;
                    return (
                      <React.Fragment key={productId}>
                        <tr>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(productId)}
                              onChange={() => toggleSelection(productId)}
                            />
                          </td>
                          <td>{product.ProductCode || product.productCode || "-"}</td>
                          <td>{product.productName || product.name || "-"}</td>
                          <td>{product.brand?.name || product.brand || "-"}</td>
                          <td>
                            {Array.isArray(product.categoryId) 
                              ? product.categoryId.map(c => typeof c === 'object' ? (c.category || c.name || JSON.stringify(c)) : c).join(", ") 
                              : (typeof product.categoryId === 'object' ? (product.categoryId.category || product.categoryId.name) : product.categoryId) || "-"}
                          </td>
                          <td>{getUnitDisplay(firstVariant)}</td>
                          <td>{firstVariant.stockUpdates?.totalQuantity ?? firstVariant.currentQty ?? firstVariant.numberOfPieces ?? "-"}</td>
                          <td>{firstVariant.stockUpdates?.openStockQuantity ?? "0"}</td>
                          <td>{firstVariant.stockUpdates?.onHoldQuantity ?? "0"}</td>
                          <td 
                            style={{fontWeight: 600, cursor: hasMultipleVariants ? 'pointer' : 'default'}}
                            onClick={() => hasMultipleVariants && toggleRowExpansion(productId)}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span>₹{firstVariant.mrp || "-"}</span>
                              {hasMultipleVariants && (
                                <div style={{ marginTop: -4 }}>
                                  {expandedRows.includes(productId) ? <IconChevronUp /> : <IconChevronDown />}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedRows.includes(productId) && otherVariants.map((v) => (
                          <tr key={v.variantId} className={styles.variantRow}>
                            <td colSpan="5"></td>
                            <td>{getUnitDisplay(v)}</td>
                            <td>{v.stockUpdates?.totalQuantity ?? v.currentQty ?? v.numberOfPieces ?? v.variantMeasure ?? "-"}</td>
                            <td>{v.stockUpdates?.openStockQuantity ?? "0"}</td>
                            <td>{v.stockUpdates?.onHoldQuantity ?? "0"}</td>
                            <td style={{fontWeight: 600}}>₹{v.mrp}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer/Pagination */}
        {products.length > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationLeft}>
                <div className={styles.rowsPerPage}>
                  Rows per Page
                  <select 
                    value={rowsPerPage} 
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  >
                    {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span>
                    {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalProducts)} of {totalProducts} Items
                  </span>
                </div>
              </div>
    
              <div className={styles.paginationCenter}>
                {selectedIds.length > 0 && (
                  <div className={styles.bulkActionsInline}>
                    <span 
                      className={styles.bulkCount} 
                      onClick={() => setSelectedIds([])}
                      style={{cursor: 'pointer'}}
                      title="Unselect All"
                    >
                      ✕ {selectedIds.length} Items Selected
                    </span>
                    <div className={styles.bulkDivider} />
                    <div 
                      className={styles.actionItem} 
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const fullProducts = [];
                          for (const id of selectedIds) {
                            const res = await productService.getProductById(jwtToken, id);
                            if (res?.data?.data) {
                              fullProducts.push(res.data.data);
                            } else if (res?.data) {
                              fullProducts.push(res.data);
                            }
                          }
                          setEditProductData(fullProducts);
                          setFormMode("View");
                          setIsAddingProduct(true);
                        } catch (e) {
                          console.error("Error fetching full product details:", e);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <IconEye /> View
                    </div>
                    <div 
                      className={styles.actionItem} 
                      onClick={() => { 
                        const productsToEdit = products.filter(p => selectedIds.includes(p.productId));
                        setEditProductData(productsToEdit);
                        setFormMode("Edit"); 
                        setIsAddingProduct(true); 
                      }}
                    >
                      <IconEdit /> Edit
                    </div>
                    <div className={styles.actionItem} onClick={handleDelete}>
                      <IconTrash /> Delete
                    </div>
                  </div>
                )}
              </div>
    
              <div className={styles.paginationRight}>
                <div style={{display: 'flex', gap: 12}}>
                    {currentPage > 1 && (
                      <button 
                        className={styles.pageBtn} 
                        onClick={() => handlePageChange("prev")}
                      >
                        Previous
                      </button>
                    )}
                    {currentPage * rowsPerPage < totalProducts && (
                      <button 
                        className={`${styles.pageBtn} ${styles.nextBtn}`} 
                        onClick={() => handlePageChange("next")}
                      >
                        Next
                      </button>
                    )}
                </div>
              </div>
            </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal 
          isOpen={showDeleteConfirm}
          title="Delete Products?"
          message={`Are you sure you want to delete ${selectedIds.length} selected product(s)? This action is permanent and cannot be undone.`}
          onConfirm={executeDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

      </div>
    </DashboardLayout>
  );
};

export default ProductsPage;
