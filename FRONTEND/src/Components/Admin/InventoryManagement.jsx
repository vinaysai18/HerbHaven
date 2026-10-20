import { useCallback, useEffect, useState } from "react";
import "./InventoryManagement.css";
import { API_URL, readApiResponse } from "../../api";
import ProductImage from "../ProductImage";

export default function InventoryManagement() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalUnits: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adjustment, setAdjustment] = useState(null);
  const [history, setHistory] = useState({});
  const [savingId, setSavingId] = useState("");

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ search, category, status, sort });
      const response = await fetch(`${API_URL}/products/inventory?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await readApiResponse(response, "Inventory API");
      if (!response.ok) throw new Error(data.message || "Unable to load inventory.");
      setProducts(data.products || []);
      setSummary(data.summary || {});
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [search, category, status, sort]);

  useEffect(() => {
    Promise.resolve().then(loadInventory);
  }, [loadInventory]);

  async function saveThreshold(product, value) {
    const threshold = Number(value);
    if (!Number.isSafeInteger(threshold) || threshold < 0) {
      setError("Threshold must be a non-negative whole number.");
      return;
    }
    try {
      setSavingId(product._id);
      setError("");
      setMessage("");
      const response = await fetch(`${API_URL}/products/inventory/${product._id}/threshold`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ lowStockThreshold: threshold }),
      });
      const data = await readApiResponse(response, "Inventory API");
      if (!response.ok) throw new Error(data.message || "Unable to update threshold.");
      setMessage(data.message);
      await loadInventory();
    } catch (err) {
      setError(err.message || "Unable to update threshold.");
    } finally {
      setSavingId("");
    }
  }

  async function submitAdjustment(event) {
    event.preventDefault();
    const quantityChange = Number(adjustment.quantityChange);
    if (!Number.isSafeInteger(quantityChange) || quantityChange === 0) {
      setError("Enter a non-zero whole-number adjustment.");
      return;
    }
    try {
      setSavingId(adjustment.product._id);
      setError("");
      setMessage("");
      const response = await fetch(
        `${API_URL}/products/inventory/${adjustment.product._id}/adjust`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            quantityChange,
            reason: adjustment.reason,
          }),
        }
      );
      const data = await readApiResponse(response, "Inventory API");
      if (!response.ok) throw new Error(data.message || "Unable to adjust stock.");
      setMessage(data.message);
      setAdjustment(null);
      await loadInventory();
    } catch (err) {
      setError(err.message || "Unable to adjust stock.");
    } finally {
      setSavingId("");
    }
  }

  async function toggleHistory(productId) {
    if (history[productId]) {
      setHistory((previous) => ({ ...previous, [productId]: null }));
      return;
    }
    try {
      const response = await fetch(`${API_URL}/products/inventory/${productId}/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await readApiResponse(response, "Inventory API");
      if (!response.ok) throw new Error(data.message || "Unable to load history.");
      setHistory((previous) => ({ ...previous, [productId]: data.movements || [] }));
    } catch (err) {
      setError(err.message || "Unable to load history.");
    }
  }

  function formatDate(value) {
    return value
      ? new Date(value).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";
  }

  return (
    <main className="inventory-page">
      <header className="inventory-heading">
        <div>
          <p className="inventory-eyebrow">HERBHAVEN ADMIN PANEL</p>
          <h1>Inventory Management</h1>
          <p>Track availability, stock thresholds, and auditable stock movements.</p>
        </div>
        <button type="button" onClick={loadInventory} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      <section className="inventory-summary" aria-label="Inventory summary">
        <article><span>Total products</span><strong>{summary.totalProducts}</strong></article>
        <article><span>Total units in stock</span><strong>{summary.totalUnits}</strong></article>
        <article><span>Low-stock products</span><strong>{summary.lowStock}</strong></article>
        <article><span>Out of stock</span><strong>{summary.outOfStock}</strong></article>
      </section>

      {error && <p className="inventory-message inventory-error" role="alert">{error}</p>}
      {message && <p className="inventory-message inventory-success" role="status">{message}</p>}

      <section className="inventory-panel">
        <div className="inventory-filters">
          <label>
            Search
            <input
              type="search"
              placeholder="Product name, SKU, or category"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            Stock status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
            </select>
          </label>
          <label>
            Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="name">Product name</option>
              <option value="stock-asc">Stock: low to high</option>
              <option value="stock-desc">Stock: high to low</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p className="inventory-empty">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="inventory-empty">No products match these filters.</p>
        ) : (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th><th>SKU / ID</th><th>Category</th><th>Price</th>
                  <th>Available</th><th>Status</th><th>Low-stock threshold</th>
                  <th>Last updated</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="inventory-product">
                        <ProductImage image={product.image} alt="" />
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td>{product.sku || product._id}</td>
                    <td>{product.category || "Other"}</td>
                    <td>₹{Number(product.price).toFixed(2)}</td>
                    <td><strong>{product.stockQuantity || 0}</strong></td>
                    <td><span className={`inventory-status ${product.stockStatus.toLowerCase().replaceAll(" ", "-")}`}>{product.stockStatus}</span></td>
                    <td>
                      <div className="threshold-control">
                        <input
                          aria-label={`Low stock threshold for ${product.name}`}
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={product.lowStockThreshold ?? 5}
                          key={`${product._id}-${product.lowStockThreshold}`}
                        />
                        <button
                          type="button"
                          onClick={(event) => {
                            const input = event.currentTarget.previousElementSibling;
                            saveThreshold(product, input.value);
                          }}
                          disabled={savingId === product._id}
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td>{formatDate(product.updatedAt)}</td>
                    <td>
                      <div className="inventory-actions">
                        <button
                          type="button"
                          onClick={() => setAdjustment({ product, quantityChange: "", reason: "" })}
                        >
                          Adjust stock
                        </button>
                        <button type="button" className="inventory-history-toggle" onClick={() => toggleHistory(product._id)}>
                          {history[product._id] ? "Hide history" : "History"}
                        </button>
                      </div>
                      {adjustment?.product._id === product._id && (
                        <form className="inventory-adjust-form" onSubmit={submitAdjustment}>
                          <label>
                            Change (+ / −)
                            <input
                              type="number"
                              step="1"
                              required
                              value={adjustment.quantityChange}
                              onChange={(event) => setAdjustment({ ...adjustment, quantityChange: event.target.value })}
                            />
                          </label>
                          <label>
                            Reason
                            <input
                              type="text"
                              maxLength="300"
                              required
                              placeholder="Restock, damage, correction, return…"
                              value={adjustment.reason}
                              onChange={(event) => setAdjustment({ ...adjustment, reason: event.target.value })}
                            />
                          </label>
                          <button type="submit" disabled={savingId === product._id}>
                            {savingId === product._id ? "Saving…" : "Confirm adjustment"}
                          </button>
                          <button type="button" className="inventory-history-toggle" onClick={() => setAdjustment(null)}>
                            Cancel
                          </button>
                        </form>
                      )}
                      {history[product._id] && (
                        <div className="inventory-history">
                          {history[product._id].length === 0 ? <p>No stock movements yet.</p> : (
                            history[product._id].map((movement) => (
                              <p key={movement._id}>
                                {formatDate(movement.createdAt)} · {movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange} · {movement.previousQuantity} → {movement.resultingQuantity} · {movement.reason}
                              </p>
                            ))
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
