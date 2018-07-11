import os
import pathlib
import glob

if __name__ == '__main__':
    os.chdir(os.path.dirname(__file__))
    with open('./dist/ab_delicious_scripts.dev.user.js', 'w', encoding='utf-8') as f:
        f.write('''// ==UserScript==
// @name AnimeBytes Delicious Bundle (BOOTSTRAP)
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @match https://*.animebytes.tv/*
// @icon http://animebytes.tv/favicon.ico\n''')
        requires = ['./../delicious-library/src/ab_delicious_library.js']
        requires.extend(glob.glob('./src/*.user.js'))
        for x in requires:
            f.write('// @require '+pathlib.Path(x).resolve().as_uri() + '\n')
        f.write('''// ==/UserScript==

(function() {
    console.info('Delicious bundle developer version loaded.');
})();''')