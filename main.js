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
        let consonantHTML = `<img class=consonant src="wugz/${consonant}.png"/>`;
        if (this.vowel) {
            return `<span class=syllable>${consonantHTML}<img class="vowel vowel-${this.vowel}" src="wugz/${this.vowel}_cropped.png"/></span>`
        } else {
            return `<span class=syllable>${consonantHTML}</span>`;
        }
    }

    static isConsonant(consonant) {
        return CONSONANTS.indexOf(consonant) != -1;
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
                   this.vowel = "schwa";
                   this.finishConsonant();
                   this.consonant = "r";
                   // Alice prefers to have coda r form a new syllable onset
                   // e.g. "dearest" => "de-re-s-t"
                   // this.finishConsonant();
            }
        } else {
            throw new TypeError(`Got unexpected IPA: ${current}`);
        }


        return true;
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
    let ipa = getIpa(word);
    if (!ipa) {
        return {
            "html": `<span class=unknown>${word}</span>`,
            "string": `<span class=unknown>${word}</span>`,
            "ipa": `<span class=unknown>${word}</span>`,

        };
    }

    let consonants = parseConsonants(ipa);
    let html = consonants.map((c) => c.toHtml());
    let string = consonants.map((c) => c.toString());
    return {
        "html": html.join(""),
        "string": string.join("-"),
        "ipa": ipa,
    };
}

function getDetails(words) {
    let arr = words.split(/\s+/).filter((w) => w).map((word) => getDetailsForWord(word));

    return {
        "html": arr.map((word) => word.html).join("<span class=space>&nbsp;</span>"),
        "string": arr.map((word) => word.string).join(" "),
        "ipa": arr.map((word) => word.ipa).join(" "),
    };
}