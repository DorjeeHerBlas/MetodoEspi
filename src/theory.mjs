/**
 * Browser harmony adapter. Diatonic results remain those of the Kotlin engine.
 * Pentatonic/blues stacks prioritize available chord tones and never masquerade as
 * tertian triads/sevenths/ninths when omitted or chromatic degrees prevent that.
 * Naming conventions: Open Music Theory, "Triads and seventh chords", and the
 * Society for Music Theory Jazz Interest Group's Chord Symbol Guidelines.
 */
const ROMANS=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII'];
const NATURAL_INTERVALS=[0,2,4,5,7,9,11];
const LETTERS='CDEFGAB';
const cases=new WeakMap();
const mod=(n,d)=>((n%d)+d)%d;

export function semitoneFormula(semitones){
 if(!Number.isInteger(semitones)||semitones<0)throw Error('Intervalo no válido.');
 if(!semitones)return '0 ST';
 const tones=Math.floor(semitones/2),whole=tones===0?'':tones===1?'T':`${tones} T`;
 return semitones%2?(tones?`${whole} + ST`:'ST'):whole;
}

/** Roman root degrees refer to the same major-scale reference as the formula. */
export function romanDegree(label,intervals){
 let text=String(label??'').replace(/b/g,'♭').replace(/#/g,'♯');
 const numeric=text.match(/^([♭♯]*)(\d+)(?:[.ªº]*)$/);
 if(numeric){const number=Number(numeric[2]);if(number<1||number>ROMANS.length)throw Error('Grado fuera de rango.');text=numeric[1]+ROMANS[number-1];}
 else if(!/^[♭♯]*[IVX]+[°+ø]?$/i.test(text))throw Error('Grado musical no válido.');
 if(intervals){
  const pcs=new Set(intervals.map(n=>mod(n,12))),minor=pcs.has(3)&&!pcs.has(4);
  if(minor)text=text.replace(/[IVX]+/,s=>s.toLowerCase());
  if(minor&&pcs.has(6)&&!pcs.has(7))text+='°';
  else if(pcs.has(4)&&pcs.has(8)&&!pcs.has(7))text+='+';
 }
 return text;
}

function intervalClue(root,note,semitones){
 const base=mod(LETTERS.indexOf(note.letter[0])-LETTERS.indexOf(root.letter[0]),7);
 const octaves=Math.max(0,Math.round((semitones-NATURAL_INTERVALS[base])/12));
 const distance=base+octaves*7,degree=distance+1;
 const standard=NATURAL_INTERVALS[base]+12*octaves,difference=semitones-standard;
 const accidental=difference<0?'♭'.repeat(-difference):'♯'.repeat(difference);
 const perfect=[0,3,4].includes(base);
 let quality;
 if(difference===0)quality=perfect?'justa':'mayor';
 else if(difference===-1&&!perfect)quality='menor';
 else if(difference>0)quality=difference===1?'aumentada':`${difference} veces aumentada`;
 else{const times=-difference-(perfect?0:1);quality=times===1?'disminuida':`${times} veces disminuida`;}
 return {degree:accidental+degree,name:semitones===0?'Unísono':`${degree}.ª ${quality}`,semitones,formula:semitoneFormula(semitones)};
}

const SONORITIES=new Map();
function sonority(pitches,suffix,quality,triad=false){SONORITIES.set(pitches.join(','),{suffix,quality,triad});}
// Each entry names an exact pitch-class set, not an inferred missing chord.
sonority([0,4,7],'','Mayor',true);
sonority([0,3,7],'m','Menor',true);
sonority([0,3,6],'dim','Disminuido',true);
sonority([0,4,8],'aug','Aumentado',true);
sonority([0,2,7],'sus2','Suspendido de segunda');
sonority([0,5,7],'sus4','Suspendido de cuarta');
sonority([0,4,7,9],'6','Mayor con sexta');
sonority([0,3,7,9],'m6','Menor con sexta');
sonority([0,4,7,10],'7','Séptima dominante');
sonority([0,4,7,11],'Maj7','Séptima mayor');
sonority([0,3,7,10],'m7','Séptima menor');
sonority([0,3,7,11],'m(Maj7)','Menor con séptima mayor');
sonority([0,3,6,10],'m7♭5','Semidisminuido');
sonority([0,3,6,9],'dim7','Disminuido de séptima');
sonority([0,4,8,10],'7♯5','Dominante con quinta aumentada');
sonority([0,4,8,11],'Maj7♯5','Mayor séptima con quinta aumentada');
sonority([0,2,4,7],'(add9)','Mayor con novena añadida');
sonority([0,2,3,7],'m(add9)','Menor con novena añadida');
sonority([0,2,4,7,9],'6/9','Mayor con sexta y novena');
sonority([0,2,3,7,9],'m6/9','Menor con sexta y novena');
sonority([0,2,4,7,10],'9','Dominante de novena');
sonority([0,2,4,7,11],'Maj9','Mayor de novena');
sonority([0,2,3,7,10],'m9','Menor de novena');
sonority([0,2,3,7,11],'m(Maj9)','Menor con novena y séptima mayor');
sonority([0,5,7,10],'7sus4','Séptima suspendida de cuarta');
sonority([0,2,5,7,10],'9sus4','Novena suspendida de cuarta');
sonority([0,3,5,7,10],'m11(no9)','Menor de oncena sin novena');
sonority([0,4,5,7,10],'11(no9)','Dominante de oncena sin novena');
sonority([0,5,7,9],'6sus4','Sexta suspendida de cuarta');
sonority([0,2,5,7,9],'6sus4(add9)','Sexta suspendida con novena añadida');
// Useful complete/partial sonorities within the five-note pentatonic sets.
sonority([0,4,9],'6(no5)','Sexta mayor sin quinta');
sonority([0,2,4,9],'6/9(no5)','Sexta y novena sin quinta');
sonority([0,5,10],'7sus4(no5)','Séptima suspendida sin quinta');
sonority([0,2,5,10],'9sus4(no5)','Novena suspendida sin quinta');
sonority([0,3,5,10],'m11(no5,no9)','Menor de oncena sin quinta ni novena');
sonority([0,3,5,8,10],'m11(♭13,no5,no9)','Menor de oncena con sexta menor, sin quinta ni novena');
sonority([0,5,9],'6sus4(no5)','Sexta suspendida sin quinta');
sonority([0,2,5,9],'6sus4(add9,no5)','Sexta suspendida con novena, sin quinta');
sonority([0,3,10],'m7(no5)','Séptima menor sin quinta');
sonority([0,3,11],'m(Maj7,no5)','Menor con séptima mayor, sin quinta');
sonority([0,4,10],'7(no5)','Séptima dominante sin quinta');
sonority([0,4,11],'Maj7(no5)','Séptima mayor sin quinta');
sonority([0,7,10],'7(no3)','Séptima sin tercera');
sonority([0,7,11],'Maj7(no3)','Séptima mayor sin tercera');
sonority([0,7,9],'6(no3)','Sexta sin tercera');
sonority([0,2,7,10],'9(no3)','Novena sin tercera');
sonority([0,2,7,9],'6/9(no3)','Sexta y novena sin tercera');

function nameSonority(notes,intervals,clues){
 const root=notes[0];
 if(notes.length===1)return {name:root.name,letterName:root.letter,symbol:root.letter,quality:'Nota de la escala'};
 if(notes.length===2)return {name:`${root.name} · ${clues[1].name}`,letterName:`${root.letter} · ${clues[1].name}`,symbol:`${root.letter} · ${clues[1].degree}`,quality:clues[1].name};
 const key=[...new Set(intervals.map(n=>mod(n,12)))].sort((a,b)=>a-b).join(','),known=SONORITIES.get(key);
 if(known)return {name:known.triad?`${root.name} ${known.quality.toLowerCase()}`:root.name+known.suffix,letterName:known.triad?`${root.letter} ${known.quality.toLowerCase()}`:root.letter+known.suffix,symbol:root.letter+known.suffix,quality:known.quality};
 // An explicit interval spelling is preferable to a false conventional symbol.
 const description=clues.map(c=>c.degree).join(' · ');
 return {name:`${root.name} · [${description}]`,letterName:`${root.letter} · [${description}]`,symbol:`${root.letter}[${clues.map(c=>c.degree).join(',')}]`,quality:'Sonoridad por intervalos; sin nombre convencional asignado'};
}

function availableStack(notes,column){
 const root=notes[column],indices=[column],intervals=[0],clues=[intervalClue(root,root,0)];
 const candidates=notes.map((note,index)=>({index,pc:mod(note.pitch-root.pitch,12),degree:mod(LETTERS.indexOf(note.letter[0])-LETTERS.indexOf(root.letter[0]),7)}));
 const take=(degree,preference)=>{
  const next=candidates.filter(c=>c.degree===degree&&!indices.includes(c.index)).sort((a,b)=>{
   const rank=pc=>{const i=preference.indexOf(pc);return i<0?100+pc:i;};return rank(a.pc)-rank(b.pc);
  })[0];
  if(next)indices.push(next.index);return !!next;
 };
 // Actual letter degrees matter: E to C is a sixth, not an augmented fifth.
 // Where blues offers both thirds, major is the documented deterministic choice.
 take(2,[4,3,5,2]); // third
 take(4,[7,6,8]); // fifth
 if(!take(6,[10,11,9]))take(5,[9,8,10]); // seventh, otherwise sixth
 take(1,[2,1,3]); // ninth
 take(3,[5,6,4]); // eleventh / suspended fourth if a tertian degree is absent
 take(5,[9,8,10]);
 for(const c of candidates)if(!indices.includes(c.index))indices.push(c.index);
 indices.length=Math.min(5,notes.length);
 for(const index of indices.slice(1)){
  const note=notes[index];let semitones=mod(note.pitch-root.pitch,12);
  while(semitones<=intervals.at(-1))semitones+=12;
  intervals.push(semitones);clues.push(intervalClue(root,note,semitones));
 }
 return {indices,intervals,clues};
}

export function musicalCase(db,prefs){
 const source=db.cases[`${prefs.scaleId}:${prefs.root}:${prefs.flats?1:0}`];
 if(!source)throw Error('La escala o tónica no existe en el catálogo musical.');
 if(cases.has(source))return cases.get(source);
 const count=source.notes.length,isDiatonic=count===7&&source.rows.length===5;
 const romans=source.degrees.map(degree=>romanDegree(degree));
 let rows;
 if(isDiatonic){
  rows=source.rows.map((row,r)=>row.map((chord,col)=>{
   const notes=Array.from({length:r+1},(_,i)=>source.notes[(col+i*2)%count]);
   return {...chord,notes,roman:romanDegree(source.degrees[col],chord.intervals),clue:{...chord.clue,semitones:chord.intervals[r]}};
  }));
 }else{
  const stacks=source.notes.map((_,col)=>availableStack(source.notes,col));
  rows=Array.from({length:Math.min(5,count)},(_,row)=>source.notes.map((_,col)=>{
   const stack=stacks[col],notes=stack.indices.slice(0,row+1).map(index=>source.notes[index]);
   const intervals=stack.intervals.slice(0,row+1),clues=stack.clues.slice(0,row+1);
   return {notes,intervals,...nameSonority(notes,intervals,clues),roman:romanDegree(source.degrees[col],intervals),clue:clues[row]};
  }));
 }
 const value={...source,rows,columnCount:count,isDiatonic,romans,
  stageNames:isDiatonic?['Escala','Intervalos','Tríadas','Séptimas','Novenas']:['Escala','Intervalos','3 notas','4 notas','5 notas'],
  rowLabels:isDiatonic?['1','3ª','5ª','7ª','9ª']:['1','+1','+2','+3','+4'],
  harmonyMode:isDiatonic?'thirds':'available-chord-tones',
  harmonyExplanation:isDiatonic?'Construcción por terceras de la escala.':'Se priorizan tercera, quinta y séptima disponibles; si falta la séptima se utiliza la sexta. Después se añade la novena disponible y se completa con otras notas de la escala. En blues, si coexisten ambas terceras se prefiere la mayor. Es una armonización posible: las filas indican cantidad de notas y los nombres describen solo las notas presentes.'};
 cases.set(source,value);return value;
}

export function chordAt(c,column,row){
 if(!Number.isInteger(column)||!Number.isInteger(row)||!c.rows[row]?.[column])throw Error('La columna o fila no pertenece a esta escala.');
 const chord=c.rows[row][column];
 // Existing callers/tests can still inspect an unadapted Kotlin catalogue case.
 if(chord.notes)return chord;
 return {...chord,notes:Array.from({length:row+1},(_,r)=>c.notes[(column+r*2)%c.notes.length])};
}

/** Machine-readable fixtures/source references for the manual and internal QA. */
export const THEORY_REFERENCES=Object.freeze([
 {title:'Open Music Theory · Triads and seventh chords',url:'https://openmusictheory.github.io/triads.html'},
 {title:'Society for Music Theory Jazz Interest Group · Chord Symbol Guidelines',url:'https://mtosmt.org/docs/Chord_Style_Guide.pdf'}
]);
