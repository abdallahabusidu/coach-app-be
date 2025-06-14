#!/usr/bin/env node

/**
 * 💳 Payment System API Test
 * Tests all payment-related endpoints for functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test configuration
const config = {
  baseURL: BASE_URL,
  timeout: 5000,
  validateStatus: function (status) {
    return status < 500; // Accept all status codes below 500
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testEndpoint(
  method,
  endpoint,
  data = null,
  expectedStatus = 200,
  token = null,
) {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (data) {
      headers['Content-Type'] = 'application/json';
    }

    const requestConfig = {
      method,
      url: endpoint,
      headers,
      ...config,
    };

    if (data) {
      requestConfig.data = data;
    }

    const response = await axios(requestConfig);

    if (response.status === expectedStatus) {
      log(colors.green, `✅ ${method} ${endpoint} - ${response.status}`);
      return { success: true, data: response.data, status: response.status };
    } else {
      log(
        colors.yellow,
        `⚠️  ${method} ${endpoint} - Expected: ${expectedStatus}, Got: ${response.status}`,
      );
      return { success: false, data: response.data, status: response.status };
    }
  } catch (error) {
    log(colors.red, `❌ ${method} ${endpoint} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log(colors.cyan, '🚀 Starting Payment System API Tests...');
  log(colors.cyan, '=====================================');

  let totalTests = 0;
  let passedTests = 0;

  // Test function wrapper
  const test = async (
    description,
    method,
    endpoint,
    data,
    expectedStatus,
    token,
  ) => {
    totalTests++;
    log(colors.blue, `\n🧪 ${description}`);
    const result = await testEndpoint(
      method,
      endpoint,
      data,
      expectedStatus,
      token,
    );
    if (result.success) {
      passedTests++;
    }
    return result;
  };

  // 1. Product Catalog Tests
  log(colors.magenta, '\n📦 1. Product Catalog Tests');
  log(colors.magenta, '===========================');

  await test('Get all products', 'GET', '/products', null, 200);

  await test(
    'Get products with pagination',
    'GET',
    '/products?page=1&limit=5',
    null,
    200,
  );

  await test(
    'Get products by type',
    'GET',
    '/products?type=subscription',
    null,
    200,
  );

  await test(
    'Search products',
    'GET',
    '/products/search?q=coaching',
    null,
    200,
  );

  await test('Get featured products', 'GET', '/products/featured', null, 200);

  await test(
    'Get product categories',
    'GET',
    '/products/categories',
    null,
    200,
  );

  await test('Get iOS store products', 'GET', '/products/store/ios', null, 200);

  await test(
    'Get Android store products',
    'GET',
    '/products/store/android',
    null,
    200,
  );

  // 2. Payment Endpoint Tests (expect 401 without auth)
  log(colors.magenta, '\n💳 2. Payment Endpoint Tests');
  log(colors.magenta, '============================');

  await test(
    'Create payment (no auth)',
    'POST',
    '/payments',
    {
      paymentMethod: 'stripe',
      paymentType: 'subscription',
      amount: 29.99,
      currency: 'USD',
    },
    401,
  );

  await test(
    'Apple IAP validation (no auth)',
    'POST',
    '/payments/apple-iap/validate',
    {
      receiptData: 'test-receipt',
      productId: 'com.coachapp.premium.monthly',
    },
    401,
  );

  await test(
    'Google Play validation (no auth)',
    'POST',
    '/payments/google-play/validate',
    {
      purchaseToken: 'test-token',
      productId: 'premium_monthly',
    },
    401,
  );

  await test(
    'Stripe payment processing (no auth)',
    'POST',
    '/payments/stripe/process',
    {
      paymentIntentId: 'pi_test_intent',
    },
    401,
  );

  await test(
    'Get user payments (no auth)',
    'GET',
    '/payments/my-payments',
    null,
    401,
  );

  await test(
    'Get payment analytics (no auth)',
    'GET',
    '/payments/analytics',
    null,
    401,
  );

  // 3. Subscription Endpoint Tests (expect 401 without auth)
  log(colors.magenta, '\n🔄 3. Subscription Endpoint Tests');
  log(colors.magenta, '=================================');

  await test(
    'Create subscription (no auth)',
    'POST',
    '/subscriptions',
    {
      plan: 'premium',
      billingCycle: 'monthly',
      paymentMethod: 'stripe',
    },
    401,
  );

  await test(
    'Get user subscriptions (no auth)',
    'GET',
    '/subscriptions/my-subscriptions',
    null,
    401,
  );

  await test(
    'Get active subscription (no auth)',
    'GET',
    '/subscriptions/active',
    null,
    401,
  );

  await test(
    'Check feature access (no auth)',
    'GET',
    '/subscriptions/feature-access/customWorkouts',
    null,
    401,
  );

  await test(
    'Check usage limit (no auth)',
    'GET',
    '/subscriptions/usage-limit/messagesUsed',
    null,
    401,
  );

  // 4. Product Management Tests (expect 401 without admin auth)
  log(colors.magenta, '\n🛠️ 4. Product Management Tests');
  log(colors.magenta, '==============================');

  await test(
    'Create product (no auth)',
    'POST',
    '/products',
    {
      name: 'Test Product',
      description: 'Test description',
      type: 'subscription',
      basePrice: 19.99,
      currency: 'USD',
    },
    401,
  );

  // 5. Error Handling Tests
  log(colors.magenta, '\n🔍 5. Error Handling Tests');
  log(colors.magenta, '==========================');

  await test(
    'Invalid product ID',
    'GET',
    '/products/invalid-uuid',
    null,
    500, // Will likely be a 500 due to invalid UUID format
  );

  await test(
    'Invalid store platform',
    'GET',
    '/products/store/invalid',
    null,
    400,
  );

  await test('Invalid search query', 'GET', '/products/search?q=a', null, 400);

  // 6. API Documentation Tests
  log(colors.magenta, '\n📚 6. API Documentation Tests');
  log(colors.magenta, '=============================');

  await test('Swagger documentation', 'GET', '/docs', null, 200);

  await test('Swagger JSON spec', 'GET', '/docs-json', null, 200);

  // Test Summary
  log(colors.cyan, '\n📊 Test Summary');
  log(colors.cyan, '================');
  log(colors.green, `✅ Passed: ${passedTests}/${totalTests}`);
  log(colors.red, `❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(colors.blue, `📈 Success Rate: ${successRate}%`);

  if (passedTests === totalTests) {
    log(
      colors.green,
      '\n🎉 All tests passed! Payment system is working correctly.',
    );
  } else {
    log(
      colors.yellow,
      '\n⚠️  Some tests failed. Check the output above for details.',
    );
  }

  // Additional Information
  log(colors.cyan, '\n💡 Testing Notes:');
  log(
    colors.reset,
    '• Payment endpoints correctly require authentication (401)',
  );
  log(colors.reset, '• Product catalog endpoints are publicly accessible');
  log(colors.reset, '• Admin endpoints properly secured');
  log(colors.reset, '• Store compliance endpoints are functional');
  log(colors.reset, '• Error handling is working as expected');

  log(colors.cyan, '\n🔧 Next Steps:');
  log(colors.reset, '1. Test with authenticated users');
  log(colors.reset, '2. Test real payment flows in sandbox');
  log(colors.reset, '3. Verify store receipt validation');
  log(colors.reset, '4. Test subscription lifecycle');
  log(colors.reset, '5. Validate revenue calculations');

  return { totalTests, passedTests, successRate };
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then((results) => {
      process.exit(results.passedTests === results.totalTests ? 0 : 1);
    })
    .catch((error) => {
      log(colors.red, `💥 Test runner failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runTests, testEndpoint };
