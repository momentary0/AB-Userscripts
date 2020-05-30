import { Handler, AnimeState, Transformer, Token, BasicToken, SharedState, MusicState, BookState, GameState, makeCompoundToken, ARROW, AnyState, EPISODE_TEXT, SCENE_TEXT, SpecialTypes } from './types';

export type FinalOutput = (Node | string)[];

type PreSpan = {
  type: 'span',
  key: string,
  value: string,
  child: string | Node,
};
type ElementOrString = PreSpan | string;
type ParseOutput = ElementOrString[];
type TransformerResult = ElementOrString[] | ElementOrString | null;
type TokenStateTransformer = Transformer<AnyState, Token, TransformerResult, SeenFields>;
type SeenFields = {[key: string]: string};

export const span = (key: string, value: string, child?: HTMLElement | string): PreSpan => {
  return {type: 'span', key, value: value || key, child: child ?? value};
};

export type DFunction = (t: Token, s: SeenFields) => AnyState;
export type TFunction = (t: Token, s: SeenFields) => TransformerResult

export const preCapture = (pre: (t: Token, s: SeenFields) => [Token, SeenFields],
    transformer: TokenStateTransformer): TokenStateTransformer => {
  return (t, s) => {
    const [t1, s1] = pre(t, s);
    return transformer(t1, s1);
  }
}

function assertBasicToken(t: Token): asserts t is BasicToken {
  if (t.type != 'BASIC')
    throw new Error('Expected basic token, got ' + t);
}

export const basicTransformer = (key1: string, key2?: string): TFunction => {
  return (t) => {
    switch (t.type) {
      case 'BASIC':
        return span(key1, t.text);
      case 'COMPOUND':
        console.assert(!!key2);
        return  [span(key1, t.left), ' (', span(key2!, t.right), ')'];
      default:
        throw new Error('Expected basic or compound token in basic transformer, got ' + t);
    }
  };
};

export const splitTransformer = (key1: string, key2: string): TFunction => {
  return (t) => {
    assertBasicToken(t);
    const i = t.text.lastIndexOf(' ');
    console.assert(i >= 0);
    return [span(key1, t.text.substr(0, i)), ' ', span(key2, t.text.slice(i+1))];
  };
};

export const toCompoundToken = (t: Token): Token => {
  if (t.type !== 'BASIC') return t;

  const paren = t.text.indexOf(' (');
  if (paren < 0 || t.text[t.text.length-1] !== ')') return t;

  const left = t.text.slice(0, paren);
  const right = t.text.slice(paren+2, t.text.length-1);
  return makeCompoundToken(left, right);
};

export const captureDT = (decider: DFunction, transformer: TFunction): TokenStateTransformer => {
  return (t, s) => [decider(t, s), transformer(t, s)];
};

export const captureD = (decider: DFunction, key: string, key2?: string): TokenStateTransformer =>
  captureDT(decider, basicTransformer(key, key2));

export const captureT = (next: AnyState, transform: TFunction): TokenStateTransformer =>
  captureDT(() => next, transform);

export const capture = (next: AnyState, key: string, key2?: string): TokenStateTransformer =>
  captureD(() => next, key, key2);

export const nullCapture = (next: AnyState): TokenStateTransformer =>
  captureT(next, () => null);

export type TokenStatePredicate = (t: Token, s: SeenFields) => boolean;
export const switchCapture = (predicate: TokenStatePredicate, captureTrue: TokenStateTransformer,
    captureFalse: TokenStateTransformer): TokenStateTransformer => {
  return (t, s) => predicate(t, s) ? captureTrue(t, s) : captureFalse(t, s);
};

export const isSpecial = (type: SpecialTypes): TokenStatePredicate =>
  (t, s) => t.type === 'SPECIAL' && t.special === type;

export const maybeFlag = (key: string, expected: string): TFunction => {
  return (t) => {
    if (t.type !== 'BASIC' || t.text !== expected) return null;
    return span(key, expected);
  }
};

export const maybeList = (key: string, ...options: string[]): TFunction => {
  const set = new Set(options);
  return (t) => {
    if (t.type !== 'BASIC' || !set.has(t.text)) return null;
    return span(key, t.text);
  }
};

export const basename = (url: string) => url.split('/').slice(-1)[0].split('.')[0];

export const maybeImage = (key: string, imageFile: string, value?: string): TFunction => {
  return (t) => {
    if (t.type !== 'ELEMENT' || t.element.tagName != 'IMG') return null;
    if (basename((t.element as HTMLImageElement).src) !== imageFile) return null;
    return span(key, value ?? key, t.element);
  };
}

const TRAILING_IMAGES = [
  maybeImage('freeleech', 'flicon', 'Freeleech'),
  maybeImage('hentai', 'hentai', 'Uncensored'),
  maybeImage('hentai', 'hentaic', 'Censored'),
];
const fallbackTransformer = basicTransformer('misc', 'misc');

const trailingFieldsTransformer: TFunction = (t, s) => {
  if (t.type === 'SPECIAL' && t.special === 'snatched') {
    return [' - ', span('snatched', 'Snatched', 'Snatched')];
  }

  if (t.type === 'BASIC') {
    if (t.text === SCENE_TEXT)
      return span('scene', SCENE_TEXT, SCENE_TEXT);
    if (t.text.startsWith(EPISODE_TEXT))
      return span('episode', t.text.replace(EPISODE_TEXT, ''), t.text);
  }

  if (t.type !== 'ELEMENT')
    return fallbackTransformer(t, s);

  const imageMatches = TRAILING_IMAGES.map(trans => trans(t, s)).filter(x => x !== null);
  if (imageMatches) {
    return imageMatches[0];
  }

  if (t.element.tagName === 'FONT' && t.element.textContent?.trim() == 'Exclusive!') {
    return span('exclusive', 'Exclusive', t.element);
  }

  return fallbackTransformer(t, s);
};

const FIRST_FIELDS: {[s: string]: keyof typeof START_STATES} = {
  'Blu-ray': 'anime', 'Web': 'anime', 'TV': 'anime',
  'DVD': 'anime', 'UHD Blu-ray': 'anime', 'DVD5': 'anime',
  'DVD9': 'anime', 'HD DVD': 'anime', 'VHS': 'anime',
  'VCD': 'anime', 'LD': 'anime',

  'MP3': 'music', 'FLAC': 'music', 'AAC': 'music',

  'Game': 'game', 'Patch': 'game', 'DLC': 'game',

  'Raw': 'book', 'Translated': 'book',
};

const START_STATES = {
  anime: AnimeState.SOURCE,
  music: MusicState.ENCODING,
  game: GameState.TYPE,
  book: BookState.TRANSLATION,
};

const initHandler: TokenStateTransformer = (t) => {
  if (t.type != 'BASIC' && t.type != 'COMPOUND')
    throw new Error('Need basic or compound as first token, not ' + t);

  const first = (t.type == 'COMPOUND' ? t.left : t.text);

  return [START_STATES[FIRST_FIELDS[first]] ?? SharedState.COMMON_TRAILING_FIELDS, null];
}

const arrowTransformer: TFunction = (t) => {
  if (t.type == 'SPECIAL' && t.special == 'arrow')
    return t.text;
  return null;
};

const specialTransformer: TFunction = (t) => {
  if (t.type !== 'SPECIAL')
    throw new Error('Expected special token.');
  return t.text;
}

const GAME_REGIONS = ['Region Free', 'NTSC-J', 'NTSC-U', 'PAL', 'JPN', 'ENG', 'EUR'];
const GAME_ARCHIVED = ['Archived', 'Unarchived'];
const BOOK_FORMATS = ['Archived Scans', 'EPUB', 'PDF', 'Unarchived', 'Digital'];

export const TRANSITION_ACTIONS: Handler<AnyState, TokenStateTransformer> = {
  // i'm very sorry for this code.
  [SharedState.BBCODE_LEFT]: capture(SharedState.BBCODE_DASH, 'left'),
  [SharedState.BBCODE_DASH]: switchCapture(isSpecial('dash'),
    captureT(SharedState.BBCODE_RIGHT, specialTransformer), nullCapture(SharedState.BBCODE_LBRACKET)),
  [SharedState.BBCODE_RIGHT]: capture(SharedState.BBCODE_LBRACKET, 'right'),
  [SharedState.BBCODE_LBRACKET]: switchCapture(isSpecial('lbracket'),
    captureT(SharedState.BBCODE_YEAR, specialTransformer), nullCapture(SharedState.COLONS)),
  [SharedState.BBCODE_YEAR]: capture(SharedState.BBCODE_RBRACKET, 'year'),
  [SharedState.BBCODE_RBRACKET]: captureT(SharedState.COLONS, specialTransformer),

  [SharedState.COLONS]: captureT(SharedState.BEGIN_PARSE, (t, s) => t.type === 'BASIC' ? t.text : null),
  [SharedState.ARROW]: captureT(SharedState.BEGIN_PARSE, arrowTransformer),
  [SharedState.BEGIN_PARSE]: initHandler,
  [SharedState.COMMON_TRAILING_FIELDS]: captureT(SharedState.COMMON_TRAILING_FIELDS, trailingFieldsTransformer),

  [AnimeState.SOURCE]: capture(AnimeState.CONTAINER, 'source'),
  [AnimeState.CONTAINER]: preCapture((t, s) => [toCompoundToken(t), s],
    captureD((t) => t.type === 'COMPOUND' ? AnimeState.ASPECT_RATIO : AnimeState.VIDEO_CODEC, 'container', 'region')),
  [AnimeState.ASPECT_RATIO]: captureD((t, s) => s.source == 'DVD9' || s.source == 'DVD5'
    ? AnimeState.RESOLUTION : AnimeState.VIDEO_CODEC, 'aspectRatio'),
  [AnimeState.VIDEO_CODEC]: capture(AnimeState.RESOLUTION, 'codec'),
  [AnimeState.RESOLUTION]: capture(AnimeState.AUDIO_CODEC, 'resolution'),
  [AnimeState.AUDIO_CODEC]: captureT(AnimeState.DUAL_AUDIO, splitTransformer('audioCodec', 'audioChannels')),
  [AnimeState.DUAL_AUDIO]: captureT(AnimeState.REMASTER, maybeFlag('dualAudio', 'Dual Audio')),
  [AnimeState.REMASTER]: captureT(AnimeState.SUBBING_AND_GROUP, maybeImage('remastered', 'rmstr', 'Remastered')),
  [AnimeState.SUBBING_AND_GROUP]: capture(SharedState.COMMON_TRAILING_FIELDS, 'subbing', 'group'),

  [MusicState.ENCODING]: capture(MusicState.BITRATE, 'encoding'),
  [MusicState.BITRATE]: capture(MusicState.SOURCE, 'bitrate'),
  [MusicState.SOURCE]: capture(MusicState.LOG, 'source'),
  [MusicState.LOG]: captureT(MusicState.CUE, maybeFlag('log', 'Log')),
  [MusicState.CUE]: captureT(SharedState.COMMON_TRAILING_FIELDS, maybeFlag('cue', 'Cue')),

  [GameState.TYPE]: capture(GameState.PLATFORM, 'type'),
  [GameState.PLATFORM]: capture(GameState.REGION, 'platform'),
  [GameState.REGION]: captureT(GameState.ARCHIVED, maybeList('region', ...GAME_REGIONS)),
  [GameState.ARCHIVED]: captureT(GameState.SCENE, maybeList('archived', ...GAME_ARCHIVED)),
  [GameState.SCENE]: captureT(SharedState.COMMON_TRAILING_FIELDS, maybeFlag('scene', 'Scene')),

  [BookState.TRANSLATION]: capture(BookState.FORMAT, 'translation', 'group'),
  [BookState.FORMAT]: captureT(BookState.ONGOING, maybeList('format', ...BOOK_FORMATS)),
  [BookState.ONGOING]: captureT(SharedState.COMMON_TRAILING_FIELDS, maybeFlag('ongoing', 'Ongoing')),
};

export function preParse(tokens: Token[]): Token[] {
  return tokens;
}

export function mainParse(tokens: Token[], start: AnyState): [ParseOutput, SeenFields] {
  const output: ParseOutput = [];
  const seenFields: SeenFields = {};

  let state: AnyState = start;
  let i = 0;
  let j = 0;
  while (i < tokens.length) {
    if (j++ > 10000) {
      throw new Error("Iteration limit exceeded in parse.");
    }
    const token = tokens[i];
    if (token.type == 'SEPARATOR') {
      output.push(token.sep);
      i++;
      continue;
    }

    const handler: TokenStateTransformer = TRANSITION_ACTIONS[state]!;
    if (!handler)
      throw new Error("No handler associated with state: " + state);

    const [nextState, result] = handler(token, seenFields);
    // console.debug("Parse state transition from " + state + ": ", [nextState, result]);
    if (result != null) {
      i++;
      const resultArray = Array.isArray(result) ? result : [result];
      for (const e of resultArray) {
        if (!(typeof e == 'string' ? e : e.child))
          continue;
        if (typeof e != 'string' && e.key)
          seenFields[e.key] = e.value;
        output.push(e);
      }
    }
    state = nextState;
  }

  return [output, seenFields];
}

const templateSpan = document.createElement('span');
templateSpan.className = 'userscript-highlight torrent-field';

export function postParse(parsed: ParseOutput): FinalOutput {
  return parsed.map(e => {
    if (typeof e == 'string') {
      return e;
    } else {
      const span = templateSpan.cloneNode(false) as HTMLSpanElement;
      if (e.key)
        span.dataset[e.key] = e.value;
      span.append(e.child);
      span.dataset.field = e.value;
      return span;
    }
  });
}

export function parse(tokens: Token[], start: AnyState): [FinalOutput, SeenFields] {
  const [parsed, fields] = mainParse(preParse(tokens), start);
  return [postParse(parsed), fields];
}