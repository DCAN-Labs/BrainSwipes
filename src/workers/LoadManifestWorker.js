import _ from 'lodash';
import { initializeApp } from 'firebase/app';
import { getDatabase, set, ref } from 'firebase/database';

// eslint-disable-next-line
onmessage = function(e) {
  const entries = e.data;
  const firebaseKeys = entries[2];
  initializeApp(firebaseKeys);
  const db = getDatabase();
  const filtered = _.filter(entries[0], m => entries[1].indexOf(m) < 0);
  const target = filtered.length;
  let current = 0;
  if (!target) {
    postMessage('done');
  }
  _.map(filtered,
    (key) => {
      set(ref(db, `sampleCounts/${key}`), 0).then(() => {
        current += 1;
        if (current === target) {
            // We then have treated all the objects
          postMessage('done');
        }
        postMessage('progress');
      })
      .catch(() => {
        postMessage('error');
      });
    });
};
