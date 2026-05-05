import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/inventory/stockUpdates.module.css";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import EmptyState from "../../components/utilities/EmptyState";
import StockUpdateManager from "../../components/inventory/stock-update-manager";

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const StockUpdatesPage = () => {
  const { jwtToken, userInfo } = useStore();
  const [stockUpdates, setStockUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [managerMode, setManagerMode] = useState("Add");
  const [selectedStockId, setSelectedStockId] = useState(null);

  const branchId = userInfo?.branchId || 91;

  useEffect(() => {
    if (jwtToken && branchId) {
      fetchStockUpdates();
    }
  }, [jwtToken, branchId]);

  const fetchStockUpdates = async () => {
    setLoading(true);
    try {
      const data = await productService.getStockUpdates(jwtToken, branchId);
      setStockUpdates(data);
    } catch (error) {
      toast.error("Failed to fetch stock updates");
    } finally {
      setLoading(false);
    }
  };

  const filteredUpdates = stockUpdates.filter(u => 
    u.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.product?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.stockUpdateId?.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredUpdates.length / rowsPerPage);
  const currentData = filteredUpdates.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };

  return (
    <DashboardLayout
      customTopbarLeft={(
        <select className={styles.branchSelect} style={{
          padding: '8px 16px', border: '1px solid #eee', borderRadius: '8px', 
          background: '#f1f1f1', minWidth: '240px', fontSize: '14px', outline: 'none'
        }}>
          <option>Select Branch</option>
          <option selected>Main Branch</option>
        </select>
      )}
      customTopbarRight={(
        <button className={styles.updateStockBtn} onClick={() => { 
          setManagerMode("Add"); 
          setSelectedStockId(null);
          setShowUpdateForm(true); 
        }}>
          <IconPlus /> Update Stock
        </button>
      )}
    >
      <div className={styles.container}>
        {showUpdateForm && (
            <StockUpdateManager 
                mode={managerMode}
                stockId={selectedStockId}
                onClose={() => {
                    setShowUpdateForm(false);
                    fetchStockUpdates();
                }} 
            />
        )}

        <div className={styles.topSection}>
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
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <tbody>
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>Loading data...</td></tr>
              </tbody>
            </table>
          </div>
        ) : stockUpdates.length === 0 ? (
          <EmptyState 
            buttonText="Update Stock"
            onAddClick={() => { setManagerMode("Add"); setSelectedStockId(null); setShowUpdateForm(true); }}
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th rowSpan="2">UP-DATED DATE</th>
                  <th rowSpan="2">PRODUCT NAME</th>
                  <th colSpan="2" style={{ textAlign: 'center' }}>VARIANT</th>
                  <th rowSpan="2">TOTAL VALUE ( ₹ )</th>
                </tr>
                <tr>
                  <th className={styles.subTh}>UNIT</th>
                  <th className={styles.subTh}>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>No stock updates matching search</td></tr>
                ) : (
                  currentData.map((update) => {
                    const isAdd = (update.add || 0) > 0;
                    const value = update.totalValue || (update.add ? update.add * 100 : -(update.remove * 100));
                    
                    return (
                      <tr 
                        key={update.stockUpdateId} 
                        onClick={() => {
                          setSelectedStockId(update.stockUpdateId);
                          setManagerMode("View");
                          setShowUpdateForm(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{formatDate(update.createdDate)}</td>
                        <td style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                          {update.product?.productName || "PRODUCT #" + update.productId}
                        </td>
                        <td>
                          {(() => {
                            const v = update.variant;
                            if (!v) return "-";
                            const vt = v.variantType || {};
                            const strength = v.strength || vt.mg || "";
                            const size = (vt.size && vt.size !== "1") ? vt.size : (v.size && v.size !== "1" ? v.size : "");
                            const flavor = vt.flavor || "";
                            const detail = `${strength || size} ${flavor}`.trim();
                            
                            const count = v.numberOfPieces || vt.packCount || "";
                            const type = vt.packType || vt.type || "";
                            const pack = `${count} ${type}`.trim();
                            
                            if (pack && detail) return `${pack} (${detail})`;
                            return pack || detail || v.variantMeasure || "-";
                          })()}
                        </td>
                        <td>{update.updatedQty}</td>
                        <td className={isAdd ? styles.totalValueGreen : styles.totalValueRed}>
                          {isAdd ? "+ ₹ " : "- ₹ "}{Math.abs(parseFloat(value)).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {stockUpdates.length > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationLeft}>
                Rows per Page: 
                <select 
                  className={styles.rowsSelect}
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>{((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredUpdates.length)} of {filteredUpdates.length} Items</span>
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
                {totalPages > 0 && (
                  <button 
                    className={`${styles.pageBtn} ${styles.pageBtnActive}`}
                    onClick={() => {}}
                  >
                    {currentPage}
                  </button>
                )}
                {currentPage < totalPages && (
                  <button 
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StockUpdatesPage;
