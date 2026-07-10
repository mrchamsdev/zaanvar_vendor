import React, { useRef, useState } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";
import TermsListPopup from "./TermsListPopup";

const InfoIcon = ({ tip }) => {
  const [visible, setVisible] = React.useState(false);
  const [showBelow, setShowBelow] = React.useState(false);
  const [alignRight, setAlignRight] = React.useState(false);
  if (!tip) return null;

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.5) {
      setShowBelow(true);
    } else {
      setShowBelow(false);
    }

    const windowWidth = window.innerWidth;
    const distanceToRight = windowWidth - rect.left;
    if (distanceToRight < 240) {
      setAlignRight(true);
    } else {
      setAlignRight(false);
    }

    setVisible(true);
  };

  const formattedContent = tip.split("\n\n").map((paragraph, index) => {
    const lines = paragraph.split("\n");
    return (
      <div key={index} style={{ marginBottom: index === lines.length - 1 ? 0 : '12px' }}>
        {lines.map((line, lIndex) => {
          const isHeader = line.endsWith("?") || line === "What is this?" || line === "Why use it?" || line === "Why to use?" || line === "How it is used?" || line === "Why use?" || line.startsWith("GSTIN Number") || line.startsWith("Business Currency");
          return (
            <div key={lIndex} style={{ 
              fontWeight: isHeader ? '700' : '400',
              fontSize: isHeader ? '13px' : '12px',
              color: isHeader ? '#fff' : '#e5e7eb',
              lineHeight: '1.5',
              marginBottom: isHeader ? '4px' : '0'
            }}>
              {line}
            </div>
          );
        })}
      </div>
    );
  });

  return (
    <span 
      className={styles.infoIconWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
    >
      <span className={styles.infoIcon}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>
      {visible && (
        <div className={`${showBelow ? styles.customTooltipBelow : styles.customTooltip} ${alignRight ? styles.alignRight : ''}`}>
          {formattedContent}
          <div className={showBelow ? styles.tooltipArrowBelow : styles.tooltipArrow}></div>
        </div>
      )}
    </span>
  );
};

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
  const [showTermsModal, setShowTermsModal] = useState(false);

  const set = (field, val) => onChange({ ...t, [field]: val });
  const toggle = (field) => (e) => set(field, e.target.checked);



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
            tip={`What is this?\nZaanvar will assign invoice/bill numbers automatically to your transactions like sales, expenses, etc.\n\nHow it is used?\nInvoice/bill numbers will be assigned to every invoice, and the number will keep increasing as you continue creating invoices in Zaanvar. You can also change the number manually.\n\nWhy to use?\nKeep track of your invoices and assign unique invoice numbers automatically.`}
          />

          <CheckRow
            id="addTimeOnTransactions"
            checked={t.addTimeOnTransactions}
            onChange={toggle("addTimeOnTransactions")}
            label="Add Time on Transactions"
            tip={`What is this?\nThis setting allows Zaanvar users to enter the time of the transaction along with the date at the time of creating it.\n\nHow it is used?\nYou can enter the time of the transaction whenever you open a new transaction form or open an existing transaction for editing.\n\nWhy to use?\nTime on transactions allows users to keep a record of time-critical transactions, such as retail slips. It also helps users differentiate between two transactions with the same party on the same date.`}
          />

          <CheckRow
            id="cashSaleByDefault"
            checked={t.cashSaleByDefault}
            onChange={toggle("cashSaleByDefault")}
            label="Cash Sale by Default"
            tip={`What is this?\nAll Sale Invoices will be treated as Paid in Full without any pending dues. Zaanvar will also allow you to create Sale Invoices without selecting any Party.\n\nHow it is used?\nThe Cash Sale option will be selected by default in Sale Invoices. You can always change it to a Credit Invoice manually.\n\nWhy to use?\nThis setting is useful for retailers and businesses that make over-the-counter sales where customers pay the full amount upfront.`}
          />

          <CheckRow
            id="billingNameOfCustomer"
            checked={t.billingNameOfCustomer}
            onChange={toggle("billingNameOfCustomer")}
            label="Billing Name of Customer"
            tip={`What is this?\nEnables you to add a billing name in Sale Invoices and Sale Orders. This billing name will be printed on invoices in place of the Party name.\n\nHow it is used?\nAfter enabling this setting, you will be able to enter a billing name in transactions, which will be printed on invoices.\n\nWhy to use?\nThis feature is useful when customer names are very similar and a proper billing name needs to be printed on invoices for each customer.`}
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
            label="Display Purchase Price"
            tip={`What is this?\nThe purchase price of items will be shown in the item list while adding an item to Sales, Purchases, and other transactions.\n\nWhy to use?\nThis helps you understand the price at which you purchased an item and determine the appropriate profit margin when selling it.`}
          />
        </div>
      </div>

      {/* ══ RIGHT column ══ */}
      <div>
        {/* More Transaction Features */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>More Transaction Features</div>



          <CheckRow
            id="discountDuringPayments"
            checked={t.discountDuringPayments}
            onChange={toggle("discountDuringPayments")}
            label="Discount During Payments"
            tip={`What is this?\nEnables you to add and track discounts during Payment-In and Payment-Out transactions.\n\nWhy to use?\nFor example, if a customer has to pay ₹1,000 but pays only ₹900, and you agree to accept ₹900 as full payment, then the remaining ₹100 is recorded as a discount. The original bill amount remains ₹1,000, and the discount amount can be entered while recording the payment transaction.`}
          />

          <CheckRow
            id="linkPaymentsToInvoices"
            checked={t.linkPaymentsToInvoices}
            onChange={toggle("linkPaymentsToInvoices")}
            label="Link Payments to Invoices"
            tip={`What is this?\nYou can link Payment In transactions (money received) to the unpaid invoices/bills of a party. Once a payment is linked to an invoice, the invoice will be marked as Paid.\n\nHow it is used?\nWhile receiving payments through a Payment In transaction or while editing a sale/purchase transaction, Zaanvar provides options to receive and link payments to invoices.\n\nWhy to use?\nThis feature helps you track invoice statuses as Unpaid, Partially Paid, or Paid. It also links received payments to invoices for complete payment tracking.`}
          />

          <CheckRow
            id="showProfitWhileMakingInvoice"
            checked={t.showProfitWhileMakingInvoice}
            onChange={toggle("showProfitWhileMakingInvoice")}
            label="Show Profit while making Sale Invoice"
            tip={`What is this?\nThis allows the user to view the profit they would be making on a particular sale invoice.\n\nHow it is used?\nEnabling this setting adds a button to the Sale Invoice form that displays the cost breakdown and the profit to be made on the sale invoice.`}
          />

          <CheckRow
            id="termsAndConditions"
            checked={t.termsAndConditions}
            onChange={toggle("termsAndConditions")}
            label="Terms and Conditions"
            tip={`What is this?\nEnables you to print Terms and Conditions on Sale Invoices, Delivery Challans, Sale Orders, Estimates/Quotations, Purchases, and Purchase Orders.\n\nHow it is used?\nAfter enabling this setting, you can set transaction-specific Terms and Conditions. These will appear on invoices, and you can also customize them for each transaction.`}
          />
          {t.termsAndConditions && (
            <div className={styles.subField} style={{ marginTop: 8 }}>
              <button
                className={styles.btnLink}
                type="button"
                onClick={() => setShowTermsModal(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#E93E64",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: 0
                }}
              >
                Terms and Conditions List
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 4 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}

          <CheckRow
            id="dueDatesAndPaymentNotifications"
            checked={t.dueDatesAndPaymentNotifications}
            onChange={toggle("dueDatesAndPaymentNotifications")}
            label="Due Dates and Payment Notifications"
            tip={`What is this?\nEnables tracking of due dates and automatic notifications for pending customer payments.\n\nWhy to use?\nHelps you stay on top of outstanding invoices and automate payment reminders.`}
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
            tip={`What is this?\nAllows you to apply a single tax to the entire Sale/Purchase transaction instead of applying different taxes to each item being sold or purchased.\n\nHow it is used?\nYou can apply one tax to all the line items in a transaction. This tax is calculated on the subtotal of all individual line items.\n\nWhy to use?\nIf all the stock items in a transaction have the same tax rate, this setting lets you apply the tax once to the entire invoice instead of setting it separately for each item.`}
          />

          <CheckRow
            id="transactionWiseDiscount"
            checked={t.transactionWiseDiscount}
            onChange={toggle("transactionWiseDiscount")}
            label="Transaction wise Discount"
            tip={`What is this?\nAllows you to apply a single discount to the entire Sale/Purchase transaction instead of applying different discounts to each item being sold or purchased.\n\nHow it is used?\nYou can apply one discount to all the line items in a transaction. The discount is calculated on the subtotal of all individual line items.\n\nWhy to use?\nIf you offer a discount on the entire invoice or bill rather than on individual items, this option allows you to apply the discount once to the whole transaction.`}
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
            <InfoIcon tip={`What is this?\nEnabling this setting gives you the option to round off the transaction amount to the nearest value you select.\n\nWhy to use?\nIf you do not want decimal values in your transactions, you can round the total amount to the nearest whole number (or any other selected value) using this option.`} />
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
                  <option value="10">10</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="1000">1000</option>
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
            backgroundColor: "#ffffff", borderRadius: 16, padding: 24, width: 340,
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            border: "1px solid #e5e7eb",
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}>
            <p style={{ color: "#1f2937", fontSize: 14, fontWeight: 500, lineHeight: 1.4, margin: "0 0 24px 0", textAlign: "left" }}>
              According to Government there should not be tax on tax. You have enabled item wise tax, so you should not enable transaction level tax. Do you wish to continue?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                onClick={() => setShowTaxModal(false)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 20, border: "1px solid #d1d5db",
                  backgroundColor: "#f3f4f6", color: "#1f2937", fontSize: 14, fontWeight: 600, cursor: "pointer"
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
                  backgroundColor: "#E93E64", color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer"
                }}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {showTermsModal && (
        <TermsListPopup onClose={() => setShowTermsModal(false)} />
      )}
    </div>
  );
};

export default TransactionSettings;
