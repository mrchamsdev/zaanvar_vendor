import React, { useState } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

const InfoIcon = ({ tip }) => (
  <span className={styles.infoIcon} title={tip || "More info"}>ⓘ</span>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const TaxesGSTSettings = ({ settings, onChange }) => {
  const g = settings;
  const [taxRates, setTaxRates] = useState([]);
  const [taxGroups, setTaxGroups] = useState([]);
  const [loadingTax, setLoadingTax] = useState(false);

  const toggle = (field) => (e) => onChange({ ...g, [field]: e.target.checked });

  return (
    <div className={styles.threeColGrid}>
      {/* ── GST Settings ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>GST Settings</div>

        <div className={styles.checkRow}>
          <input
            id="enableGST"
            type="checkbox"
            className={styles.checkInput}
            checked={g.enableGST ?? true}
            onChange={toggle("enableGST")}
          />
          <label htmlFor="enableGST" className={styles.checkLabel}>Enable GST</label>
          <InfoIcon tip={`What is this?\nGST stands for Goods and Services Tax of the Government of India. Enabling GST allows you to apply GST to Sales, Purchases, and other types of transactions.\n\nHow it is used?\nApply GST to Sale and/or Purchase invoices. You can also generate GST reports for tax f iling.\n\nWhy to use?\nBusinesses with a GSTIN and registered under the Regular or Composition scheme can enable GST. Zaanvar generates ready-made GST reports such as GSTR-1 and GSTR-3B to simplify GST filing in India.`} />
        </div>

        <div className={styles.checkRow}>
          <input
            id="enableTCS"
            type="checkbox"
            className={styles.checkInput}
            checked={g.enableTCS ?? false}
            onChange={toggle("enableTCS")}
          />
          <label htmlFor="enableTCS" className={styles.checkLabel}>Enable TCS</label>
          <InfoIcon tip={`What is this?\nTCS (Tax Collected at Source) is a tax that vendors collect from their customers at the time of sale.\n\nHow it is used?\nEnter TCS in your transactions. You can find your TCS details in Form 27EQ.\n\nWhy to use?\nThe government requires businesses to collect TCS if: * Your turnover exceeded ₹10 crore in the previous financial year, and * The value of sales to a customer exceeds ₹50 lakh in the current financial year.`} />
        </div>

        <div className={styles.checkRow}>
          <input
            id="enableTDS"
            type="checkbox"
            className={styles.checkInput}
            checked={g.enableTDS ?? false}
            onChange={toggle("enableTDS")}
          />
          <label htmlFor="enableTDS" className={styles.checkLabel}>Enable TDS</label>
          <InfoIcon tip={`What is this?\nTDS (Tax Deducted at Source) is a tax deducted by the payer at the time of making specified payments and subsequently deposited with the government.\n\nHow it is used?\nEnter TDS in your transactions. You can view your TDS details in the TDS Receivable and TDS Payable reports.\n\nWhy to use?\nUnder the TDS system, a person or entity making certain types of payments is required to deduct a specified percentage of tax before making the payment to the recipient. Using the TDS feature helps streamline financial processes, minimize errors, stay compliant with tax regulations, and avoid penalties or legal issues related to tax deductions.`} />
        </div>

        <div style={{ marginTop: 16 }}>
          <button className={styles.btnLink} type="button">
            Tax List
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tax Rates ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Tax Rates</div>

        {loadingTax ? (
          <div style={{ color: "#aaa", fontSize: 13, padding: "8px 0" }}>Loading…</div>
        ) : taxRates.length === 0 ? (
          /* Fallback sample display when API returns empty */
          <>
            {[
              { name: "IGST @ 0%", value: 0 },
              { name: "SGST @ 0%", value: 0 },
              { name: "CGST @ 0%", value: 0 },
              { name: "IGST @ 0.25%", value: 0.25 },
              { name: "SGST @ 0.125%", value: 0.125 },
              { name: "CGST @ 0.125%", value: 0.125 },
            ].map((rate) => (
              <div key={rate.name} className={styles.listRow}>
                <div>
                  <div>{rate.name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{rate.value}</span>
                  <div className={styles.listRowActions}>
                    <EditIcon />
                    <TrashIcon />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          taxRates.map((rate) => (
            <div key={rate.id || rate.name} className={styles.listRow}>
              <div>{rate.name || rate.taxName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 600 }}>{rate.value ?? rate.taxRate}</span>
                <div className={styles.listRowActions}>
                  <EditIcon />
                  <TrashIcon />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Tax Groups ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Tax Group</div>

        {loadingTax ? (
          <div style={{ color: "#aaa", fontSize: 13, padding: "8px 0" }}>Loading…</div>
        ) : taxGroups.length === 0 ? (
          /* Fallback sample display */
          <>
            {[
              { name: "GST @ 0%", components: "SGST @ 0%    CGST @ 0%" },
              { name: "GST @ 0.25%", components: "SGST @ 0.125%    CGST @ 0.125%" },
              { name: "GST @ 3%", components: "SGST @ 1.5%    CGST @ 1.5%" },
              { name: "GST @ 12%", components: "SGST @ 6%    CGST @ 8%" },
            ].map((group) => (
              <div key={group.name} className={styles.listRow}>
                <div>
                  <div style={{ fontWeight: 600 }}>{group.name}</div>
                  <div className={styles.listRowSub}>{group.components}</div>
                </div>
                <div className={styles.listRowActions}>
                  <EditIcon />
                  <TrashIcon />
                </div>
              </div>
            ))}
          </>
        ) : (
          taxGroups.map((group) => (
            <div key={group.id || group.name} className={styles.listRow}>
              <div>
                <div style={{ fontWeight: 600 }}>{group.name || group.groupName}</div>
                <div className={styles.listRowSub}>
                  {(group.components || []).map((c) => c.name || c).join("    ")}
                </div>
              </div>
              <div className={styles.listRowActions}>
                <EditIcon />
                <TrashIcon />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaxesGSTSettings;
