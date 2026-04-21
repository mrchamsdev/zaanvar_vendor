import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/inventory/inventory.module.css";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import ProductFormManager from "../../components/inventory/ProductFormManager";
import { IconSearch } from "../../components/dashboard/DashboardLayout"; // Reuse existing icons if exported, or re-define

/* ── Inline Icons ────────────────────────────────────────── */
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
  const { jwtToken, userInfo } = useStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, expired: 10, damaged: 10, saleReturn: 10 });
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

  // Dynamic branchId from sub-vendor info
  const branchId = userInfo?.branchId;

  useEffect(() => {
    if (branchId && jwtToken) {
      fetchStats();
    }
  }, [branchId, jwtToken]);

  useEffect(() => {
    if (branchId && jwtToken) {
      fetchProducts();
    }
  }, [productType, searchTerm, currentPage, rowsPerPage, branchId, jwtToken]);

  const fetchStats = async () => {
    try {
      const data = await productService.getDamagedExpiredReports(jwtToken, branchId);
      if (data && data.counts) {
        setStats({
          total: data.totalProducts || 0,
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
      const result = await productService.getProducts(
        jwtToken, 
        branchId, 
        productType, 
        searchTerm
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
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.productId));
    }
  };

  const handlePageChange = (direction) => {
    if (direction === "next" && (currentPage * rowsPerPage < totalProducts)) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <select className={styles.branchSelect}>
            <option>Select Branch</option>
            <option selected>Main Branch</option>
          </select>

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
        </div>

        {/* Multi-tasking Manager Overlay */}
        {isAddingProduct && (
          <ProductFormManager 
            mode={formMode} 
            initialData={formMode === "Add" ? null : editProductData}
            onClose={() => setIsAddingProduct(false)} 
          />
        )}

        {/* Overall Status Section */}
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Overall Status :</span>
          <div className={styles.statusBadge}>TOTAL Products: {String(stats.total).padStart(2, '0')}</div>
          <div className={styles.statusBadge}>Expired Products : {stats.expired}</div>
          <div className={styles.statusBadge}>Damaged Products : {stats.damaged}</div>
          <div className={styles.statusBadge}>Sale Return : {stats.saleReturn}</div>
        </div>

        {/* Tabs and Search Bar */}
        <div className={styles.tabsSearchRow}>
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

          <div className={styles.searchBox}>
             {/* Using local SVG because IconSearch export might fail if not careful */}
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

        {/* Product Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{width: 40}}>
                  <input 
                    type="checkbox" 
                    onChange={selectAll} 
                    checked={products.length > 0 && selectedIds.length === products.length} 
                  />
                </th>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Category Type</th>
                {/* Variant specific columns start here */}
                <th>Unit</th>
                <th>Quantity</th>
                <th>Open Stock Qty</th>
                <th>Hold Qty</th>
                <th>MRP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{textAlign: 'center', padding: 40}}>Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="10" style={{textAlign: 'center', padding: 40}}>No products found</td></tr>
              ) : (
                products.map((product) => (
                  <React.Fragment key={product.productId}>
                    <tr>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(product.productId)}
                          onChange={() => toggleSelection(product.productId)}
                        />
                      </td>
                      <td>{product.ProductCode || "-"}</td>
                      <td>{product.productName}</td>
                      <td>{product.brand?.name || product.brand || "-"}</td>
                      <td>
                        {Array.isArray(product.categoryId) 
                          ? product.categoryId.map(c => typeof c === 'object' ? c.name : c).join(", ") 
                          : (typeof product.categoryId === 'object' ? product.categoryId.name : product.categoryId) || "-"}
                      </td>
                      {/* Main product might not show variant data in main row if variants exist, 
                          but Image 3 shows some data. If variants exist, we'll show them below. */}
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                    {/* Render Variants */}
                    {product.variants && product.variants.map((v) => (
                      <tr key={v.variantId} className={styles.variantRow}>
                        <td colSpan="5"></td>
                        <td>{v.variantMeasure} {typeof v.variantType === 'object' ? Object.values(v.variantType)[0] : v.sizeType?.[0] || ""}</td>
                        <td>{v.numberOfPieces || v.variantMeasure}</td>
                        <td>00</td> {/* Hardcoded as per image */}
                        <td>00</td> {/* Hardcoded as per image */}
                        <td style={{fontWeight: 600}}>₹{v.mrp} <IconChevronDown /></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer/Pagination */}
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
                  onClick={() => {
                    const productsToView = products.filter(p => selectedIds.includes(p.productId));
                    setEditProductData(productsToView);
                    setFormMode("View");
                    setIsAddingProduct(true);
                  }}
                >
                  <IconEye /> View
                </div>
                {/* Only show delete if NO selected item has hasOrders: true */}
                {!products.filter(p => selectedIds.includes(p.productId)).some(p => p.hasOrders) && (
                  <div className={styles.actionItem}><IconTrash /> Delete</div>
                )}
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

      </div>
    </DashboardLayout>
  );
};

export default ProductsPage;
