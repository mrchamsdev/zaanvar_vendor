import Layout from "@/components/pet-sales/layout";
import Topbar from "@/components/pet-sales/Topbar";
import styles from "../../styles/grooming/bookings.module.css";
import { BackButton, Calender3, FourDots } from "@/public/image/SVG";
import React, { useState } from "react";
import UpcomingBookings from "@/components/grooming/upcomingBookings";
import PendingBookings from "@/components/grooming/pending";
import CompletedBookings from "@/components/grooming/completedBookings";
import CancelledBookings from "@/components/grooming/cancelled";

const Booking = () => {
  const [activeTab, setActiveTab] = useState("Upcoming"); 
  const tabs = ["Upcoming", "Pending", "Completed", "Cancelled"];

  const menuItems = [
        { name: "Dashboard", icon: <Calender3 />, path: "/grooming" },
        { name: "Bookings", icon: <FourDots />, path: "/grooming/booking" },
        { name: "Invoice Generation", icon: <Calender3 />, path: "/grooming/invoice-generation" },

        { name: "Parties & Purchases", icon: <Calender3 />, path: "/grooming/parties-purchases" },
        // { name: "Expenses", icon: <Calender3 />, path: "/grooming/expenses" },
        // { name: "Inventory", icon: <Calender3 />, path: "/grooming/inventory" },
        { name: "Staff Management", icon: <Calender3 />, path: "/grooming/staff-management" },
        // { name: "Reports", icon: <Calender3 />, path: "/grooming/reports" },
        // { name: "Settings", icon: <Calender3 />, path: "/settings" },
        // { name: "Logout", icon: <Calender3 />, path: "/logout" },
      ];
  const tabComponents = {
    Upcoming: <UpcomingBookings />,
    Pending: <PendingBookings />,
    Completed: <CompletedBookings />,
    Cancelled: <CancelledBookings />,
  };
  



  return (
    <>
      <Layout menuItems={menuItems} sidebarToggleButton={<BackButton />}>
        <Topbar
          buttons={[
            { label: "+ Add Rooms", color: "purple", action: "addRoom" },
            { label: "+ Add Bookings", color: "red", action: "addBooking" },
            { label: "+ Add More", color: "gray", action: "addMore" },
          ]}
        />
        <div className={styles["top-button"]}>
          {tabs.map((tab) => (
            <button 
              key={tab}
              className={activeTab === tab ? styles.active : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={styles["tab-content"]}>{tabComponents[activeTab]}</div>

      </Layout>
    </>
  );
};

export default Booking;
