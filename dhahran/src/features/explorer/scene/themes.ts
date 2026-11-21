/**
 * Map colours. Materials follow the owner-supplied design deck: red steel
 * structure, fair-faced concrete, dark rubber floor, green turf lane,
 * terrazzo and blue tile at reception, brass desk, blue lockers, orange and
 * white chevron balustrade.
 */
export type ThemeName = 'dark';

const p = {
  floor: '#25262A', terrazzo: '#CFC9C0', tile: '#7FA7BD', tileGrey: '#B9B7B1',
  wallN: '#B4B3AD', wallW: '#8F8E89', brick: '#9B553B', brickJoint: '#7C402B', joint: '#77767180',
  slabL: '#E9E2DA', slabR: '#C9C2BA', slabD: '#D9D2CA',
  partN: '#D8D3CCE6', partW: '#B9B4ADE6', partD: '#C8C3BCE6', cut: '#6B6A66',
  red: '#E0402A', redTop: '#F0654A', redSide: '#A92C18',
  post: '#9A9BA1', bar: '#FF5420', wood: '#E9A15C', steel: '#EDE6DE',
  turf: '#2F7D48', turfLine: '#F3EFE6',
  mach: '#55575D', machTop: '#6B6D74', machSide: '#3D3F44', belt: '#1A1B1D', seat: '#C9382A', pad: '#2B2C30', padTop: '#3A3B40',
  plate: '#C9382A', kb: '#C9382A', plyo: '#E3B81C', plyoSide: '#B8930F',
  gold: '#C9A54A', goldSide: '#9A7C2E', black: '#1B1B1D', blackTop: '#2C2D31', counter: '#8E8D88', counterTop: '#A5A49E',
  shelf: '#34353A', shelfTop: '#4A4B51', table: '#3A3B40', tableTop: '#55565C',
  chairA: '#F28B30', chairB: '#A9D6C9',
  locker: '#2F4AA0', lockerTop: '#4463C4', lockerGrey: '#6C6E75', lockerGreyTop: '#8A8C93', bench: '#B56A3A', vanity: '#E3A996',
  desk: '#F2EEE8', deskSide: '#CFC6BD',
  stair: '#DAD5CE', stairSide: '#A9A49D',
  glass: '#7FB4F02E', glassEdge: '#9CC6FA', frame: '#E0402A', doorLeaf: '#B9BCC2',
  rail: '#F4F1EB', chevA: '#F47B20', chevB: '#E0402A',
  fig: '#FFFFFF', door: '#55565B', tyre: '#141416', tyreTop: '#2E2F33',
};

export function stylesheet(_theme: ThemeName = 'dark'): string {
  void _theme;
  const edge = '#0E0F10';
  const box = (n: string, top: string, l: string, r: string) => `.${n}-t{fill:${top}}.${n}-l{fill:${l}}.${n}-r{fill:${r}}`;
  const css = `
path,circle,ellipse{stroke-linejoin:round;stroke-linecap:round}
.floor{fill:${p.floor}}.terrazzo{fill:${p.terrazzo}}.tile{fill:${p.tile}}.tile-grey{fill:${p.tileGrey}}
.wall-n{fill:${p.wallN}}.wall-w{fill:${p.wallW}}.wall-brick{fill:${p.brick}}.brick-joint{fill:none;stroke:${p.brickJoint};stroke-width:.8}
.joint{fill:none;stroke:${p.joint};stroke-width:1}
.slab-l{fill:${p.slabL}}.slab-r{fill:${p.slabR}}.slab-d{fill:${p.slabD}}
.part-n{fill:${p.partN};stroke:${edge};stroke-width:.6}.part-w{fill:${p.partW};stroke:${edge};stroke-width:.6}.part-d{fill:${p.partD};stroke:${edge};stroke-width:.6}
.cut-l,.cut-r{fill:${p.cut};stroke:${edge};stroke-width:.5}
${box('col', p.redTop, p.red, p.redSide)}
.post{fill:none;stroke:${p.post};stroke-width:2.2}.bar{fill:none;stroke:${p.bar};stroke-width:3.4}.bar-wood{fill:none;stroke:${p.wood};stroke-width:3}
.steel-thin{fill:none;stroke:${p.steel};stroke-width:1.6}.strap{fill:none;stroke:${p.post};stroke-width:1.2}.ring{fill:none;stroke:${p.wood};stroke-width:2}
.ladder{fill:${p.redSide}}.ladder-rung{fill:none;stroke:${p.redTop};stroke-width:1.6}
.turf{fill:${p.turf}}.turf-line{fill:none;stroke:${p.turfLine};stroke-width:2}
${box('mach', p.machTop, p.mach, p.machSide)}.belt{fill:${p.belt}}.fan{fill:${p.belt};stroke:${p.post};stroke-width:1.6}
${box('seat', p.seat, p.seat, '#8E2318')}${box('pad', p.padTop, p.pad, '#1E1F22')}
.plate{fill:${p.plate};stroke:${edge};stroke-width:.6}${box('kb', '#E0564A', p.kb, '#8E2318')}
${box('plyo', '#F0CC3E', p.plyo, p.plyoSide)}.platform{fill:#3A2F28;stroke:${p.wood};stroke-width:1}
${box('gold', '#DEC06E', p.gold, p.goldSide)}${box('bar-black', p.blackTop, p.black, '#101012')}${box('counter', p.counterTop, p.counter, '#74736F')}
${box('shelf', p.shelfTop, p.shelf, '#25262A')}${box('table', p.tableTop, p.table, '#2B2C30')}${box('table-base', p.table, '#2B2C30', '#222327')}
${box('chair-a', '#F7A458', p.chairA, '#C76C1C')}${box('chair-b', '#C6E6DC', p.chairB, '#84B5A7')}
${box('locker', p.lockerTop, p.locker, '#22367A')}.locker-line{fill:none;stroke:#22367A;stroke-width:1}
${box('locker-grey', p.lockerGreyTop, p.lockerGrey, '#55575D')}${box('bench', '#CC8452', p.bench, '#8C4F28')}${box('vanity', '#F2C4B4', p.vanity, '#B98674')}
${box('desk', p.desk, p.deskSide, '#B5ACA2')}${box('stair', p.stair, p.stairSide, '#8F8A84')}
.glass{fill:${p.glass}}.glass-edge{fill:none;stroke:${p.glassEdge};stroke-width:1.6}.frame{fill:none;stroke:${p.frame};stroke-width:2.6}
.door-leaf{fill:${p.doorLeaf};stroke:${p.frame};stroke-width:1.4}.door{fill:${p.door}}
.rail{fill:${p.rail}}.chev-a{fill:${p.chevA}}.chev-b{fill:${p.chevB}}
.tyre{fill:${p.tyre}}.tyre-top{fill:${p.tyreTop}}.tyre-hole{fill:${p.floor}}
.fig{fill:none;stroke:${p.fig};stroke-width:3.2}.fig-head{fill:${p.fig}}
.anchor{fill:none;stroke:none}`;
  return css.replace(/\n/g, '');
}
