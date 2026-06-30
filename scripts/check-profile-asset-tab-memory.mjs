import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const storePath = 'src/store/profile-ui.store.ts';
assert.ok(existsSync(storePath), 'profile UI store must exist');

const storeSource = readFileSync(storePath, 'utf8');
const profileSource = readFileSync('src/pages/profile/ProfilePage.tsx', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');

assert.match(
  storeSource,
  /export type ProfileAssetTab = 'overview' \| 'fund' \| 'spot' \| 'futures';/,
  'profile UI store must export the asset tab union',
);
assert.match(
  storeSource,
  /profileAssetTab: 'overview'/,
  'profile UI store must default to overview',
);
assert.match(
  storeSource,
  /resetProfileAssetTab: \(\) => set\(\{ profileAssetTab: 'overview' \}\)/,
  'profile UI store must reset the selected tab to overview',
);

assert.match(
  profileSource,
  /import \{ useProfileUiStore, type ProfileAssetTab \} from '..\/..\/store\/profile-ui\.store';/,
  'ProfilePage must consume the profile UI store',
);
assert.doesNotMatch(
  profileSource,
  /useState<AssetTab>\('overview'\)/,
  'ProfilePage must not keep the asset tab in local component state',
);
assert.match(
  profileSource,
  /const activeTab = useProfileUiStore\(\(state\) => state\.profileAssetTab\);/,
  'ProfilePage must read the selected asset tab from the profile UI store',
);
assert.match(
  profileSource,
  /const setActiveTab = useProfileUiStore\(\(state\) => state\.setProfileAssetTab\);/,
  'ProfilePage must update the selected asset tab through the profile UI store',
);

assert.match(
  appSource,
  /import \{ useProfileUiStore \} from '.\/store\/profile-ui\.store';/,
  'App must import the profile UI store',
);
assert.match(
  appSource,
  /const resetProfileAssetTab = useProfileUiStore\(\(state\) => state\.resetProfileAssetTab\);/,
  'App must subscribe to the profile asset tab reset action',
);
assert.match(
  appSource,
  /if \(!isLogin\) resetProfileAssetTab\(\);/,
  'App must reset the selected profile asset tab when logged out',
);
