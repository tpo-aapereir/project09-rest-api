'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');
const { sequelize } = require('./models')
const getRouter = require('./routes/get')
const postRouter = require('./routes/post')

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// setup morgan which gives us http request logging
app.use(morgan('dev'));

// allows access to req.body
app.use(express.json())

// Authenticate and sync the database
console.log('Testing the connection to the database...');
(async () => {
  try {
  // Test the connection to the database
    await sequelize.authenticate()
    console.log('Connection to the database successful!')
    // Sync the models
    console.log('Synchronizing the models with the database...')
    await sequelize.sync()
    console.log('Synchronization successful')
  } catch (error) {
    console.log('Failed to connect to the database!')
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message)
      console.error('Validation errors: ', errors)
    } else {
      throw error
    }
  }
})()

// Main router
app.use('/api', getRouter, postRouter)

// Root router
app.get('/', (req, res) => {
  res.redirect('/api/courses')
});

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

// start listening on our port
const server = app.listen(app.get('port'), () => {
  console.log(`Express server is listening on port ${server.address().port}`);
});
