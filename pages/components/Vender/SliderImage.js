import { useState, useEffect } from "react";
import styles from "../../../styles/vender/vender.module.css";

const categories = [
  { title: "Breeders", img: "https://zaanvar-care.b-cdn.net/media/1759918986265-breederMan.png", tagline: " Where Responsible Breeding Meets the Right Buyers" },

  { title: "Photographer", img: "https://zaanvar-care.b-cdn.net/media/1759918994438-Photo.png", tagline: "Capturing Paws, Personalities, and Precious Moments" },

  { title: "Trainers", img: "https://zaanvar-care.b-cdn.net/media/1759919001755-tainer.png", tagline: "Short tagline under each category" },

  { title: "Mating", img: "https://zaanvar-care.b-cdn.net/media/1759918981023-matingdog.png", tagline: "Your Trusted Partner in Responsible Pet Matting" },



  { title: "Extra 1", img: "https://zaanvar-care.b-cdn.net/media/1759918973864-doctorGirl.png", tagline: "Short tagline under each category" },

 

];

export default function SliderImage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % categories.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 5 cards to show
  const getVisibleCards = () => {
    const total = categories.length;
    return [
      categories[(currentIndex - 2 + total) % total],
      categories[(currentIndex - 1 + total) % total],
      categories[currentIndex % total],
      categories[(currentIndex + 1) % total],
      categories[(currentIndex + 2) % total],
    ];
  };

  const getPositionClass = (i) => {
    switch (i) {
      case 0: return "farLeft";
      case 1: return "left";
      case 2: return "center";
      case 3: return "right";
      case 4: return "farRight";
      default: return "";
    }
  };

  const visibleCards = getVisibleCards();

  return (


    <>
  

    {/* Image Slider  */}
    <div className={styles.carouselContainer}>
      <div className={styles.header}>
        <p className={styles.headerSubtitle}>WHO CAN JOIN</p>
        <h2 className={styles.headerTitle}>Zaanvar?</h2>
      </div>

      <div className={styles.carouselWrapper}>
        <div className={styles.carouselTrack}>
          {visibleCards.map((category, index) => (
            <div
              key={index}
              className={`${styles.carouselItem} ${styles[getPositionClass(index)]}`}
            >
              <div className={styles.card}>
                <img src={category.img} alt={category.title} />
                <div className={styles.cardContent}>
                  <h3 className={styles["title"]}>{category.title}</h3>
                  <p className={styles["below-text"]}>{category.tagline}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

     <div className={styles.dots}>
  {Array.from({ length: 5 }).map((_, i) => {
    const idx = (currentIndex - 2 + i + categories.length) % categories.length;
    const isCenter = i === 2; // middle one always

    return (
      <span
        key={idx}
        className={`${styles.dot} ${currentIndex === idx ? styles.dotActive : ""} ${isCenter ? styles.dash : ""}`}
      />
    );
  })}
</div>


    </div>



      </>
  );
}
