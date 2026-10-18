import {defaults,emptyTrack,validateProject} from './model.mjs';
const KEY='metodoespi2-meta-v2';
export class ProjectStore{
 constructor(db){this.music=db;this.state=defaults();this.db=null;this.onError=()=>{};this.timer=null;}
 async open(){
  if(globalThis.indexedDB){try{this.db=await new Promise((resolve,reject)=>{const r=indexedDB.open('METODOESPI2',2);r.onupgradeneeded=()=>{for(const n of ['clips','meta','backups'])if(!r.result.objectStoreNames.contains(n))r.result.createObjectStore(n)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});}catch(e){this.onError('No se puede abrir el guardado de audio. Puedes trabajar y descargar el proyecto.')}}
  let meta;try{meta=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
  if(meta){try{const raw={...meta,tracks:[emptyTrack(0),emptyTrack(1)]};this.state=validateProject(raw,this.music);}catch{this.onError('Los ajustes guardados no eran válidos; se han cargado los valores iniciales.')}}
  if(this.db){for(let i=0;i<2;i++){const t=await this.get('clips',i).catch(()=>null);if(t){try{const raw={...this.state,tracks:this.state.tracks.map((old,j)=>j===i?t:old)};this.state=validateProject(raw,this.music);}catch{this.onError(`No se pudo recuperar la pista ${i+1}. Su archivo almacenado no se ha borrado.`)}}}}
  return this.state;
 }
 get(store,key){return new Promise((resolve,reject)=>{const r=this.db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 saveMeta(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.flushMeta(),180)}
 flushMeta(){clearTimeout(this.timer);const {tracks,...meta}=this.state;try{localStorage.setItem(KEY,JSON.stringify(meta));return true}catch{this.onError('No queda espacio para guardar ajustes y notas. Descarga el proyecto para conservarlos.');return false}}
 async saveTrack(index){if(!this.db){this.onError('El audio solo estará disponible en esta sesión. Descarga el proyecto para conservarlo.');return false}const track=this.state.tracks[index];try{await new Promise((resolve,reject)=>{const tx=this.db.transaction('clips','readwrite');tx.objectStore('clips').put(track,index);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});return true}catch{this.onError('No se pudo guardar la pista en este navegador. Tu toma sigue disponible: descarga el proyecto.');return false}}
 async replace(state){if(this.db){await new Promise((resolve,reject)=>{const tx=this.db.transaction(['clips','backups'],'readwrite');tx.objectStore('backups').put(this.state,'before-import');state.tracks.forEach((t,i)=>tx.objectStore('clips').put(t,i));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}this.state=state;this.flushMeta();}
}
