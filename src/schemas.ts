import { z } from 'zod';

export const TransactionStatusSchema = z.enum(['PENDING', 'SETTLED', 'RETURNED', 'DECLINED', 'CANCELED']);

export const TransactionTypeSchema = z.enum(['ACH_INCOMING', 'POS', 'WIRE_OUTGOING', 'FEE', 'WIRE_INCOMING', 'P2P_SEND', 'P2P_RECEIVE']);

export const TransactionMetadataSchema = z.object({
    relatedTransactionId: z.number().optional(),
    deviceId: z.string().optional(),
});

export const TransactionSchema = z.object({
    transactionId: z.number(),
    authorizationCode: z.string(),
    transactionDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date, must be ISO 8601",
    }),
    customerId: z.number(),
    transactionType: TransactionTypeSchema,
    transactionStatus: TransactionStatusSchema,
    description: z.string(),
    amount: z.number(),
    metadata: TransactionMetadataSchema
});

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type TransactionMetadata = z.infer<typeof TransactionMetadataSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;