export const CHAT = {
  replyDelayMs: 1100,
  suggestions: [
    {
      labelKey: 'CHAT.SUGGESTION_CHECKOUT',
      text: 'Test the whole checkout: a card payment, an invalid coupon and the order history.',
    },
    {
      labelKey: 'CHAT.SUGGESTION_SIGN_UP',
      text: 'Cover sign up and the first purchase on a clean install.',
    },
  ],
} as const;
