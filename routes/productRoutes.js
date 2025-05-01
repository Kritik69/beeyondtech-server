// routes/productRoutes.js
const express = require("express");
const Product = require("../models/Product");
const { authenticateJWT } = require("../middleware/authMiddleware");
const router = express.Router();

// Create a Product (POST /api/products)
router.post("/", authenticateJWT, async (req, res) => {
  const { name, price, quantity } = req.body;

  try {
    const product = new Product({ name, price, quantity });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to create product", error });
  }
});

// Get All Products (GET /api/products)
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
});

// Get Single Product by ID (GET /api/products/:id)
router.get("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product", error });
  }
});

// Update a Product (PUT /api/products/:id)
router.put("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, price, quantity },
      { new: true }
    );

    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Failed to update product", error });
  }
});

// Delete a Product (DELETE /api/products/:id)
router.delete("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error });
  }
});

module.exports = router;
