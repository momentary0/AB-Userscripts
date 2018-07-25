import sys
import pathlib
import subprocess
import os
import os.path

if __name__ == '__main__':
    folderPath = pathlib.PurePath(sys.argv[1])
    if folderPath.parts[-1] in ('dist', 'src'):
        folderPath = folderPath.parent
    elif folderPath.parts[-1] == 'ab-userscripts':
        print('Incorrect folder specified: ' + str(folderPath), file=sys.stderr)
        sys.exit(1)

    if folderPath.parts[-1] == 'delicious-userscripts':
        sys.path.append(str(folderPath))
        sys.path.insert(0, './delicious-userscripts')
        import concat_userscripts
        print('Assembling delicious bundle.')
        concat_userscripts._main()
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