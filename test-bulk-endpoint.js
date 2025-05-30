const fetch = require('node-fetch');

// Test the bulk food lookup endpoint
async function testBulkLookup() {
  try {
    console.log('🧪 Testing bulk food lookup endpoint...');
    
    // Sample bulk food request
    const testData = {
      foods: [
        {
          id: "test-1",
          foodQuery: "scrambled eggs",
          quantity: 2,
          unit: "large"
        },
        {
          id: "test-2", 
          foodQuery: "whole wheat toast",
          quantity: 1,
          unit: "slice"
        },
        {
          id: "test-3",
          foodQuery: "orange juice",
          quantity: 8,
          unit: "oz"
        }
      ]
    };

    const response = await fetch('http://localhost:5000/api/food/bulk-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You would need a real JWT token for authentication
        'Authorization': 'Bearer your-jwt-token-here'
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers.raw());
    
    const result = await response.text();
    console.log('📡 Response body:', result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('✅ Success! Analyzed', data.data.analyzedFoods.length, 'foods');
      console.log('💰 Estimated API cost:', data.data.totalApiCost);
      console.log('⏱️ Processing time:', data.data.processingTime, 'ms');
    } else {
      console.log('❌ Request failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBulkLookup(); 