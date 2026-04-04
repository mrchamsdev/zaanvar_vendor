import Layout from "@/components/pet-sales/layout";
import MyPets from "@/components/pet-sales/myPets";
import useStore from "@/components/state/useStore";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import { BackButton, Calender3, FourDots } from "@/public/images/SVG";
import { useEffect, useState, useCallback, useMemo } from "react";

export default function Index() {
  const { getJwtToken, getUserInfo } = useStore();
  const jwttoken = getJwtToken();
  const webApi = useMemo(() => new WebApimanager(jwttoken), [jwttoken]);

  const [myPetData, setMyPetData] = useState([]);
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: <Calender3 />, path: "/pet-sales" },
    { name: "My Pets", icon: <FourDots />, path: "/my-pets" },
    { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
    { name: "Settings", icon: <Calender3 />, path: "/settings" },
  ];

  const FetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching pets data...");
      const response = await webApi.get(`vendorPetProfile/myPets`);
      console.log("Fetched pets response:", response);
      const pets = response?.data?.data?.pets || [];
      console.log("Pets data count:", pets.length);
      console.log("Pets data:", pets);
      
      // Force a new array reference
      setMyPetData(() => [...pets]);
      
      return pets;
    } catch (error) {
      console.error("Error fetching pets:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [webApi]);

  useEffect(() => {
    FetchAllData();
  }, [FetchAllData]);
const handleAddEditSuccess = async (success) => {
    if (success) {
      setIsAddPopupOpen(false);
      setEditingPet(null);
      
      if (refreshPets) {
        console.log("Refreshing list after add/edit...");
        await refreshPets(); 
      }
    } else {
      setIsAddPopupOpen(false);
      setEditingPet(null);
    }
  };
  const refreshPets = useCallback(async () => {
    console.log("RefreshPets called - fetching fresh data...");
    const freshData = await FetchAllData();
    console.log("Fresh data received:", freshData);
    return freshData;
  }, [FetchAllData]);

  return (
    <Layout
      menuItems={menuItems}
      logoText="Pet Management"
      sidebarToggleButton={<BackButton />}
    >
      <MyPets 
        pets={myPetData} 
        isAddPopupOpen={isAddPopupOpen}
        setIsAddPopupOpen={setIsAddPopupOpen}
        setEditingPet={setEditingPet}
        refreshPets={refreshPets}
        editingPet={editingPet}
        handleAddEditSuccess={handleAddEditSuccess}
      />
    </Layout>
  );
}