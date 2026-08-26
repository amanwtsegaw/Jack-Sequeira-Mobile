export type AboutSectionKey = 'overview' | 'faith' | 'tribute' | 'family';

export type TimelineItem = {
  period: string;
  detail: string;
};

export type AboutTextSection = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  paragraphs: string[];
};

export const aboutTabs: Array<{key: AboutSectionKey; label: string}> = [
  {key: 'overview', label: 'Overview'},
  {key: 'faith', label: 'Faith Journey'},
  {key: 'tribute', label: 'Tribute'},
  {key: 'family', label: 'Family Letter'},
];

export const aboutHero = {
  eyebrow: 'About the Ministry',
  title: 'E.H. "Jack" & Jean Sequeira',
  description:
    "JackSequeira.org - begun in 2002 to share the Good News of the Gospel and give hope to God's children everywhere.",
};

export const jackBiography: AboutTextSection = {
  title: 'Pastor E.H. "Jack" Sequeira',
  paragraphs: [
    'Pastor Sequeira ["suh-KWHERE-ah"] was born in Nairobi, Kenya. He joined the Seventh-day Adventist church through evangelism in 1957. Feeling called to the ministry, Jack rode to England from Nairobi on his motorcycle in 1958 and spent 14 months working as a literature evangelist before enrolling at Newbold College (England). He graduated with a B.A. in theology in 1963. He earned an M.A. in systematic theology at Andrews University (Berrien Springs, Michigan, U.S.A.) in 1965. Pastor Sequeira earned his M.Div. at Andrews University in 1970.',
    "Jack and Jean were married on New Year's Day, 1964. They served as missionaries for 17 years in Uganda, Kenya, and Ethiopia. Jack served in various capacities as Bible teacher, departmental director, university chaplain, union ministerial director, and college president. Jean taught English and was Administrative Assistant for the Director of the East African Union. She also worked as secretary for the Ministerial Department for the Ethiopian Union. While in Africa, Jean helped to train pastors' wives and enjoyed working with women in the villages.",
    'In 1982, the Sequeiras moved to the United States. Jack served as pastor for the Kuna and Nampa churches in the Idaho Conference, then as senior pastor of the Walla Walla City Church in Washington State. In 1991, he became senior pastor of the Capital Memorial Church in Washington, D.C. Pastor Jack retired in January 2001 but continued to minister via this website.',
  ],
};

export const ministryTimeline: TimelineItem[] = [
  {period: '1957', detail: 'Joined the Seventh-day Adventist Church through evangelism in Nairobi'},
  {period: '1958-63', detail: 'Literature evangelist, then Newbold College (B.A. Theology, England)'},
  {period: '1965', detail: 'M.A. Systematic Theology, Andrews University, Michigan'},
  {period: '1965-68', detail: 'Education Secretary, Uganda; Teacher, Kamagambo & Maxwell Secondary, Kenya'},
  {period: '1969-72', detail: 'Uganda: Education & MV Secretary; Principal, Bugema Adventist College'},
  {period: '1972', detail: "Included in Idi Amin's expulsion of 80,000 Asians from Uganda; relocated to Beirut"},
  {period: '1970', detail: 'M.Div., Andrews University'},
  {period: '1973-77', detail: 'Assigned to Ethiopia by the Afro-Mideast Division'},
  {period: '1978-82', detail: 'Kenya - Chaplain for SDA students in government universities'},
  {period: '1982-87', detail: 'District Pastor, Idaho Conference, U.S.A.'},
  {period: '1987-91', detail: 'Senior Pastor, Walla Walla City Church, Upper Columbia Conference'},
  {period: '1991-2001', detail: 'Senior Pastor, Capital Memorial Church, Washington D.C., Potomac Conference'},
  {period: '2001', detail: 'Retired; continued ministry through JackSequeira.org'},
  {period: 'March 26, 2022', detail: 'Fell asleep in Jesus in Portland, Oregon, after a disabling stroke'},
];

export const obituary: AboutTextSection = {
  eyebrow: 'In Memoriam',
  title: 'Obituary - Pastor E.H. Jack Sequeira',
  subtitle: 'September 25, 1932 - March 26, 2022 · Nairobi, Kenya to Portland, Oregon',
  paragraphs: [
    'Born on September 25, 1932 in Nairobi, Kenya, to parents from Goa, India, Jack lived a long and fruitful life. He suffered a disabling stroke and fell asleep in Jesus on March 26, 2022 in a Portland, Oregon, hospital.',
    'Jack served the Seventh-day Adventist Church in many capacities in England, Uganda, Kenya, Ethiopia, and the United States.',
    'After graduating from Newbold College, England, he trained students in the colporteur work for the South England Conference. After studying at Andrews University, he served in Uganda as Education, Missionary Volunteer, and Home Missionary Secretary in 1965. Then he was called to Kenya to teach at Kamagambo Teacher Training College near Kisii, and Maxwell Secondary School in Nairobi (1966-68). He returned to Uganda as Education and Missionary Volunteer Secretary (1969) and then as Principal of Bugema Adventist College (1971-72).',
    "Being included in Idi Amin's notorious Exodus, when 80,000 Asians were deported from Uganda, Jack and his family had to leave everything in their home and stayed in Beirut, Lebanon, the headquarters of the Afro Mideast Division. Later, Pastor Jack was assigned to Ethiopia (1973-77), then back to Kenya as Chaplain for the SDA students in government universities (1978-82).",
    'In 1982 the family moved to the U.S. to fulfil General Conference requirements related to their refugee status due to their Uganda experience. Jack served as a District Pastor for the Idaho Conference until 1987, when he was called to pastor the Walla Walla City Church in the Upper Columbia Conference. From 1991-2001 he served the Potomac Conference as pastor of the Capital Memorial Church in Washington, DC.',
    'Pastor Jack was known around the world for his infectious smile and biblical preaching from the Word of God; the book of Romans; and Righteousness by Faith. He firmly believed in salvation by faith accomplished by Christ over two thousand years ago and was used by the Lord to bring many to a better understanding of our Creator God.',
    'He is survived by his wife Jean, daughter Jenny, son Chris and wife Nenette, and their children Jazmine, Parker, Shasta, and Luis.',
  ],
};

export const jeanBiography: AboutTextSection = {
  title: 'Jean Sequeira',
  paragraphs: [
    'Jean, born in North London, England, also became a Seventh-day Adventist through evangelism. She trained as a Bible instructor at Newbold College in England and served at the New Gallery Centre in London. She has a B.A. in English from Walla Walla College in Washington State (U.S.A.).',
    "Since moving to the U.S., Jean worked in computer centers at Northwest Nazarene College and Walla Walla College. She helped compile the first Handbook, served on several committees, and contributed seminars for Leadership Courses for the General Conference Women's Ministries department. One of her most interesting assignments was researching the lives of prominent women from around the world for inclusion in the Seventh-day Adventist Encyclopedia.",
    "Jean was an editorial secretary for the Adventist Review for eight years, and now manages JackSequeira.org Ministries. She enjoys gardening, freelance writing, and her children and grandchildren. She served on the Potomac Conference Women's Advisory and the Oregon Conference Women's Ministries Board and was a district coordinator. She has presented seminars for women's events and is well-known for her animated missions and children's stories.",
  ],
};

export const sequeiraFamily: AboutTextSection = {
  title: 'The Sequeira Family',
  paragraphs: [
    'The Sequeira family includes Christopher, born in Kenya, who is married to Nenette. They have both taught at Livingstone Adventist Academy in Salem, Oregon. They are the parents of four children: Jazmine, Parker, Shasta, and Luis.',
    "Jenny, born in Uganda, was a health Peace Corps Volunteer in The Gambia, West Africa. She continues to work in global public health focusing on women's and children's health, and has been based in Azerbaijan, Ethiopia, Nigeria, and Uganda.",
    "After Pastor Jack's sudden death in March 2022, Jean, Chris, and Jenny agreed to continue the JackSequeira.org website - begun in 2002 to share the Good News of the Gospel and give hope to God's children everywhere - since it receives so many visitors. Chris and his son Parker now serve as webmasters.",
  ],
};

export const supportMinistry: AboutTextSection = {
  title: 'Support the Ministry',
  paragraphs: [
    'In lieu of flowers, tax-deductible gifts support theology students in East Africa and related church projects.',
    'Treasurer, Gladstone Park SDA Church, 8378 Cason Road, Gladstone, Oregon 97027, U.S.A.',
    'For books or DVDs, please contact: Creative Media Ministries 951.440.7688 or Glad Tidings 269.473.1888.',
  ],
};

export const faithJourneyIntro: AboutTextSection = {
  eyebrow: 'About / Personal Faith Journey',
  title: 'My Personal Faith Journey',
  subtitle: 'By E.H. "Jack" Sequeira',
  paragraphs: [
    'For some time now individuals and organizations have made verbal and written public statements about me, and my theology. Many of these statements contain error and falsehood. True and good journalism always checks for accuracy when writing about someone else. Since this has not been done, the purpose of this paper is to set the record straight.',
  ],
};

export const faithHistoricalBackground: AboutTextSection = {
  title: 'Historical Background',
  paragraphs: [
    'My parents originated from Goa, a Portuguese enclave on the west coast of India. They migrated to the British Colony of Kenya, East Africa, in 1913. My father worked in Nairobi (capital of Kenya) as an accountant for the British Government. It was here that I was born in 1932. Four years later my parents moved to Mombasa, the main port of Kenya and the second largest city of the country.',
    'This is where I grew up and, being devout, my parents raised me as a staunch Roman Catholic. I served as an altar boy in my younger years. My elementary and high school education was completed in Catholic schools.',
    "In the early 1950s, the Mau Mau uprising by one of the largest tribes, the Kikuyu, took place in Kenya. At that time, the British Government introduced national service and I moved to Nairobi to do my two years' service. Having finished my national service, I remained in Nairobi working as an architect.",
    'Across from the home where I was living was a Seventh-day Adventist missionary, Robert Wieland and his family. He was the president of the Central Kenya Field. One of my hobbies at that time was racing motorcycles. It was this that led Elder Wieland to come to me for help in supporting the African pastors with reliable transportation. We became good friends, but not once did he bring up the subject of religion.',
    'However, in 1957, the Central Seventh-day Adventist Church in Nairobi planned an evangelistic effort. Elder Wieland came to me with the request that I take my landlady to attend. He knew that, as a staunch Roman Catholic, I would not attend on my own.',
    'As a result, I sat at the back of the church and listened to Elder Dale Ringering, the evangelist, for some three weeks. It was the first time in my life I was exposed to the prophecies and truths of the Bible. As a Catholic, I had not even seen a Bible, let alone read one. The Holy Spirit convicted me, and, as a result, I decided to join the Adventist church.',
    'The missionary who gave me these baptismal studies was the late Elder Joe Hunt. Twice a week I rode two miles to his home on my motorcycle. On the day Elder Wieland was baptizing his son Bob, Elder Joe Hunt requested him to baptize me at the same time, since my baptism studies were completed and Elder Wieland was already in the baptistry.',
    'Many years later I learned why Elder Wieland was unable to study with me directly. His manuscript on "1888 Re-examined," co-authored by Elder Don Short, was rejected by the GC Committee and, as a result, Wieland was black-listed by the missionaries of the East African Union. So the accusation often made that my theology was influenced by Wieland on the 1888 message is entirely false, even though we both came to the same conclusion regarding the 1888 message independently.',
    'Not long after I became a Seventh-day Adventist, I discovered that I had moved from one form of legalism, the Roman Catholic Church, to another form of legalism in the Seventh-day Adventist denomination. Both churches had given me no assurance of salvation. This is a common problem, even today, among our members.',
    'Six months after my conversion, I rode my motorcycle from Nairobi to London. Just before I left, the youth director of the East African Union, Elder Bob Osmunson, handed me a Youth Instructor magazine and encouraged me to attend Newbold College. After serving as a literature evangelist for a year, I attended Newbold College for four years and graduated with a B.A. degree in theology - but with no peace or assurance of salvation.',
    'After graduation I married my wife, Jean, and we came to the U.S. where I studied for my M.A. degree in theology. I hoped that Andrews University would give me the assurance of salvation for which I was desperately looking. I graduated in 1965 with an M.A. degree in Systematic Theology but still no peace or assurance in my heart.',
    'In 1969, the British Parliament cancelled all British Passports issued in the colonies. Since this is what I had, it meant I became stateless. As a result, the Uganda Government under Milton Obote cancelled my work permit. The Afro-Mideast Division decided to send me back to Andrews University to study for another degree, while setting the wheels in motion towards obtaining my U.S. citizenship.',
    'During my mission service in Uganda, I heard, for the first time, about the 1888 Message on Righteousness by Faith. I decided to research the 1888 message while at Andrews University studying for my M.Div. I did an in-depth study of what E.J. Waggoner and A.T. Jones taught, along with what Ellen G. White had to say about the 1888 message. At last my eyes were opened to the fact that what God was requiring from me for salvation was actually accomplished for me in Christ over two thousand years ago. That was indeed exceedingly good news.',
    "Not long after I returned to Uganda, the country experienced a coup under Idi Amin, and in 1972 he deported all the Asians from Uganda. My family and I were among the eighty thousand deportees. We landed in Beirut, the headquarters of the Afro-Mideast Division. Waiting for a work permit to Ethiopia gave me time to do an exegetical study on the two main books Waggoner and Jones used to proclaim the 1888 message - Paul's Epistles to the Romans and Galatians.",
    'I discovered that these two men were absolutely correct on the whole in their presentations on Christ our Righteousness and the doctrine of Righteousness by Faith. This is what sealed my convictions on the 1888 message and completely transformed my ministry.',
    'Ever since then (1973), my total ministry changed and I have been mainly presenting this incredible good news of salvation in Christ to our Seventh-day Adventists members, many of whom have no assurance of salvation. This has continued even after my official retirement in 2001.',
  ],
};

export const inChristMotif: AboutTextSection = {
  title: 'The In Christ Motif',
  paragraphs: [
    "There is a key phrase that runs throughout Paul's epistles (some 64 times). This recurring phrase, the central theme of Paul's theology, is the expression in Christ or in Christ Jesus. This phrase is sometimes expressed by other synonymous phrases, such as: in Him, by Him, through Him, in the Beloved, together with Him, etc. If these phrases were removed from Paul's writings, there would be very little left of Paul's exposition of the good news of the gospel.",
    'There is nothing we have as Christians except we have it in Christ. Everything we enjoy and hope for as believers - the immediate and continuing joys of Justification by faith, the on-going experience of Sanctification, and the hope of Glorification - are ours only in Christ (Ephesians 2:4-7). Outside of Him we have nothing but sin, condemnation, and death (Romans 5:18a; Ephesians 2:1-3).',
    'The phrase in Christ is based on Biblical solidarity, which simply means "the many in one." God created all mankind in one man, Adam (Acts 17:26). In the same way, Paul refers to Christ as the last Adam (1 Corinthians 15:45). Like the first Adam, Christ also represented and substituted the entire human race in His work of redemption.',
    "In presenting the in Christ motif, the apostle Paul presents it in three phases: the Planning Phase before the foundation of the world; the Reality Phase in the birth, life, death, and resurrection of Jesus Christ; and the Experience Phase, in which God's gift is received by faith and continues in believers until the Second coming of Christ.",
    'I firmly believe when we Adventists fulfil this global mission we will have truly proclaimed the everlasting gospel of the three angels of Revelation 14 with the power of the fourth angel of Revelation 18. When this is realized, it will become inexcusable for anyone to be lost. The end will then come (Matthew 24:4).',
  ],
};

export const humanNatureOfChrist: AboutTextSection = {
  title: 'The Human Nature of Christ',
  paragraphs: [
    'Ever since the publishing of the book Questions on Doctrine (1957), this topic on the human nature of Christ has become a hot potato. Yet Ellen G. White clearly states: "The humanity of the Son of God is everything to us... This should be our study" (SM, vol. 1, 244). The reason for this is that the humanity of our Savior is vitally linked to the everlasting gospel of Revelation 14 and our salvation from the universal sin problem.',
    'According to the New Testament, sin is a dual problem. Sin is both a verb (action) and a noun (condition or state). Our sinful behavior does not make us sinners but only proves what we are by nature. Our very nature condemns us to death from birth (Romans 5:12-18; Ephesians 2:1-3).',
    'For Christ to redeem mankind from both sin problems, He had to assume the self-same nature we are born with, in order for Him to be our complete Savior. That is why Hebrews 2:17 declares: "For this reason he had to be made like his brothers in every way, in order that he might become a merciful and faithful high priest" (NIV).',
    'Does this make Christ a sinner in need of a Savior? The answer is a definite NO. We must never teach that Christ had a sinful nature, but rather He assumed our sinful nature that needed redeeming. Ellen G. White puts it this way: "He took upon His sinless (divine) nature our sinful (human) nature, that He might know how to succor those who are tempted" (Medical Ministry, 181).',
    'But not even by a thought did He allow the sinful desires of the flesh to control Him. He conquered our sinful human nature during His thirty-three years on this earth and finally executed it on the cross (Romans 8:2-3). Thus He took to heaven a glorified humanity, which He is reserving for all believers at His Second Advent (Romans 8:22-25; Philippians 3:20-21). This is the incredible good news of the everlasting gospel.',
    'For those who would like a deeper understanding of this important truth, as it is in Christ, Pastor Jack recommends his book Saviour of the World (218 pages), published by Pacific Press Publishing Association (1996).',
    '"Surely, God is patiently waiting for the day when as a united church the world will hear from Adventists the loud cry and One truth will prevail, one subject will swallow up every other, Christ our righteousness" (Sons and Daughters, 259). - Jack Sequeira',
  ],
};

export const tributeFriends = [
  'Judi & John',
  'Tom & Beth',
  'Freda & Zach',
  'Norm & Joan',
  'Jacquie & Marty',
  'Milenko & Blazenka',
  'Steven',
  'Jim & Family',
  'Karen & Darel',
  'Bernie & Karen',
  'Capital Memorial Church',
  'Sue H.',
  'Sue B.',
  'And many other friends',
];

export const tributeIntro: AboutTextSection = {
  eyebrow: 'About / Tribute',
  title: 'Tribute to Friends',
  paragraphs: [
    'Without the support of many friends, this ministry would not exist as it does today. With their prayers, vision, and continued encouragement, they make it possible to reach out and touch people worldwide with the peace and joy which only comes from knowing Jesus Christ and the Good News of the Gospel.',
    '"Love, prayers, and a heart full of thanks," - Jack & Jean',
  ],
};

export const jacquieThanks: AboutTextSection = {
  title: 'Special Thanks - Jacquie Bokow',
  paragraphs: [
    "Our heartfelt gratitude to Jacquie Bokow for her many years spent developing the JSM website since 1996 when we served at Capital Memorial Church in Washington, D.C. Hundreds of souls around the world have been blessed by her expertise and faithful work in making Pastor Jack's material available. Thank you, Jacquie!",
  ],
};

export const normJoanTribute: AboutTextSection = {
  eyebrow: 'In Memoriam',
  title: 'Our Tribute to Norm & Joan Barker',
  subtitle: 'Memorial service held in Canada, 10 May 2014',
  paragraphs: [
    'A special memorial service for our dear friends Norm and Joan Barker was held in Canada on 10 May 2014. Joan fell asleep in Jesus earlier in the year, followed by her beloved companion. Without their dedicated support, our ministry today would not exist.',
    "Way back in 1990, we gave permission for them to transcribe Jack's sermons and print them in book form. Joan transcribed the sermons with Norm's help. What made this special couple's contribution even more amazing was Joan's diminishing eyesight. But she continued to painfully transcribe my sermons one sentence at a time using special software. They willingly contributed 12 years to our ministry, involving countless hours of untiring dedication. This included traveling some 500,000 miles in their VW, distributing and mailing materials all over the U.S., Canada, and the World.",
    'Only in heaven will we discover the sacrifices they made to spread The Good News of the gospel. We are sure that many people will be there because of the contact they first had with Norm and Joan. They will be greatly missed, but we look forward to seeing them again when our Lord comes to take us to heaven, never to be separated again. What a wonderful example of Christian love they have left for each one of us.',
    'May God bless their children, along with their loved ones and friends.',
    'With heartfelt appreciation, Pastor Jack and Jean Sequeira',
  ],
};

export const normJoanHistory: AboutTextSection = {
  title: 'A History',
  paragraphs: [
    "In the 1970s, Norm and Joan received a book from a friend in California. They didn't remember the title or author of that book, but written inside was a quote from Fundamentals of the Everlasting Gospel by E.H. Sequeira, of the Ethiopian Union.",
    'Norm said that, from that short quote, a light bulb went on in his mind, and they wanted a copy of the book but did not know how to reach the author. In 1987, they attended meetings at Andrews University and heard someone mention that "Jack" was there. They introduced themselves and asked how to receive his books. They took the few copies he had, shared them with friends, and kept in touch. They wanted more, but were told they were out of print.',
    'Finally, in 1990, they persuaded Jack to let them print his books. They started with equipment in their home and the first printing of 2,000 Dynamics of the Everlasting Gospel sold out in three months. The next printing of 3,000 went in another three months.',
    'Since then, they printed more than 42,000 books and made 3,000 copies of tape albums. The most popular books were Dynamics of the Everlasting Gospel, Romans, Gospel in a Nutshell, and The Cross of Christ. Favorite tapes included Romans, The Cross of Christ, The Holy Spirit, 27 Fundamentals, and Gospel in a Nutshell.',
    'They willingly contributed 12 years to this ministry, involving countless hours of untiring dedication. They went through VW automobiles and covered around 500,000 miles distributing and mailing materials.',
    'What makes this special couple\'s contribution even more amazing is that Joan became totally blind by the fall of 1996. They attributed this to possible chemical poisoning when formaldehyde may have destroyed her optic nerves. But to see Joan at work, patiently transcribing one sentence at a time, one would never have guessed that she was blind. Special software, "Outspoken," aided her transcriptions of Pastor Jack\'s sermon tapes on their Macintosh computer.',
    "Norm used his expertise and equipment to edit, proof, print, cut, bind, advertise, and market the products. They say that their greatest joy experienced over the years has been the enthusiastic response to Pastor Jack's books. So many people have shared their stories of the joy, peace, and assurance received from studying the books and listening to the tapes.",
    'It was only after they had well passed their three-score years and ten that they felt the need to pass the work on to others. After JackSequeira.org began in 1996, the books the Barkers printed were sold through the website. Over time, those books were all transferred to the website.',
  ],
};

export const normJoanStats = [
  {number: '42,000+', label: 'Books printed'},
  {number: '3,000', label: 'Tape albums made'},
  {number: '500,000 mi', label: 'Traveled distributing materials'},
];

export const familyLetter: AboutTextSection = {
  eyebrow: 'About / Letter from Family',
  title: 'Letter from the Sequeira Family',
  subtitle: 'Gladstone, Oregon - 31 December 2023',
  paragraphs: [
    "Due to Jean's advancing years, and not having a current stock of books or other media, our family has made the difficult decision to keep jacksequeira.org active only as a web page. However, Chris will make any managerial decisions as he and his son, Parker, work together as the new web masters.",
    'This means that Jack Sequeira Ministries (JSM) can no longer accept donations or orders for material. Should you wish to order books or DVDs, please contact Creative Media Ministries: 951.440.7688, or Glad Tidings: 269.473.1888.',
    "At this point we must extend our heartfelt gratitude to Jacquie Bokow for her many years spent developing the JSM website since 1996 when we served at Capital Memorial Church in Washington, D.C. Hundreds of souls around the world have been blessed by her expertise and faithful work in making Pastor Jack's material available. Thank you, Jacquie!",
    "We also honour the memory of Norm and Joan Barker who were the originators of an outreach to share the good news of the gospel by providing information about Pastor Jack's books and tapes.",
    'Also, we can never forget the many friends who helped financially in getting JSM off the ground. We would have been unable to do this on our own, so, Praise the Lord for all that He has done through others over the years.',
    "Because of these combined efforts, Jack Sequeira Ministries has reached thousands of people around the world. During Jack's last days when he regretted being unable to preach, Jean went to the web page with the revolving globe and printed that page showing red lights where people had logged on.",
    'It was a great encouragement to him, as have the constant flow of emails and calls of appreciation which continue coming in to us. So, we hope to keep the site up and going in the years ahead.',
    'Finally, we give praise to the Lord for every soul won to Him, and every life changed for His glory. Sincere thanks to each one who has had a part in contributing to the outreach of JSM.',
    'Blessings on your day, The Sequeira Family - Jean, Chris & Nenette, Parker, Jenny',
  ],
};
