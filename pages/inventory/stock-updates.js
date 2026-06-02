import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/inventory/stockUpdates.module.css";
import dashboardStyles from "../../styles/dashboard/dashboard.module.css";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import EmptyState from "../../components/utilities/EmptyState";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { useRouter } from "next/router";
import StockUpdateManager from "../../components/inventory/stock-update-manager";
import PurchaseOrderManager from "../../components/purchase-bill/purchase-order-manager";

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const StockUpdatesPage = () => {
  const router = useRouter();
  const { jwtToken, userInfo, _hasHydrated: isHydrated } = useStore();
  const { branches, branchId: defaultBranchId, setSelectedBranchId } = useDashboardData({ skipReviews: true });
  const currentBranchId = router.query.branchId || "";
  const [stockUpdates, setStockUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [managerMode, setManagerMode] = useState("Add");
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [triggerNewTab, setTriggerNewTab] = useState(0);
  const [activeToggle, setActiveToggle] = useState("Update Stock");

  useEffect(() => {
    if (!router.isReady) return;
    if (!currentBranchId && branches && branches.length > 0) {
      const targetId = defaultBranchId || branches[0].id;
      router.replace({
        pathname: router.pathname,
        query: { ...router.query, branchId: targetId }
      }, undefined, { shallow: true });
    } else if (currentBranchId) {
      setSelectedBranchId(currentBranchId);
    }
  }, [router.isReady, currentBranchId, branches, defaultBranchId, setSelectedBranchId]);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (jwtToken && currentBranchId) {
      fetchStockUpdates();
    } else if (isHydrated && !jwtToken) {
      setLoading(false);
    }
  }, [jwtToken, currentBranchId, isHydrated]);

  const fetchStockUpdates = async () => {
    setLoading(true);
    try {
      const data = await productService.getStockUpdates(jwtToken, currentBranchId);
      setStockUpdates(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error("API ERROR:", error);
      toast.error("Failed to fetch stock updates");
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (e) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, branchId: e.target.value }
    }, undefined, { shallow: true });
  };

  const customLeft = (
    <div className={dashboardStyles.branchSwitcherContainer}>
      <select 
        className={dashboardStyles.branchSwitcher}
        value={currentBranchId}
        onChange={handleBranchChange}
      >
        {branches?.length > 1 && <option value="">All Firms</option>}
        {branches?.map(b => (
          <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
        ))}
      </select>
    </div>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };

  const filteredUpdates = stockUpdates.filter(update => {
    const itemName = update.itemName || update.product?.productName || "";
    const pCode = update.productCode || update.product?.ProductCode || "";
    return itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           pCode.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredUpdates.length / rowsPerPage);
  const paginatedUpdates = filteredUpdates.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <DashboardLayout
      customTopbarLeft={customLeft}
      customTopbarRight={(
        <div className={styles.topbarRight}>
            <button 
                className={styles.updateStockBtn}
                onClick={() => {
                    setManagerMode("Add");
                    setSelectedStockId(null);
                    setShowUpdateForm(true);
                    setTriggerNewTab(prev => prev + 1);
                }}
            >
                <span>+</span> Update Stock
            </button>
        </div>
      )}
    >
      <div className={styles.container}>
        <div className={styles.topSection}>
            <div className={styles.searchContainer}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}><IconSearch /></span>
                    <input 
                        type="text" 
                        placeholder="Search products here" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
             <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Loading stock updates...</p>
            </div>
          ) : filteredUpdates.length === 0 ? (
            <div className={styles.emptyContainer}>
                <EmptyState 
                    title="No Stock Updates Found"
                    description="You haven't made any stock adjustments for this branch yet."
                />
            </div>
          ) : (
            <table className={styles.table}>
              <colgroup>
                <col className={styles.dateCol} />
                <col />
                <col className={styles.unitCol} />
                <col className={styles.qtyCol} />
                <col className={styles.totalValCol} />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan="2">UP-DATED DATE</th>
                  <th rowSpan="2">PRODUCT NAME</th>
                  <th colSpan="2" className={styles.variantHeader}>VARIANT</th>
                  <th rowSpan="2">REASON</th>
                  <th rowSpan="2" className={styles.rightAlign}>TOTAL VALUE (₹)</th>
                </tr>
                <tr className={styles.subHeaderRow}>
                  <th>UNIT</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUpdates.map((update) => {
                  const val = parseFloat(update.totalValue || 0);
                  const isNegative = update.remove > 0 || (update.reason?.toLowerCase().includes('damaged') || update.reason?.toLowerCase().includes('onhold'));
                  
                  let rawVt = update.variantType || update.variant?.variantType || update.product?.variantType || update.product?.variants?.[0]?.variantType;
                  if (typeof rawVt === 'string') {
                      try { rawVt = JSON.parse(rawVt); } catch(e) { rawVt = {}; }
                  }
                  const vt = rawVt || {};
                  
                  let size = vt.size && vt.size !== "1" && vt.size !== "undefined" ? vt.size : "";
                  if (typeof size === 'string' && size.trim().startsWith('{')) {
                      try {
                          const dim = JSON.parse(size);
                          const parts = [];
                          if (dim.height) parts.push(`${dim.height}${dim.heightUnit || 'mm'}H`);
                          if (dim.width) parts.push(`${dim.width}${dim.widthUnit || 'mm'}W`);
                          if (dim.length) parts.push(`${dim.length}${dim.lengthUnit || 'mm'}L`);
                          if (dim.radius) parts.push(`R:${dim.radius}${dim.radiusUnit || 'mm'}`);
                          size = parts.join(" x ");
                      } catch(e){}
                  }
                  
                  let unit = size;
                  if (!unit || unit === " ") {
                      // fallback to extracting from string if available
                      unit = update.variantMeasure || update.unit || "STND";
                      if (unit === "STND" && typeof update.variantType === 'string') {
                          unit = update.variantType; // Just show the raw string if we failed to parse
                      }
                  }
                  const quantity = update.qty || update.quantity || update.add || update.remove || 0;

                  return (
                    <tr key={update.stockUpdateId} onClick={() => {
                        setSelectedStockId(update.stockUpdateId);
                        setManagerMode("View");
                        setShowUpdateForm(true);
                    }} className={styles.clickableRow}>
                      <td>{formatDate(update.createdDate)}</td>
                      <td>{update.itemName || update.product?.productName}</td>
                      <td>{unit}</td>
                      <td>{quantity}</td>
                      <td>{update.reason || "--"}</td>
                      <td className={`${styles.rightAlign} ${isNegative ? styles.totalValueRed : styles.totalValueGreen}`}>
                        {isNegative ? `- ₹ ${Math.abs(val).toFixed(2)}` : `₹ ${val.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.pagination}>
          <div className={styles.paginationLeft}>
            <span>Rows per Page</span>
            <select 
              className={styles.rowsSelect}
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>{Math.min((currentPage - 1) * rowsPerPage + 1, filteredUpdates.length)} - {Math.min(currentPage * rowsPerPage, filteredUpdates.length)} of {filteredUpdates.length} Items</span>
          </div>
          <div className={styles.paginationRight}>
              {currentPage > 1 && (
                <button 
                  className={styles.pageBtn} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
              )}
              {currentPage < totalPages && (
                <button 
                  className={`${styles.pageBtn} ${styles.pageBtnActive}`}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              )}
          </div>
        </div>
      </div>

      {showUpdateForm && (
        <StockUpdateManager 
          onClose={() => {
            setShowUpdateForm(false);
            fetchStockUpdates();
          }}
          mode={managerMode}
          initialId={selectedStockId}
          triggerNewTab={triggerNewTab}
        />
      )}
    </DashboardLayout>
  );
};

export default StockUpdatesPage;
