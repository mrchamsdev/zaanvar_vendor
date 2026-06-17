import React, { useState } from "react";
import styles from "../../styles/pet-sales/topbar.module.css";
import Image from "next/image";
import { Search } from "@/public/images/SVG";
import { useRouter } from "next/router"; 
import useDashboardData from "../dashboard/useDashboardData";

const Topbar = ({ buttons = [], onButtonClick }) => {
  const router = useRouter(); 

  const { branches, selectedBranchId, setSelectedBranchId } = useDashboardData();
  const [selectedService, setSelectedService] = useState("");

  // List of services with their respective paths
  const services = [
    { label: "Pet Sales", path: "/pet-sales" },
    { label: "Grooming", path: "/grooming" },
    { label: "Pet Store", path: "/pet-store" },
    // { label: "Training", path: "/training" },
    // { label: "Pet Care", path: "/pet-care" },
    // { label: "Meal", path: "/meal" },
  ];

  // Filter services to exclude the current page
  const filteredServices = services.filter(service => service.path !== router.pathname);

  const handleChangeBranch = (e) => {
    const value = e.target.value;
    setSelectedBranchId(value ? parseInt(value) : "");
  };

  const handleChangeService = (e) => {
    const value = e.target.value;
    setSelectedService(value);

    const selected = services.find(service => service.label === value);
    if (selected) {
      router.push(selected.path);
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles["search-wrapper"]}>
        {/* Search box */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search here"
            className={styles.search}
          />
          <span className={styles.searchIcon}><Search /></span>
        </div>

        {/* Branch dropdown */}
        <div className={styles["select-bar"]}>
          <select value={selectedBranchId || ""} onChange={handleChangeBranch}>
            {branches.length > 1 && <option value="">Select Branch</option>}
            {branches.length <= 1 && <option value="">Select Branch</option>}
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
            ))}
          </select>
        </div>

        {/* Service dropdown */}
        <div className={styles["select-bar"]}>
          <select value={selectedService} onChange={handleChangeService}>
            <option value="">Select Service</option>
            {filteredServices.map(service => (
              <option key={service.path} value={service.label}>{service.label}</option>
              
            ))}
          </select>
        </div>
      </div>

      {/* Buttons + Avatar */}
      <div className={styles.actions}>
        {buttons.map((btn, index) => {
          if (!btn || !btn.label) return null;
          const colorClass = btn.color && styles[btn.color] ? styles[btn.color] : styles.purple;
          return (
            <button
              key={index}
              className={`${styles.btn} ${colorClass}`}
              onClick={() => onButtonClick && onButtonClick(btn.action)}
            >
              {btn.label}
            </button>
          );
        })}

        <div className={styles.avatar}>
          <Image
            src="https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg"
            width={50}
            height={50}
            alt="User Avatar"
          />
          <span className={styles.onlineDot}></span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
