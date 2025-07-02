const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const fs = require('fs');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const cybersourceRestApi = require('cybersource-rest-client');
const configuration = require('./Data/Configuration');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

var usedDropInUI = false;

app.get('/ucoverview', function (req, res) {
  try {
    usedDropInUI = false;
    //can make configuration changes in the json file or via the UI
    const filePath = path.join(__dirname, './Data/default-uc-capture-context-request.json');
    const fileContent = fs.readFileSync(filePath, "utf-8");
    res.render('uc-overview', {jsonRequest: fileContent});               
  } catch (error) {
      res.send('Error : ' + error + ' Error status code : ' + error.statusCode);
  }
});

app.get('/ctp-drop-in-ui-overview', function (req, res) {
    try {
      usedDropInUI = true;
      //can make configuration changes in the json file or via the UI
      const filePath = path.join(__dirname, './Data/default-ctp-drop-in-ui-capture-context-request.json');
      const fileContent = fs.readFileSync(filePath, "utf-8");
      res.render('ctp-drop-in-ui-overview', {jsonRequest: fileContent});               
    } catch (error) {
        res.send('Error : ' + error + ' Error status code : ' + error.statusCode);
    }
});

app.post('/capture-context', function (req, res) {
  try {
    // add your merchant id and keys in the ./Data/Configuration 
    const configObject = new configuration();
    const apiClient = new cybersourceRestApi.ApiClient();
    const requestObj = JSON.parse(req.body.captureContextRequest);
    const instance = new cybersourceRestApi.UnifiedCheckoutCaptureContextApi(configObject, apiClient);

    instance.generateUnifiedCheckoutCaptureContext(requestObj, function (error, data, response) {
      if (error) {
        console.error('\nError : ' + JSON.stringify(error));
      }
      else if (data) {
        const decodedData =  JSON.parse(Buffer.from(data.split('.')[1], 'base64').toString());
        res.render('capture-context', {captureConext: data, decodedData: JSON.stringify(decodedData)});
      }
    });
	}
	catch (error) {
		console.log('\nException on calling the API : ' + error);
	}
});

app.post('/checkout', function (req, res) {
  try {
    const decodeData = JSON.parse(req.body.captureContextDecoded);
    const captureContext = req.body.captureContext;
    //extract the client library URL and the integrity to load the SDK
    const url = decodeData.ctx[0].data.clientLibrary;
    const clientLibraryIntegrity = decodeData.ctx[0].data.clientLibraryIntegrity
    res.render('checkout', {url: JSON.stringify(url), clientLibraryIntegrity: JSON.stringify(clientLibraryIntegrity), captureContext: captureContext});
  } catch(error) {
      res.send('Error : ' + error + ' Error status code : ' + error.statusCode);
  }
});

app.post('/completePaymentResponse', function (req, res) {
  try {
    const response = req.body.response.split('.')[1];
    const decodedData =  JSON.parse(Buffer.from(response, 'base64').toString());
    res.render('completeResponse', { response:  req.body.response, decodedData: JSON.stringify(decodedData), usedDropInUI: usedDropInUI} );                
  } catch (error) {
      res.send('Error : ' + error + ' Error status code : ' + error.statusCode);
  }  
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
