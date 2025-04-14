# CyberSource Flex Samples (NodeJS)

This repository provides simple examples demonstrating usage of the Unified checkout and the drop-in UI flows.  For more details visit our Developer Guide at 

1. Unified Checkout: https://developer.cybersource.com/docs/cybs/en-us/unified-checkout/developer/all/rest/unified-checkout/uc-intro.html
2. Drop-in UI: https://developer.cybersource.com/docs/cybs/en-us/click-to-pay/developer/all/rest/click-to-pay.html

## Usage

1. Clone or download this repository.
2. cd into unified-checkout-node directory
3. Update json/js configuration files in the Data folder with your [CyberSource sandbox credentials](https://ebc2test.cybersource.com). 
4. Run ```npm install``` in the sample 
5. Run ```npm start```.
6. Browse to https://localhost:3000 in your browser

## Requirements

* Node
* Express
* NPM


## Using the Application

> ❗️ This application uses Cybersource's test environment, and should be used with mock data.
> 
> All information is secured to our production standards, but please use a [test card number](https://developer.cybersource.com/hello-world/testing-guide.html) such as `4111 1111 1111 1111`
> and false name / address information on the `/checkout` page (where information is entered into Unified Checkout's UI) to limit usage of any unnecessary personal information.
>
 
Unified Checkout requires an HTTPS URL, so navigate to https://localhost:3000 and proceed through the various screens to understand how things work under the hood. Note that you may receive a warning about the certificate's validity, and can simply proceed.

Otherwise you can add the `ucDemoKeystore.p12` in `./unified-checkout-node/Resources` using Keychain Access (Mac) or MMC (Windows).

To serve from a different domain, or change other request attributes, see [default capture context request](./unified-checkout-node/Data/default-uc-capture-context-request.json).

The `targetOrigins` field in this request controls where your checkout page is served.

### Test Cards

- `4111 1111 1111 1111` - Visa test card, frictionless 3DS

### Additional Steps for Click to Pay Drop-in UI users

1. Follow the steps outlined in the [Click to Pay Drop-in UI developer guide](https://developer.cybersource.com/docs/cybs/en-us/click-to-pay/developer/all/rest/click-to-pay.html) to
create a portfolio-level merchant with the proper configurations, upload a public encryption key, and create a transacting merchant as a child of this portfolio.
2. Uncomment the following properties in [application.properties](./Data/PortfolioConfiguration.js) _in addition to_ the merchant properties specified in [Setup Instructions](#setup-instructions).
    ```properties
		porfolioId=YOUR PORTFOLIO ID
		portfolioKeyId=YOUR PORTFOLIO KEY ID
		portfolioSecretKey=YOUR PORTFOLIO SECRET KEY
    ```
3. Upload your portfolio merchant's private key to a file called `private_key.pem` in the [keystore folder](./src/main/resources). The key should match the specs outlined in [the developer guide](https://developer.cybersource.com/docs/cybs/en-us/click-to-pay/developer/all/rest/click-to-pay/ctp-configuration-intro/uc-upload-encrypt-key-intro.html).