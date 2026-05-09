"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tags, soloLeveling, omniscientReader, onePiece, towerOfGod, tbate, talesDemonsGods, soloLevelingChapters, i, chapter, pageCount, pages, j, onePieceChapters, i, chapter, pageCount, pages, j, i, chapter, pages, j, demoUser, favoritesFolder, today, i, date, chaptersRead;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting database seed...');
                    // Cleanup existing data
                    console.log('Cleaning up existing data...');
                    return [4 /*yield*/, prisma.userReadingStat.deleteMany()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma.review.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.folderComic.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.folder.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.comment.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.readingProgress.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.page.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.chapter.deleteMany()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.comicTag.deleteMany()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, prisma.tag.deleteMany()];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, prisma.comic.deleteMany()];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, prisma.subscription.deleteMany()];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 13:
                    _a.sent();
                    // Create sample tags
                    console.log('Creating tags...');
                    return [4 /*yield*/, Promise.all([
                            prisma.tag.create({ data: { name: 'Fantasy', type: 'Theme' } }),
                            prisma.tag.create({ data: { name: 'Action', type: 'Theme' } }),
                            prisma.tag.create({ data: { name: 'Romance', type: 'Theme' } }),
                            prisma.tag.create({ data: { name: 'Isekai', type: 'Theme' } }),
                            prisma.tag.create({ data: { name: 'Harem', type: 'Demographic' } }),
                            prisma.tag.create({ data: { name: 'Horror', type: 'Theme' } }),
                            prisma.tag.create({ data: { name: 'Comedy', type: 'Theme' } }),
                            prisma.tag.create({ data: { name: 'Drama', type: 'Theme' } }),
                            prisma.tag.create({ data: { name: 'Supernatural', type: 'Theme' } }),
                            prisma.tag.create({ data: { name: 'Seinen', type: 'Demographic' } }),
                        ])];
                case 14:
                    tags = _a.sent();
                    console.log("\u2713 Created ".concat(tags.length, " tags"));
                    // Create sample comics
                    console.log('Creating comics...');
                    return [4 /*yield*/, prisma.comic.create({
                            data: {
                                title: 'Solo Leveling',
                                slug: 'solo-leveling',
                                origin: client_1.Origin.KR,
                                type: 'Manhwa',
                                status: client_1.Status.COMPLETED,
                                description: '10 years ago, after "the Gate" that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate. They are known as "Hunters". However, not all Hunters are powerful. My name is Sung Jin-Woo, an E-rank Hunter. I\'m someone who has to risk his life in the lowliest of dungeons, the "World\'s Weakest". Having no skills whatsoever to display, I barely earned the required money by fighting in low-leveled dungeons… at least until I found a hidden dungeon with the hardest difficulty within the D-rank dungeons! In the end, as I was accepting death, I suddenly received a strange power, a quest log that only I could see, a secret to leveling up that only I know about! If I trained in accordance with my quests and hunted monsters, my level would rise. Changing from the weakest Hunter to the strongest S-rank Hunter!',
                                coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9c/Solo_Leveling_Webtoon_cover.png',
                                altTitles: {
                                    korean: '나 혼자만 레벨업',
                                    japanese: '俺だけレベルアップな件',
                                },
                                tags: {
                                    create: [
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Fantasy'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Action'; }).id } } },
                                    ],
                                },
                            },
                        })];
                case 15:
                    soloLeveling = _a.sent();
                    return [4 /*yield*/, prisma.comic.create({
                            data: {
                                title: "Omniscient Reader's Viewpoint",
                                slug: 'omniscient-readers-viewpoint',
                                origin: client_1.Origin.KR,
                                type: 'Manhwa',
                                status: client_1.Status.ONGOING,
                                description: '"This is a development that I know of." The moment he thought that, the world had been destroyed, and a new universe had unfolded. The new life of an ordinary reader begins within the world of the novel, a novel that he alone had finished.',
                                coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Omniscient_Reader_Webtoon_cover.jpg',
                                altTitles: {
                                    korean: '전지적 독자 시점',
                                },
                                tags: {
                                    create: [
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Fantasy'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Action'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Drama'; }).id } } },
                                    ],
                                },
                            },
                        })];
                case 16:
                    omniscientReader = _a.sent();
                    return [4 /*yield*/, prisma.comic.create({
                            data: {
                                title: 'One Piece',
                                slug: 'one-piece',
                                origin: client_1.Origin.JP,
                                type: 'Manga',
                                status: client_1.Status.ONGOING,
                                description: 'Monkey D. Luffy refuses to let anyone or anything stand in the way of his quest to become king of all pirates. With a course charted for the treacherous waters of the Grand Line, this is one captain who\'ll never drop anchor until he\'s claimed the greatest treasure on Earth—the Legendary One Piece!',
                                coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg',
                                altTitles: {
                                    japanese: 'ワンピース',
                                },
                                tags: {
                                    create: [
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Action'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Comedy'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Fantasy'; }).id } } },
                                    ],
                                },
                            },
                        })];
                case 17:
                    onePiece = _a.sent();
                    return [4 /*yield*/, prisma.comic.create({
                            data: {
                                title: 'Tower of God',
                                slug: 'tower-of-god',
                                origin: client_1.Origin.KR,
                                type: 'Webtoon',
                                status: client_1.Status.ONGOING,
                                description: 'What do you desire? Money and wealth? Honor and pride? Authority and power? Revenge? Or something that transcends them all? Whatever you desire—it',
                                s: s,
                                here: here,
                                : ., ',: coverImageUrl,
                                'https://upload.wikedia.org/wikipedia/en/5/59/Tower_of_God_Volume_1_Cover.jpg': ,
                                altTitles: {
                                    korean: '신의 탑',
                                },
                                tags: {
                                    create: [
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Fantasy'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Action'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Drama'; }).id } } },
                                    ],
                                },
                            },
                        })];
                case 18:
                    towerOfGod = _a.sent();
                    return [4 /*yield*/, prisma.comic.create({
                            data: {
                                title: 'The Beginning After The End',
                                slug: 'the-beginning-after-the-end',
                                origin: client_1.Origin.KR,
                                type: 'Manhwa',
                                status: client_1.Status.ONGOING,
                                description: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power. Beneath the glamorous exterior of a powerful king lurks the shell of man, devoid of purpose and will. Reincarnated into a new world filled with magic and monsters, the king has a second chance to relive his life.',
                                coverImageUrl: 'https://i.imgur.com/5qKZLRy.jpg',
                                tags: {
                                    create: [
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Fantasy'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Action'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Isekai'; }).id } } },
                                    ],
                                },
                            },
                        })];
                case 19:
                    tbate = _a.sent();
                    return [4 /*yield*/, prisma.comic.create({
                            data: {
                                title: 'Tales of Demons and Gods',
                                slug: 'tales-of-demons-and-gods',
                                origin: client_1.Origin.CN,
                                type: 'Manhua',
                                status: client_1.Status.ONGOING,
                                description: 'Killed by a Sage Emperor and reborn as his 13 year old self, Nie Li was given a second chance at life. A second chance to change everything, save his loved ones and his beloved city from the insidious demon beasts.',
                                coverImageUrl: 'https://i.imgur.com/8KjGZlY.jpg',
                                altTitles: {
                                    chinese: '妖神记',
                                    pinyin: 'Yāo Shén Jì',
                                },
                                tags: {
                                    create: [
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Fantasy'; }).id } } },
                                        { tag: { connect: { id: tags.find(function (t) { return t.name === 'Action'; }).id } } },
                                    ],
                                },
                            },
                        })];
                case 20:
                    talesDemonsGods = _a.sent();
                    console.log("\u2713 Created 6 comics");
                    // Create sample chapters for Solo Leveling
                    console.log('Creating chapters for Solo Leveling...');
                    soloLevelingChapters = [];
                    i = 1;
                    _a.label = 21;
                case 21:
                    if (!(i <= 5)) return [3 /*break*/, 25];
                    return [4 /*yield*/, prisma.chapter.create({
                            data: {
                                comicId: soloLeveling.id,
                                number: i,
                                title: "Chapter ".concat(i),
                                slug: "chapter-".concat(i),
                                releaseDate: new Date(2023, 0, i),
                                pageMode: client_1.PageMode.STRIP,
                                isLocked: false,
                            },
                        })];
                case 22:
                    chapter = _a.sent();
                    soloLevelingChapters.push(chapter);
                    pageCount = 50;
                    pages = [];
                    for (j = 1; j <= pageCount; j++) {
                        pages.push({
                            chapterId: chapter.id,
                            orderIndex: j,
                            imageUrl: "https://picsum.photos/800/1200?random=".concat(i * 100 + j),
                            width: 800,
                            height: 1200,
                        });
                    }
                    return [4 /*yield*/, prisma.page.createMany({ data: pages })];
                case 23:
                    _a.sent();
                    _a.label = 24;
                case 24:
                    i++;
                    return [3 /*break*/, 21];
                case 25:
                    console.log("\u2713 Created ".concat(soloLevelingChapters.length, " chapters with pages for Solo Leveling"));
                    // Create chapters for One Piece (manga with PAGE mode)
                    console.log('Creating chapters for One Piece...');
                    onePieceChapters = [];
                    i = 1;
                    _a.label = 26;
                case 26:
                    if (!(i <= 3)) return [3 /*break*/, 30];
                    return [4 /*yield*/, prisma.chapter.create({
                            data: {
                                comicId: onePiece.id,
                                number: i,
                                title: "Chapter ".concat(i, ": Romance Dawn"),
                                slug: "chapter-".concat(i),
                                releaseDate: new Date(2023, 0, i),
                                pageMode: client_1.PageMode.PAGE,
                                isLocked: false,
                            },
                        })];
                case 27:
                    chapter = _a.sent();
                    onePieceChapters.push(chapter);
                    pageCount = 18;
                    pages = [];
                    for (j = 1; j <= pageCount; j++) {
                        pages.push({
                            chapterId: chapter.id,
                            orderIndex: j,
                            imageUrl: "https://picsum.photos/800/1200?random=".concat(1000 + i * 100 + j),
                            width: 800,
                            height: 1200,
                        });
                    }
                    return [4 /*yield*/, prisma.page.createMany({ data: pages })];
                case 28:
                    _a.sent();
                    _a.label = 29;
                case 29:
                    i++;
                    return [3 /*break*/, 26];
                case 30:
                    console.log("\u2713 Created ".concat(onePieceChapters.length, " chapters for One Piece"));
                    // Create chapters for Tower of God
                    console.log('Creating chapters for Tower of God...');
                    i = 1;
                    _a.label = 31;
                case 31:
                    if (!(i <= 3)) return [3 /*break*/, 35];
                    return [4 /*yield*/, prisma.chapter.create({
                            data: {
                                comicId: towerOfGod.id,
                                number: i,
                                title: "Season 1 - Chapter ".concat(i),
                                slug: "s1-chapter-".concat(i),
                                releaseDate: new Date(2023, 0, i),
                                pageMode: client_1.PageMode.STRIP,
                            },
                        })];
                case 32:
                    chapter = _a.sent();
                    pages = [];
                    for (j = 1; j <= 60; j++) {
                        pages.push({
                            chapterId: chapter.id,
                            orderIndex: j,
                            imageUrl: "https://picsum.photos/800/1200?random=".concat(2000 + i * 100 + j),
                            width: 800,
                            height: 1200,
                        });
                    }
                    return [4 /*yield*/, prisma.page.createMany({ data: pages })];
                case 33:
                    _a.sent();
                    _a.label = 34;
                case 34:
                    i++;
                    return [3 /*break*/, 31];
                case 35:
                    console.log("\u2713 Created 3 chapters for Tower of God");
                    // Create a demo user
                    console.log('Creating demo user...');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'demo@omniread.io',
                                username: 'DemoUser',
                                settings: {
                                    theme: 'dark',
                                    dataSaver: false,
                                    readingDirection: 'ltr',
                                },
                            },
                        })];
                case 36:
                    demoUser = _a.sent();
                    console.log("\u2713 Created demo user: ".concat(demoUser.username));
                    // Create sample reading progress
                    return [4 /*yield*/, prisma.readingProgress.create({
                            data: {
                                userId: demoUser.id,
                                chapterId: soloLevelingChapters[0].id,
                                pageNumber: 25,
                                scrollPercentage: 50.0,
                            },
                        })];
                case 37:
                    // Create sample reading progress
                    _a.sent();
                    // Create sample custom folder
                    console.log('Creating custom folders...');
                    return [4 /*yield*/, prisma.folder.create({
                            data: {
                                userId: demoUser.id,
                                name: 'Favorites',
                                order: 1,
                                comics: {
                                    create: [
                                        { comicId: soloLeveling.id },
                                        { comicId: omniscientReader.id },
                                        { comicId: onePiece.id },
                                    ],
                                },
                            },
                        })];
                case 38:
                    favoritesFolder = _a.sent();
                    console.log("\u2713 Created folder: ".concat(favoritesFolder.name, " with 3 comics"));
                    // Create sample reviews
                    return [4 /*yield*/, prisma.review.create({
                            data: {
                                userId: demoUser.id,
                                comicId: soloLeveling.id,
                                recommend: true,
                                comment: 'Amazing story and art! The power progression is so satisfying.',
                            },
                        })];
                case 39:
                    // Create sample reviews
                    _a.sent();
                    return [4 /*yield*/, prisma.review.create({
                            data: {
                                userId: demoUser.id,
                                comicId: onePiece.id,
                                recommend: true,
                                comment: 'Classic adventure that never gets old!',
                            },
                        })];
                case 40:
                    _a.sent();
                    console.log("\u2713 Created 2 reviews");
                    // Create reading stats for contribution graph
                    console.log('Creating reading stats...');
                    today = new Date();
                    i = 0;
                    _a.label = 41;
                case 41:
                    if (!(i < 30)) return [3 /*break*/, 44];
                    date = new Date(today);
                    date.setDate(date.getDate() - i);
                    chaptersRead = Math.floor(Math.random() * 10);
                    if (!(chaptersRead > 0)) return [3 /*break*/, 43];
                    return [4 /*yield*/, prisma.userReadingStat.create({
                            data: {
                                userId: demoUser.id,
                                date: date,
                                chaptersRead: chaptersRead,
                            },
                        })];
                case 42:
                    _a.sent();
                    _a.label = 43;
                case 43:
                    i++;
                    return [3 /*break*/, 41];
                case 44:
                    console.log("\u2713 Created reading stats for last 30 days");
                    console.log('✅ Database seed completed successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
