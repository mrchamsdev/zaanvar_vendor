import React from "react";
import FooterCom from "@/components/Footer/FooterCom";
import Header from "@/components/header/header";
import BannerAbout from "@/components/about-us/bannerAbout";
import BannerComponent from "@/components/about-us/BannerComponent";
import Ourstory from "@/components/about-us/ourStory";
import OurMission from "@/components/about-us/ourMission";
import OurValue from "@/components/about-us/ourValue";
import OurFounder from "@/components/about-us/outFounder";
import FAQ from "@/components/about-us/FAQ";
import BannerPhoto from "@/components/about-us/bannerPhoto";
import Head from "next/head";

const AboutUs = () => {
  return (
    <>
     <Head>
        {/* Basic SEO */}
        <title>About Us | Zaanvar Business</title>
        <meta
          name="description"
          content="Learn more about Zaanvar Business — a free online platform empowering pet vendors, breeders, and service providers to manage and grow their businesses with automation tools."
        />
        <meta
          name="keywords"
          content="about Zaanvar, pet vendor platform, pet business management, about Zaanvar Business, pet marketplace, pet service provider tools"
        />
        <meta name="author" content="Zaanvar" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://business.zaanvar.com/about-us" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://business.zaanvar.com/about-us" />
        <meta property="og:title" content="About Us | Zaanvar Business" />
        <meta
          property="og:description"
          content="Zaanvar Business is a platform built for pet vendors and service providers — discover our mission, values, and story."
        />
        <meta
          property="og:image"
          content="https://zaanvarprods3.b-cdn.net/media/1760772673169-zaanvar.png"
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://business.zaanvar.com/about-us" />
        <meta name="twitter:title" content="About Us | Zaanvar Business" />
        <meta
          name="twitter:description"
          content="Learn more about Zaanvar Business, our story, mission, and the team dedicated to helping pet vendors thrive online."
        />
        <meta
          name="twitter:image"
          content="https://zaanvarprods3.b-cdn.net/media/1760772673169-zaanvar.png"
        />
      </Head>
      <Header />
      <BannerAbout />
      <BannerComponent />
      <Ourstory />
      <OurMission />
      <OurValue />
      <OurFounder />
      <FAQ />
      <BannerPhoto />
      <FooterCom />
    </>
  );
};

export default AboutUs;
