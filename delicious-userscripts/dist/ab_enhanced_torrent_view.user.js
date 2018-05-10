// ==UserScript==
// @name        Enhanced Torrent View
// @namespace   Megure@AnimeBytes.tv
// @description Shows how much yen you would receive if you seeded torrents; shows required seeding time; allows sorting and filtering of torrent tables; dynamic loading of transfer history tables
// @include     http*://animebytes.tv*
// @version     1.00
// @grant       GM_getValue
// @grant       GM_setValue
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

// Enhanced Torrent View by Megure
// Shows how much yen you would receive if you seeded torrents; shows required seeding time; allows sorting and filtering of torrent tables; dynamic loading of transfer history tables
(function EnhancedTorrentView() {
    /* === Inserted from _delicious_common.js === */
    // Common functions used by many scripts.
    // Will be inserted once into the delicious bundle,
    // and prepended to each individual userscript.
    
    // Debug flag. Used to enable/disable some verbose console logging.
    var _debug = false;
    
    // jQuery, just for Pale Moon.
    // Note: this doesn't actually import jQuery successfully,
    // but for whatever reason, it lets PM load the script.
    if ((typeof jQuery) === 'undefined') {
        _debug && console.log('setting window.jQuery');
        jQuery = window.jQuery;
        $ = window.$;
        $j = window.$j;
    }
    
    // Super duper important functions
    // Do not delete or something might break and stuff!! :(
    HTMLCollection.prototype.each = function (f) { for (var i = 0, e = null; e = this[i]; i++) f.call(e, e); return this; };
    HTMLElement.prototype.clone = function (o) { var n = this.cloneNode(); n.innerHTML = this.innerHTML; if (o !== undefined) for (var e in o) n[e] = o[e]; return n; };
    // Thank firefox for this ugly shit. Holy shit firefox get your fucking shit together >:(
    function forEach(arr, fun) { return HTMLCollection.prototype.each.call(arr, fun); }
    function clone(ele, obj) { return HTMLElement.prototype.clone.call(ele, obj); }
    
    function injectScript(content, id) {
        var script = document.createElement('script');
        if (id) script.setAttribute('id', id);
        script.textContent = content.toString();
        document.body.appendChild(script);
        return script;
    }
    if (typeof GM_getValue === 'undefined'
            || (GM_getValue.toString && GM_getValue.toString().indexOf("not supported") > -1)) {
        _debug && console.log('Setting fallback localStorage GM_* functions');
        // There is some difference between this.GM_getValue and just GM_getValue.
        _debug && console.log(this.GM_getValue);
        _debug && typeof GM_getValue !== 'undefined' && console.log(GM_getValue.toString());
        // Previous versions lacked a @grant GM_getValue header, which resulted
        // in these being used when they shouldn't have been.
        this.GM_getValue = function (key, def) { return localStorage[key] || def; };
        this.GM_setValue = function (key, value) { return localStorage[key] = value; };
        this.GM_deleteValue = function (key) { return delete localStorage[key]; };
        // We set this when we have used localStorage so if in future we switch,
        // it will be imported.
        GM_setValue('deliciousSettingsImported', 'false');
        _debug && console.log(GM_getValue);
    } else {
        _debug&& console.log('Using default GM_* functions.');
        // For backwards compatibility,
        // we'll implement migrating localStorage to GM settings.
        // However, we can't implement the reverse because when localStorage is
        // used, GM_getValue isn't even defined so we obviously can't import.
        if (GM_getValue('deliciousSettingsImported', 'false') !== 'true') {
            _debug && console.log('Importing localStorage to GM settings');
            GM_setValue('deliciousSettingsImported', 'true');
            var keys = Object.keys(localStorage);
            keys.forEach(function(key){
                if (GM_getValue(key, 'undefined') === 'undefined') {
                    _debug && console.log('Imported ' + key);
                    GM_setValue(key, localStorage[key]);
                } else {
                    _debug && console.log('Key exists ' + key);
                }
            });
        }
    }
    
    function initGM(gm, def, json, overwrite) {
        if (typeof def === "undefined") throw "shit";
        if (typeof overwrite !== "boolean") overwrite = true;
        if (typeof json !== "boolean") json = true;
        var that = GM_getValue(gm);
        if (that != null) {
            var err = null;
            try { that = ((json) ? JSON.parse(that) : that); }
            catch (e) { if (e.message.match(/Unexpected token .*/)) err = e; }
            if (!err && Object.prototype.toString.call(that) === Object.prototype.toString.call(def)) { return that; }
            else if (overwrite) {
                GM_setValue(gm, ((json) ? JSON.stringify(def) : def));
                return def;
            } else { if (err) { throw err; } else { return that; } }
        } else {
            GM_setValue(gm, ((json) ? JSON.stringify(def) : def));
            return def;
        }
    }
    /* === End _delicious_common.js === */

    var days_per_year = 365.256363;
    var show_yen = GM_getValue('ABTorrentsShowYen', 'true') === 'true';
    var show_required_time = GM_getValue('ABTorrentsReqTime', 'true') === 'true';
    var sort_rows = GM_getValue('ABSortTorrents', 'true') === 'true';
    var filter_torrents = GM_getValue('ABTorrentsFilter', 'true') === 'true';
    var dynamic_load = GM_getValue('ABHistDynLoad', 'true') === 'true';
    var time_frame = parseInt(GM_getValue('ABTorrentsYenTimeFrame', '24'), 10);
    var time_frame_string = time_frame + ' hours';
    if (time_frame === 1) {
        time_frame_string = 'hour';
    }
    else if (time_frame === 24) {
        time_frame_string = 'day';
    }
    else if (time_frame === 168) {
        time_frame_string = 'week';
    }
    // How many digits to show for Yen over time_frame, see yen_to_string
    var log10 = Math.round(Math.log(time_frame) / Math.LN10);
    var size_RegExp = /^([\d\.]+)\s(?:([a-zA-Z])i)?B(?:\s\(([\d\.]+)%\))?$/;
    var ratio_RegExp = /^(∞|\-\-|[\d\.]+)$/;
    var and_RegExp = /(and|\s)/ig;
    var duration_RegExp = /^(?:(\d+)years?)?(?:(\d+)months?)?(?:(\d+)weeks?)?(?:(\d+)days?)?(?:(\d+)hours?)?(?:(\d+)minutes?)?(?:(\d+)seconds?)?(?:\s*\([^)]*\)\s*)*$/;
    var datetime_RegExp = /^(\d+)\-(\d{1,2})\-(\d{1,2})\s+(\d{1,2}):(\d{1,2})$/;
    var currency_RegExp = /^(?:[¥|€|£|\$]\s*)([\d\.]+)$/;
    function unit_prefix(prefix) {
        // This is called with only the prefix of the byte unit
        switch (prefix.toUpperCase()) {
            case '':
                return 1 / 1073741824;
            case 'K':
                return 1 / 1048576;
            case 'M':
                return 1 / 1024;
            case 'G':
                return 1;
            case 'T':
                return 1024;
            case 'P':
                return 1048576;
            case 'E':
                return 1073741824;
            default:
                return 0;
        }
    }
    function get_column(row, cell) {
        var cells = row.cells;
        var column = 0;
        for (var i = 0, length = cells.length; i < length; i++) {
            var row_cell = cells[i];
            if (row_cell === cell) {
                break;
            }
            column += row_cell.colSpan;
        }
        return column;
    }
    function get_cell(row, index) {
        var cells = row.cells;
        var column = 0;
        for (var i = 0, length = cells.length; i < length; i++) {
            var row_cell = cells[i];
            if (column === index) {
                return row_cell;
            }
            column += row_cell.colSpan;
        }
        return null;
    }
    function get_next_separator_element_sibling(row) {
        while ((row != null) && row.id.indexOf('group_') !== 0 && row.className.indexOf('edition_info') === -1) {
            row = row.nextElementSibling;
        }
        return row;
    }
    function get_corresponding_torrent_row(row) {
        var anchor = row.querySelector('a[title="Download"]');
        if (anchor !== null) {
            //console.log(anchor.href);
            var match = anchor.href.match(/torrent\/(\d+)\/download/i);
            if (match !== null) {
                var new_row = document.getElementById('torrent_' + match[1]);
                if (new_row !== row) {
                    return new_row;
                }
            }
        }
        return null;
    }
    // Converts a duration of hours into a string, like 3 days, 4 hours and 17 minutes
    function duration_to_string(duration) {
        var days = Math.floor(duration / 24);
        var hours = Math.floor(duration % 24);
        var minutes = Math.ceil((duration * 60) % 60);
        var res = days + ' days';
        if (hours > 0) {
            res += minutes === 0 ? ' and ' : ', ';
            res += hours + ' hours';
        }
        if (minutes > 0) {
            res += ' and ' + minutes + ' minutes';
        }
        return res;
    }
    // Show 2 - log10 digits
    function yen_to_string(yen) {
        return yen.toFixed(Math.max(2 - log10, 0));
    }
    // The compound interest factor for yen generation over time_frame hours
    // time_frame is in hours and is the number of hours to find yen for.
    // Oversimplified. I think this tries to account for the increase of yen/h over time as seeding duration increases
    // when displaying yen/week.
    //var f_interest = 24 * days_per_year / time_frame * (Math.pow(2, time_frame / (24 * days_per_year)) - 1) / Math.log(2);
    var f_interest = 1;


    // The duration factor for yen generation
    // seeding duration is only available on the "Seeding Torrents" page. Assumes 0 on any other.
    // duration is in hours.
    function f_duration(duration) {
        // user_age in hours
        var user_age = ((new Date()).getTime() - parseInt(GM_getValue('creation', '0'), 10)) / 1000 / 60 / 60;
        _debug && console.log('age: ' + user_age);
        _debug && console.log('duration: ' + duration);
        // number of years + 2
        // 2018-04-11 - caps duration bonus to user age
        return Math.min(duration, user_age) / (24 * days_per_year) + 2;
    }
    // The size factor for yen
    // Size is in GB
    function f_size(size) {
        // max function handles the size < 10MB condition
        return Math.max(0.1, Math.sqrt(size)) / 4;
    }
    // The seeders factor for yen generation
    // Reciprocal of the wiki article's formula to allow calculation of % increase.
    function f_seeders(seeders) {
        if (seeders > 3) {
            return 3 / Math.sqrt(seeders + 4);
        } else {
            return 2;
        }
    }
    // The age factor for yen generation
    // 'creation' is milliseconds. 1728000000 is 20 days in ms.
    // Calculates how old the account is, then divides that by 20 days (in ms).
    // Logistics function starting at 2 then declining to approach 1 over time.
    var f_age = 2 - 1 / (1 + Math.exp(5 - ((new Date()).getTime() - parseInt(GM_getValue('creation', '0'), 10)) / 1728000000));
    if (isNaN(f_age)) {
        f_age = 1;
    }

    // Compound function for yen generation
    function f(size, seeders, duration) {
        //console.log("size: " + size + " seed: " + seeders + " dur: " + duration + " f_age: " + f_age + " time_f: " + time_frame + " int: " + f_interest);
        //console.log(GM_getValue('creation', '0'));
        return f_size(size) * f_seeders(seeders) * f_duration(duration) * f_age * time_frame * f_interest;
    }
    // Creates title when hovering over yen generation to break down factors
    function yen_generation_title(size, seeders, duration) {
        var title = 'Click to toggle between Yen per ' + time_frame_string + '\nand Yen per ' + time_frame_string + ' per GB of size.\n\n';

        // Added f_duration(0) and f_seeders(1) to account for 2017 yen changes.
        // The changes altered the initial values of these and hence altered the 'base' yen/h here.
        title += '¥' + (f_seeders(1) * f_duration(0) * time_frame * f_size(size)).toPrecision(6) + ' \tbase for size';
        var temp = (100 * (f_interest - 1)).toFixed(1);
        if (temp !== '0.0') {
            title += '\n+' + temp + '% \tfor interest per ' + time_frame_string;
        }
        temp = (100 * (f_age - 1)).toFixed(1);
        if (temp !== '0.0') {
            title += '\n+' + temp + '% \tfor your account\'s age';
        }
        // added divide by f_duration(0) to get accurate % change from initial
        temp = (100 * (f_duration(duration) / f_duration(0) - 1)).toFixed(1);
        if (temp !== '0.0') {
            title += '\n+' + temp + '% \tfor your seeding time';
        }
        // added divide by f_seeders(1) to get accurate % change from initial
        temp = (100 * (f_seeders(seeders) / f_seeders(1) - 1)).toFixed(1);
        if (temp !== '0.0') {
            title += '\n' + temp + '% \tfor the number of seeders';
        }
        title += '\n\n¥ per ' + time_frame_string + ' \t¥ per ' + time_frame_string + ' per GB\t#seeders\n';
        var start = Math.max(seeders - 1, 3);
        var end = Math.max(seeders + 1, 3);

        // edited to <= 3, 2017.
        for (var i = start; i <= end; i++) {
            title += '¥' + f(size, i, duration).toPrecision(6) + '  \t';
            title += '¥' + (f(size, i, duration) / size).toPrecision(6) + ' \t\t';
            if (i === 3) {
                title += '≤';
            }
            title += i;
            if (i !== end) {
                title += '\n';
            }
        }
        return title;
    }
    // Toggle yen generation per time and per time and size
    var yen_per_GB = false;
    function toggle_yen(toggle) {
        if (toggle === void 0) { toggle = true; }
        return function () {
            if (toggle) {
                yen_per_GB = yen_per_GB !== true;
            }
            var cells = document.querySelectorAll('th.UserScriptToggleYenPerGB,td.UserScriptToggleYenPerGB');
            for (var i = 0, length = cells.length; i < length; i++) {
                var cell = cells[i];
                if (yen_per_GB) {
                    cell.style.display = '';
                }
                else {
                    cell.style.display = 'none';
                }
            }
            cells = document.querySelectorAll('th.UserScriptToggleYen,td.UserScriptToggleYen');
            for (var i = 0, length = cells.length; i < length; i++) {
                var cell = cells[i];
                if (yen_per_GB) {
                    cell.style.display = 'none';
                }
                else {
                    cell.style.display = '';
                }
            }
        };
    }
    // Parses a single HTMLElement's textContent using regular expressions
    function parse_cell(cell) {
        var text_content = cell.textContent.trim();
        var text_content_no_comma = text_content.replace(/,/g, '').trim();
        var image = cell.querySelector('img');
        if (cell.textContent === '' && (image !== null)) {
            return image.alt.toUpperCase();
        }
        var match = text_content_no_comma.match(size_RegExp);
        if (match !== null) {
            return parseFloat(match[1]) * unit_prefix(match[2]);
        }
        match = text_content_no_comma.match(datetime_RegExp);
        if (match !== null) {
            return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), parseInt(match[4], 10), parseInt(match[5], 10));
        }
        match = text_content_no_comma.replace(and_RegExp, '').match(duration_RegExp);
        if (match !== null) {
            var durations = [];
            // Starting at 1, because 0 is full string
            for (var i = 1, length = match.length; i < length; i++) {
                var num = match[i];
                if (num !== undefined) {
                    durations.push(parseInt(num, 10));
                }
                else {
                    durations.push(0);
                }
            }
            // Calculates number of days inside the brackets, then times by 24.
            // Returns hours.
            //     24 * (years                            months                               wweeks            days      ) + hours           minutes               seconds
            return 24 * (durations[0] * days_per_year + durations[1] * days_per_year / 12 + durations[2] * 7 + durations[3]) + durations[4] + durations[5] / 60 + durations[6] / 3600;
        }
        match = text_content_no_comma.match(currency_RegExp);
        if (match !== null) {
            return parseFloat(match[1]);
        }
        match = text_content_no_comma.match(ratio_RegExp);
        if (match !== null) {
            switch (match[1]) {
                case '∞':
                    return Infinity;
                case '--':
                    return -0.2;
                case '0':
                    return -0.1;
                default:
                    return parseFloat(match[1]);
            }
        }
        if (/^Never(\s*\([^)]*\)\s*)*$/i.test(text_content_no_comma)) {
            return 0;
        }
        else {
            return text_content.toUpperCase();
        }
    }
    // Processes a row and parses its cells' contents
    function parse_row(row, size_index, seeders_index, duration_index, hr_index) {
        var size_cell = get_cell(row, size_index);
        var seeders_cell = get_cell(row, seeders_index);
        var duration_cell = get_cell(row, duration_index);
        var size = (size_index !== null && size_cell !== null) ? parse_cell(size_cell) : 1;
        var seeders = (seeders_index !== null && seeders_cell !== null) ? parse_cell(seeders_cell) : 6;
        var duration = (duration_index !== null && duration_cell !== null) ? parse_cell(duration_cell) : 0;
        var torrent_row = get_corresponding_torrent_row(row);
        // Add required time to size_cell and blockquote in torrent_row
        if (size_index !== null && show_required_time) {
            var seeding_time = Math.max(0, size - 10) * 5 + 72;
            size_cell.title = 'You need to seed this torrent for at least\n' + duration_to_string(seeding_time) + '\nor it will become a hit and run!';
            if (torrent_row !== null) {
                var block_quote = torrent_row.querySelector('blockquote');
                if (block_quote !== null) {
                    block_quote.appendChild(document.createElement('br'));
                    block_quote.innerHTML += 'You need to seed this torrent for at least <span class="r01">' + duration_to_string(seeding_time) + '</span> or it will become a hit and run!';
                }
            }
        }
        // Add yen generation to row
        if (size_index !== null && seeders_index !== null && show_yen) {
            _debug && console.log('adding yen to row: ' + row.innerHTML);
            var title = yen_generation_title(size, seeders, duration);
            var td1 = document.createElement('td');
            td1.textContent = '¥' + yen_to_string(f(size, seeders, duration));
            td1.title = title;
            td1.className = 'UserScriptToggleYen';
            var td2 = document.createElement('td');
            td2.textContent = '¥' + yen_to_string(f(size, seeders, duration) / size);
            td2.title = title;
            td2.className = 'UserScriptToggleYenPerGB';
            td2.style.display = 'none';
            td1.addEventListener('click', toggle_yen());
            td2.addEventListener('click', toggle_yen());
            row.appendChild(td2);
            row.appendChild(td1);
        }
        // Parse row data
        var row_data = [row, torrent_row];
        if (sort_rows) {
            var cells = row.cells;
            for (var i = 0, length = cells.length; i < length; i++) {
                var cell = cells[i];
                row_data.push(parse_cell(cell));
                if (cell.colSpan > 1) {
                    for (var j = 2; j <= cell.colSpan; j++) {
                        row_data.push(null);
                    }
                }
            }
        }
        // Replace H&R row content by remaining seed time if available in duration row
        if (hr_index !== null && duration_index !== null) {
            var cell = get_cell(row, duration_index);
            var match = cell.textContent.replace(/^[^(]*(\(|$)/, '').replace(/\s*left\s*\)[^)]*$/, '').replace(and_RegExp, '').match(duration_RegExp);
            var remaining = 0.0.toFixed(4);
            if (match !== null) {
                var durations = [];
                // Starting at 1 because 0 is full matched string
                for (var i = 1, length = match.length; i < length; i++) {
                    var num = match[i];
                    if (num !== undefined) {
                        durations.push(parseInt(num, 10));
                    }
                    else {
                        durations.push(0);
                    }
                }
                remaining = (24 * (durations[0] * days_per_year + durations[1] * days_per_year / 12 + durations[2] * 7 + durations[3]) + durations[4] + durations[5] / 60 + durations[6] / 3600).toFixed(4);
            }
            while (remaining.length < 16) {
                remaining = '0' + remaining;
            }
            row_data[hr_index + 2] = remaining + row_data[hr_index + 2];
        }
        return row_data;
    }
    // Processes a table and parses its rows' contents
    function parse_table(table) {
        var size_index = null;
        var seeders_index = null;
        var duration_index = null;
        var hr_index = null;
        var headers = table.querySelector('tr');
        var cells = headers.cells;
        var column = 0;
        for (var i = 0, length = cells.length; i < length; i++) {
            var cell = cells[i];
            //console.log(cell);

            // Get rid of non-breakable spaces -.-
            var text_content = cell.textContent.replace(/\u00a0/g, ' ').trim().toLowerCase();
            var title = cell.title.trim().toLowerCase();
            //console.log(title);
            if (size_index === null && (text_content === 'size' || title === 'size' || cell.querySelector('*[title="Size"]') !== null)) {
                size_index = column;
            }
            if (seeders_index === null && (title === 'seeders' || cell.querySelector('*[title="Seeders"]') !== null)) {
                seeders_index = column;
            }
            if (duration_index === null && (text_content === 'seeding time' || text_content === 'seed time')) {
                duration_index = column;
            }
            if (hr_index === null && text_content === 'h&r') {
                hr_index = column;
            }
            column += cell.colSpan;
        }
        if (size_index !== null && seeders_index !== null && show_yen) {
            var td1 = document.createElement(headers.cells[0].nodeName);
            td1.textContent = '¥/' + time_frame_string.charAt(0);
            td1.title = '¥ per ' + time_frame_string;
            td1.className = 'UserScriptToggleYen';
            var td2 = document.createElement(headers.cells[0].nodeName);
            td2.textContent = '¥/' + time_frame_string.charAt(0) + '/GB';
            td2.title = '¥ per ' + time_frame_string + ' per GB';
            td2.className = 'UserScriptToggleYenPerGB';
            td2.style.display = 'none';
            td1.addEventListener('click', toggle_yen());
            td2.addEventListener('click', toggle_yen());
            headers.appendChild(td2);
            headers.appendChild(td1);
            // Increase colSpan of non-torrent rows in the table
            var non_torrents = table.querySelectorAll('tr.edition_info,tr.pad,tr[id^="group_"]');
            for (var i = 0, length = non_torrents.length; i < length; i++) {
                var non_torrent = non_torrents[i];
                var cells_1 = non_torrent.cells;
                var last_cell = cells_1[cells_1.length - 1];
                last_cell.colSpan += 1;
            }
        }
        // Parse table data
        var table_data = [];
        var real_torrents = table.querySelectorAll('tr.torrent,tr.group_torrent');
        for (var i = 0, length = real_torrents.length; i < length; i++) {
            var row = real_torrents[i];
            table_data.push(parse_row(row, size_index, seeders_index, duration_index, hr_index));
        }
        // Sorting...
        var table_body = table_data[0][0].parentNode;
        var sort_index = null;
        var sort_descending = true;
        function sort_function(index) {
            return function (a, b) {
                if ((a[index + 2] !== null) && (b[index + 2] !== null)) {
                    if (a[index + 2] > b[index + 2]) {
                        return -1;
                    }
                    else if (a[index + 2] < b[index + 2]) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                }
                else if ((a[index + 2] !== null) && (b[index + 2] === null)) {
                    return -1;
                }
                else if ((b[index + 2] !== null) && (a[index + 2] === null)) {
                    return 1;
                }
                else {
                    return 0;
                }
            };
        }
        function sort_by_index(index, toggle) {
            if (toggle === void 0) { toggle = true; }
            return function (event) {
                if (event !== null) {
                    event.stopPropagation();
                    event.preventDefault();
                }
                if (index !== null) {
                    if (sort_index === index && toggle) {
                        sort_descending = sort_descending !== true;
                        table_data.reverse();
                    }
                    else {
                        if (toggle) {
                            sort_descending = true;
                        }
                        sort_index = index;
                        table_data.sort(sort_function(index));
                        if (!sort_descending) {
                            table_data.reverse();
                        }
                    }
                }
                for (var i = 0, length = table_data.length; i < length; i++) {
                    var row = table_data[i];
                    var next_separator_element = get_next_separator_element_sibling(row[0]);
                    if (next_separator_element !== null) {
                        table_body.insertBefore(row[0], next_separator_element);
                        if (row[1] !== null) {
                            table_body.insertBefore(row[1], next_separator_element);
                        }
                    }
                    else {
                        table_body.appendChild(row[0]);
                        if (row[1] !== null && row[0] !== row[1]) {
                            table_body.appendChild(row[1]);
                        }
                    }
                }
            };
        }
        if (sort_rows && table_data.length > 1) {
            // Add * to headers which will trigger sort
            for (var i = 0, length = cells.length; i < length; i++) {
                var cell = cells[i];
                var index = get_column(headers, cell);
                var a = document.createElement('a');
                a.href = '#';
                a.textContent = '*';
                a.addEventListener('click', sort_by_index(index));
                cell.appendChild(a);
            }
        }
        if (dynamic_load) {
            var current_page_match = document.URL.match(/page=(\d+)/i);
            var current_page = current_page_match != null ? parseInt(current_page_match[1], 10) : 1;
            var previous_page = current_page - 1;
            var next_page = current_page + 1;
            var last_page = Infinity;
            var pagenums = [];
            if (table.previousElementSibling !== null) {
                var pagenum = table.previousElementSibling.querySelector('div.pagenums');
                if (pagenum !== null) {
                    pagenums.push(pagenum);
                }
            }
            if (table.nextElementSibling !== null) {
                var pagenum = table.nextElementSibling.querySelector('div.pagenums');
                if (pagenum !== null) {
                    pagenums.push(pagenum);
                }
            }
            var previous_anchors = [];
            var next_anchors = [];
            // Loads the previous or next page into tableData, triggered by MouseEvent
            function load_history_page(prev) {
                if (prev === void 0) { prev = false; }
                return function (event) {
                    if (event !== null) {
                        event.stopPropagation();
                        event.preventDefault();
                    }
                    var new_page = prev ? previous_page-- : next_page++;
                    if (new_page < 1 || new_page > last_page) {
                        return;
                    }
                    // Remove links to dynamically load more pages if we've reached the end
                    if (new_page === 1) {
                        for (var i = 0, length = previous_anchors.length; i < length; i++) {
                            var pagenum = previous_anchors[i];
                            pagenum.parentNode.removeChild(pagenum);
                        }
                    }
                    if (new_page === last_page) {
                        for (var i = 0, length = next_anchors.length; i < length; i++) {
                            var pagenum = next_anchors[i];
                            pagenum.parentNode.removeChild(pagenum);
                        }
                    }
                    var url = document.URL.split('#')[0];
                    if (url.indexOf('page=') >= 0) {
                        url = url.replace(/page=(\d+)/i, 'page=' + new_page);
                    }
                    else {
                        url = url + '&page=' + new_page;
                    }
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.send();
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            var parser = new DOMParser();
                            var new_document = parser.parseFromString(xhr.responseText, 'text/html');
                            var new_torrents = new_document.querySelectorAll('tr.torrent,tr.group_torrent');
                            for (var i = 0, length = new_torrents.length; i < length; i++) {
                                var new_torrent = new_torrents[i];
                                table_data.push(parse_row(new_torrent, size_index, seeders_index, duration_index, hr_index));
                            }
                            sort_by_index(sort_index, false)(null);
                            toggle_yen(false)();
                        }
                    };
                };
            }
            for (var i = 0, length = pagenums.length; i < length; i++) {
                var pagenum = pagenums[i];
                // Figure out what the last page is
                var last_child = pagenum.lastElementChild;
                if (last_child !== null && last_child.href !== null) {
                    var lastPageMatch = last_child.href.match(/page=(\d+)/i);
                    last_page = lastPageMatch !== null ? parseInt(lastPageMatch[1], 10) : 1;
                }
                else {
                    last_page = parseInt(last_child.textContent.trim(), 10);
                    if (isNaN(last_page)) {
                        last_page = 1;
                    }
                }
                var clone = pagenum.parentNode.cloneNode(true);
                var new_pagenum = clone.querySelector('div.pagenums');
                while (new_pagenum.hasChildNodes()) {
                    new_pagenum.removeChild(new_pagenum.lastChild);
                }
                // Add buttons to dynamically load previous or next page
                if (current_page > 1) {
                    var a = document.createElement('a');
                    a.href = '#';
                    a.className = 'next-prev';
                    a.textContent = '← Load previous page dynamically';
                    a.addEventListener('click', load_history_page(true), true);
                    new_pagenum.appendChild(a);
                    previous_anchors.push(a);
                }
                if (current_page < last_page) {
                    var a = document.createElement('a');
                    a.href = '#';
                    a.className = 'next-prev';
                    a.textContent = 'Load next page dynamically →';
                    a.addEventListener('click', load_history_page(false), true);
                    new_pagenum.appendChild(a);
                    next_anchors.push(a);
                }
                // Insert new pagenum after old pagenum
                pagenum.parentNode.parentNode.insertBefore(clone, pagenum.parentNode.nextSibling);
            }
        }
        // Function to filter torrent tables with deselected tags
        function filter_torrent_table(filter_body) {
            // Calculate deselected tags on demand
            var deselected = {};
            if (filter_body.hasChildNodes()) {
                var checkboxes = filter_body.firstElementChild.querySelectorAll('input[type="checkbox"]');
                for (var i = 0, length = checkboxes.length; i < length; i++) {
                    var checkbox = checkboxes[i];
                    if (!checkbox.checked) {
                        deselected[checkbox.value] = true;
                    }
                }
            }
            // Create new form
            var new_form = document.createElement('form');
            // value = 0: all hidden, value = 1: at least one visible
            var available_tags = {};
            var values_by_column = [];
            // Check if there are both options for these binary traits, and if so display, else ignore
            var dual_audio = 0;
            var freeleech = 0;
            var remastered = 0;
            for (var i = 0, length = real_torrents.length; i < length; i++) {
                var torrent = real_torrents[i];
                var is_freeleech = /freeleech/.test(torrent.className) || torrent.querySelector('img[alt="Freeleech!"]') !== null;
                var is_remastered = torrent.querySelector('img[alt="Remastered"]') !== null;
                var is_dual_audio = /Dual Audio/.test(torrent.cells[0].lastElementChild.textContent);
                dual_audio |= is_dual_audio ? 1 : 2;
                freeleech |= is_freeleech ? 1 : 2;
                remastered |= is_remastered ? 1 : 2;
            }
            for (var i = 0, length = real_torrents.length; i < length; i++) {
                var torrent = real_torrents[i];
                var corresponding = get_corresponding_torrent_row(torrent);
                var is_freeleech = /freeleech/.test(torrent.className) || torrent.querySelector('img[alt="Freeleech!"]') !== null;
                var is_remastered = torrent.querySelector('img[alt="Remastered"]') !== null;
                // Check for deselected tags in cleaned textContent of first cell
                var text = torrent.cells[0].lastElementChild.textContent;
                var is_dual_audio = /Dual Audio/i.test(text);
                // Remove » from beginning, format, Dual Audio, end empty tags (images, will handle them separately down below)
                text = text.replace(/^\s*»/i, '').replace(/\d+:\d+/g, '').replace(/Dual Audio/ig, '').replace(/\|(\s*\|)+/g, '|').replace(/^\s*\|/, '').replace(/\|\s*$/, '');
                // Split text content to get tags
                var torrent_tags = (text.indexOf('|') >= 0 ? text.split('|') : text.split('/')).map(function (e) { return e.trim(); });
                // Add Dual Audio, Freeleech, and Remastered status, only if torrents with yes and no are available
                if (dual_audio === 3) {
                    torrent_tags.push(is_dual_audio ? 'Dual Audio' : 'No Dual Audio');
                }
                if (freeleech === 3) {
                    torrent_tags.push(is_freeleech ? 'Freeleech' : 'No Freeleech');
                }
                if (remastered === 3) {
                    torrent_tags.push(is_remastered ? 'Remastered' : 'Not Remastered');
                }
                // Keep track of tags and whether this element needs to be hidden
                var to_be_collapsed = false;
                for (var j = 0; j < torrent_tags.length; j++) {
                    var tag = torrent_tags[j];
                    if (deselected.hasOwnProperty(tag)) {
                        to_be_collapsed = true;
                        break;
                    }
                }
                for (var j = 0; j < torrent_tags.length; j++) {
                    var tag = torrent_tags[j];
                    // Fucking ISOs...
                    if (tag.indexOf('ISO') === 0) {
                        torrent_tags.splice(j + 1, 0, '');
                    }
                    if (tag !== '') {
                        if (!available_tags.hasOwnProperty(tag)) {
                            available_tags[tag] = 0;
                        }
                        if (!to_be_collapsed) {
                            available_tags[tag] = 1;
                        }
                        while (values_by_column.length <= j) {
                            values_by_column.push({});
                        }
                        if (!values_by_column[j].hasOwnProperty(tag)) {
                            values_by_column[j][tag] = 1;
                        }
                    }
                }
                // Hide or show torrent row and corresponding row if deselected tags are found
                if (to_be_collapsed) {
                    torrent.style.display = 'none';
                    if (corresponding !== null) {
                        corresponding.style.display = 'none';
                    }
                }
                else {
                    torrent.style.display = '';
                    if (corresponding !== null) {
                        corresponding.style.display = '';
                    }
                }
            }
            // If we found any tags or anything is deselected, create filter box
            if (values_by_column.length > 0 || Object.keys(deselected).length > 0) {
                // Only show each tag once, even across multiple columns, so keep track
                var shown_values = {};
                for (var i = 0, length = values_by_column.length; i < length; i++) {
                    var index = values_by_column[i];
                    var sorted_tags = Object.keys(index).sort(function (a, b) {
                        if (a.toUpperCase() > b.toUpperCase())
                            return 1;
                        else
                            return -1;
                    });
                    for (var j = 0, len = sorted_tags.length; j < len; j++) {
                        var tag = sorted_tags[j];
                        if (shown_values.hasOwnProperty(tag)) {
                            // Skip values we have already shown
                            continue;
                        }
                        else {
                            shown_values[tag] = 1;
                        }
                        var label = document.createElement('label');
                        label.innerHTML = '<input type="checkbox" ' + (deselected[tag] != null ? '' : 'checked="checked"') + '> ' + tag;
                        var input = label.querySelector('input');
                        input.value = tag;
                        label.style.marginRight = '1em';
                        label.style.display = 'inline-block';
                        // No visible torrents have this property, but it's also not deselected
                        if (available_tags[tag] === 0 && !deselected.hasOwnProperty(tag)) {
                            label.style.opacity = '0.25';
                        }
                        // Only one option, grey it out slightly
                        if (sorted_tags.length <= 1) {
                            label.style.opacity = '0.5';
                        }
                        new_form.appendChild(label);
                    }
                    new_form.appendChild(document.createElement('hr'));
                }
                // Remove excessive hr at end (where do they come from?)
                while (new_form.lastElementChild.tagName === 'HR') {
                    new_form.removeChild(new_form.lastChild);
                }
                // With every change (all changes are checkbox changes), update deselected and filter anew
                new_form.addEventListener('change', function (e) {
                    filter_torrent_table(filter_body);
                });
                // Replace old_form with new_form
                if (filter_body.hasChildNodes()) {
                    filter_body.replaceChild(new_form, filter_body.firstElementChild);
                }
                else {
                    filter_body.appendChild(new_form);
                }
            }
        }
        if (filter_torrents && real_torrents.length > 1) {
            var box = document.createElement('div');
            var head = document.createElement('div');
            var body = document.createElement('div');
            box.className = 'box torrent_filter_box';
            head.className = 'head colhead strong';
            body.className = 'body pad';
            body.style.display = 'none';
            head.innerHTML = '<a href="#"><span class="triangle-right-md"><span class="stext">+/-</span></span> Filter </a>';
            // Show or hide filter box
            function head_click_event(e) {
                if (e !== null) {
                    e.stopPropagation();
                    e.preventDefault();
                }
                var span = head.querySelector('span');
                if (body.style.display !== 'none') {
                    body.style.display = 'none';
                    span.className = 'triangle-right-md';
                }
                else {
                    filter_torrent_table(body);
                    body.style.display = '';
                    span.className = 'triangle-down-md';
                }
            }
            head.addEventListener('click', head_click_event);
            box.appendChild(head);
            box.appendChild(body);
            table.parentNode.insertBefore(box, table);
        }
    }
    // Process and parse all tables
    if (show_yen || show_required_time || sort_rows || dynamic_load || filter_torrents) {
        var all_torrent_tables = document.querySelectorAll('table.torrent_table,table.torrent_group');
        for (var i = 0, length = all_torrent_tables.length; i < length; i++) {
            var table = all_torrent_tables[i];
            parse_table(table);
        }
    }

    // If yen should be shown and user creation is not yet saved, try to get and save it
    if (show_yen && (GM_getValue('creation', '0').toString() === '0' || GM_getValue('creation', '0') === 'null')) {


        // no longer works because header profile link uses username.
        //var user_id = document.querySelector('div#header div#userinfo li#username_menu a.username');

        // checks if the current page's URL matches the profile page
        // of the logged in user.
        // var user_id_re = new RegExp('/user\\.php\\?id=' + CURRENT_USER["userId"]);
        //console.log(CURRENT_USER["userId"]);
        //console.log();
        //if (document.URL.match(user_id_re) !== null) {

        // ^ broken on some browsers if CURRENT_USER isn't passed.

        // checks if the username link in navbar is the same as the current heading.
        // if it is, we are on a profile page.
        // hopefully no edge cases
        // - TFM 2017-12-28
        var user_link = document.querySelector('div#header div#userinfo li#username_menu a.username');
        var user_heading = document.querySelector('div#content h2 a');
        var user_profile_re = /\/user\.php\?id=/i;

        if (document.URL.match(user_profile_re) !== null && user_link !== null && user_heading !== null && user_link.href === user_heading.href) {

            var user_stats = document.querySelector('div#content div#user_rightcol div.userstatsleft dl.userprofile_list');
            var children = user_stats.children;
            //console.log(children);
            for (var i = 0, length = children.length; i < length; i++) {

                var child = children[i];
                //console.log(child);
                if (child.textContent.indexOf("Join") !== -1) {
                    try {
                        var join_date = child.nextElementSibling.firstElementChild.title;

                        // deletes timezone because it was causing issues with Date.parse()
                        // worst case is +/- 12 hours anyway
                        var timezone_re = /( \d\d:\d\d) [A-Z]+$/;
                        GM_setValue('creation', JSON.stringify(Date.parse(join_date.replace(timezone_re, '$1'))));
                    }
                    catch (error) { }
                }
            }
        }
    }
}).call(this);