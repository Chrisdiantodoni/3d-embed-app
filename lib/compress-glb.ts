import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

export async function compressGlbWithDraco(buffer: Buffer): Promise<Buffer> {
  const inputPath = join(tmpdir(), `upload-${randomUUID()}.glb`);
  const outputPath = join(tmpdir(), `upload-${randomUUID()}.glb`);

  try {
    await writeFile(inputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        "npx",
        ["gltf-transform", "draco", inputPath, outputPath],
        { timeout: 60_000 },
        (error) => {
          if (error) reject(error);
          else resolve();
        },
      );
    });

    const compressed = await readFile(outputPath);
    return compressed;
  } catch (err) {
    console.warn("[draco] compression skipped:", String(err));
    return buffer;
  } finally {
    unlink(inputPath).catch(() => {});
    unlink(outputPath).catch(() => {});
  }
}
