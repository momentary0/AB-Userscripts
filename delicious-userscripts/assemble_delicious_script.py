#!/usr/bin/env python3
import os
import os.path
from datetime import datetime as dt
import shutil

class ScriptAssembler:
    no_delicious_common = [
        'ab_hide_treats.user.js',
        'ab_title_inverter.user.js',
        'ab_title_notifications.user.js'
    ]
    def __init__(self, input_file, output_file, out_dir, insert_common=False):
        self.input_file = open(input_file, encoding='utf-8')
        self.out_dir = out_dir
        self.output_file = open(out_dir + '/'+output_file, 'w', encoding='utf-8')
        self.indent_str = ''
        self.insert_common = insert_common
    
    def __del__(self):
        self.input_file.close()
        self.output_file.close()

    def comment(self, comment):
        self.output_file.write(self.indent_str + '/* === ' + comment + ' === */\n')

    def insert_extra_script(self, script_name):
        self.comment('Inserted from ' + script_name)
        with open(script_name, encoding='utf-8') as script:
            for l in script:
                self.output_file.write(self.indent_str + l)
        self.output_file.write('\n')
        self.comment('End ' + script_name)
        if (not os.path.basename(script_name).startswith('_')):
            # Calls another instance of this class to handle inserting
            # common functions into single scripts.
            assembler2 = ScriptAssembler(
                script_name, 
                script_name,
                'dist', 
                script_name not in self.no_delicious_common
            )
            assembler2.write_script()

    def write_script(self):
        common_inserted = False
        for line in self.input_file:
            trimmed = line.lstrip()
            if trimmed: # if trimmed is non-empty
                self.indent_str = ' '*(len(line) - len(trimmed))
            if trimmed.startswith('importScriptFile('):
                script_name = trimmed.rstrip(');\n')[18:-1]

                self.insert_extra_script(script_name)
            else:
                if not (common_inserted or trimmed.startswith('//')):
                    common_inserted = True
                    #self.output_file.write('\n')
                    #self.comment('Script generated at ' + dt.now().isoformat())
                    if (self.insert_common):
                        self.output_file.write('\n')
                        self.insert_extra_script('_delicious_common.js')
                self.output_file.write(line)


if __name__ == '__main__':
    os.chdir(os.path.dirname(__file__))
    assembler = ScriptAssembler(
        '_ab_delicious_scripts_loader.user.js',
        'ab_delicious_scripts.user.js',
        'dist'
    )
    assembler.write_script()