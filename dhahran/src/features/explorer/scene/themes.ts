/**
 * Scene colour themes. Material colours follow the supplied renders
 * (orange steel columns, fair-faced concrete, dark rubber floor, red track,
 * blue glazing); the accent bar uses the RESHAPE accent token.
 */
export type ThemeName = 'dark' | 'light';

interface Palette {
  floor: string; floorUpper: string; lobby: string; tile: string;
  wallN: string; wallW: string; joint: string;
  slabL: string; slabR: string; slabD: string;
  partN: string; partW: string; partD: string; cut: string;
  colT: string; colL: string; colR: string;
  steel: string; post: string; accent: string;
  track: string; lane: string; glass: string; glassEdge: string;
  matA: string; matB: string; matC: string;
  softA: string; softB: string; softC: string;
  gear: string; gearSide: string; desk: string; deskSide: string;
  bench: string; stair: string; stairSide: string;
  turf: string; turfLine: string;
  fig: string; guide: string; door: string; screen: string; line: string; spot: string;
}

const dark: Palette = {
  floor: '#26272B', floorUpper: '#2B2C31', lobby: '#4A4B50', tile: '#3F5560',
  wallN: '#B4B3AD', wallW: '#8F8E89', joint: '#77767180',
  slabL: '#E9E2DA', slabR: '#C9C2BA', slabD: '#D9D2CA',
  partN: '#D8D3CCE6', partW: '#B9B4ADE6', partD: '#C8C3BCE6', cut: '#6B6A66',
  colT: '#F5A25A', colL: '#E8822E', colR: '#B86420',
  steel: '#F7F0E9', post: '#C9C2BA', accent: '#FF5420',
  track: '#B3261E', lane: '#F3E3D6', glass: '#6FA8F033', glassEdge: '#9CC6FA',
  matA: '#E9DDD0', matB: '#F2C9AD', matC: '#C9D8D2',
  softA: '#F2C9AD', softB: '#D9CCC4', softC: '#9CC6FA',
  gear: '#8A8B90', gearSide: '#5F6065', desk: '#F7F0E9', deskSide: '#CFC6BD',
  bench: '#A58B74', stair: '#DAD5CE', stairSide: '#A9A49D',
  turf: '#3E5A48', turfLine: '#F3E3D680',
  fig: '#FFFFFF', guide: '#8A8B9099', door: '#55565B', screen: '#111113', line: '#FF542099', spot: '#FF5420',
};

const light: Palette = {
  floor: '#E7DDD2', floorUpper: '#E2D7CB', lobby: '#D2C9C0', tile: '#C5D6DC',
  wallN: '#FFFFFF', wallW: '#F0E8DF', joint: '#C9BDB080',
  slabL: '#CFC4B8', slabR: '#B5A99C', slabD: '#C2B6AA',
  partN: '#FFFFFFE6', partW: '#EDE4DAE6', partD: '#F6EEE6E6', cut: '#A89C90',
  colT: '#F5A25A', colL: '#E8822E', colR: '#B86420',
  steel: '#17181A', post: '#5C544E', accent: '#E8401D',
  track: '#C8372D', lane: '#FFF5EC', glass: '#5B97E033', glassEdge: '#4F86CC',
  matA: '#FFF8EF', matB: '#F7C9A9', matC: '#CFE2DA',
  softA: '#F7B58C', softB: '#FFFFFF', softC: '#A9CDF5',
  gear: '#6B635C', gearSide: '#4A433E', desk: '#FFFFFF', deskSide: '#DCCFC4',
  bench: '#B08D6E', stair: '#FFFFFF', stairSide: '#D9CEC3',
  turf: '#A9C7AE', turfLine: '#FFFFFFB3',
  fig: '#17181A', guide: '#8B817A99', door: '#B9AEA3', screen: '#17181A', line: '#E8401D99', spot: '#E8401D',
};

export const PALETTES: Record<ThemeName, Palette> = { dark, light };

export function stylesheet(theme: ThemeName): string {
  const p = PALETTES[theme];
  const edge = theme === 'dark' ? '#0E0F10' : '#8B817A';
  const css = `
path,circle,ellipse{stroke-linejoin:round;stroke-linecap:round}
.floor{fill:${p.floor}}.floor-upper{fill:${p.floorUpper}}.floor-lobby{fill:${p.lobby}}.floor-tile{fill:${p.tile}}
.wall-n{fill:${p.wallN}}.wall-w{fill:${p.wallW}}.joint{fill:none;stroke:${p.joint};stroke-width:1}
.slab-l{fill:${p.slabL}}.slab-r{fill:${p.slabR}}.slab-d{fill:${p.slabD}}
.part-n{fill:${p.partN};stroke:${edge};stroke-width:.6}.part-w{fill:${p.partW};stroke:${edge};stroke-width:.6}.part-d{fill:${p.partD};stroke:${edge};stroke-width:.6}
.cut-l,.cut-r,.cut-d{fill:${p.cut};stroke:${edge};stroke-width:.5}
.col-t{fill:${p.colT}}.col-l{fill:${p.colL}}.col-r{fill:${p.colR}}
.steel{fill:none;stroke:${p.steel};stroke-width:3}.steel-thin{fill:none;stroke:${p.steel};stroke-width:1.5}
.post{fill:none;stroke:${p.post};stroke-width:2.4}.bar-accent{fill:none;stroke:${p.accent};stroke-width:4.5}
.strap{fill:none;stroke:${p.post};stroke-width:1.2}.ring{fill:none;stroke:${p.steel};stroke-width:2}
.track{fill:${p.track}}.lane{fill:none;stroke:${p.lane};stroke-width:1.4}
.glass{fill:${p.glass};stroke:${p.glassEdge};stroke-width:.5;stroke-opacity:.5}.glass-edge{fill:none;stroke:${p.glassEdge};stroke-width:1.6}
.mat-a{fill:${p.matA}}.mat-b{fill:${p.matB}}.mat-c{fill:${p.matC}}
.soft-a-t{fill:${p.softA}}.soft-a-l{fill:${p.softA};filter:brightness(.86)}.soft-a-r{fill:${p.softA};filter:brightness(.72)}
.soft-b-t{fill:${p.softB}}.soft-b-l{fill:${p.softB};filter:brightness(.86)}.soft-b-r{fill:${p.softB};filter:brightness(.72)}
.soft-c-t{fill:${p.softC}}.soft-c-l{fill:${p.softC};filter:brightness(.86)}.soft-c-r{fill:${p.softC};filter:brightness(.72)}
.beam-t{fill:${p.bench}}.beam-l{fill:${p.bench};filter:brightness(.82)}.beam-r{fill:${p.bench};filter:brightness(.7)}
.gear-t{fill:${p.gear}}.gear-l,.gear-r{fill:${p.gearSide}}
.desk-t{fill:${p.desk}}.desk-l{fill:${p.deskSide}}.desk-r{fill:${p.deskSide};filter:brightness(.88)}
.bench-t{fill:${p.bench}}.bench-l{fill:${p.bench};filter:brightness(.82)}.bench-r{fill:${p.bench};filter:brightness(.7)}
.stair-t{fill:${p.stair}}.stair-l{fill:${p.stairSide}}.stair-r{fill:${p.stairSide};filter:brightness(.85)}
.turf{fill:${p.turf}}.turf-line{fill:none;stroke:${p.turfLine};stroke-width:1}
.fig{fill:none;stroke:${p.fig};stroke-width:3.4}.fig.sm{stroke-width:2.5}.fig-head{fill:${p.fig}}
.guide{fill:none;stroke:${p.guide};stroke-width:1;stroke-dasharray:3 5}
.door{fill:${p.door}}.screen{fill:${p.screen}}.floor-line{fill:none;stroke:${p.line};stroke-width:2}
.spot{fill:${p.spot}}.anchor{fill:none;stroke:none}`;
  return css.replace(/\n/g, '');
}
