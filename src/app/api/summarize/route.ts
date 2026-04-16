import { YoutubeTranscript } from "youtube-transcript";

// ============================
// 🔹 Extract Video ID
// ============================
function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  return match ? match[1] : null;
}

// ============================
// 🔹 Get Full Video Metadata via YouTube Data API v3
// ============================
async function getVideoDetails(videoId: string) {
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY) throw new Error("Missing YOUTUBE_API_KEY in environment");

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails,statistics&key=${API_KEY}`
  );

  if (!res.ok) throw new Error("Failed to fetch video details from YouTube API");

  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }

  const video = data.items[0];
  const snippet = video.snippet;
  const stats = video.statistics;
  const contentDetails = video.contentDetails;

  // Parse ISO 8601 duration (e.g. PT1H2M3S)
  const duration = parseISO8601Duration(contentDetails.duration);

  return {
    title: snippet.title,
    description: snippet.description,
    author: snippet.channelTitle,
    channelId: snippet.channelId,
    publishedAt: snippet.publishedAt,
    tags: snippet.tags || [],
    categoryId: snippet.categoryId,
    thumbnails: {
      default: snippet.thumbnails?.default?.url,
      medium: snippet.thumbnails?.medium?.url,
      high: snippet.thumbnails?.high?.url,
      standard: snippet.thumbnails?.standard?.url,
      maxres: snippet.thumbnails?.maxres?.url,
    },
    duration,
    durationRaw: contentDetails.duration,
    viewCount: stats.viewCount,
    likeCount: stats.likeCount,
    commentCount: stats.commentCount,
    language: snippet.defaultAudioLanguage || snippet.defaultLanguage || null,
  };
}

// ============================
// 🔹 Parse ISO 8601 Duration
// ============================
function parseISO8601Duration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "Unknown";

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// ============================
// 🔹 Format Transcript with Timestamps
// ============================
type TranscriptItem = { text: string; offset: number; duration: number };

function formatTranscript(transcript: TranscriptItem[]) {
  return transcript.map((t, i) => ({
    id: i,
    text: t.text,
    offset: t.offset,         // milliseconds
    duration: t.duration,     // milliseconds
    timestamp: formatTime(t.offset),
  }));
}

// ============================
// 🔹 Format ms → HH:MM:SS
// ============================
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ============================
// 🔹 MAIN API FUNCTION
// ============================
export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    // Validate URL
    if (!url || typeof url !== "string") {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // 2. Run metadata + transcript in parallel for speed
    const [details, transcript] = await Promise.all([
      getVideoDetails(videoId),
      YoutubeTranscript.fetchTranscript(videoId).catch(() => null),
    ]);

    // 3. Build transcript data
    let fullText: string | null = null;
    let formattedTranscript: ReturnType<typeof formatTranscript> = [];

    if (transcript && transcript.length > 0) {
      fullText = transcript.map((t) => t.text).join(" ");
      formattedTranscript = formatTranscript(transcript);
    }

    // 4. Return full response
    return Response.json({
      videoId,
      url,

      // 📌 Core Info
      title: details.title,
      author: details.author,
      channelId: details.channelId,
      publishedAt: details.publishedAt,
      duration: details.duration,
      durationRaw: details.durationRaw,
      language: details.language,

      // 🖼️ All Thumbnail Sizes
      thumbnails: details.thumbnails,

      // 📝 Description & Tags
      description: details.description,
      tags: details.tags,
      categoryId: details.categoryId,

      // 📊 Stats
      stats: {
        views: details.viewCount,
        likes: details.likeCount,
        comments: details.commentCount,
      },

      // 📜 Transcript
      hasTranscript: !!fullText,
      fullText,
      transcript: formattedTranscript,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process video";
    console.error("ERROR:", message);

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}