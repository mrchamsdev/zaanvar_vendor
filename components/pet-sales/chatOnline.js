import React from 'react'
import styles from "../../styles/pet-sales/dashBoard.module.css"
import Image from 'next/image'
const ChatOnline = () => {
  return (
   <>
   <div className={styles["chats-div"]}>
            <div className={styles["chartBox"]}>
              <div className={styles["chartHeader"]}>
                <h4>Returns Today</h4>
                <select className={styles["selectdrop"]}>
                  <option>Today</option>
                </select>
              </div>

              <div className={styles["returnsList"]}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles["returnItem"]}>
                    <div className={styles["user"]}>
                      <div className={styles["avatar"]}>
                        <Image
                          src="https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg"
                          width={50}
                          height={50}
                          alt="user avatar"
                        />
                        <span className={styles["onlineDot"]}></span>
                      </div>
                      <div>
                        <p className={styles["name"]}>Shubham Pawar</p>
                        <p className={styles["date"]}>
                          12-09-2025 to 13-10-2025
                        </p>
                      </div>
                    </div>
                    <p className={styles["amount"]}>₹5000.00</p>
                  </div>
                ))}
              </div>
            </div>
          </div></>
  )
}

export default ChatOnline