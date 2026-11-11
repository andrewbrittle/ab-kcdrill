// Kanji seen in the Japanese class materials (11 Nov 2026, agreed with
// Andrew). Kanji Cards and the Japanese drill app both mark these - Cards
// reads this file; the drill app gets a copy through
// Language drills/tools/kanji/make-kanji-500.js. Edit it here, then run that.
//
// "Seen in teaching", not "taught": a lighter mark than a word's taught tag.
// One set overall for now, not per lesson (Andrew: no worrying about first,
// last or every occurrence - revise later if needed). Seen kanji come first
// if the list of cards ever grows or swaps.
//   pointed: kanji the class pointed out as kanji (the colour sheet).
//   passing: single kanji seen in passing - printed with readings over them.
//   words:   the same for whole words, as written (the drill app marks its
//            whole-word cards with these: 富士山, 東京, 暑い...).
// Kept in the order first seen; a comment says where from.
window.KANJI_SEEN = {
  pointed: [
    // L4 Lesson 1 (10 Nov): the colours reference sheet.
    '青', '赤', '白', '黒', '黄', '茶', '緑', '紫', '灰', '橙', '桃',
  ],
  passing: [
    // L4 Lesson 1 (10 Nov): the practice sheets and the homework.
    '行', '見', '本', '人', '会', '車', '買', '富', '士', '山', '親', '切', '元', '気',
    '暑', '寒', '暇', '社', '新', '日', '語', '難', '大', '小', '古', '易', '忙', '有',
    '名', '東', '京', '国', '町', '花',
  ],
  words: [
    // L4 Lesson 1 (10 Nov).
    '富士山', '東京', '暑い', '寒い', '新しい', '古い', '大きい', '小さい', '難しい',
    '易しい', '忙しい', '親切', '元気', '有名', '会社', '日本語',
  ],
};
