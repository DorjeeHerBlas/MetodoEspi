import {clamp,trackDuration} from './model.mjs';
export function installAudioTools(audio){
 const baseClear=audio.clearClicks.bind(audio);
 audio.clearClicks=function(kind){baseClear(kind);if(!kind||kind==='preview')this.clipPreview=null;if(!kind||kind==='piano-preview'){this.pianoPreview=null;this.pianoPreviewGeneration=(this.pianoPreviewGeneration||0)+1;}};
 audio.stopPianoPreview=function(){const had=!!this.pianoPreview;this.clearClicks('piano-preview');if(had)this.emit()};
 audio.previewPiano=async function(sequence,{ideaId}={}){
  if(this.busy)throw Error('Termina la captura o exportación antes de escuchar esta idea.');
  this.stopPianoPreview();const generation=this.pianoPreviewGeneration;await this.init();
  this.pianoPreview={loading:true,ideaId,sequence:structuredClone(sequence)};this.emit();
  try{const pcm=await this.request('piano',{piano:sequence,rate:this.ctx.sampleRate});if(generation!==this.pianoPreviewGeneration)return;
   const start=this.ctx.currentTime+.02,voice=this.playBuffer(pcm,start,1,'piano-preview'),preview={ideaId,sequence:structuredClone(sequence),start,duration:pcm.length/this.ctx.sampleRate,voice};this.pianoPreview=preview;
   const ended=voice.node.onended;voice.node.onended=()=>{ended?.();if(this.pianoPreview===preview){this.pianoPreview=null;this.emit()}};this.emit();
  }catch(error){if(generation===this.pianoPreviewGeneration)this.pianoPreview=null;this.emit();throw error;}
 };
 audio.seekTrack=async function(index,seconds){if(this.busy)return;const duration=trackDuration(this.tracks[index]);if(!duration)return;const position=clamp(seconds,0,duration),playing=!!this.sources[index];this.mix.playing=false;this.mix.linked=false;this.haltTrack(index);this.positions[index]=position;if(playing&&position<duration){await this.init();this.startTrack(index,this.ctx.currentTime+.02,position);}this.emit();};
 audio.previewPosition=function(){const p=this.clipPreview;return p?clamp(p.origin+(p.playing?this.ctx.currentTime-p.start:0),0,p.duration):0;};
 audio.playClipPreview=function(){const p=this.clipPreview;if(!p)return;baseClear('preview');if(p.origin>=p.duration)p.origin=0;const node=this.ctx.createBufferSource(),volume=this.ctx.createGain();node.buffer=p.buffer;node.connect(volume).connect(this.output);const voice={node,volume,tag:'preview'};this.voices.add(voice);p.start=this.ctx.currentTime;p.playing=true;p.voice=voice;node.onended=()=>{this.voices.delete(voice);node.disconnect();volume.disconnect();if(this.clipPreview===p){p.origin=p.duration;p.playing=false;}};node.start(0,p.origin);};
 audio.preview=async function(index,start,end){if(this.busy)throw Error('Termina la captura antes de escuchar una selección.');await this.init();this.stopPianoPreview();this.haltAll(true);this.clearClicks('preview');const t=this.tracks[index],a=Math.round(start*t.rate),b=Math.round(end*t.rate);if(a<0||b>t.pcm.length||a>=b)throw Error('Selección no válida.');const pcm=t.pcm.slice(a,b),buffer=this.ctx.createBuffer(1,pcm.length,t.rate);buffer.copyToChannel(pcm,0);this.clipPreview={index,rangeStart:start,buffer,duration:pcm.length/t.rate,origin:0,start:this.ctx.currentTime,playing:false};this.playClipPreview();};
 audio.pausePreview=function(){const p=this.clipPreview;if(!p)return;if(p.playing){p.origin=this.previewPosition();baseClear('preview');p.playing=false;}else this.playClipPreview();};
 audio.seekPreview=function(seconds){const p=this.clipPreview;if(!p)return;const playing=p.playing;p.origin=clamp(seconds,0,p.duration);baseClear('preview');p.playing=false;if(playing)this.playClipPreview();};
}
