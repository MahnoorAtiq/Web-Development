const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');


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


function clearCart(req) {
  req.session.cart = [];
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
    console.log('Processing checkout request...'); 
    console.log('Request body:', req.body); 

    const { 
      fullName, 
      email, 
      phone, 
      address, 
      cardNumber,
      expiryDate,
      cvv
    } = req.body;

    
    if (!fullName || !email || !phone || !address) {
      console.log('Missing required fields'); 
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    if (phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number'
      });
    }

 
    if (!req.session.cart || req.session.cart.length === 0) {
      console.log('Cart is empty'); 
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty!'
      });
    }

    console.log('Cart items:', req.session.cart); 

    const cart = await getCartWithProducts(req);
    
    if (cart.items.length === 0) {
      console.log('No valid cart items found'); 
      return res.status(400).json({
        success: false,
        message: 'Your cart contains invalid items'
      });
    }

    console.log('Cart with products:', cart); 

    const shipping = 5.99;
    const finalTotal = (parseFloat(cart.total) + shipping).toFixed(2);

    const orderData = {
      customerName: fullName.trim(),
      customerPhone: phone.trim(),
      customerAddress: address.trim(),
      customerEmail: email.trim(),
      items: cart.items.map(item => ({
        productId: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        itemTotal: item.itemTotal
      })),
      totalAmount: finalTotal,
      status: 'pending',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      orderDate: new Date(),
      notes: cardNumber ? `Pay Later - Reference: ${cardNumber.slice(-4)}` : 'Pay Later with Cash'
    };

    console.log('Creating order with data:', orderData); 

    const order = new Order(orderData);
    const savedOrder = await order.save();
    
    console.log('Order saved successfully:', savedOrder._id); 

    clearCart(req);
    console.log('Cart cleared');

    req.session.message = `Order ${savedOrder.orderNumber} placed successfully! You will pay cash on delivery. Thank you for your purchase.`;

    res.json({
      success: true,
      message: 'Order placed successfully! You will pay cash on delivery.',
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      redirect: '/' 
    });
    
  } catch (error) {
    console.error('Error processing order:', error); 
    console.error('Error stack:', error.stack); 
    
    res.status(500).json({
      success: false,
      message: 'Error processing order. Please try again.',
      error: error.message 
    });
  }
});

// GET specific order details
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).render('404', { 
        title: 'Order Not Found',
        message: 'The order you are looking for does not exist.'
      });
    }

    res.render('order-detail', {
      title: `Order ${order.orderNumber}`,
      order: order
    });
  } catch (error) {
    console.error('Error loading order:', error);
    res.status(500).render('500', { 
      title: 'Server Error',
      message: 'Error loading order details'
    });
  }
});

// GET all orders (admin view)
router.get('/admin/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    res.render('orders', {
      title: 'Orders',
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error loading orders:', error);
    res.render('orders', {
      title: 'Orders',
      orders: [],
      error: 'Error loading orders',
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    });
  }
});

module.exports = router;