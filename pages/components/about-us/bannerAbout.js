import React from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "../../../styles/about/bannerAbout.module.css";
// import BannerComponent from "./BannerComponent";
// import Ourstory from "./Ourstory";
// import OurMission from "./OurMission";
// import OurFounder from "./OurFounder";
// import OurTeam from "./OurTeam";
// import FAQ from "../../styles/about/FAQ";

const BannerAbout = () => {
  return (
    <>
      <Head>
        <title>About Us | Zaanvar - Leading Pet Care Services in India</title>
        <meta
          name="description"
          content="Learn about our services: Discover a wide range of pet services, including grooming, daycare, and boarding, designed to keep your pets happy and healthy."
        />
        <meta name="keywords" content="about us, company, details" />
        <link
          rel="canonical"
          href="https://www.zaanvar.com/about"
        />
        <meta
          property="og:title"
          content="About Us | Zaanvar - Leading Pet Care Services in India"
        />
        <meta
          property="og:description"
          content="Discover our story, mission, and the passionate team behind Zaanvar. Dedicated to delivering top-quality pet care services across India."
        />
        <meta
          property="og:url"
          content="https://www.zaanvar.com/about"
        />
        <meta
          property="og:image"
          content="https://cdn.builder.io/api/v1/image/assets/TEMP/36cfcad6b36251f6cfd91438fce91cf0e6ab5c0d9f5bedc73498f634519828cd?apiKey=3e99c58a56f84e4cb0d84873c390b13e&"
        />
      </Head>

      <div style={{ backgroundColor: "#FFFFFF" }}>
        <section>
          {/* <BannerComponent /> */}
        </section>
        <section>
          {/* <Ourstory /> */}
        </section>
        <section>
          {/* <OurMission /> */}
        </section>
        <section>
          {/* <OurFounder /> */}
        </section>
        <section>
          {/* <OurTeam /> */}
        </section>
        <section>
          {/* <FAQ /> */}
        </section>
      </div>
    </>
  );
};

export default BannerAbout;
