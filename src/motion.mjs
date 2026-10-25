// El movimiento visual no interviene en el reloj ni en el procesamiento de audio.
export function setupMotion(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const running=new Set();
 const animate=(element,frames,options)=>{
  if(reduced.matches||document.hidden)return;
  const animation=element.animate(frames,options);running.add(animation);
  animation.finished.catch(()=>{}).finally(()=>running.delete(animation));
 };
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){
   const heading=entry.target.querySelector('.section-heading');
   if(heading)animate(heading,[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
   // La opacidad conserva el comportamiento de las vistas fijas y ampliadas.
   const content=[...entry.target.children].filter(el=>!el.classList.contains('section-heading'));
   content.forEach((el,i)=>animate(el,[{opacity:.35},{opacity:1}],{duration:650,delay:Math.min(i*65,195),easing:'ease-out'}));
   observer.unobserve(entry.target);
  }
 },{threshold:.06});
 document.querySelectorAll('main>section').forEach(section=>observer.observe(section));
 document.addEventListener('pointerdown',event=>{
  if(reduced.matches||event.button!==0)return;
  const button=event.target.closest('button');
  if(!button||button.disabled||button.closest('.fretboard,.piano-keyboard'))return;
  const bounds=button.getBoundingClientRect(),size=Math.max(bounds.width,bounds.height)*1.8;
  const ripple=document.createElement('span');ripple.className='touch-ripple';ripple.setAttribute('aria-hidden','true');
  Object.assign(ripple.style,{width:size+'px',height:size+'px',left:event.clientX-bounds.left-size/2+'px',top:event.clientY-bounds.top-size/2+'px'});
  button.append(ripple);
  const animation=ripple.animate([{opacity:.2,transform:'scale(0)'},{opacity:0,transform:'scale(1)'}],{duration:600,easing:'cubic-bezier(.2,.7,.3,1)'});
  animation.finished.catch(()=>{}).finally(()=>ripple.remove());
 });
 const stop=()=>{for(const animation of running)animation.cancel();document.querySelectorAll('.touch-ripple').forEach(el=>el.remove());};
 reduced.addEventListener('change',()=>{if(reduced.matches)stop()});
 document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-idle',document.hidden);if(document.hidden)stop()});
}
