import Image from 'next/image'
import React from 'react'
import style from "../../../styles/header/header.module.css"
import Link from 'next/link'

const Header = () => {
  return (
    <div className={style["header-wrapper"]}>
      {/* Image */}
      <Image 
        src="https://zaanvar-care.b-cdn.net/media/1759818805009-ZAANVAR_FINAL%20LOGO%203.png"
        height={45}
        width={70} 
        className={style["image-blog"]}
        alt="Logo"
      />

      {/* Navigation */}
      <nav className={style["nav-links"]}>
        <Link href="/">Home</Link>
        <Link href="/about">About Us</Link>
        <Link href="/sources">Sources</Link>
        <Link href="/contact">Contact Us</Link>
      </nav>

      {/* Button */}
      <div className={style["button-container"]}> 
      <button>LOGIN</button>
      <button>Start FREE Trail</button>
</div>

    </div>
  )
}

export default Header
