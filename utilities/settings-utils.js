export const getBoolSetting = (vendorSettings, key, defaultValue) => {
    if (!vendorSettings) return defaultValue;
    let val = vendorSettings?.transaction?.[key] ?? vendorSettings?.general?.[key] ?? vendorSettings?.item?.[key] ?? vendorSettings?.[key];
    if (val === undefined || val === null) return defaultValue;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return Boolean(val);
};
