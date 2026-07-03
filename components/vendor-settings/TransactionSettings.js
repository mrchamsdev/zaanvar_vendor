import React, { useRef, useState } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

const InfoIcon = ({ tip }) => (
  <span className={styles.infoIcon} title={tip || "More info"}>ⓘ</span>
);

const CheckRow = ({ id, checked, onChange, label, tip, children }) => (
  <>
    <div className={styles.checkRow}>
      <input
        id={id}
        type="checkbox"
        className={styles.checkInput}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={id} className={styles.checkLabel}>{label}</label>
      <InfoIcon tip={tip} />
    </div>
    {checked && children && (
      <div className={styles.subField}>{children}</div>
    )}
  </>
);

const TransactionSettings = ({ settings, onChange }) => {
  const t = settings;
  const [showTaxModal, setShowTaxModal] = useState(false);

  const set = (field, val) => onChange({ ...t, [field]: val });
  const toggle = (field) => (e) => set(field, e.target.checked);

  /* ── PIN input refs for auto-advance ── */
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];

  const handlePinKey = (idx, e) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const pin = (t.txnEditPasscode || "    ").split("");
    pin[idx] = digit || " ";
    set("txnEditPasscode", pin.join("").trimEnd() || null);
    if (digit && idx < 3) pinRefs[idx + 1].current?.focus();
    if (!digit && e.key === "Backspace" && idx > 0) pinRefs[idx - 1].current?.focus();
  };

  const pinDigits = (t.txnEditPasscode || "").padEnd(4, "").split("");

  return (
    <div className={styles.twoColGrid}>
      {/* ══ LEFT column ══ */}
      <div>
        {/* Transaction Header */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Transaction Settings</div>

          <CheckRow
            id="invoiceBillNoEditable"
            checked={t.invoiceBillNoEditable}
            onChange={toggle("invoiceBillNoEditable")}
            label="Invoice / Bill No."
            tip="When ON, invoice number is auto-generated but user can edit it. When OFF, auto-generated only."
          />

          <CheckRow
            id="addTimeOnTransactions"
            checked={t.addTimeOnTransactions}
            onChange={toggle("addTimeOnTransactions")}
            label="Add Time on Transactions"
            tip="When ON, a time field is added near payment date fields."
          />

          <CheckRow
            id="cashSaleByDefault"
            checked={t.cashSaleByDefault}
            onChange={toggle("cashSaleByDefault")}
            label="Cash Sale"
            tip="When ON, payment type defaults to Cash. When OFF, user must select a payment type."
          />

          <CheckRow
            id="billingNameOfCustomer"
            checked={t.billingNameOfCustomer}
            onChange={toggle("billingNameOfCustomer")}
            label="Billing Name of Customer"
            tip="When ON, billing name and billing person name fields are added to sale invoices."
          />


        </div>

        {/* Item Table Settings */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Item Table Settings</div>

          <CheckRow
            id="inclusiveExclusiveTaxOnRate"
            checked={t.inclusiveExclusiveTaxOnRate}
            onChange={toggle("inclusiveExclusiveTaxOnRate")}
            label="Inclusive / Exclusive Tax on Rate (Price/Unit)"
            tip="When OFF, no with/without tax option in products tab. When ON, with/without tax is available and applied to invoices."
          />

          <CheckRow
            id="displayPurchasePriceOfItems"
            checked={t.displayPurchasePriceOfItems}
            onChange={toggle("displayPurchasePriceOfItems")}
            label="Display Purchase Price of Items"
            tip="When ON, selling price and purchase price both show in the product dropdown inside sale invoice."
          />
        </div>
      </div>

      {/* ══ RIGHT column ══ */}
      <div>
        {/* More Transaction Features */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>More Transaction Features</div>

          {/* Passcode */}
          <CheckRow
            id="passcodeForTxnEdit"
            checked={t.passcodeForTxnEdit}
            onChange={toggle("passcodeForTxnEdit")}
            label="Enable Passcode for transaction edit"
            tip="When ON, editing a payment in Payment In or Payment Out requires a 4-digit PIN."
          >
            <div>
              <div className={styles.fieldLabel} style={{ marginBottom: 8 }}>
                Set 4-digit PIN
              </div>
              <div className={styles.pinWrap}>
                {pinDigits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={pinRefs[idx]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    className={styles.pinInput}
                    value={d.trim()}
                    onChange={(e) => handlePinKey(idx, e)}
                    onKeyDown={(e) => handlePinKey(idx, e)}
                    id={`pin-digit-${idx}`}
                  />
                ))}
              </div>
            </div>
          </CheckRow>

          <CheckRow
            id="discountDuringPayments"
            checked={t.discountDuringPayments}
            onChange={toggle("discountDuringPayments")}
            label="Discount During Payments"
            tip="When ON, a discount field is added to Payment In and Payment Out forms."
          />

          <CheckRow
            id="linkPaymentsToInvoices"
            checked={t.linkPaymentsToInvoices}
            onChange={toggle("linkPaymentsToInvoices")}
            label="Link Payments to Invoices"
            tip="When ON, a 'Link Payment' button appears in Payment In and Payment Out to associate payments with specific orders."
          />

          <CheckRow
            id="showProfitWhileMakingInvoice"
            checked={t.showProfitWhileMakingInvoice}
            onChange={toggle("showProfitWhileMakingInvoice")}
            label="Show Profit while making Sale Invoice"
            tip="When ON, a graph icon in the sale invoice opens a profit breakdown popup."
          />

          <CheckRow
            id="termsAndConditions"
            checked={t.termsAndConditions}
            onChange={toggle("termsAndConditions")}
            label="Terms and Conditions"
            tip="When ON, a Terms and Conditions text field is added to sale invoices."
          />
        </div>

        {/* Taxes, Discount & Totals */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Taxes, Discount &amp; Totals</div>

          <CheckRow
            id="transactionWiseTax"
            checked={t.transactionWiseTax}
            onChange={(e) => {
              if (e.target.checked) {
                setShowTaxModal(true);
              } else {
                toggle("transactionWiseTax")(e);
              }
            }}
            label="Transaction wise Tax"
            tip="When ON, an overall transaction-level tax field appears. Note: Only one tax per bill."
          />

          <CheckRow
            id="transactionWiseDiscount"
            checked={t.transactionWiseDiscount}
            onChange={toggle("transactionWiseDiscount")}
            label="Transaction wise Discount"
            tip="When ON, an overall transaction-level discount field appears."
          />

          {/* Round Off Total */}
          <div className={styles.checkRow}>
            <input
              id="roundOffTotal"
              type="checkbox"
              className={styles.checkInput}
              checked={t.roundOffTotal}
              onChange={toggle("roundOffTotal")}
            />
            <label htmlFor="roundOffTotal" className={styles.checkLabel}>
              Round Off Total
            </label>
            <InfoIcon tip="Applies to purchase orders, payment out/in, sale invoices, returns, supplier pay now." />
          </div>
          {t.roundOffTotal && (
            <div className={styles.subField}>
              <div className={styles.fieldLabel}>Rounding Method</div>
              <div className={styles.inlineRow}>
                <span style={{ fontSize: 12, color: "#888" }}>e.g. Nearest To</span>
                <select
                  id="roundOffType"
                  className={styles.select}
                  style={{ width: 140 }}
                  value={t.roundOffType}
                  onChange={(e) => set("roundOffType", e.target.value)}
                >
                  <option value="nearest">Nearest</option>
                  <option value="down">Down To</option>
                  <option value="up">Up To</option>
                </select>
                <span style={{ fontSize: 12, color: "#888" }}>To</span>
                <select
                  className={styles.select}
                  style={{ width: 70 }}
                  value={t.roundOffValue || 1}
                  onChange={(e) => set("roundOffValue", parseFloat(e.target.value))}
                >
                  <option value="1">1</option>
                  <option value="0.5">0.5</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTaxModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            backgroundColor: "#333", borderRadius: 16, padding: 24, width: 340,
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, lineHeight: 1.4, margin: "0 0 24px 0", textAlign: "left" }}>
              According to Government there should not be tax on tax. You have enabled item wise tax, so you should not enable transaction level tax. Do you wish to continue?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                onClick={() => setShowTaxModal(false)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 20, border: "none",
                  backgroundColor: "#555", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowTaxModal(false);
                  set("transactionWiseTax", true);
                }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 20, border: "none",
                  backgroundColor: "#0A7CFF", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer"
                }}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionSettings;
