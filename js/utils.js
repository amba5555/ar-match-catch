export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const rand=(min,max)=>Math.random()*(max-min)+min;
export const choice=a=>a[Math.floor(Math.random()*a.length)];
export const shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
export const isThaiLocale=()=>navigator.language?.startsWith('th');
export function fitCanvas(canvas){const dpr=Math.min(window.devicePixelRatio||1,2);const r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {w:r.width,h:r.height,dpr};}
export function downloadJson(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}
