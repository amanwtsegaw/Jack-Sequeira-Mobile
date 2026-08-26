export type AudioTrack = {
  id?: string;
  title: string;
  reference: string;
  fileName: string;
  extension: string;
  sourcePath?: string;
  sourceUrl?: string;
};

export type AudioCollection = {
  key: string;
  title: string;
  description: string;
  tracks: AudioTrack[];
};

export type VideoItem = {
  id: string;
  title: string;
  duration?: string;
  sourceUrl?: string;
  youtubeId: string;
  thumbnailUrl: string;
  embedUrl: string;
  reference?: string;
};

export type VideoCollection = {
  key: string;
  title: string;
  description: string;
  items: VideoItem[];
};

export const audioCollections: AudioCollection[] = [
  {
    key: 'ephesians',
    title: 'Ephesians',
    description: 'Riches in Christ, wisdom, unity, and the Christian walk.',
    tracks: [
      {title: 'Riches In Christ', reference: 'Ephesians 1A', fileName: 'Ephesians1A-RichesInChrist.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians1A-RichesInChrist.mp3'},
      {title: 'Spiritual Wisdom', reference: 'Ephesians 1B', fileName: 'Ephesians1B-SpiritualWisdom.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians1B-SpiritualWisdom.mp3'},
      {title: 'Unconditional Good News', reference: 'Ephesians 2A', fileName: 'Ephesians2A-UnconditionalGoodNews.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians2A-UnconditionalGoodNews.mp3'},
      {title: 'Christ Our Peace', reference: 'Ephesians 2B', fileName: 'Ephesians2B-ChristOurPeace.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians2B-ChristOurPeace.mp3'},
      {title: 'The Divine Mystery', reference: 'Ephesians 3A', fileName: 'Ephesians3A-TheDivineMystery.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians3A-TheDivineMystery.mp3'},
      {title: 'Rooted And Grounded In Love', reference: 'Ephesians 3B', fileName: 'Ephesians3B-RootedAndGroundedInLove.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians3B-RootedAndGroundedInLove.mp3'},
      {title: 'Walking In Unity', reference: 'Ephesians 4A', fileName: 'Ephesians4A-WalkingInUnity.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians4A-WalkingInUnity.mp3'},
      {title: 'Spiritual Gifts', reference: 'Ephesians 4B', fileName: 'Ephesians4B-SpiritualGifts.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians4B-SpiritualGifts.mp3'},
      {title: 'The New Life In Christ', reference: 'Ephesians 5A', fileName: 'Ephesians5A-TheNewLifeInChrist.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians5A-TheNewLifeInChrist.mp3'},
      {title: 'The Christian Walk', reference: 'Ephesians 5B', fileName: 'Ephesians5B-TheChristianWalk.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians5B-TheChristianWalk.mp3'},
      {title: 'The Christian Home', reference: 'Ephesians 6A', fileName: 'Ephesians6A-TheChristianHome.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians6A-TheChristianHome.mp3'},
      {title: 'Putting On The Whole Armor', reference: 'Ephesians 6B', fileName: 'Ephesians6B-PuttingOnTheWholeArmor.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Ephesians6B-PuttingOnTheWholeArmor.mp3'},
    ],
  },
  {
    key: 'galatians',
    title: 'Galatians',
    description: "Grace, freedom, and righteousness by faith through Paul's letter.",
    tracks: [
      {title: 'Galatians 1:1-10', reference: 'Galatians 1:1-10', fileName: 'Galatians_1_1-10.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_1_1-10.mp3'},
      {title: 'Galatians 1:11-24', reference: 'Galatians 1:11-24', fileName: 'Galatians_1_11-24.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_1_11-24.mp3'},
      {title: 'Galatians 2:1-10', reference: 'Galatians 2:1-10', fileName: 'Galatians_2_1-10.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_2_1-10.mp3'},
      {title: 'Galatians 2:11-21', reference: 'Galatians 2:11-21', fileName: 'Galatians_2_11-21.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_2_11-21.mp3'},
      {title: 'Galatians 3:1-9', reference: 'Galatians 3:1-9', fileName: 'Galatians_3_1-9.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_3_1-9.mp3'},
      {title: 'Galatians 3:10-14', reference: 'Galatians 3:10-14', fileName: 'Galatians_3_10-14.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_3_10-14.mp3'},
      {title: 'Galatians 3:15-29', reference: 'Galatians 3:15-29', fileName: 'Galatians_3_15-29.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_3_15-29.mp3'},
      {title: 'Galatians 4:1-11', reference: 'Galatians 4:1-11', fileName: 'Galatians_4_1-11.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_4_1-11.mp3'},
      {title: 'Galatians 4:12-20', reference: 'Galatians 4:12-20', fileName: 'Galatians_4_12-20.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_4_12-20.mp3'},
      {title: 'Galatians 4:21-31', reference: 'Galatians 4:21-31', fileName: 'Galatians_4_21-31.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_4_21-31.mp3'},
      {title: 'Galatians 5:1 and 13', reference: 'Galatians 5:1 and 13', fileName: 'Galatians_5_1and13.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_5_1and13.mp3'},
      {title: 'Galatians 5:1-12', reference: 'Galatians 5:1-12', fileName: 'Galatians_5_1-12.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_5_1-12.mp3'},
      {title: 'Galatians 5:13-15', reference: 'Galatians 5:13-15', fileName: 'Galatians_5_13-15.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_5_13-15.mp3'},
      {title: 'Galatians 5:16-26', reference: 'Galatians 5:16-26', fileName: 'Galatians_5_16-26.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_5_16-26.mp3'},
      {title: 'Galatians 6:1-10', reference: 'Galatians 6:1-10', fileName: 'Galatians_6_1-10.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_6_1-10.mp3'},
      {title: 'Galatians 6:11-18', reference: 'Galatians 6:11-18', fileName: 'Galatians_6_11-18.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Galatians_6_11-18.mp3'},
    ],
  },
  {
    key: 'hebrews',
    title: 'Hebrews',
    description: 'The supremacy of Christ and the promise of the new covenant.',
    tracks: [
      {title: 'Hebrews 1:1-3', reference: 'Hebrews 1:1-3', fileName: 'Hebrews_1_1-3.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_1_1-3.mp3'},
      {title: 'Hebrews 1:4-2:4', reference: 'Hebrews 1:4-2:4', fileName: 'Hebrews_1_4-2_4.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_1_4-2_4.mp3'},
      {title: 'Hebrews 2:5-13', reference: 'Hebrews 2:5-13', fileName: 'Hebrews_2_5-13.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_2_5-13.mp3'},
      {title: 'Hebrews 2:14-18', reference: 'Hebrews 2:14-18', fileName: 'Hebrews_2_14-18.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_2_14-18.mp3'},
      {title: 'Hebrews 3:1-6', reference: 'Hebrews 3:1-6', fileName: 'Hebrews_3_1-6.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_3_1-6.mp3'},
      {title: 'Hebrews 3:7-19', reference: 'Hebrews 3:7-19', fileName: 'Hebrews_3_7-19.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_3_7-19.mp3'},
      {title: 'Hebrews 4:1-13', reference: 'Hebrews 4:1-13', fileName: 'Hebrews_4_1-13.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_4_1-13.mp3'},
      {title: 'Hebrews 4:14-5:10', reference: 'Hebrews 4:14-5:10', fileName: 'Hebrews_4_14-5_10.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_4_14-5_10.mp3'},
      {title: 'Hebrews 5:11-6:12', reference: 'Hebrews 5:11-6:12', fileName: 'Hebrews_5_11-6_12.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_5_11-6_12.mp3'},
      {title: 'Hebrews 6:13-20', reference: 'Hebrews 6:13-20', fileName: 'Hebrews_6_13-20.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_6_13-20.mp3'},
      {title: 'Hebrews 7:1-28', reference: 'Hebrews 7:1-28', fileName: 'Hebrews_7_1-28.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_7_1-28.mp3'},
      {title: 'Hebrews 8:1-13', reference: 'Hebrews 8:1-13', fileName: 'Hebrews_8_1-13.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_8_1-13.mp3'},
      {title: 'Hebrews 9:1-28', reference: 'Hebrews 9:1-28', fileName: 'Hebrews_9_1-28.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_9_1-28.mp3'},
      {title: 'Hebrews 10:1-22', reference: 'Hebrews 10:1-22', fileName: 'Hebrews_10_1-22.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_10_1-22.mp3'},
      {title: 'Hebrews 10:23-29', reference: 'Hebrews 10:23-29', fileName: 'Hebrews_10_23-29.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_10_23-29.mp3'},
      {title: 'Hebrews 11:1-40', reference: 'Hebrews 11:1-40', fileName: 'Hebrews_11_1-40.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_11_1-40.mp3'},
      {title: 'Hebrews 12:1-4', reference: 'Hebrews 12:1-4', fileName: 'Hebrews_12_1-4.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_12_1-4.mp3'},
      {title: 'Hebrews 12:5-11', reference: 'Hebrews 12:5-11', fileName: 'Hebrews_12_5-11.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_12_5-11.mp3'},
      {title: 'Hebrews 12:12-29', reference: 'Hebrews 12:12-29', fileName: 'Hebrews_12_12-29.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_12_12-29.mp3'},
      {title: 'Hebrews 13:1-24', reference: 'Hebrews 13:1-24', fileName: 'Hebrews_13_1-24.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Hebrews_13_1-24.mp3'},
    ],
  },
  {
    key: 'romans',
    title: 'Romans',
    description: 'A complete verse-by-verse audio journey through Romans.',
    tracks: [
      {title: 'Romans 1:1-17', reference: 'Romans 1:1-17', fileName: 'romans_1_1-17.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_1_1-17.mp3'},
      {title: 'Romans 1:18-32', reference: 'Romans 1:18-32', fileName: 'romans_1_18-32.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_1_18-32.mp3'},
      {title: 'Romans 2:1-29', reference: 'Romans 2:1-29', fileName: 'romans_2_1-29.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_2_1-29.mp3'},
      {title: 'Romans 3:1-20', reference: 'Romans 3:1-20', fileName: 'romans_3_1-20.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_3_1-20.mp3'},
      {title: 'Romans 3:21-23', reference: 'Romans 3:21-23', fileName: 'romans_3_21-23.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_3_21-23.mp3'},
      {title: 'Romans 3:24-31', reference: 'Romans 3:24-31', fileName: 'romans_3_24-31.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_3_24-31.mp3'},
      {title: 'Romans 4:1-25', reference: 'Romans 4:1-25', fileName: 'romans_4_1-25.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_4_1-25.mp3'},
      {title: 'Romans 5:1-5', reference: 'Romans 5:1-5', fileName: 'romans_5_1-5.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_5_1-5.mp3'},
      {title: 'Romans 5:6-10', reference: 'Romans 5:6-10', fileName: 'romans_5_6-10.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_5_6-10.mp3'},
      {title: 'Romans 5:11-14', reference: 'Romans 5:11-14', fileName: 'romans_5_11-14.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_5_11-14.mp3'},
      {title: 'Romans 5:15-18', reference: 'Romans 5:15-18', fileName: 'romans_5_15-18.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_5_15-18.mp3'},
      {title: 'Romans 5:19-21', reference: 'Romans 5:19-21', fileName: 'romans_5_19-21.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_5_19-21.mp3'},
      {title: 'Romans 6:1-13', reference: 'Romans 6:1-13', fileName: 'romans_6_1-13.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_6_1-13.mp3'},
      {title: 'Romans 6:14-15', reference: 'Romans 6:14-15', fileName: 'romans_6_14-15.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_6_14-15.mp3'},
      {title: 'Romans 6:16-23', reference: 'Romans 6:16-23', fileName: 'romans_6_16-23.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_6_16-23.mp3'},
      {title: 'Romans 7:1-6', reference: 'Romans 7:1-6', fileName: 'romans_7_1-6.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_7_1-6.mp3'},
      {title: 'Romans 7:7-13', reference: 'Romans 7:7-13', fileName: 'romans_7_7-13.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_7_7-13.mp3'},
      {title: 'Romans 7:14-25', reference: 'Romans 7:14-25', fileName: 'romans_7_14-25.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_7_14-25.mp3'},
      {title: 'Romans 8:1-4', reference: 'Romans 8:1-4', fileName: 'romans_8_1-4.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_8_1-4.mp3'},
      {title: 'Romans 8:5-14', reference: 'Romans 8:5-14', fileName: 'romans_8_5-14.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_8_5-14.mp3'},
      {title: 'Romans 8:14-30', reference: 'Romans 8:14-30', fileName: 'romans_8_14-30.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_8_14-30.mp3'},
      {title: 'Romans 8:31-39', reference: 'Romans 8:31-39', fileName: 'romans_8_31-39.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_8_31-39.mp3'},
      {title: 'Romans 9:1-33', reference: 'Romans 9:1-33', fileName: 'romans_9_1-33.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_9_1-33.mp3'},
      {title: 'Romans 10:1-21', reference: 'Romans 10:1-21', fileName: 'Romans_10_1-21.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Romans_10_1-21.mp3'},
      {title: 'Romans 11:1-36', reference: 'Romans 11:1-36', fileName: 'Romans_11_1-36.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Romans_11_1-36.mp3'},
      {title: 'Romans 12:1-8', reference: 'Romans 12:1-8', fileName: 'Romans_12_1-8.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Romans_12_1-8.mp3'},
      {title: 'Romans 12:9-21', reference: 'Romans 12:9-21', fileName: 'Romans_12_9-21.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Romans_12_9-21.mp3'},
      {title: 'Romans 13:1-7', reference: 'Romans 13:1-7', fileName: 'Romans_13_1-7.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/Romans_13_1-7.mp3'},
      {title: 'Romans 13:8-14', reference: 'Romans 13:8-14', fileName: 'romans_13_8-14.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_13_8-14.mp3'},
      {title: 'Romans 14:1-23', reference: 'Romans 14:1-23', fileName: 'romans_14_1-23.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_14_1-23.mp3'},
      {title: 'Romans 15:1-31', reference: 'Romans 15:1-31', fileName: 'romans_15_1-31.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_15_1-31.mp3'},
      {title: 'Romans 16:1-27', reference: 'Romans 16:1-27', fileName: 'romans_16_1-27.mp3', extension: 'mp3', sourcePath: '/Users/amanwtsegaw/Desktop/Websites/jack-sequeira-web/All/public_html/audio/romans_16_1-27.mp3'},
    ],
  },
];

export const videoCollections: VideoCollection[] = [
  {
    key: 'celebration-of-life',
    title: 'Celebration of Life',
    description:
      "Memorial and tribute videos centered on remembering Jack Sequeira's life and ministry.",
    items: [
      {
        id: 'celebration-of-life-1',
        title: 'A Celebration of Life',
        duration: '1:51:00',
        youtubeId: 'OYP9d9WoNuY',
        thumbnailUrl: 'https://img.youtube.com/vi/OYP9d9WoNuY/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/OYP9d9WoNuY',
      },
    ],
  },
  {
    key: 'sierra-vista-series',
    title: 'Sierra Vista 2010 Series',
    description:
      'Professionally produced June 2010 messages from Sierra Vista, Arizona.',
    items: [
      {
        id: 'sierra-vista-series-1',
        title: 'The Biblical Definition of Sin',
        duration: '58:17',
        youtubeId: 'dR0rkc9dph8',
        thumbnailUrl: 'https://img.youtube.com/vi/dR0rkc9dph8/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/dR0rkc9dph8',
      },
      {
        id: 'sierra-vista-series-2',
        title: 'The Two Dimensions Of Salvation',
        duration: '44:34',
        youtubeId: 'ACpWeDC7aNs',
        thumbnailUrl: 'https://img.youtube.com/vi/ACpWeDC7aNs/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/ACpWeDC7aNs',
      },
      {
        id: 'sierra-vista-series-3',
        title: "God's Incredible Love",
        duration: '35:11',
        youtubeId: '678dbuadSKw',
        thumbnailUrl: 'https://img.youtube.com/vi/678dbuadSKw/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/678dbuadSKw',
      },
      {
        id: 'sierra-vista-series-4',
        title: 'Christ Our Righteousness',
        duration: '31:57',
        youtubeId: 'lGawJ5Tz6HY',
        thumbnailUrl: 'https://img.youtube.com/vi/lGawJ5Tz6HY/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/lGawJ5Tz6HY',
      },
      {
        id: 'sierra-vista-series-5',
        title: 'The Everlasting Gospel',
        duration: '32:57',
        youtubeId: 'BEMsUQ_378k',
        thumbnailUrl: 'https://img.youtube.com/vi/BEMsUQ_378k/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/BEMsUQ_378k',
      },
      {
        id: 'sierra-vista-series-6',
        title: 'Growing in Christ',
        duration: '33:01',
        youtubeId: 'cJ046sntjvw',
        thumbnailUrl: 'https://img.youtube.com/vi/cJ046sntjvw/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/cJ046sntjvw',
      },
      {
        id: 'sierra-vista-series-7',
        title: 'Satan Exposed at the Cross',
        duration: '36:51',
        youtubeId: '6q_UdjwZjUU',
        thumbnailUrl: 'https://img.youtube.com/vi/6q_UdjwZjUU/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/6q_UdjwZjUU',
      },
      {
        id: 'sierra-vista-series-8',
        title: 'The Power of the Cross',
        duration: '59:54',
        youtubeId: 'i_2z_DHDaHI',
        thumbnailUrl: 'https://img.youtube.com/vi/i_2z_DHDaHI/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/i_2z_DHDaHI',
      },
      {
        id: 'sierra-vista-series-9',
        title: "God's Supreme Sacrifice",
        duration: '1:04:36',
        youtubeId: 'ptK8EZWVmcA',
        thumbnailUrl: 'https://img.youtube.com/vi/ptK8EZWVmcA/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/ptK8EZWVmcA',
      },
      {
        id: 'sierra-vista-series-10',
        title: 'The Significance of the Resurrection',
        duration: '28:37',
        youtubeId: '_yIirYDZJTE',
        thumbnailUrl: 'https://img.youtube.com/vi/_yIirYDZJTE/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/_yIirYDZJTE',
      },
      {
        id: 'sierra-vista-series-11',
        title: 'The Investigative Judgment',
        duration: '50:06',
        youtubeId: 'cMZH3g6c-qo',
        thumbnailUrl: 'https://img.youtube.com/vi/cMZH3g6c-qo/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/cMZH3g6c-qo',
      },
      {
        id: 'sierra-vista-series-12',
        title: 'The Sabbath Rest',
        duration: '48:54',
        youtubeId: '0HKW1AqFH7Q',
        thumbnailUrl: 'https://img.youtube.com/vi/0HKW1AqFH7Q/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/0HKW1AqFH7Q',
      },
    ],
  },
  {
    key: 'book-of-romans',
    title: 'Book of Romans',
    description:
      'Video teachings and study messages focused on Romans and righteousness by faith.',
    items: [
      {
        id: 'book-of-romans-1',
        title: 'The Universal Sin Problem',
        duration: '29:41',
        youtubeId: 'jAHG5upuffo',
        reference: 'Romans 1:18-3:20',
        thumbnailUrl: 'https://img.youtube.com/vi/jAHG5upuffo/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/jAHG5upuffo',
      },
      {
        id: 'book-of-romans-2',
        title: 'The Gospel in a Nutshell',
        duration: '39:18',
        youtubeId: 'SDXvW3jvuVY',
        reference: 'Romans 3:21-31',
        thumbnailUrl: 'https://img.youtube.com/vi/SDXvW3jvuVY/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/SDXvW3jvuVY',
      },
      {
        id: 'book-of-romans-3',
        title: 'The Two Enemies of the Gospel',
        duration: '57:48',
        youtubeId: 'sv4Yh9aV52A',
        reference: 'Romans 4 and 6',
        thumbnailUrl: 'https://img.youtube.com/vi/sv4Yh9aV52A/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/sv4Yh9aV52A',
      },
      {
        id: 'book-of-romans-4',
        title: 'The Incredible Love of God',
        duration: '35:11',
        youtubeId: '8xaBeErDIFI',
        reference: 'Romans 5:1-10',
        thumbnailUrl: 'https://img.youtube.com/vi/8xaBeErDIFI/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/8xaBeErDIFI',
      },
      {
        id: 'book-of-romans-5',
        title: 'The Two Adams',
        duration: '28:40',
        youtubeId: 'qerdy1Rag3E',
        reference: 'Romans 5:11-21',
        thumbnailUrl: 'https://img.youtube.com/vi/qerdy1Rag3E/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/qerdy1Rag3E',
      },
      {
        id: 'book-of-romans-6',
        title: 'The Significance of Romans 7',
        duration: '47:25',
        youtubeId: 'H1ZO4KXK8ag',
        thumbnailUrl: 'https://img.youtube.com/vi/H1ZO4KXK8ag/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/H1ZO4KXK8ag',
      },
      {
        id: 'book-of-romans-7',
        title: 'Life in the Spirit of Romans 8',
        duration: '38:24',
        youtubeId: 'n_7huqXuLm0',
        thumbnailUrl: 'https://img.youtube.com/vi/n_7huqXuLm0/hqdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/n_7huqXuLm0',
      },
    ],
  },
];
