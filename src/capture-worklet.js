class EspiCapture extends AudioWorkletProcessor{
 constructor(){super();this.buffer=new Float32Array(1024);this.used=0;this.start=0;this.port.onmessage=e=>{if(e.data.type==='flush'){this.flush();this.port.postMessage({type:'flushed',id:e.data.id})}}}
 flush(){if(this.used){const data=this.buffer.slice(0,this.used);this.port.postMessage({type:'pcm',frame:this.start,buffer:data.buffer},[data.buffer]);this.used=0}}
 process(inputs,outputs){const channels=inputs[0];if(channels?.length){const size=channels[0].length;for(let i=0;i<size;i++){if(!this.used)this.start=currentFrame+i;let x=0;for(const c of channels)x+=c[i]||0;this.buffer[this.used++]=x/channels.length;if(this.used===this.buffer.length)this.flush()}}for(const o of outputs)for(const c of o)c.fill(0);return true}
}
registerProcessor('espi-capture',EspiCapture);
