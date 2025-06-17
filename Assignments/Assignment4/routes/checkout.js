const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Order = require('../models/order'); 

async function getCartWithProducts(req) {
  const cartItems = [];
  let total = 0;

  if (!req.session.cart || req.session.cart.length === 0) {
    return {
      items: [],
      total: '0.00',
      itemCount: 0
    };
  }

  for (const item of req.session.cart) {
    try {
      const product = await Product.findById(item.productId);
      if (product) {
        const itemTotal = parseFloat(product.price) * item.quantity;
        cartItems.push({
          product: product,
          quantity: item.quantity,
          itemTotal: itemTotal.toFixed(2)
        });
        total += itemTotal;
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  }

  return {
    items: cartItems,
    total: total.toFixed(2),
    itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
  };
}


router.get('/', async (req, res) => {
  try {
    
    if (!req.session.cart || req.session.cart.length === 0) {
      req.session.error = 'Your cart is empty! Please add some products first.';
      return res.redirect('/cart');
    }

    
    const cart = await getCartWithProducts(req);

    if (cart.items.length === 0) {
      req.session.error = 'Your cart contains invalid items. Please refresh your cart.';
      return res.redirect('/cart');
    }

    const shipping = cart.items.length > 0 ? 5.99 : 0;
    const finalTotal = (parseFloat(cart.total) + shipping).toFixed(2);

    res.render('checkout', { 
      layout: false,
      cart: cart,
      shipping: shipping.toFixed(2),
      finalTotal: finalTotal,
      error: req.session.error,
      message: req.session.message,
      formData: req.session.formData || {}
    });

   
    delete req.session.error;
    delete req.session.message;
    delete req.session.formData;

  } catch (error) {
    console.error('Error loading checkout:', error);
    req.session.error = 'Error loading checkout page. Please try again.';
    res.redirect('/cart');
  }
});


router.post('/process', async (req, res) => {
  try {
    
    if (!req.session.cart || req.session.cart.length === 0) {
      return res.json({
        success: false,
        message: 'Your cart is empty! Please add some products first.'
      });
    }

    
    const {
      fullName,
      email,
      phone,
      address,
      cardNumber,
      expiryDate,
      cvv
    } = req.body;

   
    if (!fullName || !email || !phone || !address || !cardNumber || !expiryDate || !cvv) {
      return res.json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    const cart = await getCartWithProducts(req);

    if (cart.items.length === 0) {
      return res.json({
        success: false,
        message: 'Your cart contains invalid items. Please refresh your cart.'
      });
    }

    const shipping = 5.99;
    const finalTotal = (parseFloat(cart.total) + shipping).toFixed(2);

    const orderItems = cart.items.map(item => ({
      productId: item.product._id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      itemTotal: item.itemTotal
    }));

    const newOrder = new Order({
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: address,
      items: orderItems,
      totalAmount: finalTotal,
      status: 'pending',
      paymentMethod: 'card',
      paymentStatus: 'paid', 
      orderDate: new Date()
    });

    const savedOrder = await newOrder.save();
    console.log('Order created successfully:', savedOrder.orderNumber);

    req.session.cart = [];

    req.session.message = `Order ${savedOrder.orderNumber} placed successfully! Thank you for your purchase.`;

    res.json({
      success: true,
      message: 'Order placed successfully!',
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      redirect: '/' 
    });

  } catch (error) {
    console.error('Error processing order:', error);
    
    req.session.formData = req.body;
    
    res.json({
      success: false,
      message: 'Error processing your order. Please try again.'
    });
  }
});



module.exports = router;