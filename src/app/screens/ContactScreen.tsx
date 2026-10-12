import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SITE_ORIGIN} from '../../config';
import {type AppPalette} from '../../design';
import {type AppStyles} from '../styles';
import {GlassCard, GlassHeader} from '../components/Shared';

const contactStyles = StyleSheet.create({
  topicRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  messageInput: {minHeight: 150, textAlignVertical: 'top'},
  submitting: {opacity: 0.6},
});

const topics = [
  {value: 'general', label: 'General inquiry'},
  {value: 'archive', label: 'Archive or studies'},
  {value: 'books', label: 'Books or DVDs'},
  {value: 'translation', label: 'Translation partnership'},
  {value: 'prayer', label: 'Prayer request'},
  {value: 'technical', label: 'Website issue'},
] as const;

type Topic = (typeof topics)[number]['value'];

export function ContactScreen({
  styles,
  palette,
  onBack,
}: {
  styles: AppStyles;
  palette: AppPalette;
  onBack: () => void;
}) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [topic, setTopic] = React.useState<Topic>('general');
  const [startedAt] = React.useState(() => Date.now());
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (cleanName.length < 2) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      Alert.alert('Email required', 'Please enter a valid email address.');
      return;
    }
    if (cleanMessage.length < 10) {
      Alert.alert('Message required', 'Please write at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${SITE_ORIGIN}/api/contact`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          topic,
          message: cleanMessage,
          startedAt,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Unable to send your message.');
      }

      setName('');
      setEmail('');
      setMessage('');
      Alert.alert(
        'Message sent',
        'Thank you. Your message has been sent to the ministry.',
      );
    } catch (error) {
      Alert.alert(
        'Message not sent',
        error instanceof Error
          ? error.message
          : 'Please try again or use the website contact form.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle = {
    minHeight: 50,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: palette.foreground,
    backgroundColor: palette.surfaceLowest,
    fontFamily: styles.bodyMuted.fontFamily,
    fontSize: 16,
  } as const;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GlassHeader
          styles={styles}
          title="Contact"
          leftAction={{icon: '<', label: 'Back', onPress: onBack}}
        />

        <GlassCard styles={styles}>
          <Text style={styles.eyebrow}>GET IN TOUCH</Text>
          <Text style={styles.screenTitle}>Send a message</Text>
          <Text style={styles.bodyMuted}>
            Ask about translation partnerships, archive materials, prayer, or
            help using the app.
          </Text>

          <Text style={styles.helperText}>Your name</Text>
          <TextInput
            accessibilityLabel="Your name"
            autoCapitalize="words"
            placeholder="Jane Sequeira"
            placeholderTextColor={palette.muted}
            style={fieldStyle}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.helperText}>Email address</Text>
          <TextInput
            accessibilityLabel="Email address"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={palette.muted}
            style={fieldStyle}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.helperText}>Topic</Text>
          <View style={contactStyles.topicRow}>
            {topics.map(item => (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityState={{selected: topic === item.value}}
                onPress={() => setTopic(item.value)}
                style={[
                  styles.secondaryButton,
                  topic === item.value && {
                    backgroundColor: palette.primarySolid,
                    borderColor: palette.primarySolid,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    topic === item.value && {color: palette.onPrimary},
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.helperText}>Message</Text>
          <TextInput
            accessibilityLabel="Message"
            multiline
            numberOfLines={7}
            placeholder="How can we help you?"
            placeholderTextColor={palette.muted}
            style={[fieldStyle, contactStyles.messageInput]}
            value={message}
            onChangeText={setMessage}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{disabled: submitting}}
            disabled={submitting}
            onPress={submit}
            style={[styles.primaryButton, submitting && contactStyles.submitting]}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Sending...' : 'Send message  ->'}
            </Text>
          </Pressable>
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
