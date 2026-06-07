"use client";

import { useRef, useEffect, useState, useCallback } from "react";

type Status =
  | "loading"
  | "no-camera"
  | "no-face"
  | "too-far"
  | "too-close"
  | "off-center"
  | "need-blink"
  | "captured"
  | "error";

const HINTS: Record<Status, string> = {
  loading: "Loading face detection…",
  "no-camera": "Camera access denied. Please allow camera in your browser settings.",
  "no-face": "Position your face inside the oval",
  "too-far": "Bring your phone closer ↑",
  "too-close": "Move back a little ↓",
  "off-center": "Move your face to the center",
  "need-blink": "Hold still — blink once to confirm",
  captured: "Face captured!",
  error: "Something went wrong. Please refresh and try again.",
};

const OVAL_COLOR: Record<Status, string> = {
  loading: "#d4d4d4",
  "no-camera": "#ef4444",
  "no-face": "#d4d4d4",
  "too-far": "#eab308",
  "too-close": "#eab308",
  "off-center": "#eab308",
  "need-blink": "#eab308",
  captured: "#16a34a",
  error: "#ef4444",
};

function euclidean(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function eyeAspectRatio(pts: { x: number; y: number }[]) {
  const v1 = euclidean(pts[1], pts[5]);
  const v2 = euclidean(pts[2], pts[4]);
  const h = euclidean(pts[0], pts[3]);
  return (v1 + v2) / (2 * h + 1e-6);
}

export function FaceScanner({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const stopRef = useRef(false);
  const blinkRef = useRef(false);
  const prevEarRef = useRef(1);
  const streamRef = useRef<MediaStream | null>(null);

  const handleCapture = useCallback(
    (video: HTMLVideoElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      // Un-mirror for the stored image (we mirrored the video display)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCapture(blob);
            setCapturedPreview(canvas.toDataURL("image/jpeg"));
          }
        },
        "image/jpeg",
        0.9,
      );
      setStatus("captured");
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [onCapture],
  );

  useEffect(() => {
    stopRef.current = false;
    let faceapi: typeof import("face-api.js") | null = null;

    async function init() {
      try {
        faceapi = await import("face-api.js");
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;

        if (!videoRef.current || stopRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("no-face");
        runLoop(faceapi);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setStatus("no-camera");
        } else {
          console.error("FaceScanner init:", err);
          setStatus("error");
        }
      }
    }

    function runLoop(api: typeof import("face-api.js")) {
      async function tick() {
        if (stopRef.current || !videoRef.current) return;

        const det = await api
          .detectSingleFace(
            videoRef.current,
            new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }),
          )
          .withFaceLandmarks(true);

        if (stopRef.current) return;

        if (!det) {
          setStatus("no-face");
          blinkRef.current = false;
          prevEarRef.current = 1;
        } else {
          const vw = videoRef.current.videoWidth;
          const vh = videoRef.current.videoHeight;
          const { box } = det.detection;
          const faceRatio = box.width / vw;
          const cx = (box.x + box.width / 2) / vw;
          const cy = (box.y + box.height / 2) / vh;
          const centered = cx > 0.3 && cx < 0.7 && cy > 0.2 && cy < 0.75;

          if (faceRatio < 0.22) {
            setStatus("too-far");
            blinkRef.current = false;
          } else if (faceRatio > 0.65) {
            setStatus("too-close");
            blinkRef.current = false;
          } else if (!centered) {
            setStatus("off-center");
            blinkRef.current = false;
          } else {
            // Good position — check blink via Eye Aspect Ratio
            const lm = det.landmarks;
            const left = lm.getLeftEye().map((p) => ({ x: p.x, y: p.y }));
            const right = lm.getRightEye().map((p) => ({ x: p.x, y: p.y }));
            const ear = (eyeAspectRatio(left) + eyeAspectRatio(right)) / 2;

            if (prevEarRef.current > 0.22 && ear < 0.16) {
              blinkRef.current = true;
              setBlinkDetected(true);
            }
            prevEarRef.current = ear;

            if (!blinkRef.current) {
              setStatus("need-blink");
            } else {
              stopRef.current = true;
              handleCapture(videoRef.current);
              return;
            }
          }
        }

        setTimeout(() => requestAnimationFrame(tick), 100);
      }
      tick();
    }

    init();

    return () => {
      stopRef.current = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [handleCapture]);

  const isLoading = status === "loading";
  const isDone = status === "captured";
  const ovalStroke = OVAL_COLOR[status];
  const pulse = status === "need-blink";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera view */}
      <div className="relative w-full max-w-xs overflow-hidden rounded-2xl bg-stone-900">
        {capturedPreview ? (
          <img
            src={capturedPreview}
            alt="Captured face"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            className="aspect-[4/3] w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
            playsInline
            muted
          />
        )}

        {/* Oval overlay + guidance */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 320 240"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id="face-oval-mask">
              <rect width="320" height="240" fill="white" />
              <ellipse cx="160" cy="120" rx="88" ry="108" fill="black" />
            </mask>
          </defs>
          {/* Dim area outside oval */}
          <rect
            width="320"
            height="240"
            fill="rgba(0,0,0,0.45)"
            mask="url(#face-oval-mask)"
          />
          {/* Oval border */}
          <ellipse
            cx="160"
            cy="120"
            rx="88"
            ry="108"
            fill="none"
            stroke={ovalStroke}
            strokeWidth="2.5"
            strokeDasharray={pulse ? "12 6" : undefined}
          >
            {pulse && (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="18"
                dur="0.8s"
                repeatCount="indefinite"
              />
            )}
          </ellipse>

          {/* Checkmark when captured */}
          {isDone && (
            <>
              <circle cx="160" cy="120" r="30" fill="rgba(22,163,74,0.85)" />
              <path
                d="M146 120 l10 10 l18 -20"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          )}
        </svg>

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/70">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-400 border-t-white" />
          </div>
        )}
      </div>

      {/* Hint text */}
      <div className="text-center">
        <p
          className={`text-sm font-medium ${
            status === "error" || status === "no-camera"
              ? "text-red-600"
              : isDone
                ? "text-green-700"
                : status === "need-blink"
                  ? "text-yellow-700"
                  : "text-stone-600"
          }`}
        >
          {HINTS[status]}
        </p>
        {status === "need-blink" && (
          <p className="mt-1 text-xs text-stone-400">
            Confirms you are physically present — not a photo
          </p>
        )}
        {status === "too-far" && (
          <p className="mt-1 text-xs text-stone-400">
            Keep moving closer until the oval turns yellow
          </p>
        )}
      </div>

      {/* Progress dots */}
      {!isDone && status !== "loading" && status !== "no-camera" && status !== "error" && (
        <div className="flex items-center gap-2">
          {[
            { key: "face", done: status !== "no-face" },
            { key: "distance", done: status !== "too-far" && status !== "too-close" && status !== "no-face" },
            { key: "blink", done: blinkDetected },
          ].map(({ key, done }) => (
            <div
              key={key}
              className={`h-1.5 w-6 rounded-full transition-colors ${done ? "bg-green-500" : "bg-stone-200"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
