import { describe, expect, it } from "vitest";
import { applyPlan, type ObjectStore, UploadError } from "./apply.js";
import { type PlannedObject, planUpload } from "./plan.js";
import { fakeRelease } from "./test-release.js";

function memoryStore(initial: Record<string, Uint8Array> = {}) {
  const objects = new Map(Object.entries(initial));
  const calls: string[] = [];
  let corruptNextWrite = false;
  const store: ObjectStore & {
    objects: Map<string, Uint8Array>;
    calls: string[];
    corruptNextWrite(): void;
  } = {
    objects,
    calls,
    corruptNextWrite() {
      corruptNextWrite = true;
    },
    async read(key) {
      calls.push(`read ${key}`);
      return objects.get(key) ?? null;
    },
    async write(object: PlannedObject) {
      calls.push(`write ${object.key}`);
      const bytes = corruptNextWrite ? object.bytes.slice(1) : object.bytes;
      corruptNextWrite = false;
      objects.set(object.key, bytes);
    },
  };
  return store;
}

const plan = planUpload(fakeRelease(), { release: "sample", bucket: "b" });
const [first, second, manifest] = plan.objects as [PlannedObject, PlannedObject, PlannedObject];

describe("applyPlan", () => {
  it("writes every object, reading each back, with the manifest last", async () => {
    const store = memoryStore();
    const outcomes = await applyPlan(plan, store, () => {});
    expect([...outcomes.values()]).toEqual(["written", "written", "written"]);
    expect(store.calls).toEqual([
      `read ${first.key}`,
      `write ${first.key}`,
      `read ${first.key}`,
      `read ${second.key}`,
      `write ${second.key}`,
      `read ${second.key}`,
      `write ${manifest.key}`,
      `read ${manifest.key}`,
    ]);
    expect(store.objects.get(manifest.key)).toEqual(manifest.bytes);
  });

  it("skips a hashed file that is already there with the same bytes", async () => {
    const store = memoryStore({ [first.key]: first.bytes });
    const outcomes = await applyPlan(plan, store, () => {});
    expect(outcomes.get(first.key)).toBe("already there");
    expect(store.calls.filter((c) => c === `write ${first.key}`)).toEqual([]);
  });

  it("always replaces the manifest", async () => {
    const store = memoryStore({ [manifest.key]: new Uint8Array([1, 2, 3]) });
    await applyPlan(plan, store, () => {});
    expect(store.objects.get(manifest.key)).toEqual(manifest.bytes);
  });

  it("stops, before the manifest, when a hashed name holds different bytes", async () => {
    const store = memoryStore({ [first.key]: new Uint8Array([9]) });
    await expect(applyPlan(plan, store, () => {})).rejects.toThrow(UploadError);
    expect(store.objects.get(first.key)).toEqual(new Uint8Array([9]));
    expect(store.objects.has(manifest.key)).toBe(false);
  });

  it("stops when an object does not read back as written", async () => {
    const store = memoryStore();
    store.corruptNextWrite();
    await expect(applyPlan(plan, store, () => {})).rejects.toThrow(/did not read back/);
    expect(store.objects.has(manifest.key)).toBe(false);
  });

  it("never deletes: objects outside the plan are left alone", async () => {
    const store = memoryStore({ "sample/points.0000000000000000.bin": new Uint8Array([7]) });
    await applyPlan(plan, store, () => {});
    expect(store.objects.get("sample/points.0000000000000000.bin")).toEqual(new Uint8Array([7]));
  });
});
