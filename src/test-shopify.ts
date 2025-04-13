import {
  initializeShopify,
  getFulfillmentOrderDetails,
  fulfillOrderLineItems,
  type FulfillmentOrderDetails
} from './lib/Shopify.js';
import { color } from './functions.js';
import 'dotenv/config';

const TEST_ORDER_ID = '5967479996597';

const runShopifyTest = async () => {
  console.log(color("text", `🚀 Starting Shopify test script for Order ID: ${TEST_ORDER_ID}...`));

  try {
      // 1. Initialize Shopify
      console.log(color("text", "\n--- Step 1: Initializing Shopify ---"));
      await initializeShopify();
      console.log(color("text", "✅ Shopify initialized successfully."));

      // 2. Get Fulfillment Order Details (including line items)
      console.log(color("text", `\n--- Step 2: Getting Fulfillment Order Details for Order ${TEST_ORDER_ID} ---`));
      // Use the new function
      const fulfillmentOrderDetailsList: FulfillmentOrderDetails[] = await getFulfillmentOrderDetails(TEST_ORDER_ID);

      if (!fulfillmentOrderDetailsList || fulfillmentOrderDetailsList.length === 0) {
          console.warn(color("text", `⚠️ No fulfillable Fulfillment Orders found for Order ${TEST_ORDER_ID}. Cannot proceed to fulfillment test.`)); // Changed color
          console.log(color("text", "\n🏁 Test script finished (no fulfillment attempted)."));
          return;
      }

      console.log(color("text", `✅ Found ${fulfillmentOrderDetailsList.length} Fulfillment Order(s).`));

      // 3. Attempt to Fulfill the First Fulfillment Order Found
      // Get the details for the first one in the list
      const firstFulfillmentDetails = fulfillmentOrderDetailsList[0];

      console.log(color("text", `\n--- Step 3: Attempting to fulfill ${firstFulfillmentDetails.lineItems.length} line item(s) for Fulfillment Order ${firstFulfillmentDetails.fulfillmentOrderId} ---`));
      console.log(color("text", `   Line Items: ${JSON.stringify(firstFulfillmentDetails.lineItems)}`));

      // Pass the whole details object to the updated function
      const success = await fulfillOrderLineItems(firstFulfillmentDetails);

      if (success) {
          console.log(color("text", `✅ Successfully requested fulfillment for ${firstFulfillmentDetails.fulfillmentOrderId}. Check your Shopify admin!`));
      } else {
          console.error(color("error", `❌ Failed to request fulfillment for ${firstFulfillmentDetails.fulfillmentOrderId}. Check logs above for details.`));
      }

      console.log(color("text", "\n🏁 Test script finished."));

  } catch (error) {
      console.error(color("error", "\n--- 💥 An error occurred during the test ---"));
      if (error instanceof Error) {
          console.error(color("error", `Error message: ${error.message}`));
          console.error(color("error", `Stack trace: ${error.stack}`));
      } else {
          console.error(color("error", `Unknown error: ${String(error)}`));
      }
      console.log(color("text", "\n🏁 Test script finished with errors."));
      process.exit(1); // Exit with error code
  }
};

// Run the test
runShopifyTest();
