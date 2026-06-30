import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const profileSource = readFileSync('src/pages/profile/ProfilePage.tsx', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const transferSource = readFileSync('src/pages/transfer/TransferPage.tsx', 'utf8');

assert.match(
  profileSource,
  /openTransfer:\s*\(fromAccountType\?: AccountType\) => void;/,
  'ProfilePage must allow passing the active asset account type to openTransfer',
);
assert.match(
  profileSource,
  /onClick=\{\(\) => openTransfer\(currentTab\.accountType\)\}/,
  'ProfilePage transfer action must pass currentTab.accountType',
);

assert.match(
  appSource,
  /import type \{[^}]*AccountType[^}]*\} from '\.\/api\/account';/,
  'App must import AccountType for transfer source routing',
);
assert.match(
  appSource,
  /const openTransfer = \(fromAccountType\?: AccountType\) => \{/,
  'App openTransfer must accept an optional source account type',
);
assert.match(
  appSource,
  /navigate\(`\/transfer\?from=\$\{encodeURIComponent\(fromAccountType\)\}`\)/,
  'App openTransfer must serialize the source account into the from query parameter',
);

assert.match(
  transferSource,
  /import \{ useSearchParams \} from 'react-router-dom';/,
  'TransferPage must read route search params',
);
assert.match(
  transferSource,
  /const initialFromAccountType = getInitialFromAccountType\(searchParams\.get\('from'\)\);/,
  'TransferPage must derive initial from account type from the from query parameter',
);
assert.match(
  transferSource,
  /const \[toAccountType, setToAccountType\] = useState<AccountType>\(\(\) => getDefaultToAccountType\(initialFromAccountType\)\);/,
  'TransferPage must derive the initial destination account from the initial source account',
);
assert.match(
  transferSource,
  /function getInitialFromAccountType\(value: string \| null\): AccountType \{/,
  'TransferPage must validate supported from account values',
);
