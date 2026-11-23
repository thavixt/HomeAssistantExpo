import { useHAConnection, useServiceCall } from 'hass-react';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/card';
import { ChipGroup } from '@/components/chip-group';
import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { ENTITIES, objectId } from '@/constants/entities';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useTheme } from '@/hooks/use-theme';
import { SECTIONS } from '@/lib/sections';

/* the Gemini conversation agent - it can answer questions and control devices */
const AGENT_ID = 'conversation.google_ai_conversation';
/* a follow-up within this time continues the same conversation */
const CONVERSATION_TIMEOUT_MS = 5 * 60 * 1000;
const HISTORY_LENGTH = 3;
/* how long an exchange stays in the history */
const HISTORY_TIMEOUT_MS = 30 * 1000;

type Target = 'assist' | 'phone' | 'tablet' | 'TV';
type Language = 'hu' | 'en';

const TARGETS: { value: Target; label: string; placeholder: string }[] = [
  { value: 'assist', label: 'Ask', placeholder: 'Ask or tell Home Assistant…' },
  { value: 'phone', label: 'Phone', placeholder: 'Say out loud on the phone…' },
  { value: 'tablet', label: 'Tablet', placeholder: 'Say out loud on the tablet…' },
  { value: 'TV', label: 'TV', placeholder: 'Say out loud on the TV…' },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'hu', label: 'HU' },
  { value: 'en', label: 'EN' },
];

interface ConversationResult {
  conversation_id: string | null;
  response: {
    response_type: 'action_done' | 'query_answer' | 'error';
    speech?: { plain?: { speech?: string } };
  };
}

interface Exchange {
  id: number;
  text: string;
  reply: string;
  error?: boolean;
}

export function Assist() {
  const theme = useTheme();
  const { connection } = useHAConnection();
  const { callService } = useServiceCall();
  const [target, setTarget] = useState<Target>('assist');
  const [language, setLanguage] = useState<Language>('hu');
  const [text, setText] = useState('');
  const [history, setHistory] = useState<Exchange[]>([]);
  const [conversation, setConversation] = useState<{ id: string; at: number } | null>(null);
  const historyTimers = useRef(new Set<ReturnType<typeof setTimeout>>());

  // the pending removals would fire after unmount otherwise
  useEffect(() => {
    const timers = historyTimers.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const addExchange = (exchange: Omit<Exchange, 'id'>) => {
    const id = Date.now();
    setHistory((current) => [{ ...exchange, id }, ...current].slice(0, HISTORY_LENGTH));
    // each one is removed on its own timer, counted from when it was added
    const timer = setTimeout(() => {
      historyTimers.current.delete(timer);
      setHistory((current) => current.filter((e) => e.id !== id));
    }, HISTORY_TIMEOUT_MS);
    historyTimers.current.add(timer);
  };

  const ask = async (question: string) => {
    if (!connection) throw new Error('Not connected to Home Assistant.');
    const continues = conversation && Date.now() - conversation.at < CONVERSATION_TIMEOUT_MS;
    const result = await connection.sendMessagePromise<ConversationResult>({
      type: 'conversation/process',
      text: question,
      agent_id: AGENT_ID,
      conversation_id: continues ? conversation.id : undefined,
    });
    setConversation(result.conversation_id ? { id: result.conversation_id, at: Date.now() } : null);
    addExchange({
      text: question,
      reply: result.response.speech?.plain?.speech || 'Done.',
      error: result.response.response_type === 'error',
    });
  };

  const say = async (message: string, on: Exclude<Target, 'assist'>) => {
    switch (on) {
      case 'phone':
        await callService('script', objectId(ENTITIES.scripts.phoneSpeak), { message });
        break;
      case 'tablet':
        await callService('script', objectId(ENTITIES.scripts.dashboardTabletSpeak), { message });
        break;
      case 'TV':
        // the TV script turns the TV on first, if needed - and it's the only one that takes a language
        await callService('script', objectId(ENTITIES.scripts.sayOnTv), { message, language });
        break;
    }
    addExchange({ text: message, reply: `Said on the ${on}.` });
  };

  const send = useAction(
    async (message: string, to: Target) => {
      await (to === 'assist' ? ask(message) : say(message, to));
      setText('');
    },
    (_, to) => (to === 'assist' ? 'ask Home Assistant' : `say that on the ${to}`),
  );

  const submit = () => {
    const message = text.trim();
    if (message) void send.run(message, target);
  };

  const current = TARGETS.find((t) => t.value === target)!;

  return (
    <Card icon={SECTIONS.assist.icon} title={SECTIONS.assist.title}>
      <ChipGroup label="Send to" options={TARGETS} value={target} onChange={(t) => setTarget(t as Target)} />

      {target === 'TV' && (
        <ChipGroup
          label="Speech language"
          options={LANGUAGES}
          value={language}
          onChange={(l) => setLanguage(l as Language)}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={current.placeholder}
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel={current.placeholder}
          editable={!send.pending}
          returnKeyType="send"
          enterKeyHint="send"
          // keep the keyboard up after sending, for a follow-up question
          submitBehavior="submit"
          onSubmitEditing={submit}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSelected }]}
        />
        <IconButton
          icon={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
          label="Send"
          variant="primary"
          size={44}
          pending={send.pending}
          disabled={!text.trim()}
          onPress={submit}
        />
      </View>

      {/* always rendered, even empty - a live region has to exist before its updates */}
      <View style={styles.history} accessibilityLiveRegion="polite">
        {history.map((exchange) => (
          <View key={exchange.id}>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              “{exchange.text}”
            </ThemedText>
            <ThemedText type="small" themeColor={exchange.error ? 'danger' : 'text'}>
              {exchange.reply}
            </ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 15,
  },
  history: { gap: Spacing.two },
});
