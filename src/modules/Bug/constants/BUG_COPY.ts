/** The bug the mock run always finds, until a real agent reports one. */
export const BUG_COPY = {
  web: {
    severity: 'high',
    title: 'Checkout accepts an address with no house number',
    body: 'The number field is marked required but nothing checks it. Leave it empty, hit continue, and checkout moves straight to payment. The order goes through with an address the courier cannot use.',
    got: 'The payment step opened with the number field empty.',
    observed: 'No inline error, no toast, nothing in the console.',
  },
  mobile: {
    severity: 'high',
    title: 'The order screen never leaves "Waiting for payment"',
    body: 'The payment comes back in under a minute, but the order screen keeps showing "Waiting for payment" until you pull it down. Anyone who pays and waits thinks the payment failed.',
    got: 'Still "Waiting for payment" after 90 s. A pull to refresh fixes it.',
    observed:
      'The confirmation landed at 00:38. The screen only caught up after I pulled it down by hand.',
  },
} as const;
