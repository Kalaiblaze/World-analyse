import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  type User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
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
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export interface SavedBriefingRecord {
  id: string;
  ownerId: string;
  editionId: string;
  dateKey: string;
  title: string;
  summaryHook: string;
  focusPillar: string;
}

export interface SavedChatMessageRecord {
  id: string;
  ownerId: string;
  role: 'user' | 'assistant';
  modelUsed: string;
  text: string;
  followUpOptions: string[];
}

function sanitizeDocId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `doc-${Date.now()}`;
}

export async function signInWithGooglePopup(): Promise<User | null> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth);
}

export function observeAuthUser(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function saveUserBriefingToFirestore(params: {
  editionId: string;
  dateKey: string;
  title: string;
  summaryHook: string;
  focusPillar: string;
}): Promise<string | null> {
  const currentUser = auth.currentUser;
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
    await setDoc(doc(db, 'user_briefings', docId), {
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
  }
}

export async function deleteUserBriefingFromFirestore(docId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  const safeId = sanitizeDocId(docId);
  const path = `user_briefings/${safeId}`;
  try {
    await deleteDoc(doc(db, 'user_briefings', safeId));
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
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const docId = sanitizeDocId(`${currentUser.uid}_msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  const path = `terminal_chats/${docId}`;

  try {
    await setDoc(doc(db, 'terminal_chats', docId), {
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
  }
}

export function subscribeToUserBriefings(
  userId: string,
  onUpdate: (records: SavedBriefingRecord[]) => void
): () => void {
  const q = query(
    collection(db, 'user_briefings'),
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
}

export function subscribeToUserChats(
  userId: string,
  onUpdate: (messages: SavedChatMessageRecord[]) => void
): () => void {
  const q = query(
    collection(db, 'terminal_chats'),
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
}
