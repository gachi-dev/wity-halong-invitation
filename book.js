// [코대리] 개인 초대장과 전체 여행 일정을 휴대폰용 PDF에 묶는다.
import {stops,period} from './route.js';
import {splitChars} from './card.js';
let loader;
function library(){
 if(!loader)loader=new Promise((ok,no)=>{const tag=document.createElement('script');tag.src='./assets/jspdf.min.js';tag.onload=()=>ok(window.jspdf.jsPDF);tag.onerror=()=>{loader=null;tag.remove();no(new Error('PDF'))};document.head.append(tag)});
 return loader;
}
function wrap(g,str,max){
 let rows=[],line='';
 for(const ch of splitChars(str)){if(line&&g.measureText(line+ch).width>max){rows.push(line.trim());line=''}line+=ch}
 if(line.trim())rows.push(line.trim());return rows;
}
export async function makeBook(card,name){
 const cover=card.toDataURL('image/jpeg',.94);
 const PDF=await library(),doc=new PDF({unit:'mm',format:[160,200],compress:true});
 doc.setProperties({title:name+' 님의 WITY 초대장과 여행 일정'});doc.addImage(cover,'JPEG',0,0,160,200);
 for(const [index,part] of stops.entries()){
  const c=document.createElement('canvas');c.width=1080;c.height=1520;const g=c.getContext('2d');
  g.fillStyle='#f8f5ec';g.fillRect(0,0,1080,1520);
  function text(str,x,y,px,color,font='sans-serif',weight=500,max=960){g.fillStyle=color;g.font=weight+' '+px+'px '+font;g.fillText(str,x,y,max)}
  text(name+' 님의 여행 일정',62,88,38,'#234d42','Gowun, serif');
  text(period+'  ·  하롱베이',64,146,28,'#546559');g.fillStyle='#bec8b6';g.fillRect(62,185,956,2);
  text(String(index+1).padStart(2,'0')+' / 05     '+part.caption,64,246,27,'#73603d');
  text(part.title,60,325,63,'#173b34','Gowun, serif');text(part.route,64,382,32,'#52675d');
  let y=452;
  for(const [time,title,detail] of part.steps){
    text(time,64,y,29,'#426957','sans-serif',650,125);text(title,210,y,37,'#16392f','sans-serif',700,800);
    g.font='28px sans-serif';const lines=wrap(g,detail,800);for(const [i,line] of lines.entries())text(line,210,y+46+i*37,28,'#51635c');
    y+=94+Math.max(0,lines.length-1)*37;g.fillStyle='#d3d8c9';g.fillRect(64,y-19,950,1);y+=16;
  }
  text('항공편은 공항 현지 시각 · 관광은 이동 순서 기준',64,1460,25,'#58675a');
  doc.addPage([160,225.185]);doc.addImage(c.toDataURL('image/jpeg',.88),'JPEG',0,0,160,225.185);
 }
 return doc.output('blob');
}

