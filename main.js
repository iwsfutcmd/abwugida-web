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
    "y",
    "z",
    "ʒ",
    "θ",
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
    "fat_ha",
    "dommah",
    "kas_rah",
    "schwa",
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
            case "fat_ha":
                return "a";
            case "dommah":
                return "o";
            case "kas_rah":
                return "e";
            case "schwa":
                return "ə";
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
            return `<div class=syllable>${consonantHTML}<img class="vowel vowel-${this.vowel} ${maybeVoiceless}" src="wugz/${this.vowel}_cropped.png"/></div>`
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
        } else if (current == "j") {
            current = "y";
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
                   this.vowel = "kas_rah";
                   break;
               case "æ":
               case "a":
               case "ɑ":
                   this.vowel = "fat_ha";
                   break;
               case "o":
               case "ɔ":
               case "ʊ":
               case "u":
               // This one's controversial
               case "ʌ":
                   this.vowel = "dommah";
                   break;
               case "ə":
                   this.vowel = "schwa";
                   break;
               case "ɚ":
               case "ɝ":
                   this.vowel = "schwa";
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
    constructor(html, string, ipa) {
        this.html = html;
        this.ipa = ipa;
        this.string = string;

    }

    push(otherTriple) {
        this.html += otherTriple.html;
        this.ipa += otherTriple.ipa;
        this.string += otherTriple.string;
    }

    static forSpecialChar(ch) {
        if (ch == "\n") {
            return new TripleOutput("<br>", "⏎", "⏎");
        } else if (ch == " ") {
            return new TripleOutput("<div class=space>&nbsp;</div>", " ", " ")
        } else {
            return new TripleOutput(`<div class=char><div class=charbox>${ch}</div></div>`, ch, ch);
        }
    }
}
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

        let output = new TripleOutput("", "", "");


        for (ch of word) {
            output.push(TripleOutput.forSpecialChar(ch))
        }
        return output;
    }

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
    if (!ipa) {

        return new TripleOutput(`<div class=unknown><div class=charbox>${word}</div></div>`, `<span class=unknown>${word}</span>`, `<span class=unknown>${word}</span>`)

    }

    let consonants = parseConsonants(ipa);
    let html = consonants.map((c) => c.toHtml());
    let string = consonants.map((c) => c.toString());
    return new TripleOutput(html.join(""), string.join("-"), ipa)
}

function getDetails(words) {
    // By grouping the match, .split() returns alternating matched text and unmatched text
    // so we can attempt to preserve non-words
    //
    // regex is gnarly to match contractions but not single quotation marks
    let arr = words.split(/([a-zA-Z]+[a-zA-Z'][a-zA-Z]+|[a-zA-Z]+)/).map((word) => getDetailsForWord(word));

    return new TripleOutput(
         arr.map((word) => word.html).join(""),
         arr.map((word) => word.string).join(""),
         arr.map((word) => word.ipa).join(""),
       );
}