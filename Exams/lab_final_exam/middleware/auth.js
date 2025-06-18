const User = require('../models/user');


const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    req.session.error = 'You must be logged in to access this page';
    return res.redirect('/auth/login');
  }
  next();
};


const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  next();
};

const requireAdmin = async (req, res, next) => {
  try {

    if (!req.session.userId) {
      req.session.error = 'You must be logged in to access this page';
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.error = 'User not found';
      return res.redirect('/auth/login');
    }

    if (!user.isAdmin) {
      req.session.error = 'Access denied. Admin privileges required.';
      return res.redirect('/');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    req.session.error = 'Authentication error';
    res.redirect('/auth/login');
  }
};


const checkAdmin = async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user && user.isAdmin) {
        res.locals.isAdmin = true;
        req.user = user;
      } else {
        res.locals.isAdmin = false;
      }
    } else {
      res.locals.isAdmin = false;
    }
    next();
  } catch (error) {
    console.error('Error in checkAdmin middleware:', error);
    res.locals.isAdmin = false;
    next();
  }
};

const setUserLocals = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        res.locals.user = {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin || false
        };
        res.locals.isLoggedIn = true;
      } else {
        res.locals.user = null;
        res.locals.isLoggedIn = false;
      }
    } catch (error) {
      console.error('Error fetching user for locals:', error);
      res.locals.user = null;
      res.locals.isLoggedIn = false;
    }
  } else {
    res.locals.user = null;
    res.locals.isLoggedIn = false;
  }
  next();
};

module.exports = {
  requireAuth,
  redirectIfAuthenticated,
  requireAdmin,
  checkAdmin,
  setUserLocals
};