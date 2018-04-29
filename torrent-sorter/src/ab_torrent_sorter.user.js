// ==UserScript==
// @name AnimeBytes Torrent Sorter
// @author TheFallingMan
// @version 0.0.2
// @description Sorts torrents on torrent pages in order of quality.
// @match https://*.animebytes.tv/*
// @icon http://animebytes.tv/favicon.ico
// @licence GPL-3.0+; http://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==

(function ABTorrentSorter() {
    /** Enables/disables logging to console. */
    const _debug = false;

    /**
     * Mapping between field properties and their relative
     * 'quality'. Lower numbers will be sorted first.
     *
     * @type {Object<string, number>}
     */
    const field_mapping = {
        "Blu-ray":10,
        "Web":34,
        "TV":35,
        "DVD": 30,
        "UHD Blu-ray":9,
        'DVD5': 31,
        'DVD9':32,
        "HD DVD":29,
        "VHS":50,
        "VCD":50,
        "LD": 50,

        'MKV':5,
        'M2TS':50,
        'ISO':40,
        'AVI':20,
        'VOB IFO':42,
        'MP4':22,
        'OGM':25,
        'WMV':26,
        'MPG':23,
        'MPEG':23,
        'VOB':43,
        'TS':49,

        "16:9":5,
        "4:3":6,
        "1.85:1":4,
        "2.39:1":3,
        "2.4:1":2,

        "h264": 21,
        "h264 10-bit": 20,
        "h265": 11,
        "h265 10-bit": 10,
        "XviD": 25,
        "DivX": 25,
        //"WMV": 26,
        "MPEG-TS": 23,
        "MPEG": 22,
        "VC-1": 24,

        '480p': 30,
        '720p':20,
        '1080p':15,
        '1080i':16,
        '4K':10,
        '2560x1440': 13,

        "FLAC":10,
        "AAC":20,
        "AC3":19,
        "MP3":30,
        "Vorbis":21,
        "Opus":21,
        "TrueHD":11,
        "DTS":17,
        "DTS-ES":14,
        "PCM":5,
        "WMA":22,
        "Real Audio":23,
        "DTS-HD MA":12,
        "DTS-HD":13,

        '7.1': 1,
        '6.1': 5,
        '6.0': 6,
        '5.1': 10,
        '5.0':11,
        '2.1': 20,
        '2.0': 21,
        '1.0': 30,

        'Dual Audio': 5,
        'Softsubs': 10,
        'Hardsubs':12,
        'RAW': 15,
    };

    /**
     * Returns a generator iterating over the properties of the given
     * <tr>, from left to right.
     *
     * @example
     *      var iter = row_to_field_list($('tr'));
     *      iter.next().value; // Blu-ray
     *      iter.next().value; // MKV
     *      iter.next().value; // h265
     *
     * @param {HTMLTableRowElement} torrent_row Row element to parse
     */
    function *row_to_field_list(torrent_row) {
        /* Structure is something like:
        <tr>
            <td>
                <span>[DL | RP]</span>
                <a>Blu-ray | MKV | h265 | ... </a>
            </td>
        </tr>
        */
        let link = torrent_row.firstElementChild.children[1];
        //console.log(torrent_row);
        ///console.log(link);

        // (Experimental) compatibility with eva's torrent highlighter.
        // We check if the link contains spans.
        if (link.firstElementChild && link.firstElementChild.tagName === 'SPAN') {
            // In this case, our work is done and we just need to return
            // each span's text.
            _debug && console.log('span');
            let spans = link.children;
            for (let i = 0; i < spans.length; i++) {
                yield (spans[i].textContent);
            }
        } else {
            // Otherwise, we split and return the fields ourselves.
            _debug && console.log('textContent');
            let split_fields = link.textContent.replace('»', '').trim().split(' | ');
            for (let i = 0; i < split_fields.length; i++) {
                let field = split_fields[i];
                // This handles sub groups and region codes.
                // Will work incorrectly if a sub group contains |
                if (field.indexOf('(') !== -1 && field.charAt(field.length-1) === ')') {
                    let s = field.split(' (');
                    yield (s[0]);
                    yield (s[1].trim(')'));
                } else if (field.charAt(field.length-2) === '.') {
                    // If the second last char is a . we assume it's an
                    // audio channel field.
                    let s = field.split(' ');
                    yield (s.slice(0, -1).join(' '));
                    yield (s[s.length-1]);
                } else {
                    yield (field);
                }
            }
        }
    }

    /**
     * Gets the sorting weight of the value `x` from the defined field mapping.
     * @param {string} x Field value
     */
    function get_weight(x) {
        return field_mapping[x];
    }

    /**
     * Iterates through each property of a and b from left to right,
     * comparing each property in turn using get_weight().
     *
     * For use as a comparison function in the .sort() method. Returns a positive
     * number when b < a, negative for a < b, and 0 if a = b.
     * @param {HTMLTableRowElement} a
     * @param {HTMLTableRowElement} b
     */
    function sort_comparer(a, b) {
        let a_iter = row_to_field_list(a);
        let b_iter = row_to_field_list(b);

        let a_object = {}
        while (!a_object.done) {
            a_object = a_iter.next();
            var b_object = b_iter.next();
            if (b_object.done) {
                // In case of one string being shorter than the other,
                // we sort the shorter one first.
                return 1;
            }
            let a_value = a_object.value;
            let b_value = b_object.value;
            if (a_value === b_value) {
                continue;
            }
            let a_weight = get_weight(a_value);
            let b_weight = get_weight(b_value);
            //_debug && (`a: ${a_value} ${a_weight}; b: ${b_value} ${b_weight}`)
            // Doing an arithmetic comparison only makes sense when both
            // a and b have defined weights.
            if (a_weight && b_weight) {
                // This integer subtraction results in the correct sorting.
                return a_weight - b_weight;
            } else {
                // Use string (alphabetical) sort on the original strings.
                return (a_value < b_value) ? -1 : 1;
            }
        }
        // If a and b have the same number of elements, they will finish at
        // the same time and are equal.
        if (b_object.done)
            return 0
        // Otherwise, a < b.
        return -1;
    }

    function sort_rows(torrent_rows) {
        // Sort with our custom sort function.
        torrent_rows.sort(sort_comparer);
        let docFrag = document.createDocumentFragment();
        for (let s = 0; s < torrent_rows.length; s++) {
            let elem = torrent_rows[s];
            // Stores element after this row, checking if it is this
            // row's information row.
            // IMPORTANT: this must be before 'elem' is inserted
            // elsewhere.
            let next = elem.nextElementSibling;
            // Append torrent row.
            docFrag.appendChild(elem);
            //console.log(s.textContent);
            // Checks if 'next' is an info row.
            if (next && next.classList.contains('pad'))
                docFrag.appendChild(next);
        }
        return docFrag;
    }

    /**
     * Sorts a whole table element. Capable of understanding subheadings inside
     * the table, and will not sort rows across them.
     * @param {HTMLTableElement} table
     */
    function sort_table(table) {
        let tbody = table.firstElementChild;
        let is_first_link = true;
        let num_children = tbody.children.length;
        let current_torrent_group = [];
        for (let r = 0; r < num_children; r++) {
            let row = tbody.children[r];
            ///console.log(row);
            // If this row is a torrent link
            if (row.classList.contains('group_torrent')) {
                // We skip sorting torrents2.php links, as they are music
                // and not nearly as varied as anime torrents.
                if (is_first_link &&
                    row.firstElementChild.children[1].href.indexOf('torrents.php?') === -1) {
                    break;
                }
                is_first_link = false;
                current_torrent_group.push(row);
            // We use 'pad' class to check for the torrent information rows.
            // (There must be a better way.)
            // If it is not a pad or group_torrent, then it is a subheading
            // and we sort all torrents above this header.
            } else if (!row.classList.contains('pad')
                    && current_torrent_group.length) {
                ///console.log('sorting!');
                // Skip small torrent groups, e.g. single manga or game torrents.
                if (current_torrent_group.length <= 3) {
                    current_torrent_group = [];
                    continue;
                }
                let docFrag = sort_rows(current_torrent_group);
                // Inserts the sorted docFrag before the header.
                tbody.insertBefore(docFrag, row);
                current_torrent_group = [];
            }
        }
        // This will fall through the bottom of the table, because there
        // is no subheading there. In that case, we sort everything
        // that's left and just append it.
        if (current_torrent_group.length) {
            let docFrag = sort_rows(current_torrent_group);
            tbody.appendChild(docFrag);
        }
    }

    let torrent_tables = document.querySelectorAll('table.torrent_table');
    for (let t = 0; t < torrent_tables.length; t++) {
        sort_table(torrent_tables[t]);
    }
})();