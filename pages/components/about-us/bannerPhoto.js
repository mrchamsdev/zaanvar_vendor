import React from "react";
import Image from "next/image";
import styles from "../../../styles/about/bannerPhoto.module.css";

const BannerPhoto = () => {
  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.bannerInner}>
        <div className={styles.bannerImageContainer}>
          <Image
            src="https://zaanvar-care.b-cdn.net/media/1760077370413-CatGroup.png"
            alt="Banner"
            fill
            className={styles.bannerImage}
            priority
          />
          <div className={styles.imageOverlay}></div>
          <div className={styles.overlayText}>
            <div className={styles["overLay-div"]}>

        
            <h1>Join Our Journey</h1>
            <p>
              Be a part of our mission to make the world a better place for
              pets. Here's how you can contribute
            </p>
                </div>
            <div className={styles["Hello"]}>
            <button className={styles["join-us"]}>Join Us</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerPhoto;
