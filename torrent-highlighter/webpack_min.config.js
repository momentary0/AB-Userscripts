const webpack_generator = require('../webpack_base.config');

module.exports = webpack_generator(
    'tfm_torrent_highlighter',
    '.user.js',
    './torrent-highlighter',
    true);