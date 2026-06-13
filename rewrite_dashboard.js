const fs = require('fs');

const fileContent = `import React, { useEffect, useState } from "react";
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

const TimeFilterDropdown = ({ value, fromDate, toDate, onChange, onDateChange }) => (
  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <select className={styles.timeSelect} value={value} onChange={e => onChange(e.target.value)}>
      <option value="weekly">Weekly</option>
      <option value="lastMonth">Last Month</option>
      <option value="last3Months">Last 3 Months</option>
      <option value="last6Months">Last 6 Months</option>
      <option value="last1Year">Last 1 year</option>
      <option value="thisFinancialYear">This Financial year</option>
      <option value="lastFinancialYear">Last Financial year</option>
      <option value="custom">Custom</option>
    </select>
    {value === 'custom' && (
      <>
        <input 
          type="date" 
          value={fromDate} 
          onChange={e => onDateChange('from', e.target.value)} 
          className={styles.timeSelect} 
          style={{ width: '130px', padding: '0.3rem' }} 
        />
        <span style={{ color: '#666', fontSize: '13px' }}>to</span>
        <input 
          type="date" 
          value={toDate} 
          onChange={e => onDateChange('to', e.target.value)} 
          className={styles.timeSelect} 
          style={{ width: '130px', padding: '0.3rem' }} 
        />
      </>
    )}
  </div>
);

export default function DashboardHomePage() {
  const { vendor, branchId } = useDashboardData({ skipReviews: true });
  const { jwtToken } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize independent filters for each of the 8 dashboard sections
  const defaultFilter = { filter: 'thisFinancialYear', from: '', to: '' };
  const [filters, setFilters] = useState({
    overallStats: { ...defaultFilter },
    saleVsPurchaseTrends: { ...defaultFilter },
    profitAndLoss: { ...defaultFilter },
    inventoryOverview: { ...defaultFilter },
    customerGrowth: { ...defaultFilter },
    topSellingCategories: { ...defaultFilter },
    paymentsFromCustomers: { ...defaultFilter },
    paymentsToSupplier: { ...defaultFilter }
  });

  const handleFilterChange = (section, type, value) => {
    setFilters(prev => ({
      ...prev,
      [section]: { ...prev[section], [type]: value }
    }));
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (!jwtToken) return;
        const id = branchId || vendor?.branchId || 91;
        const webApi = new WebApimanager(jwtToken);
        
        let queryParams = \`branchId=\${id}\`;
        
        Object.entries(filters).forEach(([section, values]) => {
           queryParams += \`&\${section}DateFilter=\${values.filter}\`;
           if (values.filter === 'custom') {
              if (values.from) queryParams += \`&\${section}FromDate=\${values.from}\`;
              if (values.to) queryParams += \`&\${section}ToDate=\${values.to}\`;
           }
           if (section === 'overallStats') {
               queryParams += \`&profitCategory=product\`;
           }
        });

        const res = await webApi.get(\`vendor/dashboard?\${queryParams}\`);
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
    
    // We want to fetch if the filter is NOT custom, OR if it IS custom and both dates are selected
    // Otherwise we'd trigger lots of requests when the user is picking custom dates.
    // For simplicity, we just trigger it immediately. In most browsers <input type="date"> fires onChange only on complete.
    fetchDashboard();
  }, [branchId, vendor?.branchId, filters]);

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
    { name: 'Paid', value: Number(paymentsToSupplier?.paidOut || paymentsToSupplier?.paid || 0), color: '#3b82f6' },
    { name: 'Pending', value: Number(paymentsToSupplier?.dueToSuppliers || paymentsToSupplier?.pending || 0), color: '#f59e0b' },
    { name: 'Overdue', value: Number(paymentsToSupplier?.overdue || 0), color: '#ef4444' },
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
            <TimeFilterDropdown 
               value={filters.overallStats.filter} 
               fromDate={filters.overallStats.from} 
               toDate={filters.overallStats.to}
               onChange={(val) => handleFilterChange('overallStats', 'filter', val)}
               onDateChange={(type, val) => handleFilterChange('overallStats', type, val)}
            />
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
              <TimeFilterDropdown 
                 value={filters.saleVsPurchaseTrends.filter} 
                 fromDate={filters.saleVsPurchaseTrends.from} 
                 toDate={filters.saleVsPurchaseTrends.to}
                 onChange={(val) => handleFilterChange('saleVsPurchaseTrends', 'filter', val)}
                 onDateChange={(type, val) => handleFilterChange('saleVsPurchaseTrends', type, val)}
              />
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
              <TimeFilterDropdown 
                 value={filters.profitAndLoss.filter} 
                 fromDate={filters.profitAndLoss.from} 
                 toDate={filters.profitAndLoss.to}
                 onChange={(val) => handleFilterChange('profitAndLoss', 'filter', val)}
                 onDateChange={(type, val) => handleFilterChange('profitAndLoss', type, val)}
              />
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
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Inventory Overview</h2>
              <TimeFilterDropdown 
                 value={filters.inventoryOverview.filter} 
                 fromDate={filters.inventoryOverview.from} 
                 toDate={filters.inventoryOverview.to}
                 onChange={(val) => handleFilterChange('inventoryOverview', 'filter', val)}
                 onDateChange={(type, val) => handleFilterChange('inventoryOverview', type, val)}
              />
            </div>
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
              <TimeFilterDropdown 
                 value={filters.customerGrowth.filter} 
                 fromDate={filters.customerGrowth.from} 
                 toDate={filters.customerGrowth.to}
                 onChange={(val) => handleFilterChange('customerGrowth', 'filter', val)}
                 onDateChange={(type, val) => handleFilterChange('customerGrowth', type, val)}
              />
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
              <TimeFilterDropdown 
                 value={filters.topSellingCategories.filter} 
                 fromDate={filters.topSellingCategories.from} 
                 toDate={filters.topSellingCategories.to}
                 onChange={(val) => handleFilterChange('topSellingCategories', 'filter', val)}
                 onDateChange={(type, val) => handleFilterChange('topSellingCategories', type, val)}
              />
            </div>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart layout="vertical" data={topCategoriesData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 11 }} width={100} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="Sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16}>
                    {topCategoriesData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={['#a855f7', '#22c55e', '#fbbf24', '#ef4444'][index % 4]} />
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
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Payments From Customers</h2>
              <TimeFilterDropdown 
                 value={filters.paymentsFromCustomers.filter} 
                 fromDate={filters.paymentsFromCustomers.from} 
                 toDate={filters.paymentsFromCustomers.to}
                 onChange={(val) => handleFilterChange('paymentsFromCustomers', 'filter', val)}
                 onDateChange={(type, val) => handleFilterChange('paymentsFromCustomers', type, val)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={custPaymentData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {custPaymentData.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.color} />
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
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Payments to Supplier</h2>
              <TimeFilterDropdown 
                 value={filters.paymentsToSupplier.filter} 
                 fromDate={filters.paymentsToSupplier.from} 
                 toDate={filters.paymentsToSupplier.to}
                 onChange={(val) => handleFilterChange('paymentsToSupplier', 'filter', val)}
                 onDateChange={(type, val) => handleFilterChange('paymentsToSupplier', type, val)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={suppPaymentData} innerRadius={55} outerRadius={75} paddingAngle={0} dataKey="value" stroke="none">
                      {suppPaymentData.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.color} />
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
`;

fs.writeFileSync('c:/Users/Sanja/OneDrive/Desktop/zaanvar_vendor/pages/dashboard/index.js', fileContent);
console.log('Success');
