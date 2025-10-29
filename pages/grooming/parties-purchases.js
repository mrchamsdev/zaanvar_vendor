
import React, { useState } from "react";
// import styles from "./AddParty.module.css";
import styles from "../../styles/grooming/partiesPurcheses.module.css"
import Layout from "@/components/pet-sales/layout";
import { BackButton, Calender3, FourDots, Settings } from "@/public/image/SVG";
import Topbar from "@/components/pet-sales/Topbar";
import PartySettingsDrawer from "@/components/grooming/partysidebar";

const PartiesPurchases = () => {
  const [activeTab, setActiveTab] = useState("gst");
  const [showSettings, setShowSettings] = useState(false);


      const menuItems = [
        { name: "Dashboard", icon: <Calender3 />, path: "/grooming" },
        { name: "Bookings", icon: <Calender3 />, path: "/grooming/booking" },
        { name: "Invoice Generation", icon: <Calender3 />, path: "/grooming/invoice-generation" },
        { name: "Parties & Purchases", icon: <FourDots />, path: "/grooming/parties-purchases" },
        // { name: "Expenses", icon: <Calender3 />, path: "/grooming/expenses" },
        // { name: "Inventory", icon: <Calender3 />, path: "/grooming/inventory" },
        { name: "Staff Management", icon: <Calender3 />, path: "/grooming/staff-management" },
        // { name: "Reports", icon: <Calender3 />, path: "/grooming/reports" },
        // { name: "Settings", icon: <Calender3 />, path: "/settings" },
        // { name: "Logout", icon: <Calender3 />, path: "/logout" },
      ];
  return (
  <Layout menuItems={menuItems} sidebarToggleButton={<BackButton />}>
     <Topbar
        buttons={[
          { label: "+ Add Staff", color: "purple", action: "addStaff" },
          { label: "+ Add Bookings", color: "red", action: "addBooking" },
          { label: "+ Add More", color: "gray", action: "addMore" },
        ]}
        onButtonClick={(action) => action === "addStaff" && setShowDrawer(true)}
      />
      <div className={styles.container}>
        <div className={styles["svg-wrapper"]}>
      
      <h2 className={styles.title}>Add Party</h2>
      <div onClick={() => setShowSettings(true)}>
      <Settings/>
      </div>
      
        </div>
      {/* Basic Info */}
      <div className={styles.row}>
        <input type="text" placeholder="Enter Party Name" className={styles.input} />
        <input type="text" placeholder="GSTIN" className={styles.input} />
        <input type="text" placeholder="Phone Number" className={styles.input} />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "gst" ? styles.active : ""}`}
          onClick={() => setActiveTab("gst")}
        >
          GST & Address
        </button>
        <button
          className={`${styles.tab} ${activeTab === "credit" ? styles.active : ""}`}
          onClick={() => setActiveTab("credit")}
        >
          Credit & Balance
        </button>
        <button
          className={`${styles.tab} ${activeTab === "additional" ? styles.active : ""}`}
          onClick={() => setActiveTab("additional")}
        >
          Additional Fields
        </button>
      </div>

      <hr className={styles.divider} />

      {/* GST & Address */}
      {activeTab === "gst" && (
        <div className={styles.tabContent}>
          <div className={styles.left}>
            <label>GST Type</label>
            <select className={styles.input}>
              <option>Unregistered/Consumer</option>
              <option>Registered</option>
            </select>

            <label>State</label>
            <select className={styles.input}>
              <option>Select State</option>
              <option>Maharashtra</option>
              <option>Delhi</option>
            </select>

            <label>Email ID</label>
            <input type="email" placeholder="Enter Email" className={styles.input} />
          </div>

          <div className={styles.right}>
            <label>Billing Address</label>
            <textarea placeholder="Billing Address" className={styles.textarea}></textarea>
            <p className={styles.enableShipping}>+Enable Shipping Address</p>
          </div>
        </div>
      )}
      <PartySettingsDrawer open={showSettings} onClose={() => setShowSettings(false)} />

    </div>
  </Layout>
  );
};

export default PartiesPurchases;
