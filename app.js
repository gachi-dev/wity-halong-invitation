// [코대리] 개인 초대장 발급·공유·저장과 현지 일정의 진행 상태를 연결한다.
import {stops,count,startOf,sectionOf,clockPosition} from './route.js';
import {edition,mint,fromHash,invitationHash,normalizeName,validName,paintCard} from './card.js';
const $=id=>document.getElementById(id);
const plain=new URL('./',location.href).href, card=$('card'),guestField=$('guest');
let current=null,generation=0,busy=false,selected=0,progress=0,manual=false,noticeTimer;
const make=(tag,txt,cls)=>{const el=document.createElement(tag);if(txt!==undefined)el.textContent=txt;if(cls)el.className=cls;return el};
function toast(txt){clearTimeout(noticeTimer);$('toast').textContent=txt;$('toast').hidden=false;noticeTimer=setTimeout(()=>$('toast').hidden=true,3200)}
function modal(title,description){const dlg=$('sheet');dlg.querySelector('h2').textContent=title;$('sheet-description').textContent=description;$('sheet-content').replaceChildren();if(!dlg.open)dlg.showModal();return $('sheet-content')}
$('sheet').querySelector('.close').onclick=()=>$('sheet').close();
function linkFor(guest){return guest?plain+invitationHash(guest):plain}
async function copyLink(url){
 if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(url);toast('링크를 복사했습니다');return}catch{}}
 const box=modal('링크 복사','아래 주소를 길게 눌러 복사한 뒤 카카오톡에 붙여넣어 주세요.');
 const input=make('input',undefined,'sheet-input');input.value=url;input.readOnly=true;input.setAttribute('aria-label','복사할 초대 링크');box.append(input);input.focus();input.select();
}
function action(label,fn){const b=make('button',label,'sheet-action');b.type='button';b.onclick=fn;return b}
function shareFallback(url,personal){
 const box=modal('카카오톡으로 전달',personal?'이 링크를 열면 이름이 담긴 초대장과 여행 일정이 함께 보입니다. 복사한 링크를 카카오톡 대화방에 붙여넣어 주세요.':'아래 링크를 카카오톡에 보내세요. 받는 분이 이름을 입력해 자신의 초대장을 만들 수 있습니다.');
 const input=make('input',undefined,'sheet-input');input.readOnly=true;input.value=url;input.setAttribute('aria-label','전달할 링크');input.onclick=()=>input.select();
 box.append(input,action('링크 복사',()=>copyLink(url)));
}
async function share(guest){
 const url=linkFor(guest),title=guest?guest.name+' 님의 WITY 초대장':'당신을 초대합니다';
 if(navigator.share){try{await navigator.share({title,text:guest?'하롱베이 컨퍼런스 초대장과 여행 일정입니다.':'이름을 담은 WITY 하롱베이 컨퍼런스 초대장을 받아보세요.',url});return}catch(e){if(e.name==='AbortError')return}}
 shareFallback(url,!!guest);
}
$('invite-copy').onclick=()=>share(null);$('share').onclick=()=>current&&share(current.guest);
function routeGo(ev){ev?.preventDefault();$('journey').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('journey').focus({preventScroll:true})}
['nav-route','footer-route','show-route'].forEach(id=>$(id).onclick=routeGo);
function key(){return 'wity-halong-route-v1:'+ (current?.guest.seed||'preview')}
function readProgress(){
 manual=false;
 try{const raw=localStorage.getItem(key()),v=Number(raw);if(raw!==null&&Number.isInteger(v)&&v>=0&&v<=count){manual=true;return v}}catch{}
 return clockPosition();
}
function moveTo(n){
 manual=true;progress=Math.min(count,Math.max(0,n));selected=sectionOf(Math.min(progress,count-1));try{localStorage.setItem(key(),String(progress))}catch{}renderRoute();
}
function renderRoute(){
 const part=stops[selected],nextBlock=sectionOf(Math.min(progress,count-1)),next=stops[nextBlock].steps[progress-startOf(nextBlock)];
 $('next-label').textContent=next?'다음 일정':'여정 종료';$('next-title').textContent=next?next[1]:(manual?'모든 일정을 마쳤습니다':'예정된 귀국 시각이 지났습니다');
 $('next-meta').textContent=next?(stops[nextBlock].tab+' · '+next[0]+'   /   '+(manual?'내가 표시한 일정 기준':(progress===3?'현지 진행에 맞춰 완료를 표시하세요':'예정 시각 기준'))):'하롱베이에서 함께해 주셔서 감사합니다.';
 $('advance').hidden=progress===count;$('undo').hidden=progress===0;
 $('tabs').replaceChildren(...stops.map((p,i)=>{const b=make('button');b.type='button';b.setAttribute('aria-pressed',String(selected===i));b.append(make('b',p.tab),make('small',p.caption));b.onclick=()=>{selected=i;renderRoute();$('tabs').children[i].focus({preventScroll:true})};return b}));
 $('stage-caption').textContent=part.caption;$('stage-title').textContent=part.title;$('stage-route').textContent=part.route;
 $('timeline').replaceChildren(...part.steps.map(([time,title,detail],i)=>{
  const absolute=startOf(selected)+i,li=make('li');if(absolute<progress)li.className='done';
  const stamp=make(/^\d/.test(time)?'time':'span',time,'phase');const block=make('div'),heading=make('strong',(manual&&absolute<progress?'✓ ':'')+title);
  block.append(heading,make('p',detail));
  if(absolute>progress){const b=make('button','여기까지 완료','timeline-action');b.type='button';b.setAttribute('aria-label',title+'까지 완료');b.onclick=()=>moveTo(absolute+1);block.append(b)}
  li.append(stamp,block);return li;
 }));
}
$('advance').onclick=()=>moveTo(progress+1);$('undo').onclick=()=>moveTo(progress-1);
const safeFilename=n=>n.replace(/[\\/:*?"<>|]/g,'_').slice(0,64)||'Guest';
function download(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000)}
$('save').onclick=async()=>{
 if(!current)return;const f='WITY_'+safeFilename(current.guest.name)+'_초대장.png';
 try{const blob=await new Promise(ok=>card.toBlob(ok,'image/png'));if(!blob)throw Error();
  const box=modal('초대장 이미지 저장','파일을 저장하거나, 휴대폰에서 아래 이미지를 길게 눌러 사진에 저장하세요.');
  const im=make('img',undefined,'save-image');im.alt='이름이 담긴 초대장';const url=URL.createObjectURL(blob);im.src=url;
  box.append(im,action('PNG 다운로드',()=>download(blob,f)));
  $('sheet').addEventListener('close',()=>URL.revokeObjectURL(url),{once:true});
 }catch{toast('이미지를 준비하지 못했습니다. 다시 시도해 주세요.')}
};
$('pdf').onclick=async()=>{if(!current)return;const btn=$('pdf'),label=btn.textContent,g=current.guest;btn.disabled=true;btn.textContent='PDF 준비 중…';
 try{const {makeBook}=await import('./book.js');const blob=await makeBook(card,g.name);download(blob,'WITY_'+safeFilename(g.name)+'_초대장과_여행일정.pdf');toast('초대장과 여행 일정 PDF를 준비했습니다')}
 catch{toast('PDF를 저장하지 못했습니다. 다시 시도해 주세요.')}finally{btn.disabled=false;btn.textContent=label}};
function displayText(ed){
 const g=ed?.guest,headline=$('headline');headline.replaceChildren();
 if(g){headline.append(document.createTextNode(g.name+' 님,'),make('br'),make('em','환영합니다'));$('lead').textContent=ed.words[1]+' '+ed.words[2];$('card-caption').textContent=g.name+' 님의 초대장 · '+ed.words[0];$('journey-title').textContent=g.name+' 님의 여행 일정';card.setAttribute('aria-label',g.name+' 님의 하롱베이 초대장. '+ed.words.join(' '))}
 else{headline.append(document.createTextNode('당신을'),make('br'),make('em','초대합니다'));$('lead').replaceChildren(document.createTextNode('함께하고 싶은 분을 떠올리며 준비한 자리입니다.'),make('br'),document.createTextNode('올겨울, 하롱베이에서 만나 뵙겠습니다.'));$('card-caption').textContent='초대장 미리보기';$('journey-title').textContent='여행 일정';card.setAttribute('aria-label','하롱베이 컨퍼런스 초대장 미리보기')}
 document.body.classList.toggle('ready',!!g);$('name-form').hidden=!!g;$('actions').hidden=!g;$('pdf').hidden=!g;
}
async function render(guest,mode){
 const version=++generation;busy=true;$('generate').disabled=true;$('form-status').textContent=guest?'초대장을 준비하고 있습니다…':'';
 try{const ed=await edition(guest),off=document.createElement('canvas');off.width=1080;off.height=1350;await paintCard(off,ed);if(version!==generation)return;
  card.getContext('2d').drawImage(off,0,0);current=guest?ed:null;
  if(mode==='push')history.pushState(null,'',linkFor(guest));displayText(current);progress=readProgress();selected=sectionOf(Math.min(progress,count-1));renderRoute();
  if(guest){const wrap=card.parentElement;wrap.classList.remove('reveal');void wrap.offsetWidth;wrap.classList.add('reveal');if(mode==='push')toast('나만의 초대장을 열었습니다')}
  $('form-status').textContent='';
 }catch{if(version===generation){$('form-status').textContent='초대장을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.';toast('초대장을 불러오지 못했습니다')}}
 finally{if(version===generation){busy=false;$('generate').disabled=false}}
}
$('name-form').onsubmit=e=>{e.preventDefault();if(busy)return;const name=normalizeName(guestField.value);if(!validName(name)){guestField.setAttribute('aria-invalid','true');$('form-status').textContent='이름을 1~30자로 입력해 주세요.';guestField.focus();return}guestField.removeAttribute('aria-invalid');render(mint(name),'push')};
guestField.oninput=()=>{guestField.removeAttribute('aria-invalid');$('form-status').textContent=''};
$('restart').onclick=async()=>{guestField.value='';await render(null,'push');guestField.focus();window.scrollTo(0,0)};
function restore(){const v=fromHash(location.hash);if(location.hash.startsWith('#i=')&&!v)toast('초대 링크를 확인해 주세요. 이름으로 새 카드를 만들 수 있습니다.');render(v)}
function refreshClock(){if(!manual&&progress!==clockPosition()){progress=clockPosition();selected=sectionOf(Math.min(progress,count-1));renderRoute()}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshClock()});setInterval(refreshClock,60000);
window.addEventListener('hashchange',restore);renderRoute();restore();

