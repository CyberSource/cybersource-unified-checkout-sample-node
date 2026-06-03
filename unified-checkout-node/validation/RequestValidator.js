'use strict';

/**
 * Request Validator - Validates and sanitizes captureContextRequest against the CyberSource model schema
 */

const cybersourceRestApi = require('cybersource-rest-client');

/**
 * Schema definition based on GenerateUnifiedCheckoutCaptureContextRequest model
 */
const SCHEMA = {
  clientVersion: {
    type: 'string',
    required: true,
    description: 'Unified Checkout version (e.g., "0.26")'
  },
  targetOrigins: {
    type: 'array',
    itemType: 'string',
    required: true,
    description: 'Target origins URLs where Unified Checkout will be embedded'
  },
  allowedCardNetworks: {
    type: 'array',
    itemType: 'string',
    required: false,
    allowedValues: [
      'VISA', 'MASTERCARD', 'AMEX', 'CARNET', 'CARTESBANCAIRES', 'CUP',
      'DINERSCLUB', 'DISCOVER', 'EFTPOS', 'ELO', 'JCB', 'JCREW', 'MADA',
      'MAESTRO', 'MEEZA'
    ],
    description: 'List of card networks allowed for transaction'
  },
  allowedPaymentTypes: {
    type: 'array',
    itemType: 'string',
    required: false,
    allowedValues: ['APPLEPAY', 'CHECK', 'CLICKTOPAY', 'GOOGLEPAY', 'PANENTRY', 'PAZE'],
    description: 'Payment types allowed in checkout'
  },
  country: {
    type: 'string',
    required: false,
    description: 'Two-character ISO country code'
  },
  locale: {
    type: 'string',
    required: false,
    description: 'Localization code (e.g., en_US)'
  },
  captureMandate: {
    type: 'object',
    required: false,
    model: 'Upv1capturecontextsCaptureMandate',
    description: 'Capture mandate configuration'
  },
  completeMandate: {
    type: 'object',
    required: false,
    model: 'Upv1capturecontextsCompleteMandate',
    description: 'Complete mandate configuration'
  },
  orderInformation: {
    type: 'object',
    required: false,
    model: 'Upv1capturecontextsOrderInformation',
    description: 'Order information details'
  },
  transientTokenResponseOptions: {
    type: 'object',
    required: false,
    model: 'Microformv2sessionsTransientTokenResponseOptions',
    description: 'Transient token response options'
  }
};

/**
 * Validates basic type constraints
 */
function validateType(value, expectedType) {
  if (expectedType === 'string') {
    return typeof value === 'string';
  }
  if (expectedType === 'boolean') {
    return typeof value === 'boolean';
  }
  if (expectedType === 'number') {
    return typeof value === 'number';
  }
  if (expectedType === 'array') {
    return Array.isArray(value);
  }
  if (expectedType === 'object') {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  return true;
}

/**
 * Validates targetOrigins array
 */
function validateTargetOrigins(targetOrigins) {
  if (!Array.isArray(targetOrigins) || targetOrigins.length === 0) {
    throw new Error('targetOrigins must be a non-empty array');
  }
  
  for (const origin of targetOrigins) {
    if (typeof origin !== 'string') {
      throw new Error('Each targetOrigin must be a string');
    }
    // Basic URL validation - must use HTTPS protocol
    if (!/^https:\/\/.+/.test(origin)) {
      throw new Error(`Invalid targetOrigin format: ${origin}. Must start with https://`);
    }
  }
}

/**
 * Validates allowedCardNetworks array
 */
function validateAllowedCardNetworks(networks) {
  if (!Array.isArray(networks)) {
    throw new Error('allowedCardNetworks must be an array');
  }
  
  const validNetworks = [
    'VISA', 'MASTERCARD', 'AMEX', 'CARNET', 'CARTESBANCAIRES', 'CUP',
    'DINERSCLUB', 'DISCOVER', 'EFTPOS', 'ELO', 'JCB', 'JCREW', 'MADA',
    'MAESTRO', 'MEEZA'
  ];
  
  for (const network of networks) {
    if (!validNetworks.includes(network)) {
      throw new Error(`Invalid card network: ${network}. Must be one of: ${validNetworks.join(', ')}`);
    }
  }
}

/**
 * Validates allowedPaymentTypes array
 */
function validateAllowedPaymentTypes(paymentTypes) {
  if (!Array.isArray(paymentTypes)) {
    throw new Error('allowedPaymentTypes must be an array');
  }
  
  const validTypes = ['APPLEPAY', 'CHECK', 'CLICKTOPAY', 'GOOGLEPAY', 'PANENTRY', 'PAZE'];
  
  for (const type of paymentTypes) {
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid payment type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }
}

/**
 * Validates country code
 */
function validateCountry(country) {
  if (!/^[A-Z]{2}$/.test(country)) {
    throw new Error(`Invalid country code: ${country}. Must be a two-character ISO 3166-1 alpha-2 code`);
  }
}

/**
 * Validates locale format
 */
function validateLocale(locale) {
  if (!/^[a-z]{2}_[A-Z]{2}$/.test(locale)) {
    throw new Error(`Invalid locale format: ${locale}. Must be in format: xx_YY (e.g., en_US)`);
  }
}

/**
 * Validates captureMandate using the CyberSource model
 */
function validateCaptureMandate(mandateData) {
  if (!mandateData) return;
  
  try {
    // Use the CyberSource model to validate structure
    const mandateModel = cybersourceRestApi.Upv1capturecontextsCaptureMandate;
    mandateModel.constructFromObject(mandateData);
  } catch (error) {
    throw new Error(`Invalid captureMandate: ${error.message}`);
  }

  // Additional validation for specific fields
  if (mandateData.billingType) {
    const validBillingTypes = ['FULL', 'PARTIAL', 'NONE'];
    if (!validBillingTypes.includes(mandateData.billingType)) {
      throw new Error(`Invalid billingType: ${mandateData.billingType}. Must be one of: ${validBillingTypes.join(', ')}`);
    }
  }

  if (mandateData.requestEmail !== undefined && typeof mandateData.requestEmail !== 'boolean') {
    throw new Error('requestEmail must be a boolean');
  }

  if (mandateData.requestPhone !== undefined && typeof mandateData.requestPhone !== 'boolean') {
    throw new Error('requestPhone must be a boolean');
  }

  if (mandateData.requestShipping !== undefined && typeof mandateData.requestShipping !== 'boolean') {
    throw new Error('requestShipping must be a boolean');
  }

  if (mandateData.requestSaveCard !== undefined && typeof mandateData.requestSaveCard !== 'boolean') {
    throw new Error('requestSaveCard must be a boolean');
  }

  if (mandateData.comboCard !== undefined && typeof mandateData.comboCard !== 'boolean') {
    throw new Error('comboCard must be a boolean');
  }

  if (mandateData.showAcceptedNetworkIcons !== undefined && typeof mandateData.showAcceptedNetworkIcons !== 'boolean') {
    throw new Error('showAcceptedNetworkIcons must be a boolean');
  }

  if (mandateData.shipToCountries) {
    if (!Array.isArray(mandateData.shipToCountries)) {
      throw new Error('shipToCountries must be an array');
    }
    for (const country of mandateData.shipToCountries) {
      if (!/^[A-Z]{2}$/.test(country)) {
        throw new Error(`Invalid country code in shipToCountries: ${country}`);
      }
    }
  }
}

/**
 * Validates orderInformation using the CyberSource model
 */
function validateOrderInformation(orderInfoData) {
  if (!orderInfoData) return;
  
  try {
    // Use the CyberSource model to validate structure
    const orderModel = cybersourceRestApi.Upv1capturecontextsOrderInformation;
    orderModel.constructFromObject(orderInfoData);
  } catch (error) {
    throw new Error(`Invalid orderInformation: ${error.message}`);
  }

  // Validate amountDetails
  if (orderInfoData.amountDetails) {
    const amountDetails = orderInfoData.amountDetails;
    
    if (amountDetails.totalAmount) {
      if (!/^\d+\.\d{2}$/.test(amountDetails.totalAmount.toString())) {
        throw new Error(`Invalid totalAmount: ${amountDetails.totalAmount}. Must be in format: XX.XX`);
      }
    }

    if (amountDetails.currency) {
      if (!/^[A-Z]{3}$/.test(amountDetails.currency)) {
        throw new Error(`Invalid currency code: ${amountDetails.currency}. Must be a valid ISO 4217 code`);
      }
    }
  }

  // Validate billTo
  if (orderInfoData.billTo) {
    validateAddressObject(orderInfoData.billTo, 'billTo');
  }

  // Validate shipTo
  if (orderInfoData.shipTo) {
    validateAddressObject(orderInfoData.shipTo, 'shipTo');
  }
}

/**
 * Validates completeMandate using the CyberSource model
 */
function validateCompleteMandate(mandateData) {
  if (!mandateData) return;

  try {
    // Use the CyberSource model to validate structure
    const mandateModel = cybersourceRestApi.Upv1capturecontextsCompleteMandate;
    mandateModel.constructFromObject(mandateData);
  } catch (error) {
    throw new Error(`Invalid completeMandate: ${error.message}`);
  }

  // Restrict to known fields
  const allowedFields = ['type', 'decisionManager', 'billPayment'];
  for (const field of Object.keys(mandateData)) {
    if (!allowedFields.includes(field)) {
      throw new Error(`Unexpected field in completeMandate: ${field}`);
    }
  }

  // Validate type enum
  if (mandateData.type !== undefined) {
    const validTypes = ['AUTH', 'CAPTURE'];
    if (typeof mandateData.type !== 'string' || !validTypes.includes(mandateData.type)) {
      throw new Error(`Invalid completeMandate.type: ${mandateData.type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate boolean fields
  if (mandateData.decisionManager !== undefined && typeof mandateData.decisionManager !== 'boolean') {
    throw new Error('completeMandate.decisionManager must be a boolean');
  }

  if (mandateData.billPayment !== undefined && typeof mandateData.billPayment !== 'boolean') {
    throw new Error('completeMandate.billPayment must be a boolean');
  }
}

/**
 * Validates transientTokenResponseOptions using the CyberSource model
 */
function validateTransientTokenResponseOptions(optionsData) {
  if (!optionsData) return;

  try {
    // Use the CyberSource model to validate structure
    const optionsModel = cybersourceRestApi.Microformv2sessionsTransientTokenResponseOptions;
    optionsModel.constructFromObject(optionsData);
  } catch (error) {
    throw new Error(`Invalid transientTokenResponseOptions: ${error.message}`);
  }

  // Restrict to known fields
  const allowedFields = ['includeCardPrefix'];
  for (const field of Object.keys(optionsData)) {
    if (!allowedFields.includes(field)) {
      throw new Error(`Unexpected field in transientTokenResponseOptions: ${field}`);
    }
  }

  // Validate boolean fields
  if (optionsData.includeCardPrefix !== undefined && typeof optionsData.includeCardPrefix !== 'boolean') {
    throw new Error('transientTokenResponseOptions.includeCardPrefix must be a boolean');
  }
}

/**
 * Validates address object (billTo or shipTo)
 */
function validateAddressObject(addressData, objectName) {
  const allowedFields = [
    'address1', 'address2', 'address3', 'address4', 'administrativeArea',
    'buildingNumber', 'country', 'district', 'locality', 'postalCode',
    'company', 'email', 'firstName', 'lastName', 'middleName',
    'nameSuffix', 'title', 'phoneNumber', 'phoneType'
  ];

  for (const field of Object.keys(addressData)) {
    if (!allowedFields.includes(field)) {
      throw new Error(`Unexpected field in ${objectName}: ${field}`);
    }
  }

  // Validate specific fields
  if (addressData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressData.email)) {
    throw new Error(`Invalid email format in ${objectName}: ${addressData.email}`);
  }

  if (addressData.country && !/^[A-Z]{2}$/.test(addressData.country)) {
    throw new Error(`Invalid country code in ${objectName}: ${addressData.country}`);
  }

  if (addressData.phoneType && !['mobile', 'home', 'work'].includes(addressData.phoneType)) {
    throw new Error(`Invalid phoneType in ${objectName}: ${addressData.phoneType}. Must be one of: mobile, home, work`);
  }

  // Validate string fields don't contain HTML
  const stringFields = ['address1', 'address2', 'address3', 'address4', 'firstName', 'lastName',
    'middleName', 'locality', 'administrativeArea', 'district', 'postalCode', 'phoneNumber'];
  
  for (const field of stringFields) {
    if (addressData[field] && typeof addressData[field] === 'string') {
      if (/<[^>]*>/g.test(addressData[field])) {
        throw new Error(`${field} in ${objectName} contains invalid characters`);
      }
    }
  }
}

/**
 * Main validation function
 * @param {string} requestBody - The JSON string from req.body.captureContextRequest
 * @returns {object} - Validated request object
 * @throws {Error} - If validation fails
 */
function validateRequest(requestBody) {
  let parsedRequest;

  // Validate JSON format
  try {
    parsedRequest = JSON.parse(requestBody);
  } catch (error) {
    throw new Error('Invalid JSON format in captureContextRequest');
  }

  // Validate it's an object, not an array
  if (typeof parsedRequest !== 'object' || Array.isArray(parsedRequest) || parsedRequest === null) {
    throw new Error('captureContextRequest must be a JSON object');
  }

  // Check for required fields
  for (const [field, config] of Object.entries(SCHEMA)) {
    if (config.required && !(field in parsedRequest)) {
      throw new Error(`Required field missing: ${field}`);
    }
  }

  // Validate each field against schema
  for (const [field, value] of Object.entries(parsedRequest)) {
    if (!(field in SCHEMA)) {
      throw new Error(`Unexpected field: ${field}`);
    }

    const fieldSchema = SCHEMA[field];

    // Validate type
    if (!validateType(value, fieldSchema.type)) {
      throw new Error(`Invalid type for field ${field}: expected ${fieldSchema.type}, got ${typeof value}`);
    }

    // Validate array items
    if (fieldSchema.type === 'array' && fieldSchema.itemType) {
      if (!value.every(item => validateType(item, fieldSchema.itemType))) {
        throw new Error(`Invalid item type in ${field}: expected ${fieldSchema.itemType}`);
      }
    }

    // Validate enum values
    if (fieldSchema.allowedValues && !value.every(v => fieldSchema.allowedValues.includes(v))) {
      throw new Error(`Invalid value in ${field}. Allowed values: ${fieldSchema.allowedValues.join(', ')}`);
    }

    // Specific field validations
    switch (field) {
      case 'targetOrigins':
        validateTargetOrigins(value);
        break;
      case 'allowedCardNetworks':
        validateAllowedCardNetworks(value);
        break;
      case 'allowedPaymentTypes':
        validateAllowedPaymentTypes(value);
        break;
      case 'country':
        if (value) validateCountry(value);
        break;
      case 'locale':
        if (value) validateLocale(value);
        break;
      case 'captureMandate':
        validateCaptureMandate(value);
        break;
      case 'completeMandate':
        validateCompleteMandate(value);
        break;
      case 'orderInformation':
        validateOrderInformation(value);
        break;
      case 'transientTokenResponseOptions':
        validateTransientTokenResponseOptions(value);
        break;
    }
  }

  // Try to construct the actual CyberSource model to ensure compatibility
  try {
    cybersourceRestApi.GenerateUnifiedCheckoutCaptureContextRequest.constructFromObject(parsedRequest);
  } catch (error) {
    throw new Error(`Request does not conform to CyberSource model schema: ${error.message}`);
  }

  return parsedRequest;
}

module.exports = {
  validateRequest
};
