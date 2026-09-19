import React from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import ComingSoonCards from "../../components/dashboard/ComingSoonCards";

export default function AdvertisementsPage() {
  return (
    <DashboardLayout>
      <ComingSoonCards singleCard="advertisements" />
    </DashboardLayout>
  );
}
