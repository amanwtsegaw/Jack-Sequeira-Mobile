import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SITE_ORIGIN } from '../../config';
import { type AppPalette } from '../../design';
import { type AppStyles } from '../styles';

const CONTACT_TOPICS = [
  { value: 'general', label: 'General inquiry' },
  { value: 'archive', label: 'Archive or study materials' },
  { value: 'books', label: 'Books or DVDs' },
  { value: 'translation', label: 'Translation partnership' },
  { value: 'prayer', label: 'Prayer request' },
  { value: 'technical', label: 'Website technical issue' },
] as const;

type ContactTopic = (typeof CONTACT_TOPICS)[number]['value'];
type ContactState = 'idle' | 'submitting' | 'success' | 'error';

export function ContactFormModal({
  visible,
  styles,
  palette,
  onClose,
}: {
  visible: boolean;
  styles: AppStyles;
  palette: AppPalette;
  onClose: () => void;
}) {
  const startedAtRef = useRef(Date.now());
  const [state, setState] = useState<ContactState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [emailDelivered, setEmailDelivered] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<ContactTopic>('general');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (visible) {
      startedAtRef.current = Date.now();
      setState('idle');
      setError(null);
      setEmailDelivered(false);
    }
  }, [visible]);

  function resetForm() {
    startedAtRef.current = Date.now();
    setState('idle');
    setError(null);
    setEmailDelivered(false);
    setName('');
    setEmail('');
    setTopic('general');
    setMessage('');
  }

  function validateForm() {
    if (name.trim().length < 2) {
      return 'Please enter your name.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (message.trim().length < 10) {
      return 'Please write at least 10 characters.';
    }
    if (message.trim().length > 5000) {
      return 'Message is too long (max 5,000 characters).';
    }
    return null;
  }

  async function submitContactForm() {
    const validationError = validateForm();
    if (validationError) {
      setState('error');
      setError(validationError);
      return;
    }

    setState('submitting');
    setError(null);

    try {
      const response = await fetch(`${SITE_ORIGIN}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
          startedAt: startedAtRef.current,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        emailDelivered?: boolean;
      };

      if (!response.ok || !data.ok) {
        setState('error');
        setError(
          data.error ?? 'Unable to send your message. Please try again.',
        );
        return;
      }

      setEmailDelivered(Boolean(data.emailDelivered));
      setState('success');
      setName('');
      setEmail('');
      setTopic('general');
      setMessage('');
    } catch {
      setState('error');
      setError('Network error. Please check your connection and try again.');
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.bibleModalOverlay}>
        <Pressable style={styles.bibleModalBackdrop} onPress={onClose} />
        <View style={styles.contactModalCard}>
          <View style={styles.bibleModalHeader}>
            <View style={styles.bibleModalHeaderText}>
              <Text style={styles.bibleModalEyebrow}>Get in touch</Text>
              <Text style={styles.bibleModalTitle}>Contact</Text>
              <Text style={styles.contactModalIntro}>
                Reach out about translation partnerships, archive questions,
                publishing inquiries, prayer requests, or help using this
                website.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close contact form"
              onPress={onClose}
              style={styles.bibleModalCloseButton}
            >
              <Text style={styles.bibleModalCloseText}>x</Text>
            </Pressable>
          </View>

          {state === 'success' ? (
            <View style={styles.contactSuccessCard}>
              <Text style={styles.contactSuccessMark}>✓</Text>
              <Text style={styles.contactSuccessTitle}>Message received</Text>
              <Text style={styles.contactModalIntro}>
                Thank you for reaching out. Your message has been saved securely
                {emailDelivered
                  ? ' and our team has been notified by email.'
                  : '.'}
              </Text>
              <Text style={styles.contactHelperText}>
                We aim to respond within a few business days.
              </Text>
              <Pressable onPress={resetForm} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  Send another message
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.contactFormScroll}
                contentContainerStyle={styles.contactFormContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.contactInfoPanel}>
                  <Text style={styles.contactInfoEyebrow}>Books & DVDs</Text>
                  <Text style={styles.contactInfoText}>
                    Creative Media Ministries: 951.440.7688
                  </Text>
                  <Text style={styles.contactInfoText}>
                    Glad Tidings: 269.473.1888
                  </Text>
                </View>

                <View style={styles.contactInfoPanel}>
                  <Text style={styles.contactInfoEyebrow}>
                    Translation partnerships
                  </Text>
                  <Text style={styles.contactInfoText}>
                    If you are interested in donating or collaborating with us
                    on our new focus on translating Pastor Jack's materials,
                    please contact us using the submission form below. Thank
                    you!
                  </Text>
                </View>

                {state === 'error' && error ? (
                  <Text style={styles.contactErrorText}>{error}</Text>
                ) : null}

                <ContactFieldLabel styles={styles} label="Your name" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  editable={state !== 'submitting'}
                  autoComplete="name"
                  placeholder="Jane Sequeira"
                  placeholderTextColor={palette.muted}
                  style={styles.contactTextInput}
                />

                <ContactFieldLabel styles={styles} label="Email address" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  editable={state !== 'submitting'}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  placeholderTextColor={palette.muted}
                  style={styles.contactTextInput}
                />

                <ContactFieldLabel styles={styles} label="Topic" />
                <View style={styles.contactTopicGrid}>
                  {CONTACT_TOPICS.map(option => {
                    const active = option.value === topic;
                    return (
                      <Pressable
                        key={option.value}
                        disabled={state === 'submitting'}
                        onPress={() => setTopic(option.value)}
                        style={[
                          styles.contactTopicButton,
                          active && styles.contactTopicButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.contactTopicText,
                            active && styles.contactTopicTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <ContactFieldLabel styles={styles} label="Message" />
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  editable={state !== 'submitting'}
                  multiline
                  maxLength={5000}
                  placeholder="How can we help you?"
                  placeholderTextColor={palette.muted}
                  textAlignVertical="top"
                  style={[styles.contactTextInput, styles.contactMessageInput]}
                />
                <Text style={styles.contactHelperText}>
                  Your message is stored securely. Email notification is enabled
                  once the ministry inbox is configured.
                </Text>
              </ScrollView>

              <Pressable
                accessibilityRole="button"
                disabled={state === 'submitting'}
                onPress={submitContactForm}
                style={[
                  styles.shareImagePrimaryButton,
                  { backgroundColor: palette.primarySolid },
                  state === 'submitting' && styles.inlineNoteSaveButtonDisabled,
                ]}
              >
                {state === 'submitting' ? (
                  <ActivityIndicator color={palette.onPrimary} />
                ) : (
                  <Text style={styles.shareImagePrimaryButtonText}>
                    Send message
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ContactFieldLabel({
  styles,
  label,
}: {
  styles: AppStyles;
  label: string;
}) {
  return <Text style={styles.contactFieldLabel}>{label}</Text>;
}
