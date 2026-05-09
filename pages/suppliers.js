import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import styles from "../styles/suppliers/suppliers.module.css";
import { purchaseService } from "../services/purchaseService";
import useStore from "../components/state/useStore";
import { toast } from "sonner";
import SupplierList from "../components/suppliers/SupplierList";
import SupplierFormManager from "../components/suppliers/SupplierFormManager";
import ConfirmationModal from "../components/inventory/confirmation-modal";

import useDashboardData from "../components/dashboard/useDashboardData";
import { useRouter } from "next/router";

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SuppliersPage = () => {
  const router = useRouter();
  const { jwtToken, userInfo, _hasHydrated: isHydrated } = useStore();
  const { branches, branchId: hookBranchId } = useDashboardData({ skipReviews: true });
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [managerConfig, setManagerConfig] = useState(null); // { mode, data }
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const branchId = router.query.branchId || hookBranchId || userInfo?.branchId || (branches && branches[0]?.id) || 91;

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
    if (branchId && jwtToken) {
      fetchSuppliers();
    }
  }, [router.isReady, branchId, jwtToken]);

  const handleBranchChange = (e) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, branchId: e.target.value }
    }, undefined, { shallow: true });
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getSuppliers(jwtToken, branchId);
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
    setLoading(true);
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await purchaseService.deleteSupplier(jwtToken, id);
        if (res.status === "success" || res.status === 200) {
          successCount++;
        }
      }
      toast.success(`Successfully deleted ${successCount} supplier(s)`);
      setSelectedIds([]);
      fetchSuppliers();
    } catch (e) {
      console.error(e);
      toast.error("Error during bulk delete");
    } finally {
      setLoading(false);
    }
  };

  const openManager = (mode, data) => {
    setManagerConfig({ mode, data });
  };

  return (
    <DashboardLayout
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
                placeholder="Search suppliers here" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <SupplierList 
          suppliers={suppliers.filter(s => 
            s.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone?.includes(searchTerm)
          )}
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
            setSelectedIds([id]);
            setShowDeleteConfirm(true);
          }}
          onBulkDelete={() => setShowDeleteConfirm(true)}
          onAddClick={() => openManager("Add", null)}
        />

        {managerConfig && (
          <SupplierFormManager 
            mode={managerConfig.mode}
            initialData={managerConfig.data}
            onClose={() => {
              setManagerConfig(null);
              fetchSuppliers();
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
      </div>
    </DashboardLayout>
  );
};

export default SuppliersPage;
