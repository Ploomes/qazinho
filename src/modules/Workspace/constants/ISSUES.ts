import type { IIssue } from '@/modules/Workspace/types';

/** Stands in for the issue tracker until the 0.2 integration lands. */
export const ISSUES: IIssue[] = [
  {
    key: '#128',
    title: 'Checkout lets an address through with no house number',
    source: 'github',
  },
  {
    key: '#131',
    title: 'Cart is empty after the app is killed and reopened',
    source: 'github',
  },
  { key: '#134', title: 'Order screen stuck on "Waiting for payment"', source: 'github' },
  { key: 'QA-212', title: 'Regression pack for the new checkout', source: 'jira' },
  { key: 'QA-218', title: 'Coupon rules on renewal orders', source: 'jira' },
  { key: 'QA-225', title: 'Sign up on a clean install', source: 'jira' },
];
