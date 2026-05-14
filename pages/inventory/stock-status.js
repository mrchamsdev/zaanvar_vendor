import React, { useState, useEffect } from "react"; // Force refresh
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/inventory/stock-status.module.css";
import useStore from "../../components/state/useStore";
import { productService } from "../../services/productService";
import { toast } from "sonner";
import EmptyState from "../../components/utilities/EmptyState";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { useRouter } from "next/router";

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconDownload = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const IconRefresh = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const IconAlert = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="12" cy="12" r="10" fill="#e74c3c" stroke="none" />
        <line x1="12" y1="8" x2="12" y2="12" stroke="#fff" />
        <line x1="12" y1="16" x2="12.01" y2="16" stroke="#fff" />
    </svg>
);

const TABS = [
  { id: "outOfStock", label: "Out of stock" },
  { id: "lowStock", label: "Low Quantity Stock" },
  { id: "expired", label: "Expired Stock" },
  { id: "shortExpiry", label: "Short Expiry Stock" },
  { id: "damaged", label: "Damaged" }
];

const StockStatusPage = () => {
  const router = useRouter();
  const { jwtToken, userInfo, _hasHydrated: isHydrated } = useStore();
  const { branches, branchId } = useDashboardData({ skipReviews: true });
  const [activeTab, setActiveTab] = useState("outOfStock");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    outOfStock: [],
    lowStock: [],
    expired: [],
    shortExpiry: [],
    damaged: []
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (!isHydrated) return;
    if (jwtToken && branchId) {
      fetchReports();
    } else if (isHydrated && !jwtToken) {
      setLoading(false);
    }
  }, [jwtToken, branchId, isHydrated]);

  useEffect(() => {
    if (router.isReady && router.query.tab) {
        setActiveTab(router.query.tab);
        // Clear query param to avoid sticking to the tab on manual refresh
        const { tab, ...restQuery } = router.query;
        router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.tab]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await productService.getStockReports(jwtToken, branchId);
      if (res) {
        setData({
          outOfStock: res.outOfStock || [],
          lowStock: res.lowStock || [],
          expired: res.expired || [],
          shortExpiry: res.shortExpiry || [],
          damaged: [
            ...(res.customerDamagedReturns || []).map(item => ({ 
                ...item, 
                type: 'customerReturn',
                displayQty: item.damagedQty || 0
            }))
          ]
        });
      }
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    if (id === undefined || id === null) {
        toast.error("Unable to restore: No ID found for this item");
        return;
    }

    try {
        setLoading(true);
        const res = await productService.restoreDamagedItem(jwtToken, id);
        const body = res?.data || res;
        
        if (body?.status === "success" || body?.status === 200 || res?.status === 200) {
            toast.success(body?.msg || "Item restored successfully");
            await fetchReports();
        } else {
            toast.error(body?.msg || body?.message || "Failed to restore item");
        }
    } catch (error) {
        toast.error(error?.response?.data?.msg || error?.message || "Error restoring item");
    } finally {
        setLoading(false);
    }
  };

  const handleMarkWaste = async (id, isExpired = false) => {
    if (!id) {
        toast.error(`Unable to mark as waste: No ${isExpired ? 'ID' : 'consumption ID'} found`);
        return;
    }

    try {
        setLoading(true);
        const res = await productService.markAsWaste(jwtToken, id, isExpired);
        const body = res?.data || res;
        
        if (body?.status === "success" || body?.status === 200 || res?.status === 200) {
            toast.success(body?.msg || "Item marked as waste");
            await fetchReports();
        } else {
            toast.error(body?.msg || body?.message || "Failed to mark as waste");
        }
    } catch (error) {
        toast.error(error?.response?.data?.msg || error?.message || "Error marking waste");
    } finally {
        setLoading(false);
    }
  };

  const handleRestock = (item) => {
    router.push({
      pathname: "/purchase-bill/purchase-orders",
      query: { 
        openAdd: "true",
        restockProductId: item.productId,
        restockVariantId: item.variantId,
        restockSupplierId: item.supplierId,
        restockBranchId: branchId,
        returnTab: activeTab
      }
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };

  const formatVariantSize = (size) => {
    if (!size) return "";
    if (typeof size === 'string' && size.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(size);
            const parts = [];
            if (parsed.height) parts.push(`${parsed.height}${parsed.heightUnit || 'mm'}H`);
            if (parsed.width) parts.push(`${parsed.width}${parsed.widthUnit || 'mm'}W`);
            if (parsed.length) parts.push(`${parsed.length}${parsed.lengthUnit || 'mm'}L`);
            if (parsed.radius) parts.push(`${parsed.radius}${parsed.radiusUnit || 'mm'}R`);
            if (parsed.weight) parts.push(`${parsed.weight}${parsed.weightUnit || 'g'}`);
            return parts.length > 0 ? parts.join(" x ") : size;
        } catch (e) {
            return size;
        }
    }
    return size;
  };

  const currentList = data[activeTab] || [];
  const filteredList = currentList.filter(item => {
      const name = item.productDetails?.productName || item.productName || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredList.length / rowsPerPage);
  const paginatedList = filteredList.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const renderTableHeaders = () => {
    switch (activeTab) {
      case "outOfStock":
        return (
          <tr>
            <th rowSpan="2">Product Name</th>
            <th rowSpan="2">Category</th>
            <th colSpan="2" style={{ textAlign: 'center' }}>Variant</th>
            <th rowSpan="2">Last Stock Date</th>
            <th rowSpan="2">Action</th>
          </tr>
        );
      case "lowStock":
        return (
          <tr>
            <th rowSpan="2">Product Name</th>
            <th colSpan="2" style={{ textAlign: 'center' }}>Variant</th>
            <th rowSpan="2">Threshold Level</th>
            <th rowSpan="2">Action</th>
          </tr>
        );
      case "expired":
      case "shortExpiry":
        return (
          <tr>
            <th rowSpan="2">Product Name</th>
            <th rowSpan="2">Expiry Date</th>
            {activeTab === "shortExpiry" && <th rowSpan="2">Remaining Days</th>}
            <th colSpan="2" style={{ textAlign: 'center' }}>Variant</th>
            <th rowSpan="2">Status</th>
            {activeTab !== "shortExpiry" && <th rowSpan="2">Action</th>}
          </tr>
        );
      case "damaged":
        return (
          <tr>
            <th rowSpan="2">Product Name</th>
            <th colSpan="2" style={{ textAlign: 'center' }}>Variant</th>
            <th rowSpan="2">Status</th>
            <th rowSpan="2">Action</th>
          </tr>
        );
      default: return null;
    }
  };

  const renderTableSubHeaders = () => {
      if (activeTab === "outOfStock" || activeTab === "lowStock" || activeTab === "expired" || activeTab === "shortExpiry") {
          return <tr><th className={styles.subTh}>Unit</th><th className={styles.subTh}>Quantity</th></tr>;
      }
      if (activeTab === "damaged") {
          return <tr><th className={styles.subTh}>Unit</th><th className={styles.subTh}>Damaged Qty</th></tr>;
      }
      return null;
  };

  const renderRows = () => {
    if (loading) return <tr><td colSpan="10" style={{padding: 40, textAlign: 'center'}}>Loading data...</td></tr>;
    return paginatedList.map((item, idx) => {
      const details = item.productDetails || {};
      const pName = details.productName || item.productName || "Unknown Product";
      const vt = item.variantType || {};
      const formattedSize = formatVariantSize(vt.size);
      const unitParts = [];
      if (formattedSize) unitParts.push(formattedSize);
      if (vt.flavor) unitParts.push(vt.flavor);
      if (vt.packType) unitParts.push(vt.packType);
      
      const unit = unitParts.length > 0 
        ? unitParts.join(" ") 
        : (vt.packCount ? `${vt.packCount} UNIT` : (item.variantMeasure || "STND"));
      
      // Determine quantity to show based on tab
      let displayQty = item.totalQuantity || item.qty || 0;
      if (activeTab === "expired") displayQty = item.expiredQty ?? displayQty;
      if (activeTab === "damaged") displayQty = item.displayQty ?? item.damagedQty ?? item.qty ?? 0;
      
      const qtyLabel = activeTab === "expired" || activeTab === "shortExpiry" || activeTab === "damaged" ? " UNITS" : "";
      
      return (
        <tr key={idx}>
          <td className={styles.productName}>{pName}</td>
          
          {activeTab === "outOfStock" && <td className={styles.category}>{details.category || "GENERAL"}</td>}
          
          {(activeTab === "expired" || activeTab === "shortExpiry") && (
              <td>{formatDate(item.expiryDate)}</td>
          )}

          {activeTab === "shortExpiry" && (
              <td style={{fontWeight: 700}}>
                {Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} DAYS
              </td>
          )}

          <td>{unit}</td>
          <td style={{fontWeight: 600}}>
              {displayQty}{qtyLabel}
          </td>

          {activeTab === "outOfStock" && <td>{formatDate(item.lastStockDate || new Date())}</td>}
          {activeTab === "lowStock" && <td style={{fontWeight: 700}}>{item.minStockAlert || 10}</td>}

          {(activeTab === "expired" || activeTab === "damaged") && (
              <td>
                <span className={activeTab === "expired" ? styles.statusExpired : styles.statusDamaged}>
                    <div className={styles.statusText}><IconAlert /> {activeTab === "expired" ? "Expired" : "Damaged"}</div>
                </span>
              </td>
          )}

          {activeTab === "shortExpiry" && (
              <td><span className={styles.statusText} style={{color: '#f39c12'}}><IconAlert /> Approaching</span></td>
          )}

          {activeTab !== "shortExpiry" && (
            <td>
              <div style={{display: 'flex', gap: '8px'}}>
                  {activeTab === "outOfStock" || activeTab === "lowStock" ? (
                      <button 
                          className={`${styles.actionBtn} ${styles.restockBtn}`}
                          onClick={() => handleRestock(item)}
                      >
                          <IconRefresh /> Restock
                      </button>
                  ) : activeTab === "expired" ? (
                      <button 
                          className={`${styles.actionBtn} ${styles.wasteBtn}`}
                          onClick={() => handleMarkWaste(item.stockUpdateId || item.id, true)}
                      >
                          🏷 Mark Waste
                      </button>
                  ) : (
                      <>
                            {item.consumptionId && (
                                <button 
                                  className={`${styles.actionBtn} ${styles.restockBtn}`}
                                  onClick={() => handleRestore(item.consumptionId)}
                                >
                                  <IconRefresh /> Restore
                                </button>
                            )}
                            <button 
                               className={`${styles.actionBtn} ${styles.wasteBtn}`}
                               onClick={() => handleMarkWaste(item.consumptionId)}
                            >
                               🏷 Mark Waste
                            </button>
                      </>
                  )}
              </div>
            </td>
          )}
        </tr>
      );
    });
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.tabBar}>
          {TABS.map(t => (
            <div 
              key={t.id} 
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label} ({data[t.id]?.length || 0})
            </div>
          ))}
        </div>

        <div className={styles.contentBody}>
          <div className={styles.topActions}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}><IconSearch /></span>
              <input 
                type="text" 
                placeholder="Search products here" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className={styles.exportBtn} onClick={() => {
                if (filteredList.length === 0) {
                    toast.error("No data to export");
                    return;
                }
                
                let csvRows = [];
                let headers = [];
                
                // Define headers based on tab
                if (activeTab === "outOfStock") headers = ["Product Name", "Category", "Unit", "Quantity", "Last Stock Date"];
                else if (activeTab === "lowStock") headers = ["Product Name", "Unit", "Quantity", "Threshold Level"];
                else if (activeTab === "expired" || activeTab === "shortExpiry") {
                    headers = ["Product Name", "Expiry Date", "Unit", "Quantity", "Status"];
                    if (activeTab === "shortExpiry") headers.splice(2, 0, "Remaining Days");
                }
                else if (activeTab === "damaged") headers = ["Product Name", "Unit", "Damaged Quantity", "Status"];
                
                csvRows.push(headers.join(","));
                
                filteredList.forEach(item => {
                    const details = item.productDetails || {};
                    const pName = `"${details.productName || item.productName || "Unknown"}"`;
                    const unit = item.variantMeasure || "STND";
                    let qty = item.totalQuantity || item.qty || 0;
                    if (activeTab === "expired") qty = item.expiredQty ?? qty;
                    if (activeTab === "damaged") qty = item.damagedQty ?? item.qty ?? 0;
                    
                    let row = [];
                    if (activeTab === "outOfStock") {
                        row = [pName, details.category || "GENERAL", unit, qty, formatDate(item.lastStockDate || new Date())];
                    } else if (activeTab === "lowStock") {
                        row = [pName, unit, qty, item.minStockAlert || 10];
                    } else if (activeTab === "expired" || activeTab === "shortExpiry") {
                        const status = activeTab === "expired" ? "Expired" : "Approaching";
                        row = [pName, formatDate(item.expiryDate), unit, qty, status];
                        if (activeTab === "shortExpiry") {
                            const days = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                            row.splice(2, 0, `${days} DAYS`);
                        }
                    } else if (activeTab === "damaged") {
                        row = [pName, unit, qty, "Damaged"];
                    }
                    csvRows.push(row.join(","));
                });
                
                const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', `${activeTab}_report_${new Date().toLocaleDateString()}.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }}>
                <IconDownload /> Export CSV
            </button>
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
              <p style={{ color: '#666', fontSize: '14px' }}>Loading reports...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : currentList.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    {renderTableHeaders()}
                    {renderTableSubHeaders()}
                  </thead>
                  <tbody>
                    {renderRows()}
                  </tbody>
                </table>
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
                  <span>{Math.min((currentPage - 1) * rowsPerPage + 1, filteredList.length)} - {Math.min(currentPage * rowsPerPage, filteredList.length)} of {filteredList.length} Items</span>
                </div>
                <div className={styles.paginationRight}>
                    {currentPage > 1 && (
                        <button className={styles.pageBtn} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
                    )}
                    {currentPage < totalPages && (
                        <button className={`${styles.pageBtn} ${styles.pageBtnNext}`} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                    )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StockStatusPage;
