(function(){
'use strict';

/* ── Scroll reveal ── */
var els=document.querySelectorAll('.reveal');
if(!('IntersectionObserver' in window)){
  els.forEach(function(el){el.classList.add('is-visible');});
}else{
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting)return;
      var siblings=entry.target.parentElement
        ?Array.from(entry.target.parentElement.children).filter(function(c){
          return c.classList.contains('reveal')&&!c.classList.contains('is-visible');
        }):[];
      var idx=siblings.indexOf(entry.target);
      entry.target.style.transitionDelay=Math.min(idx,2)*80+'ms';
      entry.target.classList.add('is-visible');
      entry.target.addEventListener('transitionend',function h(){
        entry.target.style.transitionDelay='';
        entry.target.removeEventListener('transitionend',h);
      });
      io.unobserve(entry.target);
    });
  },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
  els.forEach(function(el){io.observe(el);});
}

/* ── Barra de progreso de obra ── */
var bar=document.querySelector('.obra__bar-fill');
if(bar){
  var tw=bar.getAttribute('data-target-width')||'0%';
  if('IntersectionObserver' in window){
    var bo=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        requestAnimationFrame(function(){bar.style.width=tw;});
        bo.unobserve(entry.target);
      });
    },{threshold:.5});
    bo.observe(bar);
  }else{bar.style.width=tw;}
}

/* ── Lightbox con carousel ── */
var overlay=document.getElementById('lightbox');
var lbImg=document.getElementById('lb-img');
var lbCap=document.getElementById('lb-caption');
var closeBtn=document.getElementById('lb-close');
var prevBtn=document.getElementById('lb-prev');
var nextBtn=document.getElementById('lb-next');
var lastFocus=null,closeTimer=null;

/* Estado del grupo activo */
var groupItems=[];
var groupIdx=0;

function buildGroup(group){
  if(!group){groupItems=[];return;}
  var nodes=Array.from(document.querySelectorAll('[data-lb-group="'+group+'"]'));
  groupItems=nodes.map(function(n){
    return{
      src:n.getAttribute('data-lb-src')||(n.tagName==='IMG'?n.src:''),
      alt:n.getAttribute('alt')||'',
      cap:n.getAttribute('data-lb-caption')||'',
      type:n.getAttribute('data-lb-type')||''
    };
  }).filter(function(i){return i.src;});
}

function applyNavVisibility(){
  var show=groupItems.length>1;
  if(prevBtn)prevBtn.style.visibility=show?'visible':'hidden';
  if(nextBtn)nextBtn.style.visibility=show?'visible':'hidden';
}

function setImage(item){
  lbImg.setAttribute('src',item.src);
  lbImg.setAttribute('alt',item.alt);
  lbCap.textContent=item.cap;
  overlay.dataset.lbType=item.type;
}

function openLb(src,alt,cap,type,group){
  if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
  lastFocus=document.activeElement;
  buildGroup(group);
  /* find index of current item in group */
  groupIdx=0;
  for(var i=0;i<groupItems.length;i++){
    if(groupItems[i].src===src){groupIdx=i;break;}
  }
  lbImg.setAttribute('src',src);
  lbImg.setAttribute('alt',alt||'');
  lbCap.textContent=cap||'';
  overlay.dataset.lbType=type||'';
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('lb-open');
  applyNavVisibility();
  closeBtn.focus();
}

function closeLb(){
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden','true');
  overlay.dataset.lbType='';
  document.body.classList.remove('lb-open');
  closeTimer=setTimeout(function(){
    lbImg.removeAttribute('src');
    lbImg.setAttribute('alt','');
    lbCap.textContent='';
    closeTimer=null;
  },320);
  try{if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();}catch(e){}
  lastFocus=null;
  groupItems=[];
}

function prevLb(){
  if(!groupItems.length)return;
  groupIdx=(groupIdx-1+groupItems.length)%groupItems.length;
  setImage(groupItems[groupIdx]);
}

function nextLb(){
  if(!groupItems.length)return;
  groupIdx=(groupIdx+1)%groupItems.length;
  setImage(groupItems[groupIdx]);
}

function getLbTarget(el){
  while(el&&el!==document.body){
    if(el.hasAttribute('data-lightbox'))return el;
    el=el.parentElement;
  }
  return null;
}

document.addEventListener('click',function(e){
  if(prevBtn&&(e.target===prevBtn||prevBtn.contains(e.target))){prevLb();return;}
  if(nextBtn&&(e.target===nextBtn||nextBtn.contains(e.target))){nextLb();return;}
  if(closeBtn&&(e.target===closeBtn||closeBtn.contains(e.target))){closeLb();return;}
  if(e.target===overlay){closeLb();return;}
  var t=getLbTarget(e.target);
  if(t){
    e.preventDefault();
    var src=t.getAttribute('data-lb-src')||(t.tagName==='IMG'?t.src:'');
    if(!src)return;
    if(overlay.classList.contains('is-open')){closeLb();return;}
    openLb(src,t.getAttribute('alt')||'',t.getAttribute('data-lb-caption')||'',t.getAttribute('data-lb-type')||'',t.getAttribute('data-lb-group')||'');
    return;
  }
  if(overlay.classList.contains('is-open')){closeLb();return;}
});

/* ── Teclado ── */
document.addEventListener('keydown',function(e){
  if(!overlay.classList.contains('is-open'))return;
  if(e.key==='Escape'||e.key==='Esc'){closeLb();return;}
  if(e.key==='ArrowLeft'){prevLb();return;}
  if(e.key==='ArrowRight'){nextLb();return;}
  if((e.key==='Enter'||e.key===' ')){
    var t=getLbTarget(e.target);
    if(t&&t.getAttribute('role')==='button'){e.preventDefault();t.click();}
  }
});

overlay.addEventListener('keydown',function(e){
  if(e.key==='Tab'){e.preventDefault();closeBtn.focus();}
});

/* ── Swipe táctil ── */
var touchStartX=0;
overlay.addEventListener('touchstart',function(e){
  touchStartX=e.changedTouches[0].clientX;
},{passive:true});
overlay.addEventListener('touchend',function(e){
  var dx=e.changedTouches[0].clientX-touchStartX;
  if(Math.abs(dx)>50){
    if(dx<0)nextLb();else prevLb();
  }
},{passive:true});

}());
