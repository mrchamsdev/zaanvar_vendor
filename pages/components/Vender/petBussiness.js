import React from "react";
import Image from "next/image";
import styles from "../../../styles/vender/petBussiness.module.css"

const PetBussiness = () => {
  return (
    <div className={styles["container"]}>
      <div className={styles["imageSection"]}>


<Image
   src="https://zaanvar-care.b-cdn.net/media/1759913361995-DogImage.png"
  alt="Furry Friends"
  width={1280}
  height={653}
  className={styles["image"]}
/>


      </div>
      <div className={styles["textSection"]}>

        <h2 className={styles["title"]}>Zaanvar</h2>
        <p className={styles["paragraph"]}>Running a pet business takes more than passion  it needs smart tools to manage bookings, customers, staff, inventory, and marketing. That’s where Zaanvar Vendor Services steps in!</p>

        <p className={styles["paragraph"]}>Through Zaanvar all-in-one platform, vendors will be able to run their business wherever they are. You are giving grooming, boarding services, training services, retail or even veterinary services, our cloud based system ensures that it maintains order, the schedule, payments, reminders and even WhatsApp communication.</p>
        <p className={styles["paragraph"]}>Being a Zaanvar vendor, you are also listed on our own marketplace of exclusive pet services, which will allow pet parents to learn about your services and book them with ease. You no longer have to juggle between numerous tools Zaanvar assists you to be more visible, simplify your operations, and grow revenue.</p>
        <p className={styles["paragraph"]}>Join Zaanvar Vendor Services today and manage your business in a hassle free environment and serve a greater number of customers than before!</p>

       
      </div>
    </div>
  );
};

export default PetBussiness;
