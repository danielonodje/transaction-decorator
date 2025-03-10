import { z } from 'zod';

export const TransactionStatusSchema = z.enum(['PENDING', 'SETTLED', 'RETURNED', 'DECLINED', 'CANCELED']);

export const TransactionTypeSchema = z.enum(['ACH_INCOMING', 'POS', 'WIRE_OUTGOING', 'FEE', 'WIRE_INCOMING', 'P2P_SEND', 'P2P_RECEIVE']);

export const CustomerRelationshipTypeSchema = z.enum(['P2P_SEND', 'P2P_RECEIVE', 'DEVICE']);

export const TransactionMetadataSchema = z.object({
    relatedTransactionId: z.number().optional(),
    deviceId: z.string().optional(),
});

const TransactionDateSchema = z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date, must be ISO 8601",
});

export const TransactionSchema = z.object({
    transactionId: z.number(),
    authorizationCode: z.string(),
    transactionDate: TransactionDateSchema,
    customerId: z.number(),
    transactionType: TransactionTypeSchema,
    transactionStatus: TransactionStatusSchema,
    description: z.string(),
    amount: z.number(),
    metadata: TransactionMetadataSchema
});

export const TransactionTimelineEntrySchema = z.object({
    createdAt: TransactionDateSchema,
    status: TransactionStatusSchema,
    amount: z.number(),
})

export const TransactionChainSchema = z.object({
    createdAt: TransactionDateSchema,
    updatedAt: TransactionDateSchema,
    transactionId: z.number(),
    authorizationCode: z.string(),
    status: TransactionStatusSchema,
    description: z.string(),
    transactionType: TransactionTypeSchema,
    metadata: TransactionMetadataSchema,
    timeline: z.array(TransactionTimelineEntrySchema)
});

export const CustomerRelationshipSchema = z.object({
    relatedCustomerId: z.number(),
    relationType: CustomerRelationshipTypeSchema
})

// Ideally you'd generate these from the zod schema
// but I couldn't get zod and fastify's JSON schema to
// play nice so I have to duplicate it here.
// They're close in proximity to make it easy to change 
// both simultaneously
export const TransactionChainJsonSchema = {
    type: 'object',
    properties: {
        transactions: {
            type: "array",
            items: {
                type: 'object',
                properties: {
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    transactionId: { type: "integer" },
                    authorizationCode: { type: "string" },
                    status: { type: "string", enum: ["PENDING", "SETTLED", "RETURNED", "DECLINED", "CANCELED"] },
                    metadata: {
                        type: "object",
                        properties: {
                            relatedTransactionId: { type: "integer" },
                            deviceId: { type: "string" }
                        },
                        additionalProperties: false
                    },
                    timeline: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                createdAt: { type: "string", format: "date-time" },
                                status: { type: "string", enum: ["PENDING", "SETTLED", "RETURNED", "DECLINED", "CANCELED"] },
                                amount: { type: "number" }
                            },
                            required: ["createdAt", "status", "amount"],
                            additionalProperties: false
                        }
                    }
                },
                required: ["createdAt", "updatedAt", "transactionId", "authorizationCode", "status", "timeline"],
                additionalProperties: false
            }
        }
    },
    required: ['transactions']
}

export const CustomerRelationshipJsonSchema = {
    type: 'object',
    properties: {
        relatedCustomers: {
            type: "array",
            items: {
                type: 'object',
                properties: {
                    relatedCustomerId: { type: "integer" },
                    relationType: { type: "string", enum: ["P2P_SEND", "P2P_RECEIVE", "DEVICE"] }
                },
                required: ["relatedCustomerId", "relationType"],
                additionalProperties: false
            }
        }
    },
    required: ['relatedCustomers']
}

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type TransactionMetadata = z.infer<typeof TransactionMetadataSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionTimeLineEntry = z.infer<typeof TransactionTimelineEntrySchema>;
export type TransactionChain = z.infer<typeof TransactionChainSchema>;
export type TransactionCustomerRelationshipType = z.infer<typeof CustomerRelationshipTypeSchema>;
export type TransactionCustomerRelationship = z.infer<typeof CustomerRelationshipSchema>;

export type CustomerTransactions = { transactions: Readonly<TransactionChain[]> }
export type CustomerRelationships = { relatedCustomers: Readonly<TransactionCustomerRelationship[]> }