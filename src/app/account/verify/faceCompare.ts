/**
 * Compares the face in an ID document photo against a live face scan
 * using 68-point face landmarks from the already-loaded TinyFaceDetector
 * and FaceLandmark68Tiny models.
 *
 * Returns a similarity score from 0 (no match) to 1 (perfect match).
 * Threshold: >0.60 = likely same person, <0.40 = likely different.
 */

type Point = { x: number; y: number };

function euclidean(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeToUnitBox(pts: Point[], box: { x: number; y: number; width: number; height: number }): Point[] {
  return pts.map((p) => ({
    x: (p.x - box.x) / (box.width || 1),
    y: (p.y - box.y) / (box.height || 1),
  }));
}

/** Load an image from a Blob or File into an HTMLImageElement */
function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

export type FaceCompareResult =
  | { score: number; status: "match" | "partial" | "mismatch" }
  | { score: null; status: "no-face-id" | "no-face-scan" | "no-faces" | "error" };

export async function compareFaces(
  idDocBlob: Blob,
  scanBlob: Blob,
): Promise<FaceCompareResult> {
  try {
    const faceapi = await import("face-api.js");
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });

    const [idImg, scanImg] = await Promise.all([
      blobToImage(idDocBlob),
      blobToImage(scanBlob),
    ]);

    const [idDet, scanDet] = await Promise.all([
      faceapi.detectSingleFace(idImg, opts).withFaceLandmarks(true),
      faceapi.detectSingleFace(scanImg, opts).withFaceLandmarks(true),
    ]);

    if (!idDet && !scanDet) return { score: null, status: "no-faces" };
    if (!idDet) return { score: null, status: "no-face-id" };
    if (!scanDet) return { score: null, status: "no-face-scan" };

    // Normalise 68 landmarks relative to each face's bounding box
    const idBox = idDet.detection.box;
    const scanBox = scanDet.detection.box;

    const idLm = normalizeToUnitBox(
      idDet.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
      idBox,
    );
    const scanLm = normalizeToUnitBox(
      scanDet.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
      scanBox,
    );

    // Mean euclidean distance across all 68 landmark pairs
    const totalDist = idLm.reduce((sum, pt, i) => sum + euclidean(pt, scanLm[i]), 0);
    const avgDist = totalDist / idLm.length;

    // Map distance → similarity: 0.00 dist = 1.0, 0.20 dist = 0.0
    const score = Math.max(0, Math.min(1, 1 - avgDist / 0.2));
    const status = score >= 0.6 ? "match" : score >= 0.4 ? "partial" : "mismatch";

    return { score: parseFloat(score.toFixed(3)), status };
  } catch (err) {
    console.error("compareFaces:", err);
    return { score: null, status: "error" };
  }
}
