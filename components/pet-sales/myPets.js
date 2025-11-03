import React, { useEffect, useState } from "react";
import styles from "../../styles/pet-sales/mypets.module.css";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Delete, Edit, View2 } from "@/public/image/SVG";
import { useRouter } from "next/router";
import Image from "next/image";
import { IMAGE_URL } from "../utilities/Constants";
import ChangeStatus from "./changeStutus"; // ✅ added

const MyPets = ({ pets = [] }) => {
  const router = useRouter();
  const [selectedPet, setSelectedPet] = useState(null);

  // ✅ added for ChangeStatus modal
  const [showChangeStatus, setShowChangeStatus] = useState(false);

  const handleOnClick = () => {
    router.push("/register");
  };

  const handleDelete = (pet) => {
    setSelectedPet(pet);
    setShowChangeStatus(true);
  };

  console.log(pets, "petsmy");

  // Buttons for Topbar
  const buttons = [
    { label: "+ Add Pet", color: "purple", action: "addRoom" }, //! Color Coming from Styles
    { label: "+ Add Bookings", color: "red", action: "addBooking" },
    { label: "+ Add More", color: "gray", action: "addMore" },
  ];

  // ✅ Handler for topbar button clicks
  const handleButtonClick = (action) => {
    if (action === "addRoom") {
      router.push("/register");
    } else if (action === "addBooking") {
      // alert("Add Booking Clicked!");
    } else if (action === "addMore") {
      // alert("Add More Clicked!");
    }
  };

  const { data } = router.query;
  const [pet, setPet] = useState(null);

  useEffect(() => {
    if (data) {
      setPet(JSON.parse(data));
    }
  }, [data]);

  // if (!pet) return <p>Loading pet details...</p>;

  return (
    <>
      {/* Pass the array directly as prop */}
      <Topbar buttons={buttons} onButtonClick={handleButtonClick} />

      <div className={styles["tableRow2"]}>
        <p>Pet Photo</p>
        <p>Pet Id</p>
        <p>Pet Breed</p>
        <p>Age</p>
        {/* <p>Breeding Time</p> */}
        <p>Action</p>
      </div>

      {pets.map((pet, index) => (
        <div key={index} className={styles.tableRow}>
          {/* <img
            src={pet.img}
            alt={pet.breed}
            className={styles.petImage}
          /> */}
          <Image
            src={
              pet?.petImage
                ? `${IMAGE_URL}${pet?.petImage}`
                : `https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg`
            }
            alt={pet.petName}
            className={styles["petImage"]}
            height={70}
            width={70}
          />
          <p>{pet.id}</p>
          <p>{pet.breed}</p>
          <p>{pet.petAge}</p>
          {/* <p>{pet.time}</p> */}
          <div className={styles["edit-container"]}>
            <div
              className={styles["edit"]}
              onClick={() =>
                router.push({
                  pathname: "/register",
                  query: { data: JSON.stringify(pet) }, // ✅ fixed (was pets)
                })
              }
            >
              <Edit />
            </div>

            {/* <div
              className={styles["view"]}
              onClick={() => {
                router.push({
                  pathname: "my-pets/view",
                  // query: { data: JSON.stringify(pet) },
                });
              }}
            >
              <View2 />
            </div> */}
            <div
              className={styles["view"]}
              onClick={() =>
                router.push({
                  pathname: "/my-pets/view",
                  query: { data: JSON.stringify(pet) },
                })
              }
            >
              <View2 />
            </div>

            <div className={styles["delete"]}>
              <Delete onClick={() => handleDelete(pet)} /> {/* ✅ fixed (was pets) */}
            </div>
          </div>
        </div>
      ))}

      {/* ✅ Change Status Modal */}
      {showChangeStatus && selectedPet && (
        <ChangeStatus
          pet={selectedPet}
          onClose={() => setShowChangeStatus(false)}
          onStatusChange={({ status, details }) => {
            console.log("New status:", status, "details:", details);
            setShowChangeStatus(false);
          }}
        />
      )}
    </>
  );
};

export default MyPets;
