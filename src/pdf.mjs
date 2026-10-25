import {display} from './model.mjs';
import {musicalCase,chordAt} from './theory.mjs';
import {sanitizePdfSections,PDF_SECTIONS} from './pdf-options.mjs';

// Helvetica/WinAnsi preserves Spanish; musical signs use their standard text form.
export const printable=s=>String(s??'').normalize('NFC').replaceAll('♯','#').replaceAll('♭','b').replaceAll('𝄫','bb').replaceAll('𝄪','##').replace(/[ \t]*·[ \t]*/g,' / ').replace(/[ \t]*→[ \t]*/g,' > ').replaceAll('ª','a').replaceAll('−','-').replace(/[–—‑]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replaceAll('…','...').replaceAll('Δ','Maj').replaceAll('ø','m7b5').replaceAll('♮','').replace(/[^\u0009\u000a\u000d\u0020-\u00ff]/gu,'?');
const COLORS={ink:[43,35,61],muted:[109,96,127],accent:[104,75,151],line:[218,207,230],soft:[244,239,249],green:[40,115,67],greenBg:[233,245,235],red:[166,46,70],redBg:[251,234,238]};
const pitch=n=>((n%12)+12)%12;
const romanFallback=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

export function scaleComparison(state,c){
 const ex=state.exercises?.[`${state.prefs.scaleId}:${state.prefs.root}`];
 if(!ex||ex.attempts<3||ex.correct)return null;
 const selected=[...new Set((ex.selection||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<12))];
 const expected=c.notes.map(n=>n.pitch),correct=new Set(expected);
 return {selected,extra:selected.filter(n=>!correct.has(n)),missing:expected.filter(n=>!selected.includes(n)),expected};
}

function pianoIdeas(state){
 if(Array.isArray(state.pianos)&&state.pianos.length)return state.pianos;
 return state.piano?[{id:'legacy',name:'Idea 1',sequence:state.piano}]:[];
}

// A late idea never creates thousands of blank pages.
export function pianoPdfBlocks(sequence){
 const unit=[1,2,4,8,16].includes(sequence?.beatUnit)?sequence.beatUnit:4;
 const bar=Math.max(1,Math.round((sequence?.beats||4)*16/unit)),steps=Math.max(1,Math.floor(sequence?.steps||bar));
 const span=bar<=32?bar*Math.max(1,Math.floor(32/bar)):32;
 const occupied=Object.keys(sequence?.cells||{}).map(Number).filter(step=>Number.isInteger(step)&&step>=0&&step<steps&&Number(sequence.cells[step])>0).sort((a,b)=>a-b);
 const starts=[...new Set(occupied.map(step=>Math.floor(step/span)*span))];
 return {bar,steps,occupied,blocks:starts.map(start=>({start,end:Math.min(steps,start+span)}))};
}

export function projectPdf(state,db,options=state.prefs?.pdfSections){
 if(!globalThis.jspdf?.jsPDF)throw Error('No se ha cargado el exportador PDF. Actualiza la página y vuelve a intentarlo.');
 const included=sanitizePdfSections(options);
 if(!PDF_SECTIONS.some(({id})=>included[id]))throw Error('Selecciona al menos una sección para el PDF.');
 const doc=new globalThis.jspdf.jsPDF({unit:'mm',format:'a4',compress:true}),p=state.prefs,c=musicalCase(db,p),scale=db.scales.find(v=>v.id===p.scaleId);
 const left=17,width=176,bottom=277;
 let y=23,pianoPanels=0;
 const color=rgb=>doc.setTextColor(...rgb);
 const newPage=()=>{doc.addPage();y=23;};
 const ensure=h=>{if(y+h>bottom)newPage();};
 const text=(value,size=10,rgb=COLORS.ink,{bold=false,gap=3}={})=>{
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);color(rgb);
  const lineHeight=size*.46,lines=doc.splitTextToSize(printable(value),width);
  for(const line of lines){ensure(lineHeight);doc.text(line,left,y);y+=lineHeight;}
  y+=gap;
 };
 const heading=label=>{
  ensure(20);y+=3;doc.setFont('helvetica','bold');doc.setFontSize(13);color(COLORS.accent);doc.text(printable(label),left,y);y+=5;
  doc.setDrawColor(...COLORS.line);doc.setLineWidth(.25);doc.line(left,y,left+width,y);y+=7;
 };
 const noteLabel=pc=>display(c.notes.find(n=>n.pitch===pc)||db.chromatic[p.flats?1:0][pc],p);
 const chips=(label,notes,rgb,bg)=>{
  ensure(16);text(label,9,COLORS.muted,{bold:true,gap:1});
  doc.setFont('helvetica','normal');doc.setFontSize(10);let x=left;
  for(const value of notes){const label=printable(value),w=Math.min(width,Math.max(12,doc.getTextWidth(label)+7));
   if(x+w>left+width){x=left;y+=10;ensure(10);}
   doc.setFillColor(...bg);doc.roundedRect(x,y-3.8,w,8,2,2,'F');color(rgb);doc.text(label,x+3.5,y+1);x+=w+2;
  }
  if(!notes.length){color(COLORS.muted);doc.text('-',left,y+1);}
  y+=13;
 };
 const table=(rows,widths,{headerRows=1,size=8}={})=>{
  const renderRow=(row,index)=>{
   doc.setFont('helvetica',index<headerRows?'bold':'normal');doc.setFontSize(size);
   const entries=row.map((value,i)=>doc.splitTextToSize(printable(value),widths[i]-3));
   const height=Math.max(9,...entries.map(lines=>lines.length*size*.43+5));
   if(y+height>bottom){newPage();if(index>=headerRows)rows.slice(0,headerRows).forEach(renderRow);}
   doc.setFont('helvetica',index<headerRows?'bold':'normal');doc.setFontSize(size);
   let x=left;
   for(let i=0;i<widths.length;i++){
    doc.setFillColor(...(index<headerRows?[232,222,244]:index%2?[248,245,251]:[243,237,249]));
    doc.setDrawColor(...COLORS.line);doc.setLineWidth(.18);doc.rect(x,y,widths[i],height,'FD');
    color(index<headerRows?COLORS.accent:COLORS.ink);doc.text(entries[i]||[''],x+1.5,y+4.3);x+=widths[i];
   }
   y+=height;
  };
  rows.forEach(renderRow);y+=7;
 };

 doc.setProperties({title:'METODOESPI2 - Proyecto musical',subject:'Escalas, composición y notas',creator:'METODOESPI2 Web'});
 text('Tu proyecto musical',22,COLORS.ink,{bold:true,gap:3});
 text('METODOESPI2 / De la idea al sonido.',10,COLORS.muted,{gap:8});

 if(included.scales){
  heading('Escalas');
  text(`${display(c.notes[0],p)} / ${scale?.name||p.scaleId}`,16,COLORS.ink,{bold:true});
  chips('Notas de la escala',c.notes.map(n=>display(n,p)),COLORS.accent,COLORS.soft);
  text(`Pasos: ${c.formula}`,10);text(`Grados: ${c.degrees.join(' / ')}`,10);
  text('T = 2 semitonos. ST = 1 semitono. # = sostenido; b = bemol.',8,COLORS.muted);
  const comparison=scaleComparison(state,c);
  if(comparison){
   text('Revisión tras tres intentos',11,COLORS.ink,{bold:true});
   chips('Tu selección correcta',comparison.selected.filter(n=>!comparison.extra.includes(n)).map(noteLabel),COLORS.green,COLORS.greenBg);
   chips('Notas incorrectas que seleccionaste',comparison.extra.map(noteLabel),COLORS.red,COLORS.redBg);
   chips('Notas que faltaron en tu respuesta',comparison.missing.map(noteLabel),COLORS.red,COLORS.redBg);
   chips('Resultado correcto completo',c.notes.map(n=>display(n,p)),COLORS.green,COLORS.greenBg);
  }
 }

 if(included.chords){
  heading('Acordes / construcción por columnas');
  text(`${display(c.notes[0],p)} / ${scale?.name||p.scaleId}`,10,COLORS.muted);
  if(c.harmonyExplanation)text(c.harmonyExplanation,9,COLORS.muted);
  const n=c.notes.length,labelWidth=23,widths=[labelWidth,...Array(n).fill((width-labelWidth)/n)];
  const visible=Math.min(c.rows.length-1,Math.max(0,state.exercises?.[`${p.scaleId}:${p.root}`]?.harmony?.visible??4));
  const rows=[['Grado',...c.notes.map((_,i)=>c.romans?.[i]||romanFallback[i])],['Raíz',...c.notes.map(n=>display(n,p))]];
  for(let r=1;r<=visible;r++){
   rows.push([c.rowLabels?.[r]||['','Tercera','Quinta','Séptima','Novena'][r],...c.notes.map((_,i)=>display(chordAt(c,i,r).notes[r],p))]);
   rows.push([c.stageNames?.[r]||`${r+1} notas`,...c.notes.map((_,i)=>{const chord=chordAt(c,i,r);return p.international?chord.letterName:chord.name;})]);
  }
  if(c.rows.length)table(rows,widths,{headerRows:2,size:n>7?7:8});
  else text('Esta selección no tiene acordes disponibles.',10,COLORS.muted);
 }

 if(included.instrument){
  ensure((p.tuning?.length||6)*11+54);
  heading('Instrumento / diapasón');
  const instrument=db.instruments.find(i=>i.id===p.instrumentId),preset=instrument?.presets.find(t=>t.id===p.preset);
  text(`${instrument?.name||'Instrumento'} / ${preset?.name||'Afinación personalizada'}${p.leftHanded?' / Vista zurda':''}`,11,COLORS.ink,{bold:true});
  const strings=p.tuning||[],chromatic=db.chromatic[p.flats?1:0];
  text(`Afinación (de arriba abajo): ${strings.map(midi=>display(chromatic[pitch(midi)],p)+(Math.floor(midi/12)-1)).join(' / ')}`,8,COLORS.muted);
  const shown=new Set(p.mode==='all'?Array.from({length:12},(_,n)=>n):p.mode==='selected'?p.highlight||[]:c.notes.map(n=>n.pitch));
  const labelWidth=13,cell=(width-labelWidth)/13,rowHeight=11,height=strings.length*rowHeight;
  ensure(height+23);const gridTop=y+7,gridLeft=left+labelWidth;
  doc.setFontSize(7);doc.setFont('helvetica','normal');color(COLORS.muted);doc.text('Cuerda',left,y+2);
  for(let column=0;column<13;column++){
   const fret=p.leftHanded?12-column:column,x=gridLeft+column*cell;
   doc.text(String(fret),x+cell/2,y+2,{align:'center'});
   doc.setFillColor(...(fret===0?[229,224,239]:[244,241,248]));doc.rect(x,gridTop,cell,height,'F');
   doc.setDrawColor(201,195,214);doc.setLineWidth(fret===0?.8:.18);doc.line(x+cell,gridTop,x+cell,gridTop+height);
  }
  for(let string=0;string<strings.length;string++){
   const centerY=gridTop+(string+.5)*rowHeight;doc.setFontSize(7);color(COLORS.muted);doc.text(String(string+1),left+3,centerY+1.2);
   doc.setDrawColor(158,153,174);doc.setLineWidth(.18+string*.035);doc.line(gridLeft,centerY,gridLeft+13*cell,centerY);
   for(let column=0;column<13;column++){
    const fret=p.leftHanded?12-column:column,pc=pitch(strings[string]+fret),centerX=gridLeft+(column+.5)*cell,selected=shown.has(pc),tonic=selected&&pc===p.root;
    if(selected){doc.setFillColor(...(tonic?[242,213,192]:[217,204,235]));doc.circle(centerX,centerY,4.2,'F');}
    color(selected?(tonic?[126,71,41]:[96,64,129]):[159,154,169]);doc.setFontSize(selected?6.8:5.8);doc.setFont('helvetica',selected?'bold':'normal');
    doc.text(printable(display(chromatic[pc],p)),centerX,centerY+1,{align:'center'});
   }
  }
  y=gridTop+height+8;
  text(`Notas resaltadas: ${p.mode==='all'?'todas':p.mode==='selected'?'selección libre':'escala actual'}. Tónica en melocotón; selección en lavanda.`,8,COLORS.muted);
 }

 if(included.pianos){
  const firstIdea=pianoIdeas(state)[0];
  const hasFirstNotes=firstIdea&&pianoPdfBlocks(firstIdea.sequence||firstIdea.piano||firstIdea).blocks.length;
  ensure(hasFirstNotes?139:42);
  heading('Piano rolls / ideas de composición');
  const ideas=pianoIdeas(state),chromatic=db.chromatic[p.flats?1:0];
  if(!ideas.length)text('No hay ideas de piano guardadas.',10,COLORS.muted);
  for(let ideaIndex=0;ideaIndex<ideas.length;ideaIndex++){
   const idea=ideas[ideaIndex],sequence=idea.sequence||idea.piano||idea,plan=pianoPdfBlocks(sequence),name=String(idea.name||`Idea ${ideaIndex+1}`);
   ensure(plan.blocks.length?125:32);text(name,13,COLORS.accent,{bold:true});
   text(`${sequence.bpm||p.bpm} BPM / ${sequence.beats||4}/${sequence.beatUnit||4} / ${Math.ceil(plan.steps/plan.bar)} compases / ${plan.occupied.length} pasos con notas`,8,COLORS.muted);
   if(!plan.blocks.length){text('Sin notas dibujadas.',9,COLORS.muted,{gap:7});continue;}
   const omitted=plan.steps-plan.blocks.reduce((total,b)=>total+b.end-b.start,0);
   if(omitted>0)text(`Se omiten tramos completamente vacíos: ${omitted} casillas. Se conservan las posiciones originales.`,8,COLORS.muted);
   for(const block of plan.blocks){
    if(++pianoPanels>256)throw Error('El piano roll es demasiado extenso para un PDF legible. Reduce sus bloques de notas o desmarca Piano rolls; el proyecto editable conserva todas las ideas.');
    const count=block.end-block.start,rowHeight=2.85,labelWidth=14,plotWidth=width-labelWidth,cell=plotWidth/count,height=24*rowHeight;
    ensure(height+19);doc.setFont('helvetica','bold');doc.setFontSize(8);color(COLORS.ink);
    const barFirst=Math.floor(block.start/plan.bar)+1,barLast=Math.floor((block.end-1)/plan.bar)+1;
    text(`${name.length>60?name.slice(0,57)+'...':name} / compás ${barFirst}${barLast!==barFirst?'-'+barLast:''} / pasos ${block.start+1}-${block.end}`,8,COLORS.ink,{bold:true,gap:2});
    const top=y,plotLeft=left+labelWidth;
    for(let row=0;row<24;row++){
     const key=23-row,pc=key%12,black=[1,3,6,8,10].includes(pc);
     doc.setFillColor(...(black?[235,229,244]:[249,246,252]));doc.rect(plotLeft,top+row*rowHeight,plotWidth,rowHeight,'F');
     doc.setFont('helvetica','normal');doc.setFontSize(5.8);color(COLORS.muted);doc.text(printable(display(chromatic[pc],p)+(Math.floor((48+key)/12)-1)),plotLeft-1.2,top+(row+.72)*rowHeight,{align:'right'});
     doc.setDrawColor(223,215,232);doc.setLineWidth(.12);doc.line(plotLeft,top+(row+1)*rowHeight,plotLeft+plotWidth,top+(row+1)*rowHeight);
     let run=-1;
     for(let step=block.start;step<=block.end;step++){
      const active=step<block.end&&(Number(sequence.cells?.[step]||0)&(1<<key));
      if(active&&run<0)run=step;
      if(!active&&run>=0){doc.setFillColor(151,120,191);doc.roundedRect(plotLeft+(run-block.start)*cell+.15,top+row*rowHeight+.35,(step-run)*cell-.3,rowHeight-.7,.25,.25,'F');run=-1;}
     }
    }
    for(let step=block.start;step<=block.end;step++){
     const x=plotLeft+(step-block.start)*cell,strong=step%plan.bar===0;doc.setDrawColor(...(strong?[155,130,186]:[217,207,231]));doc.setLineWidth(strong?.32:.12);doc.line(x,top,x,top+height);
     if(strong&&step<block.end){doc.setFontSize(6);color(COLORS.accent);doc.text(String(Math.floor(step/plan.bar)+1),x+.6,top-1);}
    }
    y=top+height+8;
   }
   y+=3;
  }
 }

 if(included.progressions){
  const progression=state.progressions||{},selected=Array.isArray(progression.selected)?progression.selected:[];
  const custom=String(progression.custom||'').trim();
  ensure(Math.min(200,35+selected.length*8+(custom?25:0)));
  heading('Progresiones');
  for(const item of selected){const value=typeof item==='string'?item:[item.name,item.degrees||item.progression].filter(Boolean).join(': ');text(value,10);}
  if(custom){text('Progresión personalizada',10,COLORS.ink,{bold:true});text(custom,10);}
  if(!selected.length&&!custom)text('No hay progresiones seleccionadas.',9,COLORS.muted);
 }
 if(included.notes){
  heading('Notas / letras e ideas');
  text(String(state.memo||'').trim()||'Sin texto guardado.',11,COLORS.ink,{gap:4});
 }

 const pages=doc.getNumberOfPages();
 for(let page=1;page<=pages;page++){
  doc.setPage(page);doc.setFont('helvetica','bold');doc.setFontSize(8);color(COLORS.accent);doc.text('METODOESPI2',left,12);
  doc.setDrawColor(...COLORS.line);doc.setLineWidth(.18);doc.line(left,15,left+width,15);
  doc.setFont('helvetica','normal');doc.setFontSize(8);color(COLORS.muted);doc.text('Proyecto musical',left,289);doc.text(`${page} / ${pages}`,left+width,289,{align:'right'});
 }
 return doc.output('arraybuffer');
}
