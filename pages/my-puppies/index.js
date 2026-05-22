import Layout from "@/components/pet-sales/layout";
import MyPuppies from "@/components/pet-sales/myPuppins"; // Ensure the filename is 'myPuppins'
import { BackButton, Calender3, FourDots } from "@/public/images/SVG";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";

const Index = () => {
  const menuItems = [
    { name: "Dashboard", icon: <Calender3 />, path: "/pet-sales" },
    { name: "My Pets", icon: <Calender3 />, path: "/my-pets" },
    { name: "My Puppies", icon: <FourDots />, path: "/my-puppies" },
    { name: "Settings", icon: <Calender3 />, path: "/settings" },
  ];

  const { getJwtToken } = useStore();
  const jwttoken = getJwtToken();
  const webApi = useMemo(() => new WebApimanager(jwttoken), [jwttoken]);

  const [myPetData, setMyPetData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  // Use useCallback to prevent unnecessary re-renders in the child
  const FetchAllData = useCallback(async () => {
    try {
      // Changed to exact endpoint from your logs
      const response = await webApi.get(`vendorPetSales/myPuppies`);
      console.log("Fetch puppies response:", response);

      const pets = response?.data?.data || [];
      setMyPetData(pets);
      return pets;
    } catch (error) {
      console.error("Error fetching puppies:", error);
      return [];
    }
  }, [webApi]);

  useEffect(() => {
    FetchAllData();
  }, [FetchAllData]);

  return (
    <Layout
      menuItems={menuItems}
      logoText="Zaanvar"
      sidebarToggleButton={<BackButton />}
    >
      <MyPuppies
        pets={myPetData}
        showForm={showForm}
        setShowForm={setShowForm}
        editingPet={editingPet}
        setEditingPet={setEditingPet} // <--- CRITICAL: Ensure this line exists
        refreshPets={FetchAllData}
      />
    </Layout>
  );
};

export default Index;