import { parse } from "./parser";
import { tokenise } from "./lexer";
import { SharedState, AnyState } from "./types";

export function highlight(links: NodeListOf<HTMLAnchorElement>, start: AnyState, className: string, defaultDelim?: string): number {
  const count = (needle: RegExp, haystack: string) => (haystack.match(needle) ?? []).length;

  const HIGHLIGHT_CLASS = 'userscript-highlight';

  let success = 0;
  console.log(`Highlighting ${links.length} elements with ${className} class...`);
  const startTime = Date.now();

  for (const el of links) {

    if (el.classList.contains(HIGHLIGHT_CLASS)) {
      console.error("Highlighter: Refusing to highlight element which is already "
        + 'highlighted', el);
      break;
    }

    let tokens = null;
    let output = null;
    let fields = null;

    try {
      el.classList.add(HIGHLIGHT_CLASS, className);

      let delim = defaultDelim;
      if (delim) {
        // use given delim.
      } else if (el.href.indexOf('torrents.php') != -1) {
        delim = ' | ';
      } else if (el.href.indexOf('torrents2.php') != -1) {
        delim = ' / ';
      } else {
        const pipes = count(/ \| /g, el.textContent!);
        const slashes = count(/ \/ /g, el.textContent!);
        delim = pipes > slashes ? ' | ' : ' / ';
      }

      tokens = tokenise(el.childNodes, delim);
      [output, fields] = parse(tokens, start);

      while (el.hasChildNodes()) el.removeChild(el.lastChild!);

      const df = document.createDocumentFragment();
      df.append(...output);
      el.appendChild(df);

      let fieldsString = '';
      for (const [k, v] of Object.entries(fields)) {
        el.dataset[k] = v;
        fieldsString += v.replace(/\s/g, '_') + ' ';
      }
      el.dataset.fields = fieldsString;

      if (fields.misc !== undefined) {
        throw 'misc';
      }

      success++;
    } catch (e) {
      switch (e) {
        case 'misc':
          console.error('Highlighter: Generated data-misc field for torrent. '
            + 'This might be due to a lexer/parser bug or unsupported data field.\n'
            + el.href + '\n'
            + JSON.stringify(el.textContent));
          break;
        default:
          console.error("Highlighter: Fatal error while highlighting torrent: ", e);
          console.log("Element: ", el);
          // console.log("Child nodes: ", Array.from(el.childNodes));
          console.log("Tokenised: ", tokens);
          // console.log("Converted: ", output);
          console.log("Data fields: ", fields);
          console.log("------------------------------------");
          break;
      }
    }
  }

  console.log(`Done highlighting in ${Date.now()-startTime} ms: ${success} successful, ${links.length-success} failed.`);
  return success;
}

export function main() {
  const q = (s: string) => document.querySelectorAll(s) as NodeListOf<HTMLAnchorElement>;

  const TORRENT_PAGE_QUERY = '.group_torrent > td > a[href*="&torrentid="]';
  highlight(q(TORRENT_PAGE_QUERY), SharedState.ARROW, 'torrent-page');

  // torrents on search result pages are always separated by ' | '.
  const TORRENT_SEARCH_QUERY = '.torrent_properties > a[href*="&torrentid="]';
  highlight(q(TORRENT_SEARCH_QUERY), SharedState.BEGIN_PARSE, 'torrent-page', ' | ');

  const TORRENT_BBCODE_QUERY = ':not(.group_torrent)>:not(.torrent_properties)>a[href*="/torrent/"]:not([title])';
  highlight(q(TORRENT_BBCODE_QUERY), SharedState.BBCODE_LEFT, 'torrent-bbcode');
}

export function test() {
  console.log("Testing...");
}
