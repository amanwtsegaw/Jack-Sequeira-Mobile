# Mobile Architecture

## Runtime Flow

1. The app starts with bundled English archive metadata so the reader is never blank.
2. It loads cached settings, lessons, media metadata, notes, highlights, and progress.
3. It requests the latest published catalog and media feed from the Vercel API.
4. Successful responses replace bundled metadata and are retained for offline use.
5. Lesson bodies are fetched only when opened and then cached locally.
6. Audio and video bytes are served by Vercel Blob and YouTube, not the API runtime.

## Public API

| Endpoint | Purpose |
| --- | --- |
| `/api/content/catalog` | Published series summaries for all languages |
| `/api/content/series/:slug?lang=` | Ordered lesson metadata for one series |
| `/api/content/lessons/:slug?lang=` | Structured lesson blocks |
| `/api/content/media` | Current audio and video collections |

All public feeds are cacheable. Admin writes invalidate the affected website page and
the shared media feed.

## Next Engineering Phase

1. Replace the 20.9 MB bundled catalog with a small starter library and SQLite-backed
   incremental synchronization.
2. Split preferences and user annotations from content-cache persistence.
3. Add content revisions or ETags so unchanged lessons are not downloaded again.
4. Add deep links for shared lessons and sermon pages.
5. Add push notifications only after content synchronization is stable.
6. Add optional account sync later; local guest use remains the default.

The separate Express backend should remain undeployed until the product needs
long-running jobs, queues, WebSockets, or independently scaled API ownership.
