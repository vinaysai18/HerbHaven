import { API_ORIGIN } from "../../api";

export default function ProductCard({ herb, onDelete, onEdit }) {

    return (

        <div className="product-card">

            <img
                src={
                    herb.image?.startsWith("http")
                        ? herb.image
                        : `${API_ORIGIN}${herb.image}`
                }
                alt={herb.name}
                className="product-image"
            />

            <div className="product-info">

                <h2>{herb.name}</h2>

                <p>{herb.description}</p>

                <h3>
                    Price: ₹{herb.price}
                </h3>


                {/* ADMIN BUTTONS */}
                <div className="product-actions">

                    <button
                        className="update-button"
                        onClick={() => onEdit(herb)}
                    >
                        Update
                    </button>

                    <button className="delete-button" onClick={() => onDelete(herb._id)}>
                        Delete
                    </button>

                </div>

            </div>

        </div>
    );
}