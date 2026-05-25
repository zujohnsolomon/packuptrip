/** Small teal shield shown next to verified hosts everywhere. */
export function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span
      title="ID Verified"
      aria-label="ID Verified"
      className="inline-flex items-center"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className={`${dim} text-teal-500`}
      >
        <path
          d="M8 1.5L2 4v4c0 3.31 2.56 6.41 6 7 3.44-.59 6-3.69 6-7V4L8 1.5Z"
          fill="currentColor"
          opacity="0.15"
        />
        <path
          d="M8 1.5L2 4v4c0 3.31 2.56 6.41 6 7 3.44-.59 6-3.69 6-7V4L8 1.5Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 8.5l1.75 1.75L10.5 7"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
