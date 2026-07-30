import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import BookingsList from "../../components/grooming/BookingsList";
import AddBookingGrooming from "../../components/grooming/AddBookingGrooming";
import ViewBookingDetails from "../../components/grooming/ViewBookingDetails";

const Booking = () => {
  const router = useRouter();
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const topbarButtons = [
    { label: "+ Add Bookings", color: "pink", action: "addBookings" }
  ];

  // Sync state with URL query parameters on load/refresh
  useEffect(() => {
    if (router.isReady) {
      if (router.query.edit === "true" && router.query.bookingId) {
        setSelectedBookingId(router.query.bookingId);
        setIsAddingBooking(true);
        setIsViewingDetails(false);
      } else if (router.query.view === "true" && router.query.bookingId) {
        setSelectedBookingId(router.query.bookingId);
        setIsViewingDetails(true);
        setIsAddingBooking(false);
      }
    }
  }, [router.isReady, router.query.edit, router.query.view, router.query.bookingId]);

  const handleTopbarAction = (action) => {
    if (action === "addBookings") {
      setIsAddingBooking(true);
      setIsViewingDetails(false);
    } else if (action === "viewDetails") {
      setIsViewingDetails(true);
      setIsAddingBooking(false);
    }
  };

  const handleCloseEdit = () => {
    setIsAddingBooking(false);
    setSelectedBookingId(null);
    const { edit, bookingId, ...restQuery } = router.query;
    router.push({
      pathname: router.pathname,
      query: restQuery
    }, undefined, { shallow: true });
  };

  const handleCloseView = () => {
    setIsViewingDetails(false);
    setSelectedBookingId(null);
    const { view, bookingId, ...restQuery } = router.query;
    router.push({
      pathname: router.pathname,
      query: restQuery
    }, undefined, { shallow: true });
  };

  if (isAddingBooking) {
    return <AddBookingGrooming bookingId={selectedBookingId} onClose={handleCloseEdit} />;
  }

  if (isViewingDetails) {
    return <ViewBookingDetails bookingId={selectedBookingId} onClose={handleCloseView} />;
  }

  return (
    <DashboardLayout topbarButtons={topbarButtons} onTopbarAction={handleTopbarAction}>
      <BookingsList
        onAddBooking={() => {
          setIsAddingBooking(true);
          setIsViewingDetails(false);
        }}
        onViewDetails={(booking) => {
          const rawId = booking.rawId || booking.id;
          setSelectedBookingId(rawId);
          setIsViewingDetails(true);
          router.push({
            pathname: router.pathname,
            query: { ...router.query, view: "true", bookingId: rawId }
          }, undefined, { shallow: true });
        }}
        onEdit={(booking) => {
          const rawId = booking.rawId || booking.id;
          setSelectedBookingId(rawId);
          setIsAddingBooking(true);
          router.push({
            pathname: router.pathname,
            query: { ...router.query, edit: "true", bookingId: rawId }
          }, undefined, { shallow: true });
        }}
      />
    </DashboardLayout>
  );
};

export default Booking;
