import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/inventory/stockUpdates.module.css";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import EmptyState from "../../components/utilities/EmptyState";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { useRouter } from "next/router";
import StockUpdateManager from "../../components/inventory/stock-update-manager";

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const StockUpdatesPage = () => {
  const router = useRouter();
  const { jwtToken, userInfo, _hasHydrated: isHydrated } = useStore();
  const { branches, branchId } = useDashboardData({ skipReviews: true });
  const [stockUpdates, setStockUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [managerMode, setManagerMode] = useState("Add");
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [activeToggle, setActiveToggle] = useState("Update Stock");

  useEffect(() => {
    if (!isHydrated) return;
    
    if (jwtToken && branchId) {
      fetchStockUpdates();
    } else if (isHydrated && !jwtToken) {
      setLoading(false);
    }
  }, [jwtToken, branchId, isHydrated]);

  const fetchStockUpdates = async () => {
    setLoading(true);
    try {
      const data = await productService.getStockUpdates(jwtToken, branchId);
      setStockUpdates(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error("API ERROR:", error);
      toast.error("Failed to fetch stock updates");
    } finally {
      setLoading(false);
    }
  };

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
      customTopbarRight={(
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
                onClick={() => {
                    setManagerMode("Add");
                    setSelectedStockId(null);
                    setShowUpdateForm(true);
                }}
                style={{
                    background: '#E9315D',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <span style={{fontSize: '18px'}}>+</span> Update Stock
            </button>
            <button 
                style={{
                    background: '#fff',
                    color: '#333',
                    border: '1px solid #eee',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <span style={{fontSize: '18px'}}>+</span> Add More
            </button>
        </div>
      )}
    >
      <div className={styles.container}>
        <div className={styles.topSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}><IconSearch /></span>
                    <input 
                        type="text" 
                        placeholder="Search products here" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ 
                    display: 'flex', 
                    background: '#f1f1f1', 
                    padding: '4px', 
                    borderRadius: '8px',
                    gap: '4px'
                }}>
                    <button 
                        onClick={() => setActiveToggle("Update Stock")}
                        style={{
                            padding: '8px 24px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: activeToggle === "Update Stock" ? '#fff' : 'transparent',
                            color: activeToggle === "Update Stock" ? '#E9315D' : '#666',
                            boxShadow: activeToggle === "Update Stock" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Update Stock
                    </button>
                    <button 
                        onClick={() => setActiveToggle("Open Stock")}
                        style={{
                            padding: '8px 24px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: activeToggle === "Open Stock" ? '#fff' : 'transparent',
                            color: activeToggle === "Open Stock" ? '#E9315D' : '#666',
                            boxShadow: activeToggle === "Open Stock" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Open Stock
                    </button>
                </div>
            </div>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '20px' }}>
                <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '3px solid #f5790c', 
                    borderTopColor: 'transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 0.8s linear infinite' 
                }} />
                <p style={{ color: '#666', fontSize: '14px' }}>Loading stock updates...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredUpdates.length === 0 ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState 
                    title="No Stock Updates Found"
                    description="You haven't made any stock adjustments for this branch yet."
                />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th rowSpan="2">UP-DATED DATE</th>
                  <th rowSpan="2">SUPPLIER NAME</th>
                  <th rowSpan="2">PRODUCT NAME</th>
                  <th colSpan="2" className={styles.variantHeader}>VARIANT</th>
                  <th rowSpan="2" style={{ textAlign: 'right' }}>TOTAL VALUE (₹)</th>
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
                  
                  const vt = update.variantType || update.product?.variantType || {};
                  const unit = (vt.size || vt.flavor) ? `${vt.size || ""} ${vt.flavor || ""}`.trim() : (vt.packCount || vt.packType ? `${vt.packCount || ""} ${vt.packType || ""}`.trim() : (update.variantMeasure || update.unit || "STND"));
                  const quantity = update.qty || update.quantity || update.add || update.remove || 0;

                  return (
                    <tr key={update.stockUpdateId} onClick={() => {
                        setSelectedStockId(update.stockUpdateId);
                        setManagerMode("View");
                        setShowUpdateForm(true);
                    }} style={{ cursor: 'pointer' }}>
                      <td>{formatDate(update.createdDate)}</td>
                      <td>{update.supplierName || "APPOLO"}</td>
                      <td>{update.itemName || update.product?.productName}</td>
                      <td>{unit}</td>
                      <td>{quantity}</td>
                      <td style={{ textAlign: 'right' }} className={isNegative ? styles.totalValueRed : styles.totalValueGreen}>
                        {isNegative ? `- ₹ ${Math.abs(val).toLocaleString()}` : `₹ ${val.toLocaleString()}`}
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
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <button 
                className={styles.pageBtn}
                style={{ background: '#000', color: '#fff', border: 'none' }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
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
          stockId={selectedStockId}
        />
      )}
    </DashboardLayout>
  );
};

export default StockUpdatesPage;
