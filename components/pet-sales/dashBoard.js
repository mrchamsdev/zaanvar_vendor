import React, { useState } from "react";
import styles from "../../styles/pet-sales/dashBoard.module.css";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {
  Area,
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
import { CrossIcon, Notification, Price } from "@/public/SVG";

const Dashboard = () => {
  const [activeCard, setActiveCard] = useState(null);
  const [view, setView] = useState("Daily");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // === Line Chart Data ===
  const dailyLineData = [
    { name: "Sat", uv: 2000, pv: 1000 },
    { name: "Sun", uv: 4200, pv: 3700 },
    { name: "Mon", uv: 3000, pv: 5800 },
    { name: "Tue", uv: 5780, pv: 3908 },
    { name: "Wed", uv: 4080, pv: 2500 },
    { name: "Thu", uv: 2300, pv: 5200 },
    { name: "Fri", uv: 4890, pv: 6500 },
  ];

  const monthlyLineData = [
    { name: "Jan", uv: 3000, pv: 4400 },
    { name: "Feb", uv: 4000, pv: 6098 },
    { name: "Mar", uv: 2000, pv: 2800 },
    { name: "Apr", uv: 2780, pv: 3908 },
    { name: "May", uv: 1890, pv: 4800 },
    { name: "Jun", uv: 2390, pv: 3800 },
    { name: "Jul", uv: 3490, pv: 4300 },
  ];

  const weeklyLineData = [
    { name: "1week ", uv: 3000, pv: 4400 },
    { name: "2Week ", uv: 4000, pv: 6098 },
    { name: "3Week", uv: 2000, pv: 2800 },
    { name: "4Week", uv: 2780, pv: 3908 },
    { name: "5Week", uv: 1890, pv: 4800 },
  ];





  const [lineData, setLineData] = useState(dailyLineData);

  

  // === Pie Chart Data ===
  const dailyPieData = [
    { name: "Morning", value: 400 },
    { name: "Afternoon", value: 300 },
    { name: "Evening", value: 300 },
  ];

  const monthlyPieData = [
    { name: "Morning", value: 3000 },
    { name: "Afternoon", value: 4500 },
    { name: "Evening", value: 2000 },
  ];

  const [pieData, setPieData] = useState(dailyPieData);


  const [lineView, setLineView] = useState("Daily");
const [pieView, setPieView] = useState("Daily");
const [barView, setBarView] = useState("Daily");

  const COLORS = ["#C7CEFF", "#5A6ACF", "#8593ED"];

  // === Bar Chart Data ===
  const dailyBarData = [
    { name: "SUNDAY", total: 20, available: 12 },
    { name: "MONDAY", total: 15, available: 8 },
    { name: "TUESDAY", total: 25, available: 15 },
    { name: "WEDNESDAY", total: 18, available: 10 },
    { name: "THURSDAY", total: 12, available: 7 },
    { name: "FRIDAY", total: 22, available: 17 },
    { name: "SATURDAY", total: 14, available: 3 },
  ];

  const monthlyBarData = [
    { name: "Week 1", total: 100, available: 60 },
    { name: "Week 2", total: 120, available: 80 },
    { name: "Week 3", total: 90, available: 70 },
    { name: "Week 4", total: 110, available: 90 },
    { name: "Week 5", total: 110, available: 90 },
  ];

  const [barData, setBarData] = useState(dailyBarData);

  const handleViewChange = (e) => {
    const selected = e.target.value;
    setView(selected);
  
    // Line chart
    if (selected === "Daily") setLineData(dailyLineData);
    else if (selected === "Monthly") setLineData(monthlyLineData);
    else if (selected === "Weekly") setLineData(weeklyLineData);
  
    // Pie chart - no weekly data, fallback to daily or monthly
    if (selected === "Daily") setPieData(dailyPieData);
    else if (selected === "Monthly") setPieData(monthlyPieData);
    else if (selected === "Weekly") setPieData(dailyPieData); // fallback
  
    // Bar chart - no weekly data, fallback
    if (selected === "Daily") setBarData(dailyBarData);
    else if (selected === "Monthly") setBarData(monthlyBarData);
    else if (selected === "Weekly") setBarData(dailyBarData); // fallback
  };
  
  // Buttons for Topbar
  const buttons = [
    { label: "+ Add Rooms", color: "purple" }, //! Color Coming from Styles
    { label: "+ Add Bookings", color: "red" },
    { label: "+ Add More", color: "gray" },
  ];

  return (
    <div className={styles["dashboardContainer"]}>
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setIsMobileOpen} />
      <div  className={styles["sidebar-toggle"]}>
 
      <button
       className={styles["menu-button"]}
        onClick={() => setIsMobileOpen(true)}
      >
        ☰
      </button>
       <Image
                src="https://zaanvar-care.b-cdn.net/media/1759818805009-ZAANVAR_FINAL%20LOGO%203.png"
                height={45}
                width={70}
                className={styles["image-blog"]}
                alt="Logo"
                priority
              />

<Notification className={styles["menu-button"]}/>
      
      </div>

      <div className={styles["mainSection"]}>
        <Topbar buttons={buttons} className={styles["top-bar"]} />

        {/* Stats Cards */}
        <div className={styles["statsGrid"]}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`${styles["card"]} ${
                activeCard === index ? styles["active"] : ""
              }`}
              onClick={() => setActiveCard(index)}
            >
              <div className={styles["wrapper-div"]}>
                <div className={styles["number-pet"]}>
                  <h4>Total Pets</h4>
                  <h2>2,50,769</h2>
                </div>
                <Price />
              </div>

              <div className={styles["price-div"]}>
                <div className={styles["icon"]}>
                  <CrossIcon /> 12
                </div>
                <p> ↑ 12% this week</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className={styles["wrapper"]}>
          <div className={styles["analyticsGrid"]}>
            {/* ===== Bookings Line Chart ===== */}
            <div className={styles["chartBox"]}>
              <div className={styles["chartHeader"]}>
                <h4>Bookings</h4>
                <select 
  className={styles["selectdrop"]}
  value={lineView}
  onChange={(e) => {
    const selected = e.target.value;
    setLineView(selected);

    if (selected === "Daily") setLineData(dailyLineData);
    else if (selected === "Monthly") setLineData(monthlyLineData);
    else if (selected === "Weekly") setLineData(weeklyLineData);
  }}
>
  <option>Daily</option>
  <option>Monthly</option>
  <option>Weekly</option>
</select>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <defs>
                    <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B62FF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFC838" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid stroke="#f5f5f5" />
                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="uv"
                    stroke="none"
                    fill="url(#uvGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pv"
                    stroke="none"
                    fill="url(#pvGradient)"
                  />

                  <Line
                    type="monotone"
                    dataKey="uv"
                    stroke="#8B62FF"
                    strokeWidth={3}
                    dot
                  />
                  <Line
                    type="monotone"
                    dataKey="pv"
                    stroke="#FFC838"
                    strokeWidth={3}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className={styles["text-below"]}>
                <div className={styles["expense"]}>
                  <span
                    className={styles["color-box"]}
                    style={{ backgroundColor: "#0095FF" }}
                  />
                  Expenses
                </div>
                <div className={styles["revenue"]}>
                  <span
                    className={styles["color-box"]}
                    style={{ backgroundColor: "#FFC838" }}
                  />
                  Revenue
                </div>
              </div>
            </div>

            {/* ===== Bookings Distribution Pie Chart ===== */}
            <div className={styles["chartBox"]}>
              <div className={styles["chartHeader"]}>
                <h4>Bookings Distribution</h4>
                <select
  className={styles["selectdrop"]}
  value={pieView}
  onChange={(e) => {
    const selected = e.target.value;
    setPieView(selected);

    if (selected === "Daily") setPieData(dailyPieData);
    else if (selected === "Monthly") setPieData(monthlyPieData);
  }}
>
  <option>Daily</option>
  <option>Monthly</option>
</select>
              </div>

              <PieChart width={270} height={300}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  fill="#8884d8"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>

              <div className={styles["text-below"]}>
                {pieData.map((entry, index) => (
                  <div
                    key={index}
                    className={
                      index === 0 ? styles["expense"] : styles["revenue"]
                    }
                  >
                    <span
                      className={styles["color-box"]}
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>

            {/* ===== Available Rooms Bar Chart ===== */}
            <div className={styles["chartBox"]}>
              <div className={styles["chartHeader"]}>
                <h4>Available Rooms</h4>
                <div className={styles["text-below"]}>
                  <div className={styles["expense"]}>
                    <span
                      className={styles["color-box"]}
                      style={{ backgroundColor: "#00E096" }}
                    />
                    TOTAL ROOMS
                  </div>
                  <div className={styles["revenue"]}>
                    <span
                      className={styles["color-box"]}
                      style={{ backgroundColor: "#0095FF" }}
                    />
                    AVAILABLE ROOMS
                  </div>
                </div>
                <select
  className={styles["selectdrop"]}
  value={barView}
  onChange={(e) => {
    const selected = e.target.value;
    setBarView(selected);

    if (selected === "Daily") setBarData(dailyBarData);
    else if (selected === "Monthly") setBarData(monthlyBarData);
  }}
>
  <option>Daily</option>
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

          {/* ===== Returns Today Section ===== */}
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
