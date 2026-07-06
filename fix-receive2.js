const fs = require('fs');

function fixReceiveOrder() {
    const file = 'c:/Users/Sanja/OneDrive/Desktop/zaanvar_vendor/components/purchase-bill/receive-order-form.js';
    let content = fs.readFileSync(file, 'utf8');

    // Fix initializations
    content = content.replace(/costPrice: savedItem\.costPrice \|\| "",/g, 'costPrice: savedItem.costPrice !== undefined && savedItem.costPrice !== null && savedItem.costPrice !== "" ? Number(savedItem.costPrice).toFixed(getAmountDecimalPlaces()) : "",');
    content = content.replace(/mrp: savedItem\.mrp \|\| "",/g, 'mrp: savedItem.mrp !== undefined && savedItem.mrp !== null && savedItem.mrp !== "" ? Number(savedItem.mrp).toFixed(getAmountDecimalPlaces()) : "",');

    content = content.replace(/costPrice: item\.costPrice \|\| "",/g, 'costPrice: item.costPrice !== undefined && item.costPrice !== null && item.costPrice !== "" ? Number(item.costPrice).toFixed(getAmountDecimalPlaces()) : "",');
    content = content.replace(/mrp: item\.mrp \|\| productInfo\.mrp \|\| productInfo\.variant\?\.mrp \|\| productInfo\.sellingPrice \|\| item\.sellingPrice \|\| "",/g, 'mrp: (item.mrp || productInfo.mrp || productInfo.variant?.mrp || productInfo.sellingPrice || item.sellingPrice) !== undefined && (item.mrp || productInfo.mrp || productInfo.variant?.mrp || productInfo.sellingPrice || item.sellingPrice) !== null && (item.mrp || productInfo.mrp || productInfo.variant?.mrp || productInfo.sellingPrice || item.sellingPrice) !== "" ? Number(item.mrp || productInfo.mrp || productInfo.variant?.mrp || productInfo.sellingPrice || item.sellingPrice).toFixed(getAmountDecimalPlaces()) : "",');

    content = content.replace(/costPrice: lastBatch\.costPrice \|\| "",/g, 'costPrice: lastBatch.costPrice !== undefined && lastBatch.costPrice !== null && lastBatch.costPrice !== "" ? Number(lastBatch.costPrice).toFixed(getAmountDecimalPlaces()) : "",');
    content = content.replace(/mrp: lastBatch\.mrp \|\| "",/g, 'mrp: lastBatch.mrp !== undefined && lastBatch.mrp !== null && lastBatch.mrp !== "" ? Number(lastBatch.mrp).toFixed(getAmountDecimalPlaces()) : "",');

    // Add onBlur formatting for inputs
    // costPrice input
    content = content.replace(
        /onFocus=\{\(e\) => e\.target\.select\(\)\}\s+onChange=\{\(e\) => handleBatchChange\(index, bIdx, "costPrice", e\.target\.value\)\}/g,
        `onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleBatchChange(index, bIdx, "costPrice", e.target.value)}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value !== "") {
                                                                            handleBatchChange(index, bIdx, "costPrice", Number(e.target.value).toFixed(getAmountDecimalPlaces()));
                                                                        }
                                                                    }}`
    );

    // mrp input
    content = content.replace(
        /onFocus=\{\(e\) => e\.target\.select\(\)\}\s+onChange=\{\(e\) => handleBatchChange\(index, bIdx, "mrp", e\.target\.value\)\}/g,
        `onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleBatchChange(index, bIdx, "mrp", e.target.value)}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value !== "") {
                                                                            handleBatchChange(index, bIdx, "mrp", Number(e.target.value).toFixed(getAmountDecimalPlaces()));
                                                                        }
                                                                    }}`
    );

    // ensure it's type="text"
    content = content.replace(/type=\{mode === "view" \? "text" : "number"\}/g, 'type="text"');
    
    fs.writeFileSync(file, content, 'utf8');
}

function fixPurchaseOrder() {
    const file = 'c:/Users/Sanja/OneDrive/Desktop/zaanvar_vendor/components/purchase-bill/purchase-order-form.js';
    let content = fs.readFileSync(file, 'utf8');

    // Fix cost price onBlur
    content = content.replace(
        /<input\s+type="number"\s+min="0"\s+className=\{styles\.tableInput\}\s+placeholder="0"\s+value=\{item\.costPrice\}\s+onFocus=\{\(e\) => e\.target\.select\(\)\}\s+onChange=\{\(e\) => handleItemChange\(index, "costPrice", e\.target\.value\)\}\s+\/>/g,
        `<input 
            type="text"
            min="0"
            className={styles.tableInput}
            placeholder="0"
            value={item.costPrice}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleItemChange(index, "costPrice", e.target.value)}
            onBlur={(e) => {
                if (e.target.value !== "") {
                    handleItemChange(index, "costPrice", Number(e.target.value).toFixed(getAmountDecimalPlaces()));
                }
            }}
        />`
    );
    
    // Fix item initialization
    content = content.replace(/costPrice: variant\.costPrice \|\| 0,/g, 'costPrice: variant.costPrice ? Number(variant.costPrice).toFixed(getAmountDecimalPlaces()) : "",');
    content = content.replace(/mrp: variant\.mrp \|\| 0,/g, 'mrp: variant.mrp ? Number(variant.mrp).toFixed(getAmountDecimalPlaces()) : "",');
    content = content.replace(/costPrice: item\.costPrice \|\| 0,/g, 'costPrice: item.costPrice ? Number(item.costPrice).toFixed(getAmountDecimalPlaces()) : "",');

    fs.writeFileSync(file, content, 'utf8');
}

fixReceiveOrder();
fixPurchaseOrder();
console.log("Updated both files successfully");
