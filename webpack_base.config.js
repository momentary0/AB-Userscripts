const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = function(scriptName, scriptExt, scriptRoot, minify=false) {
    const headerDoc = fs.readFileSync(scriptRoot + '/src/' + scriptName+scriptExt, 'utf8');
    let userscriptHeader = '';
    for (const line of headerDoc.split('\n')) {
        console.log(line);
        if (!line.startsWith('//'))
            break;
        userscriptHeader += line + '\n';
    }

    return {
        entry: scriptRoot + '/src/' + scriptName+scriptExt,
        output: {
            filename: scriptName + (minify?'.min':'') + scriptExt,
            path: path.resolve(scriptRoot, 'dist')
        },
        module: {
            rules: [
                { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
            ]
        },
        mode: 'none',
        devtool: 'source-map',
        plugins: (minify?[
            new UglifyJsPlugin({
                cache: true,
                uglifyOptions: {
                    warnings: true,
                    compress: {
                        'booleans': false,
                        'unused': true,
                        'dead_code': true,
                        'conditionals': true,
                        'passes': 2,
                        'evaluate': true,
                        'inline': true,
                        'pure_funcs': ['Date.now'],
                        'pure_getters': true,
                        'unsafe': true,
                        global_defs: {

                        }
                    },
                    mangle: {
                        keep_fnames: true,
                    }
                }
            })]:[
            /*new UglifyJsPlugin({
                uglifyOptions: {
                    compress: {
                        'unused': true,
                        'dead_code': true,
                        'conditionals': true,
                        'passes': 2,
                        'evaluate': true,
                        'inline': true,
                        'pure_funcs': ['console.log', 'Date.now', '_log'],
                        'unsafe': true
                    },
                    mangle: false,
                    output: {
                        comments: 'all',
                        beautify: true,
                    }
                }
            })]*/
        ]) .concat([
            new webpack.BannerPlugin({
                raw: true,
                banner: userscriptHeader,
                entryOnly: true
            })])
    };
};