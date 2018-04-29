import sys
import pathlib
import subprocess
import os
import os.path

if __name__ == '__main__':
    folderPath = pathlib.PurePath(sys.argv[1])
    if folderPath.parts[-1] in ('dist', 'src'):
        folderPath = folderPath / '..'
    elif folderPath.parts[-1] == 'ab-userscripts':
        print('Incorrect folder specified: ' + str(folderPath), file=sys.stderr)
        sys.exit(1)

    if folderPath.parts[-1] == 'delicious-userscripts':
        sys.path.append(str(folderPath))
        import assemble_delicious_script
        print('Assembling delicious bundle.')
        assemble_delicious_script._main()
    else:
        webpack = folderPath / '../node_modules/.bin/webpack.cmd'
        for f in os.listdir(str(folderPath)):
            f = os.path.basename(f)
            if f.startswith('webpack') and f.endswith('.config.js'):
                print('Executing webpack config: ' + str(f))
                subprocess.run(
                    [str(webpack), '--config', str(folderPath / f)],
                    check=True
                )