// ==UserScript==
// @name         Checkfront Overnight Report Helper Script
// @namespace    http://cat.checkfront.co.uk/
// @version      2025-10-02T12:25
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

    //https://github.com/n3r4zzurr0/svg-spinners
    const MY_SPINNER = `
<svg width="120" height="120" stroke="#000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g><circle cx="12" cy="12" r="9.5" fill="none" stroke-width="3" stroke-linecap="round"><animate attributeName="stroke-dasharray" dur="1.5s" calcMode="spline" values="0 150;42 150;42 150;42 150" keyTimes="0;0.475;0.95;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" repeatCount="indefinite"/><animate attributeName="stroke-dashoffset" dur="1.5s" calcMode="spline" values="0;-16;-59;-59" keyTimes="0;0.475;0.95;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" repeatCount="indefinite"/></circle><animateTransform attributeName="transform" type="rotate" dur="2s" values="0 12 12;360 12 12" repeatCount="indefinite"/></g></svg>
`;
    const $MYSPINNER = $('<div id="my-spinner"><div>' + MY_SPINNER + '</div></div>');

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
    const GUEST_IMPORT_FIELDS = [{header:'Guest first name',formId:'guest_first_name'}, //Inbuilt - Required
                                 {header:'Guest last name',formId:'guest_last_name'},   //Inbuilt - Required
                                 {header:'Dietary requirements',formId:'dietary_requirements'},
                                 {header:'Accessibility Requirements',formId:'accessibility_requirements'}];

    //Attach the guest to the specified param in order of priority.
    //Params can be applied to particular item IDs to give them priority for those items.
    //Specifiying no item ids to match against the param will be checked against all items.
    const GUEST_IMPORT_PARAMS = [{items:[],guest_type:'guestformtest'},{items:[],guest_type:'guest'}];


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

    `;

    $.cssStyleSheet.createSheet(MY_CSS);

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

    //PREFER THIS ONE IT HANDLES QUOTED AND UNQUOTED CSVS
    //AND IT DOESN'T NEED TO SPLIT THE LINES IN A SEPERATE STEP!
    function BADLY_ITERATE_GENERIC_CSV(data){
        const rows = [];
        let row = [];

        const l = data.length;
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

                        rows.push(row);
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

            rows.push(row);
            row = [];
        }

        return rows;
    }

    function BADLY_PARSE_CSV(data){
        const lines = BADLY_ITERATE_GENERIC_CSV(data);
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


    //================================= CSV converting =======================================

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
    /*function TABLE_2_CSV(table){
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
    }*/

    //================================ Helper functions ======================================
    function ApplyGenericTableFormatting($table){
        $table.addClass('scriptTable');
    }

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

    function getBookingCode(){
        const bookingCode = /([A-Z]{4}-\d{6})/;
        const m = bookingCode.exec(window.location);
        if(m !== null){return m[1];}


        return null;
    }

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

    //========================================================================================
    //================================ Modification functions ================================
    //= These are the functions that actually provide the extra features
    //========================================================================================

    function DoConvertDailyManifest_2_overnight(){
        //*******************************
        //* Request the export form then pass the results to step 2.
        //*******************************
        function ConvertDailyManifest_2_OvernightReport_1(){
            $.get({
                url:'/get/export/',
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
                url:'/booking/manifest/',
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
            ApplyGenericTableFormatting($table);
            $table.attr('id','overnightTable');


            findPageTitle().text('Overnight Report'); //Change page title

            //Find the actions bar where the date selectors exist and hide
            //any nodes that should be hidden when printing.
            const $actions = findPrimaryActionsDiv();
            const $printViewHidden = $actions.find('.printViewHidden');
            $printViewHidden.hide();

            //Display the text version.
            const $text = $actions.find('div[class^="Text__Text_"]').eq(0); //This is the text version of the date(s) selected.
            $text.show(); //Make sure the text version is shown.

            const $page = getMainPageContentAfterHeaders();
            $page.data('previouslyVisable',$page.children(':visible'));
            $page.data('previouslyVisable').hide(); //Emptying the div breaks things
            $page.append($table);

            $('#overnightButtonDesktop').text('Close Report');

            hideSpinner();
        }

        const $table = $('#overnightTable');
        if($table.length === 0){
            showSpinner();
            ConvertDailyManifest_2_OvernightReport_1();
        }else{
            $table.remove();
            const $actions = findPrimaryActionsDiv();
            const $printViewHidden = $actions.find('.printViewHidden');
            $printViewHidden.show();

            const $page = getMainPageContentAfterHeaders();
            $page.data('previouslyVisable').show();
            $page.data('previouslyVisable',undefined);

            //Display the text version.
            const $text = $actions.find('div[class^="Text__Text_"]').eq(0); //This is the text version of the date(s) selected.
            $text.hide(); //Make sure the text version is shown.

            $('#overnightButtonDesktop').text('Overnight Report');
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
            const csvStr = decodeHtml(TABLE_2_QUOTEDCSV(table));

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

            hideSpinner();
        }

        showSpinner();
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


        const csvStr = TABLE_2_QUOTEDCSV(table);
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

            return $whenDone;
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

            const table = BADLY_PARSE_CSV(loadedReader.result);
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
        function onClick(event){
            event.preventDefault();
            DoConvertDailyManifest_2_overnight();
        }
        function configureCloneButton($cloneButton, id){
            $cloneButton.attr({'id':id,
                               'title':'Overnight Report'});
            $cloneButton.removeAttr('href');
            $cloneButton.css({'margin-right':'10px'});

            $cloneButton.on('click',onClick);
        }
        (function AddDesktopButton(){
            if($('#overnightButtonDesktop').length != 0){console.log('#overnightButtonDesktop already exists'); return}

            const $newBookingButton = $('#bookingButtonDesktop');
            if($newBookingButton.length !== 1){console.log('#bookingButtonDesktop not found'); return}

            const $cloneButton = $newBookingButton.clone(true, false);

            configureCloneButton($cloneButton,'overnightButtonDesktop');

            $cloneButton.children('span').text('Overnight Report');
            $cloneButton.insertBefore($newBookingButton);
            
        })();
        (function AddDesktopButton(){
            //'bookingButtonMobile
            if($('#overnightButtonMobile').length != 0){console.log('#overnightButtonMobile already exists'); return}

            const $newBookingButton = $('#bookingButtonMobile');
            if($newBookingButton.length !== 1){console.log('#bookingButtonMobile not found'); return}

            const $cloneButton = $newBookingButton.clone(true, false);

            configureCloneButton($cloneButton,'overnightButtonMobile');

            const $iconSpan = $cloneButton.find('span[class^="Icon"]');
            $iconSpan.empty();
            $iconSpan.html(MOON_ICON);

            $cloneButton.insertBefore($newBookingButton);
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
