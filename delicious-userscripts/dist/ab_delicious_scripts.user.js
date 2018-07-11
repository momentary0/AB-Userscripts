// ==UserScript==
// @name        AnimeBytes delicious user scripts (updated)
// @author      aldy, potatoe, alpha, Megure
// @version     2.1.0.0
// @description Userscripts to enhance AnimeBytes in various ways. (Updated by TheFallingMan)
// @match       https://*.animebytes.tv/*
// @icon        http://animebytes.tv/favicon.ico
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
// ==/UserScript==

(function AnimeBytesDeliciousUserScripts() {
    /* Begin ./src\ab_enhanced_torrent_view.user.js */
    // ==UserScript==
    // @name        Enhanced Torrent View
    // @namespace   Megure@AnimeBytes.tv
    // @description Shows how much yen you would receive if you seeded torrents; shows required seeding time; allows sorting and filtering of torrent tables; dynamic loading of transfer history tables
    // @include     http*://animebytes.tv*
    // @version     1.01
    // @grant       GM_getValue
    // @grant       GM_setValue
    // @icon        http://animebytes.tv/favicon.ico
    // @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
    // ==/UserScript==
    
    // Enhanced Torrent View by Megure
    // Shows how much yen you would receive if you seeded torrents; shows required seeding time; allows sorting and filtering of torrent tables; dynamic loading of transfer history tables
    (function EnhancedTorrentView() {
        var settingsKeys = ['ABTorrentsShowYen', 'ABTorrentsReqTime',
            'ABSortTorrents', 'ABTorrentsFilter', 'ABHistDynLoad'];
        for (let i = 0; i < settingsKeys.length; i++) {
            delicious.settings.init(settingsKeys[i], true);
        }
        delicious.settings.init('ABTorrentsYenTimeFrame', '24');
    
        if (delicious.settings.ensureSettingsInserted()) {
            var s = delicious.settings.createSection('Enhanced Torrent View');
            s.appendChild(delicious.settings.createCheckbox(
                'ABTorrentsShowYen',
                'Show yen generation',
                'Show yen generation for torrents, with detailed information when hovered.'
            ));
            s.appendChild(delicious.settings.createDropDown(
                'ABTorrentsYenTimeFrame',
                'Yen time frame',
                'Shows yen generated in this amount of time.',
                [['Hour', '1'],
                    ['Day', '24'],
                    ['Week', '168']],
                {default: '24'}
            ));
            s.appendChild(delicious.settings.createCheckbox(
                'ABTorrentsReqTime',
                'Show required seeding time',
                'Shows minimal required seeding time for torrents in their description and when size is hovered.'
            ));
            s.appendChild(delicious.settings.createCheckbox(
                'ABTorrentsFilter',
                'Filter torrents',
                'Shows a box above torrent tables, where you can filter the torrents from that table.'
            ));
            s.appendChild(delicious.settings.createCheckbox(
                'ABSortTorrents',
                'Sort torrents',
                'Allows torrent tables to be sorted.'
            ));
            s.appendChild(delicious.settings.createCheckbox(
                'ABHistDynLoad',
                'Dynamic history tables',
                'Dynamically load more pages into the transfer history page.'
            ));
            delicious.settings.insertSection(s);
        }
    
    
    
    
        var days_per_year = 365.256363;
        var show_yen = GM_getValue('ABTorrentsShowYen', 'true') === 'true';
        var show_required_time = GM_getValue('ABTorrentsReqTime', 'true') === 'true';
        var sort_rows = GM_getValue('ABSortTorrents', 'true') === 'true';
        var filter_torrents = GM_getValue('ABTorrentsFilter', 'true') === 'true';
        var dynamic_load = GM_getValue('ABHistDynLoad', 'true') === 'true';
        var time_frame = parseInt(delicious.settings.get('ABTorrentsYenTimeFrame', '24'), 10);
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
            // If prefix is undefined, the regex failed to match a prefix
            // and we assume it is in bytes.
            if (typeof prefix === 'undefined') return 1 / 1073741824;
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
    /* End ./src\ab_enhanced_torrent_view.user.js */


    /* Begin ./src\ab_fl_status.user.js */
    // ==UserScript==
    // @name        AB - Freeleech Pool Status
    // @author      Megure (inspired by Lemma, Alpha, NSC)
    // @description Shows current freeleech pool status in navbar with a pie-chart
    // @include     https://animebytes.tv/*
    // @version     0.1.1.1
    // @icon        http://animebytes.tv/favicon.ico
    // @grant       GM_getValue
    // @grant       GM_setValue
    // @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
    // ==/UserScript==
    
    // Freeleech Pool Status by Megure, inspired by Lemma, Alpha, NSC
    // Shows current freeleech pool status in navbar with a pie-chart
    // Updates only once every hour or when pool site is visited, showing a pie-chart on pool site
    (function ABFLStatus() {
        delicious.settings._migrateStringSetting('deliciousflpoolposition');
    
        if (delicious.settings.ensureSettingsInserted()) {
            var s = delicious.settings.createSection('Delicious Freeleech Pool');
            s.appendChild(delicious.settings.createCheckbox(
                'deliciousfreeleechpool',
                'Enable/Disable',
                'Shows current freeleech pool progress in the navbar and on user pages'
                + ' (updated once an hour or when freeleech pool site is visited).'));
            s.appendChild(delicious.settings.createDropDown(
                'deliciousflpoolposition',
                'Navbar Position',
                'Select position of freeleech pool progress in the navbar or disable it.',
                [['Before user info', 'before #userinfo_minor'],
                    ['After user info', 'after #userinfo_minor'],
                    ['Before menu', 'before .main-menu.nobullet'],
                    ['After menu', 'after .main-menu.nobullet'],
                    ['Don\'t display', 'none']],
                {default: 'after #userinfo_minor'}
            ));
            s.appendChild(delicious.settings.createCheckbox(
                'deliciousnavbarpiechart',
                'Freeleech Pie Chart',
                'Adds a dropdown with a pie chart to the freeleech pool progress in the navbar.'
            ));
            delicious.settings.insertSection(s);
        }
        delicious.settings.init('deliciousflpoolposition', 'after #userinfo_minor');
        delicious.settings.init('deliciousfreeleechpool', true);
        delicious.settings.init('deliciousnavbarpiechart', true);
        if (!delicious.settings.get('deliciousfreeleechpool'))
            return;
    
        function niceNumber(num) {
            var res = '';
            while (num >= 1000) {
                res = ',' + ('00' + (num % 1000)).slice(-3) + res;
                num = Math.floor(num / 1000);
            }
            return num + res;
        }
        var locked = false;
        function getFLInfo() {
            function parseFLInfo(elem) {
                var boxes = elem.querySelectorAll('#content .box.pad');
                //console.log(boxes);
                if (boxes.length < 3) return;
    
                // The first box holds the current amount, the max amount and the user's individual all-time contribution
                var match = boxes[0].textContent.match(/have ¥([0-9,]+) \/ ¥([0-9,]+)/i),
                    max = parseInt(GM_getValue('FLPoolMax', '50000000'), 10),
                    current = parseInt(GM_getValue('FLPoolCurrent', '0'), 10);
                if (match == null) {
                    // Updated 2018-02-23 according to oregano's suggestion
                    match = boxes[0].textContent.match(/You must wait for freeleech to be over before donating/i);
                    if (match != null) current = max;
                }
                else {
                    current = parseInt(match[1].replace(/,/g, ''), 10);
                    max = parseInt(match[2].replace(/,/g, ''), 10);
                }
                if (match != null) {
                    GM_setValue('FLPoolCurrent', current);
                    GM_setValue('FLPoolMax', max);
                }
                // Check first box for user's individual all-time contribution
                match = boxes[0].textContent.match(/you've donated ¥([0-9,]+)/i);
                if (match != null)
                    GM_setValue('FLPoolContribution', parseInt(match[1].replace(/,/g, ''), 10));
    
                // The third box holds the top 10 donators for the current box
                var box = boxes[2],
                    firstP = box.querySelector('p'),
                    tr = box.querySelector('table').querySelectorAll('tbody > tr');
    
                var titles = [], hrefs = [], amounts = [], colors = [], sum = 0;
                for (var i = 0; i < tr.length; i++) {
                    var el = tr[i],
                        td = el.querySelectorAll('td');
    
                    titles[i] = td[0].textContent;
                    hrefs[i] = td[0].querySelector('a').href;
                    amounts[i] = parseInt(td[1].textContent.replace(/[,¥]/g, ''), 10);
                    colors[i] = 'red';
                    sum += amounts[i];
                }
    
                // Updated 2018-02-23. Properly draw full pie when FL active.
                if (current === max && sum === 0) {
                    titles[0] = "Freeleech!";
                    hrefs[0] = 'https://animebytes.tv/konbini/pool';
                    amounts[0] = current;
                    colors[0] = 'red';
                    sum = current;
                }
                else {
                    // Also add others and missing to the arrays
                    // 2018-02-23 But only if FL isn't active.
                    next_index = titles.length;
                    titles[next_index] = 'Other';
                    hrefs[next_index] = 'https://animebytes.tv/konbini/pool';
                    amounts[next_index] = current - sum;
                    colors[next_index] = 'lightgrey';
    
                    titles[next_index + 1] = 'Missing';
                    hrefs[next_index + 1] = 'https://animebytes.tv/konbini/pool';
                    amounts[next_index + 1] = max - current;
                    colors[next_index + 1] = 'black';
                }
    
                GM_setValue('FLPoolLastUpdate', Date.now());
                GM_setValue('FLPoolTitles', JSON.stringify(titles));
                GM_setValue('FLPoolHrefs', JSON.stringify(hrefs));
                GM_setValue('FLPoolAmounts', JSON.stringify(amounts));
                GM_setValue('FLPoolColors', JSON.stringify(colors));
            }
    
            // Either parse document or retrieve freeleech pool site 60*60*1000 ms after last retrieval
            if (/konbini\/pool$/i.test(document.URL))
                parseFLInfo(document);
            else if (Date.now() - parseInt(GM_getValue('FLPoolLastUpdate', '0'), 10) > 3600000 && locked === false) {
                locked = true;
                // Fix suggested by https://animebytes.tv/user/profile/oregano
                // https://discourse.mozilla.org/t/webextension-xmlhttprequest-issues-no-cookies-or-referrer-solved/11224/18
                try {
                    var xhr = XPCNativeWrapper(new window.wrappedJSObject.XMLHttpRequest());
                } catch (exc) {
                    var xhr = new XMLHttpRequest();
                }
                parser = new DOMParser();
                xhr.open('GET', "https://animebytes.tv/konbini/pool", true);
                xhr.send();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        parseFLInfo(parser.parseFromString(xhr.responseText, 'text/html'));
                        updatePieChart();
                        locked = false;
                    }
                };
            }
        }
    
        function getPieChart() {
            function circlePart(diff, title, href, color) {
                if (diff == 0) return '';
                var x = Math.sin(phi), y = Math.cos(phi);
                phi -= 2 * Math.PI * diff / max;
                var v = Math.sin(phi), w = Math.cos(phi);
                var z = 0;
                if (2 * diff > max)
                    z = 1; // use long arc
                var perc = (100 * diff / max).toFixed(1) + '%\n' + niceNumber(diff) + ' ¥';
    
                // 2018-02-23 Hardcoded since rounding errors were making the pie a thin strip when it was a single
                // slice at 100%.
                if (diff === max) {
                    /*v = -6.283185273215512e-8;
                    w = -0.999999999999998;
                    z = 1;
                    x = 1.2246467991473532e-16;
                    y = -1;*/
                    v = -0.000001;
                    w = -1;
                    z = 1;
                    x = 0;
                    y = -1;
    
                }
                return '<a xlink:href="' + href + '" xlink:title="' + title + '\n' + perc + '"><path title="' + title + '\n' + perc +
                    '" stroke-width="0.01" stroke="grey" fill="' + color + '" d="M0,0 L' + v + ',' + w + ' A1,1 0 ' + z + ',0 ' + x + ',' + y + 'z">\n' +
    
                    '<animate begin="mouseover" attributeName="d" to="M0,0 L' + 1.1 * v + ',' + 1.1 * w + ' A1.1,1.1 0 ' + z + ',0 ' + 1.1 * x + ',' + 1.1 * y + 'z" dur="0.3s" fill="freeze" />\n' +
                    '<animate begin="mouseout"  attributeName="d" to="M0,0 L' + v + ',' + w + ' A1,1 0 ' + z + ',0 ' + x + ',' + y + 'z" dur="0.3s" fill="freeze" />\n' +
                    '</path></a>\n\n';
            }
    
            var str = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="-1.11 -1.11 2.22 2.22" height="200px" width="100%">' +
                '<title>Most Donated To This Box Pie-Chart</title>';
            try {
                var phi = Math.PI, max = parseInt(GM_getValue('FLPoolMax', '50000000'), 10),
                    titles = JSON.parse(GM_getValue('FLPoolTitles', '[]')),
                    hrefs = JSON.parse(GM_getValue('FLPoolHrefs', '[]')),
                    amounts = JSON.parse(GM_getValue('FLPoolAmounts', '[]')),
                    colors = JSON.parse(GM_getValue('FLPoolColors', '[]'));
                for (var i = 0; i < titles.length; i++) {
                    str += circlePart(amounts[i], titles[i], hrefs[i], colors[i]);
                }
            } catch (e) { }
            return str + '</svg>';
        }
    
        function updatePieChart() {
            var pieChart = getPieChart();
            p.innerHTML = pieChart;
            p3.innerHTML = pieChart;
            if (delicious.settings.get('delicousnavbarpiechart')) {
                li.innerHTML = pieChart;
            }
            p2.innerHTML = 'There is currently ' + niceNumber(parseInt(GM_getValue('FLPoolCurrent', '0'), 10)) + ' / ' + niceNumber(parseInt(GM_getValue('FLPoolMax', '50000000'), 10)) + ' yen in the donation box.<br/>';
            p2.innerHTML += '(That means we are ' + niceNumber(parseInt(GM_getValue('FLPoolMax', '50000000'), 10) - parseInt(GM_getValue('FLPoolCurrent', '0'), 10)) + ' yen away from getting sitewide freeleech!)<br/>';
            p2.innerHTML += 'In total, you\'ve donated ' + niceNumber(parseInt(GM_getValue('FLPoolContribution', '0'), 10)) + ' yen to the freeleech pool.<br/>';
            p2.innerHTML += 'Last updated ' + Math.round((Date.now() - parseInt(GM_getValue('FLPoolLastUpdate', Date.now()), 10)) / 60000) + ' minutes ago.';
            a.textContent = 'FL: ' + (100 * parseInt(GM_getValue('FLPoolCurrent', '0'), 10) / parseInt(GM_getValue('FLPoolMax', '50000000'), 10)).toFixed(1) + '%';
            nav.replaceChild(a, nav.firstChild);
        }
    
        var pos = delicious.settings.get('deliciousflpoolposition');
    
        if (pos !== 'none' || /user\.php\?id=/i.test(document.URL) || /konbini\/pool/i.test(document.URL)) {
            var p = document.createElement('p'),
                p2 = document.createElement('center'),
                p3 = document.createElement('p'),
                nav = document.createElement('li'),
                a = document.createElement('a'),
                ul = document.createElement('ul'),
                li = document.createElement('li');
            a.href = '/konbini/pool';
            nav.appendChild(a);
            if (delicious.settings.get('deliciousnavbarpiechart')) {
                var outerSpan = document.createElement('span');
                outerSpan.className += "dropit hover clickmenu";
                outerSpan.addEventListener('click', delicious.utilities.toggleSubnav);
                outerSpan.innerHTML += '<span class="stext">▼</span>';
    
                // nav is the li.navmenu
                nav.appendChild(outerSpan);
    
                // this ul contains the pie (somehow)
                ul.appendChild(li);
                ul.className = 'subnav nobullet';
                ul.style.display = 'none';
                nav.appendChild(ul);
                nav.className = 'navmenu';
                nav.id = "fl_menu";
            }
            if (pos !== 'none') {
                pos = pos.split(' ');
                var parent = document.querySelector(pos[1]);
                if (parent !== null) {
                    getFLInfo();
                    if (pos[0] === 'after')
                        parent.appendChild(nav);
                    if (pos[0] === 'before')
                        parent.insertBefore(nav, parent.firstChild);
                }
            }
    
            updatePieChart();
    
            if (/user\.php\?id=/i.test(document.URL)) {
                var userstats = document.querySelector('#user_rightcol > .box');
                if (userstats != null) {
                    var tw = document.createTreeWalker(userstats, NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /Yen per day/i.test(node.data); } });
                    if (tw.nextNode() != null) {
                        getFLInfo();
                        var cNode = document.querySelector('.userstatsleft');
                        var hr = document.createElement('hr');
                        hr.style.clear = 'both';
                        cNode.insertBefore(hr, cNode.lastElementChild);
                        cNode.insertBefore(p2, cNode.lastElementChild);
                        cNode.insertBefore(p3, cNode.lastElementChild);
                    }
                }
            }
    
            if (/konbini\/pool/i.test(document.URL)) {
                var tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^\s*Most Donated to This Box\s*$/i.test(node.data); } });
                if (tw.nextNode() !== null) {
                    tw.currentNode.parentNode.insertBefore(p, tw.currentNode.nextSibling);
                }
            }
        }
    })();
    /* End ./src\ab_fl_status.user.js */


    /* Begin ./src\ab_forum_search_enhancement.user.js */
    // ==UserScript==
    // @name        AnimeBytes - Forum Search - Enhancement
    // @namespace   Megure@AnimeBytes.tv
    // @description Load posts into search results; highlight search terms; filter authors; slide through posts
    // @include     http*://animebytes.tv/forums.php*
    // @exclude     *action=viewthread*
    // @version     0.72.1
    // @grant       GM_getValue
    // @grant       GM_setValue
    // @icon        http://animebytes.tv/favicon.ico
    // @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
    // ==/UserScript==
    
    //import '../delicious-library/src/ab_delicious_library'
    
    (function ForumSearchEnhancement() {
        delicious.settings.init('ABForumSearchWorkInFS', true);
        delicious.settings.init('ABForumSearchWorkInRest', true);
    
        var textSettings = ['ABForumSearchHighlightBG', 'ABForumSearchHighlightFG',
            'ABForumLoadText', 'ABForumLoadingText', 'ABForumToggleText'];
        for (var j = 0; j < textSettings.length; j++) {
            delicious.settings._migrateStringSetting(textSettings[j]);
        }
    
        if (delicious.settings.get('ABForumSearchHighlightBG') === 'none')
            delicious.settings.set('ABForumSearchHighlightBG', null);
        if (delicious.settings.get('ABForumSearchHighlightFG') === 'none')
            delicious.settings.set('ABForumSearchHighlightFG', null);
    
        if (delicious.settings.ensureSettingsInserted()) {
            var s = delicious.settings.createSection('Forum Search Enhancements');
            s.appendChild(delicious.settings.createCheckbox(
                'ABForumSearchWorkInFS',
                'Load posts into search results',
                'Allows you to load posts and threads into search results, slide through posts and filter for authors.'
            ));
    
            s.appendChild(delicious.settings.createColourSetting('ABForumSearchHighlightBG',
                'Color for search terms', 'Background color for search terms within posts and headers.',
                {default: '#FFC000'}));
            s.appendChild(delicious.settings.createColourSetting('ABForumSearchHighlightFG',
                'Color for search terms', 'Text color for search terms within posts and headers.',
                {default: '#000000'}));
    
            s.appendChild(delicious.settings.createCheckbox('ABForumEnhWorkInRest',
                'Load posts into forum view', 'Allows you to load posts and threads into the general forum view.',
                {default: false}));
            s.appendChild(delicious.settings.createTextSetting('ABForumLoadText',
                'Text for links to be loaded', 'The text to be shown for forum links that have not been loaded yet.',
                {default: '(Load)', width: '8em'}));
            s.appendChild(delicious.settings.createTextSetting('ABForumLoadingText', 'Text for loading links',
                'The text to be shown for forum links that are currently being loaded.',
                {default: '(Loading)', width: '8em'}));
            s.appendChild(delicious.settings.createTextSetting('ABForumToggleText', 'Text for loaded links',
                'The text to be shown for forum links that have been loaded and can now be toggled.',
                {default: '(Toggle)', width: '8em'}));
    
            delicious.settings.insertSection(s);
        }
    
        if (!( (/^http.*:\/\/animebytes\.tv\/forums\.php/i.test(document.URL))
            && !/action=viewthread/i.test(document.URL) ))
            return;
    
    
        var a, allResults, background_color, button, cb, filterPost, forumIds, forumid, getFirstTagParent, hideSubSelection, i, j, input, len, linkbox1, loadPost, loadText, loadThreadPage, loadingText, myCell, myLINK, newCheckbox, newLinkBox, patt, processThreadPage, quickLink, quickLinkSubs, result, sR, searchForums, searchForumsCB, searchForumsNew, showFastSearchLinks, showPost, strong, tP, textReplace, text_color, toggleText, toggleVisibility, user_filter, user_td, user_tr, workInForumSearch, workInRestOfForum;
    
        background_color = delicious.settings.get('ABForumSearchHighlightBG', '#FFC000');
    
        text_color = delicious.settings.get('ABForumSearchHighlightFG', '#000000');
    
        toggleText = delicious.settings.get('ABForumToggleText', '(Toggle)');
    
        loadText = delicious.settings.get('ABForumLoadText', '(Load)');
    
        loadingText = delicious.settings.get('ABForumLoadingText', '(Loading)');
    
        hideSubSelection = delicious.settings.get('ABForumSearchHideSubfor', true);
    
        workInForumSearch = delicious.settings.get('ABForumSearchWorkInFS', true) && document.URL.indexOf('action=search') >= 0;
    
        workInRestOfForum = delicious.settings.get('ABForumEnhWorkInRest', false) && (document.URL.indexOf('action=viewforum') >= 0 || document.URL.indexOf('?') === -1);
    
        showFastSearchLinks = delicious.settings.get('ABForumEnhFastSearch', true) && document.URL.indexOf('action=viewforum') >= 0;
    
        user_filter = [];
    
        sR = [];
    
        tP = [];
    
        cb = [];
    
        getFirstTagParent = function (elem, tag) {
            while (elem !== null && elem.tagName !== 'BODY' && elem.tagName !== tag) {
                elem = elem.parentNode;
            }
            if (elem === null || elem.tagName !== tag) {
                return null;
            } else {
                return elem;
            }
        };
    
        textReplace = function (elem) {
            var node, regExp, walk;
            if (patt !== '' && (background_color !== 'none' || text_color !== 'none')) {
                walk = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, null, false);
                node = walk.nextNode();
                regExp = new RegExp('(' + patt + ')', 'i');
                while (node != null) {
                    node.textContent.replace(regExp, function (term) {
                        var args, newSpan, newTextNode, offset;
                        args = [].slice.call(arguments);
                        offset = args[args.length - 2];
                        newTextNode = node.splitText(offset);
                        newTextNode.textContent = newTextNode.textContent.substr(term.length);
                        newSpan = document.createElement('span');
                        if (background_color !== 'none') {
                            newSpan.style.backgroundColor = background_color;
                        }
                        if (text_color !== 'none') {
                            newSpan.style.color = text_color;
                        }
                        newSpan.appendChild(document.createTextNode(term));
                        node.parentNode.insertBefore(newSpan, newTextNode);
                        return node = walk.nextNode();
                    });
                    node = walk.nextNode();
                }
            }
        };
    
        processThreadPage = function (id, threadid, page, parent, link) {
            return function () {
                var _i, cell, i, j, len, len1, linkbox, myColsp, nextPost, pagenums, post, prevPost, ref, ref1, td, threadPage, tr, user_id;
                threadPage = "threadid=" + threadid + "&page=" + page;
                link.textContent = toggleText;
                sR[id] = [];
                sR[id].parent = parent;
                sR[id].index = 0;
                sR[id].page = page;
                sR[id].threadid = threadid;
                ref = tP[threadPage];
                for (_i = i = 0, len = ref.length; i < len; _i = ++i) {
                    post = ref[_i];
                    if (post.id === id) {
                        sR[id].index = _i;
                    }
                }
                user_id = tP[threadPage][sR[id].index].className.split('_');
                user_id = user_id[user_id.length - 1];
                sR[id].user = tP[threadPage][sR[id].index].querySelector('a[href="/user.php?id=' + user_id + '"]').textContent;
                linkbox = document.createElement('div');
                pagenums = document.createElement('div');
                linkbox.className = 'linkbox';
                pagenums.className = 'pagenums';
                prevPost = document.createElement('a');
                nextPost = document.createElement('a');
                prevPost.href = '#';
                nextPost.href = '#';
                prevPost.className = 'page-link';
                nextPost.className = 'page-link';
                prevPost.textContent = '← Prev';
                nextPost.textContent = 'Next →';
                pagenums.appendChild(prevPost);
                pagenums.appendChild(nextPost);
                linkbox.appendChild(pagenums);
                prevPost.addEventListener('click', showPost(id, true), true);
                nextPost.addEventListener('click', showPost(id, false), true);
                tr = document.createElement('tr');
                td = document.createElement('td');
                myColsp = 0;
                ref1 = parent.cells;
                for (j = 0, len1 = ref1.length; j < len1; j++) {
                    cell = ref1[j];
                    myColsp += cell.colSpan;
                }
                td.colSpan = myColsp;
                td.appendChild(linkbox);
                td.appendChild(tP[threadPage][sR[id].index]);
                tr.appendChild(td);
                sR[id].td = td;
                sR[id].parent.parentNode.insertBefore(tr, sR[id].parent.nextSibling);
            };
        };
    
        loadThreadPage = function (threadid, page) {
            var threadPage, xhr;
            threadPage = "threadid=" + threadid + "&page=" + page;
            tP[threadPage] = 'Loading';
            cb[threadPage] = [];
            xhr = new XMLHttpRequest();
            xhr.open('GET', "https://animebytes.tv/forums.php?action=viewthread&" + threadPage, true);
            xhr.send();
            xhr.onreadystatechange = function () {
                var callback, i, j, len, len1, parser, post, ref, ref1;
                if (xhr.readyState === 4) {
                    parser = new DOMParser();
                    tP[threadPage] = (parser.parseFromString(xhr.responseText, 'text/html')).querySelectorAll('div[id^="post"]');
                    ref = tP[threadPage];
                    for (i = 0, len = ref.length; i < len; i++) {
                        post = ref[i];
                        textReplace(post);
                    }
                    ref1 = cb[threadPage];
                    for (j = 0, len1 = ref1.length; j < len1; j++) {
                        callback = ref1[j];
                        callback();
                    }
                    return delete cb[threadPage];
                }
            };
        };
    
        loadPost = function (link, index, filtered) {
            return function (event) {
                var cell, id, match, newLink, node, page, threadPage, threadid;
                if (event != null) {
                    event.stopPropagation();
                    event.preventDefault();
                }
                newLink = link.previousSibling;
                cell = link.parentNode;
                node = getFirstTagParent(link, 'TR');
                threadid = link.href.match(/threadid=(\d+)/i);
                threadid = threadid != null ? threadid[1] : '0';
                match = link.href.match(/([^#]*)(?:#post(\d+))?/i);
                if (match != null) {
                    id = match[2] != null ? 'post' + match[2] : id = index + link.href;
                } else {
                    return;
                }
                if (id in sR) {
                    if (filtered === true) {
                        filterPost(id)();
                    } else {
                        toggleVisibility(id);
                    }
                } else {
                    page = link.href.match(/page=(\d+)/i);
                    page = page != null ? parseInt(page[1], 10) : 1;
                    link.previousSibling.textContent = loadingText;
                    threadPage = "threadid=" + threadid + "&page=" + page;
                    if (threadPage in tP) {
                        if (tP[threadPage] === 'Loading') {
                            cb[threadPage].push(processThreadPage(id, threadid, page, node, newLink));
                            if (filtered === true) {
                                cb[threadPage].push(filterPost(id));
                            }
                        } else {
                            processThreadPage(id, threadid, page, node, newLink)();
                            if (filtered === true) {
                                filterPost(id)();
                            }
                        }
                    } else {
                        loadThreadPage(threadid, page);
                        cb[threadPage].push(processThreadPage(id, threadid, page, node, newLink));
                        if (filtered === true) {
                            cb[threadPage].push(filterPost(id));
                        }
                    }
                }
            };
        };
    
        toggleVisibility = function (id) {
            var elem;
            elem = sR[id];
            if (elem.td.parentNode.style.visibility === 'collapse') {
                showPost(id, null)();
                return elem.td.parentNode.style.visibility = 'visible';
            } else {
                return elem.td.parentNode.style.visibility = 'collapse';
            }
        };
    
        showPost = function (id, prev) {
            return function (event) {
                var elem, nextTP, prevTP, threadPage;
                elem = sR[id];
                threadPage = "threadid=" + elem.threadid + "&page=" + elem.page;
                nextTP = "threadid=" + elem.threadid + "&page=" + (elem.page + 1);
                prevTP = "threadid=" + elem.threadid + "&page=" + (elem.page - 1);
                if (event != null) {
                    event.stopPropagation();
                    event.preventDefault();
                }
                if (prev === true) {
                    if (elem.index === 0 && elem.page > 1) {
                        if (prevTP in tP) {
                            if (tP[prevTP] === 'Loading') {
                                cb[prevTP].push(showPost(id, prev));
                            } else {
                                elem.page = elem.page - 1;
                                elem.index = tP[prevTP].length - 1;
                                elem.td.replaceChild(tP[prevTP][elem.index], elem.td.lastChild);
                            }
                        } else {
                            loadThreadPage(elem.threadid, elem.page - 1);
                            cb[prevTP].push(showPost(id, prev));
                        }
                    } else {
                        elem.index = Math.max(elem.index - 1, 0);
                        if (elem.td.children.length === 2) {
                            elem.td.replaceChild(tP[threadPage][elem.index], elem.td.lastChild);
                        } else {
                            elem.td.appendChild(tP[threadPage][elem.index]);
                        }
                    }
                } else if (prev === false) {
                    if (elem.index === 24) {
                        if (nextTP in tP) {
                            if (tP[nextTP] === 'Loading') {
                                cb[prevTP].push(showPost(id, prev));
                            } else {
                                if (tP[nextTP].length > 0) {
                                    elem.page = elem.page + 1;
                                    elem.index = 0;
                                    elem.td.replaceChild(tP[nextTP][0], elem.td.lastChild);
                                }
                            }
                        } else {
                            loadThreadPage(elem.threadid, elem.page + 1);
                            cb[nextTP].push(showPost(id, prev));
                        }
                    } else {
                        elem.index = Math.min(elem.index + 1, tP[threadPage].length - 1);
                        if (elem.td.children.length === 2) {
                            elem.td.replaceChild(tP[threadPage][elem.index], elem.td.lastChild);
                        } else {
                            elem.td.appendChild(tP[threadPage][elem.index]);
                        }
                    }
                } else {
                    if (elem.td.children.length === 2) {
                        elem.td.replaceChild(tP[threadPage][elem.index], elem.td.lastChild);
                    } else {
                        elem.td.appendChild(tP[threadPage][elem.index]);
                    }
                }
            };
        };
    
        filterPost = function (id) {
            return function () {
                var elem, i, len, toFilter, user_name;
                elem = sR[id];
                toFilter = true;
                for (i = 0, len = user_filter.length; i < len; i++) {
                    user_name = user_filter[i];
                    if (elem.user.toUpperCase() === user_name.toUpperCase()) {
                        toFilter = false;
                        break;
                    }
                }
                if (toFilter) {
                    elem.td.parentNode.style.visibility = 'collapse';
                    elem.parent.style.visibility = 'collapse';
                }
            };
        };
    
        if (workInRestOfForum || workInForumSearch) {
            patt = document.querySelector('form[action=""] input[name="search"]');
            if (patt != null) {
                patt = patt.value.trim().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace(/\s+/g, '|');
            } else {
                patt = '';
            }
            allResults = document.querySelectorAll('a[href^="/forums.php?action=viewthread"]');
            for (j = i = 0, len = allResults.length; i < len; j = ++i) {
                result = allResults[j];
                textReplace(result);
                a = document.createElement('a');
                a.href = '#';
                a.textContent = loadText;
                a.addEventListener('click', loadPost(result, j, false), true);
                myCell = result.parentNode;
                myCell.insertBefore(a, result);
            }
        }
    
        if (workInForumSearch) {
            user_tr = document.createElement('tr');
            user_td = [];
            user_td.push(document.createElement('td'));
            user_td.push(document.createElement('td'));
            user_td[0].className = 'label';
            strong = document.createElement('strong');
            strong.textContent = 'Filter author(s):';
            user_td[0].appendChild(strong);
            input = document.createElement('input');
            input.placeholder = 'Comma- or space-separated list of authors';
            input.size = '64';
            button = document.createElement('button');
            button.textContent = 'Filter';
            button.type = 'button';
            user_td[1].appendChild(input);
            user_td[1].appendChild(button);
            user_tr.appendChild(user_td[0]);
            user_tr.appendChild(user_td[1]);
            searchForums = document.querySelector('select[name="forums[]"]').parentNode.parentNode;
            searchForums.parentNode.insertBefore(user_tr, searchForums);
            button.addEventListener('click', function (event) {
                var j, len1, results, userName;
                if (input.value.replace(/[,\s]/g, '') !== '') {
                    user_filter = (function () {
                        var j, len1, ref, results;
                        ref = input.value.trim().replace(/[,\s]+/g, ',').split(',');
                        results = [];
                        for (j = 0, len1 = ref.length; j < len1; j++) {
                            userName = ref[j];
                            results.push(userName.trim());
                        }
                        return results;
                    })();
                    button.disabled = 'disabled';
                    results = [];
                    for (j = j = 0, len1 = allResults.length; j < len1; j = ++j) {
                        result = allResults[j];
                        results.push(loadPost(result, j, true)());
                    }
                    return results;
                }
            }, true);
        }
    }).call(this);
    /* End ./src\ab_forum_search_enhancement.user.js */


    /* Begin ./src\ab_hide_treats.user.js */
    // ==UserScript==
    // @name        AB - Hide treats
    // @author      Alpha
    // @description Hide treats on profile.
    // @include     https://animebytes.tv/*
    // @version     0.1
    // @icon        http://animebytes.tv/favicon.ico
    // @grant       GM_setValue
    // @grant       GM_getValue
    // @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
    // ==/UserScript==
    
    // Hide treats by Alpha
    // Hide treats on profile.
    (function ABHideTreats(){
        var _enabled = delicious.settings.basicScriptCheckbox(
            'delicioustreats',
            'Disgusting Treats',
            'Hide those hideous treats on profile pages!'
        );
        if (!_enabled)
            return;
    
        var treatsnode = document.evaluate('//*[@id="user_leftcol"]/div[@class="box" and div[@class="head" and .="Treats"]]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (treatsnode) treatsnode.style.display = "none";
    })();
    /* End ./src\ab_hide_treats.user.js */


    /* Begin ./src\ab_hyper_quote.user.js */
    // ==UserScript==
    // @name        AB - HYPER QUOTE!
    // @author      Megure, TheFallingMan
    // @description Select text and press CTRL+V to quote
    // @include     https://animebytes.tv/*
    // @version     0.2.3
    // @icon        http://animebytes.tv/favicon.ico
    // @grant       GM_setValue
    // @grant       GM_getValue
    // @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
    // ==/UserScript==
    
    //import '../delicious-library/src/ab_delicious_library';
    
    /* global delicious */
    
    (function ABHyperQuote() {
        var _enabled = delicious.settings.basicScriptCheckbox(
            'delicioushyperquote',
            'Delicious Hyper Quote',
            'Select text and press Ctrl+V to instantly quote it.'
        );
        if (!_enabled)
            return;
    
        if (document.getElementById('quickpost') === null)
            return;
        /** Debug flag. */
        var _debug = false;
    
        function formattedUTCString(date, timezone) {
            var creation = new Date(date);
            if (isNaN(creation.getTime()))
                return date;
            else {
                creation = creation.toUTCString().split(' ');
                return creation[1] + ' ' + creation[2] + ' ' + creation[3] + ', ' + creation[4].substring(0, 5) + (timezone !== false ? ' ' + creation[5] : '');
            }
        }
    
        /**
         * Quotes the entire selection.
         *
         * Handles combining adjacent selection ranges, then calls
         * QUOTEMANY.
         * */
        function QUOTEALL() {
            var sel = window.getSelection();
            if (sel.rangeCount === 0) return;
            // If there's only one range, happy days.
            if (sel.rangeCount === 1) {
                _debug && console.log('Quoting one range:');
                _debug && console.log(sel.getRangeAt(0));
                QUOTEMANY(sel.getRangeAt(0));
            } else {
                _debug && console.log('Dealing with multiple ranges.');
                // Ohhh boy.... firefox, why...?
                var allRanges = [];
                // Start range of the current continguous selection range.
                // The aim of this code is to join contiguous ranges into one range
                // so they can be parsed properly, without being split into multiple
                // quotes.
                var startRange = sel.getRangeAt(0);
                // Previous range we encountered.
                var previousRange = startRange;
                // Current range. Set in loop.
                var thisRange = null;
                // rangeCount+1 to make it loop one time after list is exhausted, to append
                // last range to list.
                // Start at 2nd range, because we have already set startRange
                // and previousRange above. Also, first range has no previous
                // range to compare to.
                for (var i = 1; i < sel.rangeCount+1; i++) {
                    if (i < sel.rangeCount)
                        thisRange = sel.getRangeAt(i);
                    else
                        thisRange = null;
                    // If this range starts at the beginning and picks up
                    // exactly where the previous range left off.
                    // After trial/error, this code should work.
                    // endOffset+1 is to get the childNode _after_ the previous
                    // range ends, since ranges don't overlap (hopefully)
                    if (thisRange !== null && thisRange.startOffset === 0 &&
                        previousRange.endContainer.childNodes[previousRange.endOffset+1] === thisRange.startContainer) {
                        // Store this range as the previous and continue looping.
                        previousRange = thisRange;
                    } else {
                        // Else, the current range does not continue from
                        // the previous one.
                        if (startRange !== previousRange) {
                            // Create and append a new, more sensible, range.
                            var newRange = document.createRange();
                            newRange.setStart(startRange.startContainer, startRange.startOffset);
                            newRange.setEnd(previousRange.endContainer, previousRange.endOffset);
                            allRanges.push(newRange);
                        } else {
                            // No adjacent ranges to startRange.
                            // They're both the same, append either.
                            allRanges.push(previousRange);
                        }
                        // Set these for the next iteration.
                        startRange = thisRange;
                        previousRange = thisRange;
                    }
                }
                for (var j = 0; j < allRanges.length; j++) {
                    QUOTEMANY(allRanges[j]);
                }
            }
        }
    
        /**
         * Quotes many posts.
         *
         * Clones each post and deletes text outside of the selection
         * range.
         *
         * @param {Range} range Selection range to quote.
         */
        function QUOTEMANY(range) {
            /**
             * Removes all siblings of 'node' which occur before or after it,
             * depending on the value of 'prev'.
             *
             * @param {Node} node
             * @param {boolean} prev
             */
            function removeChildren(node, prev) {
                if (node === null || node.parentNode === null) return;
                if (prev === true)
                    while (node.parentNode.firstChild !== node)
                        node.parentNode.removeChild(node.parentNode.firstChild);
                else
                    while (node.parentNode.lastChild !== node)
                        node.parentNode.removeChild(node.parentNode.lastChild);
                removeChildren(node.parentNode, prev);
            }
            /**
             * Essentailly indexOf for any array-like object.
             *
             * @param {Array} arr
             * @param {object} elem
             */
            function inArray(arr, elem) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] === elem)
                        return i;
                }
                _debug && console.log(elem);
                return -1;
            }
    
            // TODO: refactor bbcodeChildren to use these functions.
    
            /**
             *
             * @param {HTMLElement} quoteNode
             */
            function isSmartQuote(quoteNode) {
                try {
                    var colon = quoteNode.previousSibling;
                    var link = colon.previousSibling;
                    var span = link.firstElementChild;
                    var strong = link.previousElementSibling;
                    return (colon.nodeValue === ':\n'
                        && span.tagName.toUpperCase() === 'SPAN'
                        && span.title
                        && link.tagName.toUpperCase() === 'A'
                        && link.textContent.slice(0, 6) === 'wrote '
                        && strong.tagName.toUpperCase() === 'STRONG'
                        && strong.firstElementChild.href.indexOf('/user.php?id=') !== -1);
                } catch (e) {
                    return false;
                }
            }
    
            function isUsernameQuote(quoteNode) {
                try {
                    var wrote = quoteNode.previousSibling;
                    var strong = wrote.previousSibling;
                    return (wrote.nodeValue === ' wrote:\n'
                        && strong.nodeType === Node.ELEMENT_NODE
                        && strong.tagName.toUpperCase() === 'STRONG'
                        && strong.childNodes.length === 1
                        && strong.firstChild.nodeType === Node.TEXT_NODE
                    );
                } catch (e) {
                    return false;
                }
            }
    
            /**
             * Returns a new documentFragment containing 'num' many nodes
             * which are previous siblings of 'node', cloned.
             * Assumes said siblings exist.
             *
             * @param {number} num
             * @param {Node} node
             */
            function savePreviousNodes(num, node) {
                var docFrag = document.createDocumentFragment();
                var index = inArray(node.parentNode.childNodes, node);
                for (var q = 0; q < num; q++) {
                    docFrag.appendChild(
                        node.parentNode.childNodes[index-num+q].cloneNode(true));
                }
                return docFrag;
            }
    
            /**
             * Array of [number, docFrag] pairs where number is a
             * data-hyper-quote value referencing a unique node
             * and the corresponding document fragment
             * contains the nodes to insert before it.
             *
             * @type {[number, DocumentFragment][]}
             */
            var savedPreviousNodes = [];
            /**
             * Checks if 'node' has previous siblings which should be kept
             * (e.g. usernames of quotes or buttons of spoilers).
             *
             * @param {Node} node
             */
            function preserveIfNeeded(node) {
                var numToSave = 0;
                if (isSmartQuote(node))
                    numToSave = 4;
                else if (isUsernameQuote(node))
                    numToSave = 2;
    
                if (numToSave) {
                    var num;
                    if (savedPreviousNodes.length) num = savedPreviousNodes.slice(-1)[0] + 1;
                    else num = 1;
                    var pair = [num, savePreviousNodes(numToSave, node)];
                    node.dataset['hyperQuote'] = num;
                    savedPreviousNodes.push(pair);
                    return pair;
                }
                return null;
            }
    
            /**
             * Traverses upwards from 'node' to the topmost element in the document.
             *
             * If preserve is true, will check for previous nodes to preserve.
             *
             * @param {Node} bottomNode
             * @param {boolean} preserve
             * @returns {[Node, number[]]} Tuple of topmost parent element and array of indexes.
             */
            function traverseUpwards(bottomNode, preserve) {
                var path = [];
                while (bottomNode.parentNode !== null) {
                    path.push(inArray(bottomNode.parentNode.childNodes, bottomNode));
                    if (preserve)
                        preserveIfNeeded(bottomNode);
                    bottomNode = bottomNode.parentNode;
                }
                return [bottomNode, path];
            }
    
            /**
             * Reverse of traverseUpwards,
             * descending to the element in the original position using a known
             * array of indexes.
             *
             * @param {Node} topNode
             * @param {number[]} path
             */
            function traverseDownwards(topNode, path) {
                for (var i = path.length - 1; i >= 0; i--) {
                    if (path[i] === -1) return;
                    topNode = topNode.childNodes[path[i]];
                }
                return topNode;
            }
    
            if (range.collapsed === true) return;
    
            // Goes from the startContainer to root document node, storing its
            // path in 'start'.
            var html1 = range.startContainer;
            var t = traverseUpwards(html1, true);
            html1 = t[0];
            var start = t[1];
    
            // Similarly for the endContainer.
            var html2 = range.endContainer;
            var u = traverseUpwards(html2, false);
            html2 = u[0];
            var end = u[1];
    
            // These should be equal as they originate from the same <html> tag.
            if (html1 !== html2 || html1 === null) return;
            // Take a copy which we can edit as we need.
            var htmlCopy = html1.cloneNode(true);
    
            // Descends the copied HTML tree to get to the startContainer
            // and endContainer, using the indexes stored previously.
            var startNode = traverseDownwards(htmlCopy, start);
            var endNode = traverseDownwards(htmlCopy, end);
    
            // Slices the start and end containers so they contain only
            // the selected text.
            if (endNode.nodeType === 3)
                endNode.data = endNode.data.substr(0, range.endOffset);
            else if (endNode.nodeType === 1)
                for (var i = endNode.childNodes.length; i > range.endOffset; i--)
                    endNode.removeChild(endNode.lastChild);
            if (range.startOffset > 0) {
                if (startNode.nodeType === 3)
                    startNode.data = startNode.data.substr(range.startOffset);
                else if (startNode.nodeType === 1)
                    for (var j = 0; j < range.startOffset; j++)
                        startNode.removeChild(startNode.firstChild);
            }
    
            // Removes all elements before startNode and after endNode.
            removeChildren(startNode, true);
            removeChildren(endNode, false);
    
            // Finds the bottommost element which is a parent of both
            // startNode and endNode. This is done to find the deepest quote
            // which was quoted.
            // Implemented by searching recursing downwards while the parent node
            // only has one child or one whild + whitespace.
            var commonRoot = htmlCopy;
            var rootQuote = null;
            var secondChild = null; // Set in 'while' conditional.
            while ( // I'm really sorry about this code ;-;
                (commonRoot.childNodes.length === 1) // If only one child, the result is obvious.
                || (
                    commonRoot.childNodes.length === 2 // If 2 children.
                    && (secondChild = commonRoot.childNodes[1])
                    && ( // If second child is a text node, we require it be whitespace.
                        (secondChild.nodeType === Node.TEXT_NODE && !secondChild.nodeValue.trim())
                        || // If it is an element, we require it to be <br>.
                        (secondChild.tagName && secondChild.tagName.toUpperCase() === 'BR')
                    )
                )
            ) {
                // If these conditions hold, the child is a common parent of both
                // startNode and endNode, as other elements were deleted earlier.
                commonRoot = commonRoot.firstChild;
                // Moreover, if it's a quote, we store it so we only quote within
                // the deepest common quote.
                if (commonRoot.classList && commonRoot.classList.contains('blockquote')) {
                    rootQuote = commonRoot;
                }
            }
    
            // Restores extra nodes before a quote such as username and link.
            // Must be done after the common root checking otherwise it will
            // mess up the process.
            for (var k = 0; k < savedPreviousNodes.length; k++) {
                // Use selectors on the copied HTML tree to find the corresponding
                // nodes.
                var selector = '[data-hyper-quote="'+savedPreviousNodes[k][0]+'"]';
                var copyNode = htmlCopy.querySelector(selector);
                copyNode.parentNode.insertBefore(savedPreviousNodes[k][1], copyNode);
    
                // Delete original document's data-hyper-quote attribute.
                // We don't care about htmlCopy's attributes as it gets reset
                // every time.
                delete document.querySelector(selector).dataset['hyperQuote'];
            }
            savedPreviousNodes = [];
    
            // If there is a [quote] common to start and end. In other worse,
            // the selection is contained entirely within one quote.
            if (rootQuote) {
                // Then, we only quote within the deepest quote, as that makes
                // the most sense.
                var sel = document.getElementById('quickpost');
                sel.value += bbcodeChildrenTrim(rootQuote.parentNode);
                sel.scrollIntoView();
                return;
            }
    
            // Otherwise, quote as usual.
            var posts = htmlCopy.querySelectorAll('div[id^="post"],div[id^="msg"]');
            for (var l = 0; l < posts.length; l++) {
                QUOTEONE(posts[l]);
            }
        }
    
        /**
         * Returns BBCode of one whole div.post.
         *
         * @param {HTMLDivElement} postDiv
         */
        function bbcodeChildrenTrim(postDiv) {
            return bbcodeChildren(postDiv).trim();
        }
    
        /**
         * Returns BBCode of parentNode's children.
         *
         * BBCode which relies on adjacent siblings (e.g. quotes) must be placed
         * here, as other functions consider one HTML element only.
         *
         * Returns children's BBCode only; assumes the parent BBCode has
         * been generated elsewhere.
         *
         * @param {Node} parentNode
         */
        function bbcodeChildren(parentNode) {
            _debug && console.log('parentNode: ');
            _debug && console.log(parentNode);
            if (!(parentNode.childNodes && parentNode.childNodes.length))
                return '';
            var bbcodeString = '';
            for (var i = 0; i < parentNode.childNodes.length; i++) {
                var thisNode = parentNode.childNodes[i];
                if (thisNode.nodeType === Node.TEXT_NODE) {
                    // Handles text nodes.
                    var text = thisNode.nodeValue;
                    // If this isn't the first child and previous is a <br>,
                    // collapse leading space.
                    if (i > 0 && parentNode.childNodes[i-1].nodeType === Node.ELEMENT_NODE
                        && parentNode.childNodes[i-1].tagName.toUpperCase() === 'BR')
                        text = text.replace(/^\s+/, '');
                    // If this isn't the last child and next is a <br>,
                    // collapse trailing space.
                    if (i+1 < parentNode.childNodes.length
                        && parentNode.childNodes[i+1].nodeType === Node.ELEMENT_NODE
                        && parentNode.childNodes[i+1].tagName.toUpperCase() === 'BR')
                        text = text.replace(/\s+$/, '');
                    bbcodeString += text;
                    continue;
                }
    
                /**
                 * Whether this element represents the start of a
                 * post number (e.g. `[quote=#1559283]`) quote.
                 */
                var isSmartQuote = false;
                try {
                    // We fully expect this to throw exceptions if the element
                    // is not a quote block, as the surrounding structure
                    // will not be there.
                    //debugger;
                    isSmartQuote = (
                        (i+4 < parentNode.childNodes.length)
                        // thisNode is a <strong></strong> node containing the
                        // user link.
                        && thisNode.nodeType === Node.ELEMENT_NODE
                        && thisNode.tagName.toUpperCase() === 'STRONG'
                        && thisNode.firstElementChild.href.indexOf('user.php?id=') !== -1
                        // i+1 is a " " text node.
                        && !parentNode.childNodes[i+1].nodeValue.trim()
                        // i+2 is the <a> node linking to the post.
                        && parentNode.childNodes[i+2].textContent.indexOf('wrote') !== -1
                        && parentNode.childNodes[i+2].firstElementChild.tagName.toUpperCase() === 'SPAN'
                        && parentNode.childNodes[i+2].firstElementChild.title
                        // i+3 is the :
                        && parentNode.childNodes[i+3].nodeValue.indexOf(':') !== -1
                        // i+4 is the quote.
                        && parentNode.childNodes[i+4].classList.contains('blockquote')
                    );
                } catch (exception) { _debug && console.log(exception); }
                _debug && console.log('isSmartQuote: ' + isSmartQuote);
                if (isSmartQuote) {
                    bbcodeString += bbcodeSmartQuote(thisNode,
                        parentNode.childNodes[i+2], parentNode.childNodes[i+4]);
                    i += 4; // Skip the next 4 nodes.
                    continue;
                }
    
                /**
                 * Whether this element represents the start of a
                 * `[quote=username]` quote.
                 * */
                var isBasicQuote = false;
                try {
                    // Strictly speaking, we don't have to handle this here;
                    // handling it with the generic code
                    // (i.e. [b]username[/b] wrote ...)
                    // results in identical rendered output.
                    isBasicQuote = (
                        // Similar logic as above.
                        (i+2 < parentNode.childNodes.length)
                        && thisNode.nodeType === Node.ELEMENT_NODE
                        && thisNode.tagName.toUpperCase() === 'STRONG'
                        && thisNode.childNodes.length === 1
                        && thisNode.firstChild.nodeType === Node.TEXT_NODE
                        && parentNode.childNodes[i+1].nodeValue.trim() === 'wrote:'
                        && parentNode.childNodes[i+2].classList.contains('blockquote')
                    );
                } catch (exception) { _debug && console.log(exception); }
                if (isBasicQuote) {
                    bbcodeString += bbcodeQuote(thisNode.firstChild.nodeValue, parentNode.childNodes[i+2]);
                    i += 2;
                    continue;
                }
    
                var isMediainfo = false;
                try {
                    isMediainfo = (
                        // Spoiler button
                        thisNode.classList.contains('hideContainer')
                        && (
                            (// Either followed by a .mediainfo table
                                (i+1 < parentNode.childNodes.length)
                                && parentNode.childNodes[i+1].tagName.toUpperCase() === 'TABLE'
                                && parentNode.childNodes[i+1].classList.contains('mediainfo'))
                            || ( // OR, which was originally followed by a mediainfo table.
                                (i+1 === parentNode.childNodes.length)
                                && thisNode.firstElementChild.value.length > 4
                                && thisNode.firstElementChild.value.indexOf('.') !== -1
                                && document.querySelector(
                                    '.hideContainer > .spoilerButton[value="'
                                    + thisNode.firstElementChild.value+'"]'
                                ).parentNode.nextElementSibling.classList.contains('mediainfo'))
                        )
                    );
                } catch (exception) { _debug && console.log(exception); }
                if (isMediainfo) {
                    bbcodeString += bbcodeMediainfo(thisNode,
                        parentNode.childNodes[i+1]);
                    i += 1;
                    continue;
                }
    
                // Otherwise, we handle it as a normal node.
                bbcodeString += bbcodeOneElement(thisNode);
            }
            return bbcodeString;
        }
    
        /**
         * Returns a quote BBCode, with quoteName as the = parameter, containing
         * the contents of quoteNode.
         *
         * @param {string} quoteName
         * @param {HTMLQuoteElement} quoteNode
         */
        function bbcodeQuote(quoteName, quoteNode) {
            var contents = bbcodeChildrenTrim(quoteNode);
            return (
                '[quote'+(quoteName?'='+quoteName:'')+']\n'
                +contents
                +'\n[/quote]\n');
        }
    
        /**
         * Returns an appropriate [quote] tag using a post number.
         *
         * @param {HTMLElement} strongNode Node containing username link.
         * @param {HTMLAnchorElement} wroteLink Post link element.
         * @param {HTMLQuoteElement} quoteNode Blockquote element.
         */
        function bbcodeSmartQuote(strongNode, wroteLink, quoteNode) {
            var quoteType = '';
            var href = wroteLink.href;
            if (href.indexOf('/forums.php') !== -1) quoteType = '#';
            else if (href.indexOf('/user.php') !== -1) quoteType = '*';
            else if (href.indexOf('/torrents.php') !== -1) quoteType = '-1';
            else if (href.indexOf('/torrents2.php') !== -1) quoteType = '-2';
            if (quoteType !== '') {
                var id = /#(?:msg|post)?(\d+)$/.exec(href); // post number
                // We have to be careful with newlines otherwise too much whitespace
                // will be added.
                if (id)
                    return bbcodeQuote(quoteType + id[1], quoteNode);
            }
            // We shouldn't ever reach this.
            return ('[url='+wroteLink.href+']Unknown quote[/url][quote]'
                +bbcodeChildren(quoteNode)+'[/quote]');
        }
    
        /**
         * Returns BBCode of one <strong> node.
         *
         * @param {HTMLElement} strongNode
         */
        function bbcodeStrong(strongNode) {
            // Special case of "Added on ..." text.
            if (strongNode.childNodes.length === 1
            && strongNode.firstChild.nodeType === Node.TEXT_NODE
            && strongNode.firstChild.nodeValue.slice(0, 9) === 'Added on ') {
                var dateString = strongNode.firstChild.nodeValue.slice(9);
                var end = '';
                if (dateString.slice(-1) === ':') {
                    dateString = dateString.slice(0, -1);
                    end = ':';
                }
                return '[b]Added on '+formattedUTCString(dateString)+end+'[/b]';
            } else {
                return '[b]'+bbcodeChildren(strongNode)+'[/b]';
            }
        }
    
        /**
         * Returns BBCode of a div element.
         *
         * Possible cases:
         *
         *  - [align=...] tag.
         *  - [code] tag.
         *  - [spoiler] or [hide] tag.
         *
         * @param {HTMLDivElement} divNode
         */
        function bbcodeDiv(divNode) {
            if (divNode.style.textAlign) {
                var align = divNode.style.textAlign;
                return '[align='+align+']'+bbcodeChildren(divNode)+'[/align]';
            }
            if (divNode.classList.contains('codeBox')) {
                return '[code]'+divNode.firstElementChild.firstChild.nodeValue+'[/code]';
            }
            if (divNode.classList.contains('spoilerContainer')) {
                return bbcodeSpoiler(divNode);
            }
            // This fallback shouldn't ever occur.
            return bbcodeChildren(divNode);
        }
    
        /**
         * Returns BBCode of a spoiler element, considering for
         * custom button text.
         *
         * @param {HTMLDivElement} spoilerDiv
         */
        function bbcodeSpoiler(spoilerDiv) {
            var isSpoiler = !spoilerDiv.classList.contains('hideContainer');
            // [hide] or [spoiler]
            var bbcodeTag = isSpoiler ? 'spoiler' : 'hide';
    
            // If we have less than 2 children, then this is an abnormal spoiler.
            if (spoilerDiv.children.length < 2) {
                // If the only child of this div isn't the spoiler's contents,
                // it must be the button and we return.
                if (!spoilerDiv.firstElementChild.classList.contains('spoiler')) {
                    return '';
                }
                // Otherwise, only the inside of a spoiler is selected.
                // In this case, we have no button to work with. Compromise.
                return '['+bbcodeTag+']'+bbcodeChildren(spoilerDiv.firstElementChild)+'[/'+bbcodeTag+']';
            }
            var label = spoilerDiv.firstElementChild.value.replace(/^(Hide|Show)/, '');
            if (isSpoiler) // ' spoiler' is appended automatically to spoiler buttons
                label = label.replace(/ spoiler$/, '');
            if (label) {
                label = label.slice(1); // slice space.
            }
            return '['+bbcodeTag + (label ? '='+label : '') + ']\n' +
                bbcodeChildrenTrim(spoilerDiv.children[1]) + '\n[/'+bbcodeTag+']';
        }
    
    
        /**
         * Returns BBCode for a [mediainfo] tag.
         *
         * @param {HTMLDivElement} buttonDiv Div containing the button and spoiler.
         * @param {HTMLTableElement} mediainfoTable
         */
        function bbcodeMediainfo(buttonDiv, mediainfoTable) { // eslint-disable-line no-unused-vars
            if (buttonDiv.children.length < 2) return '';
            return '[mediainfo]' + bbcodeChildren(buttonDiv.children[1]) + '[/mediainfo]';
        }
    
    
        /**
         * Returns BBCode of a <ol> or <ul> tag.
         *
         * @param {HTMLUListElement} listNode
         * @param {String} bbcodeTag Tag to insert before each line.
         */
        function bbcodeList(listNode, bbcodeTag) {
            var str = '';
            for (var c = 0; c < listNode.childElementCount; c++) {
                // Only consider element children, which we assume are
                // <li> or <ol>/<ul>.
                str += bbcodeTag + bbcodeChildren(listNode.children[c]);
                // For whitespace.
                if (str.slice(-1) !== '\n') str += '\n';
            }
            return str;
        }
    
        /**
         * Returns BBCode of an image element, possibly a smiley.
         *
         * @param {HTMLImageElement} imgNode
         */
        function bbcodeImage(imgNode) {
            if (imgNode.classList.contains('bbcode_smiley')) {
                return imgNode.alt;
            }
            // Note: AB proxies images, so quoted images will not
            // necessarily use the same URL as the original did.
            // Original URL is b64 encoded within the CDN URL.
            return '[img]'+imgNode.src+'[/img]';
        }
    
        /**
         * Returns a string containing the hex representation of a number,
         * padded to 2 hex digits.
         *
         * @param {Number} num
         */
        function numToHex(num) {
            var h = num.toString(16);
            while (h.length < 2)
                h = '0' + h;
            return h;
        }
    
        /** Regex matching colour in rgb(x, y, z) format. */
        var rgbRegex = /^rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/i;
        /**
         * Returns BBCode of a HTML <span> element.
         *
         * Possible cases:
         *
         *  - Smiley
         *  - Color
         *  - Size
         *  - Secret
         *
         * @param {HTMLSpanElement} spanNode
         */
        function bbcodeSpan(spanNode) {
            if (spanNode.className.indexOf('smiley-') !== -1) {
                return bbcodeSmiley(spanNode);
            }
            var colour = spanNode.style.color;
            if (colour) {
                var rgbMatch = rgbRegex.exec(colour);
                // Check for rgb() format colours.
                if (rgbMatch)
                    colour = ('#' + numToHex(parseInt(rgbMatch[1]))
                    +numToHex(parseInt(rgbMatch[2]))
                    +numToHex(parseInt(rgbMatch[3])));
                return '[color='+colour+']' + bbcodeChildren(spanNode) + '[/color]';
            }
            if (spanNode.className.slice(0, 4) === 'size') {
                var size = spanNode.className.replace('size', '');
                return '[size='+size+']'+bbcodeChildren(spanNode)+'[/size]';
            }
            if (spanNode.className === 'last-edited') {
                return '';
            }
            if (spanNode.classList.contains('secret')) {
                return '[secret]' + bbcodeChildren(spanNode) + '[/secret]';
            }
            if (spanNode.title)
                return formattedUTCString(spanNode.title);
            return bbcodeChildren(spanNode);
        }
    
        /**
         * Given a HTML span element representing a smiley, finds and returns
         * the smiley's BBCode.
         *
         * @param {HTMLSpanElement} smileySpan
         */
        function bbcodeSmiley(smileySpan) {
            var smiley = smileySpan.title;
            var smileyNode = document.querySelector('span[alt="' + smiley + '"]');
            if (smileyNode === null)
                smileyNode = document.querySelector('span[style*="/' + smiley + '.png"]');
            if (smileyNode === null)
                smileyNode = document.querySelector('span[style*="/' + smiley.replace(/-/g, '_') + '.png"]');
            if (smileyNode === null)
                smileyNode = document.querySelector('span[style*="/' +
                    smiley.replace(/-/g, '_').toLowerCase() + '.png"]');
            if (smileyNode === null)
                smileyNode = document.querySelector('span[style*="/' + smiley.replace(/face/g, '~_~') + '.png"]');
            if (smileyNode !== null && smileyNode.parentNode !== null) {
                smileyNode = smileyNode.getAttribute('onclick').match(/'(.+?)'/i);
                if (smileyNode !== null)
                    return smileyNode[1];
            }
            return ':' + smiley + ':';
        }
    
    
        var userRegex = /^\/user\.php\?id=(\d+)$/;
        var torrentRegex = /^torrents2?\.php\?id=\d+&torrentid=(\d+)$/;
    
        /**
         *
         * @param {HTMLAnchorElement} linkElement
         */
        function bbcodeLink(linkElement) {
            // <img> tags are often wrapped around a <a> pointing to the same image.
            if (linkElement.classList.contains('scaledImg')) {
                return bbcodeImage(linkElement.firstElementChild);
            }
            /** href with relative links resolved. */
            var href = linkElement.href;
            /** Actual href as typed into HTML */
            var realHref = linkElement.getAttribute('href');
    
            var userMatch = userRegex.exec(realHref);
            if (userMatch)
                return '[user='+href+']'+bbcodeChildren(linkElement)+'[/user]';
            var torrentMatch = torrentRegex.exec(realHref);
            if (torrentMatch) {
                // If the link's text contains &nbsp; we assume it is a torrent
                // link.
                if (linkElement.textContent.indexOf('\xa0\xa0[') !== -1)
                    return '[torrent]'+href+'[/torrent]';
                else
                    return '[torrent='+href+']'+bbcodeChildren(linkElement)+'[/torrent]';
            }
            // Actually, torrent and user links could be written using [url=]
            // and the rendered output would be the same.
            return ('[url='+realHref+']'+ bbcodeChildren(linkElement) + '[/url]');
        }
    
        var youtubeRegex = /\/embed\/([^?]+)\?/i;
        var soundcloudRegex = /\/player\/\?url=([^&]+)&/i;
    
        /**
         * Returns BBCode for embedded media.
         *
         * @param {HTMLIFrameElement} iframeNode
         */
        function bbcodeIframe(iframeNode) {
            var src = iframeNode.src;
            if (src.indexOf('youtube.com/embed') !== -1) {
                return '[youtube]https://youtube.com/watch?v='+youtubeRegex.exec(src)[1]+'[/youtube]';
            }
            if (src.indexOf('soundcloud.com/player') !== -1) {
                // The original soundcloud URL is encoded and forms a part of the
                // embed URL.
                return '[soundcloud]'+decodeURIComponent(soundcloudRegex.exec(src)[1])+'[/soundcloud]';
            }
            return 'Embedded media: ' + src;
        }
    
        /**
         * Returns BBCode for one element.
         *
         * Handles simple cases and routes more complex cases
         * to the appropriate function.
         *
         * @param {HTMLElement} node
         */
        function bbcodeOneElement(node) {
            if (node.nodeType !== Node.ELEMENT_NODE) {
                // Text nodes should be handled in bbcodeChildren.
                if (node.nodeType === Node.TEXT_NODE)
                    return node.nodeValue;
                if (node.nodeType === Node.COMMENT_NODE && node.nodeValue === 'n')
                    return '[n]';
                return '';
            }
            switch (node.tagName.toUpperCase()) {
            case 'DIV': return bbcodeDiv(node);
            case 'SPAN': return bbcodeSpan(node);
            case 'BR': return '\n';
            case 'STRONG': return bbcodeStrong(node);
            case 'EM': return '[i]'+bbcodeChildren(node)+'[/i]';
            case 'U': return '[u]'+bbcodeChildren(node)+'[/u]';
            case 'S': return '[s]'+bbcodeChildren(node)+'[/s]';
            case 'OL': return bbcodeList(node, '[#] ');
            case 'UL': return bbcodeList(node, '[*] ');
            case 'A': return bbcodeLink(node);
            case 'IMG': return bbcodeImage(node);
            case 'IFRAME': return bbcodeIframe(node);
            case 'BLOCKQUOTE': return bbcodeQuote('', node);
            case 'HR': return '[hr]';
            case 'TABLE': return bbcodeChildren(node); // crude representation of a table
            case 'CAPTION': return '[b]'+bbcodeChildren(node)+'[/b]\n';
            case 'TBODY': return bbcodeChildren(node);
            case 'TH': return bbcodeChildren(node) + '\n';
            case 'TR': return bbcodeChildren(node) + '\n';
            case 'TD': return bbcodeChildren(node) + '\t';
            default:
                return '<'+node.tagName+'>' + bbcodeChildren(node) + '</'+node.tagName+'>';
            }
        }
    
        /**
         * Quotes one post, with post number.
         *
         * @param {Node} post
         */
        function QUOTEONE(post) {
            //_debug && console.log(post.querySelector('div.post,div.body').innerHTML);
            //var res = HTMLtoBB(post.querySelector('div.post,div.body').innerHTML),
            var res = bbcodeChildrenTrim(post.querySelector('div.post, div.body'));
            var author, creation, postid, type = '';
            if (res === '') return;
    
            postid = post.id.match(/(?:msg|post)(\d+)/i);
            if (postid === null)
                return;
    
            if (window.location.pathname === '/forums.php') type = '#';
            if (window.location.pathname === '/user.php') type = '*';
            if (window.location.pathname === '/torrents.php') type = '-1';
            if (window.location.pathname === '/torrents2.php') type = '-2';
            if (type !== '')
                res = '[quote=' + type + postid[1] + ']' + res + '[/quote]\n';
            else {
                author = post.className.match(/user_(\d+)/i);
                if (author !== null)
                    author = '[b][user]' + author[1] + '[/user][/b] ';
                else {
                    author = document.querySelector('#' + postid[0] + ' a[href^="/user.php?"]');
                    if (author !== null) {
                        author = author.href.match(/id=(\d+)/i);
                        author = (author !== null ? '[b][user]' + author[1] + '[/user][/b] ' : '');
                    }
                    else
                        author = '';
                }
    
                creation = document.querySelector('div#' + postid[0] + ' > div > div > p.posted_info > span');
                if (creation === null)
                    creation = document.querySelector('div#' + postid[0] + ' > div > span > span.usercomment_posttime');
                if (creation !== null)
                    creation = ' on ' + formattedUTCString(creation.title.replace(/-/g, '/'));
                else
                    creation = '';
    
                res = author + '[url=' + window.location.pathname + window.location.search + '#' + postid[0] + ']wrote' + creation + '[/url]:\n[quote]' + res + '[/quote]\n\n';
            }
    
            document.getElementById('quickpost').value += res;
    
            var sel = document.getElementById('quickpost');
            if (sel !== null)
                sel.scrollIntoView();
        }
    
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey) && (e.keyCode === 'V'.charCodeAt(0)))
                QUOTEALL();
        });
    })();
    /* End ./src\ab_hyper_quote.user.js */


    /* Begin ./src\ab_keyboard_shortcuts.user.js */
    // ==UserScript==
    // @name        AnimeBytes - Forum Keyboard Shortcuts
    // @author      Alpha, modified by Megure
    // @description Enables keyboard shortcuts for forum (new post and edit) and PM
    // @include     https://animebytes.tv/*
    // @version     0.1.1
    // @icon        http://animebytes.tv/favicon.ico
    // @grant       GM_setValue
    // @grant       GM_getValue
    // @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
    // ==/UserScript==
    
    
    // Keyboard shortcuts by Alpha, mod by Megure
    // Enables keyboard shortcuts for forum (new post and edit) and PM
    (function ABKeyboardShortcuts() {
        var _debug = false;
    
        var _enabled = delicious.settings.basicScriptCheckbox(
            'deliciouskeyboard',
            'Delicious Keyboard Shortcuts',
            'Keyboard shortcuts to make typing BBCode easier.'
        );
        if (!_enabled)
            return;
        if (document.querySelector('textarea') === null)
            return;
    
        function custom_insert_text(open, close) {
            var elem = document.activeElement;
            if (elem.selectionStart || elem.selectionStart == '0') {
                var startPos = elem.selectionStart;
                var endPos = elem.selectionEnd;
                elem.value = elem.value.substring(0, startPos) + open + elem.value.substring(startPos, endPos) + close + elem.value.substring(endPos, elem.value.length);
                elem.selectionStart = elem.selectionEnd = endPos + open.length + close.length;
                elem.focus();
                if (close.length == 0)
                    elem.setSelectionRange(startPos + open.length, startPos + open.length);
                else
                    elem.setSelectionRange(startPos + open.length, endPos + open.length);
            } else if (document.selection && document.selection.createRange) {
                elem.focus();
                var sel = document.selection.createRange();
                sel.text = open + sel.text + close;
                if (close.length != 0) {
                    sel.move("character", -close.length);
                    sel.select();
                }
                elem.focus();
            } else {
                elem.value += open;
                elem.focus();
                elem.value += close;
            }
        }
    
        var ctrlorcmd = (navigator.appVersion.indexOf('Mac') != -1) ? '⌘' : 'Ctrl';
        var insertedQueries = [];
    
        function insert(e, key, ctrl, alt, shift, open, close, query) {
            /* Function to handle detecting key combinations and inserting the
            shortcut text onto the relevent buttons. */
            if (false) {
                //console.log(String.fromCharCode((96 <= key && key <= 105)? key-48 : key));
                console.log(String.fromCharCode(e.charCode));
                console.log(e.ctrlKey);
                console.log(e.metaKey);
                console.log(e.altKey);
                console.log(e.shiftKey);
            }
            // Javascript has some discrepancies with symbols and their keycodes.
            var keyCode;
            switch (key) {
            case '.':
                keyCode = 190;
                break;
            case '/':
                keyCode = 191;
                break;
            default:
                keyCode = key.charCodeAt(0);
            }
    
            // Checks if correct modifiers are pressed
            if (document.activeElement.tagName.toLowerCase() === 'textarea' &&
            (ctrl === (e.ctrlKey || e.metaKey)) &&
            (alt === e.altKey) &&
            (shift === e.shiftKey) &&
            (e.keyCode === keyCode)) {
                e.preventDefault();
                custom_insert_text(open, close);
                return false;
            }
    
            if (query !== undefined) {
                if (insertedQueries.indexOf(query) === -1) {
                    insertedQueries.push(query);
                    var imgs = document.querySelectorAll(query);
                    for (var i = 0; i < imgs.length; i++) {
                        var img = imgs[i];
                        img.title += ' (';
                        if (ctrl) img.title += ctrlorcmd + '+';
                        if (alt) img.title += 'Alt+';
                        if (shift) img.title += 'Shift+';
                        img.title += key + ')';
                    }
                }
            }
        }
    
        function keydownHandler(e) {
            // Used as a keydown event handler.
            // Defines all keyboard shortcuts.
            /**
                * All keyboard shortcuts based on MS Word
                **/
            // Bold
            insert(e, 'B', true, false, false, '[b]', '[/b]', '#bbcode img[title="Bold"]');
            // Italics
            insert(e, 'I', true, false, false, '[i]', '[/i]', '#bbcode img[title="Italics"]');
            // Underline
            insert(e, 'U', true, false, false, '[u]', '[/u]', '#bbcode img[title="Underline"]');
            // Align right
            insert(e, 'R', true, false, false, '[align=right]', '[/align]');
            // Align left
            insert(e, 'L', true, false, false, '[align=left]', '[/align]');
            // Align center
            insert(e, 'E', true, false, false, '[align=center]', '[/align]');
            // Spoiler
            insert(e, 'S', true, false, false, '[spoiler]', '[/spoiler]', '#bbcode img[title="Spoilers"]');
            // Hide
            insert(e, 'H', true, false, false, '[hide]', '[/hide]', '#bbcode img[title="Hide"]');
            // YouTube
            insert(e, 'Y', true, true, false, '[youtube]', '[/youtube]', '#bbcode img[alt="YouTube"]');
            // Image
            insert(e, 'G', true, false, false, '[img]', '[/img]', '#bbcode img[title="Image"]');
            // Bullet point and numbered list
            insert(e, '.', true, false, false, '[*] ', '', '#bbcode img[title="Unordered list"]');
            insert(e, '/', true, false, false, '[#] ', '', '#bbcode img[title="Ordered list"]');
            // URL
            insert(e, 'K', true, false, false, '[url=]', '[/url]', '#bbcode img[title="URL"]');
        }
    
        var textAreas = document.querySelectorAll('textarea');
        // inserts shortcuts into title text on load, rather than
        // doing it when first key is pressed.
        keydownHandler({});
        for (var i = 0; i < textAreas.length; i++) {
            textAreas[i].addEventListener('keydown', keydownHandler, false);
        }
    
        function mutationHandler(mutations, observer) {
            _debug && console.log(mutations);
            if (mutations[0].addedNodes.length) {
                var textAreas = document.querySelectorAll('textarea');
                for (var i = 0; i < textAreas.length; i++) {
                    textAreas[i].addEventListener('keydown', keydownHandler, false);
                }
            }
        }
    
        // Watch for new textareas (e.g. forum edit post)
        var mutationObserver = new MutationObserver(mutationHandler);
        mutationObserver.observe(document.querySelector('body'), { childList: true, subtree: true });
    })();
    /* End ./src\ab_keyboard_shortcuts.user.js */


    /* Begin ./src\ab_title_inverter.user.js */
    // ==UserScript==
    // @name AnimeBytes forums title inverter
    // @author potatoe
    // @version 0.1
    // @description Inverts the forums titles.
    // @icon https://animebytes.tv/favicon.ico
    // @include https://animebytes.tv/forums.php?*
    // @match https://animebytes.tv/forums.php?*
    // @grant       GM_setValue
    // @grant       GM_getValue
    // @require https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
    // ==/UserScript==
    
    // Forums title inverter by Potatoe
    // Inverts the forums titles.
    (function ABTitleInverter() {
        var _enabled = delicious.settings.basicScriptCheckbox(
            'delicioustitleflip',
            'Delicious Title Flip',
            'Flips the tab title.'
        );
        if (!_enabled)
            return;
    
        if (document.title.indexOf(' > ') !== -1) {
            document.title = document.title.split(" :: ")[0].split(" > ").reverse().join(" < ") + " :: AnimeBytes";
        }
    })();
    /* End ./src\ab_title_inverter.user.js */


    /* Begin ./src\ab_title_notifications.user.js */
    // ==UserScript==
    // @name        AnimeBytes - Title Notifications
    // @author      Megure
    // @description Will prepend the number of notifications to the title
    // @include     https://animebytes.tv/*
    // @version     0.1
    // @icon        http://animebytes.tv/favicon.ico
    // @grant       GM_setValue
    // @grant       GM_getValue
    // @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
    // ==/UserScript==
    
    // Title Notifications by Megure
    // Will prepend the number of notifications to the title
    (function ABTitleNotifications() {
        var _enabled = delicious.settings.basicScriptCheckbox(
            'delicioustitlenotifications',
            'Delicious Title Notifications',
            'Display number of notifications in the tab title.'
        );
        if (!_enabled)
            return;
    
        var new_count = 0, _i, cnt, notifications = document.querySelectorAll('#alerts .new_count'), _len = notifications.length;
        for (_i = 0; _i < _len; _i++) {
            cnt = parseInt(notifications[_i].textContent, 10);
            if (!isNaN(cnt))
                new_count += cnt;
        }
        if (new_count > 0)
            document.title = '(' + new_count + ') ' + document.title;
    })();
    /* End ./src\ab_title_notifications.user.js */


    /* Begin ./src\ab_yen_stats.user.js */
    // ==UserScript==
    // @name        AB - Yen per X and ratio milestones
    // @author      Megure, Lemma, NSC, et al.
    // @description Yen per X and ratio milestones, by Megure, Lemma, NSC, et al.
    // @include     https://animebytes.tv/user.php*
    // @version     0.1
    // @icon        http://animebytes.tv/favicon.ico
    // @grant       GM_setValue
    // @grant       GM_getValue
    // @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
    // ==/UserScript==
    
    // Yen per X and ratio milestones, by Megure, Lemma, NSC, et al.
    (function ABYenStats() {
        delicious.settings.basicScriptCheckbox('deliciousyenperx', 'Delicious Yen Per X',
            'Shows how much yen you receive per X and as upload equivalent.');
        delicious.settings.basicScriptCheckbox('deliciousratio', 'Delicious Ratio',
            'Shows ratio, raw ratio and how much upload/download you need for certain ratio milestones.');
    
        if (!/user\.php\?id=/i.test(document.URL))
            return;
    
    
    
        function compoundInterest(years) {
            return (Math.pow(2, years) - 1) / Math.log(2);
        }
        function formatInteger(num) {
            var res = '';
            while (num >= 1000) {
                res = ',' + ('00' + (num % 1000)).slice(-3) + res;
                num = Math.floor(num / 1000);
            }
            return num + res;
        }
        function bytecount(num, unit) {
            // For whatever reason, this was always called with .toUpperCase()
            // by the original author, but newer KiB style prefixes have
            // a lowercase. Keeping both for compatibility.
            switch (unit) {
                case 'B':
                    return num * Math.pow(1024, 0);
                case 'KiB':
                case 'KIB':
                    return num * Math.pow(1024, 1);
                case 'MiB':
                case 'MIB':
                    return num * Math.pow(1024, 2);
                case 'GiB':
                case 'GIB':
                    return num * Math.pow(1024, 3);
                case 'TiB':
                case 'TIB':
                    return num * Math.pow(1024, 4);
                case 'PiB':
                case 'PIB':
                    return num * Math.pow(1024, 5);
                case 'EiB':
                case 'EIB':
                    return num * Math.pow(1024, 6);
            }
        }
        function humancount(num) {
            if (num == 0) return '0 B';
            var i = Math.floor(Math.log(Math.abs(num)) / Math.log(1024));
            num = (num / Math.pow(1024, i)).toFixed(2);
            switch (i) {
                case 0:
                    return num + ' B';
                case 1:
                    return num + ' KiB';
                case 2:
                    return num + ' MiB';
                case 3:
                    return num + ' GiB';
                case 4:
                    return num + ' TiB';
                case 5:
                    return num + ' PiB';
                case 6:
                    return num + ' EiB';
                default:
                    return num + ' × 1024^' + i + ' B';
            }
        }
        function addDefinitionAfter(after, definition, value, cclass) {
            dt = document.createElement('dt');
            dt.appendChild(document.createTextNode(definition));
            dd = document.createElement('dd');
            if (cclass !== undefined) dd.className += cclass;
            dd.appendChild(document.createTextNode(value));
            after.parentNode.insertBefore(dd, after.nextElementSibling.nextSibling);
            after.parentNode.insertBefore(dt, after.nextElementSibling.nextSibling);
            return dt;
        }
        function addDefinitionBefore(before, definition, value, cclass) {
            dt = document.createElement('dt');
            dt.appendChild(document.createTextNode(definition));
            dd = document.createElement('dd');
            if (cclass !== undefined) dd.className += cclass;
            dd.appendChild(document.createTextNode(value));
            before.parentNode.insertBefore(dt, before);
            before.parentNode.insertBefore(dd, before);
            return dt;
        }
        function addRawStats() {
            var tw, regExp = /([0-9,.]+)\s*([A-Z]+)\s*\(([^)]*)\)/i;
            // Find text with raw stats
            tw = document.createTreeWalker(document, NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^Raw Uploaded:/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var rawUpMatch = tw.currentNode.data.match(regExp);
            tw = document.createTreeWalker(tw.currentNode.parentNode.parentNode, NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^Raw Downloaded:/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var rawDownMatch = tw.currentNode.data.match(regExp);
            tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^\s*Ratio/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var ratioNode = tw.currentNode.parentNode;
            tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^\s*Uploaded/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var ulNode = tw.currentNode.parentNode;
            tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^\s*Downloaded/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var dlNode = tw.currentNode.parentNode;
    
            var ul = ulNode.nextElementSibling.textContent.match(regExp);
            var dl = dlNode.nextElementSibling.textContent.match(regExp);
            _debug && console.log(ul);
            _debug && console.log(dl);
            var uploaded = bytecount(parseFloat(ul[1].replace(/,/g, '')), ul[2].toUpperCase());
            var downloaded = bytecount(parseFloat(dl[1].replace(/,/g, '')), dl[2].toUpperCase());
            var rawuploaded = bytecount(parseFloat(rawUpMatch[1].replace(/,/g, '')), rawUpMatch[2].toUpperCase());
            var rawdownloaded = bytecount(parseFloat(rawDownMatch[1].replace(/,/g, '')), rawDownMatch[2].toUpperCase());
            var rawRatio = Infinity;
            if (bytecount(parseFloat(rawDownMatch[1].replace(/,/g, '')), rawDownMatch[2].toUpperCase()) > 0)
                rawRatio = (bytecount(parseFloat(rawUpMatch[1].replace(/,/g, '')), rawUpMatch[2].toUpperCase()) / bytecount(parseFloat(rawDownMatch[1].replace(/,/g, '')), rawDownMatch[2].toUpperCase())).toFixed(2);
    
            // Color ratio
            var color = 'r99';
            if (rawRatio < 1)
                color = 'r' + ('0' + Math.ceil(10 * rawRatio)).slice(-2);
            else if (rawRatio < 5)
                color = 'r20';
            else if (rawRatio < 99)
                color = 'r50';
    
            // Add to user stats after ratio
            var hr = document.createElement('hr');
            hr.style.clear = 'both';
            ratioNode.parentNode.insertBefore(hr, ratioNode.nextElementSibling.nextSibling);
            var rawRatioNode = addDefinitionAfter(ratioNode, 'Raw Ratio:', rawRatio, color);
            addDefinitionAfter(ratioNode, 'Raw Downloaded:', rawDownMatch[0]);
            addDefinitionAfter(ratioNode, 'Raw Uploaded:', rawUpMatch[0]);
            ratioNode.nextElementSibling.title = 'Ratio\t  Buffer';
            rawRatioNode.nextElementSibling.title = 'Raw ratio\t Raw Buffer';
    
            function printBuffer(u, d, r) {
                if (u / r - d >= 0)
                    return '\n' + r.toFixed(1) + '\t' + (humancount(u / r - d)).slice(-10) + '    \tcan be downloaded'
                else
                    return '\n' + r.toFixed(1) + '\t' + (humancount(d * r - u)).slice(-10) + '    \tmust be uploaded'
            }
            for (var i = 0; i < 10; i++) {
                var myRatio = [0.2, 0.5, 0.7, 0.8, 0.9, 1.0, 1.5, 2.0, 5.0, 10.0][i];
                ratioNode.nextElementSibling.title += printBuffer(uploaded, downloaded, myRatio);
                rawRatioNode.nextElementSibling.title += printBuffer(rawuploaded, rawdownloaded, myRatio);
            }
        }
        function addYenPerStats() {
            var dpy = 365.256363; // days per year
            var tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /Yen per day/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var ypdNode = tw.currentNode.parentNode;
            var ypy = parseInt(ypdNode.nextElementSibling.textContent, 10) * dpy; // Yen per year
            addDefinitionAfter(ypdNode, 'Yen per year:', formatInteger(Math.round(ypy * compoundInterest(1))));
            addDefinitionAfter(ypdNode, 'Yen per month:', formatInteger(Math.round(ypy * compoundInterest(1 / 12))));
            addDefinitionAfter(ypdNode, 'Yen per week:', formatInteger(Math.round(ypy * compoundInterest(7 / dpy))));
            // 1 Yen = 1 MB = 1024^2 B * yen per year * interest for 1 s
            var hr = document.createElement('hr');
            hr.style.clear = 'both';
            ypdNode.parentNode.insertBefore(hr, ypdNode);
            addDefinitionBefore(ypdNode, 'Yen as upload:', humancount(Math.pow(1024, 2) * ypy * compoundInterest(1 / dpy / 24 / 60 / 60)) + '/s');
            addDefinitionBefore(ypdNode, 'Yen per hour:', (ypy * compoundInterest(1 / dpy / 24)).toFixed(1));
        }
        if (delicious.settings.get('deliciousratio'))
            addRawStats();
        if (delicious.settings.get('deliciousyenperx'))
            addYenPerStats();
    })();
    /* End ./src\ab_yen_stats.user.js */


})();