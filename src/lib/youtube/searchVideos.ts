import type { MoodAnalysis, Song } from "@/types/music";
import { formatIsoDuration, uid } from "@/lib/utils";

export type YouTubeSearchDebug = {
  hasYouTubeKey: boolean;
  keyPreview: string;
  query?: string;
  source: "youtube" | "demo";
  reason?: string;
  searchStatus?: number;
  detailsStatus?: number;
  itemCount?: number;
};

export type YouTubeSearchResult = {
  songs: Song[];
  debug: YouTubeSearchDebug;
};

const demoSongs: Song[] = [
  { id: "demo-1", videoId: "jfKfPfyJRdk", title: "lofi hip hop radio - beats to relax/study to", channelTitle: "Lofi Girl", thumbnailUrl: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg", duration: "Live" },
  { id: "demo-2", videoId: "5qap5aO4i9A", title: "Chillhop essentials for deep focus", channelTitle: "Chillhop Music", thumbnailUrl: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg", duration: "3:42" },
  { id: "demo-3", videoId: "DWcJFNfaw9c", title: "Bollywood heartbreak acoustic mix", channelTitle: "Moodify Demo", thumbnailUrl: "https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg", duration: "4:18" },
  { id: "demo-4", videoId: "kJQP7kiw5Fk", title: "High energy global pop workout mix", channelTitle: "Ultra Music", thumbnailUrl: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg", duration: "3:48" },
  { id: "demo-5", videoId: "hTWKbfoikeg", title: "Alternative rock coding sprint", channelTitle: "Nirvana", thumbnailUrl: "https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg", duration: "5:01" },
  { id: "demo-6", videoId: "CevxZvSJLk8", title: "Dreamy synth pop evening drive", channelTitle: "Katy Perry", thumbnailUrl: "https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg", duration: "3:57" },
];

type YouTubeSearchItem = {
  id: { videoId?: string };
  snippet: { title: string; channelTitle: string; thumbnails: { high?: { url: string }; medium?: { url: string } } };
};

type YouTubeVideoItem = {
  id: string;
  contentDetails?: { duration?: string };
};

export async function searchVideos(analysis: MoodAnalysis): Promise<YouTubeSearchResult> {
  const key = process.env.YOUTUBE_API_KEY;
  const baseDebug = {
    hasYouTubeKey: Boolean(key),
    keyPreview: key ? `${key.slice(0, 6)}...${key.slice(-4)}` : "missing",
    query: analysis.queries[0],
  };

  console.log("[Moodify][YouTube] helper called with:", {
    title: analysis.title,
    queryCount: analysis.queries.length,
    firstQuery: analysis.queries[0],
    ...baseDebug,
  });

  if (!key) {
    console.warn("[Moodify][YouTube] YOUTUBE_API_KEY missing. Returning demo songs.");
    return {
      songs: demoSongs,
      debug: { ...baseDebug, source: "demo", reason: "YOUTUBE_API_KEY missing" },
    };
  }

  const query = analysis.queries[0];
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("maxResults", "8");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("key", key);

  console.log("[Moodify][YouTube] search request:", {
    query,
    url: searchUrl.toString().replace(key, "[redacted]"),
  });

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    const errorBody = await searchResponse.text();
    console.error("[Moodify][YouTube] search failed:", {
      status: searchResponse.status,
      statusText: searchResponse.statusText,
      body: errorBody,
    });
    return {
      songs: demoSongs,
      debug: {
        ...baseDebug,
        source: "demo",
        reason: `YouTube search failed: ${searchResponse.status} ${searchResponse.statusText}`,
        searchStatus: searchResponse.status,
      },
    };
  }

  const searchJson = (await searchResponse.json()) as { items?: YouTubeSearchItem[] };
  const items = searchJson.items?.filter((item) => item.id.videoId) ?? [];
  const ids = items.map((item) => item.id.videoId).join(",");
  console.log("[Moodify][YouTube] search items:", items.length);

  if (!ids) {
    console.warn("[Moodify][YouTube] no video IDs returned. Returning demo songs.");
    return {
      songs: demoSongs,
      debug: {
        ...baseDebug,
        source: "demo",
        reason: "YouTube search returned no embeddable video IDs",
        searchStatus: searchResponse.status,
        itemCount: 0,
      },
    };
  }

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "contentDetails");
  detailsUrl.searchParams.set("id", ids);
  detailsUrl.searchParams.set("key", key);

  const detailsResponse = await fetch(detailsUrl);
  if (!detailsResponse.ok) {
    console.error("[Moodify][YouTube] details failed:", {
      status: detailsResponse.status,
      statusText: detailsResponse.statusText,
      body: await detailsResponse.text(),
    });
  }

  const detailsJson = detailsResponse.ok ? ((await detailsResponse.json()) as { items?: YouTubeVideoItem[] }) : { items: [] };
  const durations = new Map(detailsJson.items?.map((item) => [item.id, formatIsoDuration(item.contentDetails?.duration)]));

  const songs = items.map((item) => {
    const videoId = item.id.videoId as string;
    return {
      id: uid("song"),
      videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: durations.get(videoId) ?? "3:24",
    };
  });

  return {
    songs,
    debug: {
      ...baseDebug,
      source: "youtube",
      searchStatus: searchResponse.status,
      detailsStatus: detailsResponse.status,
      itemCount: songs.length,
    },
  };
}
