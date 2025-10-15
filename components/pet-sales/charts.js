"use client";
import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import styles from "../../styles/pet-sales/charts.module.css";

const Charts = () => {
  const COLORS = ["#C7CEFF", "#5A6ACF", "#8593ED"];

  // === Data Sets ===
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
    { name: "1week", uv: 3000, pv: 4400 },
    { name: "2week", uv: 4000, pv: 6098 },
    { name: "3week", uv: 2000, pv: 2800 },
    { name: "4week", uv: 2780, pv: 3908 },
    { name: "5week", uv: 1890, pv: 4800 },
  ];

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
  ];

  // === States ===
  const [lineView, setLineView] = useState("Daily");
  const [pieView, setPieView] = useState("Daily");
  const [barView, setBarView] = useState("Daily");

  const [lineData, setLineData] = useState(dailyLineData);
  const [pieData, setPieData] = useState(dailyPieData);
  const [barData, setBarData] = useState(dailyBarData);

  // === Handlers ===
  const handleLineChange = (value) => {
    setLineView(value);
    if (value === "Daily") setLineData(dailyLineData);
    else if (value === "Weekly") setLineData(weeklyLineData);
    else setLineData(monthlyLineData);
  };

  const handlePieChange = (value) => {
    setPieView(value);
    if (value === "Daily") setPieData(dailyPieData);
    else setPieData(monthlyPieData);
  };

  const handleBarChange = (value) => {
    setBarView(value);
    if (value === "Daily") setBarData(dailyBarData);
    else setBarData(monthlyBarData);
  };

  return (
    <div className={styles["analyticsGrid"]}>
      {/* === Line Chart === */}
      <div className={styles["chartBox"]}>
        <div className={styles["chartHeader"]}>
          <h4>Bookings</h4>
          <select
            className={styles["selectdrop"]}
            value={lineView}
            onChange={(e) => handleLineChange(e.target.value)}
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid stroke="#f5f5f5" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="uv"
              stroke="#0095FF"
              strokeWidth={3}
            />
            <Line
              type="monotone"
              dataKey="pv"
              stroke="#FFC838"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className={styles["text-below"]}>
          <div className={styles["legend-item"]}>
            <span className={`${styles["color-box"]} ${styles["expenses"]}`} />
            <span className={styles["legend-text"]}>Expenses</span>
          </div>

          <div className={styles["legend-item"]}>
            <span className={`${styles["color-box"]} ${styles["revenue"]}`} />
            <span className={styles["legend-text"]}>Revenue</span>
          </div>
        </div>
      </div>

      {/* === Pie Chart === */}
      <div className={styles["chartBox"]}>
        <div className={styles["chartHeader"]}>
          <h4>Bookings Distribution</h4>
          <select
            className={styles["selectdrop"]}
            value={pieView}
            onChange={(e) => handlePieChange(e.target.value)}
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
            innerRadius={80}
            outerRadius={120}
            fill="#8884d8"
            label
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>

        <div className={styles["text-below"]}>
          {pieData.map((entry, index) => (
            <div className={styles["timeday"]} key={index}>
              <span
                className={styles["color-box"]}
                style={{ backgroundColor: COLORS[index] }}
              />
              {entry.name}
            </div>
          ))}
        </div>
      </div>

      {/* === Bar Chart === */}
      <div className={styles["chartBox"]}>
        <div className={styles["chartHeader"]}>
          <h4>Available Rooms</h4>
          <select
            className={styles["selectdrop"]}
            value={barView}
            onChange={(e) => handleBarChange(e.target.value)}
          >
            <option>Daily</option>
            <option>Monthly</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="0 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#00E096" barSize={25} />
            <Bar dataKey="available" fill="#0095FF" barSize={25} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
