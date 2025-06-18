const express = require('express');
const router = express.Router();
const Complaint = require('../models/complaint');
const Order = require('../models/order');
const User = require('../models/user');
const { requireAuth } = require('../middleware/auth');

// Contact Us Page (GET)
router.get('/contact', requireAuth, (req, res) => {
  res.render('contact', {
    title: 'Contact Us - PrettyLittleThing',
    message: req.session.message,
    error: req.session.error,
    formData: req.session.formData || {}
  });

  // Clear session messages
  delete req.session.message;
  delete req.session.error;
  delete req.session.formData;
});

// Submit Complaint (POST)
router.post('/contact', requireAuth, async (req, res) => {
  try {
    const { orderId, message } = req.body;

    console.log('Received complaint submission:', { orderId, message, userId: req.session.userId });

    // Validation
    if (!orderId || !message) {
      req.session.error = 'Order ID and message are required';
      req.session.formData = req.body;
      return res.redirect('/complaints/contact');
    }

    if (message.trim().length < 10) {
      req.session.error = 'Message must be at least 10 characters long';
      req.session.formData = req.body;
      return res.redirect('/complaints/contact');
    }

    // Optional: Verify that the order belongs to the current user
    // Comment out this section if you don't have an Order model or want to allow any order ID
    /*
    const order = await Order.findOne({ 
      orderNumber: orderId, 
      userId: req.session.userId 
    });

    if (!order) {
      req.session.error = 'Order not found or does not belong to you';
      req.session.formData = req.body;
      return res.redirect('/complaints/contact');
    }
    */

    // Create new complaint
    const newComplaint = new Complaint({
      userId: req.session.userId,
      orderId: orderId.trim(),
      message: message.trim(),
      status: 'pending'
    });

    // Save the complaint
    const savedComplaint = await newComplaint.save();
    console.log('New complaint submitted successfully:', savedComplaint._id);

    // Set success message and redirect to home page
    req.session.message = 'Your complaint has been submitted successfully. We will get back to you soon.';
    res.redirect('/'); // Redirect to home page instead of my-complaints

  } catch (error) {
    console.error('Error submitting complaint:', error);
    req.session.error = 'Error submitting complaint. Please try again.';
    req.session.formData = req.body;
    res.redirect('/complaints/contact');
  }
});

// View User's Own Complaints
router.get('/my-complaints', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const complaints = await Complaint.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalComplaints = await Complaint.countDocuments({ userId: req.session.userId });
    const totalPages = Math.ceil(totalComplaints / limit);

    res.render('complaints', {
      title: 'My Complaints - PrettyLittleThing',
      complaints: complaints,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      message: req.session.message,
      error: req.session.error
    });

    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading user complaints:', error);
    res.render('complaints', {
      title: 'My Complaints - PrettyLittleThing',
      complaints: [],
      error: 'Error loading complaints',
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    });
  }
});

// View Single Complaint Details
router.get('/complaint/:id', requireAuth, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.session.userId
    });

    if (!complaint) {
      req.session.error = 'Complaint not found';
      return res.redirect('/complaints/my-complaints');
    }

    res.render('complaint-detail', {
      title: `Complaint #${complaint._id.toString().slice(-8)} - PrettyLittleThing`,
      complaint: complaint
    });
  } catch (error) {
    console.error('Error loading complaint details:', error);
    req.session.error = 'Error loading complaint details';
    res.redirect('/complaints/my-complaints');
  }
});

module.exports = router;