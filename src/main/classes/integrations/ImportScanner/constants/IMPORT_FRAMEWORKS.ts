import type { IImportFrameworkRule } from '@/main/classes/integrations/ImportScanner/types';

export const IMPORT_FRAMEWORKS: IImportFrameworkRule[] = [
  {
    id: 'cypress',
    config: /(^|\/)cypress\.config\.[cm]?[jt]s$|(^|\/)cypress\.json$/,
    packages: ['"cypress"'],
    tests: /\.cy\.[cm]?[jt]sx?$|(^|\/)cypress\/e2e\/.*\.[cm]?[jt]sx?$/,
  },
  {
    id: 'detox',
    config: /(^|\/)\.detoxrc(\.[cm]?[jt]s|\.json)?$|(^|\/)detox\.config\.[cm]?[jt]s$/,
    packages: ['"detox"'],
    tests: /(^|\/)e2e\/.*\.(test|spec|e2e)\.[cm]?[jt]sx?$/,
  },
  {
    id: 'webdriverio',
    config: /(^|\/)wdio\.[^/]*\.[cm]?[jt]s$/,
    packages: ['"webdriverio"', '"@wdio/cli"'],
    tests: /(^|\/)(test|tests)\/specs?\/.*\.[cm]?[jt]sx?$|\.e2e\.[cm]?[jt]sx?$/,
  },
  {
    id: 'appium',
    config: /(^|\/)appium\.config\.[cm]?[jt]s$|(^|\/)\.appiumrc(\.json)?$/,
    packages: ['"appium"', 'java-client', 'appium-python-client', 'Appium-Python-Client'],
    tests:
      /\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)test_[^/]*\.py$|[^/]_test\.py$|[^/]Tests?\.(java|kt)$/,
  },
  {
    id: 'playwright',
    config: /(^|\/)playwright\.config\.[cm]?[jt]s$/,
    packages: ['@playwright/test', 'pytest-playwright', 'playwright'],
    tests: /\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)test_[^/]*\.py$|[^/]_test\.py$/,
  },
  {
    id: 'selenium',
    config: /$^/,
    packages: ['selenium-webdriver', 'selenium'],
    tests:
      /\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)test_[^/]*\.py$|[^/]_test\.py$|[^/]Tests?\.(java|kt)$/,
  },
];
