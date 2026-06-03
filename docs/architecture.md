# Moodify AI Architecture

## Product Flow

1. User enters a natural language music prompt on Landing or Discover.
2. `/api/ai/analyze` uses Google AI Studio/Gemini to infer mood, genre, language, activity, playlist title, description, and optimized YouTube search queries.
3. `/api/youtube/search` queries YouTube Data API v3, enriches videos with durations, and normalizes songs.
4. Redux stores the generated playlist, active song, search history, and preferences.
5. Playlist and Dashboard pages read from client state and can save playlist metadata through `/api/playlists/save`.
6. `/api/playlists/save` persists playlist and songs to Supabase PostgreSQL when configured; otherwise it returns a local demo response.

## Folder Structure

```txt
src/
  app/                     Next.js App Router pages and API routes
  components/
    layout/                App chrome and navigation
    music/                 Search, playlist, player, and cards
    sections/              Landing and dashboard sections
    ui/                    Shadcn-style primitives
  features/                Redux slices by product capability
  lib/
    ai/                    OpenAI prompt analysis
    youtube/               YouTube Data API client
    supabase/              Database client
  providers/               Theme and Redux providers
  store/                   Redux store hooks
  types/                   Shared TypeScript contracts
```

## Wireframes

Landing:
```txt
Navigation
Hero search command bar
AI signal chips + animated sample prompts
Featured generated playlist previews
How it works band
```

Discover:
```txt
Prompt search panel | AI analysis summary
Generated playlist grid
Inline YouTube player
Search history rail
```

Playlist:
```txt
Playlist header with save CTA
Song list with thumbnails and durations
Sticky Now Playing embed
```

Dashboard:
```txt
Stats band
Saved/generated playlist cards
Preference controls
Recent searches
```

## Production Notes

- Secrets stay server-side in API routes.
- Client state is optimistic and resilient for demo mode.
- Supabase schema includes RLS policies for user-owned data.
- Playwright specs cover the core product journey using visible UI contracts.
