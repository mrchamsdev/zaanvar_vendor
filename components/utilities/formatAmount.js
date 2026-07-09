import useStore from "../state/useStore";

/**
 * Returns the number of decimal places configured in vendor settings, defaulting to 2.
 */
export const getAmountDecimalPlaces = () => {
    const settings = useStore.getState().vendorSettings;
    return settings?.general?.amountDecimalPlaces ?? 2;
};

export const getMinDecimalPlaces = () => {
    return getAmountDecimalPlaces();
};

Number.prototype.toDynamicFixed = function() {
    const decimals = getAmountDecimalPlaces();
    const minDecimals = getMinDecimalPlaces();
    const factor = Math.pow(10, decimals);
    const rounded = Math.round((this + 1e-9) * factor) / factor;
    return rounded.toLocaleString('en-US', {
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
    
    const factor = Math.pow(10, decimals);
    const rounded = Math.round((num + 1e-9) * factor) / factor;
    return rounded.toLocaleString(undefined, {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: decimals,
    });
};
