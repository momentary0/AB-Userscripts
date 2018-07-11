import re
import os
import glob

class Concat:
    _placeholder_re = re.compile(r'^(\s*)/\* \{([^:}]+)(?::(\d+))?\} \*/\n$')

    _grant_re = re.compile(r'^//\s*@grant\s+(.+)$')
    _require_re = re.compile(r'^//\s*@require\s+(.+)$')

    def __init__(self, template_file):
        self._template_file = template_file
        self._script_lines = []
        self._grants = []
        self._requires = []

    def write_bundle(self, out_file, userscripts):
        for f in userscripts:
            print('Reading script', f)
            self._script_lines.append('/* Begin ' + f + ' */\n')

            with open(f, 'r', encoding='utf-8') as script_file:
                for l in script_file:
                    self._script_lines.append(l)

                    grant_match = self._grant_re.match(l)
                    if grant_match and grant_match[1] not in self._grants:
                        print('Found @grant', grant_match[1])
                        self._grants.append(grant_match[1])

                    require_match = self._require_re.match(l)
                    if require_match and require_match[1] not in self._requires:
                        print('Found @require', require_match[1])
                        self._requires.append(require_match[1])
            if not self._script_lines[len(self._script_lines)-1].endswith('\n'):
                self._script_lines[len(self._script_lines)-1] += '\n'
            self._script_lines.append('/* End ' + f + ' */\n\n\n')

        print('Writing bundle script')
        with open(out_file, 'w', encoding='utf-8') as out:
            self._out_file_obj = out
            with open(self._template_file, 'r', encoding='utf-8') as template:
                for template_line in template:
                    match = self._placeholder_re.match(template_line)
                    if match:
                        if match[2] == '@require':
                            print('Inserting @require')
                            self._write_sublines(self._requires,
                                '// @require', int(match[3]), match[1], '\n')
                        elif match[2] == '@grant':
                            print('Inserting @grant')
                            self._write_sublines(self._grants,
                                '// @grant', int(match[3]), match[1], '\n')
                        elif match[2] == 'userscripts':
                            print('Inserting userscripts')
                            self._write_sublines(self._script_lines,
                                '', 0, match[1])
                    else:
                        out.write(template_line)


    def _write_sublines(self, lines, prefix, margin, indent, suffix=''):
        for l in lines:
            self._out_file_obj.write(indent + prefix.ljust(margin) + l + suffix)

def _main():
    os.chdir(os.path.dirname(__file__))
    Concat('./_ab_delicious_template.js').write_bundle(
        './dist/ab_delicious_scripts.user.js',
        glob.glob('./src/*.user.js'))

if __name__ == '__main__':
    _main()