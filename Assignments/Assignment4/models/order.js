const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  customerEmail: { type: String, required: true },
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      quantity: Number,
      price: String,
      itemTotal: String
    }
  ],
  totalAmount: { type: String, required: true },
  status: { type: String, default: 'pending' },
  paymentMethod: { type: String, default: 'cash' },
  paymentStatus: { type: String, default: 'pending' },
  orderDate: { type: Date, default: Date.now },
  notes: String,
  orderNumber: {
    type: String,
    default: () => 'ORD-' + Date.now()
  }
});

module.exports = mongoose.model('Order', orderSchema);
