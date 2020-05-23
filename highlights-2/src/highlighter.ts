import { parse, SEP_SYMBOL } from "./parser";
import { tokenise } from "./lexer";

export function main() {
  const links = document.querySelectorAll('.group_torrent > td > a[href*="&torrentid="]');
  for (let i = 0; i < links.length; i++) {
    const el = links[i] as HTMLAnchorElement;
    let tokens = null;
    let output = null;
    let fields = null;

    try {
      const delim = el.href.indexOf('torrents.php') !== -1 ? ' | ' : ' / ';

      tokens = tokenise(el.childNodes, delim);
      [output, fields] = parse(tokens, delim);

      el.classList.add('userscript-highlight', 'torrent-page');

      while (el.hasChildNodes()) {
        el.removeChild(el.lastChild!);
      }
      const df = document.createDocumentFragment();
      df.append(...output);
      el.append(df);

      for (const [k, v] of Object.entries(fields)) {
        el.dataset[k] = v;
      }
    } catch (e) {
      console.error("Error while highlighting torrent: ", e);
      console.log("Element: ", el);
      console.log("Child nodes: ", Array.from(el.childNodes));
      console.log("Tokenised: ", tokens);
      console.log("Converted: ", output);
      console.log("Fields: ", fields);
      console.log("------------------------------------");
    }
  }
}

export function test() {
  console.log("Testing...");
}
