import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import useDashboardData from "../../components/dashboard/useDashboardData";
import useStore from "../../components/state/useStore";
import { WebApimanager } from "../../components/utilities/WebApiManager";
import styles from "../../styles/dashboard/dashboard.module.css";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TotalSalesIcon,
  TotalPurchasesIcon,
  ProfitIcon,
  LossIcon,
  PurchaseReturnIcon,
  TotalCustomersIcon,
  SaleReturnIcon,
  TotalSuppliersIcon,
  InventoryIcon
} from "../../components/dashboard/DashboardIcons";

// Helper to format currency
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(Number(val));

const TimeFilterDropdown = () => (
  <select className={styles.timeSelect} defaultValue="Weekly">
    <option value="Weekly">Weekly</option>
    <option value="Last Month">Last Month</option>
    <option value="Last 3 Months">Last 3 Months</option>
    <option value="Last 6 Months">Last 6 Months</option>
    <option value="Last 1 year">Last 1 year</option>
    <option value="This Financial year">This Financial year</option>
    <option value="Last Financial year">Last Financial year</option>
    <option value="Custom">Custom</option>
  </select>
);

export default function DashboardHomePage() {
  const { vendor, branchId } = useDashboardData({ skipReviews: true });
  const { jwtToken } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (!jwtToken) return;
        const id = branchId || vendor?.branchId || 91;
        const webApi = new WebApimanager(jwtToken);
        const res = await webApi.get(`vendor/dashboard?branchId=${id}&dateFilter=thisYear`);
        const payload = res.data || res;
        if (payload && payload.status === "success") {
          setData(payload.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [branchId, vendor?.branchId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 40, textAlign: 'center' }}>Loading Dashboard...</div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div style={{ padding: 40, textAlign: 'center' }}>No Dashboard Data Available</div>
      </DashboardLayout>
    );
  }

  const {
    overallStats,
    saleVsPurchaseTrends,
    profitAndLoss,
    inventoryOverview,
    customerGrowth,
    topSellingCategories,
    paymentsFromCustomers,
    paymentsToSupplier
  } = data;

  // Recharts Mappers
  const trendsData = saleVsPurchaseTrends?.labels?.map((label, i) => ({
    name: label,
    Sale: Number(saleVsPurchaseTrends.sales[i]),
    Purchase: Number(saleVsPurchaseTrends.purchases[i]),
    SaleReturn: Number(saleVsPurchaseTrends.saleReturns[i]),
    PurchaseReturn: Number(saleVsPurchaseTrends.purchaseReturns[i]),
  })) || [];

  const plData = profitAndLoss?.labels?.map((label, i) => ({
    name: label,
    GrossProfit: Number(profitAndLoss.grossProfit[i]),
    NetProfit: Number(profitAndLoss.netProfit[i]),
    Loss: Number(profitAndLoss.loss[i]),
  })) || [];

  const customerData = customerGrowth?.labels?.map((label, i) => ({
    name: label,
    NewCustomer: Number(customerGrowth.newCustomers[i]),
    ReturningCustomer: Number(customerGrowth.returningCustomers[i]),
  })) || [];

  const topCategoriesData = topSellingCategories?.map(item => ({
    name: item.category,
    Sales: Number(item.sales)
  })) || [];

  const custPaymentData = [
    { name: 'Paid', value: Number(paymentsFromCustomers?.paid || 0), color: '#22c55e' },
    { name: 'Pending', value: Number(paymentsFromCustomers?.pending || 0), color: '#fbbf24' },
    { name: 'Overdue', value: Number(paymentsFromCustomers?.overdue || 0), color: '#ef4444' },
  ];

  const suppPaymentData = [
    { name: 'Paid Out', value: Number(paymentsToSupplier?.paidOut || 0), color: '#3b82f6' },
    { name: 'Due to suppliers', value: Number(paymentsToSupplier?.dueToSuppliers || 0), color: '#f97316' },
  ];

  const StatCard = ({ title, value, icon, bg }) => (
    <div className={styles.statCard}>
      <div className={styles.statInfo}>
        <span className={styles.statLabel}>{title}</span>
        <h3 className={styles.statValue}>{value}</h3>
      </div>
      <div className={styles.statIconWrap} >
        {icon}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className={styles.newDashboardPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>Welcome Back, <b>Admin</b></p>
          </div>
        </div>

        {/* ROW 1: Overall Statistics */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Overall Statistics</h2>
            <TimeFilterDropdown />
          </div>
          <div className={styles.statsGrid}>
            <StatCard title="Total Sales" value={formatCurrency(overallStats?.totalSales || 0)} bg="#f4f6fb" icon={<TotalSalesIcon style={{ width: '100%', height: 'auto' }} />} />
            <StatCard title="Total Purchases" value={formatCurrency(overallStats?.totalPurchases || 0)} bg="#f4f6fb" icon={<TotalPurchasesIcon style={{ width: '100%', height: 'auto' }} />} />
            <StatCard title="Profit" value={formatCurrency(overallStats?.profit || 0)} bg="#f4f6fb" icon={<ProfitIcon style={{ width: '100%', height: 'auto' }} />} />
            <StatCard title="Loss" value={formatCurrency(overallStats?.loss || 0)} bg="#f4f6fb" icon={<LossIcon style={{ width: '100%', height: 'auto' }} />} />

            <StatCard title="Purchase Returns" value={formatCurrency(overallStats?.purchaseReturns || 0)} bg="#f4f6fb" icon={<PurchaseReturnIcon style={{ width: '100%', height: 'auto' }} />} />
            <StatCard title="Total Customers" value={overallStats?.totalCustomers || 0} bg="#f4f6fb" icon={<TotalCustomersIcon style={{ width: '100%', height: 'auto' }} />} />
            <StatCard title="Sale Returns" value={formatCurrency(overallStats?.saleReturns || 0)} bg="#f4f6fb" icon={<SaleReturnIcon style={{ width: '100%', height: 'auto' }} />} />
            <StatCard title="Total Suppliers" value={overallStats?.totalSuppliers || 0} bg="#f4f6fb" icon={<TotalSuppliersIcon style={{ width: '100%', height: 'auto' }} />} />
          </div>
        </div>

        {/* ROW 2: Trends and P&L */}
        <div className={styles.rowTwoGrid}>
          <div className={styles.chartCard} style={{ flex: 1.5 }}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Sale Vs Purchase Trends</h2>
              <TimeFilterDropdown />
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={trendsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} tickFormatter={(val) => val > 0 ? (val / 1000) + 'k' : '0'} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, top: -20, left: 0 }} />
                  <Line type="monotone" dataKey="Sale" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Purchase" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="SaleReturn" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="PurchaseReturn" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard} style={{ flex: 1 }}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Profit & Loss</h2>
              <TimeFilterDropdown />
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={plData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} tickFormatter={(val) => val > 0 ? (val / 1000) + 'k' : '0'} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, top: -20, left: 0 }} />
                  <Area type="monotone" dataKey="GrossProfit" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="NetProfit" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="Loss" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 3: Inventory, Customer Growth, Top Categories */}
        <div className={styles.rowThreeGrid}>
          <div className={styles.chartCard}>
            <h2 className={styles.sectionTitle}>Inventory Overview</h2>
            <div className={styles.inventoryGrid}>
              <div className={styles.invCard}>
                <div className={styles.invIconWrap}><InventoryIcon style={{ width: '100%', height: 'auto' }} /></div>
                <div>
                  <div className={styles.invLabel}>Total Products</div>
                  <div className={styles.invValue}>{inventoryOverview?.totalProducts || 0}</div>
                </div>
              </div>
              <div className={styles.invCard}>
                <div className={styles.invIconWrap}><InventoryIcon style={{ width: '100%', height: 'auto' }} /></div>
                <div>
                  <div className={styles.invLabel}>Low stock products</div>
                  <div className={styles.invValue}>{inventoryOverview?.lowStockProducts || 0}</div>
                </div>
              </div>
              <div className={styles.invCard}>
                <div className={styles.invIconWrap}><InventoryIcon style={{ width: '100%', height: 'auto' }} /></div>
                <div>
                  <div className={styles.invLabel}>Out of Stock</div>
                  <div className={styles.invValue}>{inventoryOverview?.outOfStock || 0}</div>
                </div>
              </div>
              <div className={styles.invCard}>
                <div className={styles.invIconWrap}><InventoryIcon style={{ width: '100%', height: 'auto' }} /></div>
                <div>
                  <div className={styles.invLabel}>Expired Products</div>
                  <div className={styles.invValue}>{inventoryOverview?.expiredProducts || 0}</div>
                </div>
              </div>
              <div className={styles.invCard}>
                <div className={styles.invIconWrap}><InventoryIcon style={{ width: '100%', height: 'auto' }} /></div>
                <div>
                  <div className={styles.invLabel}>Active Products</div>
                  <div className={styles.invValue}>{inventoryOverview?.activeProducts || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Customer Growth</h2>
              <TimeFilterDropdown />
            </div>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={customerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, bottom: -10 }} />
                  <Area type="monotone" dataKey="NewCustomer" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="ReturningCustomer" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Top Selling Categories</h2>
              <TimeFilterDropdown />
            </div>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart layout="vertical" data={topCategoriesData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 11 }} width={100} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="Sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16}>
                    {topCategoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#a855f7', '#22c55e', '#fbbf24', '#ef4444'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 4: Payments From Customers and To Suppliers */}
        <div className={styles.rowFourGrid}>
          <div className={styles.chartCard}>
            <h2 className={styles.sectionTitle}>Payments From Customers</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={custPaymentData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {custPaymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.legendWrap}>
                {custPaymentData.map(c => (
                  <div key={c.name} className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: c.color }} />
                    <span className={styles.legendLabel}>{c.name}</span>
                    <span className={styles.legendValue}>{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.sectionTitle}>Payments to Supplier</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={suppPaymentData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {suppPaymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.legendWrap}>
                {suppPaymentData.map(c => (
                  <div key={c.name} className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: c.color }} />
                    <span className={styles.legendLabel}>{c.name}</span>
                    <span className={styles.legendValue}>{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
