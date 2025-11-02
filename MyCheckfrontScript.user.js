// ==UserScript==
// @name         Checkfront Overnight Report Helper Script
// @namespace    http://cat.checkfront.co.uk/
// @version      2025-11-02T13:30
// @description  Add additional reporting functions / formats to CheckFront
// @author       GlitchyPies
// @match        https://cat.checkfront.co.uk/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=checkfront.co.uk
// @grant        GM_download
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// ==/UserScript==
const $J_Query = jQuery;
const $J_Master = $J_Query.noConflict(true);

console.log('Hello world');

(function($) {
    'use strict';

    console.log('Running main function...');

    ( //BASED ON: https://stackoverflow.com/questions/4232557/jquery-css-write-into-the-style-tag
        function( $$ ){
            $$.cssStyleSheet={
                insertRule:function(selector,rules,contxt){
                    var context=contxt||document,stylesheet;

                    if(typeof context.styleSheets=='object')
                    {
                        if(context.styleSheets.length)
                        {
                            stylesheet=context.styleSheets[context.styleSheets.length-1];
                        }
                        if(!stylesheet)
                        {
                            if(context.createStyleSheet)
                            {
                                stylesheet=context.createStyleSheet();
                            }
                            else
                            {
                                context.getElementsByTagName('head')[0].appendChild(context.createElement('style'));
                                stylesheet=context.styleSheets[context.styleSheets.length-1];
                            }
                        }
                        if(stylesheet.addRule)
                        {
                            for(var i=0;i<selector.length;++i)
                            {
                                stylesheet.addRule(selector[i],rules);
                            }
                        }
                        else
                        {
                            stylesheet.insertRule(selector.join(',') + '{' + rules + '}', stylesheet.cssRules.length);
                        }
                    }
                },
                createSheet:function(rules,contxt){
                    const context = contxt||document;
                    let stylesheet;
                    if((document.adoptedStyleSheets) && (document.adoptedStyleSheets.push)){
                        stylesheet = new CSSStyleSheet();
                        if(stylesheet.replaceSync){
                            stylesheet.replaceSync(rules);
                        }
                        else if(stylesheet.replace){
                            stylesheet.replace(rules);
                        }
                        else
                        {
                            throw 'No replace function';
                        }
                        document.adoptedStyleSheets.push(stylesheet);
                    }else{
                        stylesheet = document.createElement('style')
                        stylesheet.innerHTML = rules;
                        document.head.appendChild(stylesheet);
                    }
                    return stylesheet;
                }
            };
        }
    )($);

    //================================ Helper functions ======================================

    const CSV = (function(){
        function getCsvExport_generic(url, extra_args){
            const PROMISE = $.Deferred();

            let data;
            if(extra_args instanceof URLSearchParams){
                data = extra_args;
            }else{
                data = new URLSearchParams(window.location.search);
                if(!!extra_args){
                    for(const [key,value] of Object.entries(extra_args)){
                        switch(true){
                            case(Array.isArray(value)):
                                data.delete(key);
                                for(const arValue of value){
                                    data.append(key, arValue);
                                }
                                break;
                            case(DATES.isValid(value)):
                                data.set(key,DATES.toYYYYMMDD(value));
                                break;
                            case(value === undefined):
                                break;
                            default:
                                data.set(key, value);
                        }
                    }
                }
            }

            $.get({
                url:'/get/export/',
                data:data.toString(),
                success:(data_, result_, xhr_,)=>{
                    const $frame = $(data_);
                    const $form = $frame.find('#export_form').eq(0);

                    $form.find('#rpt_name').val(`report`);
                    $form.find('#format').val('csv');
                    $form.find('#columns').val('*');
                    $form.find('#destination').val('desktop');
                    $form.find('#iso_dates').prop('checked',true);

                    const formData = $form.serialize();

                    $.get({
                        url:url,
                        data: formData,
                        success: (data__, result__, xhr__)=>PROMISE.resolve(data__, result__, xhr__, formData),
                        dataType:'text'
                    });
                },
                dataType:'html'
            });

            return PROMISE.promise();
        }

        //================================== CSV Parsing =========================================
        function BADLY_ITERATE_GENERIC_CSV(data, callback){
            const rows = [];
            let row = [];

            const l = data.length;
            let R = 0;
            let i = 0;
            let currentPart = '';
            let isInQuotedPart = false;
            let havePushedLastPart = false;
            let lastChar;

            //let previousChar = undefined;
            while(i < l){
                const currentChar = data.charAt(i);
                const nextChar = data.charAt(i+1);
                havePushedLastPart = false;

                switch(currentChar){
                    case '"':
                        switch(true){
                                //If we've encountered a double quote and we are not already in a quoted section, enter the quoted section
                            case (!isInQuotedPart):
                                isInQuotedPart = true;
                                break;

                                //If the immediatly next charcter is a double quote then the quote is escaped
                            case (nextChar == '"'):
                                currentPart += currentChar;
                                i++; //Skip the escaped double quote
                                break;

                                //In any other case exit the quoted section
                            default:
                                isInQuotedPart = false;
                        }
                        break;
                    case ',':
                        if(isInQuotedPart){
                            currentPart += currentChar
                        }else{
                            row.push(currentPart);
                            currentPart = '';
                        }
                        break;
                    case '\r':
                    case '\n':
                        if(isInQuotedPart){
                            currentPart += currentChar;
                        }else{
                            row.push(currentPart);
                            havePushedLastPart = true;

                            callback(R, row);
                            R++;

                            row = [];
                            currentPart = '';
                            while(/\r|\n/.test(data.charAt(i))){ //Skip all new line characters (including the current one)
                                i++
                            }
                            i--; //Rewind one character
                        }
                        break;
                    default:
                        currentPart += currentChar;
                }
                i++;
            }//Next char
            if(row.length > 0){
                if(!havePushedLastPart){row.push(currentPart);}

                callback(R,row);
                R++;

                row = [];
            }

            return R
        }

        function BADLY_PARSE_CSV(data){
            let headers;
            const output = [];

            function CB(index, row){
                if(index === 0){
                    headers = row;
                    output.push(row);
                }else{
                    const R = row;
                    for(var i=0;i < headers.length; i++){
                        R[headers[i]] = row[i];
                    }
                    output.push(R);
                }
            }

            BADLY_ITERATE_GENERIC_CSV(data, CB);

            return output;
        }

        //================================= CSV converting =======================================

        function TABLE_REMOVE_DUPLICATES(table){
            const l = table.length;
            const m = table[0].length;
            const cleaned = [table[0]];
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

        function CSV_2_TABLE(data,headers){
            return PARSED_2_TABLE(BADLY_PARSE_CSV(data), headers);
        }
        function CSV_2_HTML(data,headers){
            return TABLE_2_HTML(TABLE_REMOVE_DUPLICATES(CSV_2_TABLE(data, headers)));
        }

        function PARSED_2_TABLE(parsed, headers){
            const rx = /\{(.+?)\}/ig;
            const isWhiteRx = /^\s+$/;
            const isNonGuest = /^\s*Guest\s*#\s*\d+\s*$/;

            const outputArray = [];

            outputArray.push(headers.map((h)=>{
                if(Array.isArray(h)){
                    return h[0];
                }else{
                    return h;
                };
            }));

            for(var i = 1; i < parsed.length; i++){ //For each row in our data
                const line = parsed[i];
                const output_row = [];

                for(var j = 0; j < headers.length; j++){ //For each header
                    let header = headers[j]; //This is our header entry, it should be an array: ['<HEADER TITLE>',<HEADER VALUE>]
                    if(!Array.isArray(header)){ //If it's not an array, make it one with an empty title
                        header = ['', header];
                    }

                    //const headerTitle = header[0];
                    let headerValue = header[1];
                    if(!Array.isArray(headerValue)){ //Header values may be an array of values, if it's not already make it an array.
                        headerValue = [headerValue];
                    }

                    let processedHeaderValues = [];
                    for(var k=0; k < headerValue.length; k++){ //Go through each header value
                        const hv = headerValue[k];
                        let workingHeaderLabel = '';
                        let workingHeaderValue = '';

                        if(Array.isArray(hv)){ //If our header value is an array it is defining a label and a value
                            workingHeaderLabel = hv[0];
                            workingHeaderValue = hv[1];
                        }else{
                            workingHeaderValue = hv;
                        }

                        if(workingHeaderValue instanceof Function){
                            workingHeaderValue = workingHeaderValue(i, j, k, hv, line);
                        }else if(typeof workingHeaderValue === 'string' || workingHeaderValue instanceof String){
                            const matches = workingHeaderValue.matchAll(rx);
                            for(const M of matches){
                                const v = line[M[1]];
                                if(v === undefined){
                                    workingHeaderValue = workingHeaderValue.replace(M[0],'');
                                }else{
                                    workingHeaderValue = workingHeaderValue.replace(M[0],v);
                                }
                            }
                        }

                        if((workingHeaderValue != '') && (!isWhiteRx.test(workingHeaderValue)) && (!isNonGuest.test(workingHeaderValue))){
                            processedHeaderValues.push([workingHeaderLabel,workingHeaderValue]);
                        }

                    } //End for each header value.

                    let headerVal = '';
                    if(processedHeaderValues.length === 1){ //If we only have 1 processed header value we don't show it with a label or new line.
                        headerVal = processedHeaderValues[0][1];
                    }else{
                        //If we have multiple processed header values, we prepend the label to the header value before appending it top the output,
                        //if there is no label, then only append the value
                        for(const hv of processedHeaderValues){
                            if(hv[0] !== ''){
                                headerVal += (hv[0] + ':&nbsp' + hv[1] + '<br>');
                            }else{
                                headerVal += (hv[1] + '<br>');
                            }
                        }
                    }

                    output_row.push(headerVal);
                } //End for each header
                outputArray.push(output_row);

            }

            return outputArray;
        }
        function PARSED_2_HTML(parsed, headers){
            return TABLE_2_HTML(TABLE_REMOVE_DUPLICATES(PARSED_2_TABLE(parsed,headers)));
        }
        function TABLE_2_HTML(table){
            const headers = table[0];

            let out = '<table><thead><tr>';
            for(var h = 0; h < headers.length; h++){
                out += ('<th>' + headers[h] + '</th>');
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

        function TABLE_2_QUOTEDCSV(table){
            let csv = "";
            for(const row of table){
                for(const cell of row){
                    if((cell instanceof String) || (typeof cell === 'string')){
                        csv += `"${cell.replace('"','""')}",`;
                    }else if(cell === undefined){
                        csv += '"",';
                    }else{
                        csv += `"${cell}",`;
                    }
                }
                csv = csv.slice(0,-1) + '\r\n';
            }
            return csv.slice(0,-2);
        }

        return {
            export:getCsvExport_generic,

            parse:BADLY_PARSE_CSV,
            iterate:BADLY_ITERATE_GENERIC_CSV,

            parseToTable:CSV_2_TABLE,
            parseToHTML:CSV_2_HTML,

            toTable:PARSED_2_HTML,
            toHTML:PARSED_2_HTML,

            tableToCsv:TABLE_2_QUOTEDCSV,
        }
    })();

    const DATES = (function(){
        function toYYYYMMDD(dte){
            const YYYY= `${dte.getFullYear()}`;
            const MM = `${dte.getMonth() + 1}`.padStart(2,'0');
            const DD = `${dte.getDate()}`.padStart(2,'0');

            return `${YYYY}-${MM}-${DD}`;
        }

        function daysBetween(startDate, endDate) {
            function treatAsUTC(date) {
                const result = new Date(date);
                result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
                return result;
            }
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
        }

        function isValidDate(ob){
            if(Object.prototype.toString.call(ob) === '[object Date]'){
                if(!isNaN(ob)){
                    return true
                }
            }
            return false;
        }

        return {
            toYYYYMMDD:toYYYYMMDD,
            daysBetween:daysBetween,
            isValid:isValidDate,
        }
    })();

    const PAGEUTILS = (function(){
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

        return {
            $contentDiv:getContentDiv,
            $mainPageContentAfterHeaders:getMainPageContentAfterHeaders,
            $pageTitle:findPageTitle,
            $primaryActionsDiv:findPrimaryActionsDiv,
            $secondaryActionsDiv:findSecondaryActionsDiv,
        }
    })();

    const SPINNER = (function(){
        //https://github.com/n3r4zzurr0/svg-spinners
        const MY_SPINNER = `
<svg width="120" height="120" stroke="#000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g><circle cx="12" cy="12" r="9.5" fill="none" stroke-width="3" stroke-linecap="round"><animate attributeName="stroke-dasharray" dur="1.5s" calcMode="spline" values="0 150;42 150;42 150;42 150" keyTimes="0;0.475;0.95;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" repeatCount="indefinite"/><animate attributeName="stroke-dashoffset" dur="1.5s" calcMode="spline" values="0;-16;-59;-59" keyTimes="0;0.475;0.95;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" repeatCount="indefinite"/></circle><animateTransform attributeName="transform" type="rotate" dur="2s" values="0 12 12;360 12 12" repeatCount="indefinite"/></g></svg>
`;
        const $MYSPINNER = $('<div id="my-spinner"><div>' + MY_SPINNER + '</div></div>');

        function showSpinner(){
            if($('#my-spinner').length === 0){
                const $page = $('#page');
                $page.prepend($MYSPINNER);
            }
            $MYSPINNER.show();
        }
        function hideSpinner(){
            if($('#my-spinner').length !== 0){
                $MYSPINNER.hide();
            }
        }

        return {
            show:showSpinner,
            hide:hideSpinner,
        }
    })();

    const DAILYMANIFEST = (function(){
        let needRevert = false;

        function replaceDailyManifestWith($element, title){
            const $pageTitle = PAGEUTILS.$pageTitle()
            if(needRevert === false){
                $pageTitle.data('html',$pageTitle.html());
            }
            $pageTitle.text(title); //Change page title

            if(needRevert === false){
                //Find the actions bar where the date selectors exist and hide
                //any nodes that should be hidden when printing.
                const $actions = PAGEUTILS.$primaryActionsDiv();
                const $printViewHidden = $actions.find('.printViewHidden');
                $printViewHidden.hide();

                //Display the text version.
                const $text = $actions.find('div[class^="Text__Text_"]').eq(0); //This is the text version of the date(s) selected.
                $text.show(); //Make sure the text version is shown.
            }

            const $page = PAGEUTILS.$mainPageContentAfterHeaders();
            if(needRevert === false){
                $page.data('previouslyVisable', $page.children(':visible'));
                $page.data('previouslyVisable').hide(); //Emptying the div breaks things
            }else{
                $page.data('element').remove();
            }
            $page.data('element', $element);
            $page.append($element);

            needRevert = true;
        }
        function revertDailyManifest($element){
            if(needRevert === false){return;}

            const $actions = PAGEUTILS.$primaryActionsDiv();
            const $printViewHidden = $actions.find('.printViewHidden');
            $printViewHidden.show();

            const $page = PAGEUTILS.$mainPageContentAfterHeaders();
            $page.data('element').remove();
            $page.data('previouslyVisable').show();
            $page.removeData(['previouslyVisable', 'element']);

            //Display the text version.
            const $text = $actions.find('div[class^="Text__Text_"]').eq(0); //This is the text version of the date(s) selected.
            $text.hide(); //Make sure the text version is hidden.

            const $pageTitle = PAGEUTILS.$pageTitle()
            $pageTitle.html($pageTitle.data('html')); //Change page title
            $pageTitle.removeData('html');
            needRevert = false;
        }

        function getDailyManifestExport_Checkins(dte, args){
            const a = Object.assign(args || {}, {timeframe:'starting',hideCanceled:'true',date:dte});
            return CSV.export('/booking/manifest/', a);
        }
        function getDailyManifestExport_Checkouts(dte, args){
            const a = Object.assign(args || {}, {timeframe:'ending',hideCanceled:'true',date:dte});
            return CSV.export('/booking/manifest/', a);
        }
        function getDailyManifestExport_Ongoing(dte, args){
            const a = Object.assign(args || {}, {timeframe:'ongoing',hideCanceled:'true',date:dte});
            return CSV.export('/booking/manifest/', a);
        }

        //-------- utility functions for table generation
        const MAX_LOOK_AHEAD = 30;

        function ManifestRow_SingleTwinDouble(row){
            switch(true){
                case(row['Upgrade to a Twin room'] == '1'):
                    return 'Twin';
                case(row['Upgrade to a Double room'] == '1'):
                    return 'Double';
                case(row['Single'] == '1'):
                    return 'Single';
                default:
                    return `${row['No of Guests']} beds`;
            }
        }
        function ManifestRow_RoomType(row){
            const status = row.Status.toLowerCase();
            switch(true){
                case(status == 'trustee / vip'):
                    return `VIP!! ${ManifestRow_SingleTwinDouble(row)}`;
                    break;
                case(status == 'vols'):
                    return `${ManifestRow_SingleTwinDouble(row)} (VOL)`;
                    break;
                case(status == 'gse tutor'):
                    return 'GSE (Tutor)';
                    break;
                case(status == 'm\'arch 5th yrs'):
                    return 'GSE (Student)';
                    break;
                case(status == 'gse'):
                    return 'GSE (Student)';
                    break;
                case(status == 'gse provisional'):
                    return 'GSE (Unalocated?)';
                    break;
                case(status == 'staff'):
                    return `${ManifestRow_SingleTwinDouble(row)} (Staff)`;
                    break;
                case(status == 'schools & groups'):
                    return `${ManifestRow_SingleTwinDouble(row)} (Sch'l / group)`;
                    break;
                case(status == 'prov schools & group'):
                    return `${ManifestRow_SingleTwinDouble(row)} (Provisional Sch'l / group)`;
                    break;
                case(status == 'engagement'):
                    return `${ManifestRow_SingleTwinDouble(row)} (Engagement group)`;
                    break;
                case(status == 'prov engagement'):
                    return `${ManifestRow_SingleTwinDouble(row)} (Provisional engagement group)`;
                    break;
                case(status == 'sc'):
                    return `${ManifestRow_SingleTwinDouble(row)} (Short Course)`;
                    break;
                default:
                    return ManifestRow_SingleTwinDouble(row);
                    break;
            }
        }

        function ManifestRow_GetDaysTillNextCheckIn(row){
            function getDate(row,start_end){
                const d = row[`${start_end} Date`];
                const t = row[`${start_end} Time`];
                switch(true){
                    case(start_end == 'Start'):
                        if(t == ''){
                            return new Date(d);
                        }else{
                            return new Date(`${d} ${t}`);
                        }
                        break;
                    case(start_end == 'End'):
                        if(t == ''){
                            var k = new Date(d);
                            k.setDate(k.getDate()+1);
                            return k
                        }else{
                            return new Date(`${d} ${t}`);
                        }
                        break;
                    default:
                        throw Error('Invalid start_end value');
                }
            }

            if(!(!!row.Next)){
                return -1;
            }

            const cod = getDate(row, 'End');
            const cid = getDate(row.Next, 'Start');

            return Math.trunc(DATES.daysBetween(cod, cid));
        }
        function ManifestRow_RoomType_next(row){
            if(!!row.Next){
                return ManifestRow_RoomType(row.Next);
            }else{
                return '';
            }
        }
        function ManifestRow_Accessability_next(row){
            if(!!row.Next){
                return row.Next['Accessibility requirements'];
            }else{
                return '';
            }
        }

        function ManifestRow_DaysTillNext(row){
            const days = ManifestRow_GetDaysTillNextCheckIn(row);
            switch(true){
                case (days < 0):
                    return `Nothing in the next ${MAX_LOOK_AHEAD} days`;
                case (days == 0):
                    return `Today!`;
                case (days == 1):
                    return `Tomorrow!`;
                case (days > 0):
                    return `${days} days`;
            }
        }
        //--------

        return {
            replaceWith: replaceDailyManifestWith,
            revertReplace: revertDailyManifest,

            export:{
                checkins:getDailyManifestExport_Checkins,
                checkouts:getDailyManifestExport_Checkouts,
                ongoing:getDailyManifestExport_Ongoing,
                generic:(args)=>{return CSV.export('/booking/manifest/',args);},
                row_utils:{
                    singleTwinDouble:ManifestRow_SingleTwinDouble,
                    roomType:ManifestRow_RoomType,
                },
            },

            changeOverReportUtils:{
                max_look_ahead:MAX_LOOK_AHEAD,
                daysTillNext:ManifestRow_DaysTillNext,
                roomTypeNext:ManifestRow_RoomType_next,
                accessabilityReqNext:ManifestRow_Accessability_next,
            }
        }
    })();

    
    const PROGRESS = (function(){
        let $progressBox;
        
        function createProgress(){
            const $p = $('#proooogress');
            if($p.length > 0){
                $progressBox = $p;
            }else{
                $progressBox = $('<div id="proooogress"><h1></h1></div>');
                $('body').append($progressBox);
            }
        }
        function setProgressMessage(message){
            createProgress();
            $progressBox.show();
            $progressBox.find('h1').text(message);
        }
        function hideProgress(){
            createProgress();
            $progressBox.hide();
        }

        return {
            setMessage:setProgressMessage,
            hide:hideProgress,
        }
    })();
    //================================ Constants ======================================

    //                     Column Header,  Column Value(s) [Label,Value]
    const OVERNIGHT_HEADERS = [['Room', '{Product Name}'],
                               ['Name', [['Booking', '{First name} {Surname}'],['Guest','{Guest First Name} {Guest Last Name}']]],
                               ['Checkin Status',[['Booking','{Check In / Out}'],['Guest','{Guest Check In Status}']]],
                               ['Accessability needs','{Accessibility requirements}']
                              ];

    const CHANGEOVER_HEADERS = [['Room', '{Product Name}'],
                                ['Next checkin',(i,j,k,hv,row)=>DAILYMANIFEST.changeOverReportUtils.daysTillNext(row)],
                                ['Single / Twin / Double', (i,j,k,hv,row)=>DAILYMANIFEST.changeOverReportUtils.roomTypeNext(row)],
                                ['Accessability needs',(i,j,k,hv,row)=>DAILYMANIFEST.changeOverReportUtils.accessabilityReqNext(row)]
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

    /*
    changing bed sheet by Gan Khoon Lay from <a href="https://thenounproject.com/browse/icons/term/changing-bed-sheet/" target="_blank" title="changing bed sheet Icons">Noun Project</a> (CC BY 3.0)
    */
    const BED_ICON = `
<svg width="326" height="222.18" version="1.1" viewBox="0 0 326 222.18" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="m43.376 190.66c-3.033 0-5.5-2.467-5.5-5.5v-27.645h-5.876v-87.999c0-2.209-1.792-4-4-4h-24c-2.209 0-4 1.791-4 4v140.67c0 2.209 1.791 4 4 4h24c2.208 0 4-1.791 4-4v-6h179v-13.523z"/><path d="m189.56 58.848c3.948-2.166 8.101-4.635 12.398-7.251 0.152-0.287 0.3-0.566 0.457-0.865 0.77-1.471 1.534-2.925 2.311-4.341-5.946 3.645-11.66 7.127-16.963 10.02 0.319 0.364 0.618 0.748 0.895 1.153 0.312 0.458 0.612 0.882 0.902 1.284z"/><path d="m92.188 134.32c-0.701 0.991-1.393 1.993-2.08 3h-46.732c-1.378 0-2.5 1.121-2.5 2.5v45.334c0 1.379 1.122 2.5 2.5 2.5h167.62v-28.079c-4.971-1.646-9.922-3.351-14.838-5.047-24.058-8.303-48.934-16.888-72.887-16.888-12.415 0-23.689 2.244-34.305 6.846 21.963-34.584 53.021-59.959 79.109-74.689-0.472-0.919-0.816-1.877-1.033-2.853-24.336 13.667-53.005 36.507-74.853 67.376z"/><path d="m287.56 55.102c3.873 29.122 10.442 72.451 19.23 108.55-10.516 4.865-21.587 7.435-33.705 7.832v16.169h10.955c1.378 0 2.5-1.121 2.5-2.5v-12.037c1.006-0.177 2.006-0.37 3-0.58v12.617c0 3.033-2.467 5.5-5.5 5.5h-10.955v13.523h20.913v6c0 2.209 1.791 4 4 4h24c2.208 0 4-1.791 4-4v-71.334c0-2.209-1.792-4-4-4h-18.459c-5.721-28.721-10.128-58.486-13.022-80.258-0.962 0.198-1.947 0.37-2.957 0.514z"/><path d="m221.05 33.546c0.583-0.099 1.132-0.147 1.675-0.147h29.002c1.484-2.674 2.436-5.682 2.721-8.884 4.253-1.267 8.484-2.163 12.662-2.582 0.061-1.034 0.256-2.065 0.592-3.071-4.365 0.37-8.771 1.247-13.188 2.509-0.589-11.902-10.423-21.371-22.472-21.371-12.426 0-22.5 10.073-22.5 22.5 0 4.629 1.399 8.93 3.796 12.506 0.319 0.476 0.659 0.937 1.013 1.386 1.935-1.517 4.125-2.535 6.699-2.846z"/><path d="m205.96 52.587c-2.476 4.73-8.273 15.809-11.523 15.998-0.057-6e-3 -3.06 0.067-9.083-8.768-2.49-3.652-7.468-4.59-11.116-2.103-3.65 2.489-4.592 7.466-2.103 11.117 7.221 10.591 14.498 15.757 22.216 15.756 0.337 0 0.677-0.01 1.016-0.03 8.816-0.513 14.866-7.453 19.633-15.254v140.52c0 6.83 5.537 12.363 12.363 12.363 6.828 0 12.365-5.533 12.365-12.363v-90.272h4.635v90.272c0 6.83 5.537 12.363 12.363 12.363 6.828 0 12.365-5.533 12.365-12.363v-158.05c1.832 0.042 3.641 0.073 5.392 0.073 14.189 0 25.354-1.715 28.064-10.666 2.975-9.819-7.484-17.965-19.229-25.307-3.748-2.341-8.684-1.202-11.024 2.544-2.342 3.747-1.202 8.682 2.544 11.024 4.05 2.531 6.802 4.529 8.664 6.044-3.805 0.366-9.427 0.441-16.819 0.222-1.713-0.051-3.167-0.092-4.229-0.092-0.371 0-0.732 0.034-1.09 0.083h-38.635c-0.459 0-0.907 0.048-1.344 0.124-7.075 0.822-10.964 8.242-15.425 16.766z"/></svg>
`;
    /*
    <a href="https://www.vecteezy.com/free-vector/symbol">Symbol Vectors by Vecteezy</a>
    */
    const CHECKIN_ICON = `
    <svg width="3759.2" height="3657.1" version="1.1" viewBox="0 0 3759.2 3657.1" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="d"/><clipPath id="c"><path d="m2498.9 4410.4c-284.96 0-515.97-20.82-515.97-46.488 0-25.684 231.01-46.492 515.97-46.492 284.95 0 515.97 20.809 515.97 46.492 0 25.668-231.02 46.488-515.97 46.488"/></clipPath><clipPath id="b"><path d="m2498.9 4410.4c-284.96 0-515.97-20.82-515.97-46.488 0-25.684 231.01-46.492 515.97-46.492 284.95 0 515.97 20.809 515.97 46.492 0 25.668-231.02 46.488-515.97 46.488"/></clipPath><radialGradient id="a" cx="0" cy="0" r="281.22" gradientTransform="matrix(1.8347 0 0 .16533 2498.9 4363.9)" gradientUnits="userSpaceOnUse"><stop stop-color="#969797" offset="0"/><stop stop-color="#969897" offset=".0078125"/><stop stop-color="#969898" offset=".011719"/><stop stop-color="#979898" offset=".015625"/><stop stop-color="#979999" offset=".019531"/><stop stop-color="#989999" offset=".023438"/><stop stop-color="#999a9a" offset=".027344"/><stop stop-color="#999a9a" offset=".03125"/><stop stop-color="#999a9a" offset=".035156"/><stop stop-color="#9a9a9b" offset=".039062"/><stop stop-color="#9a9b9b" offset=".042969"/><stop stop-color="#9b9b9b" offset=".046875"/><stop stop-color="#9b9b9c" offset=".050781"/><stop stop-color="#9c9c9c" offset=".054688"/><stop stop-color="#9c9c9d" offset=".058594"/><stop stop-color="#9d9d9d" offset=".0625"/><stop stop-color="#9d9d9d" offset=".066406"/><stop stop-color="#9d9e9d" offset=".070312"/><stop stop-color="#9e9e9e" offset=".074219"/><stop stop-color="#9e9f9e" offset=".078125"/><stop stop-color="#9f9f9f" offset=".082031"/><stop stop-color="#9f9f9f" offset=".085938"/><stop stop-color="#9fa0a0" offset=".089844"/><stop stop-color="#a0a0a0" offset=".09375"/><stop stop-color="#a0a1a1" offset=".097656"/><stop stop-color="#a1a1a1" offset=".10156"/><stop stop-color="#a2a2a2" offset=".10547"/><stop stop-color="#a2a2a2" offset=".10938"/><stop stop-color="#a3a3a3" offset=".11328"/><stop stop-color="#a3a4a3" offset=".11719"/><stop stop-color="#a4a4a4" offset=".12109"/><stop stop-color="#a4a5a4" offset=".125"/><stop stop-color="#a5a5a5" offset=".12891"/><stop stop-color="#a5a6a5" offset=".13281"/><stop stop-color="#a6a6a6" offset=".13672"/><stop stop-color="#a7a7a6" offset=".14062"/><stop stop-color="#a7a7a7" offset=".14453"/><stop stop-color="#a8a8a7" offset=".14844"/><stop stop-color="#a8a8a8" offset=".15234"/><stop stop-color="#a9a9a8" offset=".15625"/><stop stop-color="#a9a9a8" offset=".16016"/><stop stop-color="#a9a9a9" offset=".16406"/><stop stop-color="#aaaaa9" offset=".16797"/><stop stop-color="#aaaaa9" offset=".17188"/><stop stop-color="#abaaa9" offset=".17578"/><stop stop-color="#ababaa" offset=".17969"/><stop stop-color="#acabaa" offset=".18359"/><stop stop-color="#acacab" offset=".1875"/><stop stop-color="#adacab" offset=".19141"/><stop stop-color="#adadac" offset=".19531"/><stop stop-color="#aeadac" offset=".19922"/><stop stop-color="#aeaead" offset=".20312"/><stop stop-color="#aeaead" offset=".20703"/><stop stop-color="#afafae" offset=".21094"/><stop stop-color="#afafae" offset=".21484"/><stop stop-color="#b0b0af" offset=".21875"/><stop stop-color="#b0b0af" offset=".22266"/><stop stop-color="#b0b1b0" offset=".22656"/><stop stop-color="#b1b1b0" offset=".23047"/><stop stop-color="#b1b1b1" offset=".23438"/><stop stop-color="#b1b1b1" offset=".23828"/><stop stop-color="#b2b2b1" offset=".24219"/><stop stop-color="#b2b2b2" offset=".24609"/><stop stop-color="#b3b3b2" offset=".25"/><stop stop-color="#b3b4b3" offset=".25391"/><stop stop-color="#b4b4b3" offset=".26172"/><stop stop-color="#b5b5b4" offset=".26953"/><stop stop-color="#b6b6b5" offset=".27734"/><stop stop-color="#b7b7b6" offset=".28516"/><stop stop-color="#b8b7b7" offset=".29297"/><stop stop-color="#b9b8b8" offset=".30078"/><stop stop-color="#bab9b8" offset=".30859"/><stop stop-color="#bbbab9" offset=".31641"/><stop stop-color="#bcbbba" offset=".32422"/><stop stop-color="#bcbcbb" offset=".33203"/><stop stop-color="#bdbdbb" offset=".33984"/><stop stop-color="#bebebc" offset=".34766"/><stop stop-color="#bfbebd" offset=".35547"/><stop stop-color="#c0bfbd" offset=".36328"/><stop stop-color="#c1c0be" offset=".37109"/><stop stop-color="#c2c1c0" offset=".37891"/><stop stop-color="#c2c2c1" offset=".38672"/><stop stop-color="#c3c2c1" offset=".39453"/><stop stop-color="#c4c3c2" offset=".39844"/><stop stop-color="#c4c3c2" offset=".40234"/><stop stop-color="#c5c4c2" offset=".40625"/><stop stop-color="#c6c5c3" offset=".41016"/><stop stop-color="#c6c6c4" offset=".41797"/><stop stop-color="#c7c6c5" offset=".42578"/><stop stop-color="#c8c7c6" offset=".43359"/><stop stop-color="#c9c8c7" offset=".44141"/><stop stop-color="#cac9c8" offset=".44922"/><stop stop-color="#cbcac9" offset=".45703"/><stop stop-color="#cccbc9" offset=".46484"/><stop stop-color="#cdccca" offset=".47266"/><stop stop-color="#cecdcb" offset=".48047"/><stop stop-color="#cfcecc" offset=".48828"/><stop stop-color="#d0cfcd" offset=".49609"/><stop stop-color="#d0d0ce" offset=".50391"/><stop stop-color="#d1d0cf" offset=".50781"/><stop stop-color="#d1d1cf" offset=".51172"/><stop stop-color="#d2d1d0" offset=".51562"/><stop stop-color="#d2d1d0" offset=".51953"/><stop stop-color="#d3d2d1" offset=".52344"/><stop stop-color="#d3d3d2" offset=".53516"/><stop stop-color="#d4d3d2" offset=".53906"/><stop stop-color="#d4d4d3" offset=".54297"/><stop stop-color="#d5d4d3" offset=".54688"/><stop stop-color="#d5d5d3" offset=".55078"/><stop stop-color="#d6d5d4" offset=".55469"/><stop stop-color="#d6d6d4" offset=".55859"/><stop stop-color="#d7d6d4" offset=".5625"/><stop stop-color="#d7d6d5" offset=".56641"/><stop stop-color="#d8d7d5" offset=".57031"/><stop stop-color="#d8d7d6" offset=".57422"/><stop stop-color="#d9d8d6" offset=".57812"/><stop stop-color="#d9d8d7" offset=".58203"/><stop stop-color="#dad9d8" offset=".58594"/><stop stop-color="#dad9d8" offset=".58984"/><stop stop-color="#dbdad8" offset=".59375"/><stop stop-color="#dbdad9" offset=".59766"/><stop stop-color="#dcdbd9" offset=".60156"/><stop stop-color="#dcdbda" offset=".61328"/><stop stop-color="#dddcda" offset=".61719"/><stop stop-color="#dddcdb" offset=".62109"/><stop stop-color="#dddddb" offset=".625"/><stop stop-color="#dededc" offset=".62891"/><stop stop-color="#dfdfdd" offset=".63672"/><stop stop-color="#e0dfde" offset=".64453"/><stop stop-color="#e1e0df" offset=".65234"/><stop stop-color="#e1e1e0" offset=".66016"/><stop stop-color="#e2e2e1" offset=".66797"/><stop stop-color="#e2e3e2" offset=".67578"/><stop stop-color="#e3e4e2" offset=".68359"/><stop stop-color="#e4e4e3" offset=".69141"/><stop stop-color="#e5e5e4" offset=".69922"/><stop stop-color="#e6e6e5" offset=".70703"/><stop stop-color="#e7e7e5" offset=".71484"/><stop stop-color="#e7e8e6" offset=".72266"/><stop stop-color="#e8e9e7" offset=".73047"/><stop stop-color="#e9eae8" offset=".73828"/><stop stop-color="#eaebea" offset=".74609"/><stop stop-color="#ebebea" offset=".76172"/><stop stop-color="#ececeb" offset=".76562"/><stop stop-color="#ececeb" offset=".76953"/><stop stop-color="#ededec" offset=".77344"/><stop stop-color="#ededec" offset=".77734"/><stop stop-color="#ededed" offset=".78125"/><stop stop-color="#edeeed" offset=".78516"/><stop stop-color="#eee" offset=".78906"/><stop stop-color="#eee" offset=".79297"/><stop stop-color="#efefef" offset=".79688"/><stop stop-color="#efefef" offset=".80078"/><stop stop-color="#f0f0ef" offset=".80469"/><stop stop-color="#f0f0f0" offset=".80859"/><stop stop-color="#f1f0f0" offset=".8125"/><stop stop-color="#f1f1f1" offset=".81641"/><stop stop-color="#f2f2f2" offset=".82422"/><stop stop-color="#f3f3f3" offset=".83203"/><stop stop-color="#f4f4f4" offset=".83984"/><stop stop-color="#f5f5f5" offset=".84766"/><stop stop-color="#f6f7f7" offset=".86328"/><stop stop-color="#f7f8f8" offset=".87891"/><stop stop-color="#f8f8f8" offset=".89062"/><stop stop-color="#f8f8f8" offset=".89453"/><stop stop-color="#f9f9f8" offset=".89844"/><stop stop-color="#f9f9f9" offset=".90234"/><stop stop-color="#fafafa" offset=".91406"/><stop stop-color="#fbfbfa" offset=".92188"/><stop stop-color="#fbfcfc" offset=".92969"/><stop stop-color="#fcfdfd" offset=".94531"/><stop stop-color="#fdfefe" offset=".95703"/><stop stop-color="#fefefe" offset=".96484"/><stop stop-color="#fefefe" offset=".98047"/><stop stop-color="#fff" offset="1"/></radialGradient></defs><g transform="translate(-620.38 -386.45)" clip-path="url(#d)"><g clip-path="url(#c)"><g clip-path="url(#b)"><path d="m1982.9 4317.4v92.98h1031.9v-92.98z" fill="url(#a)"/></g></g></g><g transform="translate(-620.38 -386.45)" fill="#201c1c"><path d="m3420.7 4043.5h686.39c15.891 0 28.891-13 28.891-28.883v-1611.7c0-15.891-13-28.891-28.891-28.891h-686.39c-15.891 0-28.891 13-28.891 28.891v1611.7c0 15.883 13 28.883 28.891 28.883"/><path d="m3340.8 809.53c0 233.66 189.42 423.08 423.09 423.08 233.66 0 423.08-189.42 423.08-423.08 0-233.66-189.42-423.08-423.08-423.08-233.67 0-423.09 189.42-423.09 423.08"/><path d="m3148.2 1666.8v823.91c0 155.71 127.4 283.1 283.1 283.1h665.26c155.71 0 283.1-127.39 283.1-283.1v-823.91c0-155.7-127.39-283.1-283.1-283.1h-665.26c-155.7 0-283.1 127.4-283.1 283.1"/><path d="m620.38 2291.1v1752.4h149v-1752.4c0-75.988 61.797-137.82 137.82-137.82h2092v-149.01h-2092c-158.16 0-286.83 128.67-286.83 286.83"/><path d="m1253.9 1666.8v337.45h1231.5v-337.45c0-155.7-127.4-283.1-283.11-283.1h-665.25c-155.71 0-283.11 127.4-283.11 283.1"/><path d="m1446.6 809.53c0 233.66 189.42 423.08 423.08 423.08 233.66 0 423.08-189.42 423.08-423.08 0-233.66-189.42-423.08-423.08-423.08-233.66 0-423.08 189.42-423.08 423.08"/><path d="m1828.5 2886.7c-22.77 0-41.297 18.527-41.297 41.289v297.5c0 22.77 18.527 41.289 41.297 41.289h376.53c22.77 0 41.289-18.52 41.289-41.289v-297.5c0-22.762-18.52-41.289-41.289-41.289zm376.53 469.29h-376.53c-71.957 0-130.5-58.539-130.5-130.5v-297.5c0-71.961 58.543-130.5 130.5-130.5h376.53c71.961 0 130.5 58.539 130.5 130.5v297.5c0 71.961-58.539 130.5-130.5 130.5"/><path d="m1539.3 3080.6c-124.39 29.758-217.61 142.15-217.61 275.32v404.51c0 133.17 93.219 245.56 217.61 275.32v-955.15"/><path d="m2440.8 3073.1c-3.9883-0.1719-8-0.3008-12.039-0.3008h-815.65v970.71h815.65c4.0391 0 8.0508-0.1329 12.039-0.3008v-970.11"/><path d="m2514.5 3086.2v943.89c114.1-36.562 197.31-143.86 197.31-269.69v-404.51c0-125.83-83.211-233.13-197.31-269.69"/></g></svg>
`;

    const DEFAULT_COLUMN_OPTS = [
        {label:'Accomodation',
         'daily-manifest-bookings':[{"id":"customer.email"},{"id":"startTime"},{"id":"endTime"},{"id":"checkinCheckout"},{"id":"note"},{"id":"fields.comments_or_additional_request"},{"id":"fields.group_name_1"},{"id":"statusId"},{"id":"bookingCode"},{"id":"parameters.twin"},{"id":"parameters.double"}],
         'daily-manifest-guests':[{"id":"checkIn"},{"id":"firstName"},{"id":"lastName"},{"id":"fields.dietary_requirements"},{"id":"fields.accessibility_requirements"}],
         categories:[3,10,26,33]
        },
        {label:'Catering',
         'daily-manifest-bookings':[{"id":"startTime"},{"id":"endTime"},{"id":"parameters.attendee"},{"id":"statusId"},{"id":"note"},{"id":"customer.email"},{"id":"bookingCode"},{"id":"fields.comments_or_additional_request"}],
         'daily-manifest-guests':[{"id":"firstName"},{"id":"lastName"},{"id":"fields.dietary_requirements"}],
         categories:[34]
        }
    ];

    //Unless there is an existing guest we can not retrive the guest form - staticly define the inputs we want to be able to specify in the import template
    const GUEST_IMPORT_FIELDS = [{header:'Guest first name', formId:'guest_first_name'}, //Inbuilt - Required
                                 {header:'Guest last name', formId:'guest_last_name'},   //Inbuilt - Required
                                 {header:'Dietary requirements', formId:'dietary_requirements'},
                                 {header:'Accessibility Requirements', formId:'accessibility_requirements'}];

    //Attach the guest to the specified param in order of priority.
    //Params can be applied to particular item IDs to give them priority for those items.
    //Specifiying no item ids to match against the param will be checked against all items.
    const GUEST_IMPORT_PARAMS = [{items:[],guest_type:'guestformtest'},{items:[],guest_type:'guest'}];

    const MY_CSS = `
table.scriptTable{
    border:1px solid black;
    width:100%;
    color:black;
}
table.scriptTable thead{
    border-bottom:2px solid black;
}
table.scriptTable tbody{

}

table.scriptTable thead th{
    border:2px solid black;
}
table.scriptTable td{
    border-left:1px solid grey;
}
table.scriptTable tr>td:first-child{
    border-left:revert
}
table.scriptTable tr{
    border-top:1px solid black;
}

table.scriptTable.guests{
    margin-top:10px;
}
table.scriptTable.guests td:not(:first-child){
    text-align:center;
}
table.scriptTable.guests td:nth-last-child(-n+2){
    max-width:9vw;
}
table.scriptTable.guests thead th:nth-last-child(-n+2){
    max-width:9vw;
}
table.scriptTable.guests td.subRowLabel {
    padding-left:2rem;
}
table.scriptTable.guests td:not([class]):first-child {
    font-weight:bold;
    padding-left:0.5rem;
}


table.scriptTable.withCheckinColumn tr *:nth-child(1){
    width:1em;
    white-space: nowrap;

    border-right:none;

    padding-right:2em;
}
table.scriptTable.withCheckinColumn tr th:nth-of-type(1){
}
table.scriptTable.withCheckinColumn tr td:nth-of-type(1){
}

table.scriptTable.withCheckinColumn tr *:nth-child(2){
    width:1em;
    white-space: nowrap;

    border-left:none;

    padding-right:1em;

    text-align:right;
}
table.scriptTable.withCheckinColumn tr th:nth-of-type(2){
}
table.scriptTable.withCheckinColumn tr td:nth-of-type(2){
}

#my-spinner{
    position:fixed;
    width:100%;
    height:100%;
    background-color:white;
    z-index:10;
}
#my-spinner>div{
    position:relative;
    width:120px;
    height:120px;
    margin:auto;
    top:50%;
    transform: translateY(-50%);
}

a.scriptGuestBtn{
    cursor:pointer;
    margin-top:10px;
    margin-right:5px;
}

#flashing-arrow-thing{
    position:fixed;
    height:256px;
    width:256px;
    top: 100vh;
    left: 100vw;
    transform:translate(-100%,-100%);
    display:none;
    cursor:pointer;
}

#sidebar-wrapper .btn.guestTableBtn{
    margin-top:21px;
    margin-bottom:2px;
}
#sidebar-wrapper .btn.templateBtn{
    margin-top:2px;
    margin-bottom:2px;
}
#sidebar-wrapper .btn.importBtn{
    margin-top:2px;
}

#proooogress {
	position: absolute;
	left: 5px;
	top: 5px;
	z-index: 9999;
	background-color: white;
	border: 2px solid black;
	border-radius: 5px;
	padding: 5px;
    width:51%;
    display:none;
}
`;

    $.cssStyleSheet.createSheet(MY_CSS);

    //========================================================================================


    function ApplyGenericTableFormatting($table){
        $table.addClass('scriptTable');
    }

    function getBookingCode(){
        const bookingCode = /([A-Z]{4}-\d{6})/;
        const m = bookingCode.exec(window.location);
        if(m !== null){return m[1];}


        return null;
    }

    function stringToUtf8Blob(str,mimeSubType){
        //Encode the string into a UTF8 byte array
        const binaryAr = (new TextEncoder('utf-8')).encode(str);
        const blobArray = new Uint8Array(binaryAr.length + 3); // Create a new array that will also have the BOM

        //Dis is da BOM
        blobArray[0] = 239;
        blobArray[1] = 187;
        blobArray[2] = 191;

        //Copy the string array into our BOM'd array
        let i = 3;
        for(const val of binaryAr){
            blobArray[i] = val;
            i+=1
        }

        //Create and return the blob
        return new Blob([blobArray],{type:`text/${mimeSubType??'plain'};charset=utf8`});
    }

    function hashCode(str) {
        return str.split('').reduce((prevHash, currVal) =>
                                    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
    }

    function getGuestListHashCodes(){
        const list = $('#item-list').children('[id^="item_list_"]');
        let str_ids = '';
        let str_avl = '';
        for(const itm of list){
            const $itm = $(itm);
            str_ids += `${$itm.attr('id').replace('item_list_','')}`;

            const $itemassignments = $itm.find('.item-assignments b');
            str_avl += $itemassignments.eq(0).text() + $itemassignments.eq(1).text();
        }

        return {
            hash1:hashCode(str_ids),
            hash2:hashCode(str_avl)
        }
    }

    function onlyUnique(value, index, array) {
        return array.indexOf(value) === index;
    }

    //========================================================================================
    //================================ Modification functions ================================
    //= These are the functions that actually provide the extra features
    //========================================================================================


    function DoConvertDailyManifest_2_overnight(){
        //*******************************
        //* Request the export form, perform the request for the CSV data, and pass it over to step 2
        //*******************************
        function ConvertDailyManifest_2_OvernightReport_1(){
            PROGRESS.setMessage('Load bookings...');
            DAILYMANIFEST.export.ongoing().then(ConvertDailyManifest_2_OvernightReport_2);
        }

        //*******************************
        //* Parse the CSV and convert it to a HTML table.
        //* Hide the main content of the page and replace with generated table.
        //*******************************
        function ConvertDailyManifest_2_OvernightReport_2(data,result,XHR){
            const HTML = CSV.parseToHTML(data, OVERNIGHT_HEADERS);

            const $table = $(HTML);
            ApplyGenericTableFormatting($table);
            $table.attr('id','overnightTable');

            DAILYMANIFEST.replaceWith($table,'Overnight Report');

            $('#overnightButtonDesktop').text('Close Report');

            PROGRESS.hide();
            SPINNER.hide();
        }

        const $table = $('#overnightTable');
        if($table.length === 0){
            SPINNER.show();
            ConvertDailyManifest_2_OvernightReport_1();
        }else{
            DAILYMANIFEST.revertReplace();
            $('#overnightButtonDesktop').text('Overnight Report');
        }
    }

    function DoConvertDailyManifest_2_changeover(){
        const MAX_LOOK_AHEAD = DAILYMANIFEST.changeOverReportUtils.max_look_ahead;

        //Get the ending bookings
        function DoChangeOverDayReport_1(){
            PROGRESS.setMessage('Load chekouts...');
            DAILYMANIFEST.export.checkouts().then(DoChangeOverDayReport_2);
        }

        function DoChangeOverDayReport_2(data, result, xhr, formData){
            let leaving_bookings_raw = CSV.parse(data);
            let addedProducts = [];
            const leaving_bookings = [leaving_bookings_raw[0]];

            for(var i = 1; i < leaving_bookings_raw.length; i++){
                const L = leaving_bookings_raw[i]
                if(L.Status.toLowerCase() != 'maintenance'){
                    const pn = L['Product Name'];
                    if(!addedProducts.includes(pn)){
                        leaving_bookings.push(L);
                        addedProducts.push(pn);
                    }
                }
            }
            addedProducts = undefined;
            leaving_bookings_raw = undefined;


            const params = new URLSearchParams(formData);
            const dateStr = params.get('date');
            let searchStartDate = new Date();
            if(dateStr != undefined && dateStr != ''){
                searchStartDate = new Date(params.get('date'));
            }

            function GetAllCheckinsFor(dte_){
                const D = $.Deferred();
                DAILYMANIFEST.export.checkins(dte_).then((data_,result_,xhr_,formData_)=>{
                    D.resolve(CSV.parse(data_));
                });

                return D.promise();
            }

            function CheckCheckinsAgainstLeaving(leaving_, checkins_){
                let allFound = true;
                if(checkins_.length == 1){
                    return false;
                }

                for(var i = 1; i < leaving_.length; i++){
                    const L = leaving_[i];
                    inLoop: for(var j = 1; j < checkins_.length; j++){
                        const C = checkins_[j];
                         if(C.Status.toLowerCase() != 'maintenance'){
                             if(L['Product Name'] === C['Product Name']){
                                if(!Object.hasOwn(leaving_[i],'Next')){
                                    leaving_[i].Next = C;
                                    break inLoop;
                                }
                            }
                        }
                    }
                    allFound = (allFound && (!!leaving_[i].Next))
                }
                return allFound;
            }

            function doSearchLoop(date_, leaving_, allDonePromise_, iterations = 0){
                const allDonePromise = allDonePromise_ ?? $.Deferred();

                PROGRESS.setMessage(`Checking day ${iterations + 1} of ${MAX_LOOK_AHEAD}...`);
                console.log(`Serach iteration: ${iterations}`);

                if(iterations >= MAX_LOOK_AHEAD){
                    allDonePromise.resolve(leaving_);
                    return allDonePromise.promise();
                }

                const P = GetAllCheckinsFor(date_);
                P.then((arriving)=>CheckCheckinsAgainstLeaving(leaving_,arriving)).
                  then((haveFoundAll)=>{
                    if(haveFoundAll === true){
                        allDonePromise.resolve(leaving_);
                    }else{
                        const Dnext = date_;
                        Dnext.setDate(Dnext.getDate()+1);
                        setTimeout(doSearchLoop(Dnext,leaving_,allDonePromise, iterations+1),150);
                    }
                });

                return allDonePromise.promise();
            }

            doSearchLoop(searchStartDate, leaving_bookings).then(MakeTable);
        }

        function MakeTable(leavingAr){

            const html = CSV.toHTML(leavingAr, CHANGEOVER_HEADERS);

            const $table = $(html);
            ApplyGenericTableFormatting($table);
            $table.attr('id','changeoverTable');
            $table.addClass('withCheckinColumn');

            DAILYMANIFEST.replaceWith($table,'Changeovers');

            $('#changeOverButtonDesktop').text('Close Report');

            PROGRESS.hide();
            SPINNER.hide();
        }

        const $table = $('#changeoverTable');
        if($table.length === 0){
            SPINNER.show();
            DoChangeOverDayReport_1();
        }else{
            DAILYMANIFEST.revertReplace();
            $('#changeOverButtonDesktop').text('Changeover Report');
        }

    }

    function DoConvertDailyManifest_2_dailyCheckins(){
        const MAX_LOOK_AHEAD = DAILYMANIFEST.changeOverReportUtils.max_look_ahead;

        function DoDailyCheckinsReport_1(){
            const params = new URLSearchParams(window.location.search);
            const dateStr = params.get('date');
            let searchStartDate = new Date();
            if(dateStr != undefined && dateStr != ''){
                searchStartDate = new Date(dateStr);
            }
            const StartDate = new Date(searchStartDate);

            const checkingIn = [[]];

            function GetAllCheckinsFor(dte_){
                const D = $.Deferred();
                DAILYMANIFEST.export.checkins(dte_).then((data_,result_,xhr_,formData_)=>{
                    D.resolve(CSV.parse(data_));
                });

                return D.promise();
            }
            function alreadyHaveCheckin(row){
                return checkingIn.some((e)=>{return e['Product Name'] == row['Product Name']});
            }


            function doSearchLoop(date_, allDonePromise_, iterations = 0){
                const allDonePromise = allDonePromise_ ?? $.Deferred();

                PROGRESS.setMessage(`Checking day ${iterations + 1} of ${MAX_LOOK_AHEAD}...`);
                console.log(`Serach iteration: ${iterations}`);

                if(iterations >= MAX_LOOK_AHEAD){
                    allDonePromise.resolve(checkingIn);
                    return allDonePromise.promise();
                }

                GetAllCheckinsFor(date_).then((data)=>{
                    const Dnext = date_;
                    Dnext.setDate(Dnext.getDate()+1);

                    const splice_args = data.filter((data_row)=>{return Object.hasOwn(data_row,'Status') && data_row.Status.toLowerCase() != 'maintenance' && !alreadyHaveCheckin(data_row)})
                    splice_args.splice(0,0,checkingIn.length,0);

                    checkingIn.splice.apply(checkingIn, splice_args);

                    setTimeout(doSearchLoop(Dnext,allDonePromise, iterations+1),250);
                })

                return allDonePromise.promise();
            }

            doSearchLoop(searchStartDate).then((ar)=>{
                return ar.map((row)=>{
                    return {
                        'Product Name':row['Product Name'],
                        'Start Date':DATES.toYYYYMMDD(StartDate),
                        'Start Time':'00:00:00',
                        'End Date':DATES.toYYYYMMDD(StartDate),
                        'End Time':'00:00:00',
                        'Next':row,
                    }
                });
            }).then(MakeTable);
        }

        function MakeTable(checkingInAr){

            const html = CSV.toHTML(checkingInAr, CHANGEOVER_HEADERS);

            const $table = $(html);
            ApplyGenericTableFormatting($table);
            $table.attr('id','dailyCheckTable');
            $table.addClass('withCheckinColumn');

            DAILYMANIFEST.replaceWith($table,'Daily Checkins');

            $('#dailyCheckinsButtonDesktop').text('Close Report');

            PROGRESS.hide();
            SPINNER.hide();
        }

        const $table = $('#dailyCheckTable');
        if($table.length === 0){
            SPINNER.show();
            DoDailyCheckinsReport_1();
        }else{
            DAILYMANIFEST.revertReplace();
            $('#dailyCheckinsButtonDesktop').text('Daily Chekins');
        }

    }

    function DoSetColumnsFromPresets(index){
        const obj = DEFAULT_COLUMN_OPTS[index];
        if(!(!!obj)){return;}

        const requests = [];

        function submitReportOpts(report_id, value){
            const formData = new FormData();
            formData.append('report_id', report_id);
            formData.append('columns', JSON.stringify(value));
            const $request = $.Deferred();
            requests.push($request);

            $.post({
                url:'/set/report/',
                data:formData,
                dataType:'json',
                contentType:false,
                processData:false,
                success:()=>{$request.resolve()},
                error:(...args)=>{console.log(args);}
            });

            return $request;
        }

        for(const k in obj){
            switch(k){
                case 'label':
                case 'categories':
                    break;
                default:
                    requests.push(submitReportOpts(k,obj[k]));
            }
        }


        const WhenAllRequestsAreDone = $.when(...requests);
        if(!!obj.categories){
            const params = new URLSearchParams(window.location.search);
            const newParams = new URLSearchParams();
            for(const [k,v] of params){
                switch(k){
                        //Do not pass through any category or item selections in this case
                    case 'category_id[]':
                    case 'item_id[]':
                        break;
                    default:
                        newParams.append(k, v);
                }
            }
            for(const cat of obj.categories){
                newParams.append('category_id[]',cat);
            }
             WhenAllRequestsAreDone.then(()=>{window.location.search = newParams;});
        }else{
             WhenAllRequestsAreDone.then(()=>{window.location.reload();});
        }
    }

    function DoAddScrollHelpers(){
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

    function DoMakeSimpleGuestList(){
        function RequestAllGuestData(){
            function RequestGuestData(guest_uuid){
                const jqDeferred = $.Deferred();
                console.log(`Requesting guest data for uuid '${guest_uuid}'`);
                ///booking/<booking-code>/guests?action=get-guest&guest_uuid=ccaca774-fe74-4604-b064-ce90e2f94bb1
                setTimeout(()=>{
                    $.get({
                        url:'guests',
                        data:{guest_uuid:guest_uuid,action:'get-guest'},
                        dataType:'json',
                        success:function(data,status,xhr){jqDeferred.resolve(data);},
                        complete:function(xhr, status){console.log(status);}
                    });},10 * Math.random());

                return jqDeferred.promise();
            }

            const requests = [];

            const $guestTable = $('#guest-table');
            const $rows = $guestTable.find('tr[id^="guest_"]');

            for(const row of $rows){
                const $row = $(row);
                const guest_uuid = $row.data('guest_uuid');

                const request = RequestGuestData(guest_uuid);
                //request.then(function(data){console.log(data);})
                requests.push(request);
            }

            return requests;
        }

        function GenerateSimpleGuestList(...args){
            function GenerateSimpleGuestListTable(...args){
                let responses;
                if(Array.isArray(args[0])){
                    responses = args[0];
                }else{
                    responses = args;
                }

                console.log('Dump results');
                console.log(responses);

                console.log('Process results');
                //return;

                const assignedActivities = [];

                let ts_start_min = -1;
                let ts_end_max = -1;

                // Find any assigned activites, as the activites
                // list is the same for all guests we'll just use
                // the first one.
                const list = responses[0].activities.list
                const format1 = /^\s*[a-z]+\s[a-z]+\s\d+\s\d+\s-\s[a-z]+\s[a-z]+\s\d+\s\d+\s*$/i;
                const format2 = /^\s*[a-z]+\s[a-z]+\s\d+,?\s\d+\s*$/i;
                for(const line_id in list){
                    const activity = list[line_id];
                    if(activity.assigned > 0){
                        const date_desc = activity.date_desc
                        let date_parts = [];
                        let ts_start;
                        let ts_end;

                        switch(true){
                            case (format1.test(date_desc)):
                                date_parts = date_desc.split(' - ');
                                ts_start = Date.parse(date_parts[0]);
                                ts_end = Date.parse(date_parts[1]);
                                break;
                            case (format2.test(date_desc)):
                                ts_start = Date.parse(date_desc);
                                ts_end = Date.parse(date_desc);
                                break;
                            default:
                                throw 'Invalid date format';
                                break;
                        }

                        activity.ts_start = ts_start;
                        activity.ts_end = ts_end;
                        activity.is_all_day = (ts_start === ts_end);

                        assignedActivities[line_id] = activity

                        if(ts_start_min === -1){ts_start_min = ts_start;}
                        if(ts_start < ts_start_min){ts_start_min = ts_start;}
                        if(ts_end > ts_end_max){ts_end_max = ts_end;}
                    }
                }

                //=====================================

                const dayslist = [];
                const headerRow = ['Guest Name']
                for(var d = ts_start_min; d <= ts_end_max; d+= 86400000){
                    dayslist[d] = [];
                    headerRow.push((new Date(d)).toLocaleString('en-gb',{day:'2-digit'}));
                    for(const line_id in assignedActivities){
                        const activity = assignedActivities[line_id];
                        if((d >= activity.ts_start) && (d <= activity.ts_end)){
                            dayslist[d].push(activity.line_id);
                        }
                    }
                }
                headerRow.push('Dietaries');
                headerRow.push('Accesability');

                //======================================

                const table = [headerRow];
                for(const guestentry of responses){
                    const guest = guestentry.guest;
                    const guestActivities = guest.activities;

                    const row = [];
                    const subRow = [];

                    row.push(`${guest.fields.guest_first_name} ${guest.fields.guest_last_name}`);

                    for(const guestActivity in guestActivities){
                        const activityDetail = assignedActivities[guestActivity];
                        if(!!activityDetail){
                            let time = '';
                            if(!!activityDetail.time_desc){
                                time = `\r\n(${activityDetail.time_desc})`;
                            }
                            subRow[guestActivity] = ['\t' + activityDetail.name + time];
                        }else{
                            subRow[guestActivity] = ['\tLine item: ' + guestActivity];
                        }
                    }

                    for(const ts in dayslist){
                        //const d = dayslist[ts];
                        row.push('-');
                        for(const guestActivity in guestActivities){
                            const activityDetail = assignedActivities[guestActivity];
                            if(!!activityDetail){
                                if(ts == activityDetail.ts_start){
                                    if(activityDetail.is_all_day){
                                        subRow[guestActivity].push('&#x25FC;');
                                    }else{
                                        subRow[guestActivity].push('&#x25EA;');
                                    }
                                }else if(ts == activityDetail.ts_end){
                                    subRow[guestActivity].push('&#x2B15;');
                                }else if((ts >= activityDetail.ts_start) && (ts <= activityDetail.ts_end)){
                                    subRow[guestActivity].push('&#x25FC;');
                                }else{
                                    subRow[guestActivity].push('&nbsp;');
                                }
                            }else{
                                subRow[guestActivity].push('?');
                            }
                        }
                    }

                    row.push(guest.fields.dietary_requirements);
                    row.push(guest.fields.accessibility_requirements);

                    table.push(row);
                    for(const line_id in subRow){
                        subRow[line_id].push('');
                        subRow[line_id].push('');
                        table.push(subRow[line_id]);
                    }


                } //Next guest entry

                console.log('processed');
                return table;
            }

            function ConvertSimpleGuestTableToHtml(table){
                let html = '<table><thead><tr>';

                for(const cell of table[0]){
                    html += `<th>${cell}</th>`;
                }

                html += '</tr></thead><tbody>';

                for(var i = 1; i < table.length; i++){
                    const row = table[i];

                    html += '<tr>';
                    for(const cell of row){
                        if(cell !== undefined){
                            if(cell.startsWith('\t')){
                                html += `<td class="subRowLabel">${cell.replace(/\r\n|\n\r|\r|\n/g,'<br>')}</td>`;
                            }else{
                                html += `<td>${cell}</td>`;
                            }
                        }else{
                            html += `<td>&nbsp;</td>`;
                        }
                    }
                    html += '</tr>';
                }

                html += '</tbody></table>';

                console.log('converted');
                return html;
            }

            //Generate the table and html from the guest infos
            const table = GenerateSimpleGuestListTable(args);
            const html = ConvertSimpleGuestTableToHtml(table);

            //Parse table into jquery
            const $table = $(html);

            //Format table
            ApplyGenericTableFormatting($table);
            $table.addClass('guests');


            const $main = $('#staffside-guest-container');
            function decodeHtml(html) {
                const txt = document.createElement("textarea");
                txt.innerHTML = html;
                return txt.value;
            }

            //Convert the table into a CSV file and decode the htmlentites into text.
            const csvStr = decodeHtml(CSV.tableToCsv(table));

            //Creeate a blob and an object URL
            const blob = stringToUtf8Blob(csvStr,'csv');
            const dataUrl = URL.createObjectURL(blob);

            //Create buttons
            const $downloadAnchor = $('<a class="btn btn-default scriptGuestBtn" download="simple guest list.csv">Download</a>');
            const $closeAnchor = $('<a class="btn btn-default scriptGuestBtn">Close</a>');
            const $makePrintable = $('<a class="btn btn-default scriptGuestBtn">Open full page</a>');

            //Use GM functions to download the CSV BLOB
            $downloadAnchor.on('click',function(event){
                event.preventDefault();
                console.log("Calling download");
                GM_download({url:dataUrl,
                             name:'simple guest list.csv',
                             saveAs:true,
                             onerror:(args)=>console.log(args),
                             onprogress:(args)=>console.log(args),
                             onload:(args)=>console.log(args)
                            });

            });

            //The close button deletes the added nodes and un-hides the original node
            $closeAnchor.on('click',(event)=>{
                event.preventDefault();
                $downloadAnchor.remove();
                $table.remove();
                $closeAnchor.remove();
                $makePrintable.remove();
                $main.show();
                $('#makeGuestListEasy').show();
            });

            $makePrintable.on('click',(event)=>{
               event.preventDefault();
                const body = $('body');
                body.children().hide();
                body.append($table);
                $table.show();
            });
            //Modify the DOM
            $main.hide();
            $main.after($table);

            $table.after($downloadAnchor);
            $downloadAnchor.after($closeAnchor);
            $closeAnchor.after($makePrintable);

            $('#makeGuestListEasy').hide();

            SPINNER.hide();
        }

        SPINNER.show();
        const requests = RequestAllGuestData();
        const whenAllDataHasArrived = $.when(...requests);
        whenAllDataHasArrived.then(GenerateSimpleGuestList);
    }


    function DoGenerateGuestImportTemplate(){
        const $guestItemList = $('#guest-item-list').children('div.guest-item');
        const $invoiceItemList = $('#item-list').children('div.item-slot');

        const table = [];
        const headers = [];
        const emptyFormFields = [];

        headers.push('Item name','Item date/time')
        for(const h of GUEST_IMPORT_FIELDS){
            headers.push(`${h.header} (${h.formId})`);
            emptyFormFields.push('');
        }


        //Map all parameters into columns and store a map of the index of those headers...
        const paramIndexMap = new Map();
        let paramCount = 0;
        for(const invoiceItem of $invoiceItemList){
            const $invoiceItem = $(invoiceItem);
            const lineId = `${$invoiceItem.attr('id').replace('item_list_','')}`;
            const $guestItem = $guestItemList.parent().children(`[data-line-id="${lineId}"]`);

            const $params = $guestItem.find('.guest-item-params').find('input[value]');

            for(const $param of $params){
                const guest_type = $params.val();
                const parentLabel = $params.parent().children('label').text();
                const headerLabel = `${parentLabel} [${guest_type}]`;
                if(!headers.includes(headerLabel)){
                    headers.push(headerLabel);
                    paramIndexMap.set(guest_type,paramCount);
                    paramCount += 1
                }
            }
        }
        const paramOptIns = [...Array(paramCount)];


        headers.push('INTERNAL [line-id]','INTERNAL [item-id]','INTERNAL [sku]')
        table.push(headers);



        for(const invoiceItem of $invoiceItemList){
            paramOptIns.fill('',0, paramCount);

            const $invoiceItem = $(invoiceItem);
            const $itemassignments = $invoiceItem.find('.item-assignments b');
            const slotsUsed = $itemassignments.eq(0).text();
            const slotsTtl = $itemassignments.eq(1).text();
            const slotsAv = (slotsTtl - slotsUsed);
            const lineId = `${$invoiceItem.attr('id').replace('item_list_','')}`;
            const sku = $invoiceItem.data('sku');
            const itemName = $invoiceItem.find('.item-name').text();
            const datestr = $invoiceItem.find('.item-date').text();
            const timestr = $invoiceItem.find('.item-time').text();
            let datetimestr;
            if(timestr != ''){
                datetimestr = `${datestr} ${timestr}`;
            }else{
                datetimestr = datestr;
            }

            const $guestItem = $guestItemList.parent().children(`[data-line-id="${lineId}"]`);
            const itemId = $guestItem.data('item-id');

            const $params = $guestItem.find('.guest-item-params').find('input[value]');
            let paramOptInIndex = -1;
            if($params.count = 1){
                paramOptInIndex = paramIndexMap.get($params.val());
            }else{
                let firstGuestType = undefined;
                let foundGuestType = undefined;
                let secondFoundGuestType = undefined;

                findPreferedParam: {
                    for(const prefImportParam of GUEST_IMPORT_PARAMS){
                        for(const $param of $params){
                            const guest_type = $params.val();
                            if(firstGuestType === undefined){firstGuestType = guest_type;}

                            if(guest_type === prefImportParam.guest_type){
                                if(prefImportParam.items.includes(itemId)){ // If the prefered item specifies this item then we have found the prefered param
                                    foundGuestType = guest_type;
                                    break findPreferedParam;
                                }else if(prefImportParam.items.length === 0){ // If there are no specific items for this param then it can match any item
                                    if(secondFoundGuestType === undefined){ //If we haven't already matched a prefered param
                                        secondFoundGuestType = guest_type;
                                    }
                                }
                            }//If the guest types match
                        }//Next item param
                    }//Next preferred param
                }// End find prefered param block;
                paramOptInIndex = paramIndexMap.get(foundGuestType??(secondFoundGuestType??firstGuestType));
            }
            paramOptIns[paramOptInIndex] = 'Y';

            for(var i = 1; i <= slotsAv; i++){
                const row = [];
                row.push(itemName);
                row.push(datestr);

                row.push(...emptyFormFields);

                row.push(...paramOptIns);

                row.push(`'${lineId}'`);
                row.push(itemId);
                row.push(sku);
                
                table.push(row);
            }
        }


        paramOptIns.fill('',0, paramCount);
        const verificationRow = [];
        const hashes = getGuestListHashCodes();
        verificationRow.push(':::DO NOT EDIT THIS ROW - VERIFICTION ROW:::', getBookingCode());
        verificationRow.push(...emptyFormFields);
        verificationRow.push(...paramOptIns);
        verificationRow.push(hashes.hash1, hashes.hash2);
        verificationRow.push('');
        table.push(verificationRow);


        const csvStr = CSV.tableToCsv(table);
        const blob = stringToUtf8Blob(csvStr,'csv');
        const dataUrl = URL.createObjectURL(blob);

        GM_download({url:dataUrl,
                     name:`Guest import template for ${getBookingCode()}.csv`,
                     saveAs:true,
                     onerror:(args)=>console.log(args),
                     onprogress:(args)=>console.log(args),
                     onload:(args)=>console.log(args)
                    });
    }

    function DoGuestImportCSV(file){
        if(!file){return;}

        if(!file.type.startsWith('text/csv')){
            if(!file.name.toLowerCase().endsWith('.csv')){return;}
        }

        function StartMakeGuests(guests){
            function MakeGuest(argData){
                function SubmitGuest(json,status,jqXHR,otherArgs){
                    const guest = otherArgs.guests[otherArgs.index];


                    if(json.status == 'ERROR'){
                        otherArgs.whenDone.resolve({status:'ERROR',
                                                    msg:`${json.msg}\r\n\tAdditional Info:\r\n\tGuest index: ${otherArgs.index}\r\n\tGuest Name: ${guest.first_name} ${guest.last_name}`
                                                   });
                        return;
                    }
                    const formValues = {};
                    const guest_form = json.guest.form;

                    for(const field_id in guest_form){
                        formValues[guest_form[field_id].field_id] = guest.form_fields[field_id]??'';
                    }

                    const data = {
                        action:'update-guest',
                        guest_uuid:json.guest_uuid,
                        form_key:otherArgs.form_key,
                        data:{fields:formValues}
                    }

                    $.post({
                        url:'',
                        data:data,
                        dataType:'json',
                        success:()=>{otherArgs.index++; MakeGuest(otherArgs);},
                        error:(jqXHRe,statusE,errE)=>{otherArgs.whenDone.resolve({status:'ERROR',msg:statusE})}
                    })
                } //End Submit guest

                const guest = argData.guests[argData.index];
                if(!(!!guest)){
                    console.log('DONE');
                    argData.whenDone.resolve({status:'OK', msg:'Complete'});
                    return;
                }

                const data = {
                    action:'add-guest',
                    form_key:argData.form_key,
                    data:{activities:guest.items},
                }

                //POST /booking/<booking-code/guests (The current URL)
                $.post({
                    url:'',
                    data:data,
                    dataType:'json',
                    success:(a,b,c)=>SubmitGuest(a,b,c,argData),
                    error:(jqXHRe,statusE,errE)=>{argData.whenDone.resolve({status:'ERROR',msg:statusE})}
                })
            } //End make guest

            const $whenDone = $.Deferred();

            const form_key = $('#form_key').val();
            MakeGuest({guests:guests,
                       index:0,
                       whenDone:$whenDone,
                       form_key:form_key
                      });

            return $whenDone.promise();
        }

        function DoCsvImport(loadedReader){
            function DoVerification(vRow){
                const bookingCode = vRow[1];
                const hash1 = vRow[vRow.length - 3];
                const hash2 = vRow[vRow.length - 2];
                const hash3 = vRow[vRow.length - 1];

                const hashes = getGuestListHashCodes()
                const actualBookingCode = getBookingCode();


                const a = (bookingCode == actualBookingCode);
                const b = (hash1 == hashes.hash1);
                const c = (hash2 == hashes.hash2);
                console.log({a:a,b:b,c:c});
                return a && b && c;
            }

            const table = CSV.parse(loadedReader.result);
            const byGuest = [];
            const usedRows = [];
            const headers = table[0];

            const field_header = /.+?\((.+?)\)/;
            const param_header = /.+?\[(.+?)\]/;

            const fieldMap = new Map();
            const paramMap = new Map();

            let verificationRow;

            for(var k = 0; k < headers.length; k++){
                const header = headers[k];
                switch(true){
                    case (field_header.test(header)):
                        var M = header.match(field_header);
                        var MM = M[1];
                        fieldMap.set(MM,k);
                        break;
                    case (param_header.test(header)):
                        var N = header.match(param_header);
                        var NN = N[1];
                        paramMap.set(NN, k);
                        break;
                }
            }

            for(var i = 1; i < table.length; i++){
                if(!usedRows.includes(i)){
                    const row = table[i];

                    if(row[0].toUpperCase() == ':::DO NOT EDIT THIS ROW - VERIFICTION ROW:::'){
                        verificationRow = row;
                        usedRows.push(i);
                        continue;
                    }

                    let fn = row[fieldMap.get('guest_first_name')];
                    let ln = row[fieldMap.get('guest_last_name')];

                    if((fn == '') || (ln == '')){
                        usedRows.push(i);
                        continue;
                    }

                    const obj = {first_name:fn, last_name:ln, rows:[], form_fields:{}, items:[]};

                    fn = fn.toLowerCase();
                    ln = ln.toLowerCase();

                    for(var j = i; j < table.length; j++){
                        if(!usedRows.includes(j)){
                            const searchRow = table[j];
                            if((searchRow[fieldMap.get('guest_first_name')].toLowerCase() == fn) &&
                               (searchRow[fieldMap.get('guest_last_name')].toLowerCase() == ln)){
                                let line_id;
                                let item_id;
                                let sku;
                                let guestType;

                                for(const [param,value] of paramMap){
                                    switch(param){
                                        case 'line-id':
                                            line_id = `${searchRow[value]}`;
                                            line_id = line_id.replace(/[^\d.]/g,'');
                                            break;
                                        case 'item-id':
                                            item_id = `${searchRow[value]}`;;
                                            item_id = item_id.replace(/[^\d]/g,'');
                                            break;
                                        case 'sku':
                                            sku = searchRow[value];
                                            break;
                                        default:
                                            if(searchRow[value].toLowerCase().startsWith('y')){
                                                guestType = param;
                                            }
                                            break;
                                    }
                                }

                                obj.rows.push(searchRow);
                                obj.items.push({line_id:line_id,
                                                item_id:item_id,
                                                guest_type:guestType
                                               });
                                //sku:sku,

                                for(const [key,value] of fieldMap){
                                    if(!(!!obj.form_fields[key])){
                                        obj.form_fields[key] = searchRow[value];
                                    }
                                }

                                usedRows.push(j);
                            }//If names match
                        }//If not already used row
                    } //Next search row...

                    byGuest.push(obj);
                }//If not skip row
            }//Next row

            if(DoVerification(verificationRow) === false){
                const D = $.Deferred();
                D.resolve({status:'ERROR',msg:'Invoice verficiation failed.\r\nAn import template is only valid for the specific booking and invoice it was generated for.\r\nAny changes to the invoice or existing guest assignments will invalidate the template.'});
                return D
            }else{
                return StartMakeGuests(byGuest);
            }

        }

        function ImportComplete(arg){
            switch(arg.status){
                case 'OK':
                    break;
                default:
                    alert(`Status: ${arg.status}\r\n${arg.msg}\r\n\r\nThe page will be reloaded`);
            }
            window.location.reload();
        }

        const reader = new FileReader();
        reader.onload = ()=>{DoCsvImport(reader).then(ImportComplete)}
        reader.onerror = (...args)=>{console.log(args);}

        reader.readAsText(file);
    }


    //==================================== AddButtons etc =====================================
    //*******************************
    //* Adds an "Overnight Report" button to the daily manifest report.
    //* The overnight report uses the daily manifest export to generate a simplified table.
    //*******************************
    function AddDailyManifestReportButtons(){
        function cloneActionButton($template, id, text, icon, onClick){
            const $cloneButton = $template.clone(true, false);
            $cloneButton.attr({'id':id,
                               'title':text});
            $cloneButton.removeAttr('href');
            $cloneButton.css({'margin-right':'10px'});

            const $ico = $cloneButton.find('span[class^="Icon"]');
            if($ico.length > 0){
                $ico.empty();
                $ico.html(icon);
            }else{
                $cloneButton.children('span').text(text);
            }

            $cloneButton.on('click',function(event){
                event.preventDefault();
                onClick.call(this, event);
            });

            return $cloneButton;
        }

        (function AddDesktopButtons(){
            if($('#overnightButtonDesktop').length != 0){console.log('#overnightButtonDesktop already exists'); return}

            const $newBookingButton = $('#bookingButtonDesktop');
            if($newBookingButton.length !== 1){console.log('#bookingButtonDesktop not found'); return}

            //####### Overnight report
            const $cloneButton1 = cloneActionButton($newBookingButton, 'overnightButtonDesktop', 'Overnight Report', MOON_ICON, DoConvertDailyManifest_2_overnight);
            $cloneButton1.insertBefore($newBookingButton);

            //####### Changeover report
            const $cloneButton2 = cloneActionButton($newBookingButton, 'changeOverButtonDesktop', 'Changeover Report', BED_ICON, DoConvertDailyManifest_2_changeover);
            $cloneButton2.insertBefore($cloneButton1);

            //####### Changeover report
            const $cloneButton3 = cloneActionButton($newBookingButton, 'dailyCheckinsButtonDesktop', 'Days Checkins', CHECKIN_ICON, DoConvertDailyManifest_2_dailyCheckins);
            $cloneButton3.insertBefore($cloneButton2);
            
        })();
        (function AddMobileButtons(){
            //'bookingButtonMobile
            if($('#overnightButtonMobile').length != 0){console.log('#overnightButtonMobile already exists'); return}

            const $newBookingButton = $('#bookingButtonMobile');
            if($newBookingButton.length !== 1){console.log('#bookingButtonMobile not found'); return}

            //####### Overnight report
            const $cloneButton1 = cloneActionButton($newBookingButton, 'overnightButtonMobile', 'Overnight Report', MOON_ICON, DoConvertDailyManifest_2_overnight);
            $cloneButton1.insertBefore($newBookingButton);

            //####### Changeover report
            const $cloneButton2 = cloneActionButton($newBookingButton, 'changeOverButtonMobile', 'Changeover Report', BED_ICON, DoConvertDailyManifest_2_changeover);
            $cloneButton2.insertBefore($cloneButton1);

            //####### Changeover report
            const $cloneButton3 = cloneActionButton($newBookingButton, 'dailyCheckinsButtonMobile', 'Days Checkins', CHECKIN_ICON, DoConvertDailyManifest_2_dailyCheckins);
            $cloneButton3.insertBefore($cloneButton2);

        })();
    }

    //*******************************
    //* The guest list is very hard to manage, needing to scroll up and down all the time.
    //* Adds listeners to key buttons to automatically scroll the page up and down to the right places
    //*******************************
    function AddScrollHelpersToGuestPages(){
        DoAddScrollHelpers()
    }

    //*******************************
    //* Adds a sidebar entry to show the guest details for a booking in a table layout
    //*******************************
    function AddSimpleGuestlistButton(){
        const $sidebar = $('#sidebar');
        if($sidebar.children('#makeGuestListEasy').length !== 0){console.log('#makeGuestListEasy already exists'); return;}

        const $btn = $('<a id="makeGuestListEasy" class="btn btn-default ico wopen guestTableBtn"><i class="fa fa-columns"></i><b>Guest list table</b></a>');
        $sidebar.append($btn);
        $btn.on('click',function(event){event.preventDefault(); DoMakeSimpleGuestList();});
    }


    function AddGuestImportButton(){
        const $sidebar = $('#sidebar');
        if($sidebar.children('#makeGuestListEasyImport1').length !== 0){console.log('#makeGuestListEasyImport1 already exists'); return;}

        const $btn = $('<a id="makeGuestListEasyImport1" class="btn btn-default ico wopen templateBtn"><i class="fa fa-file-export"></i><b>CSV import template</b></a>');
        $sidebar.append($btn);
        $btn.on('click',function(event){event.preventDefault(); DoGenerateGuestImportTemplate();});

        if($sidebar.children('#makeGuestListEasyImport2').length !== 0){console.log('#makeGuestListEasyImport2 already exists'); return;}

        const $btn2 = $('<a id="makeGuestListEasyImport2" class="btn btn-default ico wopen importBtn"><i class="fa fa-file-import"></i><b>Import CSV</b><br></a>');
        const $csvFile = $('<input type="file" id="makeGuestListEasyImportFile">');
        $btn2.append($csvFile);

        $csvFile.on('change',function(event){
            const file = event.target.files[0];
            DoGuestImportCSV(file);
        });
        $sidebar.append($btn2);

    }

    function AddColumnSelections(){
        if($('#myDefaultColumnSelector').length !== 0){return;}

        const $divs = $('div[class^="Title_"]').filter(function(index){return $(this).text() == 'Columns';}).eq(0);
        if($divs.length === 0){return;}

        const $parent = $divs.parent().parent();

        const $selector = $('<label>Suggested columns:<select id="myDefaultColumnSelector"><option value="-1">---</option></select></label>');

        const $select = $selector.find('#myDefaultColumnSelector');

        for(var i = 0; i < DEFAULT_COLUMN_OPTS.length; i++){
            const lbl = DEFAULT_COLUMN_OPTS[i].label
            $select.append($('<option>',{text:lbl,value:i}));
        }

        $select.on('change',function(event){event.preventDefault();DoSetColumnsFromPresets($(this).val());});

        $parent.append($selector);
    }

    //*******************************
    //* This function is called at page load and on page changes to add any extra buttons to the layout
    //*******************************
    function DoMods(){
        console.log(window.location);
        switch(true){
            case /booking\/manifest/.test(window.location):
                console.log('AddDailyManifestReportButtons');
                AddDailyManifestReportButtons();

                console.log('AddColumnSelections');
                AddColumnSelections();

                break;
            case /calendar\/customer/.test(window.location):
                console.log('customer calendar - NOP');
                break;
            case /booking\/[A-Z]{4}-\d{6}\/guests/.test(window.location):
                console.log('AddScrollHelpersToGuestPages');
                AddScrollHelpersToGuestPages();

                console.log('AddGuestlistButton');
                AddSimpleGuestlistButton();

                console.log('AddGuestImportButton');
                AddGuestImportButton();
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
