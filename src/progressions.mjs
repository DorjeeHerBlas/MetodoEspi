export const COMMON_PROGRESSIONS=[
 {id:'pop',name:'Pop',degrees:'I – V – vi – IV'},
 {id:'axis',name:'Pop alternativo',degrees:'vi – IV – I – V'},
 {id:'fifties',name:'Clásica',degrees:'I – vi – IV – V'},
 {id:'blues',name:'Blues de 12 compases',degrees:'I – I – I – I – IV – IV – I – I – V – IV – I – V'},
 {id:'jazz',name:'Jazz mayor',degrees:'ii – V – I'},
 {id:'minor-jazz',name:'Jazz menor',degrees:'iiø7 – V7 – i'},
 {id:'andalusian',name:'Cadencia andaluza',degrees:'i – ♭VII – ♭VI – V'},
 {id:'rock',name:'Rock',degrees:'I – ♭VII – IV – I'},
 {id:'minor',name:'Menor',degrees:'i – ♭VI – ♭III – ♭VII'},
 {id:'authentic',name:'Cadencia auténtica',degrees:'IV – V – I'}
];
export function validateProgressions(raw){return {selected:Array.isArray(raw?.selected)?[...new Set(raw.selected.filter(x=>typeof x==='string').map(x=>x.slice(0,500)))].slice(0,40):[],custom:typeof raw?.custom==='string'?raw.custom.slice(0,10000):''};}
