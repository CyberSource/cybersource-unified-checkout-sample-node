const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const fs = require('fs');
const jose = require('node-jose');
const jwt = require('jsonwebtoken');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const cybersourceRestApi = require('cybersource-rest-client');
const configuration = require('./Data/Configuration');
const portfolioConfiguration = require("./Data/PortfolioConfiguration");

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

app.post('/tokenUnified', function (req, res) {
  try {
    const tt = req.body.transientToken.split('.')[1];
    const decodedData =  JSON.parse(Buffer.from(tt, 'base64').toString());
    res.render('tokenUnified', { transientToken:  req.body.transientToken, decodedData: JSON.stringify(decodedData), usedDropInUI: usedDropInUI} );                
  } catch (error) {
      res.send('Error : ' + error + ' Error status code : ' + error.statusCode);
  }  
});

app.post('/payment-credentials', function (req, res) {

  try {
    // add your merchant id and keys in the ./Data/PortfolioConfiguration
    const configObject = new portfolioConfiguration();
    const apiClient = new cybersourceRestApi.ApiClient();
    //overriding the accept header here due to the issue with the SDK, fix scheduled for early May
    apiClient.acceptHeader = 'application/jwt';
    const portfolioID = configObject.portfolioID;

    //fetch the payment credentials from the transient token
    const decodeData = JSON.parse(req.body.decodedData);
    const paymentCredentialsReference = decodeData.paymentCredentialsReference[portfolioID];

    const instance = new cybersourceRestApi.TransientTokenDataApi(configObject, apiClient);

    instance.getPaymentCredentialsForTransientToken(paymentCredentialsReference, async function (error, data, response) {
    if (error) {
      console.error('\nError : ' + JSON.stringify(error));
    }
    else if (data) {
      //decrypting the payment-crendetials usimg the secret key, upload you secret key in the Resource folder
      //update the ./Data/Configuration to point to the correct pemFileDirectory
      const paymentCredentials = data;
      const privateKeyPath = configObject.pemFileDirectory;
      // Read the private key from the .pem file
      const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');

      // Remove the PEM header and footer
      const key = privateKeyPem
          .split('\n')
          .filter(line => !line.startsWith('-----BEGIN PRIVATE KEY-----') && !line.startsWith('-----END PRIVATE KEY-----'))
          .join('');

      // Decode the base64 encoded key
      const keyBytes = Buffer.from(key, 'base64');

      // Import the private key for JWE decryption
      const keystore = jose.JWK.createKeyStore();
      const privateKey = await keystore.add(keyBytes, 'pkcs8');

      // Parse and decrypt the JWE object
      const jweObject = await jose.JWE.createDecrypt(privateKey).decrypt(paymentCredentials);

      // Parse the JWT payload
      const decodedJWT = jwt.decode(jweObject.payload.toString());

      // Add the decoded JWT payload as a pretty-printed JSON string
      res.render('payment-credentials',{transientToken:  JSON.stringify(data), decodedData: JSON.stringify(decodedJWT, null, 2)});   
    }});             
  } catch (error) {
      res.send('Error : ' + error + ' Error status code : ' + error.statusCode);
  }
});

app.post('/receiptUnified', function (req, res) {
  try {
    const tokenResponse = req.body.transientToken;
    const configObj = new configuration();
    const instance = new cybersourceRestApi.PaymentsApi(configObj);

    const clientReferenceInformation = new cybersourceRestApi.Ptsv2paymentsClientReferenceInformation();
    clientReferenceInformation.code = 'test_flex_payment';

    const processingInformation = new cybersourceRestApi.Ptsv2paymentsProcessingInformation();
    processingInformation.commerceIndicator = 'internet';

    const amountDetails = new cybersourceRestApi.Ptsv2paymentsOrderInformationAmountDetails();
    amountDetails.totalAmount = '102.21';
    amountDetails.currency = 'USD';

    const billTo = new cybersourceRestApi.Ptsv2paymentsOrderInformationBillTo();
    billTo.country = 'US';
    billTo.firstName = 'John';
    billTo.lastName = 'Deo';
    billTo.phoneNumber = '4158880000';
    billTo.address1 = 'test';
    billTo.postalCode = '94105';
    billTo.locality = 'San Francisco';
    billTo.administrativeArea = 'MI';
    billTo.email = 'test@cybs.com';
    billTo.address2 = 'Address 2';
    billTo.district = 'MI';
    billTo.buildingNumber = '123';

    const orderInformation = new cybersourceRestApi.Ptsv2paymentsOrderInformation();
    orderInformation.amountDetails = amountDetails;
    orderInformation.billTo = billTo;

    const tokenInformation = new cybersourceRestApi.Ptsv2paymentsTokenInformation();
    tokenInformation.transientTokenJwt = tokenResponse;

    const request = new cybersourceRestApi.CreatePaymentRequest();
    request.clientReferenceInformation = clientReferenceInformation;
    request.processingInformation = processingInformation;
    request.orderInformation = orderInformation;
    request.tokenInformation = tokenInformation;

    console.log('\n*************** Process Payment ********************* ');

    instance.createPayment(request, function (error, data, response) {
      if (error) {
        console.log('\nError in process a payment : ' + JSON.stringify(error));
      }
      else if (data) {
        console.log('\nData of process a payment : ' + JSON.stringify(data));
        res.render('receiptUnified', { paymentResponse:  JSON.stringify(data)} );
  
      }
      console.log('\nResponse of process a payment : ' + JSON.stringify(response));
      console.log('\nResponse Code of process a payment : ' + JSON.stringify(response['status']));
    }); 
  } catch (error) {
      console.error(error);
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
