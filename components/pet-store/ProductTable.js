import React, { useState } from "react";
import styles from "../../styles/pet-store/products.module.css";
import { FiTrash2, FiEdit2, FiX } from "react-icons/fi";

const ProductTable = ({ 
  products = [], 
  type, 
  onTypeChange, 
  onSelectionChange,
  onView,
  onDelete,
  onEdit,
  selectedIds = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredProducts = products.filter(p => 
    p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.productCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + rowsPerPage);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(paginatedProducts.map(p => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableSearch}>
        <input 
          type="text" 
          placeholder="Search products here" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.productTable}>
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  className={styles.checkbox}
                  onChange={toggleSelectAll}
                  checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                />
              </th>
              <th>CODE</th>
              <th>PRODUCT NAME</th>
              <th>BRAND</th>
              <th>CATEGORY TYPE</th>
              <th>QUANTITY</th>
              <th>OPEN STOCK QTY</th>
              <th>HOLD QTY</th>
              <th>MRP</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <input 
                      type="checkbox" 
                      className={styles.checkbox}
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelectOne(product.id)}
                    />
                  </td>
                  <td>{product.productCode || "-"}</td>
                  <td 
                    className={styles.clickableName} 
                    onClick={() => onView(product)}
                  >
                    {product.productName}
                  </td>
                  <td>{product.brandName || "-"}</td>
                  <td>{product.category?.name || "Product"}</td>
                  <td>{product.totalQuantity || "00"}</td>
                  <td>{product.openingStock || "00"}</td>
                  <td>{product.holdQuantity || "00"}</td>
                  <td className={styles.mrp}>₹{product.mrp || "0"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div className={styles.paginationLeft}>
          <div className={styles.rowsPerPage}>
            Rows per Page 
            <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className={styles.itemCount}>
            {filteredProducts.length > 0 ? `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, filteredProducts.length)} of ${filteredProducts.length} Items` : "0-0 of 0 Items"}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className={styles.integratedSelectionBar}>
            <span className={styles.closeSelection} onClick={() => onSelectionChange([])}><FiX /></span>
            <span>{selectedIds.length} Items Selected</span>
            <span className={styles.divider}>|</span>
            <button className={styles.inlineDeleteBtn} onClick={onDelete}>
              <FiTrash2 /> Delete
            </button>
            {selectedIds.length === 1 && (
              <button className={styles.inlineEditBtn} onClick={() => onEdit(selectedIds[0])}>
                <FiEdit2 /> Edit
              </button>
            )}
          </div>
        )}

        <div className={styles.pageActions}>
          <button 
            className={styles.paginationBtn} 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </button>
          <button 
            className={`${styles.paginationBtn} ${styles.nextBtn}`}
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;
