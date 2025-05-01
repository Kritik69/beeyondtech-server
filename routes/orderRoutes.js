// routes/orderRoutes.js
const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product"); // Import the Product model
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 }); // Cache TTL of 5 minutes
const router = express.Router();

// Create new order (POST /api/orders/)
// Create new order
router.post("/", async (req, res) => {
  try {
    const io = req.app.get("io");

    const {
      user,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // Reduce inventory for each product in the order
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }

      if (product.inventory < item.quantity) {
        return res.status(400).json({
          message: `Insufficient inventory for product: ${product.name}`,
        });
      }

      product.inventory -= item.quantity; // Reduce inventory
      await product.save(); // Save the updated product
    }

    const order = new Order({
      user,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid,
    });

    const createdOrder = await order.save();

    // Emit to admins or dashboard listeners
    io.emit("newOrder", createdOrder);

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: "Failed to create order", error });
  }
});

// Get logged-in user's orders (GET /api/orders/myorders)
router.get("/myorders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.params);
    const orders = await Order.find({ user: id }).populate(
      "orderItems.product",
      "name price"
    );
    console.log(orders);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user orders", error });
  }
});

// Get single order by ID (GET /api/orders/:id)
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "email")
      .populate("orderItems.product", "name price");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order", error });
  }
});

// Admin: Get all orders (GET /api/orders/)
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    // Check if cached data exists for the given status
    const cacheKey = `orders_${status || "all"}`;
    const cachedOrders = cache.get(cacheKey);

    if (cachedOrders) {
      return res.json(cachedOrders); // Return cached data
    }

    // Build query based on status
    let query = {};
    if (status) {
      if (status === "Pending") {
        query.status = { $nin: ["Delivered", "Cancelled"] }; // Pending means all except Delivered and Cancelled
      } else {
        query.status = status;
      }
    }

    // Fetch orders from the database and convert to plain objects
    const orders = await Order.find(query).populate("user", "email").lean(); // Convert Mongoose documents to plain JavaScript objects

    console.log(orders.length);

    // Cache the result
    cache.set(cacheKey, orders);

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch all orders", error });
  }
});

// Admin: Update order status (PUT /api/orders/:id/status)
router.put("/:id/status", async (req, res) => {
  try {
    const io = req.app.get("io");
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    if (status === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    // Notify clients about status change
    io.emit("orderStatusUpdated", updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update order status", error });
  }
});

// Admin: Delete an order (DELETE /api/orders/:id)
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.deleteOne();
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order", error });
  }
});

module.exports = router;
