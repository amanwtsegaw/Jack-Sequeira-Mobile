export type DictionaryDefinition = {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms: string[];
};

export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  sourceUrl?: string;
  definitions: DictionaryDefinition[];
};

type DictionaryApiEntry = {
  word?: string;
  defs?: string[];
  tags?: string[];
  defHeadword?: string;
};

const DICTIONARY_API_BASE_URL = 'https://api.datamuse.com/words';

export async function fetchDictionaryEntry(
  word: string,
): Promise<DictionaryEntry> {
  const normalizedWord = normalizeDictionaryWord(word);
  if (!normalizedWord) {
    throw new Error('Select one word to open the dictionary.');
  }

  const response = await fetch(
    `${DICTIONARY_API_BASE_URL}?sp=${encodeURIComponent(
      normalizedWord,
    )}&qe=sp&md=d&max=1`,
  );
  const payload = (await response.json()) as DictionaryApiEntry[];

  if (!response.ok || !Array.isArray(payload) || payload.length === 0) {
    throw new Error(`No dictionary entry found for "${normalizedWord}".`);
  }

  const entry = payload[0];
  const definitions =
    entry.defs
      ?.map(parseDatamuseDefinition)
      .filter(item => item.definition.trim().length > 0)
      .slice(0, 6) ?? [];

  if (definitions.length === 0) {
    throw new Error(`No dictionary definitions found for "${normalizedWord}".`);
  }

  return {
    word: entry.defHeadword ?? entry.word ?? normalizedWord,
    definitions,
  };
}

export function normalizeDictionaryWord(value: string) {
  const trimmed = value.trim().replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
  if (!/^[A-Za-z]+(?:[-'][A-Za-z]+)?$/.test(trimmed)) {
    return null;
  }

  return trimmed.toLowerCase();
}

function parseDatamuseDefinition(value: string): DictionaryDefinition {
  const [partOfSpeechCode, ...definitionParts] = value.split('\t');
  return {
    partOfSpeech: getPartOfSpeechLabel(partOfSpeechCode),
    definition: definitionParts.join(' ').replace(/\s+/g, ' ').trim(),
    synonyms: [],
  };
}

function getPartOfSpeechLabel(value: string) {
  switch (value.trim().toLowerCase()) {
    case 'n':
      return 'noun';
    case 'v':
      return 'verb';
    case 'adj':
      return 'adjective';
    case 'adv':
      return 'adverb';
    default:
      return 'word';
  }
}
