import type { Song } from "./types.js";

// Hand-curated, intentionally non-Western-centric starter library.
// Real artists/songs with accurate metadata + descriptions.
// `spotifyTrackId` and image urls are filled later by the resolve/ingest
// pipeline (src/ingest.ts); until then the app links out to a Spotify search.
type SeedSong = Omit<
  Song,
  | "id"
  | "spotifyTrackId"
  | "spotifyUrl"
  | "artistImageUrl"
  | "albumImageUrl"
  | "ratingAverage"
  | "ratingCount"
  | "descriptionSource"
>;

export const SEED_SONGS: SeedSong[] = [
  {
    title: "Yeke Yeke",
    artist: "Mory Kanté",
    artistDescription:
      "Mory Kanté was a Guinean singer and kora virtuoso born into a celebrated family of griots, the hereditary West African musician-historians. Nicknamed the 'electronic griot', he spent his career fusing the centuries-old Mandinka tradition of the 21-string kora harp with electric instrumentation and European dance production. Before going solo he was a key member of Mali's legendary Rail Band, and he remained an ambassador for Mandé culture until his death in 2020.",
    songDescription:
      "'Yeke Yeke' is a euphoric Mandé pop anthem built around a cascading, instantly recognisable kora riff and call-and-response vocals. Released in 1987, it became one of the first African singles ever to sell more than a million copies and topped dance charts across Europe. Its blend of traditional griot melody with a four-on-the-floor beat made it a landmark moment for African music on the global stage.",
    country: "Guinea",
    language: "Maninka",
    genre: "African",
    subgenre: "Mandé / Afro-pop",
    albumName: "Akwaba Beach",
    albumType: "album",
    albumDescription:
      "Mory Kanté's 1987 breakthrough record, the best-selling African album of its era, blending griot tradition with polished European dance pop.",
    year: 1987,
  },
  {
    title: "Sodade",
    artist: "Cesária Évora",
    artistDescription:
      "Cesária Évora was the 'Barefoot Diva' of Cape Verde, who carried the islands' melancholic morna genre to concert halls around the world. She performed barefoot on stage in solidarity with the poor women and children of her country, and only achieved international fame in her fifties after decades of singing in the bars of Mindelo. Her warm, smoky contralto became the defining voice of Cape Verdean music before her death in 2011.",
    songDescription:
      "'Sodade' is an aching morna about exile, distance and the untranslatable Portuguese-Creole longing known as saudade. Its slow, swaying melody mourns the departure of islanders forced to leave Cape Verde for work abroad, and it became Évora's signature song. The track introduced millions of listeners to the bittersweet emotional world of the archipelago.",
    country: "Cape Verde",
    language: "Cape Verdean Creole",
    genre: "African",
    subgenre: "Morna",
    albumName: "Miss Perfumado",
    albumType: "album",
    albumDescription:
      "Évora's 1992 album that sold over 300,000 copies worldwide and effectively put both morna and Cape Verde on the international music map.",
    year: 1992,
  },
  {
    title: "Tezeta (Nostalgia)",
    artist: "Mulatu Astatke",
    artistDescription:
      "Mulatu Astatke is an Ethiopian vibraphonist, keyboardist and composer widely regarded as the father of Ethio-jazz. Trained in London and New York, he was the first African student at Boston's Berklee College of Music, and he pioneered a sound that fuses the five-note scales of Ethiopian traditional music with jazz harmony, Latin rhythms and funk. His work was rediscovered by global audiences in the 2000s, partly through Jim Jarmusch's film 'Broken Flowers'.",
    songDescription:
      "'Tezeta' is a languid, smoky instrumental named after the Ethiopian musical mode and concept of memory and nostalgia. Astatke's vibraphone drifts over a hypnotic groove, evoking longing and reflection in a way that is unmistakably Ethiopian yet deeply jazz. It stands as one of the cornerstones of the Ethio-jazz canon.",
    country: "Ethiopia",
    language: "Instrumental",
    genre: "Jazz",
    subgenre: "Ethio-jazz",
    albumName: "Mulatu of Ethiopia",
    albumType: "album",
    albumDescription:
      "His landmark 1972 album recorded in New York, a defining statement of the Ethio-jazz sound that fused Ethiopian scales with American jazz.",
    year: 1972,
  },
  {
    title: "Independance Cha Cha",
    artist: "Le Grand Kallé et l'African Jazz",
    artistDescription:
      "Joseph Kabasele, known as 'Le Grand Kallé', led the band African Jazz and is considered one of the founding fathers of modern Congolese rumba. He modernised the genre by blending Cuban son with Congolese melodies and Lingala lyrics, mentoring a generation of stars who would go on to define soukous. His orchestra was among the most influential in 20th-century African popular music.",
    songDescription:
      "'Independance Cha Cha' is a jubilant rumba written in 1960 to celebrate the independence movements sweeping across Africa, especially the Belgian Congo. Sung in Lingala and French, it became a pan-African anthem of liberation and is often cited as the first hit to unite the continent in celebration. Its breezy cha-cha rhythm belies the historic weight of its message.",
    country: "DR Congo",
    language: "Lingala",
    genre: "African",
    subgenre: "Congolese rumba",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1960,
  },
  {
    title: "Eh Hee",
    artist: "Huun-Huur-Tu",
    artistDescription:
      "Huun-Huur-Tu are a celebrated ensemble from Tuva, a small republic in southern Siberia, renowned for the art of khoomei, or throat singing. Their performers can produce two or more pitches simultaneously, layering a deep drone with whistling overtones that imitate wind, water and birdsong. Accompanied by horsehair fiddles and traditional drums, they have become the most recognised ambassadors of Central Asian nomadic music.",
    songDescription:
      "'Eh Hee' is a steppe-evoking piece that showcases the group's astonishing overtone singing and the plaintive sound of the igil, a two-stringed fiddle. The music conjures the vast open landscapes of the Tuvan grasslands and the nomadic herding life from which it springs. It is a striking introduction to a vocal tradition unlike anything in Western music.",
    country: "Russia (Tuva)",
    language: "Tuvan",
    genre: "Folk",
    subgenre: "Throat singing (khoomei)",
    albumName: "The Orphan's Lament",
    albumType: "album",
    albumDescription:
      "A celebrated 1994 album of Tuvan throat singing and nomadic folk that brought khoomei to a wide international audience.",
    year: 1994,
  },
  {
    title: "Allah Hoo",
    artist: "Nusrat Fateh Ali Khan",
    artistDescription:
      "Nusrat Fateh Ali Khan was a Pakistani vocalist regarded as one of the greatest singers ever recorded, and the foremost modern master of qawwali, the devotional music of Sufi Islam. Heir to a 600-year family tradition, he possessed an extraordinary range and stamina that let him improvise for hours, earning the honorific Shahenshah-e-Qawwali, 'the king of kings of qawwali'. His collaborations with Western artists in the 1990s made him a global figure before his death in 1997.",
    songDescription:
      "'Allah Hoo' is an ecstatic devotional qawwali that repeats the name of God, building from a gentle introduction to a soaring, trance-like climax. The interplay between Khan's soaring lead vocal, the answering chorus and the insistent harmonium and hand-clapping draws the listener toward spiritual rapture. It is a quintessential example of the genre's power to move both the faithful and the uninitiated.",
    country: "Pakistan",
    language: "Urdu",
    genre: "Devotional",
    subgenre: "Qawwali",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1990,
  },
  {
    title: "Chan Chan",
    artist: "Buena Vista Social Club",
    artistDescription:
      "Buena Vista Social Club is an ensemble of veteran Cuban musicians assembled in 1996 by guitarist Ry Cooder and producer Nick Gold, many of them long retired. Named after a members' club in pre-revolutionary Havana, the project revived the golden-age sound of son cubano and bolero for a new generation. The accompanying album and Wim Wenders documentary turned its elderly stars into unlikely global celebrities.",
    songDescription:
      "'Chan Chan' is the gently swaying son that opens the group's famous album and has become its calling card. Written by veteran musician Compay Segundo, its four-chord cycle and warm, weathered vocals tell a folksy tale of two characters, Chan Chan and Juanica. The song's relaxed groove captures the nostalgic, sun-warmed spirit of old Havana.",
    country: "Cuba",
    language: "Spanish",
    genre: "Latin",
    subgenre: "Son cubano",
    albumName: "Buena Vista Social Club",
    albumType: "album",
    albumDescription:
      "The Grammy-winning 1997 album that became a worldwide phenomenon and sparked a global revival of interest in traditional Cuban music.",
    year: 1997,
  },
  {
    title: "Águas de Março",
    artist: "Elis Regina & Tom Jobim",
    artistDescription:
      "This recording pairs two giants of Brazilian music: Elis Regina, the fiery and beloved interpreter often called the greatest Brazilian singer of all time, and Antônio Carlos 'Tom' Jobim, the composer who co-invented bossa nova. Their collaboration brought together Regina's expressive, playful voice and Jobim's sophisticated harmonic sense. Both are towering figures in Música Popular Brasileira (MPB).",
    songDescription:
      "'Águas de Março' (Waters of March) is a playful 'list song' that strings together everyday images of the Brazilian rainy season — a stick, a stone, the end of the road — into a meditation on the cycle of life. The Regina and Jobim duet version, with its giggling interplay and overlapping vocals, is the most beloved of countless recordings. It is regularly voted one of the greatest Brazilian songs ever written.",
    country: "Brazil",
    language: "Portuguese",
    genre: "Latin",
    subgenre: "MPB / bossa nova",
    albumName: "Elis & Tom",
    albumType: "album",
    albumDescription:
      "Their classic 1974 duet album, recorded in Los Angeles, now considered one of the essential records of Brazilian popular music.",
    year: 1974,
  },
  {
    title: "Gracias a la Vida",
    artist: "Violeta Parra",
    artistDescription:
      "Violeta Parra was a Chilean folklorist, composer, visual artist and pioneer of the Nueva Canción ('new song') movement that reshaped Latin American music. She travelled the Chilean countryside collecting and preserving traditional songs, then channelled them into her own deeply personal compositions. Her work fused folk authenticity with social conscience and influenced a continent of singer-songwriters.",
    songDescription:
      "'Gracias a la Vida' (Thanks to Life) is a heartfelt hymn of gratitude for sight, sound, language and love, written near the end of Parra's life. Despite the despair that surrounded its creation, the song radiates tenderness and has become one of the most covered Latin American songs of all time, recorded by Mercedes Sosa, Joan Baez and many others. It is treasured as both a personal testament and a humanist anthem.",
    country: "Chile",
    language: "Spanish",
    genre: "Folk",
    subgenre: "Nueva canción",
    albumName: "Las Últimas Composiciones",
    albumType: "album",
    albumDescription:
      "Parra's final 1966 album, released shortly before her death, and the source of several of her most enduring compositions.",
    year: 1966,
  },
  {
    title: "Mas Que Nada",
    artist: "Jorge Ben",
    artistDescription:
      "Jorge Ben (later Jorge Ben Jor) is a Brazilian singer-songwriter who carved out a uniquely propulsive style fusing samba with rock, soul and funk. His percussive acoustic guitar and infectious rhythmic sense made him one of the most influential and frequently sampled figures in Brazilian music. He helped bridge samba tradition and the modern pop era.",
    songDescription:
      "'Mas Que Nada' is an irresistible samba-rock anthem whose chanted Yoruba-derived refrain and driving groove made it a standard. Though written and first recorded by Jorge Ben in 1963, it became a global hit through Sérgio Mendes & Brasil '66 and has been covered endlessly since. Its joyous energy made it one of the first Brazilian songs to break through to international audiences.",
    country: "Brazil",
    language: "Portuguese",
    genre: "Latin",
    subgenre: "Samba-rock",
    albumName: "Samba Esquema Novo",
    albumType: "album",
    albumDescription:
      "Jorge Ben's influential 1963 debut album, which announced a fresh, guitar-driven take on samba.",
    year: 1963,
  },
  {
    title: "Lambada (Chorando Se Foi)",
    artist: "Kaoma",
    artistDescription:
      "Kaoma was a French-Brazilian group, fronted by Brazilian singer Loalwa Braz, that ignited the worldwide lambada dance craze of 1989. The band packaged the sensual, fast-paced lambada dance of north-eastern Brazil into a glossy summer pop sound. Their breakthrough single became one of the defining global hits of its year.",
    songDescription:
      "'Lambada' is an irresistibly catchy dance number adapted from the Bolivian song 'Llorando se fue' by Los Kjarkas, a borrowing that later sparked a famous copyright dispute. Its swaying accordion melody and steamy choreography sold millions of copies and dominated airwaves across Europe and Latin America. The track remains a nostalgic emblem of late-1980s world-pop.",
    country: "Brazil",
    language: "Portuguese",
    genre: "Latin",
    subgenre: "Lambada",
    albumName: "Worldbeat",
    albumType: "album",
    albumDescription:
      "Kaoma's 1989 debut album, driven by the chart-topping title craze that introduced lambada to a global audience.",
    year: 1989,
  },
  {
    title: "Didi",
    artist: "Cheb Khaled",
    artistDescription:
      "Khaled, often billed as Cheb Khaled, is an Algerian singer celebrated as the 'King of Raï', the rebellious popular music of working-class Algeria. He modernised raï's traditionally provocative street songs with pop and funk arrangements, taking the genre from the bars of Oran to international charts. He is among the best-selling Arabic-language artists in history.",
    songDescription:
      "'Didi' was the 1992 single that launched raï onto dancefloors around the world, propelled by an insistent groove and Khaled's gravelly, soaring voice. Even listeners who understood no Arabic embraced its hypnotic hook, making it a genuine global crossover. It remains the song most responsible for introducing North African pop to the West.",
    country: "Algeria",
    language: "Arabic",
    genre: "African",
    subgenre: "Raï",
    albumName: "Khaled",
    albumType: "album",
    albumDescription:
      "His 1992 self-titled album, produced by Don Was and Michael Brook, which broke raï internationally.",
    year: 1992,
  },
  {
    title: "Enta Omri",
    artist: "Umm Kulthum",
    artistDescription:
      "Umm Kulthum was an Egyptian singer, songwriter and actress so revered that she is simply called 'the Star of the East' and 'the Voice of Egypt'. For decades her monthly radio broadcasts brought the Arab world to a standstill, drawing tens of millions of listeners from Morocco to Iraq. Her command of classical Arabic poetry, tarab (musical ecstasy) and improvisation made her the most important Arab musician of the 20th century.",
    songDescription:
      "'Enta Omri' (You Are My Life) is an iconic, hour-long love song and one of the crowning achievements of classical Arabic music. Built on long, evolving instrumental introductions and Umm Kulthum's endlessly varied repetition of key phrases, it carries audiences through waves of emotional release. The 1964 collaboration with composer Mohammed Abdel Wahab is considered a turning point in modern Arabic song.",
    country: "Egypt",
    language: "Arabic",
    genre: "Classical",
    subgenre: "Arabic classical / tarab",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1964,
  },
  {
    title: "Mustt Mustt",
    artist: "Nusrat Fateh Ali Khan & Michael Brook",
    artistDescription:
      "This collaboration unites the Pakistani qawwali legend Nusrat Fateh Ali Khan with the Canadian guitarist and producer Michael Brook. Released on Peter Gabriel's Real World label, it was a pioneering attempt to frame Sufi devotional singing within ambient electronics and Western studio production. The pairing helped open Western ears to qawwali and the wider world-fusion movement.",
    songDescription:
      "'Mustt Mustt' is a hypnotic Sufi groove whose title evokes a state of intoxicated divine love. Khan's improvised vocal soars over Brook's atmospheric, looping production, and the track gained a second life when Massive Attack remixed it into a trip-hop classic. It stands as a landmark of early 1990s cross-cultural collaboration.",
    country: "Pakistan",
    language: "Urdu",
    genre: "World fusion",
    subgenre: "Qawwali fusion",
    albumName: "Mustt Mustt",
    albumType: "album",
    albumDescription:
      "The 1990 Real World album that paired Khan's qawwali with contemporary Western production and ambient textures.",
    year: 1990,
  },
  {
    title: "Pata Pata",
    artist: "Miriam Makeba",
    artistDescription:
      "Miriam Makeba, affectionately known as 'Mama Africa', was a South African singer and civil-rights activist who introduced the world to South African township music. Exiled for decades for her outspoken opposition to apartheid, she testified at the United Nations and became a global symbol of the anti-apartheid struggle. Her warmth, charisma and rich voice made her one of Africa's first international superstars.",
    songDescription:
      "'Pata Pata' is a buoyant, danceable tune named after a township dance, sung mostly in Xhosa with its characteristic click consonants. Recorded in the United States in 1967, it became a worldwide hit and remains Makeba's best-known song. Beneath its joyous surface it carried the sounds of a homeland she could not return to.",
    country: "South Africa",
    language: "Xhosa",
    genre: "African",
    subgenre: "Township / Afropop",
    albumName: "Pata Pata",
    albumType: "album",
    albumDescription:
      "Her 1967 album, named after the international hit single that brought South African pop to a global audience.",
    year: 1967,
  },
  {
    title: "Homeless",
    artist: "Ladysmith Black Mambazo",
    artistDescription:
      "Ladysmith Black Mambazo are a South African male choral group and the foremost exponents of isicathamiya, a soft, tightly harmonised a cappella tradition developed by Zulu migrant workers. Founded by Joseph Shabalala, the group has won multiple Grammy Awards and performed for Nelson Mandela and at the Nobel Peace Prize ceremony. Their gentle, swaying harmonies are among the most beloved sounds in South African music.",
    songDescription:
      "'Homeless' is a luminous a cappella piece co-written with Paul Simon for his 'Graceland' project, sung in a mix of Zulu and English. Its interlocking harmonies and quiet dignity evoke displacement, shelter and longing. The song helped introduce isicathamiya to a worldwide audience.",
    country: "South Africa",
    language: "Zulu",
    genre: "African",
    subgenre: "Isicathamiya",
    albumName: "Graceland",
    albumType: "album",
    albumDescription:
      "Paul Simon's landmark 1986 album, which spotlighted South African musicians and brought their sounds to a global mainstream audience.",
    year: 1986,
  },
  {
    title: "Zombie",
    artist: "Fela Kuti",
    artistDescription:
      "Fela Kuti was the Nigerian multi-instrumentalist, bandleader and activist who invented Afrobeat, a sprawling fusion of Yoruba rhythms, highlife, jazz and James Brown-style funk. A fearless critic of Nigeria's military dictatorships, he turned his Lagos compound into an independent 'republic' and paid for his defiance with beatings and imprisonment. He remains one of Africa's most influential and politically uncompromising musicians.",
    songDescription:
      "'Zombie' is a scathing 1976 satire that compares Nigerian soldiers to mindless zombies blindly following orders. Set to a relentless, horn-driven Afrobeat groove that stretches past twelve minutes, it became an anthem of resistance. The song so enraged the authorities that they launched a brutal raid on Kuti's compound in retaliation.",
    country: "Nigeria",
    language: "English / Pidgin",
    genre: "African",
    subgenre: "Afrobeat",
    albumName: "Zombie",
    albumType: "album",
    albumDescription:
      "His incendiary 1976 album whose title track mocked the military and provoked a violent state reprisal against his commune.",
    year: 1976,
  },
  {
    title: "Madan",
    artist: "Salif Keita",
    artistDescription:
      "Salif Keita is a Malian singer known as the 'Golden Voice of Africa', whose luminous tenor is among the most distinctive in world music. A direct descendant of the founder of the Mali Empire, he defied both his noble lineage and the stigma surrounding his albinism to become a musician. He has spent his career modernising Mandé music and championing the rights of people with albinism.",
    songDescription:
      "'Madan' is a soaring, percussive Mandé pop anthem that pairs Keita's impassioned vocal with hypnotic, interlocking rhythms. The song reached new audiences when remixed by Martin Solveig into a dancefloor hit, but the original brims with West African melodic richness. It showcases the bright, urgent quality that makes Keita's voice instantly recognisable.",
    country: "Mali",
    language: "Bambara",
    genre: "African",
    subgenre: "Mandé pop",
    albumName: "Moffou",
    albumType: "album",
    albumDescription:
      "His acclaimed 2002 album, a more acoustic, rootsy return to Malian sounds that many consider among his finest work.",
    year: 2002,
  },
  {
    title: "Ne La Thiass",
    artist: "Cheikh Lô",
    artistDescription:
      "Cheikh Lô is a Senegalese singer-songwriter and guitarist, instantly recognisable for his dreadlocks and the devotional dress of the Baye Fall Sufi brotherhood. His gentle, soulful music blends Senegalese mbalax with Congolese rumba, Cuban son and flamenco touches. He is admired across Africa as one of the continent's most original and spiritually grounded musicians.",
    songDescription:
      "'Ne La Thiass' is the warm, lilting title track of Lô's breakout album, weaving acoustic guitar with subtle Senegalese percussion. Its relaxed groove and tender vocal reflect his unhurried, contemplative style. The song marked the arrival of a distinctive new voice in African music.",
    country: "Senegal",
    language: "Wolof",
    genre: "African",
    subgenre: "Mbalax",
    albumName: "Ne La Thiass",
    albumType: "album",
    albumDescription:
      "His 1996 debut, produced by Youssou N'Dour, which introduced Cheikh Lô's gentle cross-cultural fusion to international listeners.",
    year: 1996,
  },
  {
    title: "7 Seconds",
    artist: "Youssou N'Dour & Neneh Cherry",
    artistDescription:
      "Youssou N'Dour is Senegal's most famous musician and the leading innovator of mbalax, the country's vibrant blend of Wolof percussion and modern pop; he has also served as Senegal's Minister of Tourism and Culture. Here he duets with Neneh Cherry, the Swedish-born singer of Sierra Leonean descent known for blending pop, hip-hop and soul. Their collaboration brought together two artists rooted in cross-cultural identity.",
    songDescription:
      "'7 Seconds' is a multilingual 1994 global hit sung in Wolof, English and French about the first seconds of a newborn's life, before it learns the world's divisions and prejudices. Its hushed, hopeful verses and aching chorus topped charts across Europe. The song became an enduring anthem of tolerance and shared humanity.",
    country: "Senegal",
    language: "Wolof / English / French",
    genre: "African",
    subgenre: "Mbalax / pop",
    albumName: "The Guide (Wommat)",
    albumType: "album",
    albumDescription:
      "Youssou N'Dour's 1994 album, home to the worldwide smash duet with Neneh Cherry.",
    year: 1994,
  },
  {
    title: "Vache Aghdei",
    artist: "Sevara Nazarkhan",
    artistDescription:
      "Sevara Nazarkhan is an Uzbek singer who brings the folk music of Central Asia to contemporary international audiences. A master of the long-necked dutar lute, she reinterprets traditional Uzbek songs with subtle modern production. She is one of the best-known cultural ambassadors of post-Soviet Central Asia.",
    songDescription:
      "'Vache Aghdei' is a delicate reworking of an Uzbek folk song, produced by the French musician Hector Zazou, who frames her voice with gentle electronics. The result preserves the modal beauty of Central Asian melody while giving it an intimate, atmospheric sheen. It offers a window into a region rarely heard in Western pop.",
    country: "Uzbekistan",
    language: "Uzbek",
    genre: "Folk",
    subgenre: "Central Asian folk",
    albumName: "Yol Bolsin",
    albumType: "album",
    albumDescription:
      "Her internationally released 2003 album on Real World Records, blending Uzbek folk tradition with contemporary production.",
    year: 2003,
  },
  {
    title: "Galang",
    artist: "M.I.A.",
    artistDescription:
      "M.I.A. (Mathangi 'Maya' Arulpragasam) is a British artist of Sri Lankan Tamil heritage whose music collides dancehall, electro, hip-hop and global street sounds with sharp political commentary. The daughter of a Tamil activist, she draws on her refugee experience to write about migration, conflict and identity. She helped define a globalised, internet-age pop aesthetic in the 2000s.",
    songDescription:
      "'Galang' is the raw, infectious debut single that announced M.I.A.'s arrival, built on lo-fi beats, chanted hooks and a defiant attitude. Its DIY energy and globe-spanning influences made it an underground anthem. The track signalled a new kind of pop voice fluent in both first-world clubs and third-world realities.",
    country: "Sri Lanka / UK",
    language: "English",
    genre: "Electronic",
    subgenre: "Worldbeat / grime-adjacent",
    albumName: "Arular",
    albumType: "album",
    albumDescription:
      "Her acclaimed 2005 debut album, named after her father, fusing political lyrics with genre-blurring global dance music.",
    year: 2005,
  },
  {
    title: "Jai Ho",
    artist: "A. R. Rahman",
    artistDescription:
      "A. R. Rahman is an Indian composer, singer and producer nicknamed the 'Mozart of Madras', who revolutionised the sound of Indian film music. By fusing Indian classical and folk traditions with electronic, orchestral and world influences, he reshaped Bollywood scoring for the modern era. He has won two Academy Awards, two Grammys and sold hundreds of millions of records.",
    songDescription:
      "'Jai Ho' (meaning 'Let there be victory') is the jubilant, Oscar-winning song that closes the film 'Slumdog Millionaire' with an exuberant Bollywood dance finale. Its blend of Hindi, Urdu and Punjabi lyrics, surging strings and irresistible rhythm made it a worldwide phenomenon. The track brought Indian film music to a vast new global audience.",
    country: "India",
    language: "Hindi / Urdu / Punjabi",
    genre: "Soundtrack",
    subgenre: "Bollywood / filmi",
    albumName: "Slumdog Millionaire (Soundtrack)",
    albumType: "album",
    albumDescription:
      "Rahman's 2008 film score, which won two Academy Awards and introduced his sound to a global mainstream audience.",
    year: 2008,
  },
  {
    title: "Chaiyya Chaiyya",
    artist: "Sukhwinder Singh & Sapna Awasthi",
    artistDescription:
      "Composed by A. R. Rahman and sung by playback singers Sukhwinder Singh and Sapna Awasthi, this song belongs to the rich tradition of Indian filmi music, where vocalists record songs for actors to lip-sync on screen. Sukhwinder Singh is celebrated for his powerful, energetic voice across decades of Bollywood hits. The track's lyrics draw on Sufi poetry by Gulzar.",
    songDescription:
      "'Chaiyya Chaiyya' is a Sufi-inflected filmi anthem famous for its hypnotic rhythm and its unforgettable picturisation atop a moving train. Its celebration of love as a shaded, blissful path made it one of the most iconic Bollywood numbers ever filmed. The song's driving groove has earned it global recognition far beyond Indian cinema.",
    country: "India",
    language: "Hindi",
    genre: "Soundtrack",
    subgenre: "Bollywood / Sufi pop",
    albumName: "Dil Se..",
    albumType: "album",
    albumDescription:
      "The 1998 film soundtrack composed by A. R. Rahman, among the most acclaimed Bollywood scores of its decade.",
    year: 1998,
  },
  {
    title: "Sukiyaki (Ue o Muite Arukō)",
    artist: "Kyu Sakamoto",
    artistDescription:
      "Kyu Sakamoto was a Japanese singer and actor who achieved a feat no other Japanese artist has matched: topping the United States Billboard Hot 100 with a song sung entirely in Japanese. A star of the early-1960s kayōkyoku pop scene, his gentle, smiling delivery made him a national favourite. He died in the 1985 Japan Airlines Flight 123 disaster, one of the deadliest single-aircraft crashes in history.",
    songDescription:
      "'Ue o Muite Arukō' — renamed 'Sukiyaki' for Western markets — is a wistful ballad whose title means 'I look up as I walk, so that the tears won't fall'. Written in the wake of failed political protests, its bittersweet melody and hopeful resolve resonated far beyond Japan. In 1963 it became, and remains, the only Japanese-language song to reach number one in America.",
    country: "Japan",
    language: "Japanese",
    genre: "Pop",
    subgenre: "Kayōkyoku",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1961,
  },
  {
    title: "Plastic Love",
    artist: "Mariya Takeuchi",
    artistDescription:
      "Mariya Takeuchi is a Japanese singer-songwriter and a central figure of city pop, the sophisticated, urban-leaning Japanese pop of the late 1970s and 1980s. Married to producer and city-pop pioneer Tatsuro Yamashita, she has enjoyed a long and successful career at home. Decades after their release, her songs found an unexpected second life through internet streaming and the vaporwave aesthetic.",
    songDescription:
      "'Plastic Love' is a glossy, melancholic city-pop classic about masking heartbreak behind a glamorous, carefree exterior. Its lush production, supple bassline and bittersweet melody made it the song that introduced millions of new listeners to the genre. In the 2010s it became a viral phenomenon, emblematic of a worldwide revival of interest in Japanese city pop.",
    country: "Japan",
    language: "Japanese",
    genre: "Pop",
    subgenre: "City pop",
    albumName: "Variety",
    albumType: "album",
    albumDescription:
      "Her 1984 album, produced by her husband Tatsuro Yamashita, now regarded as a cornerstone of the city-pop canon.",
    year: 1984,
  },
  {
    title: "Walang Kekek",
    artist: "Waljinah",
    artistDescription:
      "Waljinah is a revered Javanese singer often called the 'Queen of Keroncong', the gentle, Portuguese-influenced acoustic music of Indonesia. Over a career spanning more than half a century she has recorded hundreds of songs and preserved Central Javanese musical tradition. She is one of Indonesia's most beloved cultural icons.",
    songDescription:
      "'Walang Kekek' is a classic Javanese folk song delivered in the swaying, ukulele-and-cello style of keroncong, ornamented with Waljinah's graceful vocal turns. Its playful lyrics and lilting rhythm capture the easy charm of the genre. The song offers a window into a refined acoustic tradition little known outside Indonesia.",
    country: "Indonesia",
    language: "Javanese",
    genre: "Folk",
    subgenre: "Keroncong",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1970,
  },
  {
    title: "Misirlou (Surf)",
    artist: "Dick Dale",
    artistDescription:
      "Dick Dale, the self-styled 'King of the Surf Guitar', was a Lebanese-American guitarist who pioneered the loud, reverb-drenched surf rock sound of the early 1960s. Drawing on the Middle Eastern melodies he heard from his family, he developed a rapid-fire staccato picking technique that influenced generations of rock guitarists. He worked closely with Leo Fender to build amplifiers powerful enough for his playing.",
    songDescription:
      "Dale's 'Misirlou' transforms an old Eastern Mediterranean folk melody into an explosive surf-rock instrumental of breakneck tremolo picking. Its thunderous energy defined the surf genre and, decades later, opened Quentin Tarantino's film 'Pulp Fiction', introducing it to a new generation. The track is a thrilling collision of Arabic melody and American rock.",
    country: "USA (Lebanese heritage)",
    language: "Instrumental",
    genre: "Rock",
    subgenre: "Surf rock",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1962,
  },
  {
    title: "Bésame Mucho",
    artist: "Consuelo Velázquez",
    artistDescription:
      "Consuelo Velázquez was a Mexican pianist and composer who wrote this enduring bolero as a teenager, reportedly before she had ever been kissed. A classically trained musician, she became one of Latin America's most successful songwriters. Her most famous composition has been recorded by hundreds of artists across the world.",
    songDescription:
      "'Bésame Mucho' (Kiss Me a Lot) is a passionate bolero in which the singer begs for kisses as though this were the last night together. Written in 1940, its sweeping melody and urgent romanticism made it one of the most recorded songs in popular music history, covered by everyone from the Beatles to Cesária Évora. It endures as the quintessential Latin love song.",
    country: "Mexico",
    language: "Spanish",
    genre: "Latin",
    subgenre: "Bolero",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1940,
  },
  {
    title: "La Llorona",
    artist: "Chavela Vargas",
    artistDescription:
      "Chavela Vargas was a Costa Rican-born Mexican singer who upended the conventions of ranchera, performing songs traditionally sung by men in her raw, smoky, unadorned voice. Dressed in a poncho and openly defiant of social norms, she became a beloved and iconoclastic figure embraced by artists such as Frida Kahlo and filmmaker Pedro Almodóvar. She kept performing into her nineties.",
    songDescription:
      "'La Llorona' is Vargas's spellbinding take on the folk lament of the 'Weeping Woman', a ghostly figure of Mexican legend who mourns her lost children. Stripped to voice and guitar, her version turns the song into a haunting meditation on grief and love. It is among the most emotionally devastating performances in the ranchera tradition.",
    country: "Mexico",
    language: "Spanish",
    genre: "Latin",
    subgenre: "Ranchera",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1993,
  },
  {
    title: "El Cóndor Pasa",
    artist: "Los Incas",
    artistDescription:
      "Los Incas (also known as Urubamba) were a pioneering Andean ensemble who brought the music of the high Andes — the breathy pan-flute zampoña, the quena and the small charango guitar — to European and global audiences. Based largely in Paris, they helped spark worldwide fascination with Andean folk in the 1960s and 70s. Their collaboration with Paul Simon spread the sound even further.",
    songDescription:
      "'El Cóndor Pasa' is based on a 1913 melody by Peruvian composer Daniel Alomía Robles, itself rooted in older Andean folk traditions, and is now an emblem of the music of the Andes. Its soaring pan-flute lines evoke the vast mountain landscapes of Peru and Bolivia. The tune reached global fame after Paul Simon added English lyrics to the Los Incas recording.",
    country: "Peru",
    language: "Instrumental / Quechua",
    genre: "Folk",
    subgenre: "Andean / música criolla",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1963,
  },
  {
    title: "Lágrima",
    artist: "Amália Rodrigues",
    artistDescription:
      "Amália Rodrigues was the 'Queen of Fado', the singer who defined Portugal's urban song of longing and fate for the world. Over a career of more than fifty years she elevated fado from the taverns of Lisbon to international concert stages and films. Her death in 1999 prompted three days of national mourning in Portugal.",
    songDescription:
      "'Lágrima' (Teardrop) is a tear-soaked fado of love and loss, delivered with Amália's unmistakable vibrato and dramatic restraint. Backed only by the shimmering Portuguese guitarra, her voice carries the full weight of saudade. It is one of the most cherished performances in the fado repertoire.",
    country: "Portugal",
    language: "Portuguese",
    genre: "Folk",
    subgenre: "Fado",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1983,
  },
  {
    title: "To Ti Na Po",
    artist: "Bulgarian State Television Female Vocal Choir",
    artistDescription:
      "The Bulgarian State Television Female Vocal Choir became famous worldwide through the 'Le Mystère des Voix Bulgares' recordings, which revealed the startling beauty of Bulgarian women's choral singing. Their style uses open-throated belting, unusual harmonies and close, deliberately clashing intervals rooted in village folk tradition. The choir won a Grammy and influenced countless Western musicians.",
    songDescription:
      "'To Ti Na Po' is an arrangement of Bulgarian folk material into shimmering, otherworldly polyphony that seems to glow with overtones. The dissonances that would sound jarring elsewhere become hauntingly beautiful in this tradition. The piece typifies the eerie, crystalline sound that stunned Western listeners in the 1980s.",
    country: "Bulgaria",
    language: "Bulgarian",
    genre: "Folk",
    subgenre: "Bulgarian polyphony",
    albumName: "Le Mystère des Voix Bulgares",
    albumType: "album",
    albumDescription:
      "The Grammy-winning compilation series of Bulgarian women's choral music that brought the tradition to global fame.",
    year: 1975,
  },
  {
    title: "Misirlou",
    artist: "Greek rebetiko tradition",
    artistDescription:
      "'Misirlou' emerged from the rebetiko world — the urban underground music of Greek refugees and the working class in the early 20th century, often compared to American blues. Rebetiko grew in the hashish dens and waterfront tavernas of Athens and Smyrna, blending Greek, Anatolian and Middle Eastern influences. The melody's exact origins are disputed across the Eastern Mediterranean.",
    songDescription:
      "'Misirlou' (meaning 'Egyptian girl') is a sinuous, chromatic melody steeped in the Eastern Mediterranean modal tradition, first popularised in the rebetiko scene in 1927. Its exotic, snaking line has been adopted by Arabic, Jewish, Armenian and later surf-rock musicians alike. The tune is a vivid emblem of the cultural crossroads from which rebetiko sprang.",
    country: "Greece",
    language: "Greek",
    genre: "Folk",
    subgenre: "Rebetiko",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1927,
  },
  {
    title: "Üsküdar'a Gider İken (Katibim)",
    artist: "Safiye Ayla",
    artistDescription:
      "Safiye Ayla was a leading Turkish classical and folk vocalist of the early Republican era, admired for her refined interpretations of Ottoman and Anatolian song. She helped carry traditional Turkish music into the age of recording and radio. This particular song is shared, in countless variants, across the Balkans, the Middle East and North Africa.",
    songDescription:
      "'Üsküdar'a Gider İken', also known as 'Kâtibim', is a beloved Istanbul folk song about a woman and her clerk travelling to the Üsküdar district. Its instantly hummable melody appears under different names and lyrics from Bosnia to Egypt, a testament to the cultural web of the former Ottoman world. The song remains a cherished standard of Turkish music.",
    country: "Turkey",
    language: "Turkish",
    genre: "Folk",
    subgenre: "Turkish folk / türkü",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1949,
  },
  {
    title: "Soltan e Ghalbha",
    artist: "Aref",
    artistDescription:
      "Aref (Aref Arefkia) is one of the most popular Iranian pop singers of the pre-revolution era, whose romantic ballads defined a golden age of Persian popular music in the 1960s and 70s. After the 1979 revolution he continued his career in exile, performing for the large Iranian diaspora. His smooth, emotive voice remains beloved by generations of Iranians.",
    songDescription:
      "'Soltan e Ghalbha' (Sultan of Hearts) is a sweeping romantic ballad that became one of the signature songs of golden-age Iranian pop, tied to a hugely popular film of the same name. Its lush orchestration and yearning melody embody the elegance of pre-revolution Tehran's music scene. The song endures as a nostalgic touchstone for Iranians worldwide.",
    country: "Iran",
    language: "Persian",
    genre: "Pop",
    subgenre: "Persian pop",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1968,
  },
  {
    title: "Aïcha",
    artist: "Cheb Khaled",
    artistDescription:
      "Khaled, the Algerian 'King of Raï', built on his earlier dancefloor success by recording crossover ballads aimed at French and international audiences. He remains one of the most commercially successful Arab musicians ever, with a voice that moves easily between celebration and tenderness. His work helped make raï a fixture of the European pop landscape.",
    songDescription:
      "'Aïcha' is a tender ballad, written for Khaled by the French songwriter Jean-Jacques Goldman, that became a massive 1996 hit across the French-speaking world. Switching between French and Arabic, it tells of a man offering his beloved jewels and poetry, only for her to ask for dignity and freedom instead. Its warm melody and bittersweet message made it one of raï's best-loved songs.",
    country: "Algeria",
    language: "Arabic / French",
    genre: "African",
    subgenre: "Raï / chanson",
    albumName: "Sahra",
    albumType: "album",
    albumDescription:
      "His 1996 album, featuring the smash hit 'Aïcha', which cemented his crossover appeal in France and beyond.",
    year: 1996,
  },
  {
    title: "Waka Waka (This Time for Africa)",
    artist: "Shakira ft. Freshlyground",
    artistDescription:
      "Colombian global pop superstar Shakira teamed with the South African band Freshlyground for the official song of the 2010 FIFA World Cup, the first held on African soil. Shakira is the best-selling Latin music artist of all time, known for fusing Latin pop with Arabic, rock and world influences. Freshlyground added authentic South African flavour to the collaboration.",
    songDescription:
      "'Waka Waka (This Time for Africa)' is an exuberant, optimistic anthem built on the melody of the Cameroonian soukous song 'Zangaléwa' by Golden Sounds. Performed in English and Spanish with African chants, it became one of the best-selling World Cup songs ever. Its celebratory spirit made it the soundtrack of a landmark tournament for the continent.",
    country: "Colombia / South Africa",
    language: "English / Spanish",
    genre: "Pop",
    subgenre: "Afro-pop / world pop",
    albumName: "Sale el Sol",
    albumType: "album",
    albumDescription:
      "Shakira's 2010 album, which included the global World Cup anthem alongside her Latin and pop material.",
    year: 2010,
  },
  {
    title: "Vivir Mi Vida",
    artist: "Marc Anthony",
    artistDescription:
      "Marc Anthony is an American singer of Puerto Rican descent and the best-selling salsa artist in history. With a powerful, soaring voice he has bridged tropical salsa and mainstream Latin pop, winning multiple Grammy and Latin Grammy Awards. He is one of the most recognisable figures in contemporary Latin music.",
    songDescription:
      "'Vivir Mi Vida' (To Live My Life) is an uplifting salsa anthem about embracing joy in the face of hardship, adapted from Khaled's French hit 'C'est la vie'. Its surging brass, danceable rhythm and life-affirming chorus made it a massive 2013 hit across the Spanish-speaking world. The song became one of the defining salsa records of the decade.",
    country: "Puerto Rico / USA",
    language: "Spanish",
    genre: "Latin",
    subgenre: "Salsa",
    albumName: "3.0",
    albumType: "album",
    albumDescription:
      "His 2013 album marking a celebrated return to salsa, anchored by the worldwide hit 'Vivir Mi Vida'.",
    year: 2013,
  },
  {
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    artistDescription:
      "Luis Fonsi is a Puerto Rican pop singer, joined here by Daddy Yankee, the rapper widely credited with bringing reggaeton to a global mainstream. Together they represent two sides of Puerto Rico's enormous influence on modern Latin music. Their collaboration broke records and helped trigger a worldwide wave of Spanish-language pop.",
    songDescription:
      "'Despacito' is a smooth, sensual reggaeton-pop song whose irresistible guitar hook and slow-burning groove made it a 2017 global juggernaut. It topped the charts in dozens of countries and, helped by a Justin Bieber remix, became one of the most-streamed songs in history. The track is widely seen as a turning point that pushed Latin pop into the global mainstream.",
    country: "Puerto Rico",
    language: "Spanish",
    genre: "Latin",
    subgenre: "Reggaeton",
    albumName: "Vida",
    albumType: "album",
    albumDescription:
      "Luis Fonsi's 2019 album, which collected the record-breaking megahit 'Despacito'.",
    year: 2017,
  },
  {
    title: "Gangnam Style",
    artist: "PSY",
    artistDescription:
      "PSY (Park Jae-sang) is a South Korean rapper and entertainer whose satirical sense of humour set him apart from the polished mainstream of K-pop. A veteran performer at home, he became an unexpected worldwide sensation in 2012. He helped demonstrate the global viral potential of Korean pop culture.",
    songDescription:
      "'Gangnam Style' is a comedic dance-pop hit mocking the flashy, status-obsessed lifestyle of Seoul's affluent Gangnam district, complete with its famous 'horse-riding' dance. Its absurdist video became the first ever to surpass a billion views on YouTube. The song turned PSY into a global phenomenon and signalled K-pop's arrival on the world stage.",
    country: "South Korea",
    language: "Korean",
    genre: "Pop",
    subgenre: "K-pop",
    albumName: "Psy 6 (Six Rules), Part 1",
    albumType: "ep",
    albumDescription:
      "His 2012 release featuring the record-shattering worldwide hit 'Gangnam Style'.",
    year: 2012,
  },
  {
    title: "Arirang (traditional)",
    artist: "Korean folk tradition",
    artistDescription:
      "'Arirang' is the unofficial anthem of the Korean people, a folk song so central to national identity that it is sung in both North and South Korea and across the Korean diaspora. It exists in hundreds of regional versions, each tied to a particular place and history. UNESCO has inscribed Arirang on its lists of Intangible Cultural Heritage for both Koreas.",
    songDescription:
      "'Arirang' is a poignant folk song about parting and longing, in which a lover is told that one who abandons their beloved will not walk far before their feet ache. Its simple, deeply expressive melody has carried Korean emotion through centuries of joy and hardship. The song stands as a unifying symbol of Korean culture worldwide.",
    country: "Korea",
    language: "Korean",
    genre: "Folk",
    subgenre: "Korean folk",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1926,
  },
  {
    title: "Mo Li Hua (Jasmine Flower)",
    artist: "Chinese folk tradition",
    artistDescription:
      "'Mo Li Hua' is a centuries-old Chinese folk song, dating at least to the 18th century, that has become one of the most internationally recognised pieces of Chinese music. It has been performed at Olympic ceremonies and state occasions and quoted by Western composers including Puccini in his opera 'Turandot'. The song is treasured as a gentle emblem of Chinese culture.",
    songDescription:
      "'Mo Li Hua' (Jasmine Flower) is a delicate, lyrical ode to the beauty and fragrance of the jasmine blossom, which the singer hesitates to pick. Its graceful pentatonic melody has made it the most familiar Chinese folk tune around the world. The song's tenderness and simplicity give it an enduring, timeless appeal.",
    country: "China",
    language: "Mandarin",
    genre: "Folk",
    subgenre: "Chinese folk",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1804,
  },
  {
    title: "Urtiin Duu (Long Song)",
    artist: "Mongolian folk tradition",
    artistDescription:
      "The Mongolian 'long song' (urtiin duu) is one of the oldest and most revered genres of Mongolian music, recognised by UNESCO as Intangible Cultural Heritage. Each syllable is stretched and ornamented across long, undulating melodic lines, mirroring the boundless space of the steppe. The form is traditionally tied to herding life, celebrations and reverence for nature.",
    songDescription:
      "This piece exemplifies the expansive, melismatic style of the long song, in which a single phrase can unfold over a great span of time. It is typically accompanied by the morin khuur, the two-stringed horsehead fiddle whose sound imitates a galloping horse. The music evokes the vast, open grasslands and nomadic spirit of Mongolia.",
    country: "Mongolia",
    language: "Mongolian",
    genre: "Folk",
    subgenre: "Long song (urtiin duu)",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1990,
  },
  {
    title: "Treaty",
    artist: "Yothu Yindi",
    artistDescription:
      "Yothu Yindi were a groundbreaking Australian band that blended the songlines, language and instruments of the Yolŋu people of Arnhem Land — including the didgeridoo and clapsticks — with rock and dance music. Led by the late Mandawuy Yunupingu, Australian of the Year in 1993, they used their platform to advocate for Aboriginal rights and reconciliation. They were among the first Aboriginal acts to achieve mainstream chart success.",
    songDescription:
      "'Treaty' is a 1991 protest anthem demanding a formal treaty between the Australian government and the country's Aboriginal peoples, a promise that had gone unfulfilled. Sung in both Yolŋu Matha and English, its dance remix became a major hit and a rallying cry. The song remains a landmark of Indigenous Australian music and political expression.",
    country: "Australia",
    language: "Yolŋu Matha / English",
    genre: "Rock",
    subgenre: "Aboriginal rock",
    albumName: "Tribal Voice",
    albumType: "album",
    albumDescription:
      "Their 1991 album that brought Aboriginal language and politics to the Australian charts and beyond.",
    year: 1991,
  },
  {
    title: "Hawai'i '78",
    artist: "Israel Kamakawiwoʻole",
    artistDescription:
      "Israel Kamakawiwoʻole — affectionately known as 'Bruddah Iz' — was a beloved Hawaiian singer and ukulele player who became a gentle giant and symbol of native Hawaiian pride and the aloha spirit. His warm voice and advocacy for Hawaiian sovereignty made him a cultural hero. When he died in 1997, the state of Hawaii flew its flag at half-mast and thousands attended his memorial.",
    songDescription:
      "'Hawai'i '78' is a mournful reflection imagining what Hawaii's ancestral kings and queens would feel seeing the islands today, with their land developed and traditions eroded. Built around the Hawaiian phrase 'Ua mau ke ea o ka ʻāina i ka pono', it is both a lament and a call to protect Hawaiian culture. The song is one of the most powerful statements of the Hawaiian sovereignty movement.",
    country: "USA (Hawaii)",
    language: "Hawaiian / English",
    genre: "Folk",
    subgenre: "Hawaiian",
    albumName: "Facing Future",
    albumType: "album",
    albumDescription:
      "His 1993 album, the best-selling Hawaiian record of all time and home to his famous music.",
    year: 1993,
  },
  {
    title: "Veronica",
    artist: "Ti Frère",
    artistDescription:
      "Ti Frère (Jean Alphonse Ravaton) is considered the grandmaster of séga, the Creole dance music of Mauritius born among the descendants of enslaved Africans on the island. He helped preserve and popularise the traditional 'séga tipik' style, driven by the goatskin ravanne drum. He is a foundational figure in Mauritian musical heritage.",
    songDescription:
      "'Veronica' is one of the most famous traditional séga songs, carried by the pulsing rhythm of the ravanne and lyrics in Mauritian Creole. The music traces back to the gatherings of enslaved people, who used song and dance as expressions of community and release. It remains an emblem of the island's Afro-Creole culture.",
    country: "Mauritius",
    language: "Mauritian Creole",
    genre: "African",
    subgenre: "Séga",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1960,
  },
  {
    title: "Malagasy Guitar",
    artist: "D'Gary",
    artistDescription:
      "D'Gary (Ernest Randrianasolo) is a Malagasy guitarist celebrated for translating the polyrhythms of southern Madagascar's traditional instruments onto the acoustic guitar. Using a vast array of unusual open tunings, he recreates the sound of the valiha tube zither and the marovany box lute. He is regarded as one of the most original fingerstyle guitarists in the world.",
    songDescription:
      "This piece showcases D'Gary's intricate, cascading fingerstyle technique, in which the guitar seems to ring with the interlocking voices of Malagasy folk instruments. The music carries the distinctive lilt and cross-rhythms of the island's Bara and Antandroy traditions. It offers a mesmerising glimpse into the rich, little-heard music of Madagascar.",
    country: "Madagascar",
    language: "Malagasy",
    genre: "Folk",
    subgenre: "Malagasy",
    albumName: "Malagasy Guitar",
    albumType: "album",
    albumDescription:
      "His acclaimed 1992 solo guitar album that introduced his singular Malagasy fingerstyle to international listeners.",
    year: 1992,
  },
  {
    title: "Nho Lobo",
    artist: "Bulimundo",
    artistDescription:
      "Bulimundo were a pioneering Cape Verdean band who electrified funaná, the fast, accordion-driven dance music of the island of Santiago that colonial authorities had long suppressed as too African. By plugging in and modernising the genre in the late 1970s and 80s, they made it the sound of a newly independent nation. They are revered as innovators of modern Cape Verdean pop.",
    songDescription:
      "'Nho Lobo' is a driving funaná powered by the wheezing gaita accordion and the scraping ferrinho, an iron bar played with a knife. Its breakneck rhythm reflects the genre's roots in rural celebration and resistance. The song captures the raw, propulsive energy that makes funaná Cape Verde's most exhilarating dance music.",
    country: "Cape Verde",
    language: "Cape Verdean Creole",
    genre: "African",
    subgenre: "Funaná",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1981,
  },
  {
    title: "Sai",
    artist: "Kanda Bongo Man",
    artistDescription:
      "Kanda Bongo Man is a Congolese soukous singer who revolutionised the genre by streamlining it into fast, guitar-led dance music and pioneering the energetic 'kwassa kwassa' dance. By foregrounding sparkling lead-guitar solos earlier in his songs, he made soukous irresistibly danceable for international audiences. He became one of the most popular African artists in Europe in the 1980s.",
    songDescription:
      "'Sai' is an exuberant soukous track all shimmering, interlocking guitars and buoyant rhythm, designed to fill the dancefloor. Its bright, looping melodies showcase the breezy, joyful style that made Kanda Bongo Man a global ambassador for Congolese music. The song embodies the infectious optimism of classic soukous.",
    country: "DR Congo",
    language: "Lingala",
    genre: "African",
    subgenre: "Soukous",
    albumName: "Kwassa Kwassa",
    albumType: "album",
    albumDescription:
      "His 1989 album that helped spread the kwassa kwassa dance and the modern soukous sound worldwide.",
    year: 1989,
  },
  {
    title: "Shosholoza",
    artist: "South African choral tradition",
    artistDescription:
      "'Shosholoza' is a Nguni call-and-response work song that became an unofficial second national anthem of South Africa. Originally sung by migrant labourers travelling to and toiling in the mines, it later became a song of solidarity, sung by Nelson Mandela and his fellow prisoners on Robben Island. Today it unites crowds at sporting events and national celebrations.",
    songDescription:
      "'Shosholoza' uses a steady, churning call-and-response structure that once matched the rhythm of physical labour, its words evoking a train pushing forward through the hills. The song transforms hardship into collective strength and hope. It endures as one of the most stirring expressions of South African resilience and unity.",
    country: "South Africa",
    language: "Ndebele / Zulu",
    genre: "Folk",
    subgenre: "Work song",
    albumName: null,
    albumType: "single",
    albumDescription: null,
    year: 1950,
  },
];
