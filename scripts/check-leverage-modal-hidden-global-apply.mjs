import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/LeverageModal.tsx', 'utf8');

assert.equal(
  source.includes('应用至所有交易对'),
  false,
  'Leverage modal should hide the apply-to-all-symbols option for now',
);

assert.equal(
  /<input[^>]+type="checkbox"[^>]*>/.test(source),
  false,
  'Leverage modal should not render the apply-to-all checkbox while the option is hidden',
);
