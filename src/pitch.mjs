export function detectPitch(input,rate,reference=440){
 if(!input?.length||rate<8000)return null;
 let energy=0;for(const x of input)energy+=x*x;if(Math.sqrt(energy/input.length)<.004)return null;
 const stride=Math.max(1,Math.floor(rate/24000)),sr=rate/stride,n=Math.floor(input.length/stride),samples=new Float64Array(n);let mean=0;
 for(let i=0;i<n;i++){let sum=0;for(let j=0;j<stride;j++)sum+=input[i*stride+j];samples[i]=sum/stride;mean+=samples[i]}mean/=n;for(let i=0;i<n;i++)samples[i]-=mean;
 const min=Math.max(2,Math.floor(sr/2000)),max=Math.min(Math.floor(sr/30),Math.floor(n/2)-1),size=Math.min(n-max,1024),diff=new Float64Array(max+1);if(max<=min||size<128)return null;
 for(let tau=1;tau<=max;tau++){let d=0;for(let j=0;j<size;j++){const x=samples[j]-samples[j+tau];d+=x*x}diff[tau]=d}
 let sum=0;const norm=new Float64Array(max+1);norm[0]=1;for(let tau=1;tau<=max;tau++){sum+=diff[tau];norm[tau]=sum>0?diff[tau]*tau/sum:1}
 let tau=-1;for(let t=2;t<=max;t++)if(norm[t]<.14){while(t+1<=max&&norm[t+1]<norm[t])t++;tau=t;break}if(tau<0)return null;
 const a=norm[tau-1]??norm[tau],b=norm[tau],c=norm[tau+1]??b,den=2*(2*b-c-a);const refined=tau+(tau<max&&Math.abs(den)>1e-12?(c-a)/den:0),hz=sr/refined;if(!Number.isFinite(hz)||hz<30||hz>2000)return null;
 const midi=Math.round(69+12*Math.log2(hz/reference)),cents=1200*Math.log2(hz/(reference*2**((midi-69)/12)));if(midi<0||midi>127)return null;return {frequency:hz,midi,cents,confidence:1-norm[tau]};
}
