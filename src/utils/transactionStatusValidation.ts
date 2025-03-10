import { TransactionStatus, Transaction } from '../schemas.js';
import { setup, createActor } from 'xstate';

type TransactionEvent = 'START_PENDING' | 'START_SETTLED' | 'SETTLE' | 'DECLINE' | 'CANCEL' | 'RETURN';

export const transactionStateMachine = setup({
    types: {
        events: {} as { type: TransactionEvent }
    },
}).createMachine({
    id: "transaction",
    type: "parallel",
    states: {
        transactionFlow: {
            initial: "uninitialized",
            states: {
                uninitialized: {
                    on: {
                        START_PENDING: {
                            target: "PENDING",
                        },
                        START_SETTLED: {
                            target: "SETTLED",
                        },
                    },
                },
                PENDING: {
                    on: {
                        SETTLE: {
                            target: "SETTLED",
                        },
                        DECLINE: {
                            target: "DECLINED",
                        },
                        CANCEL: {
                            target: "CANCELED",
                        },
                    },
                },
                SETTLED: {
                    on: {
                        RETURN: {
                            target: "RETURNED",
                        },
                    },
                },
                DECLINED: {
                    type: "final",
                },
                CANCELED: {
                    type: "final",
                },
                RETURNED: {
                    type: "final",
                },
            },
        },
    },
});

function getEventForTargetStatus(targetStatus: TransactionStatus, isFirstEvent: boolean): TransactionEvent {
    if (isFirstEvent && targetStatus == 'SETTLED') return 'START_SETTLED';

    const eventMap: Record<TransactionStatus, TransactionEvent> = {
        'PENDING': 'START_PENDING',
        'SETTLED': 'SETTLE',
        'RETURNED': 'RETURN',
        'DECLINED': 'DECLINE',
        'CANCELED': 'CANCEL'
    };

    return eventMap[targetStatus];
}

export function validateTransactionStatusTransition(transactions: Transaction[]): boolean {
    if (transactions.length === 0) return true;

    const actor = createActor(transactionStateMachine);
    actor.start();

    const passed = transactions.every((tx, index) => {
        const event = getEventForTargetStatus(tx.transactionStatus, index == 0);
        actor.send({ type: event });
        const nextState = actor.getSnapshot();
        const expectedNextState = tx.transactionStatus;

        // If the state didn't change, this was an invalid transition
        return nextState.value.transactionFlow === expectedNextState;
    });

    // SETTLED is weird because it can be both terminal and non terminal
    // XState doesn't seem to support this so we can get around it by not
    // specifying it as terminal in our state machine but manually adding it
    // to the list of supported final states at the end
    const finalStatus = transactions[transactions.length - 1].transactionStatus;
    const validFinalStates: TransactionStatus[] = ['SETTLED', 'RETURNED', 'DECLINED', 'CANCELED'];

    return passed && validFinalStates.includes(finalStatus);
}
