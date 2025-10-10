import Image from 'next/image'
import React, { useState } from 'react'
import styles from "../../../styles/vender/servicesWeOffer.module.css"
import { useRouter } from 'next/router'



// Use Number Format for Adding number
const mainImages = [
    // Taining
  {
    src: "https://zaanvar-care.b-cdn.net/media/1759898702650-Group 1000012692.png",
    text: "BOOK YOUR TICKETS TO ENJOY ",
    para:"Identify professional pet trainers specializing in obedience, correction of behavior and socialization. Our trainers inspire the best in each pet, whether puppy or an adult companion using the positive reinforcement techniques. Your sessions are tailored to the needs of your pet and you will learn to value your bond, enhance communication and gain confidence together.",
  },
//   Breeders 
  {
    src: "https://zaanvar-care.b-cdn.net/media/1759902364137-Sales.png",
     text: "BOOK YOUR TICKETS TO ENJOY ",
    para:"Get in touch with proven and responsible breeders that focus on health and care as well as on ethical breeding. All breeders at our site take care of pets, love, and care in a transparent environment. Adoption, partnership or need to grow your kennel, find reputable breeders who are passionate about pets and responsible pet ownership",
  },
//   Meeting
  {
    src: "https://zaanvar-care.b-cdn.net/media/1759902401960-Mating2.png",
    text: "BOOK YOUR TICKETS TO ENJOY ",
    para:"Easily and confidently find the right match to your pet. We match breeders and owners of pets in safe, ethical, and transparent matings. We have healthy practices of pairing which ensure genetic variation and breed standardization. Proper relationships ensure that each and every match is worthy and fruitful both to the pets and owners.",
  },
  
//!   Photographer

  // {
  //   src: "https://zaanvar-care.b-cdn.net/media/1759898702657-Group 1000012699.png",
  //  text: "BOOK YOUR TICKETS TO ENJOY ",
  //   para:"The most beautiful moments in the life of your pet can be captured by the professional photographers who know animals. Whether it is playful portraits or capturing some of the most candid shots of your pet, they are able to bring out the individuality in them. The comfort, patience and creativity of each photo session make your pet charming become the unforgettable memories you will enjoy all your life.",
  // },
//   Clinic
  {
    src: "https://zaanvar-care.b-cdn.net/media/1759903036265-Clinic2.png",
    text: "BOOK YOUR TICKETS TO ENJOY",
    para:"Access to reliable veterinary clinics where you can get expert medical care on your pets. Regular checkups and emergency care are just but a few examples of how the experienced vets offer compassionate and professional services. It is your health and well-being that are important first whether it is the preventive care, diagnostic, or surgery. Quality healthcare has become accessible and nearer than ever.",
  },
//   Grooming
  {
    src: "https://zaanvar-care.b-cdn.net/media/1759903008144-Grooming2.png",
    text: "BOOK YOUR TICKETS TO ENJOY",
    para:"Maintain pets in good condition through professional grooming services. All breeds are provided with bathing, trimming, nail clipping, and hygiene services offered by professional groomers. Comfort and cleanliness are guaranteed in every session, and pets will be refreshed and happy. Frequent grooming will keep the skin healthy, shiny, and confident-looking.",
  },

//   Blood Bank 
  {
    src: "https://zaanvar-care.b-cdn.net/media/1759902395433-BloodBank2.png",
   text: "BOOK YOUR TICKETS TO ENJOY",
    para:"Establish contact with recognized blood organizations and donors of bloodshed. With our network, we can get you to life-saving blood at the time when your pet needs it the most. You may also sign your pet to be a donor and assist the needy. Every dollar is important - united we can make a community that can save lives, one drop at a time.",
  },
//!   NGOs
  // {
  //   src: "https://zaanvar-care.b-cdn.net/media/1759902395433-BloodBank2.png",
  //   text: "BOOK YOUR TICKETS TO ENJOY",
  //   para:"Identify and fund NGOs that focus on animal rescue and adoption as well as welfare. These charities strive hard to attend to the lost, injured, and homeless pets. You may volunteer, give a donation, or cooperate to make a difference. Work side by side with reputable NGOs and build a better world with all the pets in need.",
  // },

//!   Day Care
  {
    src: "https://zaanvar-care.b-cdn.net/media/1759903073537-DayCare2.png",
    text: "BOOK YOUR TICKETS TO ENJOY",
    para:"When you are out of town, provide your pets with a safe and loving environment. Professional daycare provides social facilities, rest and play under professionally trained supervision. Pets have a good time there, as every facility has comfort and companionship at the core of them. Be stress free knowing that your furry friend is in caring hands throughout the day.",
  },
//!   Location 
  {
    src: "https://zaanvar-care.b-cdn.net/media/1759903400688-Location2.png",
    text: "BOOK YOUR TICKETS TO ENJOY",
    para:"The smart location based search of Zaanvar helps locate nearby pet services without difficulties. You can find a trusted provider of the trainer, groomer, vet, or even store, and we assist you in it and help find the nearest one. Spend less time and effort and get access to quality services. Caring about pets will be quicker, easier, and accessible at all times and all locations."
  },
//!   Events
  {
    src: "https://zaanvar-care.b-cdn.net/media/1759902372815-Event2.png",
   text: "BOOK YOUR TICKETS TO ENJOY",
    para:"Be in touch with all the current pet events, shows, and neighborhood events. Find adoption drives and workshops and awareness programs in your area. They combine professional people, enthusiasts, and pet owners in order to exchange knowledge and happiness. Get to know and love pets, and enjoy yourself growing in an active and a loving environment."
  },

//!   E-commerse Not Done
  // {
  //   src: "https://zaanvar-care.b-cdn.net/media/1759898702657-Group 1000012699.png",
  //   text: "BOOK YOUR TICKETS TO ENJOY",
  //   para:"The ecommerce site by Zaanvar helps shoppers compare prices of pet products in reputable online shops. Get the best offers on food, toys, grooming and accessories all under one roof. Saving money and time and yet getting your pet quality products. Make the world easier: all your pet requires is incorporated into one and simple."
  // },
]

// Use Numbering Format for the Image Adding 
const thumbnails = [
  { src: "https://zaanvar-care.b-cdn.net/media/1759901324934-taining.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901313634-breeder.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901304871-Mating.png" },


  //! PhotoGrapher
  // { src: "https://zaanvar-care.b-cdn.net/media/1759901266144-Photographer.png" },

  { src: "https://zaanvar-care.b-cdn.net/media/1759901252129-Clinic.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901245184-Grooming.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901751033-Blood Bank.png" },

  //!  NGOS 
    // { src: "https://zaanvar-care.b-cdn.net/media/1759901679110-Ngo.png" },
      
  { src: "https://zaanvar-care.b-cdn.net/media/1759903182406-DayCare.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901210828-Location.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901204786-Events.png" },

  // { src: "https://zaanvar-care.b-cdn.net/media/1759901194355-E-commerce.png" },

 
]

const ServicesWeOffer = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const buttonColors = [
  "#f5790c",
  "#BA68C8",
  "#8B6F44",
  "#6f42c1",
  "#DAB500",
  "#00CB87",
  "#7661A0",
  "#8b4513",
  "#BA2E02",
  "#36B500",
  "#00ACFF",
  "#dc143c"
];

const Router= useRouter();

const handleClick = ()=>{
Router.push("/book-demo")
}

  return (
    <>
      <div className={styles["header-div"]}>
        <h3 className={styles["title-header"]}>SERVICES</h3>
        <p className={styles["below-text"]}>We Offered</p>
      </div>

      {/* Main Image */}
      <div className={styles["image-container"]}>
        <Image
          src={mainImages[activeIndex].src}
          alt="Main Image"
          fill
          className={styles.image}
        />
        <div className={styles["overlay-text"]}>

         <h3 className={styles["header-title"]}>{mainImages[activeIndex].text} <span
  className={styles["text-color"]}
  style={{ color: buttonColors[activeIndex] }}
>
WITH YOUR PETS
</span>
 </h3> 

          <p className={styles["para"]}>
           {mainImages[activeIndex].para} </p>
            
<button onClick={handleClick}
  className={styles["button-div"]}
  style={{ backgroundColor: buttonColors[activeIndex] }}
>
 Register
</button>
        </div>
      </div>

      {/* Thumbnails */}
     <div className={styles["thumbnails"]}>
  {thumbnails.map((thumb, idx) => (
    <div
      key={idx}
      className={`${styles["thumbnail"]} ${activeIndex === idx ? styles.active : ""}`}
      onClick={() => setActiveIndex(idx)}
    >
      <Image src={thumb.src} alt={`Thumbnail ${idx}`} width={100} height={100} />
      <div className={styles["dash"]}></div>  {/* dash outside image */}
    </div>
  ))}
</div>

    </>
  )
}

export default ServicesWeOffer
