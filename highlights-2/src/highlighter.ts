import { parse, SEP_SYMBOL } from "./parser";
import { tokenise } from "./lexer";

export function highlight(links: NodeListOf<HTMLAnchorElement>, className: string): number {
  let success = 0;
  console.log("Highlighting " + links.length + " torrent elements...");
  const start = Date.now();
  for (const el of links) {
    let tokens = null;
    let output = null;
    let fields = null;

    try {
      const delim = el.href.indexOf('torrents.php') !== -1 ? ' | ' : ' / ';

      tokens = tokenise(el.childNodes, delim);
      [output, fields] = parse(tokens, delim);

      el.classList.add('userscript-highlight', className);

      while (el.hasChildNodes()) {
        el.removeChild(el.lastChild!);
      }
      const df = document.createDocumentFragment();
      df.append(...output);
      el.appendChild(df);

      for (const [k, v] of Object.entries(fields)) {
        el.dataset[k] = v;
      }
      if (fields.misc !== undefined) {
        console.warn('Highlighter: Generated data-misc field for torrent. ' +
          'This might be due to a lexer/parser bug or unsupported data field.',
          el.href);
        throw 'data-misc';
      }
      success++;
    } catch (e) {
      if (e !== 'data-misc')
        console.error("Highlighter: Error while highlighting torrent: ", e);
      console.log("Element: ", el);
      // console.log("Child nodes: ", Array.from(el.childNodes));
      console.log("Tokenised: ", tokens);
      // console.log("Converted: ", output);
      console.log("Data fields: ", fields);
      console.log("------------------------------------");
    }
  }
  console.log(`Done highlighting in ${Date.now()-start} ms: ${success} successful, ${links.length-success} failed.`);
  return success;
}

export function main() {
  const TORRENT_PAGE_QUERY = '.group_torrent > td > a[href*="&torrentid="], .torrent_properties > a[href*="&torrentid="]'

  const links = document.querySelectorAll(TORRENT_PAGE_QUERY) as NodeListOf<HTMLAnchorElement>;
  highlight(links, 'torrent-page');
}

export function test() {
  console.log("Testing...");
}
