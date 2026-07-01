import React from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

const InfoIcon = () => (
  <span className={styles.infoIcon} title="More info">ⓘ</span>
);

const GST_TYPE_OPTIONS = [
  "Unregistered/Consumer",
  "Registered Business - Regular",
  "Registered Business - Composition",
];

const CURRENCY_OPTIONS = [
  "₹", "Rs", "NT$", "SM", "TSh", "฿", "T$", "TT$", "د.ت", "₺", "m", "USh", "₴", "$U", "so'm", "Vt", "VT", "Bs", "Bs.S", "₫", "ZK", "ZWL", "ZiG",
  "B/.", "₵", "S/.", "S/", "zł", "QR", "lei", "₽", "руб", "R₣", "FRw", "T", "Db", "РСД", "din", "Le", "S$", "Sk", "Sh", "R", "SSP", "ل.س",
  "ل.د", "CHF", "Lt", "MOP$", "ден", "Ar", "MK", "ر.س", "/-", "Rf", "MVR", "UM", "₮", "د.م.", "MT", "Ks", "K", "N$", "C$", "ر.ع.", "OMR", "OR",
  "GFr", "FG", "G", "Ft", "Rp", "﷼", "ع.د", "₪", "£", "J$", "JD", "د.ا", "KSh", "₩", "د.ك", "KWD", "c", "Ls", "ل.ل",
  "CF", "FC", "Fr.", "kn", "₱", "Kč", "Fdj", "RD$", "E£", "ج.م", "Br.", "Nfk", "F", "CFP", "D", "ლ", "₾", "GH₵", "Q", "$", "€", "¥", "A$"
];


const GeneralSettings = ({ settings, onChange, backupSettings, onBackupChange }) => {
  const g = settings;
  const b = backupSettings;

  const handleCheck = (field) => (e) => onChange({ ...g, [field]: e.target.checked });
  const handleVal = (field) => (e) => onChange({ ...g, [field]: e.target.value });

  const stepDecimal = (delta) => {
    const next = Math.max(0, Math.min(10, (g.amountDecimalPlaces || 2) + delta));
    onChange({ ...g, amountDecimalPlaces: next });
  };

  return (
    <div className={styles.twoColGrid}>
      {/* ── Application ── */}
      <div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Application</div>

          {/* Business Currency */}
          <div className={styles.fieldWrap}>
            <div className={styles.fieldLabel}>
              Business Currency <InfoIcon />
            </div>
            <div style={{ position: "relative" }}>
              <select
                id="businessCurrency"
                className={styles.select}
                value={g.businessCurrency}
                onChange={handleVal("businessCurrency")}
              >
                {CURRENCY_OPTIONS.map((currency, index) => (
                  <option key={index} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Decimal Places */}
          <div className={styles.fieldWrap}>
            <div className={styles.fieldLabel}>
              Amount (Up to Decimal Places) <InfoIcon />
            </div>
            <div className={styles.stepperWrap}>
              <input
                id="amountDecimalPlaces"
                type="number"
                className={styles.stepperInput}
                value={g.amountDecimalPlaces}
                min={0}
                max={10}
                onChange={(e) =>
                  onChange({ ...g, amountDecimalPlaces: parseInt(e.target.value) || 0 })
                }
              />
              <div className={styles.stepperBtns}>
                <button
                  className={styles.stepperBtn}
                  onClick={() => stepDecimal(1)}
                  type="button"
                >▲</button>
                <button
                  className={styles.stepperBtn}
                  onClick={() => stepDecimal(-1)}
                  type="button"
                >▼</button>
              </div>
              <span style={{ fontSize: 12, color: "#aaa" }}>e.g. 0.00</span>
            </div>
          </div>

          {/* GSTIN Enable */}
          <div className={styles.checkRow}>
            <input
              id="enableGstin"
              type="checkbox"
              className={styles.checkInput}
              checked={g.enableGstin}
              onChange={handleCheck("enableGstin")}
            />
            <label htmlFor="enableGstin" className={styles.checkLabel}>
              GSTIN Enable
            </label>
            <InfoIcon />
          </div>

          {/* GST Type — only shown when GSTIN enabled */}
          {g.enableGstin && (
            <div className={styles.subField}>
              <div className={styles.fieldLabel}>GST Type</div>
              <select
                id="gstType"
                className={styles.select}
                value={g.gstType}
                onChange={handleVal("gstType")}
              >
                {GST_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Stop Sale on Negative Stock */}
          <div className={styles.checkRow}>
            <input
              id="stopSaleNegativeStock"
              type="checkbox"
              className={styles.checkInput}
              checked={g.stopSaleNegativeStock}
              onChange={handleCheck("stopSaleNegativeStock")}
            />
            <label htmlFor="stopSaleNegativeStock" className={styles.checkLabel}>
              Stop Sale on Negative Stock
            </label>
            <InfoIcon />
          </div>

          {/* Block New Items from Txn Form */}
          <div className={styles.checkRow}>
            <input
              id="blockNewItemsFromTxn"
              type="checkbox"
              className={styles.checkInput}
              checked={g.blockNewItemsFromTxn}
              onChange={handleCheck("blockNewItemsFromTxn")}
            />
            <label htmlFor="blockNewItemsFromTxn" className={styles.checkLabel}>
              Block New Items &nbsp;Txn Form
            </label>
            <InfoIcon />
          </div>

          {/* Block New Suppliers from Txn Form */}
          <div className={styles.checkRow}>
            <input
              id="blockNewSupplierFromTxn"
              type="checkbox"
              className={styles.checkInput}
              checked={g.blockNewSupplierFromTxn}
              onChange={handleCheck("blockNewSupplierFromTxn")}
            />
            <label htmlFor="blockNewSupplierFromTxn" className={styles.checkLabel}>
              Block New Suppliers &nbsp;Txn Form
            </label>
            <InfoIcon />
          </div>

          {/* Block New Customers from Txn Form */}
          <div className={styles.checkRow}>
            <input
              id="blockNewCustomerFromTxn"
              type="checkbox"
              className={styles.checkInput}
              checked={g.blockNewCustomerFromTxn}
              onChange={handleCheck("blockNewCustomerFromTxn")}
            />
            <label htmlFor="blockNewCustomerFromTxn" className={styles.checkLabel}>
              Block New Customers &nbsp;Txn Form
            </label>
            <InfoIcon />
          </div>
        </div>
      </div>

      {/* ── Backup & History ── */}
      <div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Backup &amp; History</div>

          <div className={styles.checkRow}>
            <input
              id="autoBackup"
              type="checkbox"
              className={styles.checkInput}
              checked={b.autoBackup}
              onChange={(e) => onBackupChange({ ...b, autoBackup: e.target.checked })}
            />
            <label htmlFor="autoBackup" className={styles.checkLabel}>
              Auto Backup Interval Days
            </label>
            <InfoIcon />
          </div>

          <div className={styles.indent} style={{ marginTop: 4 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>
              (Last Backup — every {b.backupIntervalDays} days)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
