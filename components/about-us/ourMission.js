
import React from 'react';
// import styles from "../../styles/about/OurMission.module.css"
import styles from "../../styles/about/ourMission.module.css"

const OurMission = () => {
  return (
  
    <div className={styles.missionContainer}>
      <div className={styles.missionContent}>
        <p className={styles.missionTitle}>Our Mission</p>
        <p className={styles.missionText}>
          To create a compassionate ecosystem where pets and their humans can connect, care, and thrive together.
        </p>
        <p className={styles.missionTitle}>Our Vision</p>
        <p className={styles.missionText}>
          To become a global hub for pet welfare, where every pawprint tells a story of love, care, and belonging.
        </p>
      </div>
      <div className={styles.missionImages}>
        <img src="https://zaanvar-care.b-cdn.net/media/1760074050231-missionvisionimage.png" alt="mission-image" className={styles.missionImage} />
      </div>
    </div>
  );
};

export default OurMission;