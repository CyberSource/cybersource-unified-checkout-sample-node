const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const csrf = require('csurf');

const fs = require('fs');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const cybersourceRestApi = require('cybersource-rest-client');
const configuration = require('./Data/Configuration');
const { validateRequest } = require('./validation/RequestValidator');
const { extractClientLibraryFromToken, extractResponseData } = require('./validation/TokenValidator');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.use('/', indexRouter);
app.use('/users', usersRouter);


app.get('/ucoverview', function (req, res) {
  try {
    //can make configuration changes in the json file or via the UI
    const filePath = path.join(__dirname, './Data/default-uc-capture-context-request.json');
    const fileContent = fs.readFileSync(filePath, "utf-8");
    res.render('uc-overview', {jsonRequest: fileContent, csrfToken: req.csrfToken()});
  } catch (error) {
      console.error('\nUC Overview Error : ' + error);
      res.status(500).render('error', { 
        message: 'An error occurred loading the overview page',
        error: { status: 500, stack: '' }
      });
  }
});


app.post('/capture-context', function (req, res) {
  try {
    // Validate and sanitize request against allowlist
    let requestObj;
    try {
      requestObj = validateRequest(req.body.captureContextRequest);
    } catch (validationError) {
      console.error('\nValidation Error : ' + validationError.message);
      return res.status(400).render('error', { 
        message: 'Invalid request. Please check your input and try again.',
        error: { status: 400, stack: '' }
      });
    }

    // add your merchant id and keys in the ./Data/Configuration 
    const configObject = new configuration();
    const apiClient = new cybersourceRestApi.ApiClient();
    const instance = new cybersourceRestApi.UnifiedCheckoutCaptureContextApi(configObject, apiClient);

    instance.generateUnifiedCheckoutCaptureContext(requestObj, function (error, data, response) {
      if (error) {
        console.error('\nError : ' + JSON.stringify(error));
      }
      else if (data) {
        const decodedData =  JSON.parse(Buffer.from(data.split('.')[1], 'base64').toString());
        res.render('capture-context', {captureContext: data, decodedData: JSON.stringify(decodedData), csrfToken: req.csrfToken()});
      }
    });
	}
	catch (error) {
		console.log('\nException on calling the API : ' + error);
	}
});

app.post('/checkout', async function (req, res) {
  try {
    const captureContext = req.body.captureContext;
    
    if (!captureContext || typeof captureContext !== 'string') {
      return res.status(400).render('error', { 
        message: 'Invalid request: captureContext token is required',
        error: { status: 400, stack: '' }
      });
    }

    // Verify and decode the token server-side (do NOT trust client-side decoded data)
    let libraryInfo;
    try {
      libraryInfo = await extractClientLibraryFromToken(captureContext);
    } catch (tokenError) {
      console.error('\nToken Verification Error : ' + tokenError.message);
      return res.status(400).render('error', { 
        message: 'Invalid or expired capture context token. Please request a new token.',
        error: { status: 400, stack: '' }
      });
    }

    const url = libraryInfo.clientLibrary;
    const clientLibraryIntegrity = libraryInfo.clientLibraryIntegrity;
    res.render('checkout', {url: JSON.stringify(url), clientLibraryIntegrity: JSON.stringify(clientLibraryIntegrity), captureContext: captureContext, csrfToken: req.csrfToken()});
  } catch(error) {
      console.error('\nCheckout Error : ' + error);
      res.status(500).render('error', { 
        message: 'An error occurred during checkout preparation',
        error: { status: 500, stack: '' }
      });
  }
});

app.post('/completePaymentResponse', async function (req, res) {
  try {
    const responseToken = req.body.response;
    
    if (!responseToken || typeof responseToken !== 'string') {
      return res.status(400).render('error', { 
        message: 'Invalid request: response token is required',
        error: { status: 400, stack: '' }
      });
    }

    // Verify and decode the response token server-side
    let decodedData;
    try {
      decodedData = await extractResponseData(responseToken);
    } catch (tokenError) {
      console.error('\nResponse Token Verification Error : ' + tokenError.message);
      return res.status(400).render('error', { 
        message: 'Invalid or tampered response token. Payment processing cannot continue.',
        error: { status: 400, stack: '' }
      });
    }

    res.render('completeResponse', { response: responseToken, decodedData: JSON.stringify(decodedData) });
  } catch (error) {
      console.error('\nComplete Payment Response Error : ' + error);
      res.status(500).render('error', { 
        message: 'An error occurred processing the payment response',
        error: { status: 500, stack: '' }
      });
  }
});

// CSRF error handler - must come before other error handlers
app.use(function(err, req, res, next) {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF validation failed: ' + err.message);
    return res.status(403).render('error', {
      message: 'Session expired or invalid. Please reload and try again.',
      error: { status: 403, stack: '' }
    });
  }
  // Pass other errors to next handler
  next(err);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
