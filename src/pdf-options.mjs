export const PDF_SECTIONS=Object.freeze([
 {id:'scales',label:'Escalas y corrección de respuestas'},
 {id:'chords',label:'Acordes'},
 {id:'instrument',label:'Instrumento / diapasón'},
 {id:'pianos',label:'Pestañas de piano roll'},
 {id:'progressions',label:'Progresiones'},
 {id:'notes',label:'Notas y letras'}
]);
export const defaultPdfSections=()=>Object.fromEntries(PDF_SECTIONS.map(({id})=>[id,true]));
export function sanitizePdfSections(raw){
 const result=defaultPdfSections();
 if(raw&&typeof raw==='object')for(const {id} of PDF_SECTIONS)if(typeof raw[id]==='boolean')result[id]=raw[id];
 return result;
}
export const selectedPdfSections=raw=>PDF_SECTIONS.filter(({id})=>sanitizePdfSections(raw)[id]);
