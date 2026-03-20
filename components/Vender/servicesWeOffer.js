
import Image from 'next/image'
import React, { useState } from 'react'
import styles from "../../styles/vender/servicesWeOffer.module.css"
import { useRouter } from 'next/router'

/* ── Service data ───────────────────────────────────────────── */
const mainImages = [
  // Training
  {
    name: "Training",
    url: "/coming-soon/training",
    src: "https://zaanvar-care.b-cdn.net/media/1759898702650-Group 1000012692.png",
    text: "BOOK YOUR APPOINTMENTS TO ENJOY ",
    para: "Identify professional pet trainers specializing in obedience, correction of behavior and socialization.",
    span: "Our trainers inspire the best in each pet, whether puppy or an adult companion using the positive reinforcement techniques. Your sessions are tailored to the needs of your pet and you will learn to value your bond, enhance communication and gain confidence together.",
  },
  // Breeders
  {
    name: "Breeders",
    url: "/coming-soon/breeders",
    src: "https://zaanvar-care.b-cdn.net/media/1759902364137-Sales.png",
    text: "BOOK YOUR APPOINTMENTS TO ENJOY ",
    para: "Get in touch with proven and responsible breeders that focus on health and care as well as on ethical breeding.",
    span: "All breeders at our site take care of pets, love, and care in a transparent environment. Adoption, partnership or need to grow your kennel, find reputable breeders who are passionate about pets and responsible pet ownership.",
  },
  // Mating
  {
    name: "Mating",
    url: "/coming-soon/mating",
    src: "https://zaanvar-care.b-cdn.net/media/1759902401960-Mating2.png",
    text: "BOOK YOUR APPOINTMENTS TO ENJOY ",
    para: "Easily and confidently find the right match to your pet. We match breeders and owners of pets in safe, ethical, and transparent matings.",
    span: "We have healthy practices of pairing which ensure genetic variation and breed standardization. Proper relationships ensure that each and every match is worthy and fruitful both to the pets and owners.",
  },
  // Clinic
  {
    name: "Clinic",
    url: "/coming-soon/clinic",
    src: "https://zaanvar-care.b-cdn.net/media/1759903036265-Clinic2.png",
    text: "BOOK YOUR APPOINTMENTS TO ENJOY",
    para: "Access to reliable veterinary clinics where you can get expert medical care on your pets. Regular checkups and emergency care are just but a few examples of how the experienced vets offer compassionate and professional services.",
    span: "It is your health and well-being that are important first whether it is the preventive care, diagnostic, or surgery. Quality healthcare has become accessible and nearer than ever.",
  },
  // Grooming
  {
    name: "Grooming",
    url: "/coming-soon/grooming",
    src: "https://zaanvar-care.b-cdn.net/media/1759903008144-Grooming2.png",
    text: "BOOK YOUR APPOINTMENTS TO ENJOY",
    para: "Maintain pets in good condition through professional grooming services. All breeds are provided with bathing, trimming, nail clipping, and hygiene services offered by professional groomers.",
    span: "Comfort and cleanliness are guaranteed in every session, and pets will be refreshed and happy. Frequent grooming will keep the skin healthy, shiny, and confident-looking.",
  },
  // Blood Bank
  {
    name: "Blood Bank",
    url: "/coming-soon/blood-bank",
    src: "https://zaanvar-care.b-cdn.net/media/1759902395433-BloodBank2.png",
    text: "BOOK YOUR APPOINTMENTS TO ENJOY",
    para: "Establish contact with recognized blood organizations and donors of bloodshed. With our network, we can get you to life-saving blood at the time when your pet needs it the most.",
    span: "You may also sign your pet to be a donor and assist the needy. Every dollar is important — united we can make a community that can save lives, one drop at a time.",
  },
  // Day Care
  {
    name: "Day Care",
    url: "/coming-soon/day-care",
    src: "https://zaanvar-care.b-cdn.net/media/1759903073537-DayCare2.png",
    text: "BOOK YOUR APPOINTMENTS TO ENJOY",
    para: "When you are out of town, provide your pets with a safe and loving environment. Professional daycare provides social facilities, rest and play under professionally trained supervision.",
    span: "Pets have a good time there, as every facility has comfort and companionship at the core of them. Be stress free knowing that your furry friend is in caring hands throughout the day.",
  },
  // Location
  {
    name: "Location",
    url: "/coming-soon/location",
    src: "https://zaanvar-care.b-cdn.net/media/1759903400688-Location2.png",
    text: "BOOK YOUR APPOINTMENTS TO ENJOY",
    para: "The smart location based search of Zaanvar helps locate nearby pet services without difficulties. You can find a trusted provider of the trainer, groomer, vet, or even store.",
    span: "Spend less time and effort and get access to quality services. Caring about pets will be quicker, easier, and accessible at all times and all locations.",
  },
  // Events
  {
    name: "Events",
    url: "/coming-soon/events",
    src: "https://zaanvar-care.b-cdn.net/media/1759902372815-Event2.png",
    text: "BOOK YOUR APPOINTMENTS TO ENJOY",
    para: "Be in touch with all the current pet events, shows, and neighborhood events. Find adoption drives and workshops and awareness programs in your area.",
    span: "They combine professional people, enthusiasts, and pet owners in order to exchange knowledge and happiness. Get to know and love pets, and enjoy yourself growing in an active and a loving environment.",
  },
]

/* ── Thumbnail images (order matches mainImages) ──────────── */
const thumbnails = [
  { src: "https://zaanvar-care.b-cdn.net/media/1759901324934-taining.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901313634-breeder.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901304871-Mating.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901252129-Clinic.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901245184-Grooming.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901751033-Blood Bank.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759903182406-DayCare.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901210828-Location.png" },
  { src: "https://zaanvar-care.b-cdn.net/media/1759901204786-Events.png" },
]

const buttonColors = [
  "#f5790c", "#BA68C8", "#8B6F44", "#6f42c1", "#DAB500",
  "#00CB87", "#7661A0", "#8b4513", "#BA2E02",
]

/* ═══════════════════════════════════════════════════════════ */
const ServicesWeOffer = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const Router = useRouter()

  const activeColor = buttonColors[activeIndex] || "#f5790c"
  const activeService = mainImages[activeIndex]

  return (
    <>
      <div className={styles["header-div"]}>
        <h3 className={styles["title-header"]}>SERVICES</h3>
        <p className={styles["below-text"]}>We Offered</p>
      </div>

      {/* Content Wrapper to swap order on mobile */}
      <div className={styles.contentWrapper}>
        {/* Main Image */}
        <div className={styles["image-container"]}>
          <Image
            src={activeService.src}
            alt={activeService.name}
            fill
            className={styles.image}
          />
          <div className={styles["overlay-text"]}>
            <h3 className={styles["header-title"]}>
              {activeService.text}{" "}
              <span className={styles["text-color"]} style={{ color: activeColor }}>
                WITH YOUR PETS
              </span>
            </h3>

            <p className={styles["para"]}>
              {activeService.para}{" "}
              <span className={styles["span-data"]}>{activeService.span}</span>
            </p>

            {/* Button row */}
            <div style={{ display: "flex", gap: "clamp(8px,1vw,14px)", flexWrap: "wrap", marginTop: "clamp(12px,1.5vh,20px)" }}>
              {/* Register */}
              <button
                onClick={() => Router.push("/contact-us")}
                className={styles["button-div"]}
                style={{ backgroundColor: activeColor }}
              >
                Register
              </button>

              {/* Explore service → Coming Soon */}
              <button
                onClick={() => Router.push(activeService.url)}
                className={styles["button-div"]}
                style={{
                  backgroundColor: "transparent",
                  border: `2px solid ${activeColor}`,
                  color: `${activeColor}`,
                }}
              >
                Explore {activeService.name} →
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div className={styles["thumbnails"]}>
          {thumbnails.map((thumb, idx) => (
            <div
              key={idx}
              className={`${styles["thumbnail"]} ${activeIndex === idx ? styles.active : ""}`}
              onClick={() => setActiveIndex(idx)}
              title={mainImages[idx]?.name}
              style={{ cursor: "pointer" }}
            >
              <Image src={thumb.src} alt={mainImages[idx]?.name || `Service ${idx + 1}`} width={100} height={100} />
              <div className={styles["dash"]} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ServicesWeOffer
