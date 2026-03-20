import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from "../../styles/footer/mobilefooter.module.css";
import useStore from "../state/useStore";



  const MobileFooter = ({ footerContent = [], handleFooterTabChange,  setActiveFooterTab ,service=""}) => {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState('home');
  const { getJwtToken } = useStore()
  const jwt = getJwtToken();
  const shouldShowFooter = useMemo(() => {
    const path = router.pathname;
    const allowedRoutes = path === '/' || 
                        (!jwt && path === '/tinder') || 
                        (!jwt && path === '/lost-and-found') || 
                        (!jwt &&  path === '/pet-sales') || 
                         path === '/pet-names' || 
                        //  path === '/tail-talk' || 
                        (!jwt &&  path === '/pet-adoption')||
                         path==='/all-favourites'||
                         path==='/terms-conditions'||
                         path==='/ourservices' ||
                        //  path==='/pet-friendly-places'||
                         path==='/privacy-policy'||
                         path==='/about'||
                         path==='/contact-us'||
                         path.startsWith('/blog')||
                        //  path.startsWith('/[slug]')||
                        //  path.startsWith('/author/')||
                         path==='/our-services'||
                         path === '/pet-services' ||
                         path==='/social-media'||
                         path === '/search' ||
                         path.startsWith('/search')

    
    // Only show footer on mobile (screens <= 768px)
    return allowedRoutes;
  }, [router.pathname, jwt]);

  const handleItemClick = (route) => {
    setActiveItem(route);
    router.push(`/${route === 'home' ? '' : route}`);
  };

//   useEffect(() => {
//     // const path = router.pathname === "/" ? "home" : router.pathname.slice(1);
//     // setActiveItem(path);

//     router.push(`/${activeItem === 'home' ? '' : activeItem}`)
//   }, [activeItem]);

  // Prefetch all footer routes when component mounts for faster navigation
  useEffect(() => {
    if (typeof window === "undefined" || !shouldShowFooter) return;

    const prefetchRoutes = () => {
      // Use requestIdleCallback if available, otherwise setTimeout
      const schedulePrefetch = (callback) => {
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
          window.requestIdleCallback(callback, { timeout: 1500 });
        } else {
          setTimeout(callback, 1500);
        }
      };

      schedulePrefetch(async () => {
        try {
          const routesToPrefetch = [];

          // Prefetch routes from footerContent
          footerContent.forEach(item => {
            if (item.to) {
              routesToPrefetch.push(item.to);
            }
          });

          // Prefetch common routes that show the footer
          const commonRoutes = [
            '/',
            '/tinder',
            '/lost-and-found',
            '/pet-sales',
            '/pet-names',
            '/pet-adoption',
            '/all-favourites',
            '/terms-conditions',
            '/ourservices',
            '/privacy-policy',
            '/about',
            '/contact-us',
            '/our-services',
            '/social-media',
            '/pet-services',
          ];

          routesToPrefetch.push(...commonRoutes);

          // Remove duplicates and prefetch all routes
          const uniqueRoutes = [...new Set(routesToPrefetch)];
          await Promise.all(
            uniqueRoutes.map(route => router.prefetch(route).catch(() => {}))
          );
        } catch (error) {
          // Silently fail - prefetching is not critical
        }
      });
    };

    prefetchRoutes();
  }, [router, shouldShowFooter, footerContent]);

  if (!shouldShowFooter) {
    return null;
  }


  return (
    // <div className={styles.mobileFooter}>
    //   <div
    //     className={`${styles.footerItem} ${activeItem === "home" ? styles.active : ''}`}
        
    //   >
    //     <span onClick={() => handleItemClick('home')}>
    //         <HomeIcon size={24} color={activeItem === "home" ? "#1fbfc2" : "white"} />
    //     </span>
    //     <p className={styles.texticon}>Home</p>

    //   </div>

    //   <div
    //     className={`${styles.footerItem} ${activeItem === "our-services" ? styles.active : ''}`}
    //     onClick={() => handleItemClick('our-services')}
    //   >
    //     <div style={{marginBottom:"3px"}}>
    //     <ServicesIcon size={30} color={activeItem === 'our-services' ? "#1FBFC2" : "white"} />
    //     </div>
    //     <p className={styles.texticon}>Services</p>
    //   </div>

    //   <div
    //     className={`${styles.footerItemTailTalk} ${activeItem === 'tail-talk' ? styles.active : ''}`}
    //     onClick={() => handleItemClick('tail-talk')}
    //     style={{ position: "relative" }}
    //   >
    //     <div className={`${styles.ZIcon} ${activeItem === 'tail-talk' ? styles.active : ''}`}>
    //       <span><Zicon color={activeItem === 'tail-talk' ? "#1FBFC2" : "#fff"}/></span>
    //     </div>
    //     <p className={styles.texticon}>Tail Talk</p>
    //   </div>

    //   <div
    //     className={`${styles.footerItemsWrapper} ${activeItem === 'pet-genie' ? styles.active : ''}`}
    //     onClick={() => handleItemClick('pet-genie')}
    //   >
    //     {/* <JournalTextIcon size={24} color={activeItem === 'pet-genie' ? "#1FBFC2" : "#fff"} /> */}
    //     <TbLanguageKatakana size={30} color={activeItem === 'pet-genie' ? "#1FBFC2" : "#fff"} />
    //     <p className={styles.texticon}>Pet Genie</p>

    //   </div>

    //   <div
    //     className={`${styles.footerItemBag} ${activeItem === 'pet-friendly-places' ? styles.active : undefined}`}
    //     onClick={() => handleItemClick('pet-friendly-places')}
    //   >
    //     <Bag size={24} color={activeItem === 'pet-friendly-places' ? "#1FBFC2" : "#fff"} />
    //     <p className={styles.texticon}>Location</p>
    //   </div>
    // </div>
    <>
    </>
  );
};

export default MobileFooter;