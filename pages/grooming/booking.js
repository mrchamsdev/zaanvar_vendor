import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import BookingsList from "../../components/grooming/BookingsList";
import AddBookingGrooming from "../../components/grooming/AddBookingGrooming";
import ViewBookingDetails from "../../components/grooming/ViewBookingDetails";

const Booking = () => {
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  const topbarButtons = [
    { label: "+ Add Bookings", color: "pink", action: "addBookings" }
  ];

  const handleTopbarAction = (action) => {
    if (action === "addBookings") {
      setIsAddingBooking(true);
      setIsViewingDetails(false);
    } else if (action === "viewDetails") {
      setIsViewingDetails(true);
      setIsAddingBooking(false);
    }
  };

  if (isAddingBooking) {
    return <AddBookingGrooming onClose={() => setIsAddingBooking(false)} />;
  }

  if (isViewingDetails) {
    return <ViewBookingDetails onClose={() => setIsViewingDetails(false)} />;
  }

  return (
    <DashboardLayout topbarButtons={topbarButtons} onTopbarAction={handleTopbarAction}>
      <BookingsList onViewDetails={() => setIsViewingDetails(true)} />
    </DashboardLayout>
  );
};

export default Booking;
