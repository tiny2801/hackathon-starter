/**
 * Module dependencies.
 */
const path = require('path');
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');
const mongoose = require('mongoose');
const passport = require('passport');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

/**
 * Load environment variables from .env file.
 */
dotenv.config();

/**
 * Create Express server.
 */
const app = express();

/**
 * Configure Port
 */
const PORT = process.env.PORT || 8080;

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.error('MongoDB connection error. Make sure MongoDB is running.');
  process.exit(1);
});

/**
 * Express configuration.
 */
app.set('port', PORT);
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});
app.use(limiter);

// Static file serving
app.use('/', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

// Session configuration
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET || 'default_secret',
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 1209600000 }, // 2 weeks
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

/**
 * Primary routes (simplified for demonstration).
 */
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

/**
 * Error handling.
 */
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).send('Server Error');
  });
}

/**
 * Start the server.
 */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} in ${app.get('env')} mode.`);
  console.log('Press CTRL-C to stop.');
});
