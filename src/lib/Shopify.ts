import '@shopify/shopify-api/adapters/node';
import type { Shopify } from '@shopify/shopify-api';
import {
    shopifyApi,
    Session,
    ApiVersion,
    LogSeverity,
    GraphqlClient,
    ShopifyError,
} from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-04';
import { color } from '~/functions.js';
import 'dotenv/config';

// Interfaces
interface ShopifyEnvVars {
    SHOPIFY_ADMIN_API_KEY: string;
    SHOPIFY_ADMIN_API_SECRET: string;
    SHOPIFY_ADMIN_API_TOKEN: string;
    SHOPIFY_STOREFRONT_TOKEN?: string;
    SHOPIFY_URL: string;
}

interface FulfillmentOrderLineItem {
    id: string;
    remainingQuantity: number;
}

interface FulfillmentOrderLineItemEdge {
    node: FulfillmentOrderLineItem;
}

interface FulfillmentOrderNode {
    id: string;
    lineItems: {
        edges: FulfillmentOrderLineItemEdge[];
    };
}

interface FulfillmentOrderEdge {
    node: FulfillmentOrderNode;
}

interface GetFulfillmentOrdersData {
    order?: {
        id: string;
        fulfillmentOrders?: {
            edges?: FulfillmentOrderEdge[];
        };
    };
}

export interface FulfillmentOrderDetails {
    fulfillmentOrderId: string;
    lineItems: Array<{ id: string; quantity: number; }>;
}

interface FulfillmentCreateData {
    fulfillmentCreateV2?: {
        fulfillment: {
            id: string;
            status: string;
        } | null;
        userErrors: {
            field: string[];
            message: string;
        }[];
    } | null;
}

interface OrderCancelData {
    orderCancel?: {
        // The response structure might change if refund is boolean,
        // but we only care about userErrors for now.
        userErrors: {
            field: string[];
            message: string;
        }[];
    } | null;
}

export enum OrderCancelReason {
    CUSTOMER = "CUSTOMER",
    FRAUD = "FRAUD",
    INVENTORY = "INVENTORY",
    DECLINED = "DECLINED",
    OTHER = "OTHER",
}

export interface OrderStatusDetails {
    riskLevel: string | null;
    isCancelled: boolean;
    financialStatus: string | null; // "REFUNDED", "PARTIALLY_REFUNDED", "PAID", etc
}

interface OrderStatusDetailsResponse {
    order?: {
        id: string;
        riskLevel?: string | null;
        cancelledAt?: string | null;
        displayFinancialStatus?: string | null;
    };
    userErrors?: Array<{
        field: string[];
        message: string;
    }>;
}
// Module State
let shopifyInstance: Shopify | null = null;
let shopifySession: Session | null = null;
let graphqlClient: GraphqlClient | null = null;

export const initializeShopify = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (shopifyInstance && shopifySession && graphqlClient) {
            console.log(color("text", `🛍️ Shopify API client already initialized.`));
            resolve();
            return;
        }

        console.log(color("text", `🛍️ Initializing Shopify API client...`));

        const envVars: ShopifyEnvVars = {
            SHOPIFY_ADMIN_API_KEY: process.env.SHOPIFY_ADMIN_API_KEY!,
            SHOPIFY_ADMIN_API_SECRET: process.env.SHOPIFY_ADMIN_API_SECRET!,
            SHOPIFY_ADMIN_API_TOKEN: process.env.SHOPIFY_ADMIN_API_TOKEN!,
            SHOPIFY_STOREFRONT_TOKEN: process.env.SHOPIFY_STOREFRONT_TOKEN,
            SHOPIFY_URL: process.env.SHOPIFY_URL!,
        };

        const requiredVars: (keyof ShopifyEnvVars)[] = [
            'SHOPIFY_ADMIN_API_KEY',
            'SHOPIFY_ADMIN_API_SECRET',
            'SHOPIFY_ADMIN_API_TOKEN',
            'SHOPIFY_URL',
        ];

        const missingVars = requiredVars.filter(key => !envVars[key]);

        if (missingVars.length > 0) {
            const errorMsg = `🛍️ Missing required Shopify environment variables: ${missingVars.join(', ')}. Skipping initialization.`;
            console.error(color("error", errorMsg));
            reject(new Error(errorMsg));
            return;
        }

        try {
            shopifyInstance = shopifyApi({
                apiKey: envVars.SHOPIFY_ADMIN_API_KEY,
                apiSecretKey: envVars.SHOPIFY_ADMIN_API_SECRET,
                adminApiAccessToken: envVars.SHOPIFY_ADMIN_API_TOKEN,
                scopes: [
                    'read_products',
                    'write_checkouts',
                    'read_orders',
                    'write_orders',
                    'write_assigned_fulfillment_orders',
                    'read_assigned_fulfillment_orders',
                    'write_fulfillments',
                    'read_fulfillments',
                ],
                hostName: envVars.SHOPIFY_URL.replace(/^https?:\/\//, ''),
                hostScheme: "https",
                apiVersion: ApiVersion.April24,
                isEmbeddedApp: false,
                restResources,
                logger: {
                    level: LogSeverity.Info,
                    log: (severity, message) => console.log(`🛍️ [Shopify API ${LogSeverity[severity]}] ${message}`),
                },
            });

            shopifySession = new Session({
                id: `offline_${envVars.SHOPIFY_URL}`,
                shop: envVars.SHOPIFY_URL,
                state: ' N/A ',
                isOnline: false,
                accessToken: envVars.SHOPIFY_ADMIN_API_TOKEN,
            });

            graphqlClient = new shopifyInstance.clients.Graphql({ session: shopifySession });

            console.log(color("text", `🛍️ Shopify API client for shop ${color("variable", envVars.SHOPIFY_URL)} ${color("variable", "initialized successfully.")}`));
            resolve();

        } catch (error) {
            const errorMsg = `🛍️ Shopify API initialization failed: ${error instanceof Error ? error.message : String(error)}`;
            console.error(color("error", errorMsg));
            shopifyInstance = null;
            shopifySession = null;
            graphqlClient = null;
            reject(error);
        }
    });
};

const ensureInitialized = (): { client: GraphqlClient, session: Session, api: Shopify; } => {
    if (!graphqlClient || !shopifySession || !shopifyInstance) {
        throw new Error("Shopify client has not been initialized. Call initializeShopify() first.");
    }
    return { client: graphqlClient, session: shopifySession, api: shopifyInstance };
};

/**
 * Retrieves Fulfillment Order details (ID and line items) for a given Shopify Order ID.
 * @param orderId The numeric part of the Shopify Order ID.
 * @returns Promise<FulfillmentOrderDetails[]> An array of objects, each containing a FulfillmentOrder GID and its line items.
 */
export const getFulfillmentOrderDetails = async (orderId: string | number): Promise<FulfillmentOrderDetails[]> => {
    const { client } = ensureInitialized();
    const shopifyOrderId = `gid://shopify/Order/${orderId}`;

    const query = `
      query GetFulfillmentOrdersWithLineItems($orderId: ID!) {
        order(id: $orderId) {
          id
          fulfillmentOrders(first: 10) {
            edges {
              node {
                id # FulfillmentOrder GID
                lineItems(first: 100) {
                  edges {
                    node {
                      id
                      remainingQuantity
                    }
                  }
                }
              }
            }
          }
        }
      }`;

    try {
        console.log(color("text", `🛍️ Fetching fulfillment order details for Order ID: ${orderId}`));
        const response = await client.request<GetFulfillmentOrdersData>(query, {
            variables: { orderId: shopifyOrderId },
        });

        if (response.errors) {
            console.error(color("error", `🛍️ GraphQL Error fetching fulfillment orders for ${orderId}:`), response.errors);
            const errorMessage = response.errors.message || JSON.stringify(response.errors);
            throw new ShopifyError(`GraphQL Error: ${errorMessage}`);
        }


        const fulfillmentOrderEdges = response.data?.order?.fulfillmentOrders?.edges;

        if (!fulfillmentOrderEdges || fulfillmentOrderEdges.length === 0) {
            console.warn(color("text", `🛍️ No fulfillment orders found for Order ID: ${orderId}`));
            return [];
        }

        const details: FulfillmentOrderDetails[] = fulfillmentOrderEdges
            .map(edge => {
                const fulfillmentOrderNode = edge?.node;
                if (!fulfillmentOrderNode?.id) return null;

                const lineItems = fulfillmentOrderNode.lineItems?.edges
                    ?.map(lineItemEdge => lineItemEdge?.node)
                    .filter((item): item is FulfillmentOrderLineItem => !!item?.id && typeof item.remainingQuantity === 'number' && item.remainingQuantity > 0);

                if (lineItems && lineItems.length > 0) {
                    return {
                        fulfillmentOrderId: fulfillmentOrderNode.id,
                        // Map remainingQuantity from API to quantity in our internal structure
                        lineItems: lineItems.map(li => ({ id: li.id, quantity: li.remainingQuantity }))
                    };
                }
                // If a fulfillment order has no line items with remainingQuantity > 0, filter it out
                return null;
            })
            .filter((detail): detail is FulfillmentOrderDetails => detail !== null); // Remove null entries (including those with no fulfillable items)

        console.log(color("text", `🛍️ Found fulfillable order details for ${orderId}:`), details);
        return details;

    } catch (error) {
        console.error(color("error", `🛍️ Failed to get fulfillment order details for ${orderId}: ${error instanceof Error ? error.message : String(error)}`));
        if (error instanceof ShopifyError && error.message) {
            console.error(color("error", `🛍️ GraphQL Error from ShopifyError: ${error.message}`));
        }
        throw error; // Re-throw
    }
};


/**
 * Creates a fulfillment for specific line items within a Fulfillment Order.
 * NOTE: This function expects 'quantity' in the input 'fulfillmentDetails.lineItems',
 * which is mapped from 'remainingQuantity' by getFulfillmentOrderDetails.
 * @param fulfillmentDetails The details of the fulfillment order, including its GID and the line items to fulfill.
 * @returns Promise<boolean> True if the fulfillment was created successfully (status "SUCCESS"), false otherwise.
 */
export const fulfillOrderLineItems = async (fulfillmentDetails: FulfillmentOrderDetails): Promise<boolean> => {
    const { client } = ensureInitialized();
    const { fulfillmentOrderId, lineItems } = fulfillmentDetails;

    if (!fulfillmentOrderId || !fulfillmentOrderId.startsWith('gid://shopify/FulfillmentOrder/')) {
        console.error(color("error", `🛍️ Invalid Fulfillment Order ID format: ${fulfillmentOrderId}`));
        throw new Error(`Invalid Fulfillment Order ID format provided.`);
    }
    if (!lineItems || lineItems.length === 0) {
        console.error(color("error", `🛍️ No line items provided (or remaining) to fulfill for Fulfillment Order ID: ${fulfillmentOrderId}`));
        return false; // Cannot fulfill without line items
    }


    const fulfillmentOrderLineItems = lineItems.map(item => ({
        id: item.id,
        quantity: item.quantity, // This now correctly represents the remaining quantity
    }));

    const mutation = `
      mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
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
      }`;

    try {
        console.log(color("text", `🛍️ Attempting to fulfill ${lineItems.length} line item(s) for FulfillmentOrder ID: ${fulfillmentOrderId} with quantities: ${JSON.stringify(fulfillmentOrderLineItems)}`)); // Added quantities to log
        const response = await client.request<FulfillmentCreateData>(mutation, {
            variables: {
                fulfillment: {
                    lineItemsByFulfillmentOrder: [{
                        fulfillmentOrderId: fulfillmentOrderId,
                        fulfillmentOrderLineItems: fulfillmentOrderLineItems,
                    }],
                    // Optional: trackingInfo, notifyCustomer
                },
            },
        });

        console.log("🛍️ Fulfillment Response:", JSON.stringify(response, null, 2));

        if (response.errors) {
            console.error(color("error", `🛍️ GraphQL Error during fulfillment for ${fulfillmentOrderId}:`), response.errors);
            const errorMessage = response.errors.message || JSON.stringify(response.errors);
            throw new ShopifyError(`GraphQL Error: ${errorMessage}`);
        }

        const userErrors = response.data?.fulfillmentCreateV2?.userErrors;
        if (userErrors && userErrors.length > 0) {
            console.error(color("error", `🛍️ UserErrors during fulfillment for ${fulfillmentOrderId}:`), userErrors.map(e => `${e.field.join('.')}: ${e.message}`).join('; '));
            return false; // Return false on user errors
        }


        // Check if fulfillment object exists
        if (!response.data?.fulfillmentCreateV2?.fulfillment) {
            console.error(color("error", `🛍️ Fulfillment creation for ${fulfillmentOrderId} did not return a fulfillment object. Check response body and Shopify Admin.`));
            return false; // Return false if fulfillment object is missing
        }

        const fulfillmentStatus = response.data.fulfillmentCreateV2.fulfillment.status;
        const success = fulfillmentStatus === 'SUCCESS';

        if (success) {
            console.log(color("text", `🛍️ Successfully fulfilled line items for FulfillmentOrder ID: ${fulfillmentOrderId}. Status: ${fulfillmentStatus}`));
        } else {
            console.warn(color("text", `🛍️ Fulfillment status for ${fulfillmentOrderId} was not SUCCESS: ${fulfillmentStatus ?? 'N/A'}`)); // Use warn color
        }

        return success; // Return true only if status is SUCCESS

    } catch (error) {
        console.error(color("error", `🛍️ Failed to create fulfillment for ${fulfillmentOrderId}: ${error instanceof Error ? error.message : String(error)}`));
        if (error instanceof ShopifyError && error.message) {
            console.error(color("error", `🛍️ GraphQL Error from ShopifyError: ${error.message}`));
        }
        return false;
    }
};

/**
 * Cancels a Shopify order with a staff note, always using 'OTHER' reason and attempting a refund.
 * @param orderId The numeric part of the Shopify Order ID.
 * @param staffNote A note to add to the order cancellation for internal reference.
 * @param notifyCustomer Whether to send a notification email to the customer (defaults to false).
 * @param restock Whether to restock the items (defaults to false).
 * @returns Promise<boolean> True if the order was cancelled successfully, false otherwise.
 */
export const cancelOrder = async (
    orderId: string | number,
    staffNote: string,
    notifyCustomer: boolean = false,
    restock: boolean = false
): Promise<boolean> => {
    const { client, api } = ensureInitialized();
    const shopifyOrderId = `gid://shopify/Order/${orderId}`;

    const mutation = `
      mutation orderCancel(
          $orderId: ID!,
          # $reason is removed, hardcoded below
          $notifyCustomer: Boolean,
          $restock: Boolean!,
          $refund: Boolean!,
          $staffNote: String
        ) {
        orderCancel(
            orderId: $orderId,
            reason: OTHER,         # Hardcoded reason
            notifyCustomer: $notifyCustomer,
            restock: $restock,
            refund: $refund,
            staffNote: $staffNote  # Pass staffNote variable
        ) {
          userErrors {
            field
            message
          }
        }
      }`;

    // Always refund - I did not find a reason to not refund? So I'll just hardcode it to true. Change if needed
    const refundValue: boolean = true;

    try {
        console.log(color("text", `🛍️ Attempting to cancel Order ID: ${orderId} using API version: ${api.config.apiVersion}`));
        console.log(color("text", `   Reason: OTHER (hardcoded), Notify: ${notifyCustomer}, Restock: ${restock}`));
        console.log(color("text", `   Refund: ${refundValue}, Staff Note: "${staffNote}"`)); // Log staff note

        const response = await client.request<OrderCancelData>(mutation, {
            variables: {
                orderId: shopifyOrderId,
                notifyCustomer: notifyCustomer,
                restock: restock,
                refund: refundValue,
                staffNote: staffNote,
            },
        });

        console.log("🛍️ Raw Order Cancel Response:", JSON.stringify(response, null, 2));

        if (response.errors) {
            console.error(color("error", `🛍️ GraphQL Errors returned in response for ${orderId}:`), JSON.stringify(response.errors, null, 2));
        }

        const userErrors = response.data?.orderCancel?.userErrors;
        if (userErrors && userErrors.length > 0) {
            if (userErrors.some(e => e.message == "Cannot cancel an order that has already been canceled")) {
                return true; // If the order is already cancelled, we consider it a success
            }
            console.error(color("error", `🛍️ UserErrors during order cancellation for ${orderId}:`), userErrors.map(e => `${e.field?.join('.') || 'general'}: ${e.message}`).join('; '));
            return false;
        }

        if (!response.errors && (!userErrors || userErrors.length === 0)) {
            console.log(color("text", `🛍️ Successfully requested cancellation for Order ID: ${orderId}. Check Shopify Admin to confirm status.`));
            return true;
        } else {
            console.warn(color("warn", `🛍️ Cancellation request for ${orderId} completed but contained GraphQL or User errors. See logs above.`));
            return false;
        }

    } catch (error) {
        console.error(color("error", `--- ERROR during cancelOrder for Order ID: ${orderId} ---`));
        if (error instanceof ShopifyError) {
            console.error(color("error", `Type: ShopifyError`));
            console.error(color("error", `Message: ${error.message}`));
            if (error.message) {
                console.error(color("error", `Error message: ${JSON.stringify(error.message, null, 2)}`));
            }
            if (error.cause) {
                console.error(color("error", `Error cause: ${JSON.stringify(error.cause, null, 2)}`));
            }
            if (error.stack) {
                console.error(color("error", `Stack Trace:\n${error.stack}`));
            }
        } else if (error instanceof Error) {
            console.error(color("error", `Type: Generic Error`));
            console.error(color("error", `Message: ${error.message}`));
            if (error.stack) {
                console.error(color("error", `Stack Trace:\n${error.stack}`));
            }
        } else {
            console.error(color("error", `Type: Unknown`));
            console.error(color("error", `Caught Object: ${JSON.stringify(error)}`));
        }
        console.error(color("error", `--- End Error Details for Order ID: ${orderId} ---`));
        return false;
    }
};

/**
 * Retrieves the overall risk level, cancellation status, and financial status for a given Shopify Order ID.
 * @param orderId The numeric part of the Shopify Order ID.
 * @returns Promise<OrderStatusDetails | null> An object containing the riskLevel, isCancelled, and financialStatus,
 * or null if the order is not found or an error occurs.
 */
export const getOrderStatusDetails = async (orderId: string | number): Promise<OrderStatusDetails | null> => {
    const { client, api } = ensureInitialized();
    const shopifyOrderId = `gid://shopify/Order/${orderId}`;

    const query = `
      query GetOrderStatusDetails($orderId: ID!) {
        order(id: $orderId) {
          id
          riskLevel
          cancelledAt
          displayFinancialStatus # User-friendly financial status
        }
      }`;

    try {
        console.log(color("text", `🛍️ Fetching order status details for Order ID: ${orderId}`));
        const response = await client.request<OrderStatusDetailsResponse>(query, {
            variables: { orderId: shopifyOrderId },
        });

        if (response.errors) {
            console.error(color("error", `🛍️ GraphQL Error fetching order status details for Order ID ${orderId}:`), response.errors);
            const errorMessage = response.errors.message || JSON.stringify(response.errors);
            throw new ShopifyError(`GraphQL Error: ${errorMessage}`);
        }

        if (response.data?.userErrors && response.data.userErrors.length > 0) {
            console.error(color("error", `🛍️ UserErrors fetching order status details for Order ID ${orderId}:`), response.data.userErrors);
            return null;
        }

        if (!response.data?.order) {
            console.warn(color("warn", `🛍️ No order found with ID: ${orderId} when fetching status details.`));
            return null;
        }

        const orderData = response.data.order;
        const overallRiskLevel = orderData.riskLevel ?? null;
        const isCancelled = !!orderData.cancelledAt;
        const financialStatus = orderData.displayFinancialStatus ?? null;

        console.log(color("text", `🛍️ Successfully fetched status for Order ID: ${orderId}. Risk: ${overallRiskLevel}, Cancelled: ${isCancelled}, Financial: ${financialStatus}`));

        return {
            riskLevel: overallRiskLevel,
            isCancelled: isCancelled,
            financialStatus: financialStatus,
        };
    } catch (error) {
        console.error(color("error", `🛍️ Failed to get order status details for Order ID ${orderId}: ${error instanceof Error ? error.message : String(error)}`));
        if (error instanceof ShopifyError && error.message) {
            console.error(color("error", `🛍️ ShopifyError details: ${error.message}`));
        }
        throw error;
    }
};