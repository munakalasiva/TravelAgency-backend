const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Define Schema & Model
const transactionSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  fromAddress: String,
  toAddress: String,
  bookingDate: Date,
  mode: String,
  amountTotal: Number,
  amountAdvance: Number,
  amountPending: Number,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

// ✅ Create Transaction
app.post("/api/transactions", async (req, res) => {
  try {
    const newTransaction = new Transaction(req.body);
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get All Transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update Transaction
app.put("/api/transactions/:id", async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete Transaction
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Send Payment Reminder Email
app.post("/api/remind", async (req, res) => {
  const { email, name, amountPending } = req.body;

  if (!email || !name || amountPending === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Payment Reminder",
      text: `Hello ${name},\n\nYou have a pending payment of ₹${amountPending}. Please make the payment soon.\n\nThank you!`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(500).json({ error: error.toString() });
      res.json({ message: "Reminder Sent", info });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
