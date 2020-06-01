# Delicious Userscripts Bundle

The `src/` folder contains the individual userscripts, all fully functional.
The `dist/` folder contains the bundled script, generated using `tsc`.

### Development

The source code for individual userscripts are in the src folder.
Please make sure that each script works by itself, by including a suitable
userscript header in its file.

To create the bundle in dist/ab_delicious_scripts.user.js, the individual
scripts are merged together with the Typescript compiler (`tsc`), according
to _template.ts. The header of the bundle itself is in the _header.js file.

Any recent version of Typescript should suffice. See [here](https://code.visualstudio.com/docs/typescript/typescript-tutorial#_install-the-typescript-compiler)
for how to install it. Once installed, running `tsc` in this directory will
compile the bundle. You can watch the files and rebuild automatically when
files are changed with the command `tsc -w`. This ensures that the bundle
script always has the latest changes, very helpful while developing.

After adding or altering userscript requirements, you may need to run the
_update_template.py Python script. This will add any new scripts to the
_template.ts file and add their `@require` and `@grant` tags to the _header.js
file.