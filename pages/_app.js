import "@/styles/globals.css";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  <Head>
    <link rel="icon" href="/images/favicon.ico" type="image/x-icon" />
    <meta name="robots" content={"noindex,nofollow"}/>
    <meta name="language" content="en" />

  </Head>
  return <Component {...pageProps} />;
}
