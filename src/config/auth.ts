// Metro usa auth.native.ts no Android/iOS e este arquivo na web.
import { getAuth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
export const createAuth = (app: FirebaseApp) => getAuth(app);
