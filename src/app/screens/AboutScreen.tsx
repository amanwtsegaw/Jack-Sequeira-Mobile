import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  aboutHero,
  aboutTabs,
  faithHistoricalBackground,
  faithJourneyIntro,
  familyLetter,
  humanNatureOfChrist,
  inChristMotif,
  jackBiography,
  jacquieThanks,
  jeanBiography,
  ministryTimeline,
  normJoanHistory,
  normJoanStats,
  normJoanTribute,
  obituary,
  sequeiraFamily,
  supportMinistry,
  tributeFriends,
  tributeIntro,
  type AboutSectionKey,
  type AboutTextSection,
} from '../../data/about';
import {type AppStyles} from '../styles';
import {
  GlassCard,
  GlassHeader,
  InfoChip,
  SectionHeader,
  SegmentButton,
} from '../components/Shared';

const portrait = require('../../assets/images/Jacknjean.png');

export function AboutScreen({
  styles,
  onBack,
}: {
  styles: AppStyles;
  onBack: () => void;
}) {
  const [activeSection, setActiveSection] =
    React.useState<AboutSectionKey>('overview');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <GlassHeader
        styles={styles}
        title="About"
        leftAction={{icon: '‹', label: 'Back', onPress: onBack}}
      />

      <GlassCard styles={styles}>
        <View style={styles.aboutHeroRow}>
          <Image source={portrait} style={styles.aboutPortrait} />
          <View style={styles.aboutHeroCopy}>
            <Text style={styles.eyebrow}>{aboutHero.eyebrow}</Text>
            <Text style={styles.screenTitle}>{aboutHero.title}</Text>
            <Text style={styles.bodyMuted}>{aboutHero.description}</Text>
          </View>
        </View>
      </GlassCard>

      <View style={styles.segmentedRow}>
        {aboutTabs.map(tab => (
          <SegmentButton
            key={tab.key}
            styles={styles}
            label={tab.label}
            active={activeSection === tab.key}
            onPress={() => setActiveSection(tab.key)}
          />
        ))}
      </View>

      {activeSection === 'overview' ? (
        <OverviewContent styles={styles} />
      ) : activeSection === 'faith' ? (
        <FaithContent styles={styles} />
      ) : activeSection === 'tribute' ? (
        <TributeContent styles={styles} />
      ) : (
        <FamilyContent styles={styles} />
      )}
    </ScrollView>
  );
}

function OverviewContent({styles}: {styles: AppStyles}) {
  return (
    <>
      <TextCard styles={styles} section={jackBiography} />

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Ministry Timeline"
          subtitle="Key dates from the web About page."
        />
        {ministryTimeline.map(item => (
          <View key={`${item.period}-${item.detail}`} style={styles.aboutTimelineRow}>
            <View style={styles.aboutTimelinePeriod}>
              <Text style={styles.aboutTimelinePeriodText}>{item.period}</Text>
            </View>
            <Text style={styles.bodyMuted}>{item.detail}</Text>
          </View>
        ))}
      </GlassCard>

      <TextCard styles={styles} section={obituary} />
      <TextCard styles={styles} section={jeanBiography} />
      <TextCard styles={styles} section={sequeiraFamily} />
      <TextCard styles={styles} section={supportMinistry} />

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Contact and Website"
          subtitle="Open the original ministry site in your browser."
        />
        <Pressable
          onPress={() =>
            Linking.openURL('https://jacksequeira.org').catch(() => undefined)
          }
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Open JackSequeira.org</Text>
        </Pressable>
      </GlassCard>
    </>
  );
}

function FaithContent({styles}: {styles: AppStyles}) {
  return (
    <>
      <TextCard styles={styles} section={faithJourneyIntro} />
      <TextCard styles={styles} section={faithHistoricalBackground} />
      <TextCard styles={styles} section={inChristMotif} />
      <TextCard styles={styles} section={humanNatureOfChrist} />
    </>
  );
}

function TributeContent({styles}: {styles: AppStyles}) {
  return (
    <>
      <TextCard styles={styles} section={tributeIntro} />

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="We are forever indebted to:"
          subtitle="Friends named on the web tribute page."
        />
        <View style={styles.aboutFriendGrid}>
          {tributeFriends.map(name => (
            <View key={name} style={styles.aboutFriendPill}>
              <InfoChip styles={styles} label={name} />
            </View>
          ))}
        </View>
      </GlassCard>

      <TextCard styles={styles} section={jacquieThanks} />
      <TextCard styles={styles} section={normJoanTribute} />
      <TextCard styles={styles} section={normJoanHistory} />

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Norm & Joan Barker"
          subtitle="The web memorial page highlights these ministry numbers."
        />
        <View style={styles.aboutStatsGrid}>
          {normJoanStats.map(stat => (
            <View key={stat.label} style={styles.aboutStatBox}>
              <Text style={styles.aboutStatNumber}>{stat.number}</Text>
              <Text style={styles.bodyMuted}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </>
  );
}

function FamilyContent({styles}: {styles: AppStyles}) {
  return <TextCard styles={styles} section={familyLetter} />;
}

function TextCard({
  styles,
  section,
}: {
  styles: AppStyles;
  section: AboutTextSection;
}) {
  return (
    <GlassCard styles={styles}>
      {section.eyebrow ? (
        <Text style={styles.eyebrow}>{section.eyebrow}</Text>
      ) : null}
      <Text style={styles.screenTitle}>{section.title}</Text>
      {section.subtitle ? (
        <Text style={styles.cardMeta}>{section.subtitle}</Text>
      ) : null}
      {section.paragraphs.map((paragraph, index) => (
        <Text key={`${section.title}-${index}`} style={styles.bodyMuted}>
          {paragraph}
        </Text>
      ))}
    </GlassCard>
  );
}
