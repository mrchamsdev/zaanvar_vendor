import React from "react";
import styles from "../../styles/pet-sales/mypets.module.css";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Delete, Edit, View2 } from "@/public/SVG";

const MyPets = () => {
  const PetData = [
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 52869",
      breed:"Rottweiler",
      age:"10/05/2025",
      time:"6 "
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "0984235 52869",
      breed:"weiler",
      age:"10/05/2025",
      time:"26"
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 532369",
      breed:"Rottweiler",
      age:"10/05/2025",
      time:"5"
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 532369",
      breed:"Rottweiler",
      age:"10/05/2025",
      time:"5"
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 532369",
      breed:"Rottweiler",
      age:"10/05/2025",
      time:"5"
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 532369",
      breed:"Rottweiler",
      age:"10/05/2025",
      time:"5"
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 532369",
      breed:"Rottweiler",
      age:"10/05/2025",
      time:"5"
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 532369",
      breed:"Rottweiler",
      age:"10/05/2025",
      time:"5"
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 532369",
      breed:"Rottweiler",
      age:"10/05/2025",
      time:"5"
    },
  ];

  // Buttons for Topbar
  const buttons = [
    { label: "+ Add Rooms", color: "purple" }, //! Color Coming from Styles
    { label: "+ Add Bookings", color: "red" },
    { label: "+ Add More", color:"gray"} 
  ];

  return (
    <>
      {/* Pass the array directly as prop */}
      <Topbar buttons={buttons} />

      <div className={styles["tableRow2"]}>
        <p>Pet Photo</p>
        <p>Pet Id</p>
        <p>Pet Breed</p>
        <p>Age</p>
        {/* <p>Breeding Time</p> */}
        <p>Action</p>
      </div>

      {PetData.map((pet, index) => (
        <div key={index} className={styles.tableRow}>
          <img 
            src={pet.img} 
            alt={pet.breed} 
            className={styles.petImage} 
          />
          <p>{pet.id}</p>
          {/* <p>{pet.breed}</p> */}
          <p>{pet.age}</p>
          <p>{pet.time}</p>
          <div className={styles["edit-container"]}>
            {/* <Edit /> */}
            <View2 />
            {/* <Delete /> */}
          </div>
        </div>
      ))}
    </>
  );
};

export default MyPets;
