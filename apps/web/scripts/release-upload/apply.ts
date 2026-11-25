// Carries out an upload plan against a bucket. It never deletes, never
// overwrites a content-hashed object, and reads back every object it writes.
import { type PlannedObject, sha256Hex, type UploadPlan } from "./plan.js";

export interface ObjectStore {
  /** The object's bytes, or null if there is no object by that key. */
  read(key: string): Promise<Uint8Array | null>;
  write(object: PlannedObject): Promise<void>;
}

export type Outcome = "written" | "already there";

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export async function applyPlan(
  plan: UploadPlan,
  store: ObjectStore,
  log: (line: string) => void,
): Promise<Map<string, Outcome>> {
  const outcomes = new Map<string, Outcome>();
  for (const object of plan.objects) {
    if (object.action === "put-if-absent") {
      const existing = await store.read(object.key);
      if (existing !== null) {
        if (sha256Hex(existing) !== object.sha256) {
          // Its name says its bytes cannot change. Two releases disagree about
          // what this file is; stop before the manifest points anyone at it.
          throw new UploadError(
            `${object.key} is already in the bucket with different bytes; nothing after it was written`,
          );
        }
        log(`  already there  ${object.key}`);
        outcomes.set(object.key, "already there");
        continue;
      }
    }
    await store.write(object);
    const back = await store.read(object.key);
    if (back === null || sha256Hex(back) !== object.sha256) {
      throw new UploadError(
        `${object.key} did not read back as written; nothing after it was written`,
      );
    }
    log(`  written        ${object.key}  (read back, SHA-256 matches)`);
    outcomes.set(object.key, "written");
  }
  return outcomes;
}
