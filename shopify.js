require('@shopify/shopify-api/adapters/node')
const { shopifyApi, Session } = require('@shopify/shopify-api')
const { restResources } = require('@shopify/shopify-api/rest/admin/2024-10')
require('dotenv').config()

console.log(process.env)

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_ADMIN_API_KEY,
  apiSecretKey: process.env.SHOPIFY_ADMIN_API_SECRET,
  adminApiAccessToken: process.env.SHOPIFY_ADMIN_API_TOKEN,
  privateAppStorefrontAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
  scopes: ['read_products', 'write_checkouts', 'read_orders', 'write_orders', 'write_assigned_fulfillment_orders', 'read_assigned_fulfillment_orders'],
  hostName: process.env.SHOPIFY_URL,
  hostScheme: "https",
  restResources
})

const shopifySession = new Session({
  accessToken: process.env.SHOPIFY_ADMIN_API_TOKEN,
  shop: process.env.SHOPIFY_URL
})

const getFullfilmentOrderId = async(orderId) => {
  const query = `
  query GetFulfillmentOrders($orderId: ID!) {
    order(id: $orderId) {
      id
      fulfillmentOrders(first: 10) {
        edges {
          node {
            id
          }
        }
      }
    }
  }`

  const client = new shopify.clients.Graphql({ session: shopifySession })
  const response = await client.request(query, {
    variables: {
      "orderId": `gid://shopify/Order/${orderId}`
    }
  })
  return response.data.order.fulfillmentOrders?.edges?.map(fulfillmentOrder => fulfillmentOrder?.node?.id)
}

const fullFillmentOrder = async(fulfillmentOrderId) => {
  const query =`mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
      fulfillmentCreateV2(fulfillment: $fulfillment) {
        fulfillment {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }`

  const client = new shopify.clients.Graphql({ session: shopifySession })
  const response = await client.request(query, {
    variables: {
      fulfillment: {
        lineItemsByFulfillmentOrder: {
          fulfillmentOrderId
        }
      }
    }
  })

  console.log(JSON.stringify(response.data, null, 2))

  return response.data?.fulfillmentCreateV2?.fulfillment?.status === "SUCCESS"
}

module.exports = {
  shopify,
  shopifySession,
  getFullfilmentOrderId,
  fullFillmentOrder
}
