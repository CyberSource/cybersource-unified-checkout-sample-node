'use strict';

/*
* Merchant configuration properties are taken from Configuration module
*/

// common parameters
const AuthenticationType = 'http_signature';
const RunEnvironment = 'apitest.cybersource.com';

// http_signature parameters

// const PortfolioKeyId= YOUR PORTFOLIO KEY ID;
// const PortfolioSecretKey= YOUR PORTFOLIO SECRET KEY;
// const PortfolioId= YOUR PORTFOLIO ID;


// jwt parameters
const KeysDirectory = 'Resource';
// const KeyFileName = YOUR MERCHANT ID;
// const KeyAlias = YOUR MERCHANT ID;
// const KeyPass = YOUR MERCHANT ID;

//meta key parameter
const UseMetaKey = false;

// logging parameters
const EnableLog = true;
const LogFileName = 'cybs';
const LogDirectory = 'log';
const LogfileMaxSize = '5242880'; //10 MB In Bytes
const EnableMasking = true;

/*
PEM Key file path for decoding JWE Response Enter the folder path where the .pem file is located.
It is optional property, require adding only during JWE decryption.
*/
const PemFileDirectory = 'Resource/NetworkTokenCert.pem';

//Add the property if required to override the cybs default developerId in all request body
const DefaultDeveloperId = '';

function PortfolioConfiguration() {

    return {
        'authenticationType': AuthenticationType,
        'runEnvironment': RunEnvironment,

        'merchantID': PortfolioId,
        'merchantKeyId': PortfolioKeyId,
        'merchantsecretKey': PortfolioSecretKey,

        'keyAlias': KeyAlias,
        'keyPass': KeyPass,
        'keyFileName': KeyFileName,
        'keysDirectory': KeysDirectory,

        'useMetaKey': UseMetaKey,
        'portfolioID': PortfolioId,
        'pemFileDirectory': PemFileDirectory,
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
}

module.exports = PortfolioConfiguration;