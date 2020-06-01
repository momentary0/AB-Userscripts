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

        with open('./dist/ab_delicious_scripts.auto.user.js', 'w', encoding='utf-8') as f:
            f.write('''// ==UserScript==
// @name AnimeBytes Delicious Bundle (Automatic)
// @version 1.0.1
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @match https://*.animebytes.tv/*
// @icon http://animebytes.tv/favicon.ico
// @require https://github.com/momentary0/AB-Userscripts/raw/master/delicious-library/src/ab_delicious_library.js\n''')
            requires = []
            requires.extend(glob.glob('./src/*.user.js'))
            for x in requires:
                prefix = 'https://github.com/momentary0/AB-Userscripts/raw/master/delicious-userscripts'
                f.write('// @require '+prefix+x[1:].replace('\\', '/') + '\n')
            f.write('''// ==/UserScript==

(function() {
    console.info('Delicious bundle automatic version loaded.');
})();''')