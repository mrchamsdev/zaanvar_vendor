import Image from "next/image";
import React, { useEffect, useState } from "react";
import style from "../../styles/header/header.module.css";
import Link from "next/link";
import { useRouter } from "next/router";

const Header = () => {

    const Router = useRouter();
  const handleOnclick = ()=>{
    Router.push("/book-demo")
  }
  const handleLogin = ()=>{
    Router.push("/login")
  }


  const isActive = (path) => Router.pathname === path;

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleMenu = () => setOpen((s) => !s);
  const closeMenu = () => setOpen(false);

  // track viewport
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    handleResize(); // initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // prevent body scroll when panel open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = open ? "hidden" : "";
    }
  }, [open, isMobile]);

  return (
    <header className={style["header-wrapper"]}>
      {/* Mobile toggle (only visible on mobile) */}
      {isMobile && (
        <button
          className={style["mobile-toggle"]}
          onClick={toggleMenu}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}

      {/* Logo (centered on mobile via CSS) */}
      <Link href="/" className={style["logo-link"]} onClick={closeMenu}>
        <Image
          src="https://zaanvar-care.b-cdn.net/media/1759818805009-ZAANVAR_FINAL%20LOGO%203.png"
          height={45}
          width={70}
          className={style["image-blog"]}
          alt="Logo"
          priority
        />
      </Link>

      {/* Desktop nav (visible only on desktop via CSS) */}
      {!isMobile && (
        <>
         <nav className={style["nav-links"]} aria-label="Main navigation">
  <Link
    href="/"
    onClick={closeMenu}
    className={isActive("/") ? style.activeLink : ""}
  >
    Home
  </Link>
  <Link
    href="/about-us"
    onClick={closeMenu}
    className={isActive("/about-us") ? style.activeLink : ""}
  >
    About Us
  </Link>
  <Link
    href="/book-demo"
    onClick={closeMenu}
    className={isActive("/book-demo") ? style.activeLink : ""}
  >
    Contact Us
  </Link>
</nav>

          <div className={style["button-container"]}>
            {/* <button className={style["btn-outline"]} onClick={handleLogin}>LOGIN</button> */}
            <button onClick={handleOnclick}
              className={style["btn-outline"]}
              style={{ background: "#F5790C", color:"#fff" }}
            >
              Start FREE Trial
            </button>
          </div>
        </>
      )}

      {/* Mobile-only overlay & panel */}
      {isMobile && (
        <>
          <div
            className={`${style["mobile-overlay"]} ${
              open ? style["open"] : ""
            }`}
            onClick={closeMenu}
            aria-hidden={!open}
          />
          <div
            className={`${style["mobile-panel"]} ${open ? style["open"] : ""}`}
            role="dialog"
            aria-modal="true"
            aria-hidden={!open}
          >
            <div className={style["mobile-panel-logo"]}>
              <Image
                src="https://zaanvar-care.b-cdn.net/media/1759818805009-ZAANVAR_FINAL%20LOGO%203.png"
                width={70}
                height={45}
                alt="Logo"
                priority
              />
            </div>

            <nav className={style["mobile-nav"]}>
              <Link href="/" onClick={closeMenu}>
                Home
              </Link>
              <Link href="/about-us" onClick={closeMenu}>
                About Us
              </Link>
              {/* <Link href="/sources" onClick={closeMenu}>Sources</Link> */}
              <Link href="/contact" onClick={closeMenu}>
                Contact Us
              </Link>
            </nav>

            <div className={style["mobile-actions"]}>
              {/*<button className={style["btn-outline"]} onClick={closeMenu}>
                LOGIN
              </button>*/}
              <button className={style["btn-primary"]} onClick={closeMenu}>
                Start FREE Trial
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
