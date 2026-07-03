import React from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

const InfoIcon = ({ tip }) => (
  <span className={styles.infoIcon} title={tip || "More info"}>ⓘ</span>
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
              Business Currency <InfoIcon tip={`What is this?\nSelect your currency’s symbol.\n\nHow it is used?\nThe selected currency symbol will be printed on all your transactions, such as sales, purchases, expenses, etc.`} />
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
              Amount (Up to Decimal Places) <InfoIcon tip={`What is this?\nSpecify the number of digits after the decimal for amounts. Amounts will be printed with these decimal places.`} />
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
            <InfoIcon tip={`What is this?\nYou can enter GSTIN of the party while adding a party to Zaanvar. This GSTIN will be printed on invoices to the parties.\n\nWhy to use?\nIn case you want Party’s GSTIN no. to be printed on invoice, then you can enable this.`} />
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
            <InfoIcon tip={`What is this?\nThis setting stops all users of the company from creating a sale if any item becomes less than 0 quantity after the sale.`} />
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
            <InfoIcon tip={`What is this?\nThis setting blocks you from creating an item instantly without going through the item creation process.\n\nHow it is used?\nYou will not be able to create an item instantly without going through the item creation process.`} />
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
            <InfoIcon tip={`What is this?\nThis setting blocks you from creating a supplier instantly without going through the supplier creation process.\n\nHow it is used?\nYou will not be able to create a supplier instantly without going through the supplier creation process.`} />
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
            <InfoIcon tip={`What is this?\nThis setting blocks you from creating a customer instantly without going through the customer creation process.\n\nHow it is used?\nYou will not be able to create a customer instantly without going through the customer creation process.`} />
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
