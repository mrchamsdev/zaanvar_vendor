import { useState, useEffect } from "react";
import styles from "../../../styles/vender/vender.module.css";

const categories = [
  { title: "Breeders", img: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?cs=srgb&dl=pexels-chevanon-1108099.jpg&fm=jpg", tagline: "Short tagline under each category" },
  { title: "Photographer", img: "https://zaanvar-care.b-cdn.net/media/1759826497755-Group 1000011989.png", tagline: "Short tagline under each category" },
  { title: "Trainers", img: "https://images.squarespace-cdn.com/content/v1/54822a56e4b0b30bd821480c/45ed8ecf-0bb2-4e34-8fcf-624db47c43c8/Golden+Retrievers+dans+pet+care.jpeg", tagline: "Short tagline under each category" },
  { title: "Mating", img: "https://media.istockphoto.com/id/1252455620/photo/golden-retriever-dog.jpg?s=612x612&w=0&k=20&c=3KhqrRiCyZo-RWUeWihuJ5n-qRH1MfvEboFpf5PvKFg=", tagline: "Short tagline under each category" },
  { title: "Extra 1", img: "https://www.treehugger.com/thmb/NUlijZHVHyNSSmuz0zCvO-CrAeA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__mnn__images__2017__05__largest-dog-breeds-new-c650038edfa14695b3c93fa16918c296.jpg", tagline: "Short tagline under each category" },
  { title: "Extra 2", img: "https://zaanvar-care.b-cdn.net/media/1759826497755-Group 1000011989.png", tagline: "Short tagline under each category" },
  { title: "Extra 3", img: "https://zaanvar-care.b-cdn.net/media/1759826497755-Group 1000011989.png", tagline: "Short tagline under each category" },
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
        {categories.map((_, idx) => (
          <span
            key={idx}
            className={`${styles.dot} ${currentIndex === idx ? styles.dotActive : ""}`}
          />
        ))}
      </div>
    </div>



      </>
  );
}
