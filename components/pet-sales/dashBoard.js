"use client";
import React, { useState } from "react";
import styles from "../../styles/pet-sales/dashBoard.module.css";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Image from "next/image";
import { BackButton, Calender3, CrossIcon, FourDots, Notification, Price } from "@/public/SVG";
import Charts from "./charts";
import ChatOnline from "./chatOnline";
// import Charts from "./Charts";



const Dashboard = () => {
  const [activeCard, setActiveCard] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Topbar Buttons
  const buttons = [
    { label: "+ Add Rooms", color: "purple" },
    { label: "+ Add Bookings", color: "red" },
    { label: "+ Add More", color: "gray" },
  ];
  const menuItems = [
    { name: "Dashboard", icon: <FourDots />, path: "/pet-sales" },
    { name: "My Pets", icon: <Calender3 />, path: "/my-pets" },
    { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
    { name: "Settings", icon: <Calender3 />, path: "/settings " },
  ];

  return (
    <div className={styles["dashboardContainer"]}>
      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setIsMobileOpen} 
     
      toggleButton={<BackButton />} 
      menuItems={menuItems} 
      logoText="Pet Sales"/>

      {/* Mobile Header */}
      <div className={styles["sidebar-toggle"]}>
        <button
          className={styles["menu-button"]}
          onClick={() => setIsMobileOpen(true)}
        >
          ☰
        </button>

        <Image
          src="https://zaanvar-care.b-cdn.net/media/1759818805009-ZAANVAR_FINAL%20LOGO%203.png"
          height={45}
          width={70}
          className={styles["image-blog"]}
          alt="Logo"
          priority
        />

        <Notification className={styles["menu-button"]} />
      </div>

      {/* Main Section */}
      <div className={styles["mainSection"]}>
        <Topbar buttons={buttons} className={styles["top-bar"]} />

        {/* ===== Stats Cards ===== */}
        <div className={styles["statsGrid"]}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`${styles["card"]} ${
                activeCard === index ? styles["active"] : ""
              }`}
              onClick={() => setActiveCard(index)}
            >
              <div className={styles["wrapper-div"]}>
                <div className={styles["number-pet"]}>
                  <h4>Total Earning</h4>
                  <h2>12,50,769</h2>
                </div>
                <Price />
              </div>

              <div className={styles["price-div"]}>
                <div className={styles["icon"]}>
                  <CrossIcon /> 12
                </div>
                <p> ↑ 12% this week</p>
              </div>
            </div>
          ))}
        </div>

        {/* ===== Charts + Returns Section ===== */}
        <div className={styles["wrapper"]}>
          <Charts />

          {/* ===== Returns Today Section ===== */}
          <ChatOnline/>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
