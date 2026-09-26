const en = require('./public/js/features/i18n/en.js').default;
const pt = require('./public/js/features/i18n/pt.js').default;

const enKeys = Object.keys(en);
const ptKeys = Object.keys(pt);

const missingInPt = enKeys.filter(k => !ptKeys.includes(k));
console.log('Keys in EN:', enKeys.length);
console.log('Keys in PT:', ptKeys.length);
console.log('Missing in PT:', missingInPt);
