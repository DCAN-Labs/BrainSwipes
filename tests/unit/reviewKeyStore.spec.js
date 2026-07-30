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
    // Each test starts in a new-tab-equivalent state with no Existing information.
    window.sessionStorage.clear();
  });

  afterEach(() => {
    // Restore the Storage methods replaced by the failure tests (the following tests).
    vi.restoreAllMocks();
  });

  it('stores and retrieves a review sample key', () => {
    // Make sure the filename of a sample is kept out of the URL and is stored for the Review page.
    setReviewSampleKey('sub-001_ses-01_T1w');

    expect(getReviewSampleKey()).toBe('sub-001_ses-01_T1w');

    // Make sure the helper uses the agreed namespaced session-storage key.
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe(
      'sub-001_ses-01_T1w',
    );
  });

  it('clears the stored review sample key', () => {
    setReviewSampleKey('sample-to-clear');
    // A sample review should not leave a previous sample available for later navigation.

    clearReviewSampleKey();

    expect(getReviewSampleKey()).toBeNull();
  });

  it('returns null when no review sample key has been stored', () => {
    // The UI should treat a missing key as an absent review selection.
    expect(getReviewSampleKey()).toBeNull();
  });

  it('does not throw when session storage rejects writes', () => {
    // Account for a browser blocking storage through privacy settings or security policies.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });

    // Losing the optional stored key must not crash the current page.
    expect(() => setReviewSampleKey('sample')).not.toThrow();
  });

  it('returns null when session storage rejects reads', () => {
    // Simulate a browser that exposes sessionStorage but denies access to it.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });

    // The helper's public fallback for an unreadable key is null.
    expect(getReviewSampleKey()).toBeNull();
  });

  it('does not throw when session storage rejects removals', () => {
    // Storage cleanup should also be safe when browser storage is blocked.
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });

    expect(() => clearReviewSampleKey()).not.toThrow();
  });
});
