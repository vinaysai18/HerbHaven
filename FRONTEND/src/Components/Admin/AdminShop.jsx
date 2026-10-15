import { useState, useEffect } from "react";
import ProductCard from "./ProductCard.jsx";

export default function AdminShop() {

    const [products, setProducts] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
        image: ""
    });

    const [editingId, setEditingId] = useState(null);


    useEffect(() => {

        const fetchProducts = async () => {

            try {

                const token = localStorage.getItem("token");

                const response = await fetch(
                    "http://localhost:5000/api/products",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Failed to fetch products!"
                    );

                    return;
                }

                setProducts(data);

            } catch (error) {

                console.error(
                    "Error fetching products:",
                    error
                );

                alert(
                    "Unable to connect to the server!"
                );
            }
        };

        fetchProducts();

    }, []);


    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };


    const handleImageChange = (e) => {

        const file = e.target.files[0];

        if (file) {

            setFormData({
                ...formData,
                image: file
            });

        }

    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");

            // Create FormData for Multer
            const formDataToSend = new FormData();

            formDataToSend.append("name", formData.name);
            formDataToSend.append("price", formData.price);
            formDataToSend.append("description", formData.description);

            // Attach image only when a new file is selected
            if (formData.image instanceof File) {
                formDataToSend.append("image", formData.image);
            }

            const isEditing = editingId !== null;

            const url = isEditing
                ? `http://localhost:5000/api/products/${editingId}`
                : "http://localhost:5000/api/products";

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Product operation failed!");
                return;
            }

            if (isEditing) {
                setProducts((previousProducts) =>
                    previousProducts.map((herb) =>
                        herb._id === editingId ? data.product : herb
                    )
                );

                alert("Product updated successfully!");
            } else {
                setProducts((previousProducts) => [
                    ...previousProducts,
                    data.product
                ]);

                alert("Product added successfully!");
            }

            setEditingId(null);

            setFormData({
                name: "",
                price: "",
                description: "",
                image: ""
            });

        } catch (error) {
            console.error("Product operation error:", error);
            alert("Unable to connect to the server!");
        }
    };


    const deleteHerb = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this herb?"
        );

        if (!confirmDelete) {
            return;
        }

        try {

            const token = localStorage.getItem("token");

            console.log("Deleting product ID:", id);
            console.log("Token exists:", !!token);

            const response = await fetch(
                `http://localhost:5000/api/products/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            console.log("Delete status:", response.status);
            console.log("Delete response:", data);

            if (!response.ok) {

                alert(
                    data.message ||
                    "Failed to delete product!"
                );

                return;
            }

            setProducts(
                products.filter(
                    (herb) => herb._id !== id
                )
            );

            if (editingId === id) {

                setEditingId(null);

                setFormData({
                    name: "",
                    price: "",
                    description: "",
                    image: ""
                });

            }

            alert("Product deleted successfully!");

        } catch (error) {

            console.error(
                "Delete error:",
                error
            );

            alert(
                "Unable to connect to the server!"
            );
        }
    };


    const editHerb = (herb) => {

        setEditingId(herb._id);

        setFormData({
            name: herb.name,
            price: herb.price,
            description: herb.description,

            image: ""
        });


        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
        });

    };


    const cancelEdit = () => {

        setEditingId(null);

        setFormData({
            name: "",
            price: "",
            description: "",
            image: ""
        });

    };

    return (

        <div className="admin-shop-page">

            <div className="Admin-shop">

                <div>

                    <h1>
                        🌿 Our Herbal Collection
                    </h1>

                    <p>
                        100% Natural • Premium Quality •
                        Handpicked for You
                    </p>

                </div>

            </div>


            <div className="products-scroll">

                <div className="products-grid">

                    {products.map((herb) => (

                        <ProductCard

                            key={herb._id}

                            herb={herb}

                            onDelete={deleteHerb}

                            onEdit={editHerb}

                        />

                    ))}

                </div>

            </div>



            <div className="add-herb">


                <div className="form-heading">

                    <h2>

                        {editingId !== null

                            ? "🌿 Admin Panel – Update Herb"

                            : "🌿 Admin Panel – Add New Herb"

                        }

                    </h2>


                    <p>

                        {editingId !== null

                            ? "Update your herbal product"

                            : "Add a new herbal product to your collection"

                        }

                    </p>

                </div>


                <form onSubmit={handleSubmit}>


                    <div className="form-field">

                        <label>
                            Herb Name
                        </label>


                        <input

                            type="text"

                            name="name"

                            placeholder="Enter herb name"

                            value={formData.name}

                            onChange={handleChange}

                            required

                        />

                    </div>



                    <div className="form-field">

                        <label>
                            Price (USD)
                        </label>


                        <input

                            type="number"

                            name="price"

                            placeholder="e.g. 12.99"

                            value={formData.price}

                            onChange={handleChange}

                            required

                        />

                    </div>

                    <div className="form-field description-field">

                        <label>
                            Short Description
                        </label>


                        <textarea

                            name="description"

                            placeholder="Enter short description"

                            value={formData.description}

                            onChange={handleChange}

                            required

                        />

                    </div>



                    <div className="form-field">

                        <label>
                            Image Upload
                        </label>


                        <input

                            type="file"

                            name="image"

                            accept="image/*"

                            onChange={handleImageChange}

                        />

                    </div>




                    <button type="submit">

                        {editingId !== null

                            ? "✓ Update Herb"

                            : "+ Add Herb"

                        }

                    </button>


                    {editingId !== null && (

                        <button

                            type="button"

                            onClick={cancelEdit}

                            className="cancel-button"

                        >

                            Cancel

                        </button>

                    )}

                </form>

            </div>

        </div>

    );

}