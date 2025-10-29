import Charts from "@/components/pet-sales/charts";
import ChatOnline from "@/components/pet-sales/chatOnline";
import Layout from "@/components/pet-sales/layout";
import Topbar from "@/components/pet-sales/Topbar";
import { BackButton, Calender3, FourDots } from "@/public/image/SVG";
import React, { useState } from "react";
import styles from "../../styles/grooming/grooming.module.css"
import PetForm from "@/components/pet-sales/petForm";
import BookSlot from "@/components/grooming/bookSlot";

const Index = () => {
  const [editingPet, setEditingPet] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: <FourDots />, path: "/grooming" },
    { name: "Bookings", icon: <Calender3 />, path: "/grooming/booking" },
    { name: "Invoice Generation", icon: <Calender3 />, path: "/grooming/invoice-generation" },
    { name: "Parties & Purchases", icon: <Calender3 />, path: "/grooming/parties-purchases" },
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
          { label: "+ Add Rooms", color: "purple", action: "addRoom" },
          { label: "+ Add Bookings", color: "red", action: "addBooking" },
          { label: "+ Add More", color: "gray", action: "addMore" },
        ]}
        onButtonClick={(action) => {
          if (action === "addRoom") {
            setEditingPet(null);
            setShowForm(true);
          }
        }}
      />

      {!showForm && (
        <div className={styles["show"]}>
          <Charts />
          <ChatOnline />
        </div>
      )}
      {showForm && (
        <div>
       <BookSlot/>
            {/* <button className={styles.closeBtn} onClick={() => setShowForm(false)}>
              Back
            </button> */}
          </div>
        
      )}
    </Layout>
  );
};

export default Index;
