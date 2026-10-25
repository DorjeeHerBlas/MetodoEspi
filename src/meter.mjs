export const METER_UNITS=[1,2,4,8,16];
export const beatSeconds=(bpm,unit=4)=>60/bpm*4/unit;
export const cellsPerBar=(beats,unit=4)=>beats*16/unit;
export function parseMeter(text){
 const match=String(text).trim().match(/^(\d+(?:\s*\+\s*\d+)*)\s*\/\s*(\d+)$/);
 if(!match)throw Error('Escribe un compás como 4/4, 7/8 o 3+2+2/8.');
 const groups=match[1].split('+').map(Number),beatUnit=Number(match[2]),beats=groups.reduce((a,b)=>a+b,0);
 if(groups.some(n=>n<1)||beats>32||!METER_UNITS.includes(beatUnit))throw Error('Usa entre 1 y 32 pulsos y un denominador 1, 2, 4, 8 o 16.');
 const starts=new Set();let at=0;for(const n of groups){starts.add(at);at+=n;}
 return {beats,beatUnit,groups,pattern:Array.from({length:beats},(_,i)=>starts.has(i)?2:1),label:groups.join('+')+'/'+beatUnit};
}
