import type { MultipartFile } from "@fastify/multipart";
import { mkdtempSync, rmSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { LocalFileStorage } from "../src/lib/storage/local-file";

function buildMultipartPart(input: {
  mimetype: string;
  data: Buffer;
  truncated?: boolean;
}): MultipartFile {
  const stream = Readable.from(input.data) as NodeJS.ReadableStream & {
    truncated?: boolean;
    bytesRead?: number;
  };
  stream.truncated = input.truncated ?? false;
  stream.bytesRead = input.data.byteLength;

  return {
    mimetype: input.mimetype,
    file: stream,
  } as unknown as MultipartFile;
}

async function countFilesRecursively(root: string): Promise<number> {
  const entries = await readdir(root, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += await countFilesRecursively(join(root, entry.name));
      continue;
    }
    count += 1;
  }

  return count;
}

describe("LocalFileStorage", () => {
  let tmpRoot: string | undefined;

  afterEach(() => {
    if (tmpRoot) {
      rmSync(tmpRoot, { recursive: true, force: true });
      tmpRoot = undefined;
    }
  });

  it("saves file under date-based path", async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), "toyclaw-storage-test-"));
    const storage = new LocalFileStorage(tmpRoot);

    const part = buildMultipartPart({
      mimetype: "image/png",
      data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    });

    const saved = await storage.saveFile(part);

    expect(saved.relativePath).toMatch(/^\d{4}\/\d{2}\/\d{2}\//);
    expect(saved.absolutePath.startsWith(tmpRoot)).toBe(true);
    expect(await countFilesRecursively(tmpRoot)).toBe(1);
  });

  it("removes partially written file when stream is truncated", async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), "toyclaw-storage-test-"));
    const storage = new LocalFileStorage(tmpRoot);

    const part = buildMultipartPart({
      mimetype: "image/png",
      data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      truncated: true,
    });

    await expect(storage.saveFile(part)).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
      statusCode: 413,
    });
    expect(await countFilesRecursively(tmpRoot)).toBe(0);
  });
});
