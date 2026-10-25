import {esc} from './model.mjs';
import {activePianoIdea,addPianoIdea,selectPianoIdea,renamePianoIdea,removePianoIdea} from './piano-ideas.mjs';
const button=(label,action,kind='secondary',extra='')=>`<button class="${kind}" data-action="${action}" ${extra}>${label}</button>`;
export async function handlePianoAction(action,element,ctx){
 const {state,audio,save,renderPiano,modal,closeModal,toast}=ctx;
 const update=()=>{save();renderPiano()};
 switch(action){
 case'piano-tab':audio.stopPianoPreview();selectPianoIdea(state,element.dataset.id);update();return true;
 case'piano-add':audio.stopPianoPreview();addPianoIdea(state);state.prefs.cursor=0;update();return true;
 case'piano-duplicate':audio.stopPianoPreview();addPianoIdea(state,{duplicate:true});update();toast?.('Idea duplicada. Sus notas son independientes.');return true;
 case'piano-rename':{
  const idea=activePianoIdea(state);
  modal('Nombre de la idea',`<label>Nombre<input id="piano-idea-name" type="text" maxlength="80" value="${esc(idea.name)}" autocomplete="off"></label>`,button('Cancelar','modal-close')+button('Guardar nombre','piano-rename-save','primary',`data-id="${esc(idea.id)}"`));
  queueMicrotask(()=>{const input=document.querySelector('#piano-idea-name');input?.focus();input?.select()});return true;
 }
 case'piano-rename-save':renamePianoIdea(state,element.dataset.id,document.querySelector('#piano-idea-name')?.value);closeModal();update();return true;
 case'piano-remove':{
  const idea=activePianoIdea(state);
  modal('¿Eliminar esta idea?',`<p class="muted">Se eliminará «${esc(idea.name)}» y su dibujo de notas. Las pistas de audio ya creadas se conservan.</p>`,button('Cancelar','modal-close')+button('Eliminar idea','piano-remove-confirm','danger',`data-id="${esc(idea.id)}"`));return true;
 }
 case'piano-remove-confirm':audio.stopPianoPreview();removePianoIdea(state,element.dataset.id);closeModal();update();return true;
 case'piano-preview':{
  if(audio.pianoPreview)audio.stopPianoPreview();else{const idea=activePianoIdea(state);await audio.previewPiano(structuredClone(idea.sequence),{ideaId:idea.id})}
  renderPiano();return true;
 }
 case'piano-preview-stop':audio.stopPianoPreview();renderPiano();return true;
 default:return false;
 }
}
