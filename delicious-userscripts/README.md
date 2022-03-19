# Delicious Userscripts Bundle

The `src/` folder contains the individual userscripts, all fully functional.
The `dist/` folder contains the bundled script, generated using Python.

### Development

The source code for individual userscripts are in the src folder.
Please make sure that each script works by itself by including a suitable
userscript header in its file.

To create the bundle in dist/ab_delicious_scripts.user.js, the individual
scripts are merged together with the Python script _update_template.py.
The header of the bundle itself is in the _header.js file.

Once the changes are made to individual scripts in src/, execute the
_update_template.py script to concatenate them into the combined script.
This will also add their `@require` and `@grant` tags to the _header.js
file.

A summary of the steps is below.

1. Make changes to individual scripts as needed and bump version number.
2. Bump version number in _header.js.
3. Generate dist/ab_delicious_scripts.user.js by running _update_template.py.
   For example,

     python3 _update_template.py

4. Commit and push / pull request as usual.
