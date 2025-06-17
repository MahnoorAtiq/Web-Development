
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const mongoose = require('mongoose');

// Import models
const Product = require('./models/product');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/Assignment4', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  // Seed products when server starts
  seedProducts();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

app.locals.users = [];

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Initialize cart in session
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

// Global middleware for cart count and user
app.use((req, res, next) => {
  // Calculate cart count
  res.locals.cartCount = req.session.cart ? 
    req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
  
  // User info (you might need to adjust this based on your user system)
  res.locals.user = req.session.userId ? 
    { id: req.session.userId, name: req.session.username } : null;
  
  next();
});

// Product Methods
async function getProduct(productId) {
  try {
    const product = await Product.findById(productId);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

async function getAllProducts() {
  try {
    const products = await Product.find({});
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function seedProducts() {
  try {
    const sampleProducts = [
      {
        seedId: 'product1', 
        name: 'Butter Cream Wooven Dress',
        price: '99.99',
        quantity: '50',
        description: 'A soft, elegant woven dress in a rich buttercream hue – perfect for formal events or a chic day out.',
        image: '/images/Product1.png',
        category: 'Dress'
      },
      {
        seedId: 'product2',
        name: 'Red Floral Printed Dress',
        price: '24.99',
        quantity: '100',
        description: 'Bright and breezy floral dress with a flattering silhouette – ideal for summer outings or brunch dates.',
        image: '/images/Product2.png',
        category: 'Dress'
      },
      {
        seedId: 'product3',
        name: 'Cream Satin Maxi Dress',
        price: '45.00',
        quantity: '30',
        description: 'Luxurious satin maxi dress in a creamy tone, designed for evening elegance and special occasions.',
        image: '/images/Product3.png',
        category: 'Dress'
      },
      {
        seedId: 'product4',
        name: 'Deep Chocolate Detail Top',
        price: '12.99',
        quantity: '200',
        description: 'Chic crop top in deep chocolate with fine detailing – pairs well with high-waisted jeans or skirts.',
        image: '/images/Product4.png',
        category: 'Top'
      },
      {
        seedId: 'product5',
        name: 'White Cotton Oversized Button Up',
        price: '35.99',
        quantity: '75',
        description: 'A versatile oversized button-up shirt in breathable cotton – perfect for layering or a minimalist look.',
        image: '/images/Product5.png',
        category: 'Top'
      },
      {
        seedId: 'product6',
        name: 'Black Slinky Crop Top',
        price: '79.99',
        quantity: '40',
        description: 'A bold, slinky black crop top that adds a touch of glam – great for night outs or trendy casual wear.',
        image: '/images/Product6.png',
        category: 'Top'
      },
      {
        seedId: 'product7',
        name: 'Brown Textured Co-ord',
        price: '79.99',
        quantity: '40',
        description: 'Opt for a coordinated look in this co-ord',
        image: '/images/Product7.png',
        category: 'Co-ord'
      },
      {
        seedId: 'product8',
        name: 'White Co-ord',
        price: '79.99',
        quantity: '40',
        description: 'Elevate your smart wardrobe with this white tailored woven wide leg trousers and shirt',
        image: '/images/Product8.png',
        category: 'Co-ord'
      }
    ];

    console.log('Updating/Seeding products...');
    
  
    for (const productData of sampleProducts) {
      const { seedId, ...productFields } = productData;
      
      await Product.findOneAndUpdate(
        { seedId: seedId }, // Find by seedId
        { 
          ...productFields,
          seedId: seedId,
          updatedAt: new Date()
        },
        { 
          upsert: true, // Create if doesn't exist
          new: true,    
          setDefaultsOnInsert: true
        }
      );
      
      console.log(`✓ Updated/Created product: ${productFields.name}`);
    }

    console.log('All sample products have been updated/seeded successfully');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}


app.get('/admin/refresh-products', async (req, res) => {
  try {
    await seedProducts();
    res.json({ success: true, message: 'Products refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing products:', error);
    res.status(500).json({ success: false, message: 'Error refreshing products' });
  }
});

app.get('/', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.render('index', { 
      title: 'Home - PrettyLittleThing',
      products: products,
      message: req.session.message,
      error: req.session.error
    });
    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('index', { 
      title: 'Home - Missguided',
      products: [],
      error: 'Error loading products'
    });
  }
});

app.get('/product/:id', async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    if (!product) {
      return res.status(404).render('404', { title: 'Product Not Found - PrettyLittleThing' });
    }
    res.render('product-detail', {
      title: `${product.name} - PrettyLittleThing`,
      product: product
    });
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(500).render('500', { title: 'Server Error - PrettyLittleThing' });
  }
});

// Import existing routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const checkoutRoutes = require('./routes/checkout');

// Import new routes
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');

// Use existing routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/checkout', checkoutRoutes);

// Use new routes
app.use('/cart', cartRoutes.router);
app.use('/orders', orderRoutes);
app.use('/products', productRoutes);

// Error handlers
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found - PrettyLittleThing',
    message: 'The page you are looking for does not exist.'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { 
    title: 'Server Error -PrettyLittleThing',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;