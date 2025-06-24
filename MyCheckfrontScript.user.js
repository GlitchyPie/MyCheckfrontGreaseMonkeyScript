// ==UserScript==
// @name         Checkfront Overnight Report Helper Script
// @namespace    http://cat.checkfront.co.uk/
// @version      2025-06-24T14:46
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

    //                     Column Header,  Column Value
    const OVERNIGHT_HEADERS = [['Room', '{Product Name}'],
                               ['Name', [['Booking', '{First name} {Surname}'],['Guest','{Guest First Name} {Guest Last Name}']]],
                               ['Checkin Status',[['Booking','{Check In / Out}'],['Guest','{Guest Check In Status}']]],
                               ['Accessability needs','{Accessibility requirements}']
                              ];

/*
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
    function ConvertDailyManifest_2_OvernightReport(){
        $.get({
            url:'https://cat.checkfront.co.uk/get/export/',
            data:window.location.search.substring(1),
            success:ConvertDailyManifest_2_OvernightReport_2,
            dataType:'html'
        });
    }
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

        $page.empty(); //This breaks stuff!
        //$page.append($controls);

        $page.append($table);
    }
    //========================================================================================


    function getContentDiv(){
        return $('#content').children().eq(0);
    }
    function getMainPageContentAfterHeaders(){
        const $content = getContentDiv();
        return $content.children('div.page-lg').eq(0);
    }
    function findPageTitle(){
        const $content = getContentDiv();
        const $titleHeaders = $content.find('div[class^="PageHeader"][class*="Title"]');
        const $pagelg = $titleHeaders.find('div.page-lg');
        const $title = $pagelg.find('div[class^="Title"]');

        return $title.eq(0);
    }
    function findPrimaryActionsDiv(){
        const $content = getContentDiv();
        const $actionBar = $content.find('div[class^="PageHeader"][class*="ActionsBar"]');
        const $pagelg = $actionBar.find('div.page-lg');
        const $primaryActions = $pagelg.find('div[class^="PageHeader"][class*="primaryActions"]');

        return $primaryActions.eq(0);
    }
    function findSecondaryActionsDiv(){
        const $content = getContentDiv();
        const $actionBar = $content.find('div[class^="PageHeader"][class*="ActionsBar"]');
        const $pagelg = $actionBar.find('div.page-lg');
        const $primaryActions = $pagelg.find('div[class^="PageHeader"][class*="secondaryActions"]');

        return $primaryActions.eq(0);
    }


    function AddDailyManifestReportButtons(){
        const $newBookingButton = $('#bookingButtonDesktop');
        if($newBookingButton.length !== 1){console.log('#bookingButtonDesktop not found'); return}

        const $cloneButton = $newBookingButton.clone(true, false);

        $cloneButton.attr({'id':'overnightButtonDesktop',
                           'href':'about:blank'});
        $cloneButton.children('span').text('Overnight Report');
        $cloneButton.insertBefore($newBookingButton);
        $cloneButton.on('click',(event)=>{
            event.preventDefault();
            ConvertDailyManifest_2_OvernightReport();
            findPageTitle().text('Overnight Report');
            const $actions = findPrimaryActionsDiv();
            const $text = $actions.find('div[class^="Text__Text_"]').eq(0);
            $actions.empty();
            $actions.append($text);
            $text.show();

        });
    }
    function AddReportButtons(){
        switch(true){
            case /booking\/manifest/.test(window.location):
                AddDailyManifestReportButtons();
                break;
        }

    }
    AddReportButtons();


    //=================================== Observer set up= ===================================
    function ProcessMutations(mutations, observer){
        AddReportButtons();
    }
    const observerOptions = {
            subtree: false,
            attributes: false,
            characterData: false,
            childList: true
        };
    const myObserver = new MutationObserver(ProcessMutations);
    myObserver.observe($('#content')[0],observerOptions);
    //========================================================================================
})($J_Master);
