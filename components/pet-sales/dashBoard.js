"use client";
import React, { useState } from "react";
import styles from "../../styles/pet-sales/dashBoard.module.css";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Image from "next/image";
import { CrossIcon, Notification, Price } from "@/public/SVG";
import Charts from "./charts";
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

  return (
    <div className={styles["dashboardContainer"]}>
      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setIsMobileOpen} />

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
                  <h4>Total Pets</h4>
                  <h2>2,50,769</h2>
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
          <div className={styles["chats-div"]}>
            <div className={styles["chartBox"]}>
              <div className={styles["chartHeader"]}>
                <h4>Returns Today</h4>
                <select className={styles["selectdrop"]}>
                  <option>Today</option>
                </select>
              </div>

              <div className={styles["returnsList"]}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles["returnItem"]}>
                    <div className={styles["user"]}>
                      <div className={styles["avatar"]}>
                        <Image
                          src="https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg"
                          width={50}
                          height={50}
                          alt="user avatar"
                        />
                        <span className={styles["onlineDot"]}></span>
                      </div>
                      <div>
                        <p className={styles["name"]}>Shubham Pawar</p>
                        <p className={styles["date"]}>
                          12-09-2025 to 13-09-2025
                        </p>
                      </div>
                    </div>
                    <p className={styles["amount"]}>₹500.00</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
