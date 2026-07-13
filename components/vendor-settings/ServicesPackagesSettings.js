import React, { useState, useEffect } from "react";
import styles from "../../styles/vendor-settings/services-packages.module.css";
import AddServiceModal from "./AddServiceModal";
import AddPackageModal from "./AddPackageModal";
import ConfirmationModal from "../inventory/confirmation-modal";
import useStore from "../state/useStore";
import { VENDOR_API_URL } from "../utilities/Constants";

const ServicesPackagesSettings = ({ setTopbarActions }) => {
  const [activeTab, setActiveTab] = useState("Services");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [showAddService, setShowAddService] = useState(false);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Register top bar actions with parent page
  useEffect(() => {
    if (setTopbarActions) {
      setTopbarActions({
        activeTab,
        onAddServiceOrPackage: () => {
          setEditingItem(null);
          if (activeTab === "Services") {
            setShowAddService(true);
          } else {
            setShowAddPackage(true);
          }
        }
      });
    }
    return () => {
      if (setTopbarActions) setTopbarActions(null);
    };
  }, [activeTab, setTopbarActions]);

  const selectedBranchId = useStore((state) => state.selectedBranchId);
  const branchId = selectedBranchId || 3;

  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);

  // Fetch data
  const fetchOfferings = async () => {
    try {
      const typeStr = activeTab === "Services" ? "services" : "packages";
      const res = await fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${branchId}?type=${typeStr}`);
      const json = await res.json();
      
      if (json.status === "success" && json.data) {
        if (activeTab === "Services") {
          const apiServices = json.data.services || [];
          setServices(apiServices.filter(s => s.id).map(s => ({
            id: s.id,
            serviceName: Array.isArray(s.serviceName) ? s.serviceName.join(", ") : s.serviceName,
            petType: Array.isArray(s.petType) ? s.petType.join(", ") : s.petType,
            duration: `${s.duration} mins`,
            price: `₹ ${s.price}`,
            rawPrice: s.price,
            discountPrice: `₹ ${s.discountPrice}`,
            rawDiscountPrice: s.discountPrice,
            discountPercent: s.discountPercentage,
            category: s.category,
            branch: branchId
          })));
        } else {
          const apiPackages = json.data.packages || [];
          setPackages(apiPackages.filter(p => p.id).map(p => ({
            id: p.id,
            packageName: p.packageName || p.serviceName,
            petType: Array.isArray(p.petType) ? p.petType.join(", ") : p.petType,
            duration: `${p.duration} mins`,
            price: `₹ ${p.price}`,
            rawPrice: p.price,
            discountPrice: `₹ ${p.discountPrice}`,
            rawDiscountPrice: p.discountPrice,
            discountPercent: p.discountPercentage,
            category: p.category,
            services: p.services || [],
            branch: branchId
          })));
        }
      }
    } catch (err) {
      console.error("Failed to fetch offerings:", err);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, [activeTab, branchId]);

  // Search filtering
  const filteredServices = services.filter(s =>
    (s.serviceName ? String(s.serviceName) : "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.petType ? String(s.petType) : "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPackages = packages.filter(p =>
    (p.packageName ? String(p.packageName) : "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.petType ? String(p.petType) : "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Edit / Delete Actions
  const handleEditService = (service) => {
    setEditingItem({
      ...service,
      price: service.rawPrice,
      discountPercent: service.discountPercent || "",
      discountPrice: service.discountPrice || ""
    });
    setShowAddService(true);
  };

  const handleDeleteService = (id) => {
    setItemToDelete({ type: "service", id });
    setShowDeleteConfirm(true);
  };

  const handleEditPackage = (pkg) => {
    setEditingItem({
      ...pkg,
      price: pkg.rawPrice,
      discountPercent: pkg.discountPercent || "",
      discountPrice: pkg.rawDiscountPrice || ""
    });
    setShowAddPackage(true);
  };

  const handleDeletePackage = (id) => {
    setItemToDelete({ type: "package", id });
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      const typeStr = itemToDelete.type === "service" ? "services" : "packages";
      const res = await fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${branchId}/${itemToDelete.id}?type=${typeStr}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (itemToDelete.type === "service") {
          setServices(prev => prev.filter(s => s.id !== itemToDelete.id));
        } else {
          setPackages(prev => prev.filter(p => p.id !== itemToDelete.id));
        }
      } else {
        alert("Failed to delete offering.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting offering.");
    }
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleSaveService = async (saved) => {
    try {
      const isEdit = String(saved.id).startsWith("off-");
      const url = isEdit 
        ? `${VENDOR_API_URL}vendor/grooming-booking/offerings/${branchId}/${saved.id}` 
        : `${VENDOR_API_URL}vendor/grooming-booking/offerings/${branchId}`;
        
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "services", data: saved.apiPayload })
      });

      if (res.ok) {
        fetchOfferings(); // Refresh the list
      } else {
        alert("Failed to save service.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving service.");
    }
    setShowAddService(false);
    setEditingItem(null);
  };

  const handleSavePackage = async (saved) => {
    try {
      const isEdit = String(saved.id).startsWith("off-");
      const url = isEdit 
        ? `${VENDOR_API_URL}vendor/grooming-booking/offerings/${branchId}/${saved.id}` 
        : `${VENDOR_API_URL}vendor/grooming-booking/offerings/${branchId}`;
        
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "packages", data: saved.apiPayload })
      });

      if (res.ok) {
        fetchOfferings(); // Refresh the list
      } else {
        alert("Failed to save package.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving package.");
    }
    setShowAddPackage(false);
    setEditingItem(null);
  };

  return (
    <div className={styles.container}>
      {/* Top Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search here"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === "Services" ? styles.tabActive : ""}`}
          onClick={() => { setActiveTab("Services"); setSearchTerm(""); }}
        >
          Services
        </button>
        <button
          className={`${styles.tab} ${activeTab === "Packages" ? styles.tabActive : ""}`}
          onClick={() => { setActiveTab("Packages"); setSearchTerm(""); }}
        >
          Packages
        </button>
      </div>

      {/* Tables content */}
      <div className={styles.tableCard}>
        {activeTab === "Services" ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>S NO</th>
                <th>Service Name</th>
                <th>Pet Type</th>
                <th>Duration</th>
                <th>Price</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: "center", padding: 24 }}>No services found</td></tr>
              ) : (
                filteredServices.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ fontWeight: 500 }}>{item.serviceName}</td>
                    <td>{item.petType}</td>
                    <td>{item.duration}</td>
                    <td style={{ fontWeight: 600 }}>{item.price}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.actionBtn} onClick={() => handleEditService(item)} title="Edit">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button className={styles.actionBtn} onClick={() => handleDeleteService(item.id)} title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>S NO</th>
                <th>Package Name</th>
                <th>Pet Type</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Discount Price</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: "center", padding: 24 }}>No packages found</td></tr>
              ) : (
                filteredPackages.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ fontWeight: 500 }}>{item.packageName}</td>
                    <td>{item.petType}</td>
                    <td>{item.duration}</td>
                    <td style={{ fontWeight: 600 }}>{item.price}</td>
                    <td style={{ fontWeight: 600, color: "#de1d52" }}>{item.discountPrice}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.actionBtn} onClick={() => handleEditPackage(item)} title="Edit">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button className={styles.actionBtn} onClick={() => handleDeletePackage(item.id)} title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Service Modal */}
      {showAddService && (
        <AddServiceModal
          onClose={() => { setShowAddService(false); setEditingItem(null); }}
          onSave={handleSaveService}
          initialData={editingItem}
        />
      )}

      {/* Add / Edit Package Modal */}
      {showAddPackage && (
        <AddPackageModal
          onClose={() => { setShowAddPackage(false); setEditingItem(null); }}
          onSave={handleSavePackage}
          initialData={editingItem}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Item?"
        message={`Are you sure you want to delete this ${itemToDelete?.type}? This action is permanent and cannot be undone.`}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteConfirm(false); setItemToDelete(null); }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ServicesPackagesSettings;
