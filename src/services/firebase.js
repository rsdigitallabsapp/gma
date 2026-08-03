import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAAoFkM9G7Yw-SfFd6spUgUfP5H6DNqt-E',
  authDomain: 'arise-e72f3.firebaseapp.com',
  projectId: 'arise-e72f3',
  storageBucket: 'arise-e72f3.firebasestorage.app',
  messagingSenderId: '1023842139911',
  appId: '1:1023842139911:web:608feba95109c11df08fa2',
};

const app = initializeApp(firebaseConfig);

// Long polling avoids relying on WebSocket streaming, which isn't consistently
// available in React Native environments.
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
