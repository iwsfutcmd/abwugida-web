var cmu;

fetch("./cmu.json")
    .then(c => c.json())
    .then(c => {cmu = c})
    .catch(error => console.log(error));

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
]

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
        return `${this.consonant}${this.vowelToString()}`
    }

    vowelToString() {
        switch (this.vowel) {
            case "fat_ha":
                return "a";
            case "dommah":
                return "o";
            case "kas_rah":
                return "e";
        }
    }

    static isConsonant(consonant) {
        return CONSONANTS.indexOf(consonant) != -1;
    }

    static isVowel(vowel) {
        return VOWELS.indexOf(vowel) != -1;
    }
}


function getIpa(word) {}

function parseConsonants(ipa) {



}