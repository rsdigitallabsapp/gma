import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Storage } from '../storage';

// Pulls the latest affirmation pool from Firestore into local storage so every
// read in the app stays synchronous and offline-safe. Never throws — a failed
// sync just means the app keeps using whatever was cached last (or the
// built-in fallback on first-ever launch).
export async function syncAffirmations() {
  try {
    const snapshot = await getDocs(collection(db, 'affirmations'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (list.length > 0) Storage.setRemoteAffirmations(list);
  } catch (e) {
    // Offline, first launch, misconfigured project, etc. — silently keep cache.
  }
}
