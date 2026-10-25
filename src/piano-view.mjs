import {esc,display,musicalCase} from './model.mjs';
import {ensurePianoIdeas,stepsPerBar} from './piano-ideas.mjs';
const disabled=value=>value?' disabled':'';
const button=(label,action,extra='',kind='secondary')=>`<button class="${kind}" data-action="${action}" ${extra}>${label}</button>`;
const pill=(label,pref,value,current)=>`<button class="pill" data-action="pref" data-pref="${pref}" data-value="${value}" aria-pressed="${value===current}">${label}</button>`;
const select=(label,pref,value,options,off=false)=>`<label>${label}<select data-pref="${pref}"${disabled(off)}>${options.map(([v,t])=>`<option value="${v}"${value===v?' selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
export function piano(s,db,a){
 const idea=ensurePianoIdeas(s),p=s.prefs,c=musicalCase(db,p),seq=idea.sequence,keys=db.chromatic[p.flats?1:0],bar=stepsPerBar(seq);
 const busy=a.busy,editingLocked=a.saving||a.exporting,previewing=!!a.pianoPreview,hasNotes=Object.keys(seq.cells).length>0;
 const expanded=typeof document!=='undefined'&&document.body.classList.contains('focus-piano');
 const counts=[3,4,5].filter(count=>c.rows[count-1]?.length);
 const chordKinds=counts.map(count=>[count,c.stageNames?.[count-1]||c.rowLabels?.[count-1]||({3:'Tríada',4:'Séptima',5:'Novena'})[count]]);
 const selectedCount=counts.includes(p.toneCount)?p.toneCount:counts[0];
 return `<div class="panel piano-editor" data-testid="piano-editor">
  <div class="row spread piano-editor-header"><h3 style="margin:0">Piano roll</h3><div class="row">
   <button class="info" data-action="piano-info" aria-label="Información del piano roll">i</button>
   ${button('♫ Pistas','piano-player','','secondary')}
   ${button(expanded?'↙ Volver':'⤢ Ampliar','piano-expand','','text-button')}
  </div></div>
  <div class="piano-ideas-bar"><div class="piano-ideas-tabs" role="tablist" aria-label="Ideas de piano roll">
   ${s.pianos.map(tab=>`<button class="piano-idea-tab pill" role="tab" id="piano-tab-${esc(tab.id)}" aria-controls="piano-idea-panel" aria-selected="${tab.id===idea.id}" data-action="piano-tab" data-id="${esc(tab.id)}"${disabled(editingLocked)}>${esc(tab.name)}</button>`).join('')}
  </div>${button('+ Idea','piano-add',disabled(editingLocked),'secondary')}</div>
  <div id="piano-idea-panel" role="tabpanel" aria-labelledby="piano-tab-${esc(idea.id)}">
   <div class="row spread piano-idea-meta"><div><strong class="piano-idea-name">${esc(idea.name)}</strong><span class="piano-summary"> · ${Math.ceil(seq.steps/bar)} compases · ${seq.beats}/${seq.beatUnit||4} · ${seq.bpm} BPM</span></div><div class="row">
    ${button('Renombrar','piano-rename',disabled(editingLocked),'text-button')}
    ${button('Duplicar','piano-duplicate',disabled(editingLocked),'text-button')}
    ${button('Eliminar','piano-remove',disabled(editingLocked||s.pianos.length===1),'text-button')}
   </div></div>
   <div class="piano-toolbar row spread"><span class="piano-scroll-hint">↕ Alturas · ↔ Tiempo</span>
    <div class="row piano-preview-controls">${button(previewing?'■ Detener idea':'▶ Escuchar idea','piano-preview',disabled(!previewing&&(busy||!hasNotes)),'primary')}${button('■ Parar idea','piano-preview-stop',disabled(!previewing),'text-button')}</div>
    <span class="piano-summary" id="piano-preview-status">${previewing?'Preescucha de la idea · las pistas se controlan por separado':'Se guarda como idea aunque no la envíes a una pista.'}</span>
   </div>
   <details class="piano-tools-details" open><summary>Edición y destino de pista</summary><div class="piano-editor-tools">
    <div class="row piano-track-target"><label class="small muted" style="margin:0">Enviar audio a</label><div class="pills" aria-label="Pista de destino">${pill('Pista 1','pianoTarget',1,p.pianoTarget)}${pill('Pista 2','pianoTarget',2,p.pianoTarget)}${pill('Ambas','pianoTarget',3,p.pianoTarget)}</div></div>
    <div class="piano-actions" style="margin-top:15px">
     ${button('− Compás','piano-shrink',disabled(busy||seq.steps<=bar),'secondary')}${button('+ Compás','piano-grow',disabled(busy),'secondary')}
     ${button('Crear en '+(p.pianoTarget===3?'ambas pistas':`pista ${p.pianoTarget}`),'piano-build',disabled(busy||!hasNotes),'secondary')}${button('Limpiar','piano-clear',disabled(busy),'text-button')}
    </div>
    ${counts.length?`<details><summary>Colocar acordes de la escala</summary><div class="row" style="margin-top:13px">${select('Tipo de acorde','toneCount',selectedCount,chordKinds,busy)}<label>Columna de inicio<input id="piano-cursor" type="number" min="1" max="${seq.steps+1}" value="${Math.min(seq.steps,p.cursor||0)+1}"></label>${select('Duración','noteLength',p.noteLength,[[4,'1 negra'],[bar,'1 compás']],busy)}</div><div class="pills" style="margin-top:12px">${c.rows[selectedCount-1].map((ch,col)=>button(esc(p.international?ch.letterName:ch.name),'piano-chord',`data-col="${col}"${disabled(busy)}`,'pill')).join('')}</div></details>`:''}
   </div></details>
   <div class="piano-shell"><div class="piano-keyboard">${Array.from({length:24},(_,i)=>{
    const n=23-i,midi=48+n,label=display(keys[n%12],p)+(Math.floor(midi/12)-1);
    return `<button class="piano-key ${[1,3,6,8,10].includes(n%12)?'black':''}" data-action="piano-key" data-midi="${midi}" data-key="${n}" aria-label="Tecla ${esc(label)}">${esc(label)}</button>`;
   }).join('')}</div><div class="piano-scroll" id="piano-scroll" tabindex="0" aria-label="Cuadrícula de ${esc(idea.name)}: toca para dibujar notas, desplaza horizontalmente para más compases"><div class="piano-space" id="piano-space" style="width:${seq.steps*24}px"><canvas id="piano-canvas" class="piano-canvas" height="480" role="img" aria-label="Editor de notas de ${esc(idea.name)}"></canvas></div></div></div>
   <p class="piano-summary piano-editor-help">Dibuja notas y escúchalas sin ocupar las pistas. Cada casilla es una semicorchea; el compás y el tempo siguen al metrónomo. Al final se añade otro compás.</p>
   <div class="row piano-follow-controls"><label class="toggle"><input id="piano-follow" type="checkbox" checked>Seguir reproducción</label>${button('Abrir reproductor de pistas','piano-player','','text-button')}</div>
  </div>
 </div>`;
}
