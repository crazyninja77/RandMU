/**
 * Editorial context used to generate long, story-driven descriptions for the
 * harvested catalogue songs (the 51 hand-curated seeds keep their own bespoke
 * prose in seedData.ts).
 *
 * We only have metadata for harvested songs (artist, country, language, genre,
 * album, year), not biographies — so to avoid inventing false facts about a
 * specific artist, the "story" is built from things that are genuinely true:
 *   - the character & origins of the GENRE / tradition the song belongs to
 *   - the musical landscape of the COUNTRY / region it comes from
 *   - the era (decade) and the album/single context
 * These are woven together into a few paragraphs that read like a liner note.
 */

/** Noun-phrase describing a genre's character/origin. Keyed by lowercase tag. */
export const GENRE_CONTEXT: Record<string, string> = {
  // --- African ---
  afrobeat:
    "a politically charged Nigerian style pioneered in the 1970s that welds Yoruba rhythms and chant to long, horn-driven funk and jazz grooves",
  afrobeats:
    "the slick, percolating West African pop of the 2000s onward, blending Nigerian and Ghanaian pop with dancehall, hip-hop and house",
  highlife:
    "one of West Africa's oldest popular styles, marrying jazzy guitar lines and brass-band swing with Akan melody",
  soukous:
    "the buoyant Congolese rumba-derived dance music famous for its rippling, interlocking electric guitars",
  ndombolo:
    "a fast, hip-swinging Congolese dance style that grew out of soukous in the 1990s",
  mbalax:
    "Senegal's electric national style, propelled by the cracking polyrhythms of the sabar drum and soaring Wolof vocals",
  juju:
    "a Yoruba Nigerian guitar-and-talking-drum tradition built on praise singing and call-and-response",
  fuji:
    "a percussion-heavy Yoruba Muslim style descended from the music sung to wake worshippers during Ramadan",
  amapiano:
    "a hypnotic South African house offshoot of the late 2010s defined by jazzy keys, airy pads and deep log-drum basslines",
  gqom:
    "a raw, minimal and pounding electronic sound from Durban's townships",
  kwaito:
    "South Africa's slowed-down, bass-heavy house music that became the voice of post-apartheid youth",
  "bongo flava":
    "Tanzania's home-grown pop and hip-hop hybrid sung mostly in Swahili",
  taarab:
    "a Swahili coastal music blending Arab, Indian and African elements, traditionally performed at weddings",
  benga:
    "a bright, fast Kenyan guitar style that translated Luo lyre melodies onto electric instruments",
  chimurenga:
    "Zimbabwe's politically conscious style that translates the rippling melodies of the mbira thumb-piano to the electric guitar",
  mbaqanga:
    "a punchy South African township jive built on rolling basslines and group harmony",
  isicathamiya:
    "the soft, tip-toeing Zulu a cappella choral tradition of all-night migrant-worker competitions",
  "ethio-jazz":
    "the smoky fusion of Ethiopian pentatonic modes with jazz, funk and Latin rhythm forged in 1960s–70s Addis Ababa",
  ethiopique:
    "the golden-age Ethiopian pop and soul of the late 1960s and 70s, drenched in distinctive minor-key modes",
  "raï":
    "Algeria's rebellious popular music, born in the bars of Oran, mixing Bedouin melody with synths and pop",
  gnawa:
    "the trance music of Morocco's Sufi brotherhoods, built on the booming gimbri lute and metal qraqeb castanets",
  chaabi:
    "the everyday 'popular' music of North African cities, full of looping rhythms and crowd refrains",
  morna:
    "the melancholy national song-form of Cape Verde, a slow, bittersweet expression of longing known as sodade",
  coladeira:
    "Cape Verde's brighter, faster cousin to morna, made for dancing",
  funaná:
    "an accordion-and-iron-scraper dance music from Cape Verde's island of Santiago",
  semba:
    "the ancestor of samba, a vibrant Angolan dance music full of wit and storytelling",
  kizomba:
    "a slow, sensual Angolan partner-dance music descended from semba and zouk",
  makossa:
    "Cameroon's urban dance style with funky bass and horns that briefly conquered global discos",
  bikutsi:
    "a fast, driving rhythm from Cameroon's Beti people, originally women's music",
  kuduro:
    "Angola's frenetic, hard-edged electronic dance music",
  maloya:
    "the hypnotic, formerly banned ancestral music of Réunion, rooted in the songs of enslaved Africans",
  sega:
    "the swaying creole dance music of the Indian Ocean islands of Mauritius and Réunion",
  salegy:
    "a fast 6/8 dance music from Madagascar with shimmering guitars",
  "desert blues":
    "the loping, hypnotic guitar music of the Saharan Tuareg, often called 'assouf'",
  tuareg:
    "the electric guitar music of the nomadic Tuareg of the Sahara, carrying themes of exile and resistance",
  griot:
    "the hereditary praise-singing and oral-history tradition of West Africa's Mandé peoples",
  "afro-funk": "the funk and soul of 1970s Africa, heavy on horns and wah-wah guitar",
  "afro-house": "African dance music's deep, percussive take on house",

  // --- Middle East / North Africa ---
  "arabic pop": "the lush, string-laden popular music of the Arab world",
  khaleeji: "the Gulf Arab popular style marked by distinctive clapped rhythms and the oud",
  dabke: "the stomping line-dance music of the Levant, played at weddings and celebrations",
  mizrahi: "the music of Israel's Jews from Arab and Middle Eastern lands, full of quarter-tone melody",
  "classical arabic": "the grand orchestral song tradition of the 20th-century Arab world",
  tarab: "the rapturous, emotion-laden classical Arabic vocal art that aims to entrance its listeners",
  "iranian pop": "Persian popular music, blending Western pop with the modal melodies of Iran",
  "persian classical": "the refined Iranian art music of the dastgah modal system",
  "turkish folk": "the regional village music of Anatolia, often built around the saz lute",
  "anatolian rock": "the late-1960s Turkish fusion of psychedelic rock with folk melodies and instruments",
  arabesque: "Turkey's melodramatic, Arab-influenced urban popular music",
  kurdish: "the mountain folk traditions of the Kurdish people, rich in epic song",

  // --- South / Central Asia ---
  qawwali:
    "the ecstatic devotional music of South Asian Sufism, building through hammering harmonium and handclaps to spiritual rapture",
  ghazal: "the refined sung poetry of love and longing across the Urdu and Persian worlds",
  bhangra: "the exuberant Punjabi harvest-dance music driven by the barrel-shaped dhol drum",
  filmi: "the song tradition of Indian cinema, sweeping and eclectic by design",
  bollywood: "the lavish playback-song style of Hindi cinema",
  carnatic: "the intricate classical music of South India, built on raga and tala",
  hindustani: "the classical music of North India, famed for its meditative raga improvisation",
  sufi: "the devotional music of Islamic mysticism, aimed at dissolving the self in the divine",
  baul: "the mystic minstrel song tradition of Bengal",
  dangdut: "Indonesia's beloved popular music, fusing Malay, Indian-film and Arabic flavors over a distinctive beat",
  morlam: "the rapid-fire sung-poetry tradition of Laos and northeastern Thailand",
  "mongolian folk": "the wide-open music of the steppe, including long-song and horsehead-fiddle melodies",
  "throat singing": "the astonishing overtone singing of Mongolia and Tuva, producing several pitches at once",

  // --- East / Southeast Asia ---
  "city pop": "the glossy, urbane Japanese pop of the late 1970s and 80s, evoking neon nightdrives and bubble-era leisure",
  enka: "Japan's sentimental postwar ballad style, full of vibrato and longing",
  "j-pop": "the polished mainstream pop of Japan",
  "k-pop": "South Korea's meticulously produced idol pop, a global phenomenon of sound and spectacle",
  cantopop: "the Cantonese-language popular music centered on Hong Kong",
  mandopop: "the Mandarin-language pop sphere spanning Taiwan, China and the diaspora",
  "hokkien pop": "Taiwanese-language popular song, often earthy and heartfelt",
  gamelan: "the shimmering bronze percussion orchestras of Java and Bali",
  kroncong: "Indonesia's gentle, ukulele-laced creole music born of Portuguese contact",
  "pinoy rock": "the Filipino rock tradition sung in Tagalog",
  opm: "'Original Pilipino Music', the broad sweep of Filipino popular song",
  "khmer rock": "the psychedelic Cambodian rock and roll of the 1960s, tragically cut short by war",
  "min'yō": "the regional folk songs of Japan",
  trot: "Korea's oldest popular music style, with a characteristic two-beat lilt",

  // --- Latin America / Caribbean ---
  cumbia: "the rolling, accordion-and-percussion dance music born on Colombia's Caribbean coast and now beloved across Latin America",
  vallenato: "the accordion-led storytelling music of Colombia's Caribbean interior",
  salsa: "the brassy, clave-driven dance music forged by Caribbean musicians in New York",
  "son cubano": "the foundational Cuban style that fused Spanish song with African rhythm",
  bolero: "the romantic, slow-burning ballad tradition of Latin America",
  bachata: "the lovelorn guitar music of the Dominican Republic",
  merengue: "the fast, two-step national dance music of the Dominican Republic",
  reggaeton: "the dembow-driven urban music that swept the Spanish-speaking world from Puerto Rico",
  samba: "the syncopated heartbeat of Brazilian carnival",
  "bossa nova": "the cool, harmonically rich Brazilian style that whispered samba into jazz",
  mpb: "'Música Popular Brasileira', the sophisticated songwriting movement that followed bossa nova",
  forró: "the accordion-and-triangle dance music of Brazil's northeast",
  axé: "the percussive Afro-Brazilian carnival pop of Bahia",
  tropicalia: "the boundary-smashing late-1960s Brazilian movement that fused pop, rock and the avant-garde",
  tango: "the dramatic, bittersweet dance music of the Río de la Plata",
  chacarera: "a lively folk dance from the Argentine interior",
  huayno: "the Andean highland music of Quechua and Aymara communities, built on pentatonic melody",
  andean: "the highland music of the Andes, with panpipes, charango and aching vocals",
  norteño: "the accordion-and-bajo-sexto music of the Mexican north",
  ranchera: "the proud, heart-on-sleeve song tradition of rural Mexico",
  mariachi: "Mexico's iconic ensemble music of trumpets, violins and guitarrón",
  "son jarocho": "the harp-and-jarana folk music of Veracruz, Mexico",
  calypso: "the witty, topical Afro-Caribbean song tradition of Trinidad",
  soca: "the high-energy carnival dance music that grew out of calypso",
  zouk: "the fast, electronic Antillean dance music from Guadeloupe and Martinique",
  kompa: "Haiti's elegant, mid-tempo dance music",
  mento: "the rural Jamaican folk music that predated and fed into ska and reggae",
  dancehall: "the digital, DJ-driven evolution of Jamaican reggae",
  champeta: "the Afro-Colombian dance music of Cartagena, sparked by imported African records",

  // --- Europe (folk / regional) ---
  fado: "Portugal's soul-deep song of fate and longing, traditionally sung to the teardrop Portuguese guitar",
  flamenco: "the fiery Andalusian art of cante, guitar and dance born of Roma and southern Spanish culture",
  rebetiko: "the 'Greek blues' of the early-20th-century urban underworld",
  laïko: "the mainstream popular song of Greece, descended from rebetiko",
  klezmer: "the celebratory instrumental music of Ashkenazi Jewish Eastern Europe",
  "balkan brass": "the riotous, breakneck brass-band music of the Balkans",
  "turbo-folk": "the brash fusion of Balkan folk melody with dance-pop production",
  manele: "Romania's flamboyant, oriental-tinged pop-folk",
  chanson: "the lyric-driven French song tradition that prizes words above all",
  schlager: "the sentimental, catchy pop-song tradition of the German-speaking world",
  sevdah: "the slow, aching love-song tradition of Bosnia",
  tarantella: "the whirling folk dance music of southern Italy",
  celtic: "the fiddle-and-pipe traditions of Ireland, Scotland and the Celtic fringe",
  "nordic folk": "the haunting fiddle and vocal traditions of Scandinavia",
  yodeling: "the leaping vocal tradition of the Alps",
  polka: "the bouncing Central European dance music",

  // --- Oceania / fusion ---
  "māori": "the song traditions of New Zealand's Indigenous Māori",
  "island reggae": "the laid-back Pacific take on reggae",
  "world fusion": "music that consciously blends traditions from across the globe",
  "global bass": "club music built from the bass-heavy dance styles of the Global South",

  // --- Additional African ---
  zamrock: "the fuzzed-out, psychedelic garage rock that erupted in 1970s Zambia",
  "palm-wine": "the gently lilting West African guitar music once played in palm-wine bars",
  "palm wine": "the gently lilting West African guitar music once played in palm-wine bars",
  kwela: "the pennywhistle-driven street jive of 1950s South African townships",
  mbube: "the booming Zulu male-choral style that gave the world 'The Lion Sleeps Tonight'",
  marrabenta: "Mozambique's buoyant urban dance music built on locally-made guitars",
  wassoulou: "the earthy, women-led hunters' music of southern Mali",
  "coupé-décalé": "the flashy, percussive party music of the Ivorian diaspora",
  zouglou: "the student-born Ivorian dance music full of social commentary",
  genge: "Kenya's raw, Sheng-language hip-hop and street pop",
  gengetone: "the rowdy new-generation Kenyan street rap descended from genge",
  shaabi: "the raucous working-class street pop of Egyptian weddings and streets",
  mahraganat: "Egypt's electro-shaabi, an autotuned, hard-hitting sound from Cairo's streets",

  // --- Additional Latin America / Caribbean ---
  sertanejo: "Brazil's hugely popular country music of the rural interior",
  pagode: "a relaxed, backyard-party offshoot of samba",
  choro: "Brazil's virtuosic, fast-fingered instrumental precursor to samba",
  frevo: "the frenetic brass-and-whistle carnival music of Recife",
  maracatu: "the thunderous Afro-Brazilian processional drumming of Pernambuco",
  baião: "the accordion-led backlands dance rhythm of Brazil's northeast",
  timba: "the aggressive, funk-injected modern evolution of Cuban dance music",
  plena: "the topical, hand-drum 'sung newspaper' of Puerto Rico",
  bomba: "the call-and-response drum-and-dance tradition of Afro-Puerto Ricans",
  joropo: "the harp-and-cuatro cowboy music of the Venezuelan and Colombian plains",
  candombe: "the Afro-Uruguayan drum tradition of Montevideo's carnival",
  milonga: "a quick, rustic cousin of tango from the Río de la Plata",
  zamba: "a slow, handkerchief-waving Argentine folk dance",
  festejo: "the exuberant Afro-Peruvian celebration rhythm of the coast",

  // --- Additional Europe / Mediterranean ---
  entekhno: "the art-song strand of Greek popular music, wedding poetry to orchestration",
  rebetika: "the 'Greek blues' of the early-20th-century urban underworld",
  mugham: "Azerbaijan's improvised modal art music, kin to the Persian dastgah",
  fasil: "the classical Turkish suite tradition performed in meyhane taverns",
  "turkish classical": "the makam-based art music of the Ottoman court and city",

  // --- Additional Asia ---
  thumri: "a romantic, ornamented semi-classical vocal form of North India",
  bhajan: "Hindu devotional song, simple and heartfelt",
  kirtan: "call-and-response devotional chanting of the Indian subcontinent",
  luk_thung: "Thailand's heart-tugging country music of rural longing",
  "luk thung": "Thailand's heart-tugging country music of rural longing",
  "throat-singing": "the astonishing overtone singing of Mongolia and Tuva",
  khoomei: "the Tuvan and Mongolian art of overtone throat-singing",
  nasheed: "Islamic vocal music, often sung a cappella or with percussion only",
};

/** Genre name aliases so lookups still hit. */
const GENRE_ALIASES: Record<string, string> = {
  rai: "raï",
  maori: "māori",
  minyo: "min'yō",
  "ethio jazz": "ethio-jazz",
  ethiojazz: "ethio-jazz",
  afro: "afrobeat",
};

/** Noun-phrase describing a country's musical landscape. */
export const COUNTRY_CONTEXT: Record<string, string> = {
  Nigeria: "Africa's most populous nation and a powerhouse of afrobeat, juju and modern afrobeats",
  Ghana: "the West African home of highlife and a deep dance-band tradition",
  Senegal: "the West African heartland of mbalax and a profound Sufi musical culture",
  Mali: "a West African cradle of griot tradition and desert blues along the Niger river",
  Guinea: "a West African nation famed for its griots and the kora harp",
  "Côte d'Ivoire": "a West African crossroads of zouglou, coupé-décalé and reggae",
  "Cape Verde": "an Atlantic island nation whose music aches with the longing called sodade",
  Ethiopia: "an ancient highland nation with its own unrepeatable pentatonic modes and golden-age pop",
  "DR Congo": "the vast Central African source of rumba, soukous and the guitar styles that shaped a continent",
  Congo: "a Central African home of rumba and soukous",
  Angola: "a Lusophone nation that gave the world semba, kizomba and kuduro",
  "South Africa": "a nation of staggering musical range, from isicathamiya and mbaqanga to kwaito and amapiano",
  Zimbabwe: "the southern African home of the mbira and chimurenga",
  Tanzania: "an East African nation of Swahili taarab and bongo flava",
  Kenya: "an East African home of benga and a vibrant Swahili pop scene",
  Morocco: "a North African meeting point of Berber, Arab and Gnawa trance traditions",
  Algeria: "the North African birthplace of raï",
  Egypt: "the historic center of Arabic classical music and film song",
  Madagascar: "an Indian Ocean island with its own distinctive, polyrhythmic guitar traditions",

  Iran: "the heartland of Persian classical music and its intricate modal system",
  Turkey: "a bridge of cultures where Anatolian folk meets Ottoman classical and psychedelic rock",
  Lebanon: "a Mediterranean hub of Arabic art song and pop",
  Israel: "a meeting point of Mizrahi, Ashkenazi and Mediterranean musical worlds",
  "Saudi Arabia": "a Gulf nation of khaleeji rhythm and the oud",

  India: "a subcontinent of staggering musical depth, from Hindustani and Carnatic classical to film song and bhangra",
  Pakistan: "the home of qawwali devotional music and the ghazal",
  Bangladesh: "the land of Baul mystic minstrels and Bengali song",
  Nepal: "a Himalayan nation with its own folk and pop traditions",
  Mongolia: "the land of long-song and overtone throat-singing across the open steppe",
  Afghanistan: "a Central Asian crossroads of rubab-led classical and folk music",

  Japan: "a nation spanning ancient min'yō folk, sentimental enka and the neon glow of city pop",
  "South Korea": "the home of trot, pansori epic singing and the global juggernaut of K-pop",
  China: "a vast nation of regional opera, folk traditions and Mandopop",
  Indonesia: "an archipelago of gamelan orchestras, kroncong and beloved dangdut",
  Vietnam: "a Southeast Asian nation with its own modal folk and a rich ballad tradition",
  Thailand: "the home of luk thung country song and the rapid-fire poetry of mor lam",
  Cambodia: "a nation whose dazzling 1960s rock was nearly erased and is now reborn",
  Philippines: "an archipelago with a deep love of song, from kundiman to Pinoy rock",

  Portugal: "the home of fado, the music of fate and saudade",
  Spain: "a nation of flamenco, regional folk and Mediterranean song",
  Greece: "the land of rebetiko, the bouzouki and the laïko popular song",
  France: "the home of chanson, where lyrics reign supreme",
  Italy: "a nation of opera, canzone and southern folk dance",
  Romania: "a country of virtuosic Roma musicianship and pan-flute traditions",
  Serbia: "a Balkan home of breakneck brass bands and turbo-folk",
  "Bosnia and Herzegovina": "the home of sevdah, the slow ache of Balkan love song",
  Hungary: "a nation of distinctive folk traditions that inspired its classical composers",
  Ukraine: "a country of soaring polyphonic folk song",
  Russia: "a vast land of romance ballads, folk choirs and the bayan accordion",

  Brazil: "a continental nation of samba, bossa nova, MPB and Tropicália",
  Cuba: "the island that gave the world son, mambo and the roots of salsa",
  Colombia: "the birthplace of cumbia and vallenato and a coast alive with champeta",
  Mexico: "the land of mariachi, ranchera and the accordion music of the north",
  Argentina: "the home of tango and a rich Andean and folk inheritance",
  "Puerto Rico": "the island that birthed reggaeton and a salsa stronghold",
  "Dominican Republic": "the home of merengue and bachata",
  Peru: "an Andean nation of huayno and Afro-Peruvian rhythm",
  Bolivia: "a highland nation of panpipes, charango and Andean song",
  Jamaica: "the small island that gave the world ska, reggae and dancehall",
  Haiti: "the home of elegant kompa and deep Vodou drumming",
  "Trinidad and Tobago": "the birthplace of calypso, soca and the steelpan",

  "New Zealand": "a Pacific nation with a strong Māori song tradition and island reggae",
  Australia: "a continent with one of the world's oldest living musical cultures among its First Nations peoples",
};

const REGION_BY_CODE: Record<string, string> = {};
function tagRegion(codes: string[], region: string) {
  for (const c of codes) REGION_BY_CODE[c] = region;
}
tagRegion(
  ["DZ","AO","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","CI","DJ","EG","GQ","ER","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML","MR","MU","MA","MZ","NA","NE","NG","RW","ST","SN","SC","SL","SO","ZA","SS","SD","SZ","TZ","TG","TN","UG","ZM","ZW"],
  "Africa",
);
tagRegion(["BH","IR","IQ","IL","JO","KW","LB","OM","PS","QA","SA","SY","TR","AE","YE"], "the Middle East");
tagRegion(["AF","AM","AZ","BD","BT","GE","IN","KZ","KG","MV","MN","NP","PK","LK","TJ","TM","UZ"], "South & Central Asia");
tagRegion(["BN","KH","CN","HK","ID","JP","LA","MO","MY","MM","KP","PH","SG","KR","TW","TH","TL","VN"], "Asia");
tagRegion(["AR","BO","BR","CL","CO","CR","CU","DO","EC","SV","GT","HT","HN","JM","MX","NI","PA","PY","PE","PR","TT","UY","VE"], "Latin America & the Caribbean");
tagRegion(["FJ","NC","NZ","PG","WS","TO","VU","AU"], "the Pacific");

export const COUNTRY_CODE_BY_NAME: Record<string, string> = {};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function genreContext(...candidates: string[]): string | null {
  for (const raw of candidates) {
    if (!raw) continue;
    const key = norm(raw);
    const alias = GENRE_ALIASES[key] ?? key;
    if (GENRE_CONTEXT[alias]) return GENRE_CONTEXT[alias];
    if (GENRE_CONTEXT[key]) return GENRE_CONTEXT[key];
  }
  return null;
}

export function countryContext(country: string, code: string): string | null {
  if (!country) return null;
  if (COUNTRY_CONTEXT[country]) return COUNTRY_CONTEXT[country];
  const region = REGION_BY_CODE[code];
  if (region) return `part of the rich musical world of ${region}`;
  return null;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function eraPhrase(year: number | null): string {
  if (!year) return "";
  const decade = Math.floor(year / 10) * 10;
  if (year >= 2020) return "contemporary";
  if (decade >= 1990) return `from the ${decade}s`;
  return `from the golden era of the ${decade}s`;
}

export interface DescInput {
  title: string;
  artistName: string;
  country: string;
  countryCode: string;
  language: string;
  genreTag: string;
  genreBucket: string;
  subgenre: string;
  artistGenres: string[];
  albumName: string | null;
  albumType: string | null;
  year: number | null;
  featured: string[];
}

const RANDMU_NOTE =
  "RandMU surfaces music like this on purpose — a small piece of the world's enormous, " +
  "non-Western-centric soundscape that rarely reaches the algorithmic mainstream.";

/** A long, multi-paragraph description of the song. */
export function describeSong(i: DescInput): string {
  const where = i.country ? ` from ${i.country}` : "";
  const style = i.subgenre || i.genreBucket || "global";
  const article = /^[aeiou]/i.test(style) ? "an" : "a";
  const albumBit =
    i.albumType === "single"
      ? "It was released as a standalone single"
      : i.albumName
        ? `It appears on the ${i.albumType === "ep" ? "EP" : i.albumType ?? "album"} “${i.albumName}”`
        : "";
  const yearBit = i.year ? ` in ${i.year}` : "";
  const feat = i.featured.length ? ` The track features ${i.featured.join(", ")}.` : "";

  const p1 =
    `“${i.title}” is ${article} ${style} track by ${i.artistName}${where}. ` +
    `${albumBit}${albumBit ? yearBit : ""}.${feat}`.replace(/\.\./g, ".");

  const gc = genreContext(i.genreTag, i.subgenre, ...i.artistGenres);
  const p2 = gc
    ? `${titleCase(style)} is ${gc}. Heard here, it carries that lineage into a single song.`
    : `It sits within the ${style} tradition, one of the countless regional styles that make up the world's music.`;

  const cc = countryContext(i.country, i.countryCode);
  const langBit =
    i.language && i.language.toLowerCase() !== "english"
      ? ` Sung in ${i.language}, it keeps you close to the language and texture of its home.`
      : "";
  const p3 =
    (cc ? `${i.country} is ${cc}.${langBit} ` : langBit ? langBit.trim() + " " : "") + RANDMU_NOTE;

  return [p1, p2, p3].join("\n\n");
}

/** A long, multi-paragraph description of the artist. */
export function describeArtist(i: DescInput): string {
  const where = i.country ? ` from ${i.country}` : "";
  const styles = [i.subgenre, ...i.artistGenres.map(titleCase)]
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .slice(0, 3)
    .join(", ");

  const p1 = styles
    ? `${i.artistName} is an artist${where} whose music moves through ${styles}.`
    : `${i.artistName} is an artist${where} working in the ${i.genreBucket || "global"} tradition.`;

  const gc = genreContext(i.genreTag, i.subgenre, ...i.artistGenres);
  const p2 = gc
    ? `Their sound is rooted in ${gc} — a tradition with its own history, instruments and feel.`
    : `Their sound belongs to a regional tradition with its own history and character.`;

  const cc = countryContext(i.country, i.countryCode);
  const langBit =
    i.language && i.language.toLowerCase() !== "english"
      ? ` Much of this music lives in ${i.language}, carrying meaning that doesn't always translate but always travels.`
      : "";
  const p3 =
    (cc ? `Coming from ${i.country}, ${cc}, they are part of a scene most listeners never stumble across.${langBit} ` : langBit ? langBit.trim() + " " : "") +
    RANDMU_NOTE;

  return [p1, p2, p3].join("\n\n");
}

/** A short album/EP description, or null for singles. */
export function describeAlbum(i: DescInput): string | null {
  if (!i.albumName || i.albumType === "single") return null;
  const kind = i.albumType === "ep" ? "EP" : "album";
  const era = eraPhrase(i.year);
  const where = i.country ? ` from ${i.country}` : "";
  const yearBit = i.year ? ` (${i.year})` : "";
  return (
    `“${i.albumName}”${yearBit} is the ${kind}${where} that this song calls home` +
    `${era ? `, a record ${era}` : ""}. It gathers ${i.artistName}'s work into a single statement ` +
    `and places this track in the context the artist intended.`
  );
}
