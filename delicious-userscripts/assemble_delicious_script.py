#!/usr/bin/env python3
import os
import os.path
from datetime import datetime as dt
import shutil

class ScriptAssembler:
    delicious_common = '_delicious_common.js'
    def __init__(self, input_file, output_file, out_dir, common_inserted=False, global_indent=''):
        self.input_file = input_file
        self.out_dir = out_dir
        self.output_file = output_file
        self.indent_str = ''
        self.global_indent = global_indent
        self.common_inserted = common_inserted

    def comment(self, comment):
        self.output_file.write(
            self.global_indent + self.indent_str +
            '/* === ' + comment + ' === */\n')

    def insert_extra_script(self, script_name):
        self.comment('Inserted from ' + script_name)
        with open(script_name, encoding='utf-8') as script:
            ScriptAssembler(
                script,
                self.output_file,
                self.out_dir,
                self.common_inserted,
                self.global_indent+self.indent_str
            ).write_script()
        self.output_file.write('\n')
        self.comment('End ' + script_name)
        if (not os.path.basename(script_name).startswith('_')):
            # Calls another instance of this class to handle inserting
            # common functions into single scripts.
            with open(script_name, encoding='utf-8') as script, \
                open(self.out_dir+'/'+script_name, 'w', encoding='utf-8') as new_script_out:
                    ScriptAssembler(
                        script,
                        new_script_out,
                        self.out_dir
                    ).write_script()

    def write_script(self):
        for line in self.input_file:
            trimmed = line.lstrip()
            if trimmed: # if trimmed is non-empty
                self.indent_str = ' '*(len(line) - len(trimmed))
            if trimmed.startswith('importScriptFile('):
                script_name = trimmed.rstrip(');\n')[18:-1]
                self.insert_extra_script(script_name)
            elif trimmed.startswith('importDeliciousCommon()'):
                if not self.common_inserted:
                    self.common_inserted = True
                    self.insert_extra_script(self.delicious_common)
                else:
                    self.comment(self.delicious_common+' already inserted.')
            else:
                #self.output_file.write('\n')
                #self.comment('Script generated at ' + dt.now().isoformat())
                self.output_file.write(self.global_indent + line)

def _main():
    os.chdir(os.path.dirname(__file__))
    with open('_ab_delicious_scripts_loader.user.js', encoding='utf-8') as in_file, \
        open('dist/ab_delicious_scripts.user.js', 'w', encoding='utf-8') as out_file:
        assembler = ScriptAssembler(
            in_file,
            out_file,
            'dist'
        )
        assembler.write_script()

if __name__ == '__main__':
    _main()