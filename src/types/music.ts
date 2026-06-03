export type MoodAnalysis = {
  mood: string;
  genre: string;
  language: string;
  activity: string;
  energy: number;
  title: string;
  description: string;
  queries: string[];
};

export type Song = {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string;
};

export type Playlist = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  analysis: MoodAnalysis;
  songs: Song[];
  createdAt: string;
};

export type SearchHistoryItem = {
  id: string;
  prompt: string;
  title: string;
  createdAt: string;
};
