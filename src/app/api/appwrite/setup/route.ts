/**
 * GET /api/appwrite/setup
 *
 * One-time route that creates the Appwrite database + sessions collection
 * with all required attributes and public (any) permissions.
 *
 * Requires APPWRITE_API_KEY in .env.local (server-only, NOT NEXT_PUBLIC_).
 * Safe to call multiple times — already-existing resources are ignored.
 */
import { NextResponse } from "next/server";
import {
  Client,
  Databases,
  DatabasesIndexType,
  OrderBy,
  Permission,
  Role,
} from "node-appwrite";

const DB_ID  = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "learnloop";
const COL_ID = "sessions";

export async function GET() {
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "APPWRITE_API_KEY is not set in .env.local" },
      { status: 500 }
    );
  }

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(apiKey);

  const db = new Databases(client);
  const log: string[] = [];

  // ── 1. Create database ────────────────────────────────────────────────────
  try {
    await db.create(DB_ID, "LearnLoop");
    log.push("✓ Created database: learnloop");
  } catch (err: any) {
    if (err.message?.includes("already exists")) {
      log.push("– Database already exists");
    } else {
      log.push(`❌ Database Error: ${err.message}`);
    }
  }

  // ── 2. Create collection ──────────────────────────────────────────────────
  const permissions = [
    Permission.create(Role.any()),
    Permission.read(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  try {
    await db.createCollection(DB_ID, COL_ID, "Sessions", permissions);
    log.push("✓ Created collection: sessions");
  } catch {
    // If it exists, ensure permissions are updated
    try {
      await db.updateCollection(DB_ID, COL_ID, "Sessions", permissions);
      log.push("✓ Updated permissions for existing collection: sessions");
    } catch (err: any) {
      log.push(`– Failed to update collection: ${err.message}`);
    }
  }

  // ── 3. Create attributes ──────────────────────────────────────────────────
  const strAttrs: [string, number, boolean, string?][] = [
    ["videoUrl",       2048,  true],
    ["videoTitle",     512,   false, ""],
    ["channelName",    256,   false, ""],
    ["thumbnail",      1024,  false, ""],
    ["topic",          256,   false, ""],
    ["flashcardsJson", 65535, true],
    ["conceptMapJson", 65535, true],
    ["assignmentJson", 65535, true],
    ["assessmentJson", 65535, false, ""],
  ];

  for (const [key, size, required, def] of strAttrs) {
    try {
      await db.createStringAttribute(
        DB_ID, COL_ID, key, size, required,
        def as string | undefined
      );
      log.push(`✓ Attribute: ${key}`);
    } catch {
      log.push(`– Attribute already exists: ${key}`);
    }
  }

  // Integer attribute for score
  try {
    await db.createIntegerAttribute(DB_ID, COL_ID, "score", false, undefined, undefined, -1);
    log.push("✓ Attribute: score");
  } catch {
    log.push("– Attribute already exists: score");
  }

  // ── 4. Create index for fast ordering by $createdAt ───────────────────────
  try {
    await db.createIndex(DB_ID, COL_ID, "createdAt_idx", DatabasesIndexType.Key, ["$createdAt"], [OrderBy.Desc]);
    log.push("✓ Index: createdAt_idx");
  } catch {
    log.push("– Index already exists");
  }

  return NextResponse.json({ ok: true, log });
}
