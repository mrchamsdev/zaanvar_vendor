import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/inventory/products.module.css";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import ProductFormManager from "../../components/inventory/product-form-manager";
import ConfirmationModal from "../../components/inventory/confirmation-modal";
import { IconSearch } from "../../components/dashboard/DashboardLayout";
import { toast } from "sonner";
import EmptyState from "../../components/utilities/EmptyState";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { useRouter } from "next/router";
import useCurrencySymbol from "@/components/utilities/useCurrencySymbol";
import { getBoolSetting } from "../../utilities/settings-utils";
import { formatAmount } from "../../components/utilities/formatAmount";
import usePermissions from "../../components/utilities/usePermissions";

const ActiveProductIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M0.0762206 6.00862C0.166619 5.75442 0.446025 5.62158 0.700283 5.71194L5.90882 7.56389C6.22648 7.67686 6.57333 7.67686 6.89093 7.56389L12.0995 5.71194C12.3538 5.62158 12.6332 5.75442 12.7235 6.00862C12.814 6.26289 12.6811 6.54231 12.4268 6.63274L7.21829 8.48462C6.6889 8.67284 6.11085 8.67284 5.58146 8.48462L0.372903 6.63274C0.118645 6.54231 -0.0141848 6.26289 0.0762206 6.00862Z" fill="#09B51A"/><path fillRule="evenodd" clipRule="evenodd" d="M0.0762206 8.7762C0.166619 8.52199 0.446025 8.38916 0.700283 8.47952L5.90882 10.3315C6.22648 10.4444 6.57333 10.4444 6.89093 10.3315L12.0995 8.47952C12.3538 8.38916 12.6332 8.52199 12.7235 8.7762C12.814 9.03047 12.6811 9.30989 12.4268 9.40031L7.21829 11.2522C6.6889 11.4404 6.11085 11.4404 5.58146 11.2522L0.372903 9.40031C0.118645 9.30989 -0.0141848 9.03047 0.0762206 8.7762Z" fill="#09B51A"/><path fillRule="evenodd" clipRule="evenodd" d="M7.12354 1.10469C6.65617 0.934721 6.14385 0.934721 5.67641 1.10469L1.08442 2.77451C0.941476 2.82649 0.941482 3.02865 1.08442 3.08063L5.67641 4.75046C6.14385 4.92043 6.65617 4.92043 7.12354 4.75046L11.7155 3.08063C11.8585 3.02865 11.8585 2.82648 11.7155 2.77451L7.12354 1.10469ZM5.34247 0.186311C6.02561 -0.0621036 6.77441 -0.0621036 7.45755 0.186311L12.0495 1.85613C13.0502 2.21999 13.0502 3.63515 12.0495 3.99901L7.45755 5.66885C6.77441 5.91726 6.02561 5.91726 5.34247 5.66885L0.750469 3.99901C-0.25016 3.63515 -0.250153 2.21999 0.750469 1.85613L5.34247 0.186311Z" fill="#09B51A"/><path d="M12.7998 5.46875C14.3714 5.46886 15.6494 6.7477 15.6494 8.31934C15.6493 9.89088 14.3714 11.1688 12.7998 11.1689C11.2282 11.1689 9.94932 9.89095 9.94922 8.31934C9.94922 6.74764 11.2281 5.46875 12.7998 5.46875Z" fill="#4BAE4F" stroke="white" strokeWidth="0.7"/><mask id="path-5-inside-1_6006_84556" fill="white"><path fillRule="evenodd" clipRule="evenodd" d="M14.3475 7.2407C14.425 7.3182 14.425 7.4457 14.3475 7.5232L12.4725 9.3982C12.4337 9.43695 12.3825 9.45695 12.3312 9.45695C12.28 9.45695 12.2287 9.43695 12.3312 9.45695C12.28 9.45695 12.2287 9.43695 12.19 9.3982L11.2525 8.4607C11.175 8.3832 11.175 8.2557 11.2525 8.1782C11.33 8.1007 11.4575 8.1007 11.535 8.1782L12.3312 8.97445L14.065 7.2407C14.1425 7.16195 14.27 7.16195 14.3475 7.2407Z"/></mask><path fillRule="evenodd" clipRule="evenodd" d="M14.3475 7.2407C14.425 7.3182 14.425 7.4457 14.3475 7.5232L12.4725 9.3982C12.4337 9.43695 12.3825 9.45695 12.3312 9.45695C12.28 9.45695 12.2287 9.43695 12.3312 9.45695C12.28 9.45695 12.2287 9.43695 12.19 9.3982L11.2525 8.4607C11.175 8.3832 11.175 8.2557 11.2525 8.1782C11.33 8.1007 11.4575 8.1007 11.535 8.1782L12.3312 8.97445L14.065 7.2407C14.1425 7.16195 14.27 7.16195 14.3475 7.2407Z" fill="white"/><path d="M14.3475 7.2407L13.8485 7.73172L13.8525 7.73568L14.3475 7.2407ZM14.3475 7.5232L13.8525 7.02823V7.02823L14.3475 7.5232ZM12.4725 9.3982L12.9674 9.89318V9.89318L12.4725 9.3982ZM12.19 9.3982L11.695 9.89318V9.89318L12.19 9.3982ZM11.2525 8.4607L11.7474 7.96573V7.96573L11.2525 8.4607ZM11.535 8.1782L12.0299 7.68323V7.68323L11.535 8.1782ZM12.3312 8.97445L11.8362 9.46943L12.3312 9.9644L12.8262 9.46943L12.3312 8.97445ZM14.065 7.2407L14.56 7.73569L14.5639 7.7317L14.065 7.2407ZM14.3475 7.2407L13.8525 7.73568C13.6566 7.53981 13.6566 7.2241 13.8525 7.02823L14.3475 7.5232L14.8424 8.01818C15.1933 7.66731 15.1933 7.0966 14.8424 6.74573L14.3475 7.2407ZM14.3475 7.5232L13.8525 7.02823L11.9775 8.90323L12.4725 9.3982L12.9674 9.89318L14.8424 8.01818L14.3475 7.5232ZM12.4725 9.3982L11.9775 8.90323L12.4725 9.3982ZM12.4725 9.3982L11.9775 8.90323C12.0731 8.80759 12.2013 8.75695 12.3312 8.75695V9.45695V10.157C12.5637 10.157 12.7943 10.0663 12.9674 9.89318L12.4725 9.3982ZM12.3312 9.45695V8.75695C12.4612 8.75695 12.5893 8.80759 12.6849 8.90323L12.19 9.3982L11.695 9.89318C11.8681 10.0663 12.0988 10.157 12.3312 10.157V9.45695ZM12.19 9.3982L12.6849 8.90323L11.7474 7.96573L11.2525 8.4607L10.7575 8.95568L11.695 9.89318L12.19 9.3982ZM11.2525 8.4607L11.7474 7.96573C11.9433 8.1616 11.9433 8.47731 11.7474 8.67318L11.2525 8.1782L10.7575 7.68323C10.4066 8.0341 10.4066 8.60481 10.7575 8.95568L11.2525 8.4607ZM11.2525 8.1782L11.7474 8.67318C11.5516 8.86904 11.2359 8.86904 11.04 8.67318L11.535 8.1782L12.0299 7.68323C11.6791 7.33236 11.1084 7.33236 10.7575 7.68323L11.2525 8.1782ZM11.535 8.1782L11.04 8.67318L11.8362 9.46943L12.3312 8.97445L12.8262 8.47948L12.0299 7.68323L11.535 8.1782ZM12.3312 8.97445L12.8262 9.46943L14.5599 7.73568L14.065 7.2407L13.57 6.74573L11.8362 8.47948L12.3312 8.97445ZM14.065 7.2407L14.5639 7.7317C14.3671 7.93162 14.0453 7.93162 13.8485 7.7317L14.3475 7.2407L14.8464 6.7497C14.4946 6.39229 13.9178 6.39229 13.566 6.7497L14.065 7.2407Z" fill="white" mask="url(#path-5-inside-1_6006_84556)"/></svg>);

const InactiveProductIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M0.0762206 6.00862C0.166619 5.75442 0.446025 5.62158 0.700283 5.71194L5.90882 7.56389C6.22648 7.67686 6.57333 7.67686 6.89093 7.56389L12.0995 5.71194C12.3538 5.62158 12.6332 5.75442 12.7235 6.00862C12.814 6.26289 12.6811 6.54231 12.4268 6.63274L7.21829 8.48462C6.6889 8.67284 6.11085 8.67284 5.58146 8.48462L0.372903 6.63274C0.118645 6.54231 -0.0141848 6.26289 0.0762206 6.00862Z" fill="#E60000"/><path fillRule="evenodd" clipRule="evenodd" d="M0.0762206 8.7762C0.166619 8.52199 0.446025 8.38916 0.700283 8.47952L5.90882 10.3315C6.22648 10.4444 6.57333 10.4444 6.89093 10.3315L12.0995 8.47952C12.3538 8.38916 12.6332 8.52199 12.7235 8.7762C12.814 9.03047 12.6811 9.30989 12.4268 9.40031L7.21829 11.2522C6.6889 11.4404 6.11085 11.4404 5.58146 11.2522L0.372903 9.40031C0.118645 9.30989 -0.0141848 9.03047 0.0762206 8.7762Z" fill="#E60000"/><path fillRule="evenodd" clipRule="evenodd" d="M7.12354 1.10469C6.65617 0.934721 6.14385 0.934721 5.67641 1.10469L1.08442 2.77451C0.941476 2.82649 0.941482 3.02865 1.08442 3.08063L5.67641 4.75046C6.14385 4.92043 6.65617 4.92043 7.12354 4.75046L11.7155 3.08063C11.8585 3.02865 11.8585 2.82648 11.7155 2.77451L7.12354 1.10469ZM5.34247 0.186311C6.02561 -0.0621036 6.77441 -0.0621036 7.45755 0.186311L12.0495 1.85613C13.0502 2.21999 13.0502 3.63515 12.0495 3.99901L7.45755 5.66885C6.77441 5.91726 6.02561 5.91726 5.34247 5.66885L0.750469 3.99901C-0.25016 3.63515 -0.250153 2.21999 0.750469 1.85613L5.34247 0.186311Z" fill="#E60000"/><path d="M12.7998 5.46875C14.3714 5.46886 15.6494 6.7477 15.6494 8.31934C15.6493 9.89088 14.3714 11.1688 12.7998 11.1689C11.2282 11.1689 9.94932 9.89095 9.94922 8.31934C9.94922 6.74764 11.2281 5.46875 12.7998 5.46875Z" fill="#E60000" stroke="white" strokeWidth="0.7"/><path d="M11.5127 7.03125C11.5983 6.94567 11.7387 6.9457 11.8242 7.03125L14.0869 9.29395C14.1725 9.37949 14.1725 9.51989 14.0869 9.60547C14.0122 9.68022 13.8958 9.68961 13.8105 9.63379L13.7754 9.60547L11.5127 7.34277C11.4271 7.25723 11.4271 7.11683 11.5127 7.34277Z" fill="white" stroke="#E60000" strokeWidth="0.2"/><path d="M13.7754 7.03125C13.8609 6.94569 14.0013 6.94568 14.0869 7.03125C14.1725 7.11684 14.1725 7.25724 14.0869 7.34277L11.8242 9.60547C11.7387 9.69103 11.5983 9.69105 11.5127 9.60547C11.4271 9.51987 11.4272 9.37947 11.5127 9.29395L13.7754 7.03125Z" fill="white" stroke="#E60000" strokeWidth="0.2"/></svg>);

/* ── Inline Icons ────────────────────────────────────────── */
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ProductsPage = () => {
  const currencySymbol = useCurrencySymbol();
  const { view, addEdit, canDelete } = usePermissions("Inventory", "Products");

  const router = useRouter();
  const { userInfo, jwtToken, vendorSettings, _hasHydrated: isHydrated } = useStore();
  const manageItemStatus = getBoolSetting(vendorSettings, "manageItemStatus", false);
  const { branches, branchId: defaultBranchId, setSelectedBranchId, selectedBranchId: branchId } = useDashboardData({ skipReviews: true });
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, expired: 0, damaged: 0, saleReturn: 0 });

  const [productType, setProductType] = useState("Retail");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [formMode, setFormMode] = useState("Add");
  const [editProductData, setEditProductData] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [triggerAddProduct, setTriggerAddProduct] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const filteredProducts = searchTerm ? products.filter(p =>
    (p.productName || p.name || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.ProductCode || p.productCode || "")?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : products;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + rowsPerPage);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (router.isReady && router.query.action === 'add') {
      setIsAddingProduct(true);
      setFormMode("Add");
      // Clear query param
      const { action, ...restQuery } = router.query;
      router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.action]);

  useEffect(() => {
    if (router.isReady && branchId) {
      fetchStats();
      fetchProducts();
    }
  }, [router.isReady, branchId, jwtToken, productType, debouncedSearchTerm, currentPage, rowsPerPage, manageItemStatus]);

  // Clear selections when changing branch or product type
  useEffect(() => {
    setSelectedIds([]);
  }, [branchId, productType]);

  const fetchStats = async () => {
    try {
      const data = await productService.getDamagedExpiredReports(jwtToken, branchId);
      if (data && data.counts) {
        setStats({
          total: data.counts.totalBranchProducts || 0,
          expired: data.counts.expiredProducts || 0,
          damaged: data.counts.damageProducts || 0,
          saleReturn: data.counts.saleReturn || data.counts.damagedReturns || 0
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts(
        jwtToken,
        branchId,
        productType,
        debouncedSearchTerm,
        currentPage,
        rowsPerPage
      );
      const normalizedProducts = (result.products || []).reduce((acc, p) => {
        if (p.isActive === false || p.isActive === "false" || p.isActive === 0 || p.isActive === "0") {
          return acc;
        }

        let activeVariants = p.variants || [];
        if (manageItemStatus) {
          activeVariants = activeVariants.filter(v => v.isActive === true || v.isActive === "true");
        }
        if (manageItemStatus && activeVariants.length === 0) return acc;
        
        acc.push({
          ...p,
          variants: activeVariants,
          productId: p.productId || p.id || p.ID || p._id
        });
        return acc;
      }, []);
      setProducts(normalizedProducts);
      setTotalProducts(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allCurrentIds = paginatedProducts.map(p => p.productId);
    const areAllCurrentSelected = allCurrentIds.every(id => selectedIds.includes(id));

    if (areAllCurrentSelected) {
      setSelectedIds(prev => prev.filter(id => !allCurrentIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allCurrentIds])]);
    }
  };

  const handlePageChange = (direction) => {
    if (direction === "next" && (currentPage * rowsPerPage < filteredProducts.length)) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]);
  };

  const getUnitDisplay = (v) => {
    if (!v) return "-";

    const vt = (v.variantType && typeof v.variantType === 'object') ? v.variantType : {};

    // 1. Get main measure
    const rawStrength = v.strength || "";
    const strength = (rawStrength && rawStrength.toUpperCase() !== "N/A" && rawStrength !== "undefined") ? rawStrength : "";

    let size = (vt.size && vt.size !== "1" && vt.size !== 1 && vt.size !== "undefined") ? vt.size :
      (v.size && v.size !== "1" && v.size !== 1 && v.size !== "undefined" ? v.size : "");

    if (typeof size === 'string' && size.trim().startsWith('{')) {
      try {
        const dim = JSON.parse(size);
        const parts = [];
        if (dim.height) parts.push(`H:${dim.height}${dim.heightUnit || 'mm'}`);
        if (dim.width) parts.push(`W:${dim.width}${dim.widthUnit || 'mm'}`);
        if (dim.length) parts.push(`L:${dim.length}${dim.lengthUnit || 'mm'}`);
        if (dim.radius) parts.push(`R:${dim.radius}${dim.radiusUnit || 'mm'}`);
        size = parts.join(" x ");
      } catch (e) {
        console.warn("Failed to parse dimension JSON for display", e);
      }
    }

    const flavor = vt.flavor || "";
    let detailInfo = (strength || size || "").toString().trim();
    if (flavor) detailInfo = `${detailInfo} ${flavor}`.trim();

    // 2. Get packaging info
    const count = v.numberOfPieces || vt.packCount || "";
    const type = vt.packType || vt.type || "";
    const packagingInfo = `${count} ${type}`.trim();

    if (packagingInfo && detailInfo) {
      return `${packagingInfo} (${detailInfo})`;
    }

    return (packagingInfo || detailInfo || "-");
  };

  const isSizeBasedVariant = (v) => {
    if (!v) return false;
    const vt = (v.variantType && typeof v.variantType === 'object') ? v.variantType : {};
    const packType = vt.packType || v.packType || "";
    return ["PIECES (Pcs)", "PAIRS (Prs)"].includes(packType);
  };

  const handleDelete = () => {
    const selectedProducts = products.filter(p => selectedIds.includes(p.productId));
    const hasRestrictedProducts = selectedProducts.some(p =>
      p.hasOrders === true ||
      p.hasOrders === "true" ||
      (p.variants && p.variants.some(v => v.hasOrders === true || v.hasOrders === "true"))
    );

    if (hasRestrictedProducts) {
      toast.error("Cannot delete: Some selected products have active orders.");
      return;
    }

    if (selectedIds.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const executeDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          const res = await productService.deleteProduct(jwtToken, id);
          if (res?.status === 200 || res?.data?.status === "success" || res?.statusText === "OK") {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Failed to delete product ${id}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} product(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} product(s)`);
      }

      setSelectedIds([]);
      fetchProducts();
      fetchStats();
    } catch (e) {
      console.error("Bulk delete error:", e);
      toast.error("An error occurred during deletion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      customTopbarRight={(
        addEdit ? (
          <div className={styles.addBtnWrapper}>
            <button
              className={styles.addBtn}
              onClick={() => { setFormMode("Add"); setIsAddingProduct(true); setTriggerAddProduct(prev => prev + 1); }}
            >
              <IconPlus /> Add Product
            </button>
          </div>
        ) : null
      )}
    >
      <div className={styles.container}>
        {/* Multi-tasking Manager Overlay */}
        {isAddingProduct && (
          <ProductFormManager
            mode={formMode}
            initialData={formMode === "Add" ? null : editProductData}
            trigger={triggerAddProduct}
            productType={productType}
            onClose={() => {
              setIsAddingProduct(false);
              fetchProducts();
              if (router.query.returnUrl) {
                router.push(router.query.returnUrl);
              }
            }}
          />
        )}

        {/* Fixed Top Section */}
        <div className={styles.topSection}>
          {/* Status & Tabs Row */}
          <div className={styles.statusTabsRow}>
            <div className={styles.statusGroup}>
              <span className={styles.statusLabel}>Overall Status :</span>
              <div className={styles.statusBadge}>TOTAL Products: {String(stats.total).padStart(2, '0')}</div>
              <div className={styles.statusBadge}>Expired Products : {stats.expired}</div>
              <div className={styles.statusBadge}>Damaged Products : {stats.damaged}</div>
              <div className={styles.statusBadge}>Sale Return : {stats.saleReturn}</div>
            </div>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${productType === "Retail" ? styles.tabActive : ""}`}
                onClick={() => { setProductType("Retail"); setCurrentPage(1); }}
              >
                Retail Product
              </button>
              <button
                className={`${styles.tab} ${productType === "Medical" ? styles.tabActive : ""}`}
                onClick={() => { setProductType("Medical"); setCurrentPage(1); }}
              >
                Medical Products
              </button>
            </div>
          </div>

          {/* Search Row */}
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search products by product code or product name"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px 0', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f5790c',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#666', fontSize: '14px' }}>Loading products...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            buttonText={addEdit ? "Add Product" : null}
            onAddClick={() => { if(addEdit) { setFormMode("Add"); setIsAddingProduct(true); setTriggerAddProduct(prev => prev + 1); } }}
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      onChange={selectAll}
                      checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.productId))}
                    />
                  </th>
                  <th rowSpan="2">Product Code</th>
                  <th rowSpan="2">Product Name</th>
                  <th rowSpan="2">Brand</th>
                  <th rowSpan="2">Category Type</th>
                  <th colSpan="5" className={styles.variantsHeader}>VARIANTS</th>
                </tr>
                <tr className={styles.subHeaderRow}>
                  <th>Unit</th>
                  <th>Quantity</th>
                  <th>Open Stock Qty</th>
                  <th>Hold Qty</th>
                  <th>MRP</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40 }}>No products matching search</td></tr>
                ) : (
                  paginatedProducts.map((product) => {
                    const isExpanded = expandedRows.includes(product.productId);
                    const firstVariant = product.variants?.[0] || {};
                    const otherVariants = product.variants?.slice(1) || [];
                    const hasMultipleVariants = product.variants?.length > 1;

                    const productId = product.productId || product.id || product.ID || product._id;
                    return (
                      <React.Fragment key={productId}>
                        <tr>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(productId)}
                              onChange={() => toggleSelection(productId)}
                            />
                          </td>
                          <td>
                            <span className={styles.productCodeCell}>
                              <span className={styles.productCodeText}>{product.ProductCode || product.productCode || "-"}</span>
                              {manageItemStatus && (product.productActiveStatus ? <ActiveProductIcon /> : <InactiveProductIcon />)}
                            </span>
                          </td>
                          <td>{product.productName || product.name || "-"}</td>
                          <td>{product.brand?.name || product.brand || "-"}</td>
                          <td>
                            {Array.isArray(product.categoryId)
                              ? product.categoryId.map(c => typeof c === 'object' ? (c.category || c.name || JSON.stringify(c)) : c).join(", ")
                              : (typeof product.categoryId === 'object' ? (product.categoryId.category || product.categoryId.name) : product.categoryId) || "-"}
                          </td>
                          <td>{getUnitDisplay(firstVariant)}</td>
                          <td>{firstVariant.stockUpdates?.totalQuantity ?? firstVariant.currentQty ?? firstVariant.numberOfPieces ?? "-"}</td>
                          <td>{firstVariant.stockUpdates?.openStockQuantity ?? "0"}</td>
                          <td>{firstVariant.stockUpdates?.onHoldQuantity ?? "0"}</td>
                          <td
                            style={{ fontWeight: 600, cursor: hasMultipleVariants ? 'pointer' : 'default' }}
                            onClick={() => hasMultipleVariants && toggleRowExpansion(productId)}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span>{currencySymbol} {firstVariant.mrp ? formatAmount(firstVariant.mrp) : "-"}</span>
                              {hasMultipleVariants && (
                                <div style={{ marginTop: -4 }}>
                                  {expandedRows.includes(productId) ? <IconChevronUp /> : <IconChevronDown />}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedRows.includes(productId) && otherVariants.map((v) => (
                          <tr key={v.variantId} className={styles.variantRow}>
                            <td colSpan="5"></td>
                            <td>{getUnitDisplay(v)}</td>
                            <td>{v.stockUpdates?.totalQuantity ?? v.currentQty ?? v.numberOfPieces ?? v.variantMeasure ?? "-"}</td>
                            <td>{v.stockUpdates?.openStockQuantity ?? "0"}</td>
                            <td>{v.stockUpdates?.onHoldQuantity ?? "0"}</td>
                            <td style={{ fontWeight: 600 }}>{currencySymbol} {v.mrp ? formatAmount(v.mrp) : "-"}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer/Pagination */}
        {products.length > 0 && (
          <div className={styles.pagination}>
            <div className={styles.paginationLeft}>
              <div className={styles.rowsPerPage}>
                Rows per Page
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>
                  {filteredProducts.length > 0 ? `${(currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filteredProducts.length)} of ${filteredProducts.length} Items` : "0-0 of 0 Items"}
                </span>
              </div>
            </div>

            <div className={styles.paginationCenter}>
              {selectedIds.length > 0 && (
                <div className={styles.bulkActionsInline}>
                  <span
                    className={styles.bulkCount}
                    onClick={() => setSelectedIds([])}
                    style={{ cursor: 'pointer' }}
                    title="Unselect All"
                  >
                    ✕ {selectedIds.length} Items Selected
                  </span>
                  <div className={styles.bulkDivider} />
                  <div
                    className={styles.actionItem}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const fullProducts = [];
                        for (const id of selectedIds) {
                          const res = await productService.getProductById(jwtToken, id);
                          let prod = res?.data?.data || res?.data;
                          if (prod) {
                            prod = {
                              ...prod,
                              productId: prod.productId || prod.id || prod.ID || prod._id
                            };
                            fullProducts.push(prod);
                          }
                        }
                        setEditProductData(fullProducts);
                        setFormMode("View");
                        setIsAddingProduct(true);
                        setTriggerAddProduct(prev => prev + 1);
                      } catch (e) {
                        console.error("Error fetching full product details:", e);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <IconEye /> View
                  </div>
                  {addEdit && (
                    <div
                      className={styles.actionItem}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const fullProducts = [];
                          for (const id of selectedIds) {
                            const res = await productService.getProductById(jwtToken, id);
                            let prod = res?.data?.data || res?.data;
                            if (prod) {
                              prod = {
                                ...prod,
                                productId: prod.productId || prod.id || prod.ID || prod._id
                              };
                              fullProducts.push(prod);
                            }
                          }
                          setEditProductData(fullProducts);
                          setFormMode("Edit");
                          setIsAddingProduct(true);
                          setTriggerAddProduct(prev => prev + 1);
                        } catch (e) {
                          console.error("Error fetching full product details for edit:", e);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <IconEdit /> Edit
                    </div>
                  )}
                  {canDelete && (
                    <div className={styles.actionItem} onClick={handleDelete}>
                      <IconTrash /> Delete
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.paginationRight}>
              <div style={{ display: 'flex', gap: 12 }}>
                {currentPage > 1 && (
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange("prev")}
                  >
                    Previous
                  </button>
                )}
                {currentPage * rowsPerPage < filteredProducts.length && (
                  <button
                    className={`${styles.pageBtn} ${styles.nextBtn}`}
                    onClick={() => handlePageChange("next")}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Delete Products?"
          message={`Are you sure you want to delete ${selectedIds.length} selected product(s)? This action is permanent and cannot be undone.`}
          onConfirm={executeDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="OK"
          closeText="Cancel"
          cancelText="Cancel"
        />

      </div>
    </DashboardLayout>
  );
};

export default ProductsPage;
