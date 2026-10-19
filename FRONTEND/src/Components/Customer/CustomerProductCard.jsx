export default function ProductCard({ herb, onAddtoCart }) {
    const quantity = Number(herb.stockQuantity) || 0;
    const threshold = Number(herb.lowStockThreshold ?? 5);
    const status = quantity === 0
        ? "Out of Stock"
        : quantity <= threshold
            ? "Low Stock"
            : "In Stock";

    return (
        <div className="product-card">

            <img
                src={herb.image}
                alt={herb.name}
            />

            <div className="product-info">

                <h2>{herb.name}</h2>

                <span className={`customer-stock-status ${status.toLowerCase().replaceAll(" ", "-")}`}>
                    {status}
                    {status === "Low Stock" ? ` · ${quantity} left` : ""}
                </span>

                <p>{herb.description}</p>

                <h3>
                    Price: ₹{Number(herb.price).toFixed(2)}
                </h3>

                <button
                    className="add-to-cart"
                    onClick={() => onAddtoCart(herb)}
                    disabled={quantity < 1}
                >
                    {quantity < 1 ? "Unavailable" : "Add to Cart"}
                </button>

            </div>

        </div>
    );
}