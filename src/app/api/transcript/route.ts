import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

/* ── extract video ID from any YouTube URL format ─────────────────── */
function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    const shorts = u.pathname.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
    if (shorts) return shorts[1];
    const embed  = u.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
    if (embed)  return embed[1];
    return u.searchParams.get("v");
  } catch {
    const m = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
}

/* ── fetch oEmbed metadata (title + channel, no API key) ──────────── */
async function fetchVideoMeta(videoId: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("oembed failed");
    const d = await res.json() as { title?: string; author_name?: string; thumbnail_url?: string };
    return {
      title:             d.title       ?? "YouTube Video",
      channelName:       d.author_name ?? "",
      thumbnail:         `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      thumbnailFallback: d.thumbnail_url ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return {
      title: "YouTube Video",
      channelName: "",
      thumbnail:         `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailFallback: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

/* ── fetch transcript — English preferred, clean text only ────────── */
async function fetchTranscript(videoId: string): Promise<string> {
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Try English first, then any available language
  const attempts = [
    () => YoutubeTranscript.fetchTranscript(canonicalUrl, { lang: "en" }),
    () => YoutubeTranscript.fetchTranscript(canonicalUrl),
  ];

  for (const attempt of attempts) {
    try {
      const items = await attempt();
      if (items && items.length > 10) {
        // Strip HTML tags that sometimes appear in auto-captions
        const text = items
          .map((t) => t.text.replace(/<[^>]+>/g, "").trim())
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (text.length > 100) return text;
      }
    } catch { /* try next */ }
  }

  throw new Error(
    "No English transcript found for this video. " +
    "Make sure the video has subtitles/captions enabled (auto-generated is fine)."
  );
}

/* ── route handler ────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url?: string };

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "A YouTube URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not find a YouTube video ID in that URL. Use a standard youtube.com/watch?v=... link." },
        { status: 400 }
      );
    }

    // Fetch metadata and transcript in parallel
    const [meta, transcript] = await Promise.all([
      fetchVideoMeta(videoId),
      fetchTranscript(videoId),
    ]);

    return NextResponse.json({
      transcript,
      videoId,
      title:             meta.title,
      channelName:       meta.channelName,
      thumbnail:         meta.thumbnail,
      thumbnailFallback: meta.thumbnailFallback,
      transcriptLength:  transcript.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch transcript" },
      { status: 400 }
    );
  }
}
