# Kanji Cards — dev notes

Standing reference for whoever (human or Claude) is picking this project
back up. Keep this updated alongside the app, not as an afterthought.

## What this is

No build step, no dependencies beyond the browser. A spaced-repetition-style
kanji flashcard drill app. Originally digitised from the Tuttle *Japanese
Kanji for Beginners* textbook; as of 2026-09-25 it's been moved onto a
**shared 500-kanji master list** that it now has in common with the Kanji
Strokes companion app (see "The 500-kanji master list" below) — the book is
no longer the source of truth for anything. Deliberately kept separate from
the main Japanese-drill-L2 app rather than merged into it — different scope,
different pace.

Hosted on GitHub Pages as a public repo. It used to encrypt the card data at
rest because the book's own wording (meanings, example sentences) was
copyrighted textbook content; that's no longer true (see "Encryption
removed" below), so the data now sits in the file as plain, readable JSON.

## The 500-kanji master list

As of 2026-09-25, kanji-cards and Kanji Strokes are both built from the same
source list, handed over from the Strokes chat as `kanji-master.csv` (500
rows, one per kanji). What changed from the old 430-book-card scheme:

- **Meanings** now come from KANJIDIC2 (EDRDG, CC BY-SA 4.0), not the book's
  own wording — so `m` no longer traces back to the textbook at all.
- **々 was removed** (a repetition mark, not a kanji) — its old card number,
  35, is gone. Any pre-existing local score for id 35 gets silently pruned
  on first load after updating (see `initApp()`).
- **71 kanji were added** to reach exactly 500, covering N4 kanji the book
  skipped plus common everyday kanji. Their card ids are 431–501.
- Two id concepts now exist, and it matters which one code uses where:
  - `n` — the **permanent card id**. Book kanji keep their original book
    number (1–430, minus 35); added kanji are 431–501. **Never renumber
    this** — `scores` in localStorage is keyed by it.
  - `d` — the **display position**, 1–500, contiguous. This is what
    grouping, sorting, block labels and any "#" shown to the user should
    use. Tile `dataset.n` still uses the permanent id (that's the scoring
    key), but block bucketing/labels in `buildGrid()` and the "in order" /
    "by JLPT" groupings all use `d`.
  - `j` — JLPT level (`N5`…`N1`), omitted entirely when a kanji has none.
- Regenerate the whole card-data block from `kanji-master.csv` (via
  `build_cards.py` in scratchpad, not committed — worth adding to the repo)
  if the master list ever changes again, rather than hand-editing cards.

## Example words — regenerated from JMdict, not the book

As of 2026-09-25, **every** card's example words (all 500, not just the 71
new ones) were regenerated from scratch and checked against JMdict (EDRDG,
CC BY-SA 4.0) — nothing from the book's own example sentences remains
anywhere. Andrew's call: rather than keep the old book-sourced words for the
429 existing cards and only source fresh ones for the 71 new cards, do the
full 500 in one pass so the whole deck is consistent and nothing is left
half-migrated.

**Method** (repeatable if the deck changes again): a local JMdict database
(the `jamdict-data` PyPI package ships a ready-built SQLite file —
`jamdict.db`, no XML parsing or the `jamdict` library's build-broken
dependencies needed) was queried directly for exact kanji-form + reading
matches, so every word's reading and English gloss is confirmed against
JMdict rather than typed from memory. Word *choice* itself (which compound,
which reading) still came from knowledge of common Japanese vocabulary —
JMdict verified it, it didn't generate candidates unsupervised (an
unsupervised candidate ranking pass was tried first and produced enough
wrong readings and obscure compounds, e.g. picking rare readings from
multi-reading entries, that it wasn't trustworthy without a curation step).
Picked for: the handover's designated key word first on the 71 new cards,
2–3 words per card generally, on'yomi + kun'yomi coverage where a kanji has
both, and preferring words that reinforce other kanji already in the
500-list.
Romaji was generated with a small hand-rolled Hepburn converter (kana → 
romaji with macrons, tested against the master CSV's own on/kun romaji for
the long-vowel and yōon edge cases) since JMdict only gives kana, not
romanisation.
Scratchpad scripts (not committed, worth adding to the repo if this process
is likely to repeat): `jm.py` (candidate search — the unsupervised first
pass), `lookup.py` (exact kanji+reading → verified JMdict entry, used for
the trusted final pass), `romaji.py`, `build_cards.py` (assembles the final
card array from `kanji-master.csv` + the verified words).

## Encryption removed

As of 2026-09-25, encryption is gone entirely — no unlock screen,
no passphrase, no `crypto.subtle`, no `ENCRYPTED_CARDS`. `KANJI_CARDS` is
now a plain `const` array baked straight into `index.html`. Rationale:
encryption existed only to keep the book's own copyrighted wording out of
search-indexable text in a public repo; with meanings now from KANJIDIC2 and
example words from JMdict, nothing traceable to the book remains, so there
was nothing left worth hiding. This matches what Kanji Strokes already does.

If old browser storage still has a `kanjiCardsDecryptedV1` cache key from
before this change, it's simply unused now — nothing reads or writes it any
more, and it isn't worth a migration step to clean up.

## Three ways to browse

- **In order**: blocks of 20 by display position (`d`), five blocks per home
  pill (1–100 … 401–500).
- **By part**: kanji sharing a component, pre-computed by the Strokes app
  from KanjiVG data and handed over as `PART_GROUPS_DATA` (98 groups,
  covering 434 of 500 cards as of the 500-kanji list). Renders as one flat
  tile grid (`buildGrid('flat')`), not block-headed — the cards in a part
  group span many blocks in a meaningful, non-numeric order, so block
  headers would just chop that back into numeric sub-runs.
- **By JLPT**: added 2026-09-25, mirroring the same feature in Strokes. One
  pill per level (N5 79 · N4 166 · N3 187 · N2 52 · N1 11 · No JLPT level 5),
  blocks of 20 inside each in display order — same block mechanics as "in
  order", just pre-filtered to that level's cards first
  (`computeJlptGroups()`).
  **Deliberately not shown on the tile-selection grids** — Andrew's call,
  after seeing Strokes put a small JLPT tag in the corner of every tile and
  finding it messy at that density. Here the level only shows up once,
  as a small badge next to the stroke count on the *back* of a card
  (`jlptTagHtml()` in `backHtml()`), styled dim for N5–N3 and gold
  (`--accent`) for N2/N1 — Andrew likes seeing the harder levels show up.
- Regenerate the by-part handover note from the Strokes chat, not here,
  whenever the deck's card count or ids change; JLPT groups regenerate
  themselves automatically from each card's own `j` field.

## File layout — a real folder, not one file

```
kanji-cards/
  index.html
  manifest.json
  sw.js
  icons/icon-192.png
  icons/icon-512.png
  icons/icon-512-maskable.png
  icons/apple-touch-icon.png
  fonts/BizUDPGothic-Regular.ttf
```
**Upload the whole folder, not just `index.html`.** The reason: a
`data:application/manifest+json;base64,…` manifest link is fine for iOS
Safari's Add to Home Screen, but **Chrome on Android refuses to treat a
data-URI manifest as installable** — "Install" only ever offered a bare
shortcut, not a real app. Real files fix that. After uploading, delete any
old home-screen shortcut first and use **Install app** from Chrome's menu —
an existing shortcut doesn't upgrade itself.

- **Icons**: gold `#e8c97a` 字 on `#0f0f0f`, same visual language as
  Strokes' 書. `icon-512.png` is the normal (non-maskable) icon; separately,
  `icon-512-maskable.png` has the glyph scaled down to ~45% width so
  Android's circle/squircle crop doesn't clip it — regenerate that one with
  extra padding if the glyph or colours ever change, don't just reuse the
  plain 512.
- **Font**: `fonts/BizUDPGothic-Regular.ttf`, self-hosted so kana/kanji
  shapes never fall back to a device font and so it works offline, same
  reasoning as the main drill app.
- **Offline**: `sw.js`, **always on** since 2026-10-16 (there used to be a
  Settings → "Work offline" toggle; removed to match the other two apps -
  see "Brought up to parity" below). Network-first with a 3-second
  timeout, falling back to cache; each file cached separately, not via
  `addAll()`; navigations fall back to cached `index.html`. Cache name is
  `kanji-cards-vYYMMDD.NNN` — **bump `CACHE_VERSION` in `sw.js` alongside
  every version bump in `index.html`**, or offline users keep seeing a
  stale copy. `syncServiceWorker()` just registers the worker once at load
  now; there's no unregister path any more.

## Versioning

`vYYMMDD.NNN` shown at the bottom of the Settings screen, matching the main
app's convention. Bump it on *every* edit, however small — it's there so
you can glance at the footer and confirm the browser actually loaded the
version you think it did (especially useful after a GitHub Pages deploy or
an installed-PWA sync), not to flag "there's something new to look at."

No git repo history backs this up yet — every change is currently a full-file
swap via chat. Worth moving to real commits in the GitHub repo at some point
so changes are diffable and revertible; the version stamp is a stopgap, not
a replacement for that.

## Data schema

Each card:
```js
{
  n: 431,            // permanent card id - scores are keyed by this, never renumber
  d: 33,              // display position, 1-500 - use this for sorting/grouping/"#" labels
  k: '息',            // the kanji character
  m: 'Breath, son',   // English meaning (KANJIDIC2, British spelling)
  s: 10,              // stroke count
  j: 'N3',            // JLPT level - omitted entirely if the kanji has none
  on: [['ソク','soku']],           // on-yomi readings: [kana, romaji]
  kun: [['いき','iki']],           // kun-yomi readings: [kana, romaji]
  w: [                              // example words, all JMdict-verified
    { jp: 'むすこ', romaji: 'musuko', en: 'son', kanji: '息子' },
    ...
  ]
}
```
The `bonus` flag on word entries (marking a word not in the book) is dead
now that nothing comes from the book - no current card sets it, but
`wordsHtml()` still checks for it harmlessly. Fine to remove if it's ever
confusing.

## Attribution

Settings screen credits: *Meanings and kanji data from KANJIDIC2, example
words checked against JMdict — both © EDRDG, CC BY-SA 4.0.*

## Key design decisions

- **Weak 20 vs Untested 20 are non-overlapping.** Weak = tested and
  lowest-scoring. Untested = never scored at all. Deliberately kept
  separate rather than folding untested into "weak," since never having
  been asked isn't the same as having got it wrong.
- **Progress bar defaults to hiding untested**, rescaling to 100% across
  just the tested cards ("of what you've seen so far, how are you doing").
  Tap the bar to toggle the full picture (untested included) back on —
  choice persists via `settings.showUntestedBar`. The legend underneath
  always shows all four figures regardless of the toggle.
- **Groups are keyed by display position `d`, not permanent id `n`**
  (`BLOCK_SIZE = 20`, `BLOCKS_PER_PILL = 5` → 100 cards per home pill),
  computed dynamically so the pills scale automatically if the deck
  changes. This matches the stroke-trainer companion app's own "in order"
  grouping (blocks of 20, five blocks per pill) so scores/selections line
  up between the two apps.
- **Second browsing mode: by shared kanji part** (`PART_GROUPS_DATA`,
  toggled via the "In order" / "By part" / "By JLPT" tabs on the home
  screen). 98 groups covering 434 of 500 cards, handed over pre-computed
  from the stroke trainer (it derives these from KanjiVG's per-kanji SVG
  component groups — this app has no reason to carry that data itself).
  Card order within a group is the handover's own (the shared part's card
  first, if it's one of the 500), not renumbered — preserved as-is rather
  than re-sorted. **Regenerate the handover note in the trainer's own
  chat, not here, whenever the deck changes**, and paste the new
  `PART_GROUPS_DATA` array in.
- Part groups render as one flat tile grid (`buildGrid('flat')`) rather
  than block-headed like the in-order/JLPT groups (`buildGrid('blocks')`) —
  cards in a part group span many blocks in a meaningful, non-numeric
  order, so block headers would just chop that order back into numeric
  sub-runs.
- **Third browsing mode: by JLPT level**, added 2026-09-25 mirroring
  Strokes — but *not* mirroring its tile-level JLPT tag, which Andrew found
  too busy on a full grid of tiles. The level shows up on the card back
  instead, once you're already looking at one card. See "Three ways to
  browse" above.
- **Study mode** is a boolean toggle (`settings.study`), not a separate
  screen — shared state between the home and group-select screens.
- **Meaning→kanji mode is hidden, not deleted** (`FEATURES.meaningMode =
  false`) — no reliable way to self-check a mental image of a kanji
  against "got it right." Code and storage key remain in place in case
  that changes.

## Cross-referencing with the main app

`check-kanji-gaps.js` (scratchpad only, not committed) used to decrypt this
app's card data and cross-check it against the main app's
`kanjiReadingBlocked` entries. **It needs rework** now that there's nothing
to decrypt and the id scheme has changed (429→500 cards, `n` no longer
matches "book card number" 1:1 for every card) — don't trust it as-is until
that's done.

**Edits to the main app's `index.html` should go through its own separate
chat**, not this one — it has its own PWA manifest version that needs
bumping alongside any data change, which this project doesn't track.

## Parked ideas

- A gold marker for "kanji you've never encountered anywhere in the main
  app" — shelved for now by Andrew's own call ("liking the cleanness of the
  cards"), not for lack of value. Revisit if it keeps coming up. Would need
  re-deriving now that the id scheme has changed.

## Brought up to parity with the sister apps (2026-10-16)

Worked from `HANDOVER-to-kanji-cards.md` (dropped into this folder from the
Kanji Strokes chat), which carried forward work originally done in the
Japanese Drill app. Six things ported in:

- **Small kana.** Cards had *no* small-kana handling at all before this —
  readings and example words went straight through plain `esc()`, so っ ゃ
  ゅ ょ etc. drew almost full size in BIZ UDPGothic (ちょっと read as
  chi-yo-tsu-to). Added `jpHtml(str)` / `setJp(el, str)` (wraps each small
  kana in `<span class="small-kana">`, CSS `font-size: 0.65em`) and switched
  every Japanese-text call site to it: the tile grid, word kanji/reading,
  on/kun readings, the card face (front and back), and the missed-kanji
  list on Results. **Standing rule, matching the other two apps: every new
  piece of Japanese text goes through `jpHtml()`/`setJp()`, never a raw
  `esc()`/`textContent`.** English meanings and romaji stay on plain `esc()`.
- **No auto-translate.** `<html lang="en" translate="no" class="notranslate">`
  plus `<meta name="google" content="notranslate">` — a phone set to
  translate Japanese pages could otherwise mangle text on the page (this
  bit the Drill app once: は became "teeth").
- **Offline always on.** Removed the Settings "Work offline" toggle
  entirely (deleted the stored key on load too, so an old `true`/`false`
  can't resurface); `syncServiceWorker()` now just registers `sw.js`
  unconditionally. Safe because `sw.js` is already network-first.
  `CACHE_VERSION` bumped to `kanji-cards-v261016-001` and its header
  comment updated to drop the "opt-in" wording.
- **Install card + share card**, both in Settings. The install card
  (`refreshInstallCard()`) shows device-appropriate install steps whenever
  the app isn't already running standalone, with a real Install button on
  Android/desktop Chrome (`beforeinstallprompt`). The share card has an
  inline SVG QR code (generated with `segno`, medium error correction, no
  external image) linking to `ab-kcdrill`, plus links to the Japanese Drill
  app and Kanji Strokes. `manifest.json` got an `"id": "./index.html"`
  above `start_url` so the installed app keeps its identity if `start_url`
  ever changes.
- **Back navigation**, replacing the old hardcoded "← Home" / "← Back"
  buttons. `navStack`/`navRecord`/`navBack`/`NAV_RESTORE` (same scheme as
  Strokes and the Drill app): Home is the only main page; Select and
  Settings are stack-aware inner pages with a dynamic "← …" link at the top
  (Settings' back button moved from the bottom to match); Drill and Results
  are never stepped back *into*, but Back pressed *while* in either of them
  now reuses `quitDrill()`'s existing "go back to wherever this drill was
  started" logic — including from the phone's hardware/gesture back
  button, wired via `popstate`, which the app didn't handle at all before.
  Settings opened mid-drill or mid-results still returns to it exactly as
  left.
- **Hold to peek, with read-aloud.** Holding a tile on the Select screen
  for ~0.45s shows a bubble with the kanji's meaning, stroke count, JLPT
  level and on/kun readings, and speaks the readings aloud
  (`speechSynthesis`, `ja-JP`); letting go closes it, a quick tap still
  selects the tile, and a finger that moves >16px cancels the hold instead
  of opening it. A sound button next to ⚙ in the header mutes all of this
  (`settings.soundOn`). **Unlike Strokes' version of this bubble, Cards'
  does not draw the stroke order** — Cards has no KanjiVG stroke-path data
  (that's deliberately Strokes' job, not duplicated here), so the bubble is
  text-and-speech only. Only attached to Select-screen tiles, deliberately
  never to the drill/flashcard face itself — that would give the answer
  away mid-quiz.

**Not carried over, flagged for Andrew:** section 7 of the handover
(instructions page + changelog wording) assumes an in-app "How this works"
page and a `changelog.html`, the way the Drill app and Strokes have — Cards
has neither right now. Nothing was invented to fill that gap; worth a
separate decision whether Cards wants one, rather than bolting on new UI
chrome as a side effect of this pass.

## History

- Originally transcribed from `JK4B_Flashcard_Front.pdf` /
  `JK4B_Flashcard_Back.pdf` (Tuttle *Japanese Kanji for Beginners*, 29
  pages, 15 cards per page except the last) — 430 cards, transcription
  completed across several sessions.
- 2026-09-24: converted from a single `kanji-cards.html` file to a proper
  installable folder-based PWA (see "File layout" above); grouping moved
  from book pages to card-number blocks; added the by-part browsing mode.
- 2026-09-25: moved onto the shared 500-kanji master list with Kanji
  Strokes (meanings from KANJIDIC2, 71 kanji added, 々 removed); all 500
  cards' example words regenerated from JMdict; encryption removed
  entirely; added the by-JLPT browsing mode (level shown on the card back
  only, not on tiles).
- 2026-10-16: brought up to parity with Kanji Strokes and the Japanese
  Drill app — small-kana fix (previously entirely missing), no
  auto-translate, offline always on (Work-offline toggle removed), install
  + share cards with an inline QR code, a proper back-navigation scheme
  with phone-gesture support, and hold-to-peek with read-aloud (text only,
  no stroke animation).
