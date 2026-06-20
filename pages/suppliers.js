import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import styles from "../styles/suppliers/suppliers.module.css";
import dashboardStyles from "../styles/dashboard/dashboard.module.css";
import { purchaseService } from "../services/purchaseService";
import useStore from "../components/state/useStore";
import { toast } from "sonner";
import SupplierList from "../components/suppliers/SupplierList";
import SupplierFormManager from "../components/suppliers/SupplierFormManager";
import ConfirmationModal from "../components/inventory/confirmation-modal";

import useDashboardData from "../components/dashboard/useDashboardData";
import { useRouter } from "next/router";
import { FiX } from "react-icons/fi";

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SuppliersPage = () => {
  const router = useRouter();
  const { jwtToken, userInfo, _hasHydrated: isHydrated } = useStore();
  const { branches, branchId: defaultBranchId, setSelectedBranchId } = useDashboardData({ skipReviews: true });
  const currentBranchId = router.query.branchId || "";
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [managerConfig, setManagerConfig] = useState(null); // { mode, data }
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [managerTrigger, setManagerTrigger] = useState(0);
  const [errorPopupMessage, setErrorPopupMessage] = useState(null);

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
    if (router.isReady && router.query.action === 'add') {
      openManager("Add", {});
      // Clear query param
      const { action, ...restQuery } = router.query;
      router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.action]);

  useEffect(() => {
    if (!router.isReady) return;
    if (currentBranchId && jwtToken) {
      fetchSuppliers();
    }
  }, [router.isReady, currentBranchId, jwtToken]);

  // Clear selections when changing branch
  useEffect(() => {
    setSelectedIds([]);
  }, [currentBranchId]);

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
        {branches?.length > 1 && <option value="">Select Branch</option>}
        {branches?.map(b => (
          <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
        ))}
      </select>
    </div>
  );

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getSuppliers(jwtToken, currentBranchId);
      if (res.status === "success") {
        setSuppliers(res.data || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setShowDeleteConfirm(false);

    const selectedSuppliers = suppliers.filter(s => selectedIds.includes(s.supplierId));
    const hasRestrictedSuppliers = selectedSuppliers.some(s => s.hasOrders === true || s.hasOrders === "true");

    if (hasRestrictedSuppliers) {
      setErrorPopupMessage("this supplier has orders so can't delete the supplier");
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorMsg = null;
      for (const id of selectedIds) {
        const res = await purchaseService.deleteSupplier(jwtToken, id);
        if (res.status === "success" || res.status === 200 || res.data?.status === "success") {
          successCount++;
        } else {
          const msg = res.msg || res.message || (res.data && (res.data.msg || res.data.message));
          if (msg) {
            errorMsg = msg;
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} supplier(s)`);
        setSelectedIds([]);
        fetchSuppliers();
      }

      if (errorMsg) {
        if (errorMsg.includes("SequelizeForeignKeyConstraintError") || errorMsg.includes("foreign key constraint fails")) {
          setErrorPopupMessage("this supplier has orders so can't delete the supplier");
        } else {
          setErrorPopupMessage(errorMsg);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Error during bulk delete");
    } finally {
      setLoading(false);
    }
  };

  const openManager = (mode, data) => {
    setManagerConfig({ mode, data });
    setManagerTrigger(prev => prev + 1);
  };

  return (
    <DashboardLayout
      customTopbarLeft={customLeft}
      customTopbarRight={(
        <button
          className={styles.addBtn}
          onClick={() => openManager("Add", null)}
        >
          <IconPlus /> Add Supplier
        </button>
      )}
    >
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.statusTabsRow}>
            <div className={styles.statusGroup}>
              <span className={styles.statusLabel}>Overall Status :</span>
              <div className={styles.statusBadge}>TOTAL SUPPLIERS : {String(suppliers.length).padStart(2, '0')}</div>
            </div>
          </div>

          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by Supplier ID and Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <SupplierList
          suppliers={suppliers.filter(s =>
            s.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(s.supplierId).includes(searchTerm)
          )}
          searchTerm={searchTerm}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelection={(id) => setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
          )}
          onSelectAll={(allIds) => {
            if (selectedIds.length === allIds.length) setSelectedIds([]);
            else setSelectedIds(allIds);
          }}
          onView={(id) => {
            if (selectedIds.length > 1) {
              const selectedData = suppliers.filter(s => selectedIds.includes(s.supplierId));
              openManager("View", selectedData);
            } else {
              const supplier = suppliers.find(s => s.supplierId === id);
              openManager("View", supplier);
            }
          }}
          onEdit={(id) => {
            if (selectedIds.length > 1) {
              const selectedData = suppliers.filter(s => selectedIds.includes(s.supplierId));
              openManager("Edit", selectedData);
            } else {
              const supplier = suppliers.find(s => s.supplierId === id);
              openManager("Edit", supplier);
            }
          }}
          onDelete={(id) => {
            const supplier = suppliers.find(s => s.supplierId === id);
            if (supplier && (supplier.hasOrders === true || supplier.hasOrders === "true")) {
              setErrorPopupMessage("this supplier has orders so can't delete the supplier");
              return;
            }
            setSelectedIds([id]);
            setShowDeleteConfirm(true);
          }}
          onBulkDelete={() => {
            const selectedSuppliers = suppliers.filter(s => selectedIds.includes(s.supplierId));
            const hasRestrictedSuppliers = selectedSuppliers.some(s => s.hasOrders === true || s.hasOrders === "true");
            if (hasRestrictedSuppliers) {
              setErrorPopupMessage("this supplier has orders so can't delete the supplier");
              return;
            }
            setShowDeleteConfirm(true);
          }}
          onAddClick={() => openManager("Add", null)}
        />

        {managerConfig && (
          <SupplierFormManager
            mode={managerConfig.mode}
            initialData={managerConfig.data}
            trigger={managerTrigger}
            onClose={() => {
              setManagerConfig(null);
              fetchSuppliers();
              if (router.query.returnUrl) {
                router.push(router.query.returnUrl);
              }
            }}
          />
        )}

        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Delete Supplier?"
          message={`Are you sure you want to delete ${selectedIds.length} selected supplier(s)?`}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {errorPopupMessage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              border: '1px solid #f1f5f9',
              fontFamily: "'Inter', sans-serif"
            }}>
              <button 
                onClick={() => setErrorPopupMessage(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '50%'
                }}
              >
                <FiX />
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#0f172a',
                    margin: '0 0 8px 0'
                  }}>
                    Unable to Delete Supplier
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {errorPopupMessage}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '8px'
                }}>
                  <button
                    onClick={() => setErrorPopupMessage(null)}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuppliersPage;
