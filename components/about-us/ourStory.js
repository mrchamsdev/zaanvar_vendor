import React, { useEffect, useState } from 'react'
import styles from "../../styles/about/ourStory.module.css"

const Ourstory = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

useEffect(() => {
  if (typeof window !== "undefined") {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 441);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }
}, []);


  return (

        <div className={styles.ourstoryContainer}>
          <div className={styles.mainContent}>
            {/* Triangle SVGs */}
            {/* <div className={styles.triangles}>
              <div className={styles.triangle1}>
                <AboutTriangle1 />
              </div>
              <div className={styles.triangle2}>
                <AboutTriangle2 />
              </div>
            </div> */}

            
            <div className={styles.contentSection}>
              <div className={styles.imageContainer}>
                {/* <img 
                  src="https://zaanvar-care.b-cdn.net/media/1760073363756-OfficeGroup.png" 
                  alt="ourstory"
                  className={styles.storyImage}
                /> */}
              </div>
              <div className={styles.contentWrapper} style={{paddingTop:'10px',
    marginTop: '0px'
   }}>
              <div className={styles.textContent}>
      <h5>Our Story</h5>
      <p>
        Zaanvar was born from a simple yet powerful belief—that every pet deserves love, care, and a forever home. What started as a heartfelt mission among passionate pet lovers has now grown into a thriving community dedicated to making pet lives better.
      </p>

      {(!isMobileView || isExpanded) && (
        <p>
          We realized that pets are more than just companions—they're family. From helping pets find loving homes to supporting pet owners with resources and community events, Zaanvar stands as a bridge between humans and their furry friends.
        </p>
      )}

      {isMobileView && !isExpanded && (
        <button className={styles.readMoreButton} onClick={() => setIsExpanded(true)}>
          Read More
        </button>
      )}
    </div>
              </div>
            </div>
          </div>
        </div>
      
  )
}

export default Ourstory
