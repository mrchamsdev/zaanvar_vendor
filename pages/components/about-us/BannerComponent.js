import React from 'react'
import styles from "../../../styles/about/bannerComponent.module.css"
const BannerComponent = () => {
  return (
    <div className={styles.bannerContainer}>
        <div className={styles.bannerContent}>
            <div className={styles.bannerTitleContainer}>
                <div className={styles.bannerTitleContent}>
                    <p className={styles.bannerTitle}>Empowering Pet Care</p>
                    <p className={styles.bannerTitle2}>with Innovation and Heart </p>
                    <p className={styles.bannerSubtitle}>
                    Bridging the gap between pets and essential services. 

                    </p>
                    <p className={styles.bannerSubtitle}>
                    Creating a community where every pet is valued and cared for.
                    </p>
                </div>
            </div>

        </div>
      
    </div>
  )
}

export default BannerComponent
