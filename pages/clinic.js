import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import styles from "../styles/dashboard/dashboard.module.css";

export default function ClinicPage() {
  const topbarButtons = [
    // { label: "+ Add Appointment", color: "purple", action: "addAppointment" },
    // { label: "+ Add Bookings",    color: "red",    action: "addBookings"    },
    // { label: "+ Add More",        color: "gray",   action: "addMore"        },
  ];

  return (
    <DashboardLayout topbarButtons={topbarButtons}>
      <div style={{ padding: "clamp(16px,2vw,32px)", textAlign: "center", marginTop: "10vh" }}>
        <h2 style={{ fontSize: "clamp(20px,2.2vw,28px)", fontWeight: 700, color: "#111" }}>
          Clinic
        </h2>
        <p style={{ fontSize: "clamp(13px,1.1vw,16px)", color: "#888", marginTop: 8 }}>
        This section is under development.
        Please visit again soon to explore new updates.
        </p>
      </div>
    </DashboardLayout>
  );
}
