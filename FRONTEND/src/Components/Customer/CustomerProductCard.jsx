export default function ProductCard({ herb, onAddtoCart }) {

    return (
        <div className="product-card">

            <img
                src={herb.image}
                alt={herb.name}
            />

            <div className="product-info">

                <h2>{herb.name}</h2>

                <p>{herb.description}</p>

                <h3>
                    Price: ₹{Number(herb.price).toFixed(2)}
                </h3>

                <button
                    className="add-to-cart"
                    onClick={() => onAddtoCart(herb)}
                >
                    Add to Cart
                </button>

            </div>

        </div>
    );
}