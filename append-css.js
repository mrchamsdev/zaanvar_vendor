const fs = require('fs');
const cssPath = 'c:/Users/Sanja/OneDrive/Desktop/zaanvar_vendor/styles/sale/add-sale-invoice.module.css';

const newCss = `
/* Minimized Bar and Cost Calculation Popup Styles */
.minimizedBar {
    position: fixed;
    bottom: 0;
    left: 272px; /* Assuming sidebar width */
    right: 0;
    background: #ffffff;
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 24px;
    z-index: 50;
}

@media (max-width: 1024px) {
    .minimizedBar {
        left: 0;
    }
}

.minimizedBalance {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 16px;
    font-weight: 700;
}

.minimizedActions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.profitBtn {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-right: 12px;
}

.profitBtn:hover {
    background: #f9fafb;
    border-color: #d1d5db;
}

.profitIcon {
    width: 20px;
    height: 20px;
    color: #e91e63;
}

/* Cost Calculation Modal */
.costCalcModalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
}

.costCalcModalContent {
    background: #ffffff;
    border-radius: 12px;
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.costCalcHeader {
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.costCalcHeader h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
}

.costCalcClose {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 4px;
}

.costCalcClose:hover {
    background: #f3f4f6;
    color: #111827;
}

.costCalcBody {
    padding: 0;
    overflow-y: auto;
    flex: 1;
}

.costCalcTable {
    width: 100%;
    border-collapse: collapse;
}

.costCalcTable th {
    background: #f9fafb;
    padding: 16px 24px;
    text-align: left;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
}

.costCalcTable td {
    padding: 16px 24px;
    font-size: 14px;
    color: #111827;
    border-bottom: 1px solid #e5e7eb;
}

.costCalcSummary {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.costCalcSummaryRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #374151;
    font-weight: 500;
}

.costCalcProfitRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    margin-top: 16px;
    border-top: 1px solid #e5e7eb;
    font-size: 16px;
    font-weight: 600;
}

.profitFormula {
    font-size: 12px;
    color: #6b7280;
    font-weight: 400;
    margin-top: 4px;
}
`;

fs.appendFileSync(cssPath, newCss, 'utf8');
console.log("CSS appended");
