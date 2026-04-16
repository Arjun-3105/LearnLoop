"use client";

import Image from "next/image";
import { useState } from "react";

type TranscriptChunk = { id: number; text: string; time: number };
type VideoResult = {
    thumbnail: string;
    title: string;
    author: string;
    transcript: TranscriptChunk[];
    fullText: string;
};

export default function SummarizePage() {
    const [url, setUrl] = useState("");
    const [video, setVideo] = useState<VideoResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        setVideo(null);

        try {
            const res = await fetch("/api/summarize", {
                method: "POST",
                body: JSON.stringify({ url }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setVideo(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 40, maxWidth: 900, margin: "auto" }}>
            <h1>YouTube Learning Extractor</h1>

            {/* INPUT */}
            <div style={{ marginTop: 20 }}>
                <input
                    type="text"
                    placeholder="Paste YouTube link..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    style={{
                        width: "70%",
                        padding: 12,
                        border: "1px solid #ccc",
                        borderRadius: 6,
                    }}
                />

                <button
                    onClick={handleSubmit}
                    style={{
                        marginLeft: 10,
                        padding: "12px 20px",
                        background: "#4f8cff",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                    }}
                >
                    Extract
                </button>
            </div>

            {/* LOADING */}
            {loading && <p style={{ marginTop: 20 }}>Processing video...</p>}

            {/* ERROR */}
            {error && (
                <p style={{ color: "red", marginTop: 20 }}>
                    Error: {error}
                </p>
            )}

            {/* RESULT */}
            {video && (
                <div style={{ marginTop: 30 }}>

                    {/* THUMBNAIL */}
                    <Image
                        src={video.thumbnail}
                        alt="thumbnail"
                        width={900}
                        height={500}
                        style={{ width: "100%", borderRadius: 10, height: "auto" }}
                    />

                    {/* TITLE */}
                    <h2 style={{ marginTop: 15 }}>{video.title}</h2>

                    {/* AUTHOR */}
                    <p style={{ color: "#666" }}>By {video.author}</p>

                    {/* TRANSCRIPT */}
                    <div
                        style={{
                            marginTop: 20,
                            padding: 15,
                            border: "1px solid #ddd",
                            borderRadius: 10,
                            maxHeight: 400,
                            overflowY: "auto",
                            background: "#fafafa",
                        }}
                    >
                        <h3>Transcript</h3>

                        {video.transcript.map((t: TranscriptChunk) => (
                            <p key={t.id} style={{ marginBottom: 10 }}>
                                <b>{Math.floor(t.time)}s:</b> {t.text}
                            </p>
                        ))}
                    </div>

                    {/* FULL TEXT */}
                    <div style={{ marginTop: 20 }}>
                        <h3>Full Content</h3>
                        <p style={{ lineHeight: 1.6 }}>{video.fullText}</p>
                    </div>

                </div>
            )}
        </div>
    );
}