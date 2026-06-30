import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const storeSource = readFileSync('src/store/market-ui.store.ts', 'utf8');
const homeSource = readFileSync('src/pages/home/HomePage.tsx', 'utf8');

assert.match(
  storeSource,
  /export type HomeMarketTypeFilter = '现货' \| '合约';/,
  'Home market type filter should only allow spot and contract',
);
assert.match(
  storeSource,
  /homeMarketType: '现货',/,
  'Home market type filter should default to spot',
);
assert.match(
  homeSource,
  /const marketTypeFilters = \['现货', '合约'\]/,
  'Home market dropdown should only render spot and contract options',
);

const marketTypeFilterLine = homeSource.split('\n').find((line) => line.includes('const marketTypeFilters')) ?? '';
assert.equal(marketTypeFilterLine.includes('全部'), false, 'Home market dropdown must not include 全部');
