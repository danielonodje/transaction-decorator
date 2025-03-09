import { test, expect, describe, beforeAll, afterAll } from 'vitest';

describe.skip('Customer Transactions API', () =>  {
    test('connected transactions should be aggregrated into one timeline', () => {});
    test('when connected transactions are aggregated they must not remain as separate transaction', () => {});
    test('the transaction id of the first transaction in the timeline should be used', () => {});
    test('the final status of the last transaction in the timeline should be used', () => {});
    test('the createdAt and updatedAt statuses should reflect the first and last transactions in the timeline respectively', () => {});
    // need to think about ordering problems and the guarantees we get from the API
    // what do the dates represent?
    // if we expect that dates correctly represent the ordering of the transactions
    // then we must conclude that an invalid timeline implies an invalid order
    // if we instead think that the dates might be added on by another service
    // then the ordering could be originally correct but tampered with in communication to us
    // or may come from a system that doesn't guarantee correct ordering
    // thus we should rely only on the fact that the valid start and end states exists and
    // that no states that must exist in between are missing
    // for the purpose of this test, I will trust the dates and expect ordering
    // but alternate solutions could be found if this is not the case
    test('invalid transaction transitions should be recognised as invalid transactions', () => {});
    test('for P2P transactions, the sent and received amount must match', () => {});
    test('for P2P transactions, the authorization code must match', () => {})
    test('for P2P transactions, the sent and received transactions must exist', () => {})
    test('for transactions with fees, the recieved or sent amount must be congruent with the fee', () => {})
    test('for transactions with fees, a related transaction that is not a fee transaction must exist', () => {})
    test('correctly enumerate all connected consumers', () => {})
    test('correctly specify connection relation type relation types all connected consumers', () => {})
    test('allow relation to a customer multiple times only if the relation type is different', () => {})
});