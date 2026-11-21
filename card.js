// [코대리] 이름과 초대 번호로 하롱베이 풍경, 금박 무늬, 초대 문구를 조합한다.
const galleries=['jade','amber','indigo','rose'];
const wishes=[
  ['연결의 힘','서로 다른 길이 만나 더 넓은 바다가 됩니다.','그 만남의 자리에 함께해 주세요.'],
  ['새로운 지평','익숙한 풍경 너머의 내일을 바라봅니다.','그 첫 장면을 당신과 나누고 싶습니다.'],
  ['함께하는 용기','첫걸음을 함께 내딛는 사람이 있어','새로운 길을 열 수 있습니다.'],
  ['깊은 통찰','잠시 멈춰 바라보면 새로운 길이 보입니다.','당신의 시선이 더해지기를 기대합니다.'],
  ['다정한 리더십','곁에 있는 사람을 살피는 마음에서','함께 나아갈 힘이 자랍니다.'],
  ['서로의 가능성','한 사람의 생각이 다른 사람의 가능성을 엽니다.','당신과 마주 앉을 날을 기다립니다.'],
  ['같이 여는 미래','아직 이름 붙지 않은 내일의 이야기를','하롱베이에서 함께 시작하고 싶습니다.'],
  ['경계를 넘는 상상','다른 생각이 만나는 곳에서 상상이 자랍니다.','당신의 이야기를 들려주세요.']
];
const cache=new Map();
function picture(url){
  if(!cache.has(url)) cache.set(url,new Promise((resolve,reject)=>{
    const im=new Image(); im.onload=()=>resolve(im); im.onerror=()=>{cache.delete(url);reject(new Error('image'))}; im.src=url;
  }));
  return cache.get(url);
}
export const splitChars = v => typeof Intl.Segmenter==='function' ? [...new Intl.Segmenter('ko',{granularity:'grapheme'}).segment(v)].map(x=>x.segment) : Array.from(v);
export const normalizeName = v => v.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'').trim().replace(/\s+/gu,' ');
export function validName(v){return splitChars(v).length>=1 && splitChars(v).length<=30 && /[\p{L}\p{N}]/u.test(v)}
export function mint(name){const bytes=crypto.getRandomValues(new Uint8Array(16));return {name,seed:[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('')}}
export function invitationHash(v){return '#i=1.'+v.seed+'.'+encodeURIComponent(v.name)}
export function fromHash(hash){
  const m=hash.match(/^#i=1\.([a-f0-9]{32})\.(.{1,1080})$/u);
  if(!m)return null;
  try{const name=normalizeName(decodeURIComponent(m[2]));return validName(name)?{name,seed:m[1]}:null}catch{return null}
}
export async function edition(guest){
  const data=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode((guest?.name||'WITY')+'|'+(guest?.seed||'preview'))));
  return {guest,bytes:data,art:guest?galleries[data[0]%4]:'jade',words:wishes[data[1]%wishes.length],serial:[...data.slice(4,8)].map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase()};
}
function ink(g,text,x,y,px,font,color,align='left',max=895){
  g.fillStyle=color;g.font=px+'px '+font;g.textAlign=align;
  const w=g.measureText(text).width;if(w>max)g.font=(px*max/w)+'px '+font;
  g.fillText(text,x,y);
}
function lineOfName(name){
 const ch=splitChars(name);if(ch.length<17)return [name+' 님께'];
 const split=Math.ceil(ch.length/2);return [ch.slice(0,split).join(''),ch.slice(split).join('')+' 님께'];
}
export async function paintCard(card,ed){
 const [photo,logo]=await Promise.all([picture('./assets/'+ed.art+'.webp'),picture('./assets/wity.png'),document.fonts.load('48px Gowun').catch(()=>{})]);
 const g=card.getContext('2d'),W=1080,H=1350;
 g.drawImage(photo,0,0,W,H);
 const veil=g.createLinearGradient(0,0,0,H);veil.addColorStop(0,'rgba(8,26,26,.52)');veil.addColorStop(.38,'rgba(4,18,20,.24)');veil.addColorStop(.59,'rgba(3,21,23,.25)');veil.addColorStop(.78,'rgba(3,19,22,.88)');veil.addColorStop(1,'rgba(3,19,22,.98)');g.fillStyle=veil;g.fillRect(0,0,W,H);
 const gold='#f2dfb4',white='#fff7e9',b=ed.bytes;
 g.strokeStyle='rgba(234,211,163,.68)';g.lineWidth=1.6;g.strokeRect(32,32,W-64,H-64);
 g.drawImage(logo,76,74,147,56);ink(g,'GLOBAL LEADERSHIP',1000,91,24,'Georgia',white,'right');ink(g,'CONFERENCE 2026',1000,122,24,'Georgia',white,'right');
 // 이름과 초대 번호가 바뀌면 곡선의 주기, 궤도와 별의 위치가 함께 바뀐다.
 g.save();g.translate(540,395);g.rotate((b[2]/255-.5)*.65);g.strokeStyle='rgba(254,230,183,.77)';g.lineWidth=1.55;
 const lobes=3+b[3]%5,phase=b[6]/255*2*Math.PI,stretch=.73+b[7]/900;
 for(let j=0;j<40;j++){g.beginPath();for(let i=0;i<=260;i++){let a=2*Math.PI*i/260,alpha=j/39;const radius=150+32*Math.cos(lobes*a+phase+alpha*3.5)+19*Math.sin((lobes+2)*a-phase+alpha*2.9)+32*alpha;const x=Math.cos(a)*radius,y=Math.sin(a)*radius*stretch;i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.stroke()}
 g.lineWidth=1.4;g.strokeStyle='rgba(250,225,181,.65)';g.beginPath();g.ellipse(0,0,227,227,0,0,Math.PI*2);g.stroke();
 for(let j=0;j<6;j++){const a=b[10+j]/256*2*Math.PI;g.fillStyle=gold;g.beginPath();g.arc(227*Math.cos(a),227*Math.sin(a),j===0?4.9:2.3,0,2*Math.PI);g.fill()}g.restore();
 if(ed.guest){
   const names=lineOfName(ed.guest.name);names.forEach((n,i)=>ink(g,n,78,names.length===1?875:809+i*66,71,'Gowun, serif',white,'left',925));
   ink(g,ed.words[0],80,955,47,'Gowun, serif',gold);
   ink(g,ed.words[1],82,1019,34,'Gowun, serif',white);ink(g,ed.words[2],82,1073,34,'Gowun, serif',white);
 }else{
   ink(g,'The Invitation',76,925,106,'Georgia, serif',white);
   ink(g,'당신을 하롱베이로 초대합니다',82,1010,46,'Gowun, serif',gold);
 }
 g.strokeStyle='rgba(234,214,176,.65)';g.lineWidth=1;g.beginPath();g.moveTo(78,1136);g.lineTo(1002,1136);g.stroke();
 ink(g,'2026. 12. 09 — 12. 12',80,1210,37,'Georgia',white);ink(g,'베트남 하롱베이',80,1264,37,'Gowun, serif',white);
 ink(g,ed.guest?'NO. '+ed.serial:'HA LONG BAY',1000,1262,23,'Georgia',gold,'right');
}

