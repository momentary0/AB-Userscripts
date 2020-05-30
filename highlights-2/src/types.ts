
export type BaseToken = {
  type: string,
};

export type BasicToken = {
  type: 'BASIC',
  text: string;
};

export type CompoundToken = {
  type: 'COMPOUND',
  left: string,
  right: string,
};

export type ElementToken = {
  type: 'ELEMENT',
  element: HTMLElement,
};

export type SpecialTypes = 'snatched' | 'arrow' | 'dash' | 'lbracket' | 'rbracket';
export type SpecialToken = {
  type: 'SPECIAL',
  special: SpecialTypes,
  text: string,
};

export type SeparatorToken = {
  type: 'SEPARATOR',
  sep: string,
}

export type Token = BasicToken | CompoundToken | SeparatorToken | ElementToken | SpecialToken;

export const makeBasicToken = (text: string): BasicToken => ({ type: 'BASIC', text });
export const makeCompoundToken = (left: string, right: string): CompoundToken => ({ type: 'COMPOUND', left, right });
export const makeElementToken = (element: HTMLElement): ElementToken => ({ type: 'ELEMENT', element });
export const makeSpecialToken = (special: SpecialTypes, text: string): SpecialToken => ({ type: 'SPECIAL', special, text });
export const makeSeparatorToken = (sep: string, ): SeparatorToken => ({ type: 'SEPARATOR', sep });


export enum SharedState {
  ARROW,
  BBCODE_LEFT,
  BBCODE_DASH,
  BBCODE_RIGHT,
  BBCODE_LBRACKET,
  BBCODE_RBRACKET,
  BBCODE_YEAR,
  COLONS,
  BEGIN_PARSE,
  COMMON_TRAILING_FIELDS, // FL, exclusive, snatched, hentai, etc.
}

export enum AnimeState {
  SOURCE = 100,
  CONTAINER,
  ASPECT_RATIO,
  VIDEO_CODEC,
  RESOLUTION,
  AUDIO_CODEC,
  DUAL_AUDIO,
  SUBBING_AND_GROUP,
  REMASTER,
  TRAILING_FIELDS,
}

export enum MusicState {
  ENCODING = 200,
  BITRATE,
  SOURCE,
  LOG,
  CUE
}

export enum GameState {
  TYPE = 300,
  PLATFORM,
  REGION,
  ARCHIVED,
  SCENE
}

export enum BookState {
  TRANSLATION = 400,
  FORMAT,
  ONGOING
}

export type AnyState = SharedState | AnimeState | MusicState | BookState | GameState;

export type Transformer<S, T, U, H> = (token: T, state: H) => [S, U];

export type Handler<S, T> = {
  // @ts-ignore
  [state in S]?: T
};

export const SCENE_TEXT = 'Scene';
export const EPISODE_TEXT = 'Episode ';
export const SNATCHED_TEXT = ' - Snatched';
export const ARROW = '»';
export const COLONS = ' :: ';
export const DASH = ' - ';