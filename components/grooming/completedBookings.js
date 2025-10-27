import React from "react";
// import styles from "../../styles/pet-sales/mypets.module.css";
import styles from "../../styles/grooming/upcoming.module.css";
// import Sidebar from "./Sidebar";
// import Topbar from "./Topbar";
import { Delete, Edit, View2 } from "@/public/SVG";
import { useRouter } from "next/router";

const CompletedBookings = () => {
  const Router = useRouter();

  //   const handleOnClick = ()=>{
  //     Router.push("/my-pets/view")
  //   }
  const PetData = [
    {
      AppId: "434343",
      OwnerName: "098765",
      PetName: "shubh",
      PetType: "10/05/2025",
      Breed: "Rottweiler",
      Date: "6/89/2002 ",
      time: "6 ",
      status: "Available ",
    },
    {
      AppId: "3232",
      OwnerName: "098765 52869",
      PetName: "Shubh",
      PetType: "10/05/2025",
      Breed: "Rottweiler ",
      Date: "6/89/2002 ",
      time: "6 ",
      status: "Pending ",
    },
    {
      AppId: "2323",
      OwnerName: "098765 52869",
      PetName: "Rottweiler",
      PetType: "10/05/2025",
      Breed: "new ",
      Date: "6/89/2002 ",
      time: "6 ",
      status: "Completed ",
    },
    {
      AppId: "656",
      OwnerName: "098765 52869",
      PetName: "Rottweiler",
      PetType: "10/05/2025",
      Breed: "new ",
      Date: "6/89/2002 ",
      time: "6 ",
      status: "Cancelled ",
    },
    {
      AppId: "erte45354",
      OwnerName: "098765 52869",
      PetName: "Rottweiler",
      PetType: "10/05/2025",
      Breed: "new ",
      Date: "6/89/2002 ",
      time: "6 ",
      status: "Cancelled ",
    },
    {
      AppId: "erte45354",
      OwnerName: "098765 52869",
      PetName: "Rottweiler",
      PetType: "10/05/2025",
      Breed: "new ",
      Date: "6/89/2002 ",
      time: "6 ",
      status: "Completed ",
    },
  ];
  

  // Buttons for Topbar
  const buttons = [
    { label: "+ Add Rooms", color: "purple" }, //! Color Coming from Styles
    { label: "+ Add Bookings", color: "red" },
    { label: "+ Add More", color: "gray" },
  ];

  return (
    <>
      {/* Pass the array directly as prop */}
      {/* <Topbar buttons={buttons} /> */}

      <div className={styles["tableRow2"]}>
        <p>APP ID</p>
        <p>OWNER NAME</p>
        <p>PET NAME</p>
        <p>PET TYPE</p>
        <p>BREED</p>
        <p>DATE</p>
        <p>TIME</p>
        <p>PAYMENT STATUS</p>
      </div>

      {PetData.map((pet, index) => (
        <div key={index} className={styles.tableRow}>
          {/* <img src={pet.img} alt={pet.breed} className={styles.petImage} /> */}
          <p>{pet.AppId}</p>
          <p>{pet.OwnerName}</p>
          <p>{pet.PetName}</p>
          <p>{pet.PetType}</p>
          <p>{pet.Breed}</p>
          <p>{pet.Date}</p>
          <p>{pet.time}</p>
          <p className={styles["status"]}>{pet.status}</p>
          <div className={styles["edit-container"]}></div>
          {" "}
        </div>
      ))}
    </>
  );
};

export default CompletedBookings;
