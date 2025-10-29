import React, { useState } from "react";
import Layout from "@/components/pet-sales/layout";
import Topbar from "@/components/pet-sales/Topbar";
// import AddStaffDrawer from "@/components/grooming/AddStaffDrawer";
import AddStaff from "@/components/pet-sales/addStaff";
import styles from "../../styles/grooming/staffManagment.module.css";
import { BackButton, Calender3, FourDots } from "@/public/SVG";

const StaffManagement = () => {
  const [showDrawer, setShowDrawer] = useState(false);

  const staffData = [
    {
      name: "RAJ KUMAR",
      contact: "+91 6303682018",
      role: "STORE MANAGER",
      weekOff: "-",
      schedule: "10:00 AM - 07:00 PM",
      leaveTaken: 0,
      leavePending: 0,
    },
    {
      name: "HARI KRISHNAN",
      contact: "+91 6303682018",
      role: "ADMIN",
      weekOff: "-",
      schedule: "10:00 AM - 07:00 PM",
      leaveTaken: 0,
      leavePending: 0,
    },
    {
      name: "MANJU PRIYA",
      contact: "+91 6303682018",
      role: "SUB-ADMIN",
      weekOff: "-",
      schedule: "10:00 AM - 07:00 PM",
      leaveTaken: 0,
      leavePending: 0,
    },
    {
      name: "SANKEERTHANA",
      contact: "+91 6303682018",
      role: "MANAGER",
      weekOff: "-",
      schedule: "10:00 AM - 07:00 PM",
      leaveTaken: 0,
      leavePending: 0,
    },
  ];


  
    const menuItems = [
      { name: "Dashboard", icon: <Calender3 />, path: "/grooming" },
      { name: "Bookings", icon: <Calender3 />, path: "/grooming/booking" },
      { name: "Invoice Generation", icon: <Calender3 />, path: "/grooming/invoice-generation" },
      { name: "Parties & Purchases", icon: <Calender3 />, path: "/grooming/parties-purchases" },
      // { name: "Expenses", icon: <Calender3 />, path: "/grooming/expenses" },
      // { name: "Inventory", icon: <Calender3 />, path: "/grooming/inventory" },
      { name: "Staff Management", icon: <FourDots />, path: "/grooming/staff-management" },
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

      {/* Main Section */}
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h2>Staff Management</h2>
          </div>
          <nav className={styles.nav}>
            <button className={styles.active}>EXECUTIVES</button>
            <button>MANAGE STAFF</button>
            <button>MANAGE LEAVES</button>
          </nav>
        </header>

        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>STAFF NAME</th>
              <th>CONTACT</th>
              <th>ROLE</th>
              <th>WEEK OFF DAY</th>
              <th>SCHEDULE</th>
              <th>LEAVE TAKEN</th>
              <th>LEAVE PENDING</th>
            </tr>
          </thead>
          <tbody>
            {staffData.map((staff, index) => (
              <tr key={index}>
                <td>
                  <input type="checkbox" />
                </td>
                <td>{staff.name}</td>
                <td>{staff.contact}</td>
                <td>
                  <span className={styles.roleBadge}>{staff.role}</span>
                </td>
                <td>{staff.weekOff}</td>
                <td>{staff.schedule}</td>
                <td>{staff.leaveTaken}</td>
                <td>{staff.leavePending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    {/* Component here  */}
      <AddStaff show={showDrawer} onClose={() => setShowDrawer(false)} />
    </Layout>
  );
};

export default StaffManagement;
