# Kanji Cards — dev notes

Standing reference for whoever (human or Claude) is picking this project
back up. Keep this updated alongside the app, not as an afterthought.

## What this is

A single self-contained `kanji-cards.html` file — no build step, no
dependencies beyond the browser. Digitises the ~430 kanji flashcards from
the Tuttle *Japanese Kanji for Beginners* textbook (`JK4B_Flashcard_Front.pdf`
/ `JK4B_Flashcard_Back.pdf`) into a spaced-repetition-style drill app.
Deliberately kept separate from the main Japanese-drill-L2 app rather than
merged into it — different scope, different pace.

Hosted on GitHub Pages as a public repo, which is why the card data is
encrypted at rest (see below) rather than sitting in the file as plain text.

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
  n: 1,             // card number in the book (1-indexed, matches the PDF)
  k: '一',           // the kanji character
  m: 'One',          // English meaning (as printed on the back)
  s: 1,              // stroke count
  on: [['イチ','ichi']],           // on-yomi readings: [kana, romaji]
  kun: [['ひと','hito'], ...],     // kun-yomi readings: [kana, romaji]
  w: [                              // example words
    { jp: 'いち', romaji: 'ichi', en: 'one', kanji: '一' },
    { jp: 'いちにちめ', romaji: 'ichinichime', en: 'first day',
      kanji: '一日目', bonus: true }   // bonus: true = word not in the book,
  ]                                    // added because it felt useful
}
```
Word entries used to be positional tuples `[jp, romaji, en, kanji, bonus?]`
up to card 150 — migrated to the object shape above via a scripted
transform (not manual retyping, to avoid introducing new typos) once
positional indices in `wordsHtml()` started feeling error-prone.

## Encryption

AES-256-GCM via the browser's native `crypto.subtle`, key derived with
PBKDF2-SHA256 (300,000 iterations) from a passphrase. The passphrase is
**never** written to this file, this repo, or any file that gets committed
— it lives only in chat history and Andrew's own record of it. Re-derive
the `ENCRYPTED_CARDS` block (fresh random salt + IV, never reuse an IV
under the same key) any time the card data changes; see
`check-kanji-gaps.js` below for a working example of the decrypt side.

Threat model, explicitly: this deters casual browsing and search-engine
indexing of a public repo. It does **not** defend against a targeted
attacker — the decryption code ships in the same public file. That's a
deliberate, accepted trade-off, not an oversight.

On unlock, the decrypted plaintext is cached in `localStorage`
(`kanjiCardsDecryptedV1`) so the passphrase is only needed once per device.

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
- **Page groups are computed dynamically** (`PAGE_SIZE = 15`,
  `PAGES_PER_GROUP = 5` → 75 cards per pill), not hardcoded, so the group
  pills scale automatically as more cards are added.
- **Transcription batches should match a full group (75 cards / 5 source
  pages)** where practical, so a pill doesn't sit half-populated between
  sessions. Established after a couple of smaller 2-page batches left the
  "Page 6–10" pill uneven for a while.
- **Study mode** is a boolean toggle (`settings.study`), not a separate
  screen — shared state between the home and group-select screens.
- **Meaning→kanji mode is hidden, not deleted** (`FEATURES.meaningMode =
  false`) — no reliable way to self-check a mental image of a kanji
  against "got it right." Code and storage key remain in place in case
  that changes.

## Cross-referencing with the main app

`check-kanji-gaps.js` (currently only in a scratchpad, not committed —
worth adding to the repo) decrypts this app's card data and checks it
against the main app's `kanjiReadingBlocked` entries, specifically the
"one of this word's kanji doesn't have a recorded reading yet" ones,
reporting which are now fully resolvable. Re-run it whenever this app's
card data grows:
```
node check-kanji-gaps.js <kanji-cards.html> <main-app-index.html> <passphrase>
```
As of card 225: 33 of 125 total blocked main-app entries are blocked for
that specific reason; 1 (内回り) has been resolved and applied to the main
app so far. The rest need kanji outside this deck's current coverage.

**Edits to the main app's `index.html` should go through its own separate
chat**, not this one — it has its own PWA manifest version that needs
bumping alongside any data change, which this project doesn't track.

## Parked ideas

- A gold marker for "kanji you've never encountered anywhere in the main
  app" (the ~25% / 38-of-150-at-the-time "absent" set) — shelved for now
  by Andrew's own call ("liking the cleanness of the cards"), not for lack
  of value. Revisit if it keeps coming up.

## Source files

- `JK4B_Flashcard_Front.pdf` / `JK4B_Flashcard_Back.pdf` — 29 pages each,
  15 cards per page, ~435 cards total. Currently transcribed: cards 1–225
  (pages 1–15).
