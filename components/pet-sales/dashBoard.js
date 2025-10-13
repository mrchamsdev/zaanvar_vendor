import React, { useState } from "react";
import styles from "../../styles/pet-sales/dashBoard.module.css";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Image from "next/image";
import { CrossIcon, Price } from "@/public/SVG";

const Dashboard = () => {
    const [activeCard, setActiveCard] = useState(null);
  const data = [
    { name: "Jan", uv: 3000, pv: 4400 },
    { name: "Feb", uv: 4000, pv: 6098 },
    { name: "Mar", uv: 2000, pv: 2800 },
    { name: "Apr", uv: 2780, pv: 3908 },
    { name: "May", uv: 1890, pv: 4800 },
    { name: "Jun", uv: 2390, pv: 3800 },
    { name: "Jul", uv: 3490, pv: 4300 },
  ];

  const datas = [
    { name: "Morning", value: 400 },
    { name: "Afternoon", value: 300 },
    { name: "Evening", value: 300 },
  ];
  const barData = [
    { name: "SUNDAY", total: 20, available: 12 },
    { name: "MONDAY", total: 15, available: 8 },
    { name: "TUESDAY", total: 25, available: 15 },
    { name: "WEDNESDAY", total: 18, available: 10 },
    { name: "THURSDAY", total: 12, available: 7 },
    { name: "FRIDAY", total: 22, available: 17 },
    { name: "SATURDAY", total: 14, available: 3 },
  ];

  const COLORS = ["#C7CEFF", "#5A6ACF", "#8593ED"];

  return (
    <div className={styles["dashboardContainer"]}>
      <Sidebar />
      <div className={styles["mainSection"]}>
        <Topbar />

        {/* Stats Cards */}
        <div className={styles["statsGrid"]}>
  {[0, 1, 2, 3].map((index) => (
    <div
      key={index}
      className={`${styles["card"]} ${activeCard === index ? styles["active"] : ""}`}
      onClick={() => setActiveCard(index)}
    >
      <div className={styles["wrapper"]}>
        <div>
          <h4>Total Pets</h4>
          <h2>2,50,769</h2>
        </div>
        <Price />
      </div>

      <div className={styles["price-div"]}>
        <div className={styles["icon"]}> <CrossIcon/> 12  </div>
        <p> ↑ 12% this week</p>
      </div>
    </div>
  ))}
</div>


        <div className={styles["wrapper"]}>
          <div className={styles["analyticsGrid"]}>
            {/************* EXPENSES & REVENUE */}
            <div className={styles["chartBox"]}>
              <div className={styles["chartHeader"]}>
                <h4>Bookings</h4>
                
                <select className={styles["selectdrop"]}>
                  <option>Today</option>
                  <option>Weekly</option>
                </select>
              </div>
              <LineChart width={300} height={300} data={data}>
                <XAxis dataKey="name" />
                <Tooltip />
                <CartesianGrid stroke="#f5f5f5" />
                <Line
                  type="monotone"
                  dataKey="uv"
                  stroke="#8B62FF"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="pv"
                  stroke="#FFC838"
                  strokeWidth={3}
                />
              </LineChart>
              <div className={styles["text-below"]}>
                <div className={styles["expense"]}>
                  <span
                    className={styles["color-box"]}
                    style={{ backgroundColor: "#0095FF" }}
                  ></span>
                  Expenses
                </div>
                <div className={styles["revenue"]}>
                  <span
                    className={styles["color-box"]}
                    style={{ backgroundColor: "#FFC838" }}
                  ></span>
                  Revenue
                </div>
              </div>
            </div>

            {/**************** Booking */}
            <div className={styles["chartBox"]}>
              <div className={styles["chartHeader"]}>
                <h4>Bookings Distribution</h4>
                <select className={styles["selectdrop"]}>
                  <option>Today</option>
                  <option>Weekly</option>
                </select>
              </div>
              <PieChart width={300} height={300}>
                <Pie
                  data={datas}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  fill="#8884d8"
                  label
                >
                  {datas.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
              <div className={styles["text-below"]}>
                <div className={styles["expense"]}>
                  <span
                    className={styles["color-box"]}
                    style={{ backgroundColor: "#C7CEFF" }}
                  ></span>
                  Morning
                </div>
                <div className={styles["revenue"]}>
                  <span
                    className={styles["color-box"]}
                    style={{ backgroundColor: "#5A6ACF" }}
                  ></span>
                  Afternoon
                </div>
                <div className={styles["revenue"]}>
                  <span
                    className={styles["color-box"]}
                    style={{ backgroundColor: "#8593ED" }}
                  ></span>
                  Evening
                </div>
              </div>
            </div>

            {/***************** AVAILABLE SLOTS */}
            <div className={styles["chartBox"]}>
              <div className={styles["chartHeader"]}>
                <h4>Available Rooms</h4>
                <div className={styles["text-below"]}>
                <div className={styles["expense"]}>
                  <span
                    className={styles["color-box"]}
                    style={{ backgroundColor: "#00E096" }}
                  ></span>
                  TOTAL ROOMS
                </div>
                <div className={styles["revenue"]}>
                  <span
                    className={styles["color-box"]}
                    style={{ backgroundColor: "#0095FF" }}
                  ></span>
                  AVAILABLE ROOMS
                </div>
              </div>
                <select className={styles["selectdrop"]}>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={barData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="0 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {/* Side by side bars */}
                  <Bar
                    dataKey="total"
                    fill="#00E096"
                    name="Total Slots"
                    barSize={25}
                  />
                  <Bar
                    dataKey="available"
                    fill="#0095FF"
                    name="Available Slots"
                    barSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/************* RETURNS TODAY */}
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
                        />
                          <span className={styles["onlineDot"]}></span>
                      </div>
                      <div>
                        <p className={styles["name"]}>User </p>
                        <p className={styles["date"]}>
                          12-09-2025 to 13-09-2025
                        </p>
                      </div>
                    </div>
                    <p className={styles["amount"]}>₹500.00</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
