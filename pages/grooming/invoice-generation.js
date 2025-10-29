import Layout from "@/components/pet-sales/layout";
import Topbar from "@/components/pet-sales/Topbar";
import {
  BackButton,
  Calculator,
  Calender3,
  FourDots,
  Settings,
} from "@/public/image/SVG";
import React, { useState } from "react";
import styles from "../../styles/grooming/invoiceGenerator.module.css";

const InvoiceGeneration = () => {
  const [paymentType, setPaymentType] = useState("Cash");

  const menuItems = [
    { name: "Dashboard", icon: <Calender3 />, path: "/grooming" },
    { name: "Bookings", icon: <Calender3 />, path: "/grooming/booking" },
    {
      name: "Invoice Generation",
      icon: <Calender3 />,
      path: "/grooming/invoice-generation",
    },
    {
      name: "Parties & Purchases",
      icon: <Calender3 />,
      path: "/grooming/parties-purchases",
    },
    // { name: "Expenses", icon: <Calender3 />, path: "/grooming/expenses" },
    // { name: "Inventory", icon: <Calender3 />, path: "/grooming/inventory" },
    {
      name: "Staff Management",
      icon: <FourDots />,
      path: "/grooming/staff-management",
    },
    // { name: "Reports", icon: <Calender3 />, path: "/grooming/reports" },
    // { name: "Settings", icon: <Calender3 />, path: "/settings" },
    // { name: "Logout", icon: <Calender3 />, path: "/logout" },
  ];
  const openCalculator = () => {
    window.open("https://www.google.com/search?q=calculator", "_blank");
  };
  return (
    <>
      <Layout menuItems={menuItems} sidebarToggleButton={<BackButton />}>
        <Topbar
          buttons={[
            { label: "+ Add Staff", color: "purple", action: "addStaff" },
            { label: "+ Add Bookings", color: "red", action: "addBooking" },
            { label: "+ Add More", color: "gray", action: "addMore" },
          ]}
          onButtonClick={(action) =>
            action === "addStaff" && setShowDrawer(true)
          }
        />

        {/* Main Section */}
        <div>
          <div className={styles.container}>
            <div className={styles["wrapper-sale"]}>
              <h2 className={styles.title}>Sale</h2>

              <div className={styles.toggleWrapper}>
                <span>Credit</span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={paymentType === "Cash"}
                    onChange={() =>
                      setPaymentType(paymentType === "Cash" ? "Credit" : "Cash")
                    }
                  />
                  <span className={styles.slider}></span>
                </label>
                <span>Cash</span>
                <div className={styles["svg-container"]}>
                  <Settings />
                  <Calculator
                    onClick={openCalculator}
                    style={{ cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>

            {/* Top Form Section */}
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Grooming Type</label>
                <input type="text" placeholder="Lorem ipsum" />
              </div>

              <div className={styles.inputGroup}>
                <label>Number of pets</label>
                <input type="text" placeholder="002" />
              </div>

              <div className={styles.inputGroup}>
                <label>Invoice Number</label>
                <input type="text" placeholder="9786415845465464" />
              </div>

              <div className={styles.inputGroup}>
                <label>Invoice Date</label>
                <input type="date" defaultValue="2025-06-09" />
              </div>

              <div className={styles.inputGroup}>
                <label>Store Address</label>
                <input type="text" placeholder="001" />
              </div>

              <div className={styles.inputGroup}>
                <label>Service Charges</label>
                <select>
                  <option>Select</option>
                </select>
              </div>
            </div>

            {/* Payment Toggle */}
            {/* <div className={styles.toggleWrapper}>
              <span>Credit</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={paymentType === "Cash"}
                  onChange={() =>
                    setPaymentType(paymentType === "Cash" ? "Credit" : "Cash")
                  }
                />
                <span className={styles.slider}></span>
              </label>
              <span>Cash</span>
            </div> */}

            {/* Table */}
            <div className={styles.tableContainer}>
            <table>
  <thead>
    <tr>
      <th rowSpan="2">S NO.</th>
      <th rowSpan="2">GROOMING TYPE</th>
      <th rowSpan="2">NUMBER OF PETS</th>

      {/* PRICE/UNIT with subheader */}
      <th colSpan="1">PRICE/UNIT</th>

      {/* DISCOUNT with 2 subheaders */}
      <th colSpan="2">DISCOUNT</th>

      {/* TAX with 2 subheaders */}
      <th colSpan="2">TAX</th>

      <th rowSpan="2">AMOUNT</th>
    </tr>
    <tr>
      <th>WITHOUT TAX</th>
      <th>%</th>
      <th>AMOUNT</th>
      <th>%</th>
      <th>AMOUNT</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>01</td>
      <td>LOREM IPSUM DOLOR SIR AMET</td>
      <td>1</td>
      <td>1000</td>
      <td>10%</td>
      <td>700</td>
      <td>25%</td>
      <td>300</td>
      <td>1,87,321</td>
    </tr>
    <tr>
      <td>02</td>
      <td>LOREM IPSUM DOLOR SIR AMET</td>
      <td>2</td>
      <td>1000</td>
      <td>10%</td>
      <td>700</td>
      <td>25%</td>
      <td>300</td>
      <td>1,87,321</td>
    </tr>
    <tr className={styles.totalRow}>
      <td>
        <button className={styles.addRow}>Add Row</button>
      </td>
      <td colSpan="2" style={{ fontWeight: 600 }}>TOTAL</td>
      <td></td>
      <td style={{ color: "#727271" }}>1400</td>
      <td></td>
      <td></td>
      <td style={{ color: "#727271" }}>600</td>
      <td style={{ color: "#727271" }}>3,74,642</td>
    </tr>
  </tbody>
</table>

            </div>

            {/* Bottom Section */}
            <div className={styles.bottomSection2}>
              <div className={styles["bottom-div"]}>
                <div className={styles.inputGroup2}>
                  <label>Add Description</label>
                  <input className={styles["input-container"]} type="text" placeholder="Lorem ipsum dolor sit..." />
                </div>

                <div className={styles.inputGroup2}>
                  <label>Add Image</label>
                  <input  className={styles["input-btn"]} type="file" />
                </div>
              </div>

              <div className={styles["below-text"]}>
                <div className={styles.inputGroup2}>
                  <label>Round Off</label>
                  <div className={styles.checkboxRow}>
                    <input type="checkbox" defaultChecked />
                    <input className={styles["input-field"]} type="text" placeholder="000" />
                  </div>
                </div>

                <div className={styles.inputGroup2}>
                  <label>Total</label>
                  <input className={styles["input-field"]} type="text" placeholder="000" />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className={styles.buttons}>
              <button className={styles.share}>SHARE</button>
              <button className={styles.save}>SAVE</button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};
export default InvoiceGeneration;
