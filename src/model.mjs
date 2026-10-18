export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const time=s=>{s=Math.max(0,Math.floor(s||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
export const defaults=()=>({version:2,prefs:{scaleId:'mayor',root:0,flats:false,international:false,instrumentId:'guitar',preset:'standard',tuning:[64,59,55,50,45,40],leftHanded:false,mode:'scale',highlight:[],bpm:90,beats:4,pattern:[2,1,1,1],subdivision:1,clickVolume:.24,recordClick:false,countRecord:true,countPlay:true,syncOffset:80,inputId:'',outputId:'',audioFormat:'WAV',reference:440,tunerSound:true,pianoTarget:1,toneCount:3,cursor:0,noteLength:4},memo:'',exercises:{},piano:{steps:16,bpm:90,beats:4,cells:{}},tracks:[emptyTrack(0),emptyTrack(1)]});
export function emptyTrack(i){return {pcm:null,rate:48000,trimStart:0,trimEnd:0,alignmentMs:0,volume:1,muted:false,repeat:i===0,piano:null,sourceName:'',bpm:90,pattern:[2,1,1,1],subdivision:1};}
export function freshExercise(root){return {selection:[root],attempts:0,correct:false,shown:false,harmony:{visible:1,answers:Array(28).fill(-1),attempts:[0,0,0,0],correct:[false,false,false,false],revealed:[false,false,false,false],feedback:''}};}
export function exerciseFor(state){const key=`${state.prefs.scaleId}:${state.prefs.root}`;return state.exercises[key]??=(freshExercise(state.prefs.root));}
export function settled(h,row=h.visible){return row===0||!!h.correct[row-1]||!!h.revealed[row-1]}
export function checkScale(ex,expected){if(ex.correct||ex.attempts>=3)return ex.correct;ex.attempts++;ex.correct=expected.length===ex.selection.length&&expected.every(n=>ex.selection.includes(n));return ex.correct;}
export function checkRow(h,expected){const r=h.visible;if(!r||settled(h)||h.attempts[r-1]>=3)return false;h.attempts[r-1]++;h.correct[r-1]=expected.every((n,i)=>h.answers[(r-1)*7+i]===n);return h.correct[r-1];}
export function changeRows(h,delta){if(delta>0){if(h.visible<4&&settled(h))h.visible++;}else if(h.visible>0)h.visible--;return h.visible;}
export function display(note,prefs){return prefs.international?note.letter:note.name}
export function musicalCase(db,prefs){const c=db.cases[`${prefs.scaleId}:${prefs.root}:${prefs.flats?1:0}`];if(!c)throw Error('La escala o tónica no existe en el catálogo musical.');return c;}
export function chordAt(c,column,row){return {notes:Array.from({length:row+1},(_,r)=>c.notes[(column+2*r)%7]),...c.rows[row][column]};}
export function trackWindow(t){const end=clamp(t.trimEnd||t.pcm?.length||0,0,t.pcm?.length||0);return {start:clamp(t.trimStart||0,0,end),end};}
export function trackDuration(t){if(!t.pcm?.length)return 0;const w=trackWindow(t);return Math.max(0,(w.end-w.start)/t.rate+t.alignmentMs/1000);}
export function sourcePosition(t,seconds){if(!t.pcm?.length)return null;const w=trackWindow(t),length=(w.end-w.start)/t.rate;let s=seconds-t.alignmentMs/1000;if(s<0||(!t.repeat&&s>=length)||length<=0)return null;if(t.repeat)s%=length;return s+w.start/t.rate;}
export function sourceIndex(frame,length,offset,repeating){const at=frame-offset;return at<0||(!repeating&&at>=length)||length<=0?-1:at%length;}
export function validateProject(raw,db){
 if(!raw||raw.version!==2||!raw.prefs||!Array.isArray(raw.tracks)||raw.tracks.length!==2)throw Error('No es un proyecto METODOESPI2 compatible.');
 const d=defaults(),p=raw.prefs;musicalCase(db,p);
 for(const k of ['root','bpm','beats','subdivision','syncOffset','reference'])if(!Number.isFinite(p[k]))throw Error('Ajustes numéricos no válidos.');
 if(p.root%1||p.root<0||p.root>11||p.bpm<20||p.bpm>300||p.beats<1||p.beats>12||p.beats%1||p.reference<420||p.reference>460)throw Error('Tónica, tempo, compás o referencia fuera de rango.');
 if(!db.instruments.some(i=>i.id===p.instrumentId)||!Array.isArray(p.tuning)||p.tuning.length<4||p.tuning.length>6||p.tuning.some(n=>!Number.isInteger(n)||n<12||n>96))throw Error('Afinación no válida.');
 for(const k of Object.keys(d.prefs))if(k in p){const type=typeof d.prefs[k];if(type==='boolean')d.prefs[k]=p[k]===true;else if(type==='string')d.prefs[k]=typeof p[k]==='string'?p[k].slice(0,2000):d.prefs[k];else if(type==='number')d.prefs[k]=Number.isFinite(p[k])?p[k]:d.prefs[k];}
 d.prefs.tuning=[...p.tuning];d.prefs.highlight=Array.isArray(p.highlight)?p.highlight.filter(n=>Number.isInteger(n)&&n>=0&&n<12):[];d.prefs.mode=['scale','all','selected'].includes(p.mode)?p.mode:'scale';d.prefs.pianoTarget=[1,2,3].includes(p.pianoTarget)?p.pianoTarget:1;d.prefs.toneCount=[3,4,5].includes(p.toneCount)?p.toneCount:3;d.prefs.noteLength=Number.isInteger(p.noteLength)&&p.noteLength>0&&p.noteLength<=48?p.noteLength:4;d.prefs.cursor=Number.isInteger(p.cursor)&&p.cursor>=0?p.cursor:0;d.prefs.clickVolume=clamp(Number(p.clickVolume)||0,0,1);
 d.prefs.audioFormat=p.audioFormat==='MP3'?'MP3':'WAV';d.prefs.pattern=Array.from({length:p.beats},(_,i)=>clamp(Number(p.pattern?.[i])||0,0,2));d.prefs.subdivision=clamp(Math.round(p.subdivision),1,4);d.prefs.syncOffset=clamp(p.syncOffset,0,2000);
 d.memo=String(raw.memo||'').slice(0,500000);d.piano=validatePiano(raw.piano);
 // Exercise state is user-editable and never used to derive musical truth.
 if(raw.exercises&&typeof raw.exercises==='object')for(const [key,e] of Object.entries(raw.exercises).slice(0,168)){
  const [id,r]=key.split(':');if(!db.scales.some(s=>s.id===id)||!Number.isInteger(+r)||+r<0||+r>11)continue;
  const ex=freshExercise(+r);ex.selection=Array.isArray(e.selection)?[...new Set(e.selection.filter(n=>Number.isInteger(n)&&n>=0&&n<12))]:[+r];if(!ex.selection.includes(+r))ex.selection.push(+r);
  ex.attempts=clamp(Math.floor(e.attempts)||0,0,3);ex.correct=!!e.correct;ex.shown=!!e.shown;
  if(e.harmony){const h=e.harmony;ex.harmony.visible=clamp(Math.floor(h.visible)||0,0,4);for(let i=0;i<28;i++)ex.harmony.answers[i]=Number.isInteger(h.answers?.[i])?clamp(h.answers[i],-1,11):-1;for(let i=0;i<4;i++){ex.harmony.attempts[i]=clamp(Math.floor(h.attempts?.[i])||0,0,3);ex.harmony.correct[i]=!!h.correct?.[i];ex.harmony.revealed[i]=!!h.revealed?.[i];}for(let r=1;r<ex.harmony.visible;r++)if(!settled(ex.harmony,r))ex.harmony.visible=r;}
  d.exercises[key]=ex;
 }
 let bytes=0;d.tracks=raw.tracks.map((t,i)=>{const x=emptyTrack(i);if(!t?.pcm)return x;const pcm=t.pcm instanceof Float32Array?t.pcm:new Float32Array(t.pcm);bytes+=pcm.byteLength;if(bytes>256*1024*1024||!pcm.length||pcm.some(n=>!Number.isFinite(n)||Math.abs(n)>16))throw Error('El audio del proyecto no es válido o es demasiado grande.');if(!Number.isInteger(t.rate)||t.rate<8000||t.rate>192000)throw Error('Frecuencia de muestreo no válida.');Object.assign(x,{pcm,rate:t.rate,sourceName:String(t.sourceName||'Audio').slice(0,240),volume:clamp(Number(t.volume)||0,0,1),muted:!!t.muted,repeat:!!t.repeat,bpm:clamp(Math.round(t.bpm)||90,20,300),pattern:Array.isArray(t.pattern)?t.pattern.slice(0,12).map(n=>clamp(Math.round(n)||0,0,2)):[2,1,1,1],subdivision:clamp(Math.round(t.subdivision)||1,1,4)});x.trimStart=clamp(Math.round(t.trimStart)||0,0,pcm.length-1);x.trimEnd=clamp(Math.round(t.trimEnd)||pcm.length,x.trimStart+1,pcm.length);x.alignmentMs=clamp(Math.round(t.alignmentMs)||0,Math.max(-2000,10-(x.trimEnd-x.trimStart)*1000/x.rate),2000);x.piano=t.piano?validatePiano(t.piano):null;return x});
 return d;
}
export function validatePiano(p){if(!p||!Number.isInteger(p.steps)||p.steps<1||p.steps>10000000||!Number.isFinite(p.bpm)||p.bpm<20||p.bpm>300||!Number.isInteger(p.beats)||p.beats<1||p.beats>12)throw Error('La secuencia de piano no es válida.');const cells={};for(const [key,mask] of Object.entries(p.cells||{})){const step=Number(key);if(!Number.isInteger(step)||step<0||step>=p.steps||!Number.isInteger(mask)||mask<1||mask>0xffffff)throw Error('Hay notas MIDI no válidas.');cells[step]=mask;}return {steps:p.steps,bpm:p.bpm,beats:p.beats,cells};}
