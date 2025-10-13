import React from 'react'
import styles from "../../styles/about/bannerComponent.module.css"
const BannerComponent = () => {
  return (
    <div className={styles.bannerContainer}>
        <div className={styles.bannerContent}>
            <div className={styles.bannerTitleContainer}>
                <div className={styles.bannerTitleContent}>
                    <p className={styles.bannerTitle}>We bring a wealth of experience</p>
                    <p className={styles.bannerTitle2}>from a wide range of background </p>
                    <p className={styles.bannerSubtitle}>
                    Our philosophy is simple: hire great people and give them the 

                    </p>
                    <p className={styles.bannerSubtitle}>
                    resources and support to do their best work. 
                    </p>
                </div>
            </div>

        </div>
      
    </div>
  )
}

export default BannerComponent
