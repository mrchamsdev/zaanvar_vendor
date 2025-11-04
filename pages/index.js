import Head from "next/head";
import style from "../styles/Home.module.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SliderImage from "@/components/Vender/SliderImage";
import WeManageBussiness from "@/components/Vender/WeManageBussiness";
import ServicesWeOffer from "@/components/Vender/servicesWeOffer";
import AutomationTools from "@/components/Vender/AutoMationTools";
import PetBussiness from "@/components/Vender/petBussiness";
import ChooseUs from "@/components/Vender/chooseUs";
import FrequentlyQuastion from "@/components/Vender/frequentlyQuastion";
import Header from "@/components/header/header";
import FooterCom from "@/components/Footer/FooterCom";
import useStore from "@/components/state/useStore";

export default function Home() {
  const router = useRouter();
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();

  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);





  // ✅ Only run on client
  useEffect(() => {
    setIsClient(true);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isClient && jwt) {
      router.replace("/pet-sales"); 
    }
  }, [isClient, jwt, router]);


  if (!isClient) return null;


  if (jwt) return null;


  return (
    <div>
     <Head>
  {/* Basic SEO */}
  <title>Zaanvar Business | Free Portal for Pet Vendors</title>
  <meta
    name="description"
    content="Zaanvar Business is a free portal for pet vendors, breeders, clinics, trainers, and all pet service providers. Manage and grow your business easily — 100% free to use."
  />
  <meta
    name="keywords"
    content="pet vendors, pet business, pet breeders, pet clinics, pet trainers, zaanvar, zaanvar business, pet services, free vendor portal, pet marketplace"
  />
  <meta name="author" content="Zaanvar" />

  {/* Canonical URL */}
  <link rel="canonical" href="https://business.zaanvar.com/" />

  {/* Open Graph / Facebook */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://business.zaanvar.com/" />
  <meta
    property="og:title"
    content="Zaanvar Business | Free Portal for Pet Vendors"
  />
  <meta
    property="og:description"
    content="Join Zaanvar Business — a free platform designed for pet vendors, breeders, and service providers. Manage your pet business effortlessly and grow your reach."
  />
  <meta
    property="og:image"
    content="https://zaanvarprods3.b-cdn.net/media/1760772673169-zaanvar.png"
  />

  {/* Twitter Card */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://business.zaanvar.com/" />
  <meta
    name="twitter:title"
    content="Zaanvar Business | Free Portal for Pet Vendors"
  />
  <meta
    name="twitter:description"
    content="Zaanvar Business helps pet vendors, breeders, and service providers manage their businesses — completely free to use."
  />
  <meta
    name="twitter:image"
    content="https://zaanvarprods3.b-cdn.net/media/1760772673169-zaanvar.png"
  />
</Head>


      <Header />

      <div className={style["image-wrapper"]}>
        {!isMobile && (
          <Image
            src="https://zaanvar-care.b-cdn.net/media/1759815026083-Frame%201261154195.png"
            alt="Banner"
            fill
            style={{ objectFit: "cover" }}
          />
        )}

        <div className={style["overlay-text"]}>
          <h1 className={style["main-header"]}>
            <span>Zaanvar</span> is a Free Business Portal for Pet Vendors
          </h1>
          <p className={style["below-text"]}>
            Exclusively for breeders, clinics, trainers, and all pet service providers.  
            Free to use. No hidden fees.
          </p>
          <button className={style["register-button"]} onClick={() => router.push("/book-demo")}>
            Register Today
          </button>
        </div>
      </div>

      {/* Components */}
      <SliderImage />
      <WeManageBussiness />
      <ServicesWeOffer />
      <AutomationTools />
      <PetBussiness />
      <ChooseUs />
      <FrequentlyQuastion />
      <FooterCom />
    </div>
  );
}
