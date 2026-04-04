import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import MyPets from "@/components/pet-sales/myPets";
import MyPuppins from "@/components/pet-sales/myPuppins";
import AddNewPetPopup from "@/components/pet-sales/AddNewPetPopup";
import useStore from "@/components/state/useStore";
import AddNewPuppyPopup from "@/components/pet-sales/AddNewPuppyPopUp";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import { useRouter } from "next/router";
import popupStyles from "../../styles/pet-sales/popup.module.css";
import { createPortal } from "react-dom";

export default function PetSalesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Pets");
  const [petData, setPetData] = useState([]);
  const [puppyData, setPuppyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  // Expose popup state so global topbar can trigger it
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  const [isAddPuppyOpen, setIsAddPuppyOpen] = useState(false);

  const { getJwtToken } = useStore();

  // Sync tab with URL
  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  useEffect(() => {
    fetchActiveData();
  }, [activeTab]);

  const fetchActiveData = async () => {
    const jwttoken = getJwtToken();
    if (!jwttoken) return;

    const webApi = new WebApimanager(jwttoken);
    setLoading(true);

    try {
      if (activeTab === "Pets") {
        const response = await webApi.get(`vendorPetProfile/myPets`);
        setPetData(response?.data?.data || []);
      } else {
        const response = await webApi.get(`vendorPetSales/myPuppies`);
        setPuppyData(response?.data?.data || []);
      }
    } catch {
      console.error("error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleTopbarAction = (action) => {
    if (action === "addPet") setIsAddPetOpen(true);
    if (action === "addPuppy") setIsAddPuppyOpen(true);
  };

  const activeButtons =
    activeTab === "Pets"
      ? [
        // { label: "+ Add Rooms", color: "purple", action: "addRoom" },
        { label: "+ Add Pet", color: "red", action: "addPet" },
        // { label: "+ Add More", color: "gray", action: "addMore" },
      ]
      : [
        // { label: "+ Add Rooms", color: "purple", action: "addRoom" },
        { label: "+ Add Puppy", color: "red", action: "addPuppy" },
        // { label: "+ Add More", color: "gray", action: "addMore" },
      ];

  return (
  <DashboardLayout topbarButtons={activeButtons} onTopbarAction={handleTopbarAction}>
    <div style={{ padding: "clamp(16px,2vw,32px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#111", margin: 0 }}>
          {activeTab === "Pets" ? "Pet Sale's List View" : "Puppy Sale's List View"}
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Loading data...</div>
      ) : activeTab === "Pets" ? (
       <MyPets
          pets={petData}
          isAddPopupOpen={isAddPetOpen}
          setIsAddPopupOpen={setIsAddPetOpen}
          setEditingPet={setEditingPet}  
       />
      ) : (
        <MyPuppins 
          pets={puppyData} 
          showForm={isAddPuppyOpen} 
          setShowForm={setIsAddPuppyOpen} 
          setEditingPet={setEditingPet}
          editingPet={editingPet}
          refreshPets={fetchActiveData}
        />
      )}
    </div>

    {/* Fullscreen Popup using React Portal */}
    {isAddPetOpen &&
  createPortal(
    <div className={popupStyles.popupOverlay}>
      <div className={popupStyles.popupContainer}>
        <div className={popupStyles.popupCard}>
          <AddNewPetPopup
            closePopup={() => {
              setIsAddPetOpen(false);
              setEditingPet(null);
            }}
            petData={editingPet}
          />
        </div>
      </div>
    </div>,
    document.body
  )}

    {isAddPuppyOpen &&
  createPortal(
    <div className={popupStyles.popupOverlay}>
      <div className={popupStyles.popupContainer}>
        <div className={popupStyles.popupCard}>
          <AddNewPuppyPopup
            closePopup={() => {setIsAddPuppyOpen(false);
              setEditingPet(null);
            }}
            petData={editingPet}
          />
        </div>
      </div>
    </div>,
    document.body
  )}
  </DashboardLayout>
);
}


