import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  clearReviewSampleKey,
  getReviewSampleKey,
  setReviewSampleKey,
} from '../../src/services/reviewKeyStore';

const STORAGE_KEY = 'brainswipes.currentReviewSampleKey';

describe('reviewKeyStore', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores and retrieves a review sample key', () => {
    setReviewSampleKey('sub-001_ses-01_T1w');

    expect(getReviewSampleKey()).toBe('sub-001_ses-01_T1w');
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe(
      'sub-001_ses-01_T1w',
    );
  });

  it('clears the stored review sample key', () => {
    setReviewSampleKey('sample-to-clear');

    clearReviewSampleKey();

    expect(getReviewSampleKey()).toBeNull();
  });

  it('returns null when no review sample key has been stored', () => {
    expect(getReviewSampleKey()).toBeNull();
  });

  it('does not throw when session storage rejects writes', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });

    expect(() => setReviewSampleKey('sample')).not.toThrow();
  });

  it('returns null when session storage rejects reads', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });

    expect(getReviewSampleKey()).toBeNull();
  });

  it('does not throw when session storage rejects removals', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });

    expect(() => clearReviewSampleKey()).not.toThrow();
  });
});
