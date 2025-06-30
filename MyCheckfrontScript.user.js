// ==UserScript==
// @name         Checkfront Overnight Report Helper Script
// @namespace    http://cat.checkfront.co.uk/
// @version      2025-06-30T16:17
// @description  Add additional reporting functions / formats to CheckFront
// @author       GlitchyPies
// @match        https://cat.checkfront.co.uk/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=checkfront.co.uk
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// ==/UserScript==
const $J_Query = jQuery;
const $J_Master = $J_Query.noConflict(true);

console.log('Hello world');

(function($) {
    'use strict';

    console.log('Running main function...');

    //                     Column Header,  Column Value(s) [Label,Value]
    const OVERNIGHT_HEADERS = [['Room', '{Product Name}'],
                               ['Name', [['Booking', '{First name} {Surname}'],['Guest','{Guest First Name} {Guest Last Name}']]],
                               ['Checkin Status',[['Booking','{Check In / Out}'],['Guest','{Guest Check In Status}']]],
                               ['Accessability needs','{Accessibility requirements}']
                              ];

    //https://www.iconpacks.net/free-icon/moon-2287.html
    const MOON_ICON = `
<svg width="724" height="24" version="1.1" viewBox="0 0 713.75 702.37" xmlns="http://www.w3.org/2000/svg"><g transform="translate(200.55 195)" stroke-linecap="round"><path d="m110.09 507.37c-171.29 0-310.64-139.35-310.64-310.64 0-145.25 98.726-269.64 240.08-302.5 5.4641-1.2609 11.095 1.4671 13.474 6.5585 2.3791 5.0993 0.85649 11.166-3.6401 14.537-64.665 48.534-101.75 122.66-101.75 203.38 0 140.13 114 254.13 254.14 254.13 66.187 0 128.89-25.369 176.56-71.437 4.0445-3.9176 10.278-4.4569 14.941-1.2847 4.6631 3.1563 6.4633 9.1438 4.33 14.362-48.058 117.18-160.89 192.89-287.49 192.89zm-116.63-572.84c-102.41 45.14-170.23 146.5-170.23 262.2 0 158.16 128.68 286.85 286.85 286.85 98.488 0 187.97-49.637 240.24-129.99-44.109 28.018-95.316 43.046-148.58 43.046-153.25 0-277.93-124.67-277.93-277.92 0-69.146 24.878-133.87 69.645-184.18z"/><path d="m115.74 214.67c-2.4664 0-4.9169-0.76926-6.9946-2.2681-3.6639-2.6646-5.4958-7.1691-4.7345-11.642l11.23-65.466-47.567-46.361c-3.2436-3.1563-4.4093-7.8908-3.0136-12.197 1.4037-4.3062 5.1231-7.4467 9.6038-8.097l65.735-9.5562 29.398-59.566c1.9985-4.0604 6.1302-6.6299 10.666-6.6299 4.5362 0 8.668 2.5695 10.666 6.6299l29.398 59.566 65.735 9.5562c4.4728 0.6503 8.2001 3.7908 9.6038 8.097 1.3958 4.3062 0.22998 9.0328-3.0136 12.197l-47.567 46.369 11.23 65.466c0.76925 4.4648-1.0706 8.9773-4.7345 11.642-3.6718 2.6646-8.5173 3.0136-12.53 0.90407l-58.788-30.913-58.788 30.913c-1.7447 0.90407-3.6401 1.3561-5.5354 1.3561zm64.324-57.615c1.9033 0 3.7987 0.45996 5.5354 1.364l42.991 22.602-8.208-47.876c-0.65823-3.8542 0.61857-7.7956 3.426-10.532l34.783-33.903-48.074-6.9867c-3.8701-0.56306-7.2246-2.9977-8.9535-6.503l-21.499-43.562-21.492 43.562c-1.7368 3.5053-5.0834 5.9478-8.9535 6.503l-48.074 6.9867 34.783 33.903c2.8074 2.736 4.0842 6.6695 3.426 10.532l-8.2159 47.876 42.991-22.602c1.7368-0.90407 3.6321-1.364 5.5354-1.364z"/><path d="m266.32-21.305c-2.4664 0-4.9169-0.76925-6.9946-2.276-3.6639-2.6567-5.4958-7.1691-4.7345-11.634l8.2477-48.074-34.918-34.037c-3.2436-3.1642-4.4093-7.8908-3.0136-12.197 1.4037-4.3062 5.1231-7.4467 9.6038-8.097l48.257-7.0105 21.595-43.736c1.9985-4.0604 6.1302-6.6298 10.666-6.6298 4.5283 0 8.668 2.5695 10.666 6.6298l21.587 43.728 48.257 7.0105c4.4728 0.6503 8.2001 3.7908 9.6038 8.097 1.3958 4.3062 0.22998 9.0328-3.0136 12.197l-34.918 34.037 8.2477 48.074c0.76925 4.4648-1.0706 8.9693-4.7345 11.634-3.6639 2.6646-8.5173 3.0136-12.53 0.90407l-43.157-22.689-43.165 22.689c-1.7526 0.92786-3.6559 1.3799-5.5513 1.3799zm-4.5283-96.228 22.134 21.579c2.8074 2.736 4.0842 6.6695 3.426 10.532l-5.2262 30.477 27.368-14.386c3.4735-1.824 7.6132-1.8161 11.071 0l27.36 14.386-5.2262-30.477c-0.65822-3.8542 0.61858-7.7956 3.426-10.532l22.134-21.579-30.588-4.449c-3.8701-0.56306-7.2246-2.9977-8.9535-6.5109l-13.688-27.725-13.696 27.733c-1.7288 3.5052-5.0834 5.9478-8.9535 6.503z"/><path d="m401.23 233.19c-2.4664 0-4.9169-0.76925-6.9946-2.2681-3.6639-2.6646-5.4958-7.1691-4.7345-11.642l6.2412-36.393-26.44-25.774c-3.2436-3.1642-4.4093-7.8908-3.0136-12.197 1.4037-4.3062 5.1231-7.4467 9.6038-8.097l36.536-5.3055 16.353-33.118c1.9985-4.0604 6.1302-6.6299 10.666-6.6299 4.5283 0 8.668 2.5695 10.666 6.6299l16.345 33.11 36.543 5.3055c4.4728 0.6503 8.2001 3.7908 9.6038 8.097 1.4037 4.3062 0.22999 9.0328-3.0136 12.197l-26.448 25.774 6.2492 36.401c0.76926 4.4648-1.0706 8.9773-4.7345 11.642-3.6718 2.6646-8.5252 3.0056-12.53 0.90407l-32.681-17.185-32.681 17.185c-1.7447 0.912-3.6401 1.364-5.5354 1.364zm1.943-76.291 13.656 13.315c2.8074 2.736 4.0842 6.6695 3.426 10.532l-3.2198 18.803 16.884-8.8821c3.4735-1.8161 7.6053-1.8161 11.071 0l16.884 8.8742-3.2277-18.795c-0.65823-3.8621 0.61857-7.7956 3.426-10.532l13.664-13.315-18.882-2.7439c-3.8701-0.56306-7.2246-2.9977-8.9535-6.5109l-8.438-17.106-8.4459 17.106c-1.7288 3.5053-5.0834 5.9478-8.9535 6.503z"/></g></svg>
`;

    //https://www.iconpacks.net/free-icon/arrow-up-2818.html
    const UP_ARROW = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="256" height="256" viewBox="0 0 256 256" xml:space="preserve">
<g style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
	<path d="M 76.714 31.655 c 0 0.598 -0.228 1.196 -0.683 1.651 l -9.44 9.44 c -0.441 0.441 -1.027 0.684 -1.651 0.684 s -1.21 -0.242 -1.651 -0.684 l -9.277 -9.277 v 54.195 c 0 1.288 -1.048 2.335 -2.335 2.335 H 38.325 c -1.288 0 -2.335 -1.048 -2.335 -2.335 V 33.469 l -9.278 9.277 c -0.441 0.441 -1.027 0.684 -1.651 0.684 c -0.624 0 -1.21 -0.242 -1.651 -0.684 l -9.44 -9.44 c -0.911 -0.91 -0.911 -2.393 0 -3.303 l 29.329 -29.33 c 0.46 -0.459 1.078 -0.697 1.74 -0.672 c 0.585 -0.025 1.203 0.213 1.663 0.672 l 29.33 29.33 C 76.487 30.459 76.714 31.057 76.714 31.655 z M 37.99 87.664 c 0 0.185 0.15 0.335 0.335 0.335 h 13.351 c 0.185 0 0.335 -0.15 0.335 -0.335 V 28.641 l 12.691 12.691 c 0.131 0.131 0.344 0.131 0.475 0 l 9.44 -9.44 c 0.131 -0.131 0.131 -0.344 0 -0.475 L 45.289 2.088 C 45.211 2.01 45.109 1.997 45.038 2 c -0.147 -0.003 -0.249 0.011 -0.327 0.09 L 15.383 31.418 c -0.131 0.131 -0.131 0.344 0 0.475 l 9.44 9.44 c 0.131 0.131 0.343 0.131 0.474 0 L 37.99 28.641 V 87.664 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/>
</g>
</svg>
`;

    //================================== CSV Parsing =========================================
    function BADLY_PARSE_QUOTED_CSV_LINE(line){
        if(!(!!line)){return;}

        const outputAr = [];
        let inPart = false
        let currentPart = "";

        line += ',';
        let i = 0;
        const l = line.length;
        while(i < l){
            const chr = line.charAt(i);
            const nextChr = line.charAt(i+1);;

            switch(chr){
                case '"':
                    if(!inPart){
                         inPart = true;
                    }else{
                        //If we are in a part and the next character after the current double quote is a double qutoe,
                        //then the double quote is escaped and should be considered a single double quote
                        if(nextChr === '"'){
                            i++; //Skip the next character
                            currentPart += chr;
                        }else{
                            inPart = false;
                        }
                    }
                    break;
                case ',':
                    if(inPart){
                        currentPart += chr;
                    }else{
                        outputAr.push(currentPart);
                        currentPart = '';
                    }
                    break;
                default:
                    if(inPart){currentPart += chr;}
                    break;
            }
            i++;
        }
        return outputAr;
    }
    function BADLY_ITERATE_QUOTED_CSV(data){
        const lines = [];
        const l = data.length;
        let i = 0;
        let currentLine = '';
        let isInPart = false;
        let isEscapedQuote = false;
        //let previousChar = undefined;
        while(i < l){
            const currentChar = data.charAt(i);
            const nextChar = data.charAt(i+1);
            //const nextNextChar = data.charAt(i+2);

            switch(currentChar){
                case '"':
                    if(isEscapedQuote){
                        isEscapedQuote = false;
                    }else{
                        if(!isInPart){
                            isInPart = true;
                        }else{
                            if(nextChar == '"'){
                                isEscapedQuote = true;
                            }else{
                                isInPart = false;
                            }
                        }
                    }
                    currentLine += currentChar;
                    break;
                case '\r':
                case '\n':
                    if(isInPart){
                        currentLine += currentChar;
                    }else{
                        lines.push(BADLY_PARSE_QUOTED_CSV_LINE(currentLine));
                        currentLine = '';
                        while(/\s/.test(data.charAt(i))){
                              i++
                        }
                        i--;
                    }
                    break;
                default:
                    currentLine += currentChar;
                    break;
            }

            i++;
            //previousChar = currentChar;
        }
        return lines;
    }
    function BADLY_PARSE_CSV(data){
        const lines = BADLY_ITERATE_QUOTED_CSV(data);
        const headers = lines[0];
        const output = [];

        output.push(headers);

        for(var i = 1; i < lines.length; i++){
            const lineParts = lines[i];

            if(!!lineParts){
                if(lineParts.length != headers.length){
                    console.log('Oh no');
                }
                for(var j = 0;j < headers.length; j++){
                    lineParts[headers[j]] = lineParts[j]
                }
                output.push(lineParts);
            }
        }
        return output;
    }
    //========================================================================================

    function CSV_2_TABLE(parsed, html_headers){
        const rx = /\{(.+?)\}/ig;
        const isWhiteRx = /^\s+$/;
        const isNonGuest = /^\s*Guest\s*#\s*\d+\s*$/;

        const outputArray = [];
        outputArray.push(parsed[0]);

        for(var i = 1; i < parsed.length; i++){
            const line = parsed[i];
            const output_row = [];

            for(var hh = 0; hh < html_headers.length; hh++){
                let headerVal = html_headers[hh][1];
                let headerValues = [];
                let processedHeaderValues = [];
                if(Array.isArray(headerVal)){
                    headerValues = headerVal;
                }else{
                    headerValues = [['',headerVal]];
                }

                for(var j = 0; j < headerValues.length; j++){
                    let workingValue = headerValues[j][1]
                    const matches = workingValue.matchAll(rx);
                    for(const M of matches){
                        const v = line[M[1]];
                        if(v === undefined){
                            workingValue = workingValue.replace(M[0],'');
                        }else{
                            workingValue = workingValue.replace(M[0],v);
                        }
                    }

                    if((workingValue != '') && (!isWhiteRx.test(workingValue)) && (!isNonGuest.test(workingValue))){
                        processedHeaderValues.push([headerValues[j][0],workingValue]);
                    }
                }
                if(processedHeaderValues.length === 1){
                    headerVal = processedHeaderValues[0][1];
                }else{
                    headerVal = '';
                    for(const hv of processedHeaderValues){
                        headerVal += (hv[0] + ':&nbsp' + hv[1] + '<br>');
                    }
                }

                output_row.push(headerVal);
            }
            outputArray.push(output_row);

        }
        return outputArray;
    }
    function TABLE_REMOVE_DUPLICATES(table){
        const l = table.length;
        const m = table[0].length;
        const cleaned = [];
        let test = false;
        for(var i = 1; i < l; i++){
            const a = table[i][0];
            searchCleaned: {
                for(var j = 0; j < cleaned.length; j++){
                    test = false;
                    if(cleaned[j][0] === a){
                        test = true;
                        for(var k = 1; k < m; k++){
                            test = (test && (table[i][k] === cleaned[j][k]));
                        }
                        if(test){break searchCleaned;} //If we've found a dupicate we can exit early.
                    }
                }
            }
            if(!test){
                cleaned.push(table[i]);
            }
        }

        return cleaned;
    }
    function CSV_2_HTML(data, headers){
        const table = TABLE_REMOVE_DUPLICATES(CSV_2_TABLE(BADLY_PARSE_CSV(data),headers));

        let out = '<table><thead><tr>';
        for(var h = 0; h < headers.length; h++){
            out += ('<th>' + headers[h][0] + '</th>');
        }
        out += '</tr></thead><tbody>';

        for(var i = 1; i < table.length; i++){
            out += '<tr>';
            const row = table[i];
            for(const cell of row){
                out += ('<td>' + cell + '</td>');
            }
            out += '</tr>';
        }
        out += '</tobody></table>';

        return out;
    }

    //======================== ConvertDailyManifest_2_OvernightReport ========================

    //*******************************
    //* Request the export form then pass the results to step 2.
    //*******************************
    function ConvertDailyManifest_2_OvernightReport(){
        $.get({
            url:'https://cat.checkfront.co.uk/get/export/',
            data:window.location.search.substring(1),
            success:ConvertDailyManifest_2_OvernightReport_2,
            dataType:'html'
        });
    }
    //*******************************
    //* Change some the form values and use the form data to request the export CSV.
    //* Pass the CSV to step 3
    //*******************************
    function ConvertDailyManifest_2_OvernightReport_2(data, result, xhr){
        const $frame = $(data);
        const $form = $frame.find('#export_form').eq(0);

        $form.find('#rpt_name').val('Overnight Report');
        $form.find('#format').val('csv');
        $form.find('#columns').val('*');
        $form.find('#destination').val('desktop');

        const formData = $form.serialize();

        $.get({
                url:'https://cat.checkfront.co.uk/booking/manifest/',
                data: formData,
                success:ConvertDailyManifest_2_OvernightReport_3,
                dataType:'text'
            });

    }
    //*******************************
    //* Parse the CSV and convert it to a HTML table.
    //* Hide the main content of the page and replace with generated table.
    //*******************************
    function ConvertDailyManifest_2_OvernightReport_3(data,result,XHR){
        const HTML = CSV_2_HTML(data, OVERNIGHT_HEADERS);

        const $table = $(HTML);
        $table.css({
            'width':'100%',
            'border':'1px solid black'
        });
        $table.find('thead').css({
            'border-bottom':'2px solid black'
        });
        $table.find('tbody').css({

        });
        $table.find('th').css({
            'border':'2px solid black'
        });
        $table.find('td').css({
            //'border-left':'1px solid gray'
        });
        $table.find('td:first').css({
            //'border-left':'none'
        });
        $table.find('tr').css({
            'border-top':'1px solid black'
        });

        const $page = getMainPageContentAfterHeaders();
        $page.children().hide(); //Emptying the div breaks things
        $page.append($table);
    }
    //========================================================================================


    //========================================================================================

    function getContentDiv(){
        return $('#content');
    }
    function getMainPageContentAfterHeaders(){
        const $content = getContentDiv().children().eq(0);
        return $content.children('div.page-lg').eq(0);
    }
    function findPageTitle(){
        const $content = getContentDiv().children().eq(0);
        const $titleHeaders = $content.find('div[class^="PageHeader"][class*="Title"]');
        const $pagelg = $titleHeaders.find('div.page-lg');
        const $title = $pagelg.find('div[class^="Title"]');

        return $title.eq(0);
    }
    function findPrimaryActionsDiv(){
        const $content = getContentDiv().children().eq(0);
        const $actionBar = $content.find('div[class^="PageHeader"][class*="ActionsBar"]');
        const $pagelg = $actionBar.find('div.page-lg');
        const $primaryActions = $pagelg.find('div[class^="PageHeader"][class*="primaryActions"]');

        return $primaryActions.eq(0);
    }
    function findSecondaryActionsDiv(){
        const $content = getContentDiv().children().eq(0);
        const $actionBar = $content.find('div[class^="PageHeader"][class*="ActionsBar"]');
        const $pagelg = $actionBar.find('div.page-lg');
        const $primaryActions = $pagelg.find('div[class^="PageHeader"][class*="secondaryActions"]');

        return $primaryActions.eq(0);
    }

    //==================================== AddButtons etc =====================================
    //*******************************
    //* Adds an "Overnight Report" button to the daily manifest report.
    //* The overnight report uses the daily manifest export to generate a simplified table.
    //*******************************
    function AddDailyManifestReportButtons(){
        function onClick(event){
            event.preventDefault();
            ConvertDailyManifest_2_OvernightReport();
            findPageTitle().text('Overnight Report'); //Change page title

            //Find the actions bar where the date selectors exist
            const $actions = findPrimaryActionsDiv();
            const $text = $actions.find('div[class^="Text__Text_"]').eq(0); //This is the text version of the date(s) selected.
            $actions.empty(); // Remove all actions.
            $actions.append($text); //Add back the text version.
            $text.show(); //Make sure the text version is shown.
        }
        (function AddDesktopButton(){
            if($('#overnightButtonDesktop').length != 0){console.log('#overnightButtonDesktop already exists'); return}

            const $newBookingButton = $('#bookingButtonDesktop');
            if($newBookingButton.length !== 1){console.log('#bookingButtonDesktop not found'); return}

            const $cloneButton = $newBookingButton.clone(true, false);

            $cloneButton.attr({'id':'overnightButtonDesktop',
                               'href':'about:blank'});
            $cloneButton.css({'margin-right':'10px'});
            $cloneButton.children('span').text('Overnight Report');
            $cloneButton.insertBefore($newBookingButton);
            $cloneButton.on('click',onClick);
        })();
        (function AddDesktopButton(){
            //'bookingButtonMobile
            if($('#overnightButtonMobile').length != 0){console.log('#overnightButtonMobile already exists'); return}

            const $newBookingButton = $('#bookingButtonMobile');
            if($newBookingButton.length !== 1){console.log('#bookingButtonMobile not found'); return}

            const $cloneButton = $newBookingButton.clone(true, false);

            $cloneButton.attr({'id':'overnightButtonMobile',
                               'href':'about:blank',
                               'title':'Overnight Report'});
            $cloneButton.css({'margin-right':'10px'});

            const $iconSpan = $cloneButton.find('span[class^="Icon"]');
            $iconSpan.empty();
            $iconSpan.html(MOON_ICON);
            $cloneButton.insertBefore($newBookingButton);
            $cloneButton.on('click', onClick);
        })();
    }

    //*******************************
    //* The guest list is very hard to manage, needing to scroll up and down all the time.
    //* Adds listeners to key buttons to automatically scroll the page up and down to the right places
    //*******************************
    function AddScrollHelpersToGuestPages(){
        const QUEUENAME = 'flashQueue';

        // An arrow pointing up to the guest data that is made to flash
        // when a guest is clicked on
        let $flashDiv = $('#flashing-arrow-thing');

        function flashArrow(event){
            const $flasher = $('#flashing-arrow-thing');
            const timeChain = [150,200,250,300,250,400,450,500];
            console.log('FLASH');

            $flasher.stop(true);
            function doAnimation(elm, timeChain){
                let e = elm;
                for(var i = 0; i < timeChain.length; i++){
                    if((i % 2) === 0){
                        e = e.fadeOut(timeChain[i]);
                    }else{
                        e = e.fadeIn(timeChain[i]);
                    }
                }
                return e;
            }
            doAnimation($flasher,timeChain);
        }
        function stopFlashArrowAndHide(){
            const $flasher = $('#flashing-arrow-thing');
            $flasher.stop(true);
            $flasher.hide();
        }

        if($flashDiv.length === 0){
            $flashDiv = $(`<div id="flashing-arrow-thing" title="Scroll to guest data">${UP_ARROW}</div>`);
            $flashDiv.css({
                position:'fixed',
                height:'256px',
                width:'256px',
                top: '100vh',
                left: '100vw',
                transform:'translate(-100%,-100%)',
                display:'none',
                cursor:'pointer'
            });
            $('body').eq(0).append($flashDiv);
            $flashDiv.on('click', stopFlashArrowAndHide);
            $(document).on('scroll', stopFlashArrowAndHide);
            addScrollTo('flashing-arrow-thing','guest-name');
        }



        //Add an onclick function that scrolls the element with id "elementId"
        //into view.  if no elementId is specified or can't be found, then scroll
        //to the top of the page.
        function addScrollTo(id,elementId){
            const $n = $(`#${id}`);
            if($n.length !== 1){console.log(`#${id} not found`); return;}

            if($n.data('clickon') === true){console.log(`#${id} already has click function applied`);return;}

            $n.data('clickon',true);
            $n.on('click',()=>{
                $flashDiv.clearQueue().css({opacity:1}).fadeOut(250);
                let $el;
                if((elementId !== undefined) && (elementId !== '')){
                    $el = $(`#${elementId}`);
                }
                if(($el !== undefined) && ($el.length === 1)){
                    $el[0].scrollIntoView();
                }else{
                    window.scrollTo(0,0);
                }
            });
        }
        addScrollTo('add-guest', 'guest-name');
        addScrollTo('item-submit', 'guest-name');
        addScrollTo('guest-info-submit', 'guest-list')


        //Find the guest table and its rows
        const $table = $('#guest-table');
        const $rows = $table.find('tr[id^="guest"]');
        if($rows.count <= 0){console.log('no guest table / rows'); return;}


        //For all the rows in the guest table:
        //If an onclick function has not been added,
        //Add an onclick function that flashes the up arrow.
        for(const row of $rows){
            const $row = $(row);

            if($row.data('clickon') !== true){
                $row.data('clickon',true);
                $row.on('click',flashArrow);
            }
        }
    }


    //====================================== AddButtons ======================================

    function DoMods(){
        console.log(window.location);
        switch(true){
            case /booking\/manifest/.test(window.location):
                console.log('AddDailyManifestReportButtons');
                AddDailyManifestReportButtons();
                break;
            case /calendar\/customer/.test(window.location):
                console.log('customer calendar - NOP');
                break;
            case /booking\/[A-Z]{4}-\d{6}\/guests/.test(window.location):
                console.log('AddScrollHelpersToGuestPages');
                AddScrollHelpersToGuestPages();
                break;
        }

    }
    //Try and do any mods immediatly, we then watch for mutations on the content div to reapply as needed
    DoMods();

    //=================================== Observer set up= ===================================
    function ProcessMutations(mutations, observer){
        console.log({mutations:mutations,observer:observer});
        DoMods();
    }
    const observerOptions = {
            subtree: true,
            attributes: false,
            characterData: false,
            childList: true
        };
    const myObserver = new MutationObserver(ProcessMutations);
    myObserver.observe($('#content')[0],observerOptions);
    //========================================================================================
})($J_Master);



/*
    function ShowDialogNotBookingPageForCalendar(event){
        event.preventDefault();
        const $a = $(this);
        const href = $a.attr('href');
        const D = href.match(/D=(\d{8})/)[1];
        const item_id = href.match(/filter_item_id=(\d+)/)[1];

        console.log({'D':D,'item_id':item_id});
    }

    function tweakCalendarDateBookingLinks(){
        const $content = $('#tables-container');;
        const $anchors = $content.find('a[href^="/booking/reserve/?"]');
        console.log($anchors.length);
        for(const a of $anchors){
            const $a = $(a);
            if(!(!!$a.data('marked'))){
                $a.data('marked',true);
                $a.css({color:'red'});

                $a.on('click',ShowDialogNotBookingPageForCalendar);
            }
        }
    }

    const $divider = $('<li class="divider"></li>');
    const $reportButton = $('<li><a href="about:blank">Overnight Report</a></li>');
    $reportButton.on('click', (event)=>{
        event.preventDefault();
        DoCsvProcess();
    });

    (function AddMenuItems_Main(){
        const $navTab = $('#reports-nav-tab');
        if($navTab.length === 0){console.log('#reports-nav-tab not found'); return}

        const $navUl = $navTab.children('UL');
        if($navTab.length !== 1){console.log('UL not found'); return}

        const $lastMenuItem = $navUl.children('LI').last();

        $lastMenuItem.before($reportButton.clone(true,true));
        $lastMenuItem.before($divider.clone(true,true));
    })();
    (function AddMobileMenuItems(){
        const $navMenuItem = $('a#main-nav-menu-reports');
        if($navMenuItem.length !== 1){console.log('a#main-nav-menu-reports not found'); return}

        const $navMenuParent = $navMenuItem.parent();
        const $navUl = $navMenuParent.children('UL');
        if($navUl.length !== 1){console.log('UL not found'); return}

        const $lastMenuItem = $navUl.children('LI').last();

        $lastMenuItem.before($reportButton.clone(true,true));
        $lastMenuItem.before($divider.clone(true,true));
    })();

*/
