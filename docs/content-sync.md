# Website content in the mobile app

The app uses `https://jacksequeira.org/api/content`, the Next.js public API in
`jack-sequeira-web/apps/web`. The separate `apps/backend` service is a starter
and is not the website's content backend.

## Public endpoints

- `/catalog?lang=en|am|om|ti|ru`: published series, placement, ordering, and lesson summaries.
- `/series/:slug?lang=...`: the latest lesson list for a series.
- `/lessons/:slug?lang=...`: the full lesson blocks.
- `/media`: audio and video collections.
- `/bible-study`: course sections, shared course overview, all study-room lessons,
  original questions and guidance, and document links.

The app checks on launch, foreground, and every 60 seconds while open. Requests
retry on subsequent checks after connection failures. There are no update alerts.
An open series or lesson is revalidated too; unchanged bodies retain their object
references so background checks do not reset text selection. Published lists take
precedence over bundled lists, including additions, removals, and category moves.
Backend admin publishing already invalidates the website's public content cache.
Content API responses now use `Cache-Control: no-store`.

The last successful results are persisted in AsyncStorage. Bundled English content
and `src/data/bibleStudyRooms.json` provide the initial offline copy. The latter was
exported from the website's current `getBibleStudyCourse`, `studyRoomLessons`, and
shared `course-overview` definitions. It is a fallback; successful API responses
replace it. The app's internal `tm` code maps to the website's `ti` code.

## Study work

Private answers, revealed comparisons, reflection notes, active study, and
completion are saved separately on the device under
`jack-sequeira-bible-study-workbook:en:v1`. Content refreshes never overwrite them.
Reading progress and the last scroll position are saved per study. Reaching the end
marks the study complete automatically. Reopening restores the last position;
the reader never decreases the saved percentage when the user scrolls back up.
Completion can also be toggled explicitly in the course list or study screen.

## Deployment

Deploy the changes in `jack-sequeira-web/apps/web` to the host serving
`jacksequeira.org` for the new Bible study API and enhanced catalog to become live.
The app continues to use its bundled course and existing public endpoints before
that deployment. No production deployment is performed by this code change.

## Verification

- `npm test -- --runInBand`
- `npx tsc --noEmit`
- `node scripts/checkAndroidReaderSelection.cjs`
- Android Metro bundle generation
- Website TypeScript check and local `/api/content/bible-study` response
