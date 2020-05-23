
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

export type SpecialTypes = 'snatched' | 'arrow';
export type SpecialToken = {
  type: 'SPECIAL',
  special: SpecialTypes,
};

export type Separator = {
  type: 'SEPARATOR',
}

export type Token = BasicToken | CompoundToken | Separator | ElementToken | SpecialToken;

export const makeBasicToken = (text: string): BasicToken => ({ type: 'BASIC', text });
export const makeCompoundToken = (left: string, right: string): CompoundToken => ({ type: 'COMPOUND', left, right });
export const makeElementToken = (element: HTMLElement): ElementToken => ({ type: 'ELEMENT', element });
export const makeSpecialToken = (special: SpecialTypes): SpecialToken => ({ type: 'SPECIAL', special });
export const makeSeparatorToken = (): Separator => ({ type: 'SEPARATOR' });


export enum SharedState {
  ARROW,
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

export type Transformer<S, T, U, H> = (token: T, state: H) => [S, U];

export type Handler<S, T> = {
  // @ts-ignore
  [state in S]?: T
};

export const SNATCHED_TEXT = ' - Snatched';
export const ARROW = '»';