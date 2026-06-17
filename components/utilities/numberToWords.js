export const numberToWords = (num) => {
    if (num === 0 || isNaN(num) || num === null || num === undefined) return 'ZERO RUPEES ONLY';
    
    const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    const convertChunk = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
        return a[Math.floor(n / 100)] + 'HUNDRED ' + (n % 100 !== 0 ? convertChunk(n % 100) : '');
    };

    let nStr = String(Number(num).toFixed(2));
    let [rupees, paisa] = nStr.split('.');
    
    let rs = parseInt(rupees, 10);
    let ps = parseInt(paisa, 10);
    
    if (rs === 0 && ps === 0) return 'ZERO RUPEES ONLY';

    let word = '';
    
    if (rs > 0) {
        if (rs >= 10000000) {
            word += convertChunk(Math.floor(rs / 10000000)) + 'CRORE ';
            rs %= 10000000;
        }
        if (rs >= 100000) {
            word += convertChunk(Math.floor(rs / 100000)) + 'LAKH ';
            rs %= 100000;
        }
        if (rs >= 1000) {
            word += convertChunk(Math.floor(rs / 1000)) + 'THOUSAND ';
            rs %= 1000;
        }
        if (rs > 0) {
            word += convertChunk(rs);
        }
        word += 'RUPEES ';
    }
    
    if (ps > 0) {
        if (rs > 0) word += 'AND ';
        word += convertChunk(ps) + 'PAISA ';
    }
    
    return word + 'ONLY';
};
