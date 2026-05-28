'use strict';

/*
* Merchant configuration properties are taken from Configuration module
*/

// common parameters
const AuthenticationType = 'http_signature';
const RunEnvironment = 'apitest.cybersource.com';


// http_signature parameters

//params for UC merchant or drop-in-ui
// const MerchantId = YOUR MERCHANT ID;
// const MerchantKeyId = YOUR MERCHANT KEY ID;
// const MerchantSecretKey = YOUR MERCHANT SECRET;

// jwt parameters
// const KeysDirectory = 'Resource';
// const KeyFileName = YOUR MERCHANT ID;
// const KeyAlias = YOUR MERCHANT ID;
// const KeyPass =  YOUR MERCHANT ID;

//meta key parameters
const UseMetaKey = false;
const PortfolioID = '';

// logging parameters
const EnableLog = true;
const LogFileName = 'cybs';
const LogDirectory = 'log';
const LogfileMaxSize = '5242880'; //10 MB In Bytes
const EnableMasking = true;

/*
 * The file path to the network tokenization private key PEM file.
 *
 * This file is used to sign the network tokenization request when using the JWT authentication method.
 * 
 * The PEM file should contain the private key associated with the merchant's network tokenization certificate.
 * 
 * The file path should be relative to the root directory of the project or an absolute path to 
 * the PEM file location.
 */
// const PemFileDirectory = 'Resource/<file_name>.pem';

//Add the property if required to override the cybs default developerId in all request body
const DefaultDeveloperId = '';

// Constructor for Configuration
function Configuration() {

    var configObj = {
        'authenticationType': AuthenticationType,
        'runEnvironment': RunEnvironment,

        'merchantID': MerchantId,
        'merchantKeyId': MerchantKeyId,
        'merchantsecretKey': MerchantSecretKey,

        // 'keyAlias': KeyAlias,
        // 'keyPass': KeyPass,
        // 'keyFileName': KeyFileName,
        // 'keysDirectory': KeysDirectory,

        'useMetaKey': UseMetaKey,
        'portfolioID': PortfolioID,
        // 'pemFileDirectory': PemFileDirectory,
        'defaultDeveloperId': DefaultDeveloperId,
        'logConfiguration': {
            'enableLog': EnableLog,
            'logFileName': LogFileName,
            'logDirectory': LogDirectory,
            'logFileMaxSize': LogfileMaxSize,
            'loggingLevel': 'debug',
            'enableMasking': EnableMasking
        }
    };
    return configObj;

}

module.exports = Configuration;
