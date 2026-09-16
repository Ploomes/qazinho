import type { ITestCase } from '@/modules/Plan/types';

type PlanDraft = Omit<ITestCase, 'id' | 'lastVerdict'>;

/** What the agent drafts when the QA says what to cover. Placeholder until an agent answers. */
export const PLANS: Record<'web' | 'mobile', PlanDraft[]> = {
  web: [
    {
      title: 'Open the store and find a product',
      priority: 'P1',
      goal: 'The site loads and search returns something you can buy.',
      preconditions: 'The URL answers and the cart is empty.',
      steps: [
        { action: 'Open the target URL', expected: 'The home page loads' },
        { action: 'Search for a product', expected: 'At least one result comes back' },
        {
          action: 'Open the first result',
          expected: 'The page shows a price and a buy button',
        },
      ],
    },
    {
      title: 'Checkout with a test card',
      priority: 'P1',
      goal: 'A card order goes through and comes back with an order number.',
      preconditions: 'One product in the cart.',
      steps: [
        { action: 'Add the product to the cart', expected: 'The cart badge reads 1' },
        {
          action: 'Go to checkout and fill the address',
          expected: 'The address is accepted',
        },
        {
          action: 'Leave the house number empty and continue',
          expected: 'An inline error asks for the number',
        },
        {
          action: 'Pay with the test card',
          expected: 'A confirmation with an order number',
        },
      ],
    },
    {
      title: 'An invalid coupon is refused',
      priority: 'P2',
      goal: 'An expired coupon is refused and the total does not move.',
      preconditions: 'A cart with something in it.',
      steps: [
        { action: 'Open the coupon field', expected: 'The field takes input' },
        {
          action: 'Apply an expired coupon',
          expected: 'An error says the coupon is not valid',
        },
        { action: 'Read the total', expected: 'The total did not change' },
      ],
    },
    {
      title: 'The order shows up in the history',
      priority: 'P2',
      goal: 'A finished order is listed with the right total.',
      preconditions: 'An order placed earlier in the run.',
      steps: [
        { action: 'Open the orders page', expected: 'The list loads' },
        {
          action: 'Open the newest order',
          expected: 'Items and total match the checkout',
        },
        { action: 'Read the status', expected: 'It reads Paid' },
      ],
    },
  ],
  mobile: [
    {
      title: 'First run and sign up',
      priority: 'P1',
      goal: 'A clean install gets through sign up.',
      preconditions: 'The build is installed and no account is signed in.',
      steps: [
        { action: 'Open the app', expected: 'The welcome screen is shown' },
        { action: 'Tap Create account', expected: 'The phone number field is shown' },
        {
          action: 'Type the test number and continue',
          expected: 'The code screen is shown',
        },
      ],
    },
    {
      title: 'Pay and wait for the confirmation',
      priority: 'P1',
      goal: 'A payment is confirmed on screen without the user poking it.',
      preconditions: 'Signed in, one item in the cart.',
      steps: [
        { action: 'Add an item to the cart', expected: 'The cart shows one item' },
        {
          action: 'Go to payment and pay in the sandbox',
          expected: 'The payment is accepted',
        },
        {
          action: 'Wait up to 60 s on the order screen',
          expected: 'The order moves to Paid within 60 s',
        },
        { action: 'Read the receipt', expected: 'The receipt matches the cart' },
      ],
    },
    {
      title: 'The cart survives a restart',
      priority: 'P2',
      goal: 'Killing the app does not empty the cart.',
      preconditions: 'One item in the cart.',
      steps: [
        { action: 'Kill the app from the recents', expected: 'The app closes' },
        { action: 'Open it again', expected: 'The home screen is shown' },
        { action: 'Open the cart', expected: 'The item is still there' },
      ],
    },
    {
      title: 'A push opens the right order',
      priority: 'P3',
      goal: 'Tapping a push lands on the order it is about.',
      preconditions: 'An order placed earlier in the run.',
      steps: [
        {
          action: 'Send the order push from the sandbox',
          expected: 'The notification arrives',
        },
        { action: 'Tap it', expected: 'The app opens' },
        { action: 'Read the screen', expected: 'It is the order from the push' },
      ],
    },
  ],
};
