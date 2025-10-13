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

const AboutUs = () => {
  return (
    <>
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
