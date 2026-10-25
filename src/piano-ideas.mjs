// Piano roll drafts are independent from the audio clips in the two recording tracks.
export const MAX_PIANO_IDEAS=128;
export const BEAT_UNITS=[1,2,4,8,16];
const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
export function cleanIdeaName(value,fallback='Idea'){
 const name=String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80);
 return name||fallback;
}
export function stepsPerBar(sequence){
 const beats=sequence?.beats??4,unit=sequence?.beatUnit??4;
 if(!integer(beats,1,32)||!BEAT_UNITS.includes(unit))throw Error('Compás del piano no válido. Usa de 1 a 32 pulsos y denominador 1, 2, 4, 8 o 16.');
 return beats*16/unit;
}
export function validateIdeaSequence(raw){
 if(!raw||!integer(raw.steps,1,10000000)||!Number.isFinite(raw.bpm)||raw.bpm<20||raw.bpm>300)throw Error('La secuencia de una idea de piano no es válida.');
 const sequence={steps:raw.steps,bpm:raw.bpm,beats:raw.beats,beatUnit:raw.beatUnit??4,cells:{}};
 stepsPerBar(sequence);
 if(!raw.cells||typeof raw.cells!=='object'||Array.isArray(raw.cells))throw Error('Las notas de una idea de piano no son válidas.');
 for(const [key,mask] of Object.entries(raw.cells)){
  const step=Number(key);
  if(!integer(step,0,raw.steps-1)||String(step)!==key||!integer(mask,1,0xffffff))throw Error('Hay notas no válidas en una idea de piano.');
  sequence.cells[step]=mask;
 }
 return sequence;
}
function emptySequence(prefs={}){
 const beats=integer(prefs.beats,1,32)?prefs.beats:4,beatUnit=BEAT_UNITS.includes(prefs.beatUnit)?prefs.beatUnit:4;
 return {steps:beats*16/beatUnit,bpm:Number.isFinite(prefs.bpm)?Math.min(300,Math.max(20,prefs.bpm)):90,beats,beatUnit,cells:{}};
}
function uniqueId(used){
 let id;
 do{id='idea-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10))}while(used.has(id));
 return id;
}
function validateIdeaTabs(rawIdeas,activeId,legacy,prefs={}){
 if(rawIdeas!==undefined&&(!Array.isArray(rawIdeas)||rawIdeas.length<1||rawIdeas.length>MAX_PIANO_IDEAS))throw Error(`El proyecto debe contener entre 1 y ${MAX_PIANO_IDEAS} ideas de piano.`);
 const used=new Set();
 const source=rawIdeas??[{id:'idea-1',name:'Idea 1',sequence:legacy||emptySequence(prefs)}];
 const pianos=source.map((idea,index)=>{
  if(!idea||typeof idea!=='object')throw Error('Una pestaña de piano no es válida.');
  const id=typeof idea.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(idea.id)&&!used.has(idea.id)?idea.id:uniqueId(used);
  used.add(id);
  return {id,name:cleanIdeaName(idea.name,`Idea ${index+1}`),sequence:validateIdeaSequence(idea.sequence)};
 });
 const selected=pianos.find(idea=>idea.id===activeId)||pianos[0];
 return {pianos,activePianoId:selected.id,piano:selected.sequence};
}
export function validatePianoIdeas(raw,prefs=raw?.prefs||{}){
 if(!raw||typeof raw!=='object')throw Error('El proyecto no contiene ideas válidas.');
 return validateIdeaTabs(raw.pianos,raw.activePianoId,raw.piano,prefs);
}
export function ensurePianoIdeas(state){
 // Preserve object identity while the application is open: edits through state.piano
 // must immediately belong to the selected tab without copying or losing notes.
 if(Array.isArray(state.pianos)&&state.pianos.length){
  const selected=state.pianos.find(idea=>idea.id===state.activePianoId)||state.pianos[0];
  state.activePianoId=selected.id;state.piano=selected.sequence;return selected;
 }
 Object.assign(state,validatePianoIdeas(state,state.prefs));
 return state.pianos[0];
}
export function activePianoIdea(state){return ensurePianoIdeas(state)}
export function selectPianoIdea(state,id){
 ensurePianoIdeas(state);
 const selected=state.pianos.find(idea=>idea.id===id);
 if(!selected)throw Error('No se ha encontrado esa idea de piano.');
 state.activePianoId=selected.id;state.piano=selected.sequence;return selected;
}
export function addPianoIdea(state,{name,duplicate=false}={}){
 const current=ensurePianoIdeas(state);
 if(state.pianos.length>=MAX_PIANO_IDEAS)throw Error(`Puedes guardar hasta ${MAX_PIANO_IDEAS} ideas en este proyecto.`);
 const names=new Set(state.pianos.map(idea=>idea.name));let count=state.pianos.length+1;
 while(names.has(`Idea ${count}`))count++;
 const id=uniqueId(new Set(state.pianos.map(idea=>idea.id)));
 const sequence=duplicate?validateIdeaSequence(current.sequence):emptySequence(state.prefs);
 const idea={id,name:cleanIdeaName(name,duplicate?`${current.name} · copia`:`Idea ${count}`),sequence};
 state.pianos.push(idea);return selectPianoIdea(state,id);
}
export function renamePianoIdea(state,id,name){
 ensurePianoIdeas(state);const idea=state.pianos.find(idea=>idea.id===id);
 if(!idea)throw Error('No se ha encontrado esa idea de piano.');
 if(!String(name??'').trim())throw Error('Escribe un nombre para la idea.');
 idea.name=cleanIdeaName(name);return idea;
}
export function removePianoIdea(state,id){
 ensurePianoIdeas(state);
 if(state.pianos.length===1)throw Error('Conserva al menos una pestaña de piano. Puedes limpiar sus notas.');
 const index=state.pianos.findIndex(idea=>idea.id===id);
 if(index<0)throw Error('No se ha encontrado esa idea de piano.');
 state.pianos.splice(index,1);
 if(state.activePianoId===id)selectPianoIdea(state,state.pianos[Math.min(index,state.pianos.length-1)].id);
 return activePianoIdea(state);
}
export function applyMeterToIdeas(state,beats,beatUnit,bpm){
 const bar=stepsPerBar({beats,beatUnit});
 if(!Number.isFinite(bpm)||bpm<20||bpm>300)throw Error('El tempo debe estar entre 20 y 300 BPM.');
 ensurePianoIdeas(state);
 const lengths=state.pianos.map(idea=>{
  const seq=idea.sequence,lastNote=Object.keys(seq.cells).reduce((highest,key)=>Math.max(highest,Number(key)+1),0);
  const steps=Math.max(bar,Math.ceil(Math.max(seq.steps,lastNote)/bar)*bar);
  if(steps>10000000)throw Error('Ese compás alarga demasiado una de las ideas. Reduce su duración.');
  return steps;
 });
 // Validate every tab before mutating any of them.
 state.pianos.forEach((idea,i)=>{const seq=idea.sequence;seq.steps=lengths[i];seq.beats=beats;seq.beatUnit=beatUnit;seq.bpm=bpm;});
 Object.assign(state.prefs,{beats,beatUnit,bpm});
 state.piano=state.pianos.find(idea=>idea.id===state.activePianoId).sequence;
 return state.piano;
}
