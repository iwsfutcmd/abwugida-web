const CONSONANTS = [
    "b",
    "d",
    "ð",
    "dʒ",
    "f",
    "g",
    "h",
    "k",
    "l",
    "m",
    "n",
    "ŋ",
    "p",
    "r",
    "s",
    "ʃ",
    "tʃ",
    "t",
    "v",
    "w",
    "j",
    "z",
    "ʒ",
    "θ",
    // Arabic consonants (for Arabizi mode)
    "ʔ", "q", "ħ", "ʕ", "x", "ɣ", "tˤ", "dˤ", "sˤ", "zˤ", "ðˤ", "ɫ",
];

const VOICELESS_CONSONANTS = [
    "f",
    "h",
    "k",
    "l",
    "p",
    "s",
    "ʃ",
    "tʃ",
    "t",
    "θ",
];

const VOWELS = [
    "aː",
    "uː",
    "iː",
    "a",
    "i",
    "u",
];

const IPA_VOWELS = [
    "i",
    "ɪ",
    "e",
    "ɛ",
    "ɝ",
    "æ",
    "a",
    "ʌ",
    "ə",
    "ɚ",
    "ɑ",
    "o",
    "ɔ",
    "ʊ",
    "u",
];


const BOUNDARIES = ["ˈ", "ː", "ˌ", "."];


class Consonant {
    constructor(consonant, vowel) {
        if (!Consonant.isConsonant(consonant) && consonant != "blank") {
            throw new TypeError(`Found unexpected consonant ${consonant}`)
        }

        if (vowel && !Consonant.isVowel(vowel)) {
            throw new TypeError(`Found unexpected vowel ${vowel}`)

        }


        this.consonant = consonant;
        this.vowel = vowel;
    }

    toString() {
        let consonant = this.consonant;
        if (consonant == "blank") {
            consonant = "";
        }
        return `${consonant}${this.vowelToString()}`
    }

    vowelToString() {
        switch (this.vowel) {
            case "aː":
                return "aː";
            case "uː":
                return "uː";
            case "iː":
                return "iː";
            case "a":
                return "ə";
            case "i":
                return "i";
            case "u":
                return "u";
            default:
                return "";
        }
    }


    toHtml() {
        let consonant = this.consonant;

        if (consonant == "blank") {
            consonant = "blank_forward";
        }

        let maybeVoiceless = "";
        if (Consonant.isVoiceless(consonant)) {
            maybeVoiceless = "voiceless-base"
        }
        let consonantHTML = `<img class="consonant" src="wugz/${consonant}.png"/>`;
        if (this.vowel) {
            return `<div class=syllable>${consonantHTML}<img class="vowel vowel-${this.vowel} ${maybeVoiceless}" src="wugz/vowels/${this.vowel}_cropped.png"/></div>`
        } else {
            return `<div class=syllable>${consonantHTML}</div>`;
        }
    }

    static isConsonant(consonant) {
        return CONSONANTS.indexOf(consonant) != -1;
    }
    static isVoiceless(consonant) {
        return VOICELESS_CONSONANTS.indexOf(consonant) != -1;
    }
    static isVowel(vowel) {
        return VOWELS.indexOf(vowel) != -1;
    }

    toCPs() {
        let consonant = this.consonant;

        if (consonant == "blank") {
            consonant = "blank_forward";
        }
        let cps = String.fromCharCode(parseInt(ABWUGIDA_MAP[consonant], 16));
        if (this.vowel) {
            return cps + String.fromCharCode(parseInt(ABWUGIDA_MAP[this.vowel], 16));
        } else {
            return cps;
        }
    }
}


class Parser {
    constructor(ipa) {
        this.ipa = ipa;
        this.chars = ipa.split('');
        this.consonants = [];
        this.consonant = "";
        this.vowel = "";
        this.index = 0;
    }

    finishConsonant() {
        if (this.consonant) {
            this.consonants.push(new Consonant(this.consonant, this.vowel));
            this.consonant = "";
            this.vowel = "";
        }
    }

    static isBoundary(ipa) {
        return BOUNDARIES.indexOf(ipa) != -1;
    }

    static isIPAVowel(vowel) {
        return IPA_VOWELS.indexOf(vowel) != -1;
    }
    munch() {
        if (this.index >= this.chars.length) {
            this.finishConsonant();
            return false;
        }
        let current = this.chars[this.index];

        let next = "";
        if (this.index + 1 < this.chars.length) {
            next = this.chars[this.index + 1];
        }

        this.index++;


        // Fixups to go from IPA to AlicePA
        if (current == "ɹ") {
            current = "r";
        }


        if (Parser.isBoundary(current)) {
            // Boundaries mark the end of an orthographic syllable
            // no matter what (no medials possible after a lengthener or stress mark)
            this.finishConsonant();
            return true;
        }
        if (Consonant.isConsonant(current)) {
            if (this.consonant != "") {
                this.finishConsonant();
            }

            this.consonant = current;

            if (current == "t" && next == "ʃ") {
                this.consonant = "tʃ";
                this.index++;
            } else if (current == "d" && next == "ʒ") {
                this.consonant = "dʒ";
                this.index++;
            }
        } else if (Parser.isIPAVowel(current)) {
            if (this.consonant == "") {
                this.consonant = "blank";
            }

            switch (current) {
               case "i":
               case "ɪ":
               case "e":
               case "ɛ":
                   this.vowel = "iː";
                   break;
               case "æ":
               case "a":
               case "ɑ":
                   this.vowel = "aː";
                   break;
               case "o":
                   // /oʊ/ is really just perceived as /o:/ by most. Including by Alice.
                   if (next == "ʊ") {
                       this.index++;
                   }
               case "ɔ":
               case "ʊ":
               case "u":
               // This one's controversial
               case "ʌ":
                   this.vowel = "uː";
                   break;
               case "ə":
                   this.vowel = "a";
                   break;
               case "ɚ":
               case "ɝ":
                   this.vowel = "a";
                   this.finishConsonant();
                   this.consonant = "r";
                   // Alice prefers to have coda r form a new syllable onset
                   // e.g. "dearest" => "de-re-s-t"
                   // this.finishConsonant();
            }
            this.finishConsonant();
        } else {
            throw new TypeError(`Got unexpected IPA: ${current}`);
        }


        return true;
    }
}


class TripleOutput {
    constructor(html, string, ipa, cps) {
        this.html = html;
        this.ipa = ipa;
        this.string = string;
        this.cps = cps;
    }

    push(otherTriple) {
        this.html += otherTriple.html;
        this.ipa += otherTriple.ipa;
        this.string += otherTriple.string;
        this.cps += otherTriple.cps;
    }

    static forSpecialChar(ch) {
        if (/\s/.test(ch)) {
            TripleOutput.AFTER_WHITESPACE = true;
        }
        let punct_file;
        if (ch == "\n") {
            return new TripleOutput("<br>", "⏎", "⏎", "");
        } else if (ch == " ") {
            return new TripleOutput("<div class=space>&nbsp;</div>", " ", " ", " ")
        } else if (punct_file = TripleOutput.punctuationFileName(ch)) {
            return new TripleOutput(`<div class=punct><img class=punctimg src="wugz/punct/${punct_file}.png"></div>`, ch, ch, ch);
        } else {
            return new TripleOutput(`<div class=char><div class=charbox>${ch}</div></div>`, ch, ch, ch);
        }
    }

    static punctuationFileName(ch) {
        switch (ch) {
            case "0": return "0";
            case "1": return "1";
            case "2": return "2";
            case "3": return "3";
            case "4": return "4";
            case "5": return "5";
            case "6": return "6";
            case "7": return "7";
            case "8": return "8";
            case "9": return "9";
            case "&": return "ampersand";
            case "*": return "asterisk";
            case "@": return "at";
            case "\\": return "backslash";
            case "^": return "caret";
            case "}": return "close_brace";
            case "]": return "close_bracket";
            case ")": return "close_paren";
            case ":": return "colon";
            case ",": return "comma";
            case "$": return "dollar";
            case "—": return "em_dash";
            case "–": return "en_dash";
            case "=": return "equals";
            case "!": return "exclamation";
            case ">": return "gt";
            case "-": return "hyphen";
            case "<": return "lt";
            case "{": return "open_brace";
            case "[": return "open_bracket";
            case "(": return "open_paren";
            case "%": return "percent";
            case "|": return "pipe";
            case "+": return "plus";
            case "#": return "pound";
            case "?": return "question";
            case ";": return "semicolon";
            case "/": return "slash";
            case "~": return "tilde";
            case ".": return "period";
            case "’": return "apostrophe";
            case "‘": return "open_quote";
            case "`": return "open_quote";

            case "“": return "open_quotes";
            case "”": return "close_quotes";

            // smaht quotes
            case "\"":
                if (TripleOutput.AFTER_WHITESPACE) {
                    return "open_quotes";
                } else {
                    return "close_quotes";
                }
            case "'":
                if (TripleOutput.AFTER_WHITESPACE) {
                    return "open_quote";
                } else {
                    return "apostrophe";
                }
            default: return null;

        }
    }
}

// is this a hack? yes. do i care? no
TripleOutput.AFTER_WHITESPACE = true;

function getIpa(word) {
    word = word.toLowerCase();
    let wordProns = ALICE_DICT[word] || CMU[word];
    if (!wordProns) {
        return null;
    }
    return wordProns[0];
}

function parseConsonants(ipa) {
    let parser = new Parser(ipa);

    while(parser.munch()) {

    }

    return parser.consonants;


}


function debugWord(word) {
    let ipa = getIpa(word);
    console.log(`ipa: ${ipa}`);
    let consonants = parseConsonants(ipa);
    console.log(`got ${consonants.length}  consonants`);

    let strings = consonants.map((c) => c.toString());
    console.log(`word: ${strings.join('-')}`)
}
function getDetailsForWord(word) {
    if (word.search(/[a-zA-Z]/) == -1) {
        // This code handles non-word content like newlines and spaces and such

        let output = new TripleOutput("", "", "", "");


        for (ch of word) {
            output.push(TripleOutput.forSpecialChar(ch))
        }
        return output;
    }
    TripleOutput.AFTER_WHITESPACE = false;

    let ipa;
    // ugh, contractions. CMU dict doesn't have these
    if (word.endsWith("'ll")) {
        ipa = getIpa(word.slice(0, -3)) + "l";
    } else {
        ipa = getIpa(word);
    }

    if (!ipa && word.endsWith("n't")) {
        ipa = getIpa(word.slice(0, -3)) + "nt";
    }
    if (!ipa && word.endsWith("'s")) {
        ipa = getIpa(word.slice(0, -2)) + "s";
    }
    // Teach it about the wug test
    if (!ipa && word.length > 1 && word.endsWith("s")) {
        ipa = getIpa(word.slice(0, -1));
        if (ipa) {
            let last = ipa.charAt(ipa.length - 1);
            if (Consonant.isVoiceless(last)) {
                ipa += "s";
            } else {
                ipa += "z";
            }
        }
    }
    if (!ipa) {

        return new TripleOutput(`<div class=unknown><div class=charbox>${word}</div></div>`, `<span class=unknown>${word}</span>`, `<span class=unknown>${word}</span>`, "")

    }

    let consonants = parseConsonants(ipa);
    let html = consonants.map((c) => c.toHtml());
    let string = consonants.map((c) => c.toString());
    let cps = consonants.map((c) => c.toCPs()).join('');
    return new TripleOutput(html.join(""), string.join("-"), ipa, cps)
}


function getDetails(words) {
    TripleOutput.AFTER_WHITESPACE = true;
    // By grouping the match, .split() returns alternating matched text and unmatched text
    // so we can attempt to preserve non-words
    //
    // regex is gnarly to match contractions but not single quotation marks
    let arr = words.split(/([a-zA-Z]+[a-zA-Z'][a-zA-Z]+|[a-zA-Z]+)/).map((word) => getDetailsForWord(word));

    return new TripleOutput(
         arr.map((word) => word.html).join(""),
         arr.map((word) => word.string).join(""),
         arr.map((word) => word.ipa).join(""),
         arr.map((word) => word.cps).join(""),
       );
}


// === ARABIZI (Lebanese Arabic) MODE ===
// Maps Arabizi chat alphabet to Abwugida phonemes.
// Numbers used: 2=ʔ, 3=ʕ, 3'=ɣ, 5=x, 6=tˤ, 6'=ðˤ, 7=ħ, 8=ɣ, 9=sˤ, 9'=zˤ

function tokenizeArabizi(text) {
    const tokens = [];
    let i = 0;

    while (i < text.length) {
        const ch = text[i];
        const next = i + 1 < text.length ? text[i + 1] : '';
        const chL = ch.toLowerCase();
        const nextL = next.toLowerCase();

        // Apostrophe digraphs: 3'=ɣ, 6'=ðˤ, 9'=zˤ
        if ((ch === '3' || ch === '6' || ch === '9') && next === "'") {
            const map = { '3': 'ɣ', '6': 'ðˤ', '9': 'zˤ' };
            tokens.push({ type: 'consonant', phoneme: map[ch] }); i += 2;

        // Uppercase emphatics and S=ʃ (checked before lowercase digraphs)
        } else if (ch === 'S') {
            tokens.push({ type: 'consonant', phoneme: 'ʃ' }); i++;
        } else if (ch === 'T') {
            tokens.push({ type: 'consonant', phoneme: 'tˤ' }); i++;
        } else if (ch === 'D') {
            tokens.push({ type: 'consonant', phoneme: 'dˤ' }); i++;

        // Lowercase letter digraphs
        } else if (chL === 's' && nextL === 'h') {
            tokens.push({ type: 'consonant', phoneme: 'ʃ' }); i += 2;
        } else if (chL === 't' && nextL === 'h') {
            tokens.push({ type: 'consonant', phoneme: 'θ' }); i += 2;
        } else if (chL === 'd' && nextL === 'h') {
            tokens.push({ type: 'consonant', phoneme: 'ð' }); i += 2;
        } else if (chL === 'g' && nextL === 'h') {
            tokens.push({ type: 'consonant', phoneme: 'ɣ' }); i += 2;
        } else if (chL === 'k' && nextL === 'h') {
            tokens.push({ type: 'consonant', phoneme: 'x' }); i += 2;

        // Long vowel digraphs
        } else if (chL === 'a' && nextL === 'a') {
            tokens.push({ type: 'vowel', phoneme: 'aː' }); i += 2;
        } else if (chL === 'i' && (nextL === 'i' || nextL === 'y')) {
            tokens.push({ type: 'vowel', phoneme: 'iː' }); i += 2;
        } else if (chL === 'e' && nextL === 'e') {
            tokens.push({ type: 'vowel', phoneme: 'iː' }); i += 2;
        } else if (chL === 'u' && (nextL === 'u' || nextL === 'w')) {
            tokens.push({ type: 'vowel', phoneme: 'uː' }); i += 2;
        } else if (chL === 'o' && nextL === 'o') {
            tokens.push({ type: 'vowel', phoneme: 'uː' }); i += 2;

        // Number consonants
        } else if (ch === '2') { tokens.push({ type: 'consonant', phoneme: 'ʔ' }); i++;
        } else if (ch === '3') { tokens.push({ type: 'consonant', phoneme: 'ʕ' }); i++;
        } else if (ch === '5') { tokens.push({ type: 'consonant', phoneme: 'x' }); i++;
        } else if (ch === '6') { tokens.push({ type: 'consonant', phoneme: 'tˤ' }); i++;
        } else if (ch === '7') { tokens.push({ type: 'consonant', phoneme: 'ħ' }); i++;
        } else if (ch === '8') { tokens.push({ type: 'consonant', phoneme: 'ɣ' }); i++;
        } else if (ch === '9') { tokens.push({ type: 'consonant', phoneme: 'sˤ' }); i++;

        // Regular consonants (case-insensitive via chL, after uppercase specials above)
        } else if (chL === 'b') { tokens.push({ type: 'consonant', phoneme: 'b' }); i++;
        } else if (chL === 'd') { tokens.push({ type: 'consonant', phoneme: 'd' }); i++;
        } else if (chL === 'f') { tokens.push({ type: 'consonant', phoneme: 'f' }); i++;
        } else if (chL === 'g') { tokens.push({ type: 'consonant', phoneme: 'g' }); i++;
        } else if (chL === 'h') { tokens.push({ type: 'consonant', phoneme: 'h' }); i++;
        } else if (chL === 'j') { tokens.push({ type: 'consonant', phoneme: 'ʒ' }); i++;
        } else if (chL === 'k') { tokens.push({ type: 'consonant', phoneme: 'k' }); i++;
        } else if (chL === 'l') { tokens.push({ type: 'consonant', phoneme: 'l' }); i++;
        } else if (chL === 'm') { tokens.push({ type: 'consonant', phoneme: 'm' }); i++;
        } else if (chL === 'n') { tokens.push({ type: 'consonant', phoneme: 'n' }); i++;
        } else if (chL === 'p') { tokens.push({ type: 'consonant', phoneme: 'p' }); i++;
        } else if (chL === 'q') { tokens.push({ type: 'consonant', phoneme: 'q' }); i++;
        } else if (chL === 'r') { tokens.push({ type: 'consonant', phoneme: 'r' }); i++;
        } else if (chL === 's') { tokens.push({ type: 'consonant', phoneme: 's' }); i++;
        } else if (chL === 't') { tokens.push({ type: 'consonant', phoneme: 't' }); i++;
        } else if (chL === 'v') { tokens.push({ type: 'consonant', phoneme: 'v' }); i++;
        } else if (chL === 'w') { tokens.push({ type: 'consonant', phoneme: 'w' }); i++;
        } else if (chL === 'x') { tokens.push({ type: 'consonant', phoneme: 'x' }); i++;
        } else if (chL === 'y') { tokens.push({ type: 'consonant', phoneme: 'j' }); i++;
        } else if (chL === 'z') { tokens.push({ type: 'consonant', phoneme: 'z' }); i++;

        // Short vowels
        } else if (chL === 'a') { tokens.push({ type: 'vowel', phoneme: 'a' }); i++;
        } else if (chL === 'e' || chL === 'i') { tokens.push({ type: 'vowel', phoneme: 'i' }); i++;
        } else if (chL === 'o' || chL === 'u') { tokens.push({ type: 'vowel', phoneme: 'u' }); i++;

        } else {
            tokens.push({ type: 'special', char: ch }); i++;
        }
    }
    return tokens;
}

function arabiziTokensToConsonants(phonemeTokens) {
    const consonants = [];
    let i = 0;
    while (i < phonemeTokens.length) {
        const tok = phonemeTokens[i];
        if (tok.type === 'consonant') {
            let vowel = null;
            if (i + 1 < phonemeTokens.length && phonemeTokens[i + 1].type === 'vowel') {
                vowel = phonemeTokens[i + 1].phoneme;
                i++;
            }
            consonants.push(new Consonant(tok.phoneme, vowel));
        } else {
            // Vowel-initial syllable: use blank consonant carrier
            consonants.push(new Consonant('blank', tok.phoneme));
        }
        i++;
    }
    return consonants;
}

function arabiziToDetails(text) {
    TripleOutput.AFTER_WHITESPACE = true;
    const allTokens = tokenizeArabizi(text);
    const output = new TripleOutput("", "", "", "");
    let buffer = [];

    function flushBuffer() {
        if (!buffer.length) return;
        const consonants = arabiziTokensToConsonants(buffer);
        output.string += consonants.map(c => c.toString()).join("-");
        output.ipa += buffer.map(t => t.phoneme).join("");
        output.cps += consonants.map(c => c.toCPs()).join("");
        buffer = [];
    }

    for (const tok of allTokens) {
        if (tok.type === 'special') {
            flushBuffer();
            output.push(TripleOutput.forSpecialChar(tok.char));
        } else {
            buffer.push(tok);
        }
    }
    flushBuffer();
    return output;
}
