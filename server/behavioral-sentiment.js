
const POSITIVE_WORDS = new Set([
  'happy', 'good', 'great', 'calm', 'peaceful',
  'hopeful', 'motivated', 'relaxed', 'confident',
  'grateful', 'excited', 'energetic', 'comfortable',
  'better', 'improving', 'positive', 'joyful',
  'supported', 'safe', 'focused', 'proud'
]);

const NEGATIVE_WORDS = new Set([
  'sad', 'bad', 'terrible', 'anxious', 'worried',
  'stressed', 'lonely', 'isolated', 'tired',
  'exhausted', 'hopeless', 'afraid', 'scared',
  'angry', 'upset', 'frustrated', 'overwhelmed',
  'uncomfortable', 'painful', 'difficult', 'worse',
  'negative', 'helpless'
]);

const NEGATIONS = new Set([
  'not', 'no', 'never', 'hardly', 'isnt',
  'wasnt', 'dont', 'didnt', 'cannot'
]);

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'am', 'is', 'are', 'was',
  'were', 'the', 'a', 'an', 'and', 'or', 'but',
  'to', 'of', 'in', 'on', 'at', 'it', 'this',
  'that', 'with', 'for', 'have', 'has', 'had',
  'today', 'yesterday', 'very', 'really'
]);

export function analyzeSentiment(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      sentiment: 'neutral',
      score: 0,
      analyzed: false,
      reason: 'empty_text',
      method: 'lexicon'
    };
  }

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const meaningfulWords = words.filter(
    word => !STOP_WORDS.has(word) && !NEGATIONS.has(word)
  );

  if (meaningfulWords.length < 3) {
    return {
      sentiment: 'neutral',
      score: 0,
      analyzed: false,
      reason: 'insufficient_text',
      method: 'lexicon'
    };
  }

  let score = 0;
  let negateNext = 0;

  for (const word of words) {
    if (NEGATIONS.has(word)) {
      negateNext = 3;
      continue;
    }

    let value = 0;

    if (POSITIVE_WORDS.has(word)) value = 1;
    if (NEGATIVE_WORDS.has(word)) value = -1;

    if (value !== 0) {
      score += negateNext > 0 ? -value : value;
    }

    if (negateNext > 0) negateNext--;
  }

  let sentiment = 'neutral';

  if (score > 0) sentiment = 'positive';
  if (score < 0) sentiment = 'negative';

  return {
    sentiment,
    score,
    analyzed: true,
    reason: null,
    method: 'lexicon'
  };
}
