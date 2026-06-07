/**
 * Downloads the face-api.js model weights needed for verification.
 * Run once: `node scripts/download-face-models.mjs`
 *
 * Models downloaded:
 *   - tiny_face_detector   (~188 KB) — real-time face detection
 *   - face_landmark_68_tiny (~82 KB) — eye landmarks for blink detection
 *   - face_recognition_net (~6.2 MB) — face descriptors for ID ↔ selfie match
 */

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const BASE =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

// Phase 2 models: detection + blink liveness (~270 KB total)
// Phase 3 face-match models (face_recognition_net) must be downloaded from
// the GitHub releases page: https://github.com/justadudewhohacks/face-api.js/releases
const FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_landmark_68_tiny_model-weights_manifest.json",
  "face_landmark_68_tiny_model-shard1",
];

const OUT = join(process.cwd(), "public", "models");
await mkdir(OUT, { recursive: true });

for (const file of FILES) {
  const url = `${BASE}/${file}`;
  process.stdout.write(`Downloading ${file}… `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${file}`);
  const buf = await res.arrayBuffer();
  await writeFile(join(OUT, file), Buffer.from(buf));
  console.log(`done (${(buf.byteLength / 1024).toFixed(0)} KB)`);
}

console.log("\nAll models saved to public/models/");
