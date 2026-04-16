import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { checkIsEducational } from "@/lib/video-validator";

// Allow up to 60 seconds for this route (YouTube + AI calls are slow)
export const maxDuration = 60;

/* ── YouTube Helpers ───────────────────────────────────────────── */
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

async function fetchVideoDetails(videoId: string) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) throw new Error("Missing YOUTUBE_API_KEY in environment");

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${API_KEY}`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error("Failed to fetch video details from YouTube API");
  const data = await res.json();
  if (!data.items || data.items.length === 0) throw new Error("Video not found");

  const snippet = data.items[0].snippet;
  return {
    title:             snippet.title,
    description:       snippet.description,
    channelName:       snippet.channelTitle,
    categoryId:        snippet.categoryId,
    thumbnail:         snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
    thumbnailFallback: snippet.thumbnails?.default?.url,
  };
}

async function fetchYoutubeTranscript(videoId: string): Promise<string> {
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const attempts = [
    () => YoutubeTranscript.fetchTranscript(videoId, { lang: "en" }),
    () => YoutubeTranscript.fetchTranscript(videoId),
    () => YoutubeTranscript.fetchTranscript(canonicalUrl, { lang: "en" }),
    () => YoutubeTranscript.fetchTranscript(canonicalUrl),
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const items = await attempt();
      if (items && items.length > 10) {
        const text = items
            .map((t: any) => t.text.replace(/<[^>]+>/g, "").trim())
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        if (text.length > 100) return text;
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  // Log to Vercel function logs so you can see the real failure
  console.error("[ingest] All transcript attempts failed:", errors);
  throw new Error("No English transcript found for this video. Please ensure the video has English captions enabled.");
}

/* ── Main Route ────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    // Handle YouTube URLs
    const { url } = await req.json();
    if (!url) throw new Error("No URL provided");

    // Default to YouTube
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube URL");

    const [details, transcript] = await Promise.all([
      fetchVideoDetails(videoId),
      fetchYoutubeTranscript(videoId),
    ]);

    // ─── Educational Check ──────────────────────────────────────────
    const validation = await checkIsEducational({
      title: details.title,
      description: details.description,
      channelName: details.channelName,
      categoryId: details.categoryId,
      transcript: transcript,
    });

    if (!validation.isEducational) {
      return NextResponse.json(
        { 
          error: "Non-educational content detected.",
          reason: validation.reason || "LearnLoop only supports tutorials, lectures, and educational content to ensure high-quality learning paths."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      transcript,
      title: details.title,
      channelName: details.channelName,
      thumbnail: details.thumbnail,
      thumbnailFallback: details.thumbnailFallback,
      transcriptLength: transcript.length,
      type: "youtube"
    });

  } catch (err) {
    console.error("[ingest] Route error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process content" },
      { status: 400 }
    );
  }
}
