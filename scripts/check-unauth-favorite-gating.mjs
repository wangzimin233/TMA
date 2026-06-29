import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = [
  {
    path: 'src/pages/home/HomePage.tsx',
    expected: 'const favoriteRows = isLogin ? favoriteList : [];',
    sourcePattern: /activeTab === '自选' \? favoriteRows : marketList/,
  },
  {
    path: 'src/pages/market/MarketPage.tsx',
    expected: 'const favoriteRows = isLogin ? favoriteList : [];',
    sourcePattern: /isFavoriteTab \? favoriteRows : marketList/,
  },
  {
    path: 'src/pages/trade/TradePage.tsx',
    expected: 'const favoriteRows = isLogin ? favoriteList : [];',
    sourcePattern: /isFavoriteTab \? favoriteRows : marketList/,
  },
];

for (const file of files) {
  const source = readFileSync(file.path, 'utf8');
  assert.match(source, file.sourcePattern, `${file.path} must render gated favorite rows`);
  assert.ok(source.includes(file.expected), `${file.path} must clear favorite rows while logged out`);
}
