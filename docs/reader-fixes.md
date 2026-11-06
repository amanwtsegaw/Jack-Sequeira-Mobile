# Reader fixes — October 30, 2026

## Android chapter exits

The emulator reproduced a native `SIGSEGV` on the JavaScript thread during
study-material navigation. Symbolicating `libhermesvm.so` identified:

- `hermes::vm::CodeBlock::getDebugSourceLocationsOffset()` (`CodeBlock.cpp:190`)
- `hermes::vm::Debugger::runDebugger()` (`Debugger.cpp:238`)
- `hermes::vm::Interpreter::runDebuggerUpdatingState()`

This matches [Hermes issue #2118](https://github.com/meta/hermes/issues/2118),
including the application's RN 0.85.3 / Hermes `250829098.0.10` versions.
The upstream fix was backported in
[Hermes 250829098.0.17](https://github.com/meta/hermes/commit/3477757eb2475555cf8d8df24bfb1deb0613880d).
Android substitutes a local `hermes-patched` module built from the exact
`hermes-v250829098.0.10` sources and RN 0.85.3 JSI headers. The patch adds the three
upstream debugger guards without changing the framework or compiler. Newer
prebuilt Hermes artifacts require newer JSI interfaces and cannot be dropped
into RN 0.85.3. React Native, Hermes V1, and developer tools remain enabled.

The source archive is downloaded once per clean module build and checked against
SHA-256 `0e918d45c53bf8e21aa579122e291f429f4a0c84685ce5fcd2b926499f44b147`.
`patchHermesDebugger.cjs` refuses unexpected source and is idempotent. Initial
native builds take longer because Hermes compiles locally; subsequent builds
reuse Gradle/CMake outputs. Debug enables the debugger; release disables it as
in React Native's own Hermes build configuration.

The latest selection changes also introduced full-chapter overlays and body
isolation. A 25-minute chapter measured approximately 60,000 device pixels tall.
Selection overlay roots now have zero height with visible children; the loading
placeholder is bounded to 360 points and no longer elevated across the chapter.
Height reporting measures the content instead of the viewport, allowing it to
shrink after fonts load. A renderer exit offers a fresh WebView reload and
restores persisted annotations. These changes reduce rendering pressure; they
are separate from the symbolicated Hermes crash.

## Image fonts and annotations

Image export reads the selected font from bundled native assets, embeds it in
the worker as base64, and waits for `FontFace.load()` before measuring or drawing.
Failure to load the font produces an error instead of exporting fallback text.
The quote and labels use the reading and UI fonts respectively.

Annotation segments now choose their background and note independently. A
highlight over part of a note keeps both its color and clickable underline.
The newest color wins when multiple color highlights overlap.

## Verification

- `npm test -- --runInBand`: 31 tests across 11 suites, including renderer reload
  and annotation restoration.
- `npx tsc --noEmit`.
- `node scripts/checkAndroidReaderSelection.cjs`.
- `node scripts/checkReaderRendering.cjs`: shrinking heights, Unicode ranges,
  overlapping notes/highlights, all seven export families, delayed font loads,
  explicit font failures, and safe text serialization.
- Temporary iOS simulator WKWebView harness ran the production export program
  with all seven real bundled fonts. Each font reported loaded and passed
  `document.fonts.check`; all seven generated PNGs. Menbere output was visually
  inspected with Amharic text.
- Live Android WebView checks verified long press, visible selection handles,
  partial highlighting over a note, and unchanged text.
- ARM64 debug and release APK builds passed with the source backport. Runtime
  inspection reported `for RN 0.85.3 (debugger guards)`, bytecode version 98,
  and debugger enabled for the debug build. Debugger attach/reconnect and opening
  the second study chapter completed successfully.
- Standalone release code opened both 3 Angels chapters 1 and 2, returned to the
  chapter list, and scrolled without exiting. A temporary copy was signed with
  the emulator's debug key to preserve installed app data; the original release
  APK retains its release signature.

The original physical Android device was not connected. A rebuilt native APK
is required to pick up the Hermes fix; a Metro refresh alone cannot apply it.

## Physical-phone persistence crash — October 30, 2026

Phone logs at 16:12–16:14 identified a separate `OutOfMemoryError` inside
`ReadableNativeArray.importArray`, called by AsyncStorage `multiSet`. Each reader
progress/settings save serialized the entire offline cache and requested a
roughly 44 MB Java allocation on a 256 MB heap. This is the confirmed cause of
the reported physical-device crashes, distinct from the emulator debugger bug.

Content now has a separate generation manifest and sequential 64 KiB writes.
Unchanged cache references skip serialization and cache writes on settings or
progress saves. User settings, notes, favorites and highlights persist separately
before cache work. Saves are serialized, generation commits occur only after all
chunks succeed, and chunk boundaries preserve Unicode surrogate pairs. Legacy
embedded caches still load and migrate on the next save. The Android SQLite disk
quota is 256 MB to accommodate offline content and two commit generations; this
is a disk limit rather than a heap increase. A duplicate immediate settings save
was removed. Generated cache storage on the phone was approximately 39 MB.

Physical phone verification: chapters 1 and 2 of 3 Angels opened successfully;
font size changed M to L and line height Compact to Comfortable; all actions
kept PID 8479 alive and produced no new crash records. Original reader settings
were restored afterward. Regression coverage verifies bounded writes, skipping
cache rewrites, Unicode reconstruction, settings reload and retained notes.
32 tests across 12 suites passed, along with TypeScript and changed-file lint.
