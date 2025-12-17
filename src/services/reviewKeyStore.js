// This Helper stores image name information while keepign it out of the URL
const STORAGE_KEY = 'brainswipes.currentReviewSampleKey';

export function setReviewSampleKey(value) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, value);
  } catch (e) {
    // When sessionStorage is clocked we quietly fail this check
  }
}

export function getReviewSampleKey() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

export function clearReviewSampleKey() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}
