import { Client, Databases, ID, Query } from "appwrite";

// ─── Client (browser-side) ────────────────────────────────────────────────────
console.log("[Appwrite Debug] Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log("[Appwrite Debug] Project:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const databases = new Databases(client);

// ─── IDs ──────────────────────────────────────────────────────────────────────
export const DB_ID  = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "learnloop";
console.log("[Appwrite Debug] Using Database ID:", DB_ID);
export const COL_ID = "sessions";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SessionDoc {
  $id: string;
  $createdAt: string;
  videoUrl: string;
  videoTitle: string;
  channelName: string;
  thumbnail: string;
  topic: string;
  /** JSON.stringify(FlashcardsData) */
  flashcardsJson: string;
  /** JSON.stringify(ConceptMapData) */
  conceptMapJson: string;
  /** JSON.stringify(Assignment) */
  assignmentJson: string;
  /** JSON.stringify(AssessmentResult) — empty string if not assessed */
  assessmentJson: string;
  /** Score 0-100, -1 if not assessed */
  score: number;
}

export type NewSession = Omit<SessionDoc, "$id" | "$createdAt">;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Save a new learning session */
export const saveSession = (data: NewSession) =>
  databases.createDocument(DB_ID, COL_ID, ID.unique(), data);

/** Fetch recent sessions, newest first */
export const listSessions = (limit = 30) =>
  databases.listDocuments(DB_ID, COL_ID, [
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
  ]);

/** Patch an existing session (e.g. add assessment after code review) */
export const updateSession = (id: string, data: Partial<NewSession>) =>
  databases.updateDocument(DB_ID, COL_ID, id, data);

/** Fetch a single session by ID */
export const getSession = (id: string) =>
  databases.getDocument(DB_ID, COL_ID, id);

/** Hard-delete a session */
export const deleteSession = (id: string) =>
  databases.deleteDocument(DB_ID, COL_ID, id);
