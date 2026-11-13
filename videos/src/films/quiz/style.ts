/** v2 palette: the reference's structure in RESHAPE colours. */
export const Q = {
  paper: '#ECE4DD',
  paperShade: '#DCD1C9',
  ink: '#1D1E21',
  charcoal: '#2F3034',
  charcoal2: '#444448',
  deep: '#18191C',
  orange: '#FF5420',
  orangeDeep: '#C9400F',
  cream: '#F6F0EB',
  sand: '#D9CCC4',
  red: '#E71B2A',
};
export const QF = {
  head: "'Zain', 'Plex Arabic', sans-serif",
  text: "'Plex Arabic', sans-serif",
  latin: "'Barlow SC', sans-serif",
};
/** Arabic-Indic digits. */
export const ar = (n: number | string) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
