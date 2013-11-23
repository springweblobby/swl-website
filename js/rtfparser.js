function convertRTFtoHTML(input) {
    var expectTag = false;
    //var expectArgument = false;
    var ignoreLevel = 0;
    //var specialChars = ['*'];
    var levels = []; // each nested level will push a boolean. if this array contains true anywhere, it means we must discard text at current nesting level
    var output = "";
    var rtf = new Tokenizer( ['\\', ' ', '{', '}', '\n'], function( text, isSeparator ){
        if( isSeparator ){
            if (expectTag) {
                // special character!
    //            output += " SPECIAL"+text;
                output += text;
                expectTag = false;
            } else {
                switch (text) {
                case '\\':
        //            output += " TAG ";
                    expectTag = true;
                    break;
                case ' ':
                    output += " ";
                    break;
                case '{':
                    levels.push(false);
    //                output += " {"+levels.length+" ";
                    break;
                case '}':
                    levels.pop();
    //                output += " }"+levels.length+" ";
                    break;
                case '\n':
                    break;
                };
            }
        } else {
            if (expectTag) {
    //            output += " TAG " + text;
                expectTag = false;
                switch (text) {
                case "fonttbl":
    //                output += " FONTTABLE";
                    levels[levels.length-1] = true;
                    break;
                case "par":
                    output += "\n";
                    break;
                default:
    //                output += " <i><small>"+text+"</small></i>";
                }
    //        } else if (expectArgument) {
    //            output += " ARG=" + text;
            } else {
    //            output += " TEXT " + text;
                var ignoreThis = false;
                for (l in levels) { // rewrite using an enumerator function for pretty code
                    ignoreThis |= l;
                }
                if (!ignoreThis) {
                    output += text;
                } else {
    //                output += " IGNORED="+text;
                }
            }
        }
    });
    rtf.parse(input);
    return output;
}