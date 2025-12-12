import Layout from "@/components/pet-sales/layout";
import Reviews from "@/components/pet-store/Reviews";
import { BackButton, Calender3, FourDots, FourDotsActive } from "@/public/image/SVG";
import React from "react";

const menuItems = [
  { name: "Dashboard", icon: <FourDotsActive />, path: "/pet-store" },
  { name: "Products", icon: <Calender3 />, path: "/pet-store/products" },
  { name: "Reviews", icon: <Calender3 />, path: "/pet-store/reviews" },
];

const topbarButtons = [
  { label: "+ Add Product", color: "red", action: "addProduct" },
  { label: "+ Add More", color: "light", action: "addMore" },
];

const PetStoreReviewsPage = () => {
  const handleTopbarAction = (action) => {
    console.log("Topbar action clicked:", action);
  };

  return (
    <Layout
      menuItems={menuItems}
      topbarButtons={topbarButtons}
      logoText="Pet Store"
      sidebarToggleButton={<BackButton />}
      topbarActionHandler={handleTopbarAction}
    >
      <Reviews />
    </Layout>
  );
};

export default PetStoreReviewsPage;

