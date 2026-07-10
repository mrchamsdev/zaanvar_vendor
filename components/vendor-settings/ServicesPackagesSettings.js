import React, { useState, useEffect } from "react";
import styles from "../../styles/vendor-settings/services-packages.module.css";
import AddServiceModal from "./AddServiceModal";
import AddPackageModal from "./AddPackageModal";
import ConfirmationModal from "../inventory/confirmation-modal";

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
        onAddRooms: () => {
          alert("Add Room clicked!");
        },
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

  // Static services data matching screenshots
  const [services, setServices] = useState([
    { id: "s1", serviceName: "Bathing", petType: "DOG , Cat", duration: "30 mins", price: "₹ 500", rawPrice: "500", branch: "B-119-004", category: "Grooming" },
    { id: "s2", serviceName: "Nail Cutting", petType: "DOG , Cat", duration: "30 mins", price: "₹ 500", rawPrice: "500", branch: "B-119-004", category: "Grooming" },
    { id: "s3", serviceName: "Hair Trim", petType: "DOG , Cat", duration: "1 hour", price: "₹ 600", rawPrice: "600", branch: "B-119-004", category: "Grooming" },
    { id: "s4", serviceName: "Bathing", petType: "DOG", duration: "30 mins", price: "₹ 500", rawPrice: "500", branch: "B-119-004", category: "Grooming" },
    { id: "s5", serviceName: "Nail cutting", petType: "Cat", duration: "30 mins", price: "₹ 500", rawPrice: "500", branch: "B-119-004", category: "Grooming" },
    { id: "s6", serviceName: "Hair Trim", petType: "DOG , Cat", duration: "1 hour", price: "₹ 600", rawPrice: "600", branch: "B-119-004", category: "Grooming" }
  ]);

  // Static packages data matching screenshots
  const [packages, setPackages] = useState([
    { id: "p1", packageName: "Full Grooming Package", petType: "DOG , Cat", duration: "30 mins", price: "₹ 500", rawPrice: "500", discountPrice: "₹ 400", rawDiscountPrice: "400", branch: "B-119-004", category: "Full Body Care" },
    { id: "p2", packageName: "Full Grooming Package", petType: "DOG , Cat", duration: "30 mins", price: "₹ 500", rawPrice: "500", discountPrice: "₹ 200", rawDiscountPrice: "200", branch: "B-119-004", category: "Full Body Care" },
    { id: "p3", packageName: "Full Grooming Package", petType: "DOG , Cat", duration: "1 hour", price: "₹ 600", rawPrice: "600", discountPrice: "₹ 300", rawDiscountPrice: "300", branch: "B-119-004", category: "Full Body Care" },
    { id: "p4", packageName: "Full Grooming Package", petType: "DOG", duration: "30 mins", price: "₹ 500", rawPrice: "500", discountPrice: "₹ 200", rawDiscountPrice: "200", branch: "B-119-004", category: "Full Body Care" },
    { id: "p5", packageName: "Full Grooming Package", petType: "Cat", duration: "30 mins", price: "₹ 500", rawPrice: "500", discountPrice: "₹ 250", rawDiscountPrice: "250", branch: "B-119-004", category: "Full Body Care" },
    { id: "p6", packageName: "Full Grooming Package", petType: "DOG , Cat", duration: "1 hour", price: "₹ 600", rawPrice: "600", discountPrice: "₹ 300", rawDiscountPrice: "300", branch: "B-119-004", category: "Full Body Care" }
  ]);

  // Search filtering
  const filteredServices = services.filter(s =>
    s.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.petType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPackages = packages.filter(p =>
    p.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.petType.toLowerCase().includes(searchTerm.toLowerCase())
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

  const executeDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === "service") {
      setServices(prev => prev.filter(s => s.id !== itemToDelete.id));
    } else {
      setPackages(prev => prev.filter(p => p.id !== itemToDelete.id));
    }
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleSaveService = (saved) => {
    if (services.some(s => s.id === saved.id)) {
      setServices(prev => prev.map(s => s.id === saved.id ? saved : s));
    } else {
      setServices(prev => [...prev, saved]);
    }
    setShowAddService(false);
    setEditingItem(null);
  };

  const handleSavePackage = (saved) => {
    if (packages.some(p => p.id === saved.id)) {
      setPackages(prev => prev.map(p => p.id === saved.id ? saved : p));
    } else {
      setPackages(prev => [...prev, saved]);
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
