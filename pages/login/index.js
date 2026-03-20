import SignIn from '../../components/signin/signin'
// import Signup from '@/components/SignIn/signup'
import React, { useEffect, useState } from 'react'
import styles from "../../styles/login/signin.module.css"
// import { SchemaData } from '@/components/Utilities/SchemaData';
import Head from "next/head";
const Index = () => {
  const [currentPage, setCurrentPage] = useState('signin');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState('');
    const [canonicalUrl, setCanonicalUrl] = useState("");
     useEffect(() => {
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("utm_source");
          url.searchParams.delete("utm_medium");
          url.searchParams.delete("utm_campaign");
          url.searchParams.delete("utm_term");
          url.searchParams.delete("utm_content");
          setCanonicalUrl(url.origin + url.pathname);
        }
      }, []);
  
  const handlePageTransition = (page) => {
    setIsAnimating(true);
    setAnimationType(page === 'signup' ? 'animate' : 'animateReverse');
    
    // First phase of animation
    setTimeout(() => {
      setCurrentPage(page);
      
      // Second phase
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType('');
      }, 1200); // Match animation duration
    }, 600); // Half of animation duration
  };

  return (
    <>  <Head>
            {/* <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredJson) }}
            /> */}
    
            <title>Sign In | Zaanvar – Pet Sales, Genie & Pet Services</title>
            <meta
              name="description"
              content="Sign in to your Zaanvar account to explore pet names, sales, matchmaking, and more – your trusted pet care platform."
            />
            <meta
              name="keywords"
              content="zaanvar sign in, pet account login, pet care platform, pet name generator, pet sales, pet matchmaking"
            />
            <link rel="canonical" href={canonicalUrl} />
    
            {/* Open Graph Meta */}
            <meta property="og:title" content="Sign In | Zaanvar" />
            <meta
              property="og:description"
              content="Access your Zaanvar account to manage your pet care services and explore personalized recommendations."
            />
            <meta property="og:url" content={canonicalUrl} />
            <meta
              property="og:image"
              content="https://zaanvarprods3.b-cdn.net/media/1760772673169-zaanvar.png"
            />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="Zaanvar" />
    
            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Sign In | Zaanvar" />
            <meta
              name="twitter:description"
              content="Login to Zaanvar to access pet care tools, matchmaking, pet naming, and e-commerce features."
            />
            <meta
              name="twitter:image"
              content="https://zaanvarprods3.b-cdn.net/media/1760772673169-zaanvar.png"
            />
          </Head>
    <div className={styles.pageContainer}>
      <div 
        className={`${styles.backgroundTransition} ${isAnimating ? styles[animationType] : ''}`} 
      />
      <div className={isAnimating ? styles.componentFade : ''}>
        {/* {currentPage === 'signin' ? ( */}
          <SignIn onSignUpClick={() => handlePageTransition('signup')} />
        {/* ) : (
          <Signup onSignInClick={() => handlePageTransition('signin')} />
        )} */}
      </div>
    </div>
    </>
  );
};

// SSG (Static Site Generation) - Static login page
export async function getStaticProps() {
  return {
    props: {},
  };
}

export default Index;