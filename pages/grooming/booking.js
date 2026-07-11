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

  return (
    <DashboardLayout topbarButtons={topbarButtons} onTopbarAction={handleTopbarAction}>
      {isAddingBooking ? (
        <AddBookingGrooming onClose={() => setIsAddingBooking(false)} />
      ) : isViewingDetails ? (
        <ViewBookingDetails onClose={() => setIsViewingDetails(false)} />
      ) : (
        <BookingsList onViewDetails={() => setIsViewingDetails(true)} />
      )}
    </DashboardLayout>
  );
};

export default Booking;
