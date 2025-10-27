import Layout from "@/components/pet-sales/layout";
import Topbar from "@/components/pet-sales/Topbar";
import styles from "../../styles/grooming/bookings.module.css";
import { BackButton, Calender3, FourDots } from "@/public/SVG";
import React, { useState } from "react";
import UpcomingBookings from "@/components/grooming/upcomingBookings";
import PendingBookings from "@/components/grooming/pending";
import CompletedBookings from "@/components/grooming/completedBookings";
import CancelledBookings from "@/components/grooming/cancelled";

const Index = () => {
  const [activeTab, setActiveTab] = useState("Upcoming"); 
  const tabs = ["Upcoming", "Pending", "Completed", "Cancelled"];

  const menuItems = [
    { name: "Dashboard", icon: <Calender3 />, path: "/grooming" },
    { name: "Bookings", icon: <FourDots />, path: "/bookings" },
    { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
    { name: "Settings", icon: <Calender3 />, path: "/settings" },
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
            { label: "+ Add Puppies", color: "purple", action: "addRoom" },
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

export default Index;
