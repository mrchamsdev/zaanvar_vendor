import Image from "next/image";
import React, { useEffect, useState } from "react";
import style from "../../../styles/header/header.module.css";
import Link from "next/link";

const Header = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(s => !s);
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => { if (e.key === "Escape") closeMenu(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className={style["header-wrapper"]}>
      {/* Mobile toggle (left on mobile) */}
      <button
        className={style["mobile-toggle"]}
        onClick={toggleMenu}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

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

      {/* Desktop nav (unchanged) */}
      <nav className={style["nav-links"]} aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/about">About Us</Link>
        <Link href="/sources">Sources</Link>
        <Link href="/contact">Contact Us</Link>
      </nav>

      {/* Desktop buttons (unchanged) */}
      <div className={style["button-container"]}>
        <button className={style["btn-outline"]}>LOGIN</button>
        <button className={style["btn-outline"]}>Start FREE Trial</button>
      </div>

      {/* dim overlay (click to close) */}
      <div
        className={`${style["mobile-overlay"]} ${open ? style["open"] : ""}`}
        onClick={closeMenu}
        aria-hidden={!open}
      />

      {/* full-screen sliding panel from top */}
      <div
        className={`${style["mobile-panel"]} ${open ? style["open"] : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {/* centered logo inside the popup */}
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
          <Link href="/" onClick={closeMenu}>Home</Link>
          <Link href="/about" onClick={closeMenu}>About Us</Link>
          <Link href="/sources" onClick={closeMenu}>Sources</Link>
          <Link href="/contact" onClick={closeMenu}>Contact Us</Link>
        </nav>

        {/* Buttons pinned to bottom of the panel */}
        <div className={style["mobile-actions"]}>
          <button className={style["btn-outline"]} onClick={closeMenu}>LOGIN</button>
          <button className={style["btn-primary"]} onClick={closeMenu}>Start FREE Trial</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
