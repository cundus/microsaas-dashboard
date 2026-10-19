"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export function Avatar({ name, url }: { name: string; url: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (url && failedUrl !== url && /^https?:\/\//i.test(url))
    return (
      <img
        src={url}
        alt={`Avatar ${name}`}
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
        ref={(image) => {
          // An SSR image may fail before React attaches its error handler.
          if (image?.complete && image.naturalWidth === 0) setFailedUrl(url);
        }}
        onError={() => setFailedUrl(url)}
      />
    );
  return (
    <span
      aria-label={`Avatar ${name}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
    >
      {name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "?"}
    </span>
  );
}
