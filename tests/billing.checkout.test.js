import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stubGateway } from './gateway.js';

/**
 * The Razorpay checkout controller.
 *
 * Pins down the one contract pages rely on: startCheckout emits exactly one
 * terminal outcome per attempt — CHECKOUT_SUCCESS only after the backend has
 * verified the handler's signature, CHECKOUT_DISMISSED when the modal is
 * closed, CHECKOUT_FAILURE otherwise — and a failed attempt inside the modal
 * is flagged recoverable (the modal stays open for a retry).
 */

let verifyBody = null;
let verifyOk = true;
vi.mock('src/shared/gateway/apiGateway.js', () =>
  stubGateway({
    'POST /subscriptions': {
      success: true,
      data: {
        keyId: 'rzp_test_x',
        subscriptionId: 'sub_1',
        currency: 'INR',
        amount: 2499,
        trial: true,
        prefill: { name: 'A', email: 'a@x.com' },
      },
    },
    'POST /subscriptions/verify': (_url, body) => {
      verifyBody = body;
      return verifyOk
        ? { success: true, data: { status: 'active', trialing: true, razorpayStatus: 'authenticated' } }
        : { success: false, message: 'Payment could not be verified' };
    },
    'POST /subscriptions/cancel': {
      success: true,
      data: { status: 'active', cancelled: true, accessUntil: '2026-10-03T00:00:00.000Z' },
    },
  })
);

const { default: controller } = await import('src/core/billing/controller/subscriptions.js');
const { SUBSCRIPTION_EVENTS: E } = await import('src/core/billing/constants/constants.js');
const { default: EventEmitter } = await import('src/shared/utils/EventEmitter.js');

let lastModal;
class FakeRazorpay {
  constructor(options) {
    this.options = options;
    this.handlers = {};
    lastModal = this;
  }
  on(evt, fn) {
    this.handlers[evt] = fn;
  }
  open() {
    this.opened = true;
  }
}

function collect(emitter) {
  const seen = [];
  Object.values(E).forEach((name) => emitter.on(name, (payload) => seen.push([name, payload])));
  return seen;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  window.Razorpay = FakeRazorpay;
  lastModal = null;
  verifyBody = null;
  verifyOk = true;
});

describe('startCheckout', () => {
  it('opens Razorpay in subscription mode with the backend key — never a hardcoded one', async () => {
    const em = new EventEmitter();
    collect(em);
    await controller.startCheckout(em, { description: '7-day free trial' });
    expect(lastModal.opened).toBe(true);
    expect(lastModal.options).toMatchObject({
      key: 'rzp_test_x',
      subscription_id: 'sub_1',
      description: '7-day free trial',
    });
    expect(lastModal.options.order_id).toBeUndefined();
  });

  it('emits SUCCESS only after the backend verifies the handler payload', async () => {
    const em = new EventEmitter();
    const seen = collect(em);
    await controller.startCheckout(em);
    expect(seen).toEqual([]);

    await lastModal.options.handler({
      razorpay_payment_id: 'pay_1',
      razorpay_subscription_id: 'sub_1',
      razorpay_signature: 'sig',
    });
    await flush();

    expect(verifyBody).toEqual({
      razorpay_payment_id: 'pay_1',
      razorpay_subscription_id: 'sub_1',
      razorpay_signature: 'sig',
    });
    expect(seen.map(([n]) => n)).toEqual([E.CHECKOUT_SUCCESS]);
    expect(seen[0][1].isActive()).toBe(true);
  });

  it('a verify rejection is a FAILURE, not a success', async () => {
    verifyOk = false;
    const em = new EventEmitter();
    const seen = collect(em);
    await controller.startCheckout(em);
    await lastModal.options.handler({ razorpay_payment_id: 'p', razorpay_subscription_id: 'sub_1', razorpay_signature: 'bad' });
    await flush();
    expect(seen.map(([n]) => n)).toEqual([E.CHECKOUT_FAILURE]);
  });

  it('closing the modal is DISMISSED, not an error', async () => {
    const em = new EventEmitter();
    const seen = collect(em);
    await controller.startCheckout(em);
    lastModal.options.modal.ondismiss();
    expect(seen.map(([n]) => n)).toEqual([E.CHECKOUT_DISMISSED]);
  });

  it('a failed payment inside the modal is reported as recoverable', async () => {
    const em = new EventEmitter();
    const seen = collect(em);
    await controller.startCheckout(em);
    lastModal.handlers['payment.failed']({ error: { description: 'Card declined' } });
    expect(seen).toEqual([[E.CHECKOUT_FAILURE, { message: 'Card declined', recoverable: true }]]);
  });
});

describe('cancelSubscription', () => {
  it('returns the summary with access-until for the confirmation toast', async () => {
    const em = new EventEmitter();
    const seen = collect(em);
    await controller.cancelSubscription(em);
    expect(seen[0][0]).toBe(E.CANCEL_SUCCESS);
    expect(seen[0][1]).toMatchObject({ cancelled: true, accessUntil: '2026-10-03T00:00:00.000Z' });
    expect(seen[0][1].canCancel()).toBe(false);
  });
});
