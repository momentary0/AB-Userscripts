const webpack_generator = require('../webpack_base.config');

module.exports = webpack_generator(
    'ab_torrent_sorter',
    '.user.js',
    './torrent-sorter',
    true);