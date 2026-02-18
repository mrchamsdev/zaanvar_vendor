// import "@/styles/globals.css";
// import Head from "next/head";

// export default function App({ Component, pageProps }) {
//   <Head>
//     <link rel="icon" href="/images/favicon.ico" type="image/x-icon" />
//     <meta name="robots" content={"noindex,nofollow"}/>
//     <meta name="language" content="en" />

//   </Head>
//   return <Component {...pageProps} />;
// }
import "@/styles/globals.css";
import Head from "next/head";
import Script from "next/script";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/images/favicon.ico" type="image/x-icon" />
        <meta name="robots" content="noindex,nofollow" />
        <meta name="language" content="en" />
        <title>Zaanvar | Pet Business Portal</title>
      </Head>

    
      <Script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBgYCTEby06dsd0hwEgMlijh4kBfbYeYTo&libraries=places"
        strategy="beforeInteractive"
      />

      <Component {...pageProps} />
    </>
  );
}