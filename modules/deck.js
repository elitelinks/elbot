'use strict';
var defaults = {
    "decks" : 1,
    "jokers" : 0
}
function Deck(settings) {
    this.cards = [];
    var settings = settings || defaults;
    this.filldeck = () => {
        var decksNeeded = settings.decks || defaults.decks
        var jokersNeeded = settings.jokers || defaults.jokers
        while (decksNeeded > 0) {
            this.cards.push('As');
            this.cards.push('Ks');
            this.cards.push('Qs');
            this.cards.push('Js');
            this.cards.push('Ts');
            this.cards.push('9s');
            this.cards.push('8s');
            this.cards.push('7s');
            this.cards.push('6s');
            this.cards.push('5s');
            this.cards.push('4s');
            this.cards.push('3s');
            this.cards.push('2s');
            this.cards.push('Ah');
            this.cards.push('Kh');
            this.cards.push('Qh');
            this.cards.push('Jh');
            this.cards.push('Th');
            this.cards.push('9h');
            this.cards.push('8h');
            this.cards.push('7h');
            this.cards.push('6h');
            this.cards.push('5h');
            this.cards.push('4h');
            this.cards.push('3h');
            this.cards.push('2h');
            this.cards.push('Ad');
            this.cards.push('Kd');
            this.cards.push('Qd');
            this.cards.push('Jd');
            this.cards.push('Td');
            this.cards.push('9d');
            this.cards.push('8d');
            this.cards.push('7d');
            this.cards.push('6d');
            this.cards.push('5d');
            this.cards.push('4d');
            this.cards.push('3d');
            this.cards.push('2d');
            this.cards.push('Ac');
            this.cards.push('Kc');
            this.cards.push('Qc');
            this.cards.push('Jc');
            this.cards.push('Tc');
            this.cards.push('9c');
            this.cards.push('8c');
            this.cards.push('7c');
            this.cards.push('6c');
            this.cards.push('5c');
            this.cards.push('4c');
            this.cards.push('3c');
            this.cards.push('2c');
            decksNeeded--;
        }
        while (jokersNeeded > 0) {this.cards.push('Or'); jokersNeeded--;}
    };
    this.shuffle = () => {
        var i, j, tempi, tempj;
        for (i = 0; i < this.cards.length; i += 1) {
            j = Math.floor(Math.random() * (i + 1));
            tempi = this.cards[i];
            tempj = this.cards[j];
            this.cards[i] = tempj;
            this.cards[j] = tempi;
        }
    };
};
module.exports = Deck;