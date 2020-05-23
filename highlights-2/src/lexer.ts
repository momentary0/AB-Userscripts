import { Token, makeBasicToken, makeSeparatorToken, makeCompoundToken, makeElementToken, AnimeState, SNATCHED_TEXT, makeSpecialToken, ARROW } from './types';


export function tokeniseString(input: string, delim: string): Token[] {
  if (input === ARROW) {
    return [makeSpecialToken('arrow')];
  } else if (input === SNATCHED_TEXT) {
    return [makeSpecialToken('snatched')];
  }

  const RPAREN_WITH_SEP = ')' + delim;
  const LPAREN_OR_SEP = [
    delim, 'Raw (', 'Translated (', 'Softsubs (', 'Hardsubs (', 'RAW ('
  ];

  let i = 0;
  let j = 0;
  const output: Token[] = [];
  input = input.trimStart();
  while (i < input.length) {
    if (j++ > 10000) {
      throw new Error("Iteration limit exceeded in tokeniseString");
    }

    let tail = input.slice(i);

    // find the next separator or compound expression, if it exists.
    let markerIndex = Infinity;
    let marker = null;
    for (const x of LPAREN_OR_SEP) {
      const n = tail.indexOf(x);
      if (n >= 0 && n < markerIndex) {
        markerIndex = n;
        marker = x;
      }
    }

    // if no separator to the right, consume the rest of the string.
    if (marker === null) {
      output.push(makeBasicToken(tail));
      i += tail.length;
    } else if (marker === delim) {
      // if next is a separator, consume up to that separator.
      output.push(makeBasicToken(tail.slice(0, markerIndex).trim()));
      output.push(makeSeparatorToken());
      i += markerIndex + marker.length;
    } else {
      // next is a compound expression. consume up to the close parens.
      i += marker.length; // consume the left and open paren.

      // find closing paren with separator.
      const inner = tail.slice(marker.length);
      const closeSep = inner.indexOf(RPAREN_WITH_SEP);
      let right;
      if (closeSep < 0) {
        // no closing paren with separator, consume to end of string
        // and remove close paren character.
        right = inner.replace(/\)$/, '');
        i += inner.length;
      } else {
        // consume to closing paren separator, excluding close paren.
        right = inner.substr(0, closeSep);
        if (right[right.length-1] == ')')
          right = right.substring(0, -1);
        i += closeSep + RPAREN_WITH_SEP.length;
      }

      output.push(makeCompoundToken(marker.split(' ')[0], right));

      if (closeSep !== null) {
        output.push(makeSeparatorToken());
      }
    }
  }
  return output;
}

export function tokeniseElement(input: HTMLElement): Token {
  return makeElementToken(input);
}

export function testTokeniseInput(input: string[]): Token[] {
  return input.map(tokeniseString).flat();
}

export function preTokenise(nodes: NodeListOf<ChildNode>): (string | HTMLElement)[] {
  const output = [];
  const ARROW = '»';

  let i = 0;
  for (const node of nodes) {
    switch (node.nodeType) {
      case Node.TEXT_NODE:
        let text = node.textContent!;
        let text2 = null;

        if (i === 0 && text.startsWith(ARROW)) {
          text2 = text.slice(1).trimLeft();
          text = ARROW;
        }

        if (i === nodes.length-1) {
          text = text.trimEnd();
          if (text.endsWith(SNATCHED_TEXT.trimStart())) {
            text = text.replace(SNATCHED_TEXT.trimStart(), '').trimEnd();
            text2 = SNATCHED_TEXT;
          }
        }

        output.push(text);
        if (text2 !== null)
          output.push(text2);
        break;
      case Node.ELEMENT_NODE:
        output.push(node as HTMLElement);
        break;
      default:
        throw new Error("Unknown child node: " + node);
    }
    i++;
  }
  return output;
}

export function mainTokenise(input: (string | HTMLElement)[], delim: string): Token[] {
  const output = [];
  for (const x of input) {
    if (typeof x == 'string')
      output.push(...tokeniseString(x, delim));
    else
      output.push(tokeniseElement(x as HTMLElement));
  }
  return output;
}

export function tokenise(nodes: NodeListOf<ChildNode>, delim: string): Token[] {
  return mainTokenise(preTokenise(nodes), delim);
}