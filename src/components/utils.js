import { intcomma } from 'journalize';

const formatNumber = (num) => {
  return num > 0 ? intcomma(num) : 'Reach not available';
}

const mapColor = () => [
  [3, '#ffe09a'],
  [6, '#faad7b'],
  [9, '#766B86'],
  [12, '#046e9a'],
  [15, '#044356'],
  // [18, '#2c2e42']
];

export {
  formatNumber,
  mapColor
};
