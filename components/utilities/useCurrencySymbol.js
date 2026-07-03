import useStore from "../state/useStore";

export default function useCurrencySymbol() {
  const settings = useStore((state) => state.vendorSettings);
  return settings?.general?.businessCurrency || "₹";
}
