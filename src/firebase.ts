import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  type Auth,
  GoogleAuthProvider,
  type User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  type Firestore,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  setLogLevel,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence noisy Firestore SDK retry logs when running in offline/sandboxed environments
// where securetoken.googleapis.com may not be enabled yet.
try {
  setLogLevel('silent');
} catch {
  // Ignore if setLogLevel is unavailable
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;
let firebaseExplicitlyActivated = false;

function ensureFirebaseApp(): FirebaseApp {
  if (!cachedApp) {
    const existing = getApps();
    cachedApp = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  }
  return cachedApp;
}

export function getLazyAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(ensureFirebaseApp());
  }
  return cachedAuth;
}

export function getLazyDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(ensureFirebaseApp(), firebaseConfig.firestoreDatabaseId);
  }
  return cachedDb;
}

export const googleProvider = new GoogleAuthProvider();

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;

export type OperationType = (typeof OperationType)[keyof typeof OperationType];

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const currentUser = firebaseExplicitlyActivated ? getLazyAuth().currentUser : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  return errInfo;
}

export interface SavedBriefingRecord {
  id: string;
  ownerId: string;
  editionId: string;
  dateKey: string;
  title: string;
  summaryHook: string;
  focusPillar: string;
  savedFromPlatform?: string;
}

export interface SavedChatMessageRecord {
  id: string;
  ownerId: string;
  role: 'user' | 'assistant';
  modelUsed: string;
  text: string;
  followUpOptions: string[];
  devicePlatform?: string;
}

function sanitizeDocId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `doc-${Date.now()}`;
}

export async function signInWithGooglePopup(): Promise<User | null> {
  firebaseExplicitlyActivated = true;
  const authInstance = getLazyAuth();
  const result = await signInWithPopup(authInstance, googleProvider);
  return result.user;
}

export async function signOutCurrentUser(): Promise<void> {
  if (!firebaseExplicitlyActivated) return;
  const authInstance = getLazyAuth();
  await signOut(authInstance);
}

export function observeAuthUser(callback: (user: User | null) => void): () => void {
  // Do not eagerly initialize Firebase Auth on initial page mount if not explicitly activated,
  // avoiding securetoken.googleapis.com errors when Token Service API is disabled in the project.
  if (!firebaseExplicitlyActivated) {
    callback(null);
    return () => {};
  }
  try {
    const authInstance = getLazyAuth();
    return onAuthStateChanged(
      authInstance,
      (u) => callback(u),
      () => callback(null)
    );
  } catch {
    callback(null);
    return () => {};
  }
}

export async function saveUserBriefingToFirestore(params: {
  editionId: string;
  dateKey: string;
  title: string;
  summaryHook: string;
  focusPillar: string;
}): Promise<string | null> {
  if (!firebaseExplicitlyActivated) return null;
  const currentUser = getLazyAuth().currentUser;
  if (!currentUser) return null;

  const safeEditionId = sanitizeDocId(params.editionId);
  const docId = sanitizeDocId(`${currentUser.uid}_${safeEditionId}`);
  const path = `user_briefings/${docId}`;

  const safeDateKey = /^\d{4}-\d{2}-\d{2}$/.test(params.dateKey)
    ? params.dateKey
    : new Date().toISOString().slice(0, 10);
  const safeTitle = params.title.trim().slice(0, 240);
  const safeHook = params.summaryHook.trim().slice(0, 2000);
  const allowedPillars = new Set([
    'ALL',
    'Aerospace',
    'Defence',
    'Geopolitics',
    'Money & Economy',
    'Technology',
    'Physics',
  ]);
  const safePillar = allowedPillars.has(params.focusPillar) ? params.focusPillar : 'ALL';

  try {
    const dbInstance = getLazyDb();
    await setDoc(doc(dbInstance, 'user_briefings', docId), {
      ownerId: currentUser.uid,
      editionId: safeEditionId,
      dateKey: safeDateKey,
      title: safeTitle.length >= 3 ? safeTitle : 'NEXUS-7 Daily Briefing',
      summaryHook: safeHook.length >= 3 ? safeHook : 'Live 6-Pillar Intelligence Briefing',
      focusPillar: safePillar,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

export async function deleteUserBriefingFromFirestore(docId: string): Promise<void> {
  if (!firebaseExplicitlyActivated) return;
  const currentUser = getLazyAuth().currentUser;
  if (!currentUser) return;
  const safeId = sanitizeDocId(docId);
  const path = `user_briefings/${safeId}`;
  try {
    const dbInstance = getLazyDb();
    await deleteDoc(doc(dbInstance, 'user_briefings', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveChatMessageToFirestore(params: {
  role: 'user' | 'assistant';
  modelUsed: string;
  text: string;
  followUpOptions: string[];
}): Promise<string | null> {
  if (!firebaseExplicitlyActivated) return null;
  const currentUser = getLazyAuth().currentUser;
  if (!currentUser) return null;

  const docId = sanitizeDocId(
    `${currentUser.uid}_msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  );
  const path = `terminal_chats/${docId}`;

  try {
    const dbInstance = getLazyDb();
    await setDoc(doc(dbInstance, 'terminal_chats', docId), {
      ownerId: currentUser.uid,
      role: params.role === 'user' ? 'user' : 'assistant',
      modelUsed: (params.modelUsed || 'gemini-3.8-flash').slice(0, 80),
      text: (params.text || 'NEXUS-7 Ready.').slice(0, 8000),
      followUpOptions: (params.followUpOptions || [])
        .slice(0, 4)
        .map((opt) => String(opt).slice(0, 200)),
      createdAt: serverTimestamp(),
    });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

export function subscribeToUserBriefings(
  userId: string,
  onUpdate: (records: SavedBriefingRecord[]) => void
): () => void {
  if (!firebaseExplicitlyActivated || !userId) {
    return () => {};
  }
  try {
    const dbInstance = getLazyDb();
    const q = query(
      collection(dbInstance, 'user_briefings'),
      where('ownerId', '==', userId),
      limit(20)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const records: SavedBriefingRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerId: String(data.ownerId || ''),
            editionId: String(data.editionId || ''),
            dateKey: String(data.dateKey || ''),
            title: String(data.title || ''),
            summaryHook: String(data.summaryHook || ''),
            focusPillar: String(data.focusPillar || 'ALL'),
          };
        });
        onUpdate(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'user_briefings');
      }
    );
  } catch {
    return () => {};
  }
}

export function subscribeToUserChats(
  userId: string,
  onUpdate: (messages: SavedChatMessageRecord[]) => void
): () => void {
  if (!firebaseExplicitlyActivated || !userId) {
    return () => {};
  }
  try {
    const dbInstance = getLazyDb();
    const q = query(
      collection(dbInstance, 'terminal_chats'),
      where('ownerId', '==', userId),
      limit(40)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const messages: SavedChatMessageRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerId: String(data.ownerId || ''),
            role: data.role === 'user' ? 'user' : 'assistant',
            modelUsed: String(data.modelUsed || 'gemini-3.8-flash'),
            text: String(data.text || ''),
            followUpOptions: Array.isArray(data.followUpOptions)
              ? data.followUpOptions.map((x: unknown) => String(x))
              : [],
          };
        });
        onUpdate(messages);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'terminal_chats');
      }
    );
  } catch {
    return () => {};
  }
}
