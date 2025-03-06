import { test, expect } from 'vitest';

import { check } from '../src/index.js';


test('dummy test to verify test set up', () => {
    expect(check()).toBe(1);
});
