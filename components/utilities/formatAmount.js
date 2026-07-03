import useStore from "../state/useStore";

/**
 * Returns the number of decimal places configured in vendor settings, defaulting to 2.
 */
export const getAmountDecimalPlaces = () => {
    const settings = useStore.getState().vendorSettings;
    return settings?.general?.amountDecimalPlaces ?? 2;
};

export const getMinDecimalPlaces = () => {
    return Math.min(2, getAmountDecimalPlaces());
};

Number.prototype.toDynamicFixed = function() {
    const decimals = getAmountDecimalPlaces();
    const minDecimals = getMinDecimalPlaces();
    return this.toLocaleString('en-US', {
        useGrouping: false,
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Hook for functional components if reactive updates are needed.
 */
export function useAmountDecimalPlaces() {
  const settings = useStore((state) => state.vendorSettings);
  return settings?.general?.amountDecimalPlaces ?? 2;
}

/**
 * Safely format amount with the configured decimal places.
 */
export const formatAmount = (amount) => {
    const decimals = getAmountDecimalPlaces();
    const minDecimals = getMinDecimalPlaces();
    const num = Number(amount);
    if (isNaN(num)) return Number(0).toLocaleString(undefined, { minimumFractionDigits: minDecimals, maximumFractionDigits: decimals });
    
    return num.toLocaleString(undefined, {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: decimals,
    });
};
