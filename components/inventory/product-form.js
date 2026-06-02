import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/inventory/product-form.module.css";
// import BarcodeScanner from "./BarcodeScanner";
import useStore from "../state/useStore";
import useDashboardData from "../dashboard/useDashboardData";
import { productService } from "../../services/productService";
import ConfirmationModal from "./confirmation-modal";
import { toast } from "sonner";

const IconPlus = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconX = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconScan = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconChevron = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#999"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const RETAIL_CATEGORIES = ["Food", "Cloths", "Accessories", "Grooming"];
const MEDICAL_CATEGORIES = ["Medicines"];
const PET_TYPES = ["Dog", "Cat", "Bird", "Fish", "Small pets"];
const PACK_TYPES = [
  "BAGS (Bag)",
  "BOTTLES (Btl)",
  "BOX (Box)",
  "BUNDLES (Bdl)",
  "CANS (Can)",
  "CARTONS (Ctn)",
  "DIMENSIONS (Dim)",
  "GRAMMES (Gm)",
  "KILOGRAMS (Kg)",
  "LITRE (Ltr)",
  "METERS (Mtr)",
  "MILILITRE (Ml)",
  "PACKS (Pac)",
  "PAIRS (Prs)",
  "PIECES (Pcs)",
  "QUINTAL (Qtl)",
  "ROLLS (Rol)",
];
const UNIT_TYPES = ["g", "kg", "ml", "ltr", "mtr"];
const MEDICAL_UNITS = ["mg", "ml"];
const CLOTHES_SIZES = ["2XS", "XS", "S", "M", "L", "XL", "2XL"];
const PAIRS_SIZES = ["1", "2", "3", "4", "5", "6", "7"];
const DIMENSION_UNITS = ["mm", "cm", "inches"];

const DIRECT_MEASURE_TYPES = [
  "GRAMMES (Gm)",
  "KILOGRAMS (Kg)",
  "LITRE (Ltr)",
  "MILILITRE (Ml)",
  "METERS (Mtr)",
  "QUINTAL (Qtl)",
  "ROLLS (Rol)",
];
const PACKAGING_TYPES = [
  "BOX (Box)",
  "PACKS (Pac)",
  "BOTTLES (Btl)",
  "CARTONS (Ctn)",
  "BUNDLES (Bdl)",
  "CANS (Can)",
  "BAGS (Bag)",
];
const SIZE_TYPES = ["PIECES (Pcs)", "PAIRS (Prs)"];
const DIMENSION_TYPES = ["DIMENSIONS (Dim)"];

const CATEGORY_MAP = {
  Food: 1,
  Grooming: 1,
  Toys: 2,
  Cloths: 2, // Map to Toys/Apparel ID
  Accessories: 3,
  Medicines: 3,
};

const SUB_CATEGORY_MAP = {
  Dry: 5,
  Wet: 6,
  Puppy: 7,
  Adult: 8,
};

const ProductForm = ({
  initialData,
  onSave,
  onBack,
  productType: propType,
}) => {
  const { jwtToken, userInfo } = useStore();
  const { selectedBranchId: globalBranchId } = useDashboardData({
    skipReviews: true,
  });
  const [branchId, setBranchId] = useState(
    initialData?.branchId || globalBranchId || userInfo?.branchId || 91,
  );
  const userId = userInfo?.userId || userInfo?.id || userInfo?._id || 1;
  const isEdit = !!initialData?.productId;
  const hasPurchaseOrder = isEdit && Array.isArray(initialData?.productsBillItems) && initialData.productsBillItems.length > 0;

  // console.log("ProductForm component rendering", { initialData, propType });

  // Main Form State
  const [productType, setProductType] = useState(
    initialData?.productType || propType || "Retail",
  );
  const [productName, setProductName] = useState(
    initialData?.productName || "",
  );
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [category, setCategory] = useState(() => {
    const raw = initialData?.categoryId;
    let name = "";
    if (typeof raw === "object" && raw?.category) name = raw.category;
    else if (Array.isArray(raw)) name = raw[0];
    else name = raw || "";

    // Match against RETAIL_CATEGORIES case-insensitively
    const match = RETAIL_CATEGORIES.find(
      (c) => c.toLowerCase() === String(name).toLowerCase(),
    );
    return match || name;
  });
  const [subCategory, setSubCategory] = useState(() => {
    const raw = initialData?.subCategoryId;
    if (typeof raw === "object" && raw?.subCategory) return raw.subCategory;
    if (Array.isArray(raw)) return raw[0];
    return raw || "";
  });
  const [selectedPetTypes, setSelectedPetTypes] = useState(() => {
    const reverseMap = {
      Dog: "Dog",
      Cat: "Cat",
      Birds: "Bird",
      Fishes: "Fish",
      SmallPets: "Small pets",
    };
    const raw = initialData?.productPetType?.petType || "";
    if (raw) {
      return raw.split(" and ").map((t) => reverseMap[t] || t);
    }
    return [];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPetDropdownOpen, setIsPetDropdownOpen] = useState(false);
  const petDropdownRef = useRef(null);
  const [productCode, setProductCode] = useState(
    initialData?.ProductCode || "",
  );
  const [gst, setGst] = useState(
    initialData?.taxGroupId || initialData?.gst || "",
  );
  const [hsnCode, setHsnCode] = useState(initialData?.hsnCode || "");
  const [showVariantDeleteConfirm, setShowVariantDeleteConfirm] =
    useState(false);
  const [variantToDeleteIndex, setVariantToDeleteIndex] = useState(null);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);
  const [priceErrors, setPriceErrors] = useState({}); // Stores errors by variant index
  const [formErrors, setFormErrors] = useState({}); // Global form errors

  // Variants State
  const [variants, setVariants] = useState(() => {
    if (initialData?.variants && Array.isArray(initialData.variants)) {
      return initialData.variants
        .filter((v) => v.isActive !== false)
        .map((v) => {
          // Parse size like "150ml" or "150undefined" into value and unit
          let measure = "";
          let unit = "";
          const sizeStr = String(v.variantType?.size || "");

          let dimData = {};
          if (sizeStr.startsWith("{")) {
            try {
              dimData = JSON.parse(sizeStr);
            } catch (e) {
              console.warn("Failed to parse size JSON", e);
            }
          }

          // Clean up "undefined" strings if they leaked into the DB
          const cleanSizeStr = sizeStr.replace(/undefined/g, "");
          const match = cleanSizeStr.match(/^(\d+(?:\.\d+)?)(.*)$/);

          if (match && !sizeStr.startsWith("{")) {
            measure = match[1];
            unit = match[2];
          }

          return {
            ...v,
            _key:
              v.variantId || `key_${Math.random().toString(36).substr(2, 9)}`,
            variantId: v.variantId,
            packType: v.variantType?.packType || v.packType || "",
            packCount: v.variantType?.packCount || v.numberOfPieces || "",
            flavor: v.variantType?.flavor || "",
            size: sizeStr.startsWith("{") ? "" : cleanSizeStr || "",
            unitMeasure: measure || v.variantMeasure || "",
            unitType: unit || v.sizeType?.[0] || "",
            // Dimensional fields from JSON
            height: dimData.height || "",
            heightUnit: dimData.heightUnit || "mm",
            width: dimData.width || "",
            widthUnit: dimData.widthUnit || "mm",
            length: dimData.length || "",
            lengthUnit: dimData.lengthUnit || "mm",
            radius: dimData.radius || "",
            radiusUnit: dimData.radiusUnit || "mm",

            drugType: v.drugType || "",
            strength: v.strength || "",
            variantDescription: v.description || v.variantDescription || "",
            composition: v.productComposition || v.composition || "",
            skuNumber: v.SKU || "",
            eanUpc: v.barcode || v.eanUpcNumber || "",
            minStock: v.minStockAlert ?? 0,
            images:
              (v.productImgs || v.productImages || v.images || [])?.map(
                (img) =>
                  typeof img === "string" ? { preview: img, file: null } : img,
              ) || [],
          };
        });
    }
    return [
      {
        _key: `key_${Date.now()}`,
        packType: "",
        images: [],
        variantDescription: "",
        composition: "",
        minStock: "",
      },
    ];
  });

  const fileInputsRef = useRef([]); // To handle multiple variants
  const handleImageChange = (e, index) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    const newVariants = [...variants];
    newVariants[index].images = [
      ...(newVariants[index].images || []),
      ...newImages,
    ];
    setVariants(newVariants);

    // Clear image error for this variant
    if (formErrors[`${index}_images`]) {
      const newErrors = { ...formErrors };
      delete newErrors[`${index}_images`];
      setFormErrors(newErrors);
    }

    e.target.value = null;
  };

  const removeImage = (e, variantIndex, imgIndex) => {
    e.stopPropagation();
    const newVariants = [...variants];
    const targetVariant = newVariants[variantIndex];

    targetVariant.images.splice(imgIndex, 1);
    setVariants(newVariants);
  };

  const productFileInputRef = useRef(null);
  const handleProductImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setProductImages((prev) => [...prev, ...newImages]);
    e.target.value = null;
  };

  const removeProductImage = (e, index) => {
    e.stopPropagation();
    setProductImages((prev) => {
      const newImgs = [...prev];
      if (newImgs[index].file) {
        URL.revokeObjectURL(newImgs[index].preview);
      }
      newImgs.splice(index, 1);
      return newImgs;
    });
  };

  const handleGenerateProductCode = async () => {
    const tid = toast.loading("Generating product code...");
    try {
      const response = await productService.generateProductCode(jwtToken);
      if (response?.data?.data?.productCode) {
        setProductCode(response.data.data.productCode);

        // Clear product code error
        if (formErrors.productCode) {
          const newErrors = { ...formErrors };
          delete newErrors.productCode;
          setFormErrors(newErrors);
        }

        toast.success("Product code assigned", { id: tid });
      } else {
        toast.error("Failed to generate code", { id: tid });
      }
    } catch (error) {
      console.error("Error generating product code:", error);
      toast.error("Error assigning product code", { id: tid });
    }
  };

  const handleGenerateSku = async (index) => {
    const tid = toast.loading("Generating SKU...");
    try {
      const response = await productService.generateSku(jwtToken);
      if (response?.data?.data?.sku) {
        updateVariant(index, "skuNumber", response.data.data.sku);
        toast.success("SKU assigned", { id: tid });
      } else {
        toast.error("Failed to generate SKU", { id: tid });
      }
    } catch (error) {
      console.error("Error generating SKU:", error);
      toast.error("Error assigning SKU", { id: tid });
    }
  };

  const handleNumericInput = (value, setter, maxLen, errorKey) => {
    const val = value.replace(/\D/g, "");
    if (maxLen && val.length > maxLen) return;
    setter(val);

    if (errorKey && formErrors[errorKey]) {
      const newErrors = { ...formErrors };
      delete newErrors[errorKey];
      setFormErrors(newErrors);
    }
  };

  const updateVariantNumeric = (index, field, value, maxLen) => {
    const val = value.replace(/\D/g, "");
    if (maxLen && val.length > maxLen) return;
    updateVariant(index, field, val);
  };

  const handlePriceInput = (index, field, value) => {
    // Allow digits and at most one decimal point
    let val = value.replace(/[^\d.]/g, "");
    const parts = val.split(".");

    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }

    // Restrict to 2 decimal places if there is a decimal point
    const cleanParts = val.split(".");
    if (cleanParts.length === 2 && cleanParts[1].length > 2) {
      val = cleanParts[0] + "." + cleanParts[1].substring(0, 2);
    }

    updateVariant(index, field, val);

    // Clear sellingPrice/mrp error specifically
    if (field === "sellingPrice" || field === "mrp") {
      const newErrors = { ...priceErrors };
      delete newErrors[index];
      setPriceErrors(newErrors);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    console.log("handleSave function triggered");
    // alert("Save button clicked");
    // Detailed Validations
    let validationErrors = {};
    // Basic Info Validations
    if (!productName.trim()) {
      validationErrors.productName = "Product Name is required";
    }
    if (!category) {
      validationErrors.category = "Category is required";
    }
    if (selectedPetTypes.length === 0) {
      validationErrors.petType = "Select at least one pet type";
    }

    // Length & Format Validations
    if (!productCode) {
      validationErrors.productCode = "Product Code is required";
    } else if (productCode.length < 4 || productCode.length > 6) {
      validationErrors.productCode = "Product Code must be 4-6 digits";
    }

    if (!hsnCode) {
      validationErrors.hsnCode = "HSN Code is required";
    } else if (hsnCode.length < 6 || hsnCode.length > 8) {
      validationErrors.hsnCode = "HSN Code must be 6-8 digits";
    }

    const currentPriceErrors = {};
    variants.forEach((v, index) => {
      // Only require packType for Retail products
      if (productType !== "Medical" && !v.packType) {
        validationErrors[`${index}_packType`] = "Pack Type is required";
      }

      if (
        (DIRECT_MEASURE_TYPES.includes(v.packType) ||
          (PACKAGING_TYPES.includes(v.packType) &&
            v.packType !== "PACKS (Pac)")) &&
        (!v.unitMeasure || !v.unitType)
      ) {
        validationErrors[`${index}_unitMeasure`] =
          "Unit Measure and Unit Type are required";
      }

      if (SIZE_TYPES.includes(v.packType) && !v.size) {
        validationErrors[`${index}_size`] = "Size is required";
      }

      if (v.minStock === "" || v.minStock === undefined) {
        validationErrors[`${index}_minStock`] = "Min Stock Alert is required";
      }

      if (!v.mrp) validationErrors[`${index}_mrp`] = "MRP is required";
      if (!v.sellingPrice)
        validationErrors[`${index}_sellingPrice`] = "Selling Price is required";

      if (!v.images || v.images.length === 0) {
        validationErrors[`${index}_images`] = "At least one image is required";
      }

      const sp = parseFloat(v.sellingPrice) || 0;
      const mrp = parseFloat(v.mrp) || 0;
      if (sp > mrp) {
        currentPriceErrors[index] = "Selling Price cannot be greater than MRP";
      }

      if (v.eanUpc && v.eanUpc.length !== 12 && v.eanUpc.length !== 13) {
        validationErrors[`${index}_eanUpc`] = "EAN/UPC must be 12-13 digits";
      }

      if (!v.skuNumber) {
        validationErrors[`${index}_skuNumber`] = "SKU Number is required";
      } else if (v.skuNumber.length < 4 || v.skuNumber.length > 6) {
        validationErrors[`${index}_skuNumber`] = "SKU must be 4-6 digits";
      }
    });

    setFormErrors(validationErrors);
    setPriceErrors(currentPriceErrors);

    if (
      Object.keys(validationErrors).length > 0 ||
      Object.keys(currentPriceErrors).length > 0
    ) {
      console.warn("Validation failed", {
        validationErrors,
        currentPriceErrors,
      });
      toast.error("Please fill all required fields correctly.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(
      initialData?.productId ? "Updating product..." : "Creating product...",
    );

    try {
      // Mapping names to numeric IDs for the [1, 5] payload structure
      const catId = CATEGORY_MAP[category] || 1;
      const subCatId = SUB_CATEGORY_MAP[subCategory] || 5;

      const petTypeMap = {
        Dog: "Dog",
        Cat: "Cat",
        Bird: "Birds",
        Fish: "Fishes",
        "Small pets": "SmallPets",
      };
      const formattedPetTypes = selectedPetTypes.map((t) => petTypeMap[t] || t);
      const userId = userInfo?.userId || userInfo?.id || userInfo?._id || 1;

      const firstVariant = variants[0] || {};
      const payload = {
        branchId: branchId,
        ProductCode: productCode,
        productName: productName,
        brand: brand,
        categoryId: { category: category },
        subCategoryId: { subCategory: subCategory },
        productType: productType,
        productPetType: { petType: selectedPetTypes.join(" and ") },
        taxGroupId: parseFloat(gst) || 0,
        hsnCode: hsnCode,
        extraAttributes: {
          prescriptionRequired: true,
          storageCondition: "Store below 25°C",
        },
        createdBy: userId,
        variants: variants.map((v) => ({
          variantId: v.variantId, // Ensure ID is sent for updates
          mrp: Number(v.mrp) || 0,
          sellingPrice: Number(v.sellingPrice) || 0,
          productImgs: (v.images || [])
            .map((img) => img.preview)
            .filter((p) => p.startsWith("http")),
          barcode: v.eanUpc || "",
          eanUpcNumber: v.eanUpc || "", // Added as requested
          minStockAlert: Number(v.minStock) || 0,
          variantType: {
            packType: v.packType,
            size: (() => {
              if (productType === "Medical") {
                return `${v.strength || ""}${v.unitType || ""}`;
              }
              if (v.packType === "DIMENSIONS (Dim)") {
                return JSON.stringify({
                  height: v.height || "",
                  width: v.width || "",
                  length: v.length || "",
                  radius: v.radius || "",
                  heightUnit: v.heightUnit || "mm",
                  widthUnit: v.widthUnit || "mm",
                  lengthUnit: v.lengthUnit || "mm",
                  radiusUnit: v.radiusUnit || "mm",
                });
              }
              if (DIRECT_MEASURE_TYPES.includes(v.packType) || (PACKAGING_TYPES.includes(v.packType) && v.packType !== "PACKS (Pac)")) {
                return `${v.unitMeasure || ""}${v.unitType || ""}`;
              }
              return v.size || `${v.unitMeasure || ""}${v.unitType || ""}`;
            })(),
          },
          SKU: v.skuNumber || "",
          sizeType: {
            type: "Count",
          },
          numberOfPieces: (PACKAGING_TYPES.includes(v.packType) || SIZE_TYPES.includes(v.packType)) ? (Number(v.packCount) || 1) : 0,
          drugType: v.drugType || "Tablet",
          strength: v.strength || "",
          productComposition: v.composition || "",
          description: v.variantDescription || "",
          createdBy: userId,
          isActive: true,
        })),
      };

      let response;
      if (initialData?.productId) {
        // Separate existing and new variants for granular updates
        const existingVariants = payload.variants.filter((v) => v.variantId);
        const newVariants = variants.filter((v) => !v.variantId);

        // 1. Update product metadata and existing variants
        const updatePayload = { ...payload, variants: existingVariants };
        response = await productService.updateProduct(
          jwtToken,
          initialData.productId,
          updatePayload,
          false,
        );

        // 2. Create new variants individually using the specific endpoint
        if (newVariants.length > 0) {
          console.log(
            `Creating ${newVariants.length} new variants individually...`,
          );
          for (let i = 0; i < variants.length; i++) {
            const v = variants[i];
            if (v.variantId) continue; // Skip existing ones

            const variantPayload = {
              productId: initialData.productId,
              mrp: Number(v.mrp) || 0,
              sellingPrice: Number(v.sellingPrice) || 0,
              minStockAlert: Number(v.minStock) || 0,
              variantType: {
                packType: v.packType,
                size: (() => {
                  if (productType === "Medical")
                    return `${v.strength || ""}${v.unitType || ""}`;
                  if (v.packType === "DIMENSIONS (Dim)") {
                    return JSON.stringify({
                      height: v.height || "",
                      width: v.width || "",
                      length: v.length || "",
                      radius: v.radius || "",
                      heightUnit: v.heightUnit || "mm",
                      widthUnit: v.widthUnit || "mm",
                      lengthUnit: v.lengthUnit || "mm",
                      radiusUnit: v.radiusUnit || "mm",
                    });
                  }
                  if (DIRECT_MEASURE_TYPES.includes(v.packType) || (PACKAGING_TYPES.includes(v.packType) && v.packType !== "PACKS (Pac)")) {
                    return `${v.unitMeasure || ""}${v.unitType || ""}`;
                  }
                  return v.size || `${v.unitMeasure || ""}${v.unitType || ""}`;
                })(),
              },
              barcode: v.eanUpc || "",
              SKU: v.skuNumber || "",
              productComposition: v.composition || "",
              variantMeasure: 1, // Default as per example
              strength: v.strength || "N/A",
              numberOfPieces: (PACKAGING_TYPES.includes(v.packType) || SIZE_TYPES.includes(v.packType)) ? (Number(v.packCount) || 1) : 0,
              eanUpcNumber: v.eanUpc || "", // Providing both as per example
              drugType:
                v.drugType ||
                (productType === "Medical" ? "Medical" : "Non-Medical"),
              description: v.variantDescription || "",
              createdBy: userId,
            };

            try {
              const vResp = await productService.createVariant(
                jwtToken,
                variantPayload,
              );
              console.log(
                `[DEBUG] New variant creation response for index ${i}:`,
                vResp,
              );

              // Robust ID extraction
              const dataObj = vResp?.data || vResp;
              const innerData = dataObj?.data || dataObj;
              const newId =
                innerData?.variantId ||
                innerData?.id ||
                dataObj?.variantId ||
                dataObj?.id ||
                vResp?.variantId ||
                vResp?.id;

              console.log(`[DEBUG] Extracted ID for index ${i}:`, newId);
              if (newId) {
                v.variantId = newId;
              } else {
                console.error(
                  `[DEBUG] FAILED to extract ID from variant response for index ${i}`,
                  vResp,
                );
              }
            } catch (vErr) {
              console.error("Failed to create individual variant:", vErr);
              toast.error("Failed to add a new variant");
            }
          }
        }
      } else {
        response = await productService.createProduct(jwtToken, payload, false);

        // Extract created variants and map IDs back to the variants array
        const createdProduct =
          response?.data?.data || response?.data || response;
        const createdVariants =
          createdProduct?.variants || createdProduct?.productVariants || [];

        variants.forEach((v, idx) => {
          if (createdVariants[idx]) {
            v.variantId =
              createdVariants[idx].variantId || createdVariants[idx].id;
          }
        });
      }

      console.log("Final Save/Update response:", response);
      if (response) {
        // Handle image uploads for all variants (using the ID from the form state)
        console.log(`Starting image upload for ${variants.length} variants...`);
        let uploadPromises = [];

        for (let i = 0; i < variants.length; i++) {
          const formVariant = variants[i];
          const targetId = formVariant.variantId;

          const variantImages = formVariant.images || [];
          const imageFiles = variantImages
            .filter((img) => img.file)
            .map((img) => img.file);

          console.log(
            `Variant ${i} analysis: ID=${targetId}, newFiles=${imageFiles.length}`,
          );

          if (imageFiles.length > 0 && targetId) {
            console.log(
              `>>> TRIGGERING image upload for Variant ID: ${targetId}`,
            );
            const formData = new FormData();
            imageFiles.forEach((file) => formData.append("productImgs", file));

            const uploadPromise = productService
              .uploadProductImages(jwtToken, targetId, formData)
              .then((upResp) => {
                console.log(
                  `Batch image upload success for ${targetId}:`,
                  upResp,
                );
                return upResp;
              })
              .catch((err) => {
                console.error(
                  `Batch image upload FAILED for ${targetId}:`,
                  err,
                );
                toast.error(`Failed to upload images for variant ${i + 1}`);
              });

            uploadPromises.push(uploadPromise);
          } else {
            console.log(
              `>>> SKIPPING image upload for Variant ${i}: targetId is ${targetId ? "present" : "MISSING"}, imageFiles is ${imageFiles.length}`,
            );
          }
        }

        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
          console.log("All variant image uploads completed.");
        }

        toast.success(
          initialData?.productId
            ? "Product updated successfully"
            : "Product created successfully",
          { id: toastId },
        );
        if (onSave) onSave();
      } else {
        toast.error("Failed to save product. No response from server.", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error?.response?.data?.msg ||
        "Failed to save product. Please try again.",
        { id: toastId },
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleGlobalSave = () => handleSave();
    window.addEventListener("triggerProductSave", handleGlobalSave);
    return () =>
      window.removeEventListener("triggerProductSave", handleGlobalSave);
  }, [handleSave]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        petDropdownRef.current &&
        !petDropdownRef.current.contains(event.target)
      ) {
        setIsPetDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePetTypeToggle = (type) => {
    setSelectedPetTypes((prev) => {
      const next = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];

      // Clear error if at least one type is selected
      if (next.length > 0 && formErrors.petType) {
        const newErrors = { ...formErrors };
        delete newErrors.petType;
        setFormErrors(newErrors);
      }

      return next;
    });
  };

  const handleSelectAllPetTypes = () => {
    let next = [];
    if (selectedPetTypes.length === PET_TYPES.length) {
      next = [];
    } else {
      next = [...PET_TYPES];
    }

    setSelectedPetTypes(next);

    // Clear error if selection is not empty
    if (next.length > 0 && formErrors.petType) {
      const newErrors = { ...formErrors };
      delete newErrors.petType;
      setFormErrors(newErrors);
    }
  };

  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      {
        _key: `key_${Date.now()}`,
        packType: "",
        images: [],
        variantDescription: "",
        composition: "",
        minStock: "",
      },
    ]);

  const removeVariant = (index) => {
    const targetVariant = variants[index];

    // If it's an existing variant (has variantId), show confirmation modal
    if (targetVariant.variantId) {
      setVariantToDeleteIndex(index);
      setShowVariantDeleteConfirm(true);
    } else {
      // If it's a new unsaved variant, just remove it from state
      setVariants((prev) => {
        const filtered = prev.filter((_, i) => i !== index);
        return filtered.length > 0
          ? filtered
          : [
            {
              _key: `key_${Date.now()}`,
              packType: "",
              images: [],
              variantDescription: "",
              minStock: "",
            },
          ];
      });
    }
  };

  const executeVariantDelete = async () => {
    if (variantToDeleteIndex === null) return;

    const targetVariant = variants[variantToDeleteIndex];
    if (!targetVariant.variantId) return;

    setIsDeletingVariant(true);
    try {
      const res = await productService.deleteVariant(
        jwtToken,
        targetVariant.variantId,
      );
      if (res?.status === 200 || res?.data?.status === "success") {
        toast.success("Variant deleted successfully");
        setVariants((prev) => {
          const filtered = prev.filter((_, i) => i !== variantToDeleteIndex);
          return filtered.length > 0
            ? filtered
            : [
              {
                _key: `key_${Date.now()}`,
                packType: "",
                images: [],
                variantDescription: "",
                composition: "",
                minStock: "",
              },
            ];
        });
      } else {
        toast.error("Failed to delete variant");
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      toast.error("An error occurred while deleting the variant");
    } finally {
      setIsDeletingVariant(false);
      setShowVariantDeleteConfirm(false);
      setVariantToDeleteIndex(null);
    }
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);

    // Clear error for this field
    if (formErrors[`${index}_${field}`]) {
      const newErrors = { ...formErrors };
      delete newErrors[`${index}_${field}`];
      setFormErrors(newErrors);
    }
  };

  const InfoIcon = ({ text }) => (
    <span className={styles.infoIcon} data-tooltip={text}>
      ⓘ
    </span>
  );

  return (
    <div className={styles.formCard}>
      <div className={styles.sectionTitle}>Enter product information</div>
      <div className={styles.tabs} style={{ marginBottom: 32 }}>
        <button
          className={`${styles.tab} ${productType === "Retail" ? styles.tabActive : ""}`}
          onClick={() => !(isEdit && hasPurchaseOrder) && setProductType("Retail")}
          disabled={isEdit && hasPurchaseOrder}
        >
          Retail Product
        </button>
        <button
          className={`${styles.tab} ${productType === "Medical" ? styles.tabActive : ""}`}
          onClick={() => !(isEdit && hasPurchaseOrder) && setProductType("Medical")}
          disabled={isEdit && hasPurchaseOrder}
        >
          Medical Products
        </button>
      </div>

      <div className={styles.sectionTitle}>Product Details</div>

      <div className={styles.inputGrid}>
        <div className={styles.inputField}>
          <label>
            Product Name <span>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter Product Name"
            className={formErrors.productName ? styles.errorField : ""}
            value={productName}
            disabled={isEdit && hasPurchaseOrder}
            onChange={(e) => {
              setProductName(e.target.value);
              if (formErrors.productName) {
                const newErrors = { ...formErrors };
                delete newErrors.productName;
                setFormErrors(newErrors);
              }
            }}
          />
          {formErrors.productName && (
            <div className={styles.errorMessage}>{formErrors.productName}</div>
          )}
        </div>
        <div className={styles.inputField}>
          <label>Brand Name</label>
          <input
            type="text"
            placeholder="Enter Brand Name"
            value={brand}
            disabled={isEdit && hasPurchaseOrder}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>
        <div className={styles.inputField}>
          <label>
            Category <span>*</span>
          </label>
          {productType === "Retail" ? (
            <>
              <div className={styles.selectWrapper}>
                <select
                  className={`${!category ? styles.placeholderSelect : ""} ${formErrors.category ? styles.errorField : ""}`}
                  value={category}
                  disabled={isEdit && hasPurchaseOrder}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (formErrors.category) {
                      const newErrors = { ...formErrors };
                      delete newErrors.category;
                      setFormErrors(newErrors);
                    }
                  }}
                >
                  <option value="">Select Category</option>
                  {RETAIL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className={styles.selectIcon}>
                  <IconChevron />
                </div>
              </div>
              {formErrors.category && (
                <div className={styles.errorMessage}>{formErrors.category}</div>
              )}
            </>
          ) : (
            <div className={styles.selectWrapper}>
              <select
                className={`${!category ? styles.placeholderSelect : ""} ${formErrors.category ? styles.errorField : ""}`}
                value={category}
                disabled={isEdit && hasPurchaseOrder}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubCategory("");
                  if (formErrors.category) {
                    const newErrors = { ...formErrors };
                    delete newErrors.category;
                    setFormErrors(newErrors);
                  }
                }}
              >
                <option value="">Select Category</option>
                {MEDICAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className={styles.selectIcon}>
                <IconChevron />
              </div>
            </div>
          )}
        </div>
        <div className={styles.inputField}>
          <label>Sub Category</label>
          <input
            type="text"
            placeholder="Enter Sub Category"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          />
        </div>
        <div className={styles.inputField}>
          <label>
            Pet Type <span>*</span>
          </label>
          <div
            className={`${styles.multiSelectContainer} ${isPetDropdownOpen ? styles.multiSelectActive : ""} ${formErrors.petType ? styles.errorField : ""}`}
            ref={petDropdownRef}
            onClick={() => setIsPetDropdownOpen(!isPetDropdownOpen)}
          >
            <div className={styles.multiSelectValues}>
              {selectedPetTypes.length === 0 && (
                <span className={styles.placeholderText}>Select Pet Types</span>
              )}
              {selectedPetTypes.map((t) => (
                <div key={t} className={styles.tag}>
                  {t}
                  <span
                    className={styles.removeTag}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePetTypeToggle(t);
                    }}
                  >
                    ✕
                  </span>
                </div>
              ))}
            </div>
            <IconChevron />

            {isPetDropdownOpen && (
              <div
                className={styles.optionsDropdown}
                onClick={(e) => e.stopPropagation()}
              >
                {PET_TYPES.filter((t) => !selectedPetTypes.includes(t)).map(
                  (t) => (
                    <div
                      key={t}
                      className={styles.optionItem}
                      onClick={() => {
                        handlePetTypeToggle(t);
                        setIsPetDropdownOpen(false);
                      }}
                    >
                      {t}
                    </div>
                  ),
                )}
                {PET_TYPES.filter((t) => !selectedPetTypes.includes(t))
                  .length === 0 && (
                    <div
                      className={styles.optionItem}
                      style={{ color: "#999", cursor: "default" }}
                    >
                      All types selected
                    </div>
                  )}
              </div>
            )}
          </div>
          {formErrors.petType && (
            <div className={styles.errorMessage}>{formErrors.petType}</div>
          )}
        </div>
        <div className={styles.inputField}>
          <label>
            Product Code <span>*</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Enter Product Code"
              style={{ flex: 1 }}
              className={formErrors.productCode ? styles.errorField : ""}
              value={productCode}
              onChange={(e) =>
                handleNumericInput(
                  e.target.value,
                  setProductCode,
                  6,
                  "productCode",
                )
              }
              readOnly={isEdit}
              disabled={isEdit}
            />
            {!isEdit && (
              <button
                className={styles.pageBtn}
                style={{ background: "#eee", whiteSpace: "nowrap" }}
                onClick={handleGenerateProductCode}
              >
                Assign Code
              </button>
            )}
          </div>
          {formErrors.productCode && (
            <div className={styles.errorMessage}>{formErrors.productCode}</div>
          )}
        </div>
      </div>

      <div className={styles.sectionTitle}>Tax information</div>
      <div className={styles.inputGrid}>
        <div className={styles.inputField}>
          <label>
            GST(%) <InfoIcon text="Goods and Services Tax percentage." />
          </label>
          <input
            type="text"
            placeholder="Enter GST(%)"
            value={gst}
            disabled={isEdit && hasPurchaseOrder}
            onChange={(e) => setGst(e.target.value)}
          />
        </div>
        <div className={styles.inputField}>
          <label>
            HSN Code <span>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter HSN Code"
            className={formErrors.hsnCode ? styles.errorField : ""}
            value={hsnCode}
            disabled={isEdit && hasPurchaseOrder}
            onChange={(e) =>
              handleNumericInput(e.target.value, setHsnCode, 8, "hsnCode")
            }
          />
          {formErrors.hsnCode && (
            <div className={styles.errorMessage}>{formErrors.hsnCode}</div>
          )}
        </div>
      </div>

      <div
        className={styles.sectionTitle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Variants
        {!hasPurchaseOrder && (
          <div className={styles.variantActions}>
            <button
              className={styles.pageBtn}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                padding: "6px 16px",
              }}
              onClick={addVariant}
            >
              <IconPlus /> Add Variant
            </button>
          </div>
        )}
      </div>

      {variants.map((variant, index) => {
        const isDirect = DIRECT_MEASURE_TYPES.includes(variant.packType);
        const isPackaged = PACKAGING_TYPES.includes(variant.packType);
        const isSizeBased = SIZE_TYPES.includes(variant.packType);
        const isDimensional = DIMENSION_TYPES.includes(variant.packType);

        return (
          <div
            key={variant._key || variant.variantId || index}
            className={styles.variantBox}
          >
            <div className={styles.variantHeader}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#666" }}>
                Variant #{index + 1}
              </div>
              <div className={styles.variantActions}>
                {(!isEdit || !variant.variantId || !hasPurchaseOrder) && (
                  <span
                    className={styles.windowActionIcon}
                    onClick={() => console.log("Scan triggered")}
                    title="Scan Barcode"
                  >
                    <IconScan />
                  </span>
                )}
                {!hasPurchaseOrder && (
                  <span
                    className={styles.windowActionIcon}
                    style={{ color: "#ff4d4f" }}
                    onClick={() => removeVariant(index)}
                    title="Remove Variant"
                  >
                    <IconTrash />
                  </span>
                )}
              </div>
            </div>

            <div className={styles.inputGrid}>
              {productType === "Medical" ? (
                <>
                  <div className={styles.inputField}>
                    <label>Drug Type</label>
                    <input
                      type="text"
                      placeholder="Tablet"
                      value={variant.drugType || ""}
                      disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                      onChange={(e) =>
                        updateVariant(index, "drugType", e.target.value)
                      }
                    />
                  </div>
                  <div className={styles.inputField}>
                    <label>Strength</label>
                    <div className={styles.dimInputGroup}>
                      <input
                        type="text"
                        placeholder="Enter strength"
                        value={variant.strength || ""}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "strength", e.target.value)
                        }
                      />
                      <select
                        value={variant.unitType || "ml"}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "unitType", e.target.value)
                        }
                      >
                        {MEDICAL_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.inputField}>
                    <label>
                      Pack Type <span>*</span>{" "}
                      <InfoIcon text="Outer packing type of the product." />
                    </label>
                    <select
                      className={`${!variant.packType ? styles.placeholderSelect : ""} ${formErrors[`${index}_packType`] ? styles.errorField : ""}`}
                      value={variant.packType || ""}
                      disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                      onChange={(e) =>
                        updateVariant(index, "packType", e.target.value)
                      }
                    >
                      <option value="">Select Pack Type</option>
                      {PACK_TYPES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {formErrors[`${index}_packType`] && (
                      <div className={styles.errorMessage}>
                        {formErrors[`${index}_packType`]}
                      </div>
                    )}
                  </div>

                  {isPackaged && (
                    <>
                      <div className={styles.inputField}>
                        <label>
                          Pack Count{" "}
                          <InfoIcon text="How many pieces/items are inside that pack." />
                        </label>
                        <input
                          type="text"
                          placeholder="Enter count"
                          value={variant.packCount || ""}
                          disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                          onChange={(e) =>
                            updateVariantNumeric(index, "packCount", e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {isSizeBased && (
                <>
                  <div className={styles.inputField}>
                    <label>
                      Pack Count{" "}
                      <InfoIcon text="How many pieces/items are inside that pack." />
                    </label>
                    <input
                      type="text"
                      placeholder="Enter count"
                      value={variant.packCount || ""}
                      onChange={(e) =>
                        updateVariantNumeric(index, "packCount", e.target.value)
                      }
                    />
                  </div>
                  <div className={styles.inputField}>
                    <label>
                      Size <span>*</span>{" "}
                      <InfoIcon text="The specific size of the item." />
                    </label>
                    <select
                      className={`${!variant.size ? styles.placeholderSelect : ""} ${formErrors[`${index}_size`] ? styles.errorField : ""}`}
                      value={variant.size || ""}
                      disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                      onChange={(e) =>
                        updateVariant(index, "size", e.target.value)
                      }
                    >
                      <option value="">Select size</option>
                      {variant.packType === "PIECES (Pcs)"
                        ? CLOTHES_SIZES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))
                        : PAIRS_SIZES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </select>
                    {formErrors[`${index}_size`] && (
                      <div className={styles.errorMessage}>
                        {formErrors[`${index}_size`]}
                      </div>
                    )}
                  </div>
                </>
              )}

              {isDimensional && (
                <div
                  className={styles.dimensionalGrid}
                  style={{ gridColumn: "span 2" }}
                >
                  <div className={styles.dimensionItem}>
                    <label>Height</label>
                    <div className={styles.dimInputGroup}>
                      <input
                        type="text"
                        placeholder="0"
                        value={variant.height || ""}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "height", e.target.value)
                        }
                      />
                      <select
                        value={variant.heightUnit || "mm"}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "heightUnit", e.target.value)
                        }
                      >
                        {DIMENSION_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.dimensionItem}>
                    <label>Width</label>
                    <div className={styles.dimInputGroup}>
                      <input
                        type="text"
                        placeholder="0"
                        value={variant.width || ""}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "width", e.target.value)
                        }
                      />
                      <select
                        value={variant.widthUnit || "mm"}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "widthUnit", e.target.value)
                        }
                      >
                        {DIMENSION_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.dimensionItem}>
                    <label>Length</label>
                    <div className={styles.dimInputGroup}>
                      <input
                        type="text"
                        placeholder="0"
                        value={variant.length || ""}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "length", e.target.value)
                        }
                      />
                      <select
                        value={variant.lengthUnit || "mm"}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "lengthUnit", e.target.value)
                        }
                      >
                        {DIMENSION_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.dimensionItem}>
                    <label>Radius</label>
                    <div className={styles.dimInputGroup}>
                      <input
                        type="text"
                        placeholder="0"
                        value={variant.radius || ""}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "radius", e.target.value)
                        }
                      />
                      <select
                        value={variant.radiusUnit || "mm"}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "radiusUnit", e.target.value)
                        }
                      >
                        {DIMENSION_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {(isDirect ||
                (isPackaged && variant.packType !== "PACKS (Pac)")) && (
                  <div className={styles.inputField}>
                    <label>
                      Unit Measure <span>*</span>{" "}
                      <InfoIcon text="Measurement value of one piece/item inside the pack." />
                    </label>
                    <div
                      className={`${styles.dimInputGroup} ${formErrors[`${index}_unitMeasure`] ? styles.errorField : ""}`}
                    >
                      <input
                        type="text"
                        placeholder="Enter Unit Measure"
                        value={variant.unitMeasure || ""}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "unitMeasure", e.target.value)
                        }
                      />
                      <select
                        value={variant.unitType || ""}
                        disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                        onChange={(e) =>
                          updateVariant(index, "unitType", e.target.value)
                        }
                      >
                        <option value="">unit</option>
                        {UNIT_TYPES.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formErrors[`${index}_unitMeasure`] && (
                      <div className={styles.errorMessage}>
                        {formErrors[`${index}_unitMeasure`]}
                      </div>
                    )}
                  </div>
                )}

              <div className={styles.inputField}>
                <label>EAN/UPC Number</label>
                <input
                  type="text"
                  placeholder="Enter EAN/UPC Number"
                  className={
                    formErrors[`${index}_eanUpc`] ? styles.errorField : ""
                  }
                  value={variant.eanUpc || ""}
                  disabled={isEdit && !!variant.variantId && hasPurchaseOrder}
                  onChange={(e) =>
                    updateVariantNumeric(index, "eanUpc", e.target.value, 13)
                  }
                />
                {formErrors[`${index}_eanUpc`] && (
                  <div className={styles.errorMessage}>
                    {formErrors[`${index}_eanUpc`]}
                  </div>
                )}
              </div>
              <div className={styles.inputField}>
                <label>
                  SKU Number <span>*</span>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Enter SKU Number"
                    style={{ flex: 1 }}
                    className={
                      formErrors[`${index}_skuNumber`] ? styles.errorField : ""
                    }
                    value={variant.skuNumber || ""}
                    onChange={(e) =>
                      updateVariantNumeric(
                        index,
                        "skuNumber",
                        e.target.value,
                        6,
                      )
                    }
                    readOnly={isEdit && !!variant.variantId}
                    disabled={isEdit && !!variant.variantId}
                  />
                  {(!isEdit || !variant.variantId) && (
                    <button
                      className={styles.pageBtn}
                      style={{ background: "#eee", whiteSpace: "nowrap" }}
                      onClick={() => handleGenerateSku(index)}
                    >
                      Assign Code
                    </button>
                  )}
                </div>
                {formErrors[`${index}_skuNumber`] && (
                  <div className={styles.errorMessage}>
                    {formErrors[`${index}_skuNumber`]}
                  </div>
                )}
              </div>
              <div className={styles.inputField}>
                <label>
                  Min Stock Alert <span>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Min Stock"
                  className={
                    formErrors[`${index}_minStock`] ? styles.errorField : ""
                  }
                  value={variant.minStock || ""}
                  onChange={(e) =>
                    updateVariantNumeric(index, "minStock", e.target.value)
                  }
                />
                {formErrors[`${index}_minStock`] && (
                  <div className={styles.errorMessage}>
                    Min Stock Alert is required
                  </div>
                )}
              </div>
              <div className={styles.inputField}>
                <label>
                  MRP <span>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter MRP"
                  className={
                    formErrors[`${index}_mrp`] ? styles.errorField : ""
                  }
                  value={variant.mrp || ""}
                  onChange={(e) =>
                    handlePriceInput(index, "mrp", e.target.value)
                  }
                />
                {formErrors[`${index}_mrp`] && (
                  <div className={styles.errorMessage}>MRP is required</div>
                )}
              </div>
              <div className={styles.inputField}>
                <label>
                  Selling Price <span>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Selling Price"
                  className={
                    formErrors[`${index}_sellingPrice`] || priceErrors[index]
                      ? styles.errorField
                      : ""
                  }
                  value={variant.sellingPrice || ""}
                  onChange={(e) => {
                    handlePriceInput(index, "sellingPrice", e.target.value);
                    if (
                      priceErrors[index] ||
                      formErrors[`${index}_sellingPrice`]
                    ) {
                      const newPriceErrors = { ...priceErrors };
                      delete newPriceErrors[index];
                      setPriceErrors(newPriceErrors);

                      const newFormErrors = { ...formErrors };
                      delete newFormErrors[`${index}_sellingPrice`];
                      setFormErrors(newFormErrors);
                    }
                  }}
                />
                {(formErrors[`${index}_sellingPrice`] ||
                  priceErrors[index]) && (
                    <div className={styles.errorMessage}>
                      {formErrors[`${index}_sellingPrice`] || priceErrors[index]}
                    </div>
                  )}
              </div>
            </div>
            {/* Per-Variant Additional Information Section */}
            <div style={{ marginTop: 32 }}>
              <div
                className={styles.sectionTitle}
                style={{
                  fontSize: 15,
                  marginBottom: 16,
                  background: "none",
                  padding: 0,
                }}
              >
                Additional information of product
              </div>
              <div className={styles.inputGrid} style={{ borderRadius: 8 }}>
                {productType === "Medical" ? (
                  <>
                    <div className={styles.inputField}>
                      <label>Add Product Description</label>
                      <textarea
                        placeholder="Type here"
                        value={variant.variantDescription || ""}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "variantDescription",
                            e.target.value,
                          )
                        }
                        rows={4}
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label>
                        Product Composition{" "}
                        <InfoIcon text="Ingredients or chemical makeup." />
                      </label>
                      <textarea
                        placeholder="Type here"
                        value={variant.composition || ""}
                        onChange={(e) =>
                          updateVariant(index, "composition", e.target.value)
                        }
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  <div
                    className={styles.inputField}
                    style={{ gridColumn: "span 2" }}
                  >
                    <label>Add Product Description</label>
                    <textarea
                      placeholder="Type here"
                      value={variant.variantDescription || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "variantDescription",
                          e.target.value,
                        )
                      }
                      rows={4}
                    />
                  </div>
                )}

                {/* Per-Variant Image Upload Section inside Additional Info */}
                <div
                  className={styles.inputField}
                  style={{ gridColumn: "span 2", marginTop: 16 }}
                >
                  <label>
                    Add Product Images <span>*</span>
                  </label>
                  <div className={styles.imageUpload}>
                    <input
                      type="file"
                      ref={(el) => (fileInputsRef.current[index] = el)}
                      onChange={(e) => handleImageChange(e, index)}
                      multiple
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                    <div
                      className={styles.uploadItem}
                      onClick={() => fileInputsRef.current[index]?.click()}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>+</div>
                      <span style={{ fontSize: 12, color: "#999" }}>
                        Tap to Select Photo
                      </span>
                    </div>
                    {(variant.images || []).map((img, imgIdx) => (
                      <div key={imgIdx} className={styles.imagePreview}>
                        <img
                          src={img.preview}
                          alt={`Variant ${index} Img ${imgIdx}`}
                        />
                        <button
                          className={styles.removeImageBtn}
                          onClick={(e) => removeImage(e, index, imgIdx)}
                          title="Remove Image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  {formErrors[`${index}_images`] && (
                    <div
                      className={styles.errorMessage}
                      style={{ marginTop: 8 }}
                    >
                      {formErrors[`${index}_images`]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 16,
          marginTop: 40,
          marginBottom: 20,
        }}
      >
        <button className={styles.pageBtn} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={`${styles.pageBtn} ${styles.nextBtn}`}
          onClick={handleSave}
          disabled={isSaving}
          style={{
            background: isSaving ? "#666" : "#000",
            color: "#fff",
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <ConfirmationModal
        isOpen={showVariantDeleteConfirm}
        title="Delete Variant?"
        message="Are you sure you want to delete this variant? This action cannot be undone."
        onConfirm={executeVariantDelete}
        onCancel={() => setShowVariantDeleteConfirm(false)}
        confirmText={isDeletingVariant ? "Deleting..." : "Yes"}
      />
    </div>
  );
};

export default ProductForm;
