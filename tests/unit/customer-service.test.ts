import { describe, it, expect, beforeEach, vi } from "vitest";
import { CustomerService } from "../../src/plugins/customerService.js";
import { Transaction, TransactionChain } from "../../src/schemas.js";
import { FastifyBaseLogger } from "fastify";

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as FastifyBaseLogger;

describe("CustomerService", () => {
  let transactions: Transaction[];
  let customerService: CustomerService;

  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test

    transactions = [
      {
        transactionId: 1,
        customerId: 101,
        transactionType: "P2P_SEND",
        description: 'Test description',
        transactionStatus: "SETTLED",
        transactionDate: "2024-03-01T12:00:00Z",
        amount: 100,
        authorizationCode: "AUTH123",
        metadata: { relatedTransactionId: 3, deviceId: "DEVICE_A" },
      },
      {
        transactionId: 2,
        customerId: 101,
        transactionType: 'POS',
        description: 'Test description',
        transactionStatus: "SETTLED",
        transactionDate: "2024-03-01T12:00:00Z",
        amount: 100,
        authorizationCode: "AUTH456",
        metadata: { deviceId: "DEVICE_C" },
      },
      {
        transactionId: 3,
        customerId: 102,
        transactionType: "P2P_RECEIVE",
        description: 'Test description',
        transactionStatus: "SETTLED",
        transactionDate: "2024-03-01T12:01:00Z",
        amount: 100,
        authorizationCode: "AUTH123",
        metadata: { relatedTransactionId: 1, deviceId: "DEVICE_A" },
      },
      {
        transactionId: 4,
        customerId: 102,
        transactionType: "FEE",
        description: 'Test description',
        transactionStatus: "SETTLED",
        transactionDate: "2024-03-01T12:01:00Z",
        amount: 100,
        authorizationCode: "AUTH123",
        metadata: { relatedTransactionId: 2 },
      },
      {
        transactionId: 5,
        customerId: 103,
        description: 'Test description',
        transactionType: 'WIRE_OUTGOING',
        transactionStatus: "PENDING",
        transactionDate: "2024-03-02T15:00:00Z",
        amount: 50,
        authorizationCode: "AUTH456",
        metadata: { deviceId: "DEVICE_B" },
      },
      {
        transactionId: 6,
        customerId: 104,
        description: 'Test description',
        transactionType: 'WIRE_OUTGOING',
        transactionStatus: "PENDING",
        transactionDate: "2024-03-02T15:10:00Z",
        amount: 30,
        authorizationCode: "AUTH789",
        metadata: { deviceId: "DEVICE_B" },
      },
    ];

    customerService = new CustomerService(transactions, mockLogger);
  });

  it("should correctly build customer transactions", () => {
    const result = customerService.getCustomerTransactions(101);
    expect(result.transactions).toHaveLength(2);

    const transactionChain1: TransactionChain = result.transactions[0];
    expect(transactionChain1.transactionId).toBe(1);
    expect(transactionChain1.authorizationCode).toBe("AUTH123");
    expect(transactionChain1.status).toBe("SETTLED");
    expect(transactionChain1.timeline).toHaveLength(1);

    const transactionChain2: TransactionChain = result.transactions[1];
    expect(transactionChain2.transactionId).toBe(2);
    expect(transactionChain2.authorizationCode).toBe("AUTH456");
    expect(transactionChain2.status).toBe("SETTLED");
    expect(transactionChain2.timeline).toHaveLength(2);
  });

  it.each([
    [101, 102, 2, ['P2P_SEND', 'DEVICE']],
    [102, 101, 2, ['P2P_RECEIVE', 'DEVICE']],
    [103, 104, 1, ['DEVICE']],
    [104, 103, 1, ['DEVICE']]
  ])('should correctly build customer relationships', (customerId, relatedCustomerId, relationCount, relationTypes) => {
    const result = customerService.getCustomerRelationships(customerId);
    expect(result.relatedCustomers).toHaveLength(relationCount);
    relationTypes.forEach((type, i) => {
        expect(result.relatedCustomers[i].relationType).toBe(type);
        expect(result.relatedCustomers[i].relatedCustomerId).toBe(relatedCustomerId);
    })
  });

  it("should correctly create device-based relationships", () => {
    const relationships103 = customerService.getCustomerRelationships(103).relatedCustomers;
    const relationships104 = customerService.getCustomerRelationships(104).relatedCustomers;

    expect(relationships103).toHaveLength(1);
    expect(relationships104).toHaveLength(1);

    expect(relationships103[0].relatedCustomerId).toBe(104);
    expect(relationships103[0].relationType).toBe("DEVICE");
    expect(relationships104[0].relatedCustomerId).toBe(103);
    expect(relationships104[0].relationType).toBe("DEVICE");
  });

  it("should return empty relationships if no transactions match", () => {
    const result = customerService.getCustomerRelationships(999);
    expect(result.relatedCustomers).toEqual([]);
  });

  it("should return empty transactions if no transactions exist for the customer", () => {
    const result = customerService.getCustomerTransactions(999);
    expect(result.transactions).toEqual([]);
  });
});
