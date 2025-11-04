import React from "react";
import Header from "@/components/header/header";
import PetBusinessForm from "@/components/register/PetBusinessForm";
import SimplyAndGrow from "@/components/register/simplyAndGrow";
import FooterCom from "@/components/Footer/FooterCom";
import Head from "next/head";

const BookDemo = () => {
  return (
    <>

      <Head>
        {/* Basic SEO */}
        <title>Book a Free Demo | Zaanvar Business</title>
        <meta
          name="description"
          content="Book a free demo with Zaanvar Business and discover how our platform helps pet vendors, breeders, and service providers automate and grow their businesses effortlessly."
        />
        <meta
          name="keywords"
          content="book demo, zaanvar business demo, pet vendor registration, pet business management, free pet business portal, pet automation tools"
        />
        <meta name="author" content="Zaanvar" />

        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://business.zaanvar.com/book-demo" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://business.zaanvar.com/book-demo" />
        <meta property="og:title" content="Book a Free Demo | Zaanvar Business" />
        <meta
          property="og:description"
          content="Schedule your free demo with Zaanvar Business — the all-in-one platform for pet vendors to manage and grow their business online."
        />
        <meta
          property="og:image"
          content="https://zaanvarprods3.b-cdn.net/media/1760772673169-zaanvar.png"
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://business.zaanvar.com/book-demo" />
        <meta name="twitter:title" content="Book a Free Demo | Zaanvar Business" />
        <meta
          name="twitter:description"
          content="Book your free demo today and see how Zaanvar Business helps pet vendors automate and scale — 100% free to use."
        />
        <meta
          name="twitter:image"
          content="https://zaanvarprods3.b-cdn.net/media/1760772673169-zaanvar.png"
        />
      </Head>

      <Header />
      <PetBusinessForm />
      <SimplyAndGrow />
      <FooterCom />
    </>
  );
};

export default BookDemo;
