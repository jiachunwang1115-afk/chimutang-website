// ===== ROUTING =====
var ROUTES=['#home','#products','#series','#craft','#journal','#cases','#about','#service','#contact'];
var MOBILE_NAV_META={
  '#home':{eyebrow:'WOOD ALL',title:'痴木堂'},
  '#products':{eyebrow:'PRODUCT CENTER',title:'产品中心'},
  '#series':{eyebrow:'SERIES ARCHIVE',title:'系列介绍'},
  '#craft':{eyebrow:'CRAFT ARCHIVE',title:'工艺技术'},
  '#journal':{eyebrow:'CHIMU JOURNAL',title:'痴木志'},
  '#cases':{eyebrow:'PAVING ATLAS',title:'铺装参考库'},
  '#about':{eyebrow:'BRAND STORY',title:'品牌故事'},
  '#service':{eyebrow:'SERVICE',title:'服务支持'},
  '#contact':{eyebrow:'REACH US',title:'联系我们'},
  '#not-found':{eyebrow:'WOOD ALL',title:'未找到页面'}
};

function getBaseHash(hash){
  if(hash&&hash.indexOf('#journal/muchi/')===0)return'#journal';
  return hash;
}

var suppressNextHashChange=false;

function navigate(hash,options){
  options=options||{};
  var baseHash=getBaseHash(hash);
  if(ROUTES.indexOf(baseHash)<0){
    hash='#not-found';
    baseHash='#not-found';
  }
  var preserveScroll=!!options.preserveScroll||(baseHash==='#journal'&&document.body.classList.contains('muchi-reader-open'));
  if(window.location.hash!==hash){
    suppressNextHashChange=true;
    window.location.hash=hash;
  }
  updateNav(baseHash);
  updateCorporateCta(baseHash);
  showPage(baseHash,{preserveScroll:preserveScroll});
  if(baseHash==='#products') initProductsPage();
  if(baseHash==='#series') initSeriesPage();
  if(baseHash==='#craft') initCraftPage();
  if(baseHash==='#journal') initJournalPage(hash);
}

function updateNav(hash){
  var routeName=(hash||'#home').replace('#','')||'home';
  document.body.setAttribute('data-route',routeName);
  var meta=MOBILE_NAV_META[hash]||MOBILE_NAV_META['#home'];
  var mobileEyebrow=document.getElementById('mobileNavEyebrow');
  var mobileTitle=document.getElementById('mobileNavTitle');
  if(mobileEyebrow) mobileEyebrow.textContent=meta.eyebrow;
  if(mobileTitle) mobileTitle.textContent=meta.title;
  document.querySelectorAll('.nav-links a').forEach(function(a){
    a.classList.toggle('active',a.getAttribute('href')===hash);
  });
  document.querySelectorAll('[data-mobile-chapter]').forEach(function(a){
    a.classList.toggle('active',a.getAttribute('href')===hash);
  });
  closeMobileNav();
}

function updateCorporateCta(hash){
  document.querySelectorAll('[data-quick-route]').forEach(function(item){
    item.classList.toggle('active',item.getAttribute('data-quick-route')===hash);
  });
}

function loadDeferredMedia(root){
  if(!root) return;
  root.querySelectorAll('img[data-route-src]').forEach(function(img){
    if(!img.getAttribute('src')){
      img.setAttribute('src',img.getAttribute('data-route-src'));
    }
  });
  observeDeferredVideoPosters(root);
}

function setDeferredVideoPoster(video){
  var poster=video&&video.getAttribute('data-poster');
  if(poster&&!video.getAttribute('poster')){
    video.setAttribute('poster',poster);
  }
}

function observeDeferredVideoPosters(root){
  var videos=[].slice.call(root.querySelectorAll('video[data-poster]'));
  if(!videos.length)return;
  if(!('IntersectionObserver' in window)){
    videos.forEach(setDeferredVideoPoster);
    return;
  }
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        setDeferredVideoPoster(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },{rootMargin:'360px 0px',threshold:.01});
  videos.forEach(function(video){
    if(video.dataset.posterObserved==="true")return;
    video.dataset.posterObserved="true";
    observer.observe(video);
  });
}

function initCorporateCta(){
  var backTop=document.getElementById('backToTop');
  if(backTop&&!backTop.dataset.bound){
    backTop.dataset.bound='true';
    backTop.addEventListener('click',function(){
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }
  var toggleTop=function(){
    document.body.classList.toggle('has-scrolled',window.scrollY>420);
  };
  toggleTop();
  window.addEventListener('scroll',toggleTop,{passive:true});
  updateCorporateCta(window.location.hash||'#home');
}

function showPage(hash,options){
  options=options||{};
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  var pageId='page-'+hash.replace('#','');
  var page=document.getElementById(pageId);
  if(!page) page=document.getElementById('page-not-found');
  document.body.classList.add('route-changing');
  if(page){
    page.classList.add('active');
    loadDeferredMedia(page);
    if(!options.preserveScroll)window.scrollTo(0,0);
  }
  window.setTimeout(applyImageSlotBadges,80);
  window.setTimeout(function(){
    document.body.classList.remove('route-changing');
    applyImageSlotBadges();
  },360);
}

// Mobile navigation
function closeMobileNav(){
  var navLinks=document.getElementById('navLinks');
  var hamburger=document.getElementById('hamburger');
  var menuChip=document.getElementById('mobileMenuChip');
  var backdrop=document.getElementById('navBackdrop');
  if(navLinks) navLinks.classList.remove('open');
  if(hamburger){
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded','false');
  }
  if(menuChip){
    menuChip.classList.remove('open');
    menuChip.setAttribute('aria-expanded','false');
  }
  if(backdrop) backdrop.classList.remove('open');
  document.body.classList.remove('nav-open');
}

function openMobileNav(){
  var navLinks=document.getElementById('navLinks');
  var hamburger=document.getElementById('hamburger');
  var menuChip=document.getElementById('mobileMenuChip');
  var backdrop=document.getElementById('navBackdrop');
  if(navLinks) navLinks.classList.add('open');
  if(hamburger){
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded','true');
  }
  if(menuChip){
    menuChip.classList.add('open');
    menuChip.setAttribute('aria-expanded','true');
  }
  if(backdrop) backdrop.classList.add('open');
  document.body.classList.add('nav-open');
}

var mobileMenuButton=document.getElementById('hamburger');
var mobileMenuChip=document.getElementById('mobileMenuChip');
var mobileMenuClose=document.getElementById('mobileMenuClose');
var mobileMenuBackdrop=document.getElementById('navBackdrop');

if(mobileMenuButton){
  mobileMenuButton.addEventListener('click',function(){
    var navLinks=document.getElementById('navLinks');
    if(navLinks&&navLinks.classList.contains('open')) closeMobileNav();
    else openMobileNav();
  });
}

if(mobileMenuChip){
  mobileMenuChip.addEventListener('click',function(){
    var navLinks=document.getElementById('navLinks');
    if(navLinks&&navLinks.classList.contains('open')) closeMobileNav();
    else openMobileNav();
  });
}

if(mobileMenuClose){
  mobileMenuClose.addEventListener('click',closeMobileNav);
}

if(mobileMenuBackdrop){
  mobileMenuBackdrop.addEventListener('click',closeMobileNav);
}

document.addEventListener('click',function(e){
  if(!document.body.classList.contains('nav-open')) return;
  if(e.target.closest('.nav-inner')||e.target.closest('.nav-links')) return;
  closeMobileNav();
});

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    closeMobileNav();
    closeBrandFilm();
    closeSpaceCase();
    closeDrawer();
  }
});

// Brand film
function openBrandFilm(e){
  var modal=document.getElementById('filmModal');
  var opener=e&&e.currentTarget?e.currentTarget:document.getElementById('brandFilmOpen');
  var video=document.getElementById('brandFilmVideo');
  var fallback=document.getElementById('filmFallback');
  if(!modal||!opener||!video) return;
  if(fallback) fallback.classList.remove('visible');
  var poster=video.getAttribute('data-poster')||opener.getAttribute('data-poster')||'';
  if(poster&&!video.getAttribute('poster')) video.setAttribute('poster',poster);
  video.src=opener.getAttribute('data-video-src')||'';
  video.load();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('film-open');
  var playAttempt=video.play();
  if(playAttempt&&playAttempt.catch) playAttempt.catch(function(){});
}

function closeBrandFilm(){
  var modal=document.getElementById('filmModal');
  var video=document.getElementById('brandFilmVideo');
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('film-open');
  if(video){
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}

var filmModalClose=document.getElementById('filmModalClose');
var filmModalBackdrop=document.getElementById('filmModalBackdrop');
var brandFilmVideo=document.getElementById('brandFilmVideo');
document.querySelectorAll('[data-video-src]').forEach(function(btn){
  btn.addEventListener('click',openBrandFilm);
});
if(filmModalClose) filmModalClose.addEventListener('click',closeBrandFilm);
if(filmModalBackdrop) filmModalBackdrop.addEventListener('click',closeBrandFilm);
if(brandFilmVideo){
  brandFilmVideo.addEventListener('error',function(){
    var fallback=document.getElementById('filmFallback');
    if(fallback) fallback.classList.add('visible');
  });
}

// Nav clicks
document.querySelectorAll('.nav-links a').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    navigate(this.getAttribute('href'));
  });
});

document.querySelectorAll('[data-mobile-chapter]').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    navigate(this.getAttribute('href'));
  });
});

// Handle initial hash
function handleHash(){
  var hash=window.location.hash||'#home';
  navigate(hash);
}
window.addEventListener('hashchange',function(){
  if(suppressNextHashChange){
    suppressNextHashChange=false;
    return;
  }
  handleHash();
});

// ===== PRODUCT DATA & FILTERING =====
var PAVING_SUPPORT_ASSETS={
  oakLight:{src:"journal/paving-support/support-texture-oak-light.webp",alt:"浅橡木纹理近观",title:"浅木纹理"},
  oakNatural:{src:"journal/paving-support/support-texture-oak-natural.webp",alt:"自然橡木纹理近观",title:"原木纹理"},
  oakBrown:{src:"journal/paving-support/support-texture-oak-brown.webp",alt:"中棕木纹纹理近观",title:"中棕纹理"},
  warm:{src:"journal/paving-support/support-texture-warm.webp",alt:"温润木色纹理近观",title:"温润木色"},
  deep:{src:"journal/paving-support/support-texture-deep.webp",alt:"深色木纹纹理近观",title:"深色纹理"},
  smoke:{src:"journal/paving-support/support-texture-smoke.webp",alt:"烟熏灰木纹纹理近观",title:"烟熏灰调"},
  maintenance:{src:"journal/paving-support/support-maintenance-kit.webp",alt:"木地板养护用品",title:"养护建议"},
  repair:{src:"journal/paving-support/support-maintenance-before-after.webp",alt:"木地板维护前后对比",title:"维护前后"},
  oil:{src:"journal/paving-support/support-maintenance-oil.webp",alt:"木地板表面护理油",title:"表面护理"},
  nosing:{src:"journal/paving-support/support-stair-nosing.webp",alt:"楼梯收口木作部件",title:"楼梯收口"},
  skirting:{src:"journal/paving-support/support-skirting-installed.webp",alt:"踢脚线安装效果",title:"墙地收边"},
  section:{src:"journal/paving-support/support-section-stile.webp",alt:"木作部件剖面结构",title:"结构剖面"}
};

function getPavingSupport(keys){
  return (keys||[]).map(function(key){return PAVING_SUPPORT_ASSETS[key]}).filter(Boolean);
}

function paving(item){
  item.mediaType=item.mediaType||"image";
  item.title=item.title||item.headline;
  item.spaceType=item.roomType;
  item.journalLink=item.journalLink||"#journal";
  item.relatedAssets=getPavingSupport(item.support);
  return item;
}

var SPACE_MEDIA=[
  paving({id:"living-hero",src:"journal/paving-reference/ref-living-hero.webp",alt:"浅木客厅与电视墙空间铺装参考",headline:"木入客厅",subline:"以浅木承光",roomType:"客厅",colorTone:"浅木",styleTag:"自然侘寂",pattern:"通铺长板",mood:"明亮",wood:"橡木",series:"境系列",summary:"大面积浅木让客餐厅先有明度，再承接家具、墙面与人的动线。适合采光充足、希望空间显得舒展的户型。",detailPoints:["空间观感：浅木作底，客厅更显宽阔。","木色建议：橡木、欧橡适合大面积通铺。","铺法建议：长板顺光铺设，减少视觉切割。"],support:["oakLight","section"],productFilter:{series:"境系列",wood:"橡木"},featured:true}),
  paving({id:"living-light",src:"journal/paving-reference/ref-living-light.webp",alt:"明亮客厅浅木地板铺装参考",headline:"光下原木",subline:"明厅宜浅",roomType:"客厅",colorTone:"原木",styleTag:"现代极简",pattern:"宽板",mood:"明亮",wood:"欧橡",series:"悦系列",summary:"原木色能把自然光转成温和底色。适合白墙、低饱和家具和开敞客厅，视觉安静而不单薄。",detailPoints:["空间观感：明亮、干净、家具更易搭配。","木色建议：选择纹理清晰但色差克制的原木色。","铺法建议：宽板更能保留大宅尺度。"],support:["oakNatural","maintenance"],productFilter:{series:"悦系列",wood:"欧橡"},featured:true}),
  paving({id:"living-dark-lounge",src:"journal/paving-reference/ref-living-dark-lounge.webp",alt:"深色会客厅木地板铺装参考",headline:"深厅有序",subline:"以暗定静",roomType:"客厅",colorTone:"深胡桃",styleTag:"意式沉稳",pattern:"宽板",mood:"沉静",wood:"黑胡桃",series:"墨系列",summary:"深色地面能压住大尺度空间，让沙发、皮革、金属和灯光更有层次。适合会客厅与沉稳型大宅。",detailPoints:["空间观感：深色收束视线，增强秩序。","木色建议：黑胡桃或深烟熏色更适合低照度空间。","铺法建议：宽板少接缝，氛围更完整。"],support:["deep","oil"],productFilter:{series:"墨系列",wood:"黑胡桃"},featured:true}),
  paving({id:"living-soft-sofa",src:"journal/paving-reference/ref-living-soft-sofa.webp",alt:"柔和客厅中棕木地板铺装参考",headline:"柔厅温木",subline:"中棕宜居",roomType:"客厅",colorTone:"中棕",styleTag:"自然侘寂",pattern:"通铺长板",mood:"温润",wood:"橡木",series:"森系列",summary:"中棕色不抢家具，也能稳定空间温度。适合客厅、家庭厅和需要长期耐看的居住场景。",detailPoints:["空间观感：温润、耐看，适合日常居住。","木色建议：中棕橡木兼顾温度和耐脏。","铺法建议：通铺长板让家庭厅更连贯。"],support:["oakBrown","maintenance"],productFilter:{series:"森系列",wood:"橡木"},featured:true}),
  paving({id:"living-warm-classic",src:"journal/paving-reference/ref-living-warm-classic.webp",alt:"温润客厅木地板与壁炉空间铺装参考",headline:"暖木成厅",subline:"光影入座",roomType:"客厅",colorTone:"中棕",styleTag:"东方静奢",pattern:"通铺长板",mood:"温润",wood:"胡桃木",series:"森系列",summary:"暖木色适合壁炉、织物、石材和软装共处。它不追求明亮，而是让客厅更有停留感。",detailPoints:["空间观感：暖色木地面承接家具与火光。","木色建议：胡桃木、暖棕橡木更显温度。","铺法建议：顺主视线铺设，强调空间纵深。"],support:["warm","oil"],productFilter:{series:"森系列",wood:"胡桃木"},featured:true}),
  paving({id:"dining-open",src:"journal/paving-reference/ref-dining-open.webp",alt:"开放餐厨中棕木地板铺装参考",headline:"餐厨连贯",subline:"动线成序",roomType:"餐厨",colorTone:"中棕",styleTag:"现代极简",pattern:"通铺长板",mood:"温润",wood:"橡木",series:"境系列",summary:"开放餐厨更需要地面统一。中棕通铺能把餐桌、岛台与客厅连成一条清晰动线。",detailPoints:["空间观感：餐厨与客厅一体，少分割。","木色建议：中棕橡木耐看，也更抗生活痕迹。","铺法建议：通铺长板优先，减少门槛感。"],support:["oakBrown","skirting"],productFilter:{series:"境系列",wood:"橡木"},featured:true}),
  paving({id:"dining-light",src:"journal/paving-reference/ref-dining-light.webp",alt:"明亮餐厅浅木地板铺装参考",headline:"光中用餐",subline:"浅色显净",roomType:"餐厨",colorTone:"浅木",styleTag:"现代极简",pattern:"宽板",mood:"明亮",wood:"白蜡木",series:"悦系列",summary:"浅木色能弱化餐厨的功能感，让空间更轻。适合白墙、浅色餐桌与自然光充足的户型。",detailPoints:["空间观感：轻、净、适合开放式餐厨。","木色建议：白蜡木或浅橡木能提升明度。","铺法建议：宽板少线条，餐厅更利落。"],support:["oakLight","maintenance"],productFilter:{series:"悦系列",wood:"白蜡木"},featured:true}),
  paving({id:"dining-minimal",src:"journal/paving-reference/ref-dining-minimal.webp",alt:"极简餐厨浅木地板铺装参考",headline:"简席见木",subline:"留白见质",roomType:"餐厨",colorTone:"浅木",styleTag:"现代极简",pattern:"通铺长板",mood:"明亮",wood:"橡木",series:"悦系列",summary:"在极简餐厨里，木地板承担温度。浅木与白墙同场时，纹理不宜过强，留一点自然即可。",detailPoints:["空间观感：简洁、清爽，适合轻量家具。","木色建议：浅木低色差更显高级。","铺法建议：长板顺光，保留空间纵深。"],support:["oakLight","section"],productFilter:{series:"悦系列",wood:"橡木"},featured:true}),
  paving({id:"kitchen-ceiling",src:"journal/paving-reference/ref-kitchen-ceiling.webp",alt:"木顶与木地餐厨空间铺装参考",headline:"上下同木",subline:"木作一体",roomType:"餐厨",colorTone:"原木",styleTag:"东方静奢",pattern:"木作一体",mood:"温润",wood:"欧橡",series:"森系列",summary:"当地面、顶面和柜体都有木作，色阶要统一。原木色能让空间完整，但不至于压暗。",detailPoints:["空间观感：顶地呼应，空间更完整。","木色建议：原木色适合全屋木作系统。","铺法建议：地板方向应与顶面线条保持秩序。"],support:["oakNatural","skirting"],productFilter:{series:"森系列",wood:"欧橡"},featured:false}),
  paving({id:"kitchen-long",src:"journal/paving-reference/ref-kitchen-long.webp",alt:"长餐厨空间浅木地板铺装参考",headline:"长厨通铺",subline:"一线到底",roomType:"餐厨",colorTone:"浅木",styleTag:"现代极简",pattern:"通铺长板",mood:"明亮",wood:"橡木",series:"境系列",summary:"狭长餐厨最忌地面被切碎。顺动线通铺能把空间拉直，也让清洁和维护逻辑更简单。",detailPoints:["空间观感：长向更清楚，动线更舒展。","木色建议：浅橡木能降低狭长空间压迫感。","铺法建议：顺长边铺设，减少横向切割。"],support:["oakLight","maintenance"],productFilter:{series:"境系列",wood:"橡木"},featured:false}),
  paving({id:"kitchen-family",src:"journal/paving-reference/ref-kitchen-family.webp",alt:"家庭餐厨原木地板铺装参考",headline:"家常有木",subline:"烟火不重",roomType:"餐厨",colorTone:"原木",styleTag:"自然侘寂",pattern:"宽板",mood:"柔光",wood:"橡木",series:"悦系列",summary:"家庭餐厨需要耐看与亲近。原木宽板能容纳日常使用痕迹，空间仍保持温和秩序。",detailPoints:["空间观感：亲近、自然，适合日常使用。","木色建议：原木橡木耐看，不易过时。","铺法建议：宽板让餐厨更有尺度感。"],support:["oakNatural","repair"],productFilter:{series:"悦系列",wood:"橡木"},featured:false}),
  paving({id:"bedroom-light",src:"journal/paving-reference/ref-bedroom-light.webp",alt:"浅木卧室地板铺装参考",headline:"卧室轻呼吸",subline:"浅木入眠",roomType:"卧室",colorTone:"浅木",styleTag:"现代极简",pattern:"通铺长板",mood:"明亮",wood:"橡木",series:"悦系列",summary:"卧室更适合降低视觉重量。浅木地面搭配织物、低床和柔光，让休息区更安静。",detailPoints:["空间观感：轻、柔、适合休息。","木色建议：浅橡木更容易搭配织物。","铺法建议：床边保持连续纹理，减少切割。"],support:["oakLight","maintenance"],productFilter:{series:"悦系列",wood:"橡木"},featured:false}),
  paving({id:"bedroom-deep",src:"journal/paving-reference/ref-bedroom-deep.webp",alt:"深色卧室木地板铺装参考",headline:"静室深纹",subline:"深色定静气",roomType:"卧室",colorTone:"深胡桃",styleTag:"意式沉稳",pattern:"人字拼",mood:"沉静",wood:"黑胡桃",series:"墨系列",summary:"深色卧室不追求明亮，而在于稳定。人字纹理给空间一点秩序，适合主卧和套房。",detailPoints:["空间观感：沉静、包裹感更强。","木色建议：黑胡桃或深棕色更适合低照度卧室。","铺法建议：人字拼增强秩序，但需控制软装复杂度。"],support:["deep","oil"],productFilter:{series:"墨系列",wood:"黑胡桃"},featured:false}),
  paving({id:"bedroom-warm",src:"journal/paving-reference/ref-bedroom-warm.webp",alt:"温润卧室木地板铺装参考",headline:"暖卧有度",subline:"柔光近身",roomType:"卧室",colorTone:"中棕",styleTag:"东方静奢",pattern:"通铺长板",mood:"柔光",wood:"胡桃木",series:"森系列",summary:"暖棕木色能让卧室更有安定感。适合布艺、木作柜体和低饱和墙面一起使用。",detailPoints:["空间观感：暖而不闷，适合主卧。","木色建议：胡桃木或暖棕橡木更显温度。","铺法建议：床头到窗边保持同向铺设。"],support:["warm","skirting"],productFilter:{series:"森系列",wood:"胡桃木"},featured:false}),
  paving({id:"study-shadow",src:"journal/paving-reference/ref-study-shadow.webp",alt:"书房深色木地板铺装参考",headline:"书房藏静",subline:"深纹收心",roomType:"书房",colorTone:"深胡桃",styleTag:"意式沉稳",pattern:"宽板",mood:"暗场",wood:"黑胡桃",series:"墨系列",summary:"书房需要收心。深色宽板能让桌椅、灯光和书墙沉下来，形成更稳定的工作氛围。",detailPoints:["空间观感：暗场更专注，适合书房会客。","木色建议：深胡桃和烟熏棕都可建立稳定基调。","铺法建议：宽板减少纹理噪音。"],support:["deep","section"],productFilter:{series:"墨系列",wood:"黑胡桃"},featured:false}),
  paving({id:"study-chair",src:"journal/paving-reference/ref-study-chair.webp",alt:"书房椅旁中棕木地板铺装参考",headline:"独坐见光",subline:"小室宜温",roomType:"书房",colorTone:"中棕",styleTag:"自然侘寂",pattern:"通铺长板",mood:"柔光",wood:"橡木",series:"境系列",summary:"小书房不宜过暗。中棕木色保留温度，也能让椅子、边几和自然光有清楚层次。",detailPoints:["空间观感：安静但不沉闷。","木色建议：中棕橡木适合小面积书房。","铺法建议：顺窗光铺设，纹理更自然。"],support:["oakBrown","maintenance"],productFilter:{series:"境系列",wood:"橡木"},featured:false}),
  paving({id:"tea-room-dark",src:"journal/paving-reference/ref-tea-room-dark.webp",alt:"暗场茶室木地板铺装参考",headline:"茶室留白",subline:"温木承器",roomType:"茶室",colorTone:"深胡桃",styleTag:"东方静奢",pattern:"宽板",mood:"暗场",wood:"胡桃木",series:"森系列",summary:"茶室看重器物、坐卧和光影。深木色承住空间，让留白更安稳，也让茶席更有分量。",detailPoints:["空间观感：静、暗、适合器物陈设。","木色建议：深胡桃或暖棕色能承接茶席。","铺法建议：宽板减少接缝，坐卧更安定。"],support:["deep","oil"],productFilter:{series:"森系列",wood:"胡桃木"},featured:false}),
  paving({id:"tatami-light",src:"journal/paving-reference/ref-tatami-light.webp",alt:"和室浅木地板铺装参考",headline:"和室明净",subline:"浅木留白",roomType:"茶室",colorTone:"浅木",styleTag:"东方静奢",pattern:"通铺长板",mood:"明亮",wood:"橡木",series:"悦系列",summary:"浅木和室更轻，也更适合自然光。地面不要过多色差，才能让榻、席与墙面保持宁静。",detailPoints:["空间观感：明净、克制，适合和室。","木色建议：低色差浅木最稳妥。","铺法建议：沿主光线通铺，减少视觉断点。"],support:["oakLight","section"],productFilter:{series:"悦系列",wood:"橡木"},featured:false}),
  paving({id:"japanese-quiet",src:"journal/paving-reference/ref-japanese-quiet.webp",alt:"日式静室原木地板铺装参考",headline:"静室素木",subline:"素色见雅",roomType:"茶室",colorTone:"原木",styleTag:"自然侘寂",pattern:"宽板",mood:"沉静",wood:"欧橡",series:"森系列",summary:"素木空间要控制装饰。原木地面与障子、坐垫、矮桌共处时，越克制越耐看。",detailPoints:["空间观感：素、静、适合低家具。","木色建议：原木色保持自然呼吸感。","铺法建议：宽板配留白，空间更沉稳。"],support:["oakNatural","maintenance"],productFilter:{series:"森系列",wood:"欧橡"},featured:false}),
  paving({id:"entry-slats",src:"journal/paving-reference/ref-entry-slats.webp",alt:"玄关木格栅与木地板铺装参考",headline:"玄关定序",subline:"入门见木",roomType:"玄关",colorTone:"原木",styleTag:"东方静奢",pattern:"木作一体",mood:"温润",wood:"橡木",series:"境系列",summary:"玄关是家的第一步。墙面格栅与地板同色时，入户秩序更清楚，也能弱化门厅的零碎感。",detailPoints:["空间观感：入户即见秩序。","木色建议：墙地同色，材质更统一。","铺法建议：收边与踢脚线要提前规划。"],support:["oakNatural","skirting"],productFilter:{series:"境系列",wood:"橡木"},featured:false}),
  paving({id:"corridor-wood",src:"journal/paving-reference/ref-corridor-wood.webp",alt:"走廊木地板通铺参考",headline:"廊道引光",subline:"一线入室",roomType:"玄关",colorTone:"中棕",styleTag:"现代极简",pattern:"通铺长板",mood:"柔光",wood:"橡木",series:"境系列",summary:"走廊更需要方向感。长板顺廊道铺设，能把光、门洞和动线拉成一条安静轴线。",detailPoints:["空间观感：长廊更有引导性。","木色建议：中棕橡木耐看，也更适合高频通行。","铺法建议：顺长边通铺，门口收边要简洁。"],support:["oakBrown","skirting"],productFilter:{series:"境系列",wood:"橡木"},featured:false}),
  paving({id:"hall-open",src:"journal/paving-reference/ref-hall-open.webp",alt:"开敞玄关客厅浅木地板铺装参考",headline:"入户开阔",subline:"浅木展厅",roomType:"玄关",colorTone:"浅木",styleTag:"现代极简",pattern:"宽板",mood:"明亮",wood:"白蜡木",series:"悦系列",summary:"开敞入户适合浅木宽板。它能让玄关与客厅自然衔接，减少空间转换时的突兀。",detailPoints:["空间观感：入户明亮，视线舒展。","木色建议：浅木或白蜡木更显开阔。","铺法建议：宽板减少入口接缝。"],support:["oakLight","section"],productFilter:{series:"悦系列",wood:"白蜡木"},featured:false}),
  paving({id:"stairs-open",src:"journal/paving-reference/ref-stairs-open.webp",alt:"楼梯与客厅木地板铺装参考",headline:"楼梯成景",subline:"上下同序",roomType:"楼梯",colorTone:"原木",styleTag:"东方静奢",pattern:"木作一体",mood:"明亮",wood:"欧橡",series:"森系列",summary:"楼梯不是附属空间。踏步、地面与扶手色阶统一，才能让上下层关系自然连成一体。",detailPoints:["空间观感：楼梯成为空间主体。","木色建议：原木色适合上下层连贯。","铺法建议：踏步收口需与地板系统一起定。"],support:["nosing","section"],productFilter:{series:"森系列",wood:"欧橡"},featured:false}),
  paving({id:"stairs-silent",src:"journal/paving-reference/ref-stairs-silent.webp",alt:"楼梯过道浅木地板铺装参考",headline:"梯间留白",subline:"转折见净",roomType:"楼梯",colorTone:"浅木",styleTag:"现代极简",pattern:"通铺长板",mood:"明亮",wood:"橡木",series:"悦系列",summary:"楼梯转角容易显乱。浅木色配白墙能降低压迫，让上下层转换更轻。",detailPoints:["空间观感：清爽、轻盈，适合小楼梯间。","木色建议：浅橡木减少转角压迫感。","铺法建议：转角处预先规划收边。"],support:["oakLight","nosing"],productFilter:{series:"悦系列",wood:"橡木"},featured:false}),
  paving({id:"gallery-library",src:"journal/paving-reference/ref-gallery-library.webp",alt:"展厅木地板与书墙空间参考",headline:"展厅藏木",subline:"材料成景",roomType:"展厅",colorTone:"中棕",styleTag:"商业雅奢",pattern:"宽板",mood:"沉静",wood:"橡木",series:"境系列",summary:"展厅需要让材料被看见。中棕地面能承接样板、书墙和灯光，更容易建立清晰的材质判断。",detailPoints:["空间观感：专业、稳重，适合材料展厅。","木色建议：中棕色不抢展陈。","铺法建议：宽板更能展示纹理尺度。"],support:["oakBrown","section"],productFilter:{series:"境系列",wood:"橡木"},featured:false}),
  paving({id:"showroom-wide",src:"journal/paving-reference/ref-showroom-wide.webp",alt:"展厅大面积木地板铺装参考",headline:"展厅尺度",subline:"一木成场",roomType:"展厅",colorTone:"中棕",styleTag:"商业雅奢",pattern:"通铺长板",mood:"暗场",wood:"胡桃木",series:"森系列",summary:"大面积展厅最怕材料零散。中棕通铺能把灯光、人流和展示系统统摄在同一秩序里。",detailPoints:["空间观感：尺度清楚，场域稳定。","木色建议：中棕或暖棕适合展陈空间。","铺法建议：长向通铺，强调场地纵深。"],support:["warm","maintenance"],productFilter:{series:"森系列",wood:"胡桃木"},featured:false}),
  paving({id:"atelier-commercial",src:"journal/paving-reference/ref-atelier-commercial.webp",alt:"商业木作展厅铺装参考",headline:"商空有骨",subline:"以木立面",roomType:"商业空间",colorTone:"深胡桃",styleTag:"商业雅奢",pattern:"木作一体",mood:"暗场",wood:"黑胡桃",series:"墨系列",summary:"商业空间需要识别度。深木色地面与木作墙面同场时，品牌气质更稳，也更有记忆点。",detailPoints:["空间观感：稳、重、有品牌识别。","木色建议：深木色适合高端商业与会所。","铺法建议：墙地一体时控制色阶，避免压暗。"],support:["deep","section"],productFilter:{series:"墨系列",wood:"黑胡桃"},featured:false}),
  paving({id:"lounge-gray",src:"journal/paving-reference/ref-lounge-gray.webp",alt:"烟熏灰休闲空间地板铺装参考",headline:"灰调会客",subline:"冷静有度",roomType:"商业空间",colorTone:"烟熏灰",styleTag:"意式沉稳",pattern:"宽板",mood:"沉静",wood:"橡木",series:"墨系列",summary:"烟熏灰适合现代会所、办公会客和低饱和软装。它比深棕更冷静，也更适合金属与石材。",detailPoints:["空间观感：冷静、现代、适合商业会客。","木色建议：烟熏灰橡木适合低饱和空间。","铺法建议：宽板减少拼接感，质感更完整。"],support:["smoke","oil"],productFilter:{series:"墨系列",wood:"橡木"},featured:false}),
  paving({id:"retail-floor",src:"journal/paving-reference/ref-retail-floor.webp",alt:"商业零售空间木地板铺装参考",headline:"店面有温",subline:"木色留客",roomType:"商业空间",colorTone:"原木",styleTag:"商业雅奢",pattern:"通铺长板",mood:"明亮",wood:"欧橡",series:"境系列",summary:"零售空间需要亲近感。原木色能降低商业空间的冷硬，让顾客停留更自然。",detailPoints:["空间观感：明亮、有温度，适合零售与展示。","木色建议：原木色兼顾亲近与耐看。","铺法建议：通铺让客流动线更清楚。"],support:["oakNatural","maintenance"],productFilter:{series:"境系列",wood:"欧橡"},featured:false}),
  paving({id:"herringbone-tv",src:"journal/paving-reference/ref-herringbone-tv.webp",alt:"电视墙人字拼木地板铺装参考",headline:"人字成厅",subline:"纹理有礼",roomType:"客厅",colorTone:"中棕",styleTag:"东方静奢",pattern:"人字拼",mood:"温润",wood:"橡木",series:"境系列",summary:"人字拼让客厅更有仪式感。适合电视墙、壁炉和中轴明确的空间，不宜与复杂家具同时抢戏。",detailPoints:["空间观感：有仪式感，适合主厅。","木色建议：中棕橡木最稳，不易显花。","铺法建议：确定主轴线后再排版。"],support:["oakBrown","section"],productFilter:{series:"境系列",wood:"橡木"},featured:false}),
  paving({id:"herringbone-light",src:"journal/paving-reference/ref-herringbone-light.webp",alt:"浅色人字拼木地板铺装参考",headline:"浅拼见光",subline:"轻纹有序",roomType:"客厅",colorTone:"浅木",styleTag:"现代极简",pattern:"人字拼",mood:"明亮",wood:"橡木",series:"悦系列",summary:"浅色人字拼比深色更轻，适合窗边、阳台和小面积客厅。纹理有变化，但不压空间。",detailPoints:["空间观感：轻盈、有节奏。","木色建议：浅橡木适合小空间人字拼。","铺法建议：控制边角收口，避免线条凌乱。"],support:["oakLight","skirting"],productFilter:{series:"悦系列",wood:"橡木"},featured:false}),
  paving({id:"herringbone-dining",src:"journal/paving-reference/ref-herringbone-dining.webp",alt:"餐厅鱼骨拼木地板铺装参考",headline:"鱼骨入席",subline:"餐区有章",roomType:"餐厨",colorTone:"原木",styleTag:"意式沉稳",pattern:"鱼骨拼",mood:"温润",wood:"橡木",series:"境系列",summary:"鱼骨拼适合餐厅和会客区，能在不增加家具的前提下建立装饰秩序。木色越克制越高级。",detailPoints:["空间观感：精致、稳定，有装饰性。","木色建议：原木或中棕更耐看。","铺法建议：适合局部重点空间，不宜全屋复杂化。"],support:["oakNatural","section"],productFilter:{series:"境系列",wood:"橡木"},featured:false}),
  paving({id:"gray-corridor",src:"journal/paving-reference/ref-gray-corridor.webp",alt:"烟熏灰走廊木地板铺装参考",headline:"灰木入廊",subline:"冷静延伸",roomType:"玄关",colorTone:"烟熏灰",styleTag:"现代极简",pattern:"通铺长板",mood:"沉静",wood:"橡木",series:"墨系列",summary:"烟熏灰在走廊里能形成克制的延伸感。适合黑白灰墙面、金属柜体和现代户型。",detailPoints:["空间观感：冷静、利落，适合现代走廊。","木色建议：烟熏灰避免过红过黄。","铺法建议：顺廊道铺设，拉长空间。"],support:["smoke","skirting"],productFilter:{series:"墨系列",wood:"橡木"},featured:false}),
  paving({id:"wide-board-house",src:"journal/paving-reference/ref-wide-board-house.webp",alt:"大宅宽板木地板铺装参考",headline:"宽板成宅",subline:"少线见阔",roomType:"客厅",colorTone:"原木",styleTag:"自然侘寂",pattern:"宽板",mood:"明亮",wood:"欧橡",series:"森系列",summary:"宽板适合大宅与高开间空间。接缝少，纹理完整，更能表现木材本身的尺度。",detailPoints:["空间观感：宽阔、自然，适合大面积空间。","木色建议：欧橡宽板更能呈现自然纹理。","铺法建议：留足伸缩缝，配合专业收边。"],support:["oakNatural","section"],productFilter:{series:"森系列",wood:"欧橡"},featured:false}),
  paving({id:"plank-sun",src:"journal/paving-reference/ref-plank-sun.webp",alt:"阳光下木地板纹理铺装参考",headline:"日光见纹",subline:"光照验色",roomType:"书房",colorTone:"原木",styleTag:"自然侘寂",pattern:"通铺长板",mood:"柔光",wood:"橡木",series:"悦系列",summary:"选木色不能只看样板。日光下的纹理、反光和色温，才更接近真实居住感受。",detailPoints:["空间观感：柔光下纹理更真实。","木色建议：原木色需现场看光照变化。","铺法建议：顺光铺设可让纹理更自然。"],support:["oakNatural","maintenance"],productFilter:{series:"悦系列",wood:"橡木"},featured:false}),
  paving({id:"dark-tea",src:"journal/paving-reference/ref-dark-tea.webp",alt:"暗场茶室深色木地板铺装参考",headline:"暗室有光",subline:"深木映器",roomType:"茶室",colorTone:"深胡桃",styleTag:"东方静奢",pattern:"木作一体",mood:"暗场",wood:"黑胡桃",series:"墨系列",summary:"暗场茶室以少量光线见材质。深木色能让器物和墙面更安定，适合私宴、茶室与会所。",detailPoints:["空间观感：暗场、私密、适合器物陈设。","木色建议：深胡桃与烟熏色更有包裹感。","铺法建议：墙地木作需统一色阶。"],support:["deep","oil"],productFilter:{series:"墨系列",wood:"黑胡桃"},featured:false})
];

var CASE_FILTER_DEFS=[
  {key:"roomType",label:"房间类型",all:"全部空间",options:["全部空间","客厅","餐厨","卧室","书房","茶室","玄关","楼梯","展厅","商业空间"]},
  {key:"colorTone",label:"木色",all:"全部木色",options:["全部木色","浅木","原木","中棕","深胡桃","烟熏灰"]},
  {key:"styleTag",label:"风格",all:"全部风格",options:["全部风格","现代极简","东方静奢","自然侘寂","意式沉稳","商业雅奢"]},
  {key:"pattern",label:"铺法",all:"全部铺法",options:["全部铺法","通铺长板","人字拼","鱼骨拼","宽板","木作一体"]},
  {key:"mood",label:"氛围",all:"全部氛围",options:["全部氛围","明亮","柔光","暗场","温润","沉静"]}
];

var PRODUCTS=[], currentProd=null, COS_BASE='https://woodall-1307516706.cos.ap-guangzhou.myqcloud.com/';
var productsLoadPromise=null;

function mapProductData(data){
  return data.map(function(p){
    function fixPath(path){
      if(!path)return'';
      if(path.indexOf('product-images-thumb/')===0)return'./'+path;
      if(path.indexOf('product-images/')===0)return path.replace('product-images/','./product-images-thumb/');
      return path;
    }
    var swatchSample=getProductSwatchSample(p.code);
    var mapReady=!!(swatchSample&&PRODUCT_SWATCH_MAP_READY[p.code]);
    return {
      code:p.code,wood:p.wood,board:p.board,surface:p.surface,structure:p.structure,spec:p.spec,thickness:p.thickness,width:p.width,length:p.length,base:p.base,grade:p.grade,series:p.series,
      img_b_thumb:fixPath(p.img_b),
      img_e_thumb:fixPath(p.img_e),
      img_b_hd:p.img_b?COS_BASE+'product-images/'+p.img_b.replace(/^.*[\\/]/,''):'',
      img_e_hd:p.img_e?COS_BASE+'product-images/'+p.img_e.replace(/^.*[\\/]/,''):'',
      swatch_thumb:swatchSample?swatchSample.swatch:'',
      texture_thumb:swatchSample?swatchSample.texture:'',
      scene_thumb:swatchSample?swatchSample.scene:'',
      map_thumb:mapReady?'product-assets/swatch-wall/'+p.code+'-map-card.webp':'',
      map_full:mapReady?'product-assets/swatch-wall/'+p.code+'-map.webp':'',
      tone:swatchSample?swatchSample.tone:'',
      swatch_note:swatchSample?swatchSample.note:'',
      swatch_accent:swatchSample?swatchSample.accent:''
    };
  });
}

function showProductDataError(e){
  console.error('Product data load failed', e);
  var grid=document.getElementById("prodGrid");
  if(grid)grid.innerHTML='<div class="prod-empty"><span>LOAD FAILED</span><h3>产品资料暂时没有加载完成</h3><p>请重新加载，或直接联系顾问获取产品资料。</p><div class="page-cta"><a href="#contact" class="btn-primary">联系顾问</a></div></div>';
}

function ensureProductsLoaded(callback){
  if(PRODUCTS.length){
    if(callback) window.setTimeout(callback,0);
    return Promise.resolve(PRODUCTS);
  }
  if(!productsLoadPromise){
    productsLoadPromise=fetch('./products_clean.json')
      .then(function(r){return r.json()})
      .then(function(data){
        PRODUCTS=mapProductData(data);
        currentProd=currentProd||PRODUCTS[0]||null;
        return PRODUCTS;
      })
      .catch(function(e){
        productsLoadPromise=null;
        showProductDataError(e);
        return [];
      });
  }
  if(callback){
    productsLoadPromise.then(function(){
      if(PRODUCTS.length) callback();
    });
  }
  return productsLoadPromise;
}
var activeFilters={series:"全部",wood:"全部",board:"全部",surface:"全部",structure:"全部"};
var PRODUCT_FILTER_LABELS={series:"系列",wood:"木种",board:"板材",surface:"表面",structure:"结构"};
var productsInitialized=false;
var activeSeriesKey=null;
var pendingSeriesKey=null;
var activeCaseFilters={
  roomType:"全部空间",
  colorTone:"全部木色",
  styleTag:"全部风格",
  pattern:"全部铺法",
  mood:"全部氛围"
};
var caseAdvancedOpen=false;
var PAVING_SELECTION_STORAGE="woodallPavingSelection";
var PRODUCT_SELECTION_STORAGE="woodallProductSelection";
var productRenderToken=0;
var productSwatchWallReady=false;
var PRODUCT_SWATCH_SAMPLES=[
  {code:"A9-B701",tone:"浅木",note:"浅白蜡木 / 中独幅",swatch:"product-assets/swatch-wall/A9-B701-swatch.webp",texture:"product-assets/swatch-wall/A9-B701-texture.webp",scene:"product-assets/swatch-wall/A9-B701-scene.webp",accent:"#b39c83"},
  {code:"A9-X301",tone:"原木",note:"橡木 / 鱼骨拼",swatch:"product-assets/swatch-wall/A9-X301-swatch.webp",texture:"product-assets/swatch-wall/A9-X301-texture.webp",scene:"product-assets/swatch-wall/A9-X301-scene.webp",accent:"#ac9a7e"},
  {code:"A9-H501",tone:"深胡桃",note:"黑胡桃 / 人字拼",swatch:"product-assets/swatch-wall/A9-H501-swatch.webp",texture:"product-assets/swatch-wall/A9-H501-texture.webp",scene:"product-assets/swatch-wall/A9-H501-scene.webp",accent:"#5e4e42"},
  {code:"A3-B805",tone:"灰浅木",note:"欧洲梣木 / 大独幅",swatch:"product-assets/swatch-wall/A3-B805-swatch.webp",texture:"product-assets/swatch-wall/A3-B805-texture.webp",scene:"product-assets/swatch-wall/A3-B805-scene.webp",accent:"#87806f"},
  {code:"Q9-X503",tone:"浅木",note:"橡木 / 人字拼",swatch:"product-assets/swatch-wall/Q9-X503-swatch.webp",texture:"product-assets/swatch-wall/Q9-X503-texture.webp",scene:"product-assets/swatch-wall/Q9-X503-scene.webp",accent:"#75644a"},
  {code:"Q9-H501",tone:"深胡桃",note:"黑胡桃 / 人字拼",swatch:"product-assets/swatch-wall/Q9-H501-swatch.webp",texture:"product-assets/swatch-wall/Q9-H501-texture.webp",scene:"product-assets/swatch-wall/Q9-H501-scene.webp",accent:"#554538"},
  {code:"Q3-X802",tone:"暖原木",note:"橡木 / 大独幅",swatch:"product-assets/swatch-wall/Q3-X802-swatch.webp",texture:"product-assets/swatch-wall/Q3-X802-texture.webp",scene:"product-assets/swatch-wall/Q3-X802-scene.webp",accent:"#7a6453"},
  {code:"M9-B701",tone:"烟熏灰",note:"白蜡木 / 墨系列",swatch:"product-assets/swatch-wall/M9-B701-swatch.webp",texture:"product-assets/swatch-wall/M9-B701-texture.webp",scene:"product-assets/swatch-wall/M9-B701-scene.webp",accent:"#875e46"},
  {code:"M9-B710",tone:"深灰木",note:"白蜡木 / 墨系列",swatch:"product-assets/swatch-wall/M9-B710-swatch.webp",texture:"product-assets/swatch-wall/M9-B710-texture.webp",scene:"product-assets/swatch-wall/M9-B710-scene.webp",accent:"#8a8786"},
  {code:"B9-B704",tone:"暖浅木",note:"白蜡木 / 中独幅",swatch:"product-assets/swatch-wall/B9-B704-swatch.webp",texture:"product-assets/swatch-wall/B9-B704-texture.webp",scene:"product-assets/swatch-wall/B9-B704-scene.webp",accent:"#9d8e77"},
  {code:"B9-B705",tone:"中棕",note:"白蜡木 / 中独幅",swatch:"product-assets/swatch-wall/B9-B705-swatch.webp",texture:"product-assets/swatch-wall/B9-B705-texture.webp",scene:"product-assets/swatch-wall/B9-B705-scene.webp",accent:"#c3ab80"},
  {code:"B3-X809",tone:"自然橡木",note:"欧橡 / 大独幅",swatch:"product-assets/swatch-wall/B3-X809-swatch.webp",texture:"product-assets/swatch-wall/B3-X809-texture.webp",scene:"product-assets/swatch-wall/B3-X809-scene.webp",accent:"#a99072"}
];
var PRODUCT_SWATCH_MAP_READY={
  "A9-B701":true,
  "A3-B805":true,
  "Q9-H501":true,
  "Q3-X802":true,
  "B9-B704":true,
  "B9-B705":true,
  "B3-X809":true
};

var PRODUCT_SWATCH_SECOND_BATCH=[
  {code:"A3-B806",tone:"\u6df1\u7070\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A3-B806-map-chip.webp",texture:"product-assets/swatch-wall/A3-B806-map-card.webp",scene:"",accent:"#4f483f"},
  {code:"A3-B807",tone:"\u6df1\u7070\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A3-B807-map-chip.webp",texture:"product-assets/swatch-wall/A3-B807-map-card.webp",scene:"",accent:"#3f372d"},
  {code:"A3-B808",tone:"\u7070\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A3-B808-map-chip.webp",texture:"product-assets/swatch-wall/A3-B808-map-card.webp",scene:"",accent:"#82765e"},
  {code:"A3-B810",tone:"\u7070\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A3-B810-map-chip.webp",texture:"product-assets/swatch-wall/A3-B810-map-card.webp",scene:"",accent:"#5c5546"},
  {code:"A9-B501",tone:"\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B501-map-chip.webp",texture:"product-assets/swatch-wall/A9-B501-map-card.webp",scene:"",accent:"#c5a985"},
  {code:"A9-B503",tone:"\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B503-map-chip.webp",texture:"product-assets/swatch-wall/A9-B503-map-card.webp",scene:"",accent:"#ac9274"},
  {code:"A9-B506",tone:"\u4e2d\u68d5",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B506-map-chip.webp",texture:"product-assets/swatch-wall/A9-B506-map-card.webp",scene:"",accent:"#896d56"},
  {code:"A9-B507",tone:"\u6696\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B507-map-chip.webp",texture:"product-assets/swatch-wall/A9-B507-map-card.webp",scene:"",accent:"#bea27f"},
  {code:"A9-B508",tone:"\u4e2d\u68d5",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B508-map-chip.webp",texture:"product-assets/swatch-wall/A9-B508-map-card.webp",scene:"",accent:"#a08b6b"},
  {code:"A9-B703",tone:"\u6696\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B703-map-chip.webp",texture:"product-assets/swatch-wall/A9-B703-map-card.webp",scene:"",accent:"#b8a595"},
  {code:"A9-B704",tone:"\u6696\u539f\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B704-map-chip.webp",texture:"product-assets/swatch-wall/A9-B704-map-card.webp",scene:"",accent:"#a08c7f"},
  {code:"A9-B705",tone:"\u7070\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B705-map-chip.webp",texture:"product-assets/swatch-wall/A9-B705-map-card.webp",scene:"",accent:"#a09696"},
  {code:"A9-B706",tone:"\u6696\u539f\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B706-map-chip.webp",texture:"product-assets/swatch-wall/A9-B706-map-card.webp",scene:"",accent:"#84736e"},
  {code:"A9-B707",tone:"\u6df1\u80e1\u6843",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B707-map-chip.webp",texture:"product-assets/swatch-wall/A9-B707-map-card.webp",scene:"",accent:"#74625a"},
  {code:"A9-B708",tone:"\u6696\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B708-map-chip.webp",texture:"product-assets/swatch-wall/A9-B708-map-card.webp",scene:"",accent:"#b89c83"},
  {code:"A9-B709",tone:"\u7070\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B709-map-chip.webp",texture:"product-assets/swatch-wall/A9-B709-map-card.webp",scene:"",accent:"#858175"},
  {code:"A9-B710",tone:"\u7070\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-B710-map-chip.webp",texture:"product-assets/swatch-wall/A9-B710-map-card.webp",scene:"",accent:"#8b7f6a"}
];

PRODUCT_SWATCH_SECOND_BATCH.forEach(function(sample){
  PRODUCT_SWATCH_SAMPLES.push(sample);
  PRODUCT_SWATCH_MAP_READY[sample.code]=true;
});

PRODUCT_SWATCH_MAP_READY["M9-B701"]=true;

var PRODUCT_SWATCH_THIRD_BATCH=[
  {code:"A9-X507",tone:"\u6696\u539f\u6728",note:"\u4eba\u5b57\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-X507-map-chip.webp",texture:"product-assets/swatch-wall/A9-X507-map-card.webp",scene:"",accent:"#715a44"},
  {code:"A9-X508",tone:"\u6df1\u7070\u6728",note:"\u4eba\u5b57\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/A9-X508-map-chip.webp",texture:"product-assets/swatch-wall/A9-X508-map-card.webp",scene:"",accent:"#393837"},
  {code:"Q3-H801",tone:"\u4e2d\u68d5",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q3-H801-map-chip.webp",texture:"product-assets/swatch-wall/Q3-H801-map-card.webp",scene:"",accent:"#aa8166"},
  {code:"Q3-X501",tone:"\u6d45\u6728",note:"\u4eba\u5b57\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q3-X501-map-chip.webp",texture:"product-assets/swatch-wall/Q3-X501-map-card.webp",scene:"",accent:"#c4aa85"},
  {code:"Q3-X502",tone:"\u6df1\u7070\u6728",note:"\u4eba\u5b57\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q3-X502-map-chip.webp",texture:"product-assets/swatch-wall/Q3-X502-map-card.webp",scene:"",accent:"#585852"},
  {code:"Q3-X503",tone:"\u7070\u6d45\u6728",note:"\u4eba\u5b57\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q3-X503-map-chip.webp",texture:"product-assets/swatch-wall/Q3-X503-map-card.webp",scene:"",accent:"#877b6a"},
  {code:"Q3-X504",tone:"\u6696\u6d45\u6728",note:"\u4eba\u5b57\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q3-X504-map-chip.webp",texture:"product-assets/swatch-wall/Q3-X504-map-card.webp",scene:"",accent:"#ac8965"},
  {code:"Q3-X505",tone:"\u6df1\u7070\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q3-X505-map-chip.webp",texture:"product-assets/swatch-wall/Q3-X505-map-card.webp",scene:"",accent:"#363a3d"},
  {code:"Q3-X801",tone:"\u7070\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q3-X801-map-chip.webp",texture:"product-assets/swatch-wall/Q3-X801-map-card.webp",scene:"",accent:"#ae9f8a"},
  {code:"Q3-X803",tone:"\u4e2d\u68d5",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q3-X803-map-chip.webp",texture:"product-assets/swatch-wall/Q3-X803-map-card.webp",scene:"",accent:"#88664e"},
  {code:"Q3-X804",tone:"\u6df1\u80e1\u6843",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q3-X804-map-chip.webp",texture:"product-assets/swatch-wall/Q3-X804-map-card.webp",scene:"",accent:"#57493e"},
  {code:"Q9-H301",tone:"\u4e2d\u68d5",note:"\u4eba\u5b57\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q9-H301-map-chip.webp",texture:"product-assets/swatch-wall/Q9-H301-map-card.webp",scene:"",accent:"#775240"},
  {code:"Q9-H504",tone:"\u4e2d\u68d5",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q9-H504-map-chip.webp",texture:"product-assets/swatch-wall/Q9-H504-map-card.webp",scene:"",accent:"#926444"},
  {code:"Q9-H801",tone:"\u6df1\u80e1\u6843",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q9-H801-map-chip.webp",texture:"product-assets/swatch-wall/Q9-H801-map-card.webp",scene:"",accent:"#462a1b"},
  {code:"Q9-X801",tone:"\u6696\u539f\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q9-X801-map-chip.webp",texture:"product-assets/swatch-wall/Q9-X801-map-card.webp",scene:"",accent:"#7f6752"},
  {code:"Q9-X803",tone:"\u4e2d\u68d5",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q9-X803-map-chip.webp",texture:"product-assets/swatch-wall/Q9-X803-map-card.webp",scene:"",accent:"#8b7a6c"},
  {code:"Q9-X804",tone:"\u4e2d\u68d5",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q9-X804-map-chip.webp",texture:"product-assets/swatch-wall/Q9-X804-map-card.webp",scene:"",accent:"#765d4b"},
  {code:"Q9-X809",tone:"\u6df1\u7070\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q9-X809-map-chip.webp",texture:"product-assets/swatch-wall/Q9-X809-map-card.webp",scene:"",accent:"#52514d"},
  {code:"Q9-X818",tone:"\u6696\u6d45\u6728",note:"\u5e73\u9762\u7eb9\u7406\u8d34\u56fe",swatch:"product-assets/swatch-wall/Q9-X818-map-chip.webp",texture:"product-assets/swatch-wall/Q9-X818-map-card.webp",scene:"",accent:"#b1875f"}
];

PRODUCT_SWATCH_THIRD_BATCH.forEach(function(sample){
  PRODUCT_SWATCH_SAMPLES.push(sample);
  PRODUCT_SWATCH_MAP_READY[sample.code]=true;
});

function getProductSwatchSample(code){
  for(var i=0;i<PRODUCT_SWATCH_SAMPLES.length;i++){
    if(PRODUCT_SWATCH_SAMPLES[i].code===code)return PRODUCT_SWATCH_SAMPLES[i];
  }
  return null;
}

function countProductsBySeries(series){
  return PRODUCTS.filter(function(p){return p.series===series||p.series.indexOf(series)===0}).length;
}

function getIntroSeriesKey(series){
  if(!series)return series;
  if(typeof seriesData!=="undefined"&&seriesData[series])return series;
  var shortName=series.replace(/[（(].*?[）)]/g,"");
  if(typeof seriesData!=="undefined"&&seriesData[shortName])return shortName;
  if(typeof seriesData!=="undefined"){
    var keys=Object.keys(seriesData);
    for(var i=0;i<keys.length;i++){
      if(series.indexOf(keys[i])===0)return keys[i];
    }
  }
  return shortName||series;
}

function getProductSeriesValue(series){
  if(!series||series==="全部")return "全部";
  var exact=PRODUCTS.find(function(p){return p.series===series});
  if(exact)return series;
  var matched=PRODUCTS.find(function(p){return p.series&&p.series.indexOf(series)===0});
  return matched?matched.series:"全部";
}

function getDisplayFilterLabel(group,value){
  if(group==="series"&&value!=="全部")return value.replace(/[（(].*?[）)]/g,"");
  return value;
}

function findProductByCode(code){
  for(var i=0;i<PRODUCTS.length;i++){
    if(PRODUCTS[i].code===code)return PRODUCTS[i];
  }
  return null;
}

function getSwatchWallItems(){
  return PRODUCT_SWATCH_SAMPLES.map(function(sample){
    var product=findProductByCode(sample.code);
    if(!product||!product.map_thumb)return null;
    return {
      code:sample.code,
      tone:sample.tone,
      note:sample.note,
      accent:sample.accent,
      swatch:sample.swatch,
      texture:sample.texture,
      scene:sample.scene,
      map:product.map_full,
      mapCard:product.map_thumb,
      product:product
    };
  }).filter(Boolean);
}

function getSwatchWallItem(code){
  var items=getSwatchWallItems();
  for(var i=0;i<items.length;i++){
    if(items[i].code===code)return items[i];
  }
  return items[0]||null;
}

function getSwatchTones(items){
  var seen={all:true},tones=["all"];
  items.forEach(function(item){
    if(item.tone&&!seen[item.tone]){
      seen[item.tone]=true;
      tones.push(item.tone);
    }
  });
  return tones;
}

function updateSwatchWallPreview(code){
  var root=document.getElementById("productSwatchWall");
  var item=getSwatchWallItem(code);
  if(!root||!item)return;
  var preview=root.querySelector("[data-swatch-preview]");
  var title=root.querySelector("[data-swatch-preview-title]");
  var meta=root.querySelector("[data-swatch-preview-meta]");
  var copy=root.querySelector("[data-swatch-preview-copy]");
  var open=root.querySelector("[data-swatch-open]");
  root.style.setProperty("--swatch-accent",item.accent||"#b28247");
  root.dataset.activeCode=item.code;
  root.querySelectorAll("[data-swatch-code]").forEach(function(card){
    card.classList.toggle("active",card.getAttribute("data-swatch-code")===item.code);
  });
  if(preview)preview.setAttribute("src",item.map||item.mapCard||item.swatch);
  if(title)title.textContent=item.code;
  if(meta)meta.textContent=getDisplayFilterLabel("series",item.product.series)+" · "+item.tone+" · "+item.product.board;
  if(copy)copy.textContent=item.product.wood+" · "+item.product.surface+" · "+item.note;
  if(open)open.setAttribute("data-swatch-open",item.code);
}

function setSwatchToneFilter(tone){
  var root=document.getElementById("productSwatchWall");
  if(!root)return;
  var visible=0;
  root.querySelectorAll("[data-swatch-tone]").forEach(function(btn){
    var active=btn.getAttribute("data-swatch-tone")===tone;
    btn.classList.toggle("active",active);
    btn.setAttribute("aria-pressed",active?"true":"false");
  });
  root.querySelectorAll("[data-swatch-code]").forEach(function(card){
    var show=tone==="all"||card.getAttribute("data-swatch-card-tone")===tone;
    card.hidden=!show;
    if(show)visible++;
  });
  var count=root.querySelector("[data-swatch-count]");
  if(count)count.textContent=visible+" 款样品";
}

function setSwatchToneGroupFilter(tones,label){
  var root=document.getElementById("productSwatchWall");
  if(!root)return;
  var toneList=(tones||[]).filter(Boolean);
  var visible=0,firstCode="";
  root.querySelectorAll("[data-swatch-tone]").forEach(function(btn){
    btn.classList.remove("active");
    btn.setAttribute("aria-pressed","false");
  });
  root.querySelectorAll("[data-swatch-code]").forEach(function(card){
    var show=!toneList.length||toneList.indexOf(card.getAttribute("data-swatch-card-tone"))>=0;
    card.hidden=!show;
    if(show){
      visible++;
      if(!firstCode)firstCode=card.getAttribute("data-swatch-code");
    }
  });
  var count=root.querySelector("[data-swatch-count]");
  if(count)count.textContent=(label?label+" / ":"")+visible+" 款样品";
  if(firstCode)updateSwatchWallPreview(firstCode);
}

function bindProductChoiceGuide(){
  var root=document.getElementById("productChoiceGuide");
  if(!root||root.dataset.bound==="true")return;
  root.dataset.bound="true";
  root.addEventListener("click",function(e){
    var card=e.target.closest&&e.target.closest("[data-choice-label]");
    if(!card)return;
    root.querySelectorAll("[data-choice-label]").forEach(function(item){
      item.classList.toggle("active",item===card);
    });
    var toneString=card.getAttribute("data-choice-tones")||"";
    var board=card.getAttribute("data-choice-board")||"";
    var label=card.getAttribute("data-choice-label")||"";
    if(toneString){
      setSwatchToneGroupFilter(toneString.split(",").map(function(t){return t.trim()}),label);
      var wall=document.getElementById("productSwatchWall");
      if(wall)wall.scrollIntoView({behavior:"smooth",block:"start"});
      return;
    }
    if(board){
      activeFilters.board=board;
      activeFilters.series=activeFilters.series||"全部";
      activeFilters.wood=activeFilters.wood||"全部";
      activeFilters.surface=activeFilters.surface||"全部";
      activeFilters.structure=activeFilters.structure||"全部";
      buildAllFilters();
      buildProds();
      var grid=document.getElementById("prodGrid");
      if(grid)grid.scrollIntoView({behavior:"smooth",block:"start"});
    }
  });
}

function selectProductFromSwatch(code,openDetail){
  var product=findProductByCode(code);
  if(!product)return;
  currentProd=product;
  resetProductFiltersForSeries(product.series);
  buildAllFilters();
  buildProds();
  updateSwatchWallPreview(code);
  if(openDetail){
    openDrawer(product);
    return;
  }
  window.setTimeout(function(){
    var grid=document.getElementById("prodGrid");
    if(grid)grid.scrollIntoView({behavior:"smooth",block:"start"});
  },80);
}

function renderProductSwatchWall(){
  var root=document.getElementById("productSwatchWall");
  if(!root||!PRODUCTS.length)return;
  var items=getSwatchWallItems();
  if(!items.length){
    root.hidden=true;
    return;
  }
  root.hidden=false;
  if(productSwatchWallReady){
    updateSwatchWallPreview(root.dataset.activeCode||items[0].code);
    return;
  }
  productSwatchWallReady=true;
  var tones=getSwatchTones(items);
  var toneButtons=tones.map(function(tone){
    return '<button type="button" class="swatch-tone'+(tone==="all"?" active":"")+'" data-swatch-tone="'+escapeHtml(tone)+'" aria-pressed="'+(tone==="all"?"true":"false")+'">'+(tone==="all"?"全部色卡":escapeHtml(tone))+'</button>';
  }).join("");
  var cards=items.map(function(item){
    return '<button type="button" class="swatch-card" data-swatch-code="'+escapeHtml(item.code)+'" data-swatch-card-tone="'+escapeHtml(item.tone)+'" style="--chip:'+escapeHtml(item.accent)+'" aria-label="查看 '+escapeHtml(item.code)+' 纹理贴图"><img src="'+escapeHtml(item.mapCard||item.swatch)+'" alt="'+escapeHtml(item.code+' '+item.tone+' 木地板纹理贴图')+'" loading="lazy" decoding="async"><span>'+escapeHtml(item.tone)+'</span><strong>'+escapeHtml(item.code)+'</strong><em>'+escapeHtml(getDisplayFilterLabel("series",item.product.series))+'</em></button>';
  }).join("");
  var lead=items[0];
  root.innerHTML='<div class="swatch-wall-copy"><span>PRODUCT TEXTURE MAP</span><h3>从真实纹理里，找到喜欢的木色。</h3><p>比较木色、纹理走向、板缝与铺装尺度，再查看对应产品的木种、结构和规格。</p><div class="swatch-tone-row" role="group" aria-label="按木色筛选样品">'+toneButtons+'</div><small data-swatch-count>'+items.length+' 款可比较样品</small></div><div class="swatch-wall-stage"><figure><img data-swatch-preview src="'+escapeHtml(lead.map||lead.mapCard||lead.swatch)+'" alt="产品纹理贴图预览" loading="lazy" decoding="async"></figure><div class="swatch-wall-stage-copy"><span data-swatch-preview-meta>'+escapeHtml(getDisplayFilterLabel("series",lead.product.series)+" · "+lead.tone+" · "+lead.product.board)+'</span><h4 data-swatch-preview-title>'+escapeHtml(lead.code)+'</h4><p data-swatch-preview-copy>'+escapeHtml(lead.product.wood+" · "+lead.product.surface+" · "+lead.note)+'</p><button type="button" data-swatch-open="'+escapeHtml(lead.code)+'">查看产品详情</button></div></div><div class="swatch-board" aria-label="产品纹理贴图对比">'+cards+'</div>';
  root.addEventListener("click",function(e){
    var toneBtn=e.target.closest&&e.target.closest("[data-swatch-tone]");
    if(toneBtn){
      setSwatchToneFilter(toneBtn.getAttribute("data-swatch-tone"));
      return;
    }
    var openBtn=e.target.closest&&e.target.closest("[data-swatch-open]");
    if(openBtn){
      selectProductFromSwatch(openBtn.getAttribute("data-swatch-open"),true);
      return;
    }
    var card=e.target.closest&&e.target.closest("[data-swatch-code]");
    if(card){
      selectProductFromSwatch(card.getAttribute("data-swatch-code"),false);
    }
  });
  root.addEventListener("mouseover",function(e){
    var card=e.target.closest&&e.target.closest("[data-swatch-code]");
    if(card&&!card.hidden)updateSwatchWallPreview(card.getAttribute("data-swatch-code"));
  });
  root.addEventListener("focusin",function(e){
    var card=e.target.closest&&e.target.closest("[data-swatch-code]");
    if(card&&!card.hidden)updateSwatchWallPreview(card.getAttribute("data-swatch-code"));
  });
  updateSwatchWallPreview(lead.code);
}

function resetProductFiltersForSeries(series){
  activeFilters.series=getProductSeriesValue(series);
  activeFilters.wood="全部";
  activeFilters.board="全部";
  activeFilters.surface="全部";
  activeFilters.structure="全部";
}

function goProductsBySeries(series){
  ensureProductsLoaded(function(){
    closeDrawer();
    resetProductFiltersForSeries(series);
    navigate("#products");
    setTimeout(function(){
      buildAllFilters();
      buildProds();
      var header=document.querySelector(".prod-page-header");
      if(header)header.scrollIntoView({behavior:"smooth",block:"start"});
    },0);
  });
}

function goProductsByWood(wood){
  ensureProductsLoaded(function(){
    closeDrawer();
    activeFilters={series:"全部",wood:wood,board:"全部",surface:"全部",structure:"全部"};
    navigate("#products");
    setTimeout(function(){
      buildAllFilters();
      buildProds();
      var header=document.querySelector(".prod-page-header");
      if(header)header.scrollIntoView({behavior:"smooth",block:"start"});
    },0);
  });
}

function goSeriesIntro(series){
  closeDrawer();
  pendingSeriesKey=getIntroSeriesKey(series);
  navigate("#series");
  setTimeout(function(){
    if(seriesData[series])switchSeries(series);
    var content=document.getElementById("seriesContent");
    if(content)content.scrollIntoView({behavior:"smooth",block:"start"});
  },0);
}

function escapeHtml(value){
  return String(value||"").replace(/[&<>"']/g,function(ch){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
  });
}

function getSpaceById(id){
  return SPACE_MEDIA.find(function(item){return item.id===id});
}

function getCaseFilterDef(key){
  return CASE_FILTER_DEFS.find(function(def){return def.key===key});
}

function isCaseAllValue(key,value){
  var def=getCaseFilterDef(key);
  return !def||value===def.all;
}

function getCaseSelectedFilters(){
  return CASE_FILTER_DEFS.filter(function(def){
    return !isCaseAllValue(def.key,activeCaseFilters[def.key]);
  }).map(function(def){
    return {key:def.key,label:def.label,value:activeCaseFilters[def.key]};
  });
}

function clearCaseFilters(){
  CASE_FILTER_DEFS.forEach(function(def){activeCaseFilters[def.key]=def.all});
  renderCaseFilters();
  renderCaseGallery();
}

function getFilteredSpaceMedia(){
  return SPACE_MEDIA.filter(function(item){
    return CASE_FILTER_DEFS.every(function(def){
      return isCaseAllValue(def.key,activeCaseFilters[def.key])||item[def.key]===activeCaseFilters[def.key];
    });
  });
}

function getFeaturedSpaceMedia(){
  var featured=SPACE_MEDIA.filter(function(item){return item.featured});
  return (featured.length?featured:SPACE_MEDIA).slice(0,8);
}

function getProductSpaceShortcuts(){
  var seen={};
  return SPACE_MEDIA.filter(function(item){
    if(seen[item.roomType])return false;
    seen[item.roomType]=true;
    return true;
  }).slice(0,9);
}

function renderSpaceMedia(item, className){
  var cls=className?className:"";
  if(item.mediaType==="video"){
    return '<video class="'+cls+'" muted playsinline loop preload="metadata" poster="'+escapeHtml(item.poster||"")+'" aria-label="'+escapeHtml(item.alt)+'"><source src="'+escapeHtml(item.src)+'" type="video/mp4"></video>';
  }
  return '<img class="'+cls+'" src="'+escapeHtml(item.src)+'" alt="'+escapeHtml(item.alt)+'" loading="lazy" decoding="async">';
}

function renderCaseSaveIcon(selected){
  var label=selected?"已加入选材夹":"加入选材夹";
  return '<svg class="case-save-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5h2.3l2.1 10.4h8.8l1.8-7.2H7.2"></path><path d="M9.2 19.1h.1"></path><path d="M16.8 19.1h.1"></path></svg><span class="case-save-text">'+label+'</span>';
}

function setCaseSaveButton(btn, selected){
  btn.classList.toggle("selected",selected);
  btn.setAttribute("aria-pressed",selected?"true":"false");
  btn.setAttribute("aria-label",selected?"已加入选材夹，点击移除":"加入选材夹");
  if(btn.classList.contains("case-save-chip")){
    btn.innerHTML=renderCaseSaveIcon(selected);
  }else{
    btn.textContent=selected?"已加入":"加入选材夹";
  }
}

function renderProductSaveIcon(selected){
  var label=selected?"已加入选材夹":"加入选材夹";
  return '<svg class="product-save-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5h2.3l2.1 10.4h8.8l1.8-7.2H7.2"></path><path d="M9.2 19.1h.1"></path><path d="M16.8 19.1h.1"></path></svg><span class="product-save-text">'+label+'</span>';
}

function setProductSaveButton(btn, selected){
  btn.classList.toggle("selected",selected);
  btn.setAttribute("aria-pressed",selected?"true":"false");
  btn.setAttribute("aria-label",selected?"已加入选材夹，点击移除":"加入选材夹");
  if(btn.classList.contains("product-save-chip")){
    btn.innerHTML=renderProductSaveIcon(selected);
  }else{
    btn.textContent=selected?"已加入":"加入选材夹";
  }
}

function playSpaceVideos(scope){
  var root=scope||document;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarseMobile=window.matchMedia&&window.matchMedia('(max-width: 640px)').matches;
  if(reduceMotion||coarseMobile)return;
  root.querySelectorAll('.space-feature-card video, .space-card video, .space-gallery-card video, .space-case-media video').forEach(function(video){
    var attempt=video.play();
    if(attempt&&attempt.catch) attempt.catch(function(){});
  });
}

function renderHomeSpaces(){
  var feature=document.getElementById("homeSpaceFeature");
  var grid=document.getElementById("homeSpaceGrid");
  if(!feature||!grid)return;
  var list=getFeaturedSpaceMedia();
  var lead=list[0];
  feature.innerHTML='<button class="space-feature-card action-card" type="button" data-space-id="'+lead.id+'" aria-label="查看'+escapeHtml(lead.title)+'搭配建议">'+renderSpaceMedia(lead,'space-media')+'<span class="space-image-shade"></span><span class="space-logo-mark" aria-hidden="true"></span><div class="space-feature-copy"><span>'+escapeHtml(lead.roomType)+' / '+escapeHtml(lead.colorTone)+' / '+escapeHtml(lead.pattern)+'</span><h3>'+escapeHtml(lead.title)+'</h3><p>'+escapeHtml(lead.summary)+'</p><em>查看搭配建议</em></div></button>';
  grid.innerHTML=list.slice(1,8).map(function(item){
    return '<button class="space-card action-card" type="button" data-space-id="'+item.id+'" aria-label="查看'+escapeHtml(item.title)+'搭配建议">'+renderSpaceMedia(item,'space-media')+'<span class="space-image-shade"></span><div class="space-card-copy"><span>'+escapeHtml(item.roomType)+' · '+escapeHtml(item.colorTone)+'</span><strong>'+escapeHtml(item.title)+'</strong><em>查看搭配建议</em></div></button>';
  }).join("");
  playSpaceVideos(document.getElementById("homeSpaceSection"));
}

function renderProductSpaceShortcuts(){
  var el=document.getElementById("prodSpaceShortcuts");
  if(!el)return;
  el.innerHTML=getProductSpaceShortcuts().map(function(item){
    return '<button class="space-shortcut" type="button" data-space-id="'+item.id+'" aria-label="按'+escapeHtml(item.roomType)+'筛选产品"><span>'+escapeHtml(item.roomType)+'</span><em>'+escapeHtml(item.colorTone)+' / '+escapeHtml(item.pattern)+'</em></button>';
  }).join("");
}

function renderCaseFilters(){
  var el=document.getElementById("caseSpaceFilters");
  if(!el)return;
  var roomDef=getCaseFilterDef("roomType");
  var selected=getCaseSelectedFilters();
  var advanced=CASE_FILTER_DEFS.filter(function(def){return def.key!=="roomType"});
  el.innerHTML='<div class="case-filter-shell'+(caseAdvancedOpen?' advanced-open':'')+'">'
    +'<div class="case-filter-primary" aria-label="房间类型筛选">'
    +roomDef.options.map(function(option){
      return '<button class="case-filter-tab'+(activeCaseFilters.roomType===option?' active':'')+'" type="button" data-case-filter-key="roomType" data-case-filter-value="'+escapeHtml(option)+'">'+escapeHtml(option)+'</button>';
    }).join("")
    +'</div>'
    +'<div class="case-filter-controls">'
    +'<button class="case-advanced-toggle" type="button" data-case-advanced-toggle aria-expanded="'+(caseAdvancedOpen?'true':'false')+'">高级筛选<span>'+selected.length+'项</span></button>'
    +'<button class="case-clear-filters'+(selected.length?' is-visible':'')+'" type="button" data-case-clear>清除筛选</button>'
    +'</div>'
    +'<div class="case-advanced-panel" aria-label="高级筛选">'
    +advanced.map(function(def){
      return '<div class="case-filter-group"><span>'+escapeHtml(def.label)+'</span><div>'+def.options.map(function(option){
        return '<button class="case-filter-tab small'+(activeCaseFilters[def.key]===option?' active':'')+'" type="button" data-case-filter-key="'+escapeHtml(def.key)+'" data-case-filter-value="'+escapeHtml(option)+'">'+escapeHtml(option)+'</button>';
      }).join("")+'</div></div>';
    }).join("")
    +'</div>'
    +'<div class="case-filter-state">'+(selected.length?selected.map(function(item){return '<span>'+escapeHtml(item.label)+'：'+escapeHtml(item.value)+'</span>';}).join(""):'<span>全部铺装参考</span>')+'</div>'
    +'</div>';
}

function renderCaseGallery(){
  var el=document.getElementById("caseSpaceGallery");
  if(!el)return;
  var list=getFilteredSpaceMedia();
  el.classList.add("is-refreshing");
  window.setTimeout(function(){el.classList.remove("is-refreshing")},180);
  if(!list.length){
    el.innerHTML='<div class="space-gallery-empty"><span>NO MATCH</span><h3>未找到合适参考</h3><p>可清除筛选重新浏览，或直接预约管家按户型、采光与预算推荐。</p><div class="page-cta"><button class="btn-primary" type="button" data-case-clear>清除筛选</button><a href="#contact" class="btn-secondary">预约咨询</a></div></div>';
    return;
  }
  el.innerHTML=list.map(function(item,index){
    var large=index===0&&getCaseSelectedFilters().length===0?" large":"";
    var selected=isPavingSelected(item.id);
    return '<article class="space-gallery-card action-card'+large+'" role="button" tabindex="0" data-space-id="'+item.id+'" aria-label="查看'+escapeHtml(item.title)+'搭配建议">'+renderSpaceMedia(item,'space-media')+'<span class="space-image-shade"></span><span class="space-logo-mark" aria-hidden="true"></span><button class="case-save-chip" type="button" data-case-save="'+escapeHtml(item.id)+'" aria-pressed="'+(selected?"true":"false")+'" aria-label="'+(selected?"已加入选材夹，点击移除":"加入选材夹")+'">'+renderCaseSaveIcon(selected)+'</button><div class="space-gallery-copy"><span>'+escapeHtml(item.roomType)+' · '+escapeHtml(item.colorTone)+' · '+escapeHtml(item.pattern)+'</span><h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.summary)+'</p><em>查看搭配建议</em></div></article>';
  }).join("");
  playSpaceVideos(el);
  updatePavingSelectionUI();
}

function applyProductFilterObject(filter){
  filter=filter||{};
  ensureProductsLoaded(function(){
    activeFilters=resolveProductFilterObject(filter);
    closeSpaceCase();
    navigate("#products");
    setTimeout(function(){
      buildAllFilters();
      buildProds();
      renderProductSpaceShortcuts();
      var header=document.querySelector(".prod-page-header");
      if(header)header.scrollIntoView({behavior:"smooth",block:"start"});
    },0);
  });
}

function getPavingSelection(){
  try{
    var raw=window.localStorage.getItem(PAVING_SELECTION_STORAGE);
    var list=raw?JSON.parse(raw):[];
    return Array.isArray(list)?list.filter(function(id){return !!getSpaceById(id)}):[];
  }catch(e){
    return [];
  }
}

function setPavingSelection(list){
  try{
    window.localStorage.setItem(PAVING_SELECTION_STORAGE,JSON.stringify(list));
  }catch(e){}
  updatePavingSelectionUI();
}

function isPavingSelected(id){
  return getPavingSelection().indexOf(id)>=0;
}

function togglePavingSelection(id){
  var list=getPavingSelection();
  var index=list.indexOf(id);
  if(index>=0) list.splice(index,1);
  else list.push(id);
  setPavingSelection(list);
}

function getProductByCode(code){
  return PRODUCTS.find(function(p){return p.code===code})||null;
}

function getProductSelection(){
  try{
    var raw=window.localStorage.getItem(PRODUCT_SELECTION_STORAGE);
    var list=raw?JSON.parse(raw):[];
    return Array.isArray(list)?list.filter(function(code){return !!getProductByCode(code)}):[];
  }catch(e){
    return [];
  }
}

function setProductSelection(list){
  try{
    window.localStorage.setItem(PRODUCT_SELECTION_STORAGE,JSON.stringify(list));
  }catch(e){}
  updatePavingSelectionUI();
}

function isProductSelected(code){
  return getProductSelection().indexOf(code)>=0;
}

function toggleProductSelection(code){
  var list=getProductSelection();
  var index=list.indexOf(code);
  if(index>=0) list.splice(index,1);
  else list.push(code);
  setProductSelection(list);
}

function getSelectionCount(){
  return getPavingSelection().length+getProductSelection().length;
}

function getPavingSelectionText(){
  var pavingList=getPavingSelection().map(getSpaceById).filter(Boolean);
  var productList=getProductSelection().map(getProductByCode).filter(Boolean);
  if(!pavingList.length&&!productList.length)return "";
  var lines=["痴木堂选材清单"];
  if(productList.length){
    lines.push("");
    lines.push("【产品】");
    productList.forEach(function(p,index){
      lines.push((index+1)+". "+p.code+" / "+p.wood+" / "+p.series+" / "+p.surface+" / "+p.spec);
    });
  }
  if(pavingList.length){
    lines.push("");
    lines.push("【铺装参考】");
    pavingList.forEach(function(item,index){
      lines.push((index+1)+". "+item.title+" / "+item.roomType+" / "+item.colorTone+" / "+item.pattern+" / 推荐："+item.wood+" · "+item.series);
    });
  }
  lines.push("");
  lines.push("我想基于以上产品与参考进一步预约选材。");
  return lines.join("\n");
}

function copyPavingSelection(){
  var text=getPavingSelectionText();
  if(!text){
    navigate("#products");
    return;
  }
  var done=function(){
    document.querySelectorAll("#pavingSelectionButton,[data-copy-selection]").forEach(function(btn){
      btn.classList.add("copied");
      window.setTimeout(function(){btn.classList.remove("copied")},1400);
    });
  };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(done);
  }else{
    done();
  }
}

function updatePavingSelectionUI(){
  var count=document.getElementById("pavingSelectionCount");
  if(count)count.textContent=String(getSelectionCount());
  document.querySelectorAll("[data-case-save]").forEach(function(btn){
    var selected=isPavingSelected(btn.getAttribute("data-case-save"));
    setCaseSaveButton(btn,selected);
  });
  document.querySelectorAll("[data-product-save]").forEach(function(btn){
    var selected=isProductSelected(btn.getAttribute("data-product-save"));
    var card=btn.closest(".pcard");
    if(card)card.classList.toggle("selected",selected);
    setProductSaveButton(btn,selected);
  });
}

function bindPavingSelectionButton(){
  var btn=document.getElementById("pavingSelectionButton");
  if(btn&&!btn.dataset.bound){
    btn.dataset.bound="true";
    btn.addEventListener("click",copyPavingSelection);
  }
  updatePavingSelectionUI();
}

function getPavingCaseCommentary(item){
  var toneText={
    "浅木":"浅木适合承接白墙、亚麻、浅灰与藤编，让空间更松弛，也更容易显大。",
    "原木":"原木色适合搭配棉麻、皮革、浅色石材与暖白灯光，保留自然感而不显粗糙。",
    "中棕":"中棕能压住日常软装的杂色，适合布艺、皮革、石材和木作柜体并置。",
    "深胡桃":"深胡桃适合低饱和墙面、皮革、金属与暖光，空间会更沉静、更有分量。",
    "烟熏灰":"烟熏灰适合黑白灰、金属、石材与现代家具，气质冷静，适合克制型空间。"
  };
  var styleText={
    "现代极简":"减少装饰线条，让地面纹理成为空间里最温和的层次。",
    "东方静奢":"以留白和秩序为主，木色不争夺视线，只把器物与光影托住。",
    "自然侘寂":"保留材料的微差与肌理，让空间看起来更松、更有时间感。",
    "意式沉稳":"用低明度木色建立厚度，适合大体量家具与克制灯光。",
    "商业雅奢":"强调识别度与耐看度，木地面承担空间记忆点，但不过分喧哗。"
  };
  var roomText={
    "客厅":"客厅是家的主尺度，地板宜先定色温，再决定沙发、地毯与墙面关系。",
    "餐厨":"餐厨重在连贯和耐看，地面不宜过碎，便于动线、清洁与视觉统一。",
    "卧室":"卧室需要降低视觉重量，木地板与织物、低床、柔光之间要保持安静。",
    "书房":"书房重在收心，木色和桌椅灯光应形成稳定的工作氛围。",
    "茶室":"茶室看重器物与留白，木地板应托住茶席，不抢主角。",
    "玄关":"玄关是第一眼尺度，木色与收边决定入户秩序。",
    "楼梯":"楼梯要把上下层连成一体，踏步、扶手和地板色阶要统一。",
    "展厅":"展厅要让材料被看见，地板需要承接灯光、样板与人流。",
    "商业空间":"商业空间需要记忆点，木地板要有识别度，也要耐看。"
  };
  return [
    {label:"IMAGE NOTE",title:"木作巧思",text:roomText[item.roomType]||"先看空间尺度、采光和家具体量，再判断木色是否合适。"},
    {label:"SOFT DECOR",title:"软装搭配",text:toneText[item.colorTone]||"软装应顺着木色的冷暖走，少用高饱和跳色，空间更稳。"},
    {label:"STYLE",title:"风格描述",text:styleText[item.styleTag]||"让木色、光线和家具保持同一种语气，空间会更完整。"},
    {label:"PAVING",title:"铺装取向",text:item.pattern+"适合"+item.roomType+"场景；"+(item.detailPoints&&item.detailPoints[2]?String(item.detailPoints[2]).replace(/^铺法建议[:：]/,""):"先确定主视线，再安排铺装方向。")}
  ];
}

function openSpaceCase(id){
  var item=getSpaceById(id);
  var modal=document.getElementById("spaceCaseModal");
  var media=document.getElementById("spaceCaseMedia");
  var copy=document.getElementById("spaceCaseCopy");
  if(!item||!modal||!media||!copy)return;
  media.innerHTML=renderSpaceMedia(item,'space-case-asset')+'<span class="space-image-shade"></span><span class="space-logo-mark" aria-hidden="true"></span>';
  var details=(item.detailPoints||[]).map(function(point){
    var parts=String(point).split("：");
    return '<li><strong>'+escapeHtml(parts.shift()||"建议")+'</strong><span>'+escapeHtml(parts.join("：")||point)+'</span></li>';
  }).join("");
  var commentary=getPavingCaseCommentary(item).map(function(note){
    return '<article><span>'+escapeHtml(note.label)+'</span><strong>'+escapeHtml(note.title)+'</strong><p>'+escapeHtml(note.text)+'</p></article>';
  }).join("");
  copy.innerHTML='<span>PAVING ATLAS / '+escapeHtml(item.roomType)+'</span><h3>'+escapeHtml(item.title)+'</h3><strong class="space-case-subline">'+escapeHtml(item.subline)+'</strong><p>'+escapeHtml(item.summary)+'</p><div class="space-case-tags"><span>'+escapeHtml(item.colorTone)+'</span><span>'+escapeHtml(item.styleTag)+'</span><span>'+escapeHtml(item.pattern)+'</span><span>'+escapeHtml(item.mood)+'</span></div><dl><div><dt>推荐木种</dt><dd>'+escapeHtml(item.wood)+'</dd></div><div><dt>适配系列</dt><dd>'+escapeHtml(item.series)+'</dd></div></dl><div class="space-case-commentary">'+commentary+'</div><ul class="space-case-detail">'+details+'</ul><p class="space-case-disclaimer">空间与铺装效果仅作参考，实际颜色与纹理请以产品样板为准。</p><div class="page-cta"><button class="btn-primary" type="button" data-case-products="'+item.id+'">查看相关产品</button><button class="btn-secondary" type="button" data-case-save="'+item.id+'">'+(isPavingSelected(item.id)?"已加入":"加入选材夹")+'</button><a class="btn-secondary" href="#contact">咨询这套搭配</a></div>';
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("space-case-open");
  updatePavingSelectionUI();
  playSpaceVideos(modal);
}

function closeSpaceCase(){
  var modal=document.getElementById("spaceCaseModal");
  if(!modal)return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("space-case-open");
  modal.querySelectorAll("video").forEach(function(video){video.pause()});
}

function initSpaceExperience(){
  renderHomeSpaces();
  renderProductSpaceShortcuts();
  renderCaseFilters();
  renderCaseGallery();
  bindPavingSelectionButton();
  var closeBtn=document.getElementById("spaceCaseClose");
  var backdrop=document.getElementById("spaceCaseBackdrop");
  if(closeBtn)closeBtn.addEventListener("click",closeSpaceCase);
  if(backdrop)backdrop.addEventListener("click",closeSpaceCase);
  document.addEventListener("click",function(e){
    var shortcut=e.target.closest(".space-shortcut");
    if(shortcut){
      e.preventDefault();
      var shortcutItem=getSpaceById(shortcut.getAttribute("data-space-id"));
      if(shortcutItem)applyProductFilterObject(shortcutItem.productFilter);
      return;
    }
    var tab=e.target.closest("[data-case-filter-key]");
    if(tab){
      var key=tab.getAttribute("data-case-filter-key");
      var value=tab.getAttribute("data-case-filter-value");
      if(key&&value)activeCaseFilters[key]=value;
      renderCaseFilters();
      renderCaseGallery();
      return;
    }
    var advancedToggle=e.target.closest("[data-case-advanced-toggle]");
    if(advancedToggle){
      caseAdvancedOpen=!caseAdvancedOpen;
      renderCaseFilters();
      return;
    }
    if(e.target.closest("[data-case-clear]")){
      clearCaseFilters();
      return;
    }
    var productBtn=e.target.closest("[data-case-products]");
    if(productBtn){
      e.preventDefault();
      var caseItem=getSpaceById(productBtn.getAttribute("data-case-products"));
      if(caseItem)applyProductFilterObject(caseItem.productFilter);
      return;
    }
    var saveBtn=e.target.closest("[data-case-save]");
    if(saveBtn){
      e.preventDefault();
      togglePavingSelection(saveBtn.getAttribute("data-case-save"));
      return;
    }
    var productSaveBtn=e.target.closest("[data-product-save]");
    if(productSaveBtn){
      e.preventDefault();
      toggleProductSelection(productSaveBtn.getAttribute("data-product-save"));
      return;
    }
    if(e.target.closest("[data-copy-selection]")){
      e.preventDefault();
      copyPavingSelection();
      return;
    }
    var caseLink=e.target.closest(".space-case-copy a[href^='#']");
    if(caseLink){
      closeSpaceCase();
      return;
    }
    var mediaCard=e.target.closest("[data-space-id]");
    if(mediaCard){
      e.preventDefault();
      openSpaceCase(mediaCard.getAttribute("data-space-id"));
    }
  });
  document.addEventListener("keydown",function(e){
    if(e.key!=="Enter"&&e.key!==" ")return;
    var mediaCard=e.target.closest(".space-gallery-card[data-space-id]");
    if(mediaCard&&e.target===mediaCard){
      e.preventDefault();
      openSpaceCase(mediaCard.getAttribute("data-space-id"));
    }
  });
}

var IMAGE_SLOT_MAP=[
  {id:"H01",route:"#home",page:"首页",selector:"#page-home .hero-video-layer",title:"首屏电影感视频背景",asset:"media/chimutang-brand-film.mp4"},
  {id:"H02",route:"#home",page:"首页",selector:"#page-home .gallery-main",title:"首屏右侧主空间图",asset:"journal/case-villa.webp"},
  {id:"H03",route:"#home",page:"首页",selector:"#page-home .gallery-side-a",title:"首屏叠放小图A",asset:"journal/space-floor.webp"},
  {id:"H04",route:"#home",page:"首页",selector:"#page-home .gallery-side-b",title:"首屏叠放小图B",asset:"journal/touch-wood.webp"},
  {id:"H05",route:"#home",page:"首页",selector:"#page-home .brand-film-card",title:"品牌故事影片封面",asset:"media/brand-story-wood-ring-lite.webp"},
  {id:"M01",route:"#home",page:"首页",selector:"#page-home .motion-feature",title:"WOOD ALL MOTION 主视频",asset:"media/motion-atelier-01.mp4"},
  {id:"M02",route:"#home",page:"首页",selector:"#page-home .motion-tile[data-video-src='media/motion-atelier-02.mp4']",title:"影像小卡 02",asset:"media/motion-atelier-02.mp4"},
  {id:"M03",route:"#home",page:"首页",selector:"#page-home .motion-tile[data-video-src='media/motion-atelier-03.mp4']",title:"影像小卡 03",asset:"media/motion-atelier-03.mp4"},
  {id:"M04",route:"#home",page:"首页",selector:"#page-home .motion-tile[data-video-src='media/motion-atelier-04.mp4']",title:"影像小卡 04",asset:"media/motion-atelier-04.mp4"},
  {id:"S01",route:"#home",page:"首页",selector:"#homeSpaceFeature [data-space-id='living-hero']",title:"首页空间应用主图：木入客厅",asset:"journal/paving-reference/ref-living-hero.webp"},
  {id:"S02",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='living-light']",title:"首页空间应用卡：光下原木",asset:"journal/paving-reference/ref-living-light.webp"},
  {id:"S03",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='living-dark-lounge']",title:"首页空间应用卡：深厅有序",asset:"journal/paving-reference/ref-living-dark-lounge.webp"},
  {id:"S04",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='living-soft-sofa']",title:"首页空间应用卡：柔厅温木",asset:"journal/paving-reference/ref-living-soft-sofa.webp"},
  {id:"S05",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='living-warm-classic']",title:"首页空间应用卡：暖木成厅",asset:"journal/paving-reference/ref-living-warm-classic.webp"},
  {id:"S06",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='dining-open']",title:"首页空间应用卡：餐厨连贯",asset:"journal/paving-reference/ref-dining-open.webp"},
  {id:"S07",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='dining-light']",title:"首页空间应用卡：光中用餐",asset:"journal/paving-reference/ref-dining-light.webp"},
  {id:"S08",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='dining-minimal']",title:"首页空间应用卡：简席见木",asset:"journal/paving-reference/ref-dining-minimal.webp"},
  {id:"H06",route:"#home",page:"首页",selector:"#page-home .design-media-panel",title:"木作内容主入口大图",asset:"journal/case-lake-residence.webp"},
  {id:"H07",route:"#home",page:"首页",selector:"#page-home .design-mini-card:nth-child(1)",title:"首页内容入口：材料触感",asset:"journal/craft-soft-touch.webp"},
  {id:"H08",route:"#home",page:"首页",selector:"#page-home .design-mini-card:nth-child(2)",title:"首页内容入口：森林来源",asset:"journal/forest-origin.webp"},
  {id:"H09",route:"#home",page:"首页",selector:"#page-home .design-mini-card:nth-child(3)",title:"首页内容入口：光线脚感",asset:"journal/craft-light-step.webp"},
  {id:"P01",route:"#products",page:"产品中心",selector:"#page-products .space-product-guide",title:"按空间选地板快捷入口区",asset:"SPACE_MEDIA"},
  {id:"P02",route:"#products",page:"产品中心",selector:"#page-products #prodGrid",title:"产品缩略图网格（由产品数据生成）",asset:"product-images-thumb/*"},
  {id:"T01",route:"#craft",page:"工艺技术",selector:"#page-craft .craft-editorial",title:"工艺编辑区主图",asset:"journal/craft-hand.webp"},
  {id:"T02",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(1)",title:"工艺卡 01",asset:"journal/craft-parquet-system.webp"},
  {id:"T03",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(2)",title:"工艺卡 02",asset:"journal/craft-stone-board.webp"},
  {id:"T04",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(3)",title:"工艺卡 03",asset:"partners/ciranova.jpg"},
  {id:"T05",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(4)",title:"工艺卡 04",asset:"partners/sherwin.jpg"},
  {id:"T06",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(5)",title:"工艺卡 05",asset:"partners/bona.png"},
  {id:"T07",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(6)",title:"工艺卡 06",asset:"media/motion-atelier-02.mp4"},
  {id:"T08",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(7)",title:"工艺卡 07",asset:"journal/wood-art.webp"},
  {id:"T09",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(8)",title:"工艺卡 08",asset:"journal/material-blue-floor.webp"},
  {id:"J01",route:"#journal",page:"痴木志",selector:"#page-journal .journal-cover",title:"痴木志封面",asset:"journal/craft-oriental-card-lite.webp"},
  {id:"J02",route:"#journal",page:"痴木志",selector:"#muchiEditorPicks .muchi-pick-card:nth-child(1)",title:"痴木志主编推荐：首图",asset:"journal/craft-ring-section-lite.webp"},
  {id:"J03",route:"#journal",page:"痴木志",selector:"#muchiEditorPicks .muchi-pick-card:nth-child(2)",title:"痴木志主编推荐：次图",asset:"journal/space-floor.webp"},
  {id:"J04",route:"#journal",page:"痴木志",selector:"#muchiEditorPicks .muchi-pick-card:nth-child(3)",title:"痴木志主编推荐：三图",asset:"journal/surface-wood-mosaic-lite.webp"},
  {id:"J05",route:"#journal",page:"痴木志",selector:"#muchiQuestionGrid .muchi-question-card:nth-child(1)",title:"痴木志问题阅读入口",asset:"journal/home-hero-forest-door-lite.webp"},
  {id:"J06",route:"#journal",page:"痴木志",selector:"#muchiVolumeGrid .muchi-volume-card:nth-child(1)",title:"痴木志六卷目录入口",asset:"journal/touch-wood.webp"},
  {id:"J07",route:"#journal",page:"痴木志",selector:"#muchiFeatured .muchi-mag-cover",title:"痴木志本月文章入口",asset:"journal/system-section-house.webp"},
{id:"C01",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='living-hero']",title:"铺装参考：木入客厅",asset:"journal/paving-reference/ref-living-hero.webp"},
  {id:"C02",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='living-light']",title:"铺装参考：光下原木",asset:"journal/paving-reference/ref-living-light.webp"},
  {id:"C03",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='living-dark-lounge']",title:"铺装参考：深厅有序",asset:"journal/paving-reference/ref-living-dark-lounge.webp"},
  {id:"C04",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='living-soft-sofa']",title:"铺装参考：柔厅温木",asset:"journal/paving-reference/ref-living-soft-sofa.webp"},
  {id:"C05",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='living-warm-classic']",title:"铺装参考：暖木成厅",asset:"journal/paving-reference/ref-living-warm-classic.webp"},
  {id:"C06",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='dining-open']",title:"铺装参考：餐厨连贯",asset:"journal/paving-reference/ref-dining-open.webp"},
  {id:"C07",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='dining-light']",title:"铺装参考：光中用餐",asset:"journal/paving-reference/ref-dining-light.webp"},
  {id:"C08",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='dining-minimal']",title:"铺装参考：简席见木",asset:"journal/paving-reference/ref-dining-minimal.webp"},
  {id:"C09",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='kitchen-ceiling']",title:"铺装参考：上下同木",asset:"journal/paving-reference/ref-kitchen-ceiling.webp"},
  {id:"C10",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='kitchen-long']",title:"铺装参考：长厨通铺",asset:"journal/paving-reference/ref-kitchen-long.webp"},
  {id:"C11",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='kitchen-family']",title:"铺装参考：家常有木",asset:"journal/paving-reference/ref-kitchen-family.webp"},
  {id:"C12",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='bedroom-light']",title:"铺装参考：卧室轻呼吸",asset:"journal/paving-reference/ref-bedroom-light.webp"},
  {id:"C13",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='bedroom-deep']",title:"铺装参考：静室深纹",asset:"journal/paving-reference/ref-bedroom-deep.webp"},
  {id:"C14",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='bedroom-warm']",title:"铺装参考：暖卧有度",asset:"journal/paving-reference/ref-bedroom-warm.webp"},
  {id:"C15",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='study-shadow']",title:"铺装参考：书房藏静",asset:"journal/paving-reference/ref-study-shadow.webp"},
  {id:"C16",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='study-chair']",title:"铺装参考：独坐见光",asset:"journal/paving-reference/ref-study-chair.webp"},
  {id:"C17",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='tea-room-dark']",title:"铺装参考：茶室留白",asset:"journal/paving-reference/ref-tea-room-dark.webp"},
  {id:"C18",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='tatami-light']",title:"铺装参考：和室明净",asset:"journal/paving-reference/ref-tatami-light.webp"},
  {id:"C19",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='japanese-quiet']",title:"铺装参考：静室素木",asset:"journal/paving-reference/ref-japanese-quiet.webp"},
  {id:"C20",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='entry-slats']",title:"铺装参考：玄关定序",asset:"journal/paving-reference/ref-entry-slats.webp"},
  {id:"C21",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='corridor-wood']",title:"铺装参考：廊道引光",asset:"journal/paving-reference/ref-corridor-wood.webp"},
  {id:"C22",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='hall-open']",title:"铺装参考：入户开阔",asset:"journal/paving-reference/ref-hall-open.webp"},
  {id:"C23",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='stairs-open']",title:"铺装参考：楼梯成景",asset:"journal/paving-reference/ref-stairs-open.webp"},
  {id:"C24",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='stairs-silent']",title:"铺装参考：梯间留白",asset:"journal/paving-reference/ref-stairs-silent.webp"},
  {id:"C25",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='gallery-library']",title:"铺装参考：展厅藏木",asset:"journal/paving-reference/ref-gallery-library.webp"},
  {id:"C26",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='showroom-wide']",title:"铺装参考：展厅尺度",asset:"journal/paving-reference/ref-showroom-wide.webp"},
  {id:"C27",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='atelier-commercial']",title:"铺装参考：商空有骨",asset:"journal/paving-reference/ref-atelier-commercial.webp"},
  {id:"C28",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='lounge-gray']",title:"铺装参考：灰调会客",asset:"journal/paving-reference/ref-lounge-gray.webp"},
  {id:"C29",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='retail-floor']",title:"铺装参考：店面有温",asset:"journal/paving-reference/ref-retail-floor.webp"},
  {id:"C30",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='herringbone-tv']",title:"铺装参考：人字成厅",asset:"journal/paving-reference/ref-herringbone-tv.webp"},
  {id:"C31",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='herringbone-light']",title:"铺装参考：浅拼见光",asset:"journal/paving-reference/ref-herringbone-light.webp"},
  {id:"C32",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='herringbone-dining']",title:"铺装参考：鱼骨入席",asset:"journal/paving-reference/ref-herringbone-dining.webp"},
  {id:"C33",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='gray-corridor']",title:"铺装参考：灰木入廊",asset:"journal/paving-reference/ref-gray-corridor.webp"},
  {id:"C34",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='wide-board-house']",title:"铺装参考：宽板成宅",asset:"journal/paving-reference/ref-wide-board-house.webp"},
  {id:"C35",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='plank-sun']",title:"铺装参考：日光见纹",asset:"journal/paving-reference/ref-plank-sun.webp"},
  {id:"C36",route:"#cases",page:"铺装参考库",selector:"#caseSpaceGallery [data-space-id='dark-tea']",title:"铺装参考：暗室有光",asset:"journal/paving-reference/ref-dark-tea.webp"}
];

function isImageSlotReviewMode(){
  try{
    var params=new URLSearchParams(window.location.search);
    return params.get("imageSlots")==="1"||params.get("slots")==="1"||window.localStorage.getItem("imageSlots")==="1";
  }catch(e){
    return false;
  }
}

function getCurrentImageSlots(){
  var route=window.location.hash||"#home";
  return IMAGE_SLOT_MAP.filter(function(slot){return slot.route===route});
}

function copyImageSlotList(slots){
  var text=slots.map(function(slot){return slot.id+" = （填写 IMG 编号） // "+slot.page+" · "+slot.title+" · 当前："+slot.asset}).join("\n");
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).catch(function(){});
  }
}

function renderImageSlotPanel(slots){
  if(!isImageSlotReviewMode())return;
  var panel=document.getElementById("imageSlotPanel");
  if(!panel){
    panel=document.createElement("aside");
    panel.id="imageSlotPanel";
    panel.className="image-slot-panel";
    document.body.appendChild(panel);
  }
  panel.innerHTML='<strong>图片位编号</strong><p>告诉我：<code>H02 = IMG023</code></p><button type="button" id="copyImageSlots">复制本页编号</button><div>'+slots.map(function(slot){
    return '<a href="'+slot.route+'" data-slot-jump="'+slot.id+'"><b>'+slot.id+'</b><span>'+escapeHtml(slot.title)+'</span></a>';
  }).join("")+'</div>';
  var copyBtn=document.getElementById("copyImageSlots");
  if(copyBtn)copyBtn.onclick=function(){copyImageSlotList(slots)};
}

function applyImageSlotBadges(){
  if(!isImageSlotReviewMode())return;
  document.body.classList.add("image-slot-review");
  document.querySelectorAll(".image-slot-badge").forEach(function(badge){badge.remove()});
  document.querySelectorAll(".image-slot-debug-target").forEach(function(node){node.classList.remove("image-slot-debug-target")});
  var slots=getCurrentImageSlots();
  slots.forEach(function(slot){
    var target=document.querySelector(slot.selector);
    if(!target)return;
    target.classList.add("image-slot-debug-target");
    if(window.getComputedStyle(target).position==="static")target.style.position="relative";
    var badge=document.createElement("span");
    badge.className="image-slot-badge";
    badge.textContent=slot.id;
    badge.title=slot.title+" / "+slot.asset;
    target.appendChild(badge);
  });
  renderImageSlotPanel(slots);
}

function initProductsPage(){
  if(!PRODUCTS.length){
    ensureProductsLoaded(function(){
      if(getBaseHash(window.location.hash||'#home')==='#products') initProductsPage();
    });
    return;
  }
  if(productsInitialized){
    renderProductSwatchWall();
    bindProductChoiceGuide();
    buildAllFilters();
    buildProds();
    return;
  }
  productsInitialized=true;
  currentProd=PRODUCTS[0];
  renderProductSwatchWall();
  bindProductChoiceGuide();
  buildAllFilters();
  buildProds();
}

function buildAllFilters(){
  ["series","wood","board","surface","structure"].forEach(function(g){buildFilterRow(g)});
  updateFilterSummary();
}

function collectValues(field){
  var seen={"全部":true},vals=["全部"];
  PRODUCTS.forEach(function(p){
    if(field==="surface"){
      p[field].split(/[+/、，]/).forEach(function(tok){
        tok=tok.trim();
        if(tok&&!seen[tok]){seen[tok]=true;vals.push(tok)}
      });
    }else{
      var v=p[field];
      if(!seen[v]){seen[v]=true;vals.push(v)}
    }
  });
  return vals;
}

function matchSurface(productSurface,filterVal){
  if(filterVal==="全部")return true;
  var tokens=productSurface.split(/[+/、，]/).map(function(t){return t.trim()});
  return tokens.indexOf(filterVal)>=0;
}

function matchesProductFilters(product,filters){
  return (filters.series==="全部"||product.series===filters.series||product.series.indexOf(filters.series)===0)
    &&(filters.wood==="全部"||product.wood===filters.wood)
    &&(filters.board==="全部"||product.board===filters.board)
    &&(filters.surface==="全部"||matchSurface(product.surface,filters.surface))
    &&(filters.structure==="全部"||product.structure===filters.structure);
}

function countProductsForFilters(filters){
  return PRODUCTS.filter(function(product){return matchesProductFilters(product,filters)}).length;
}

function resolveProductFilterObject(filter){
  var next={
    series:filter.series?getProductSeriesValue(filter.series):"全部",
    wood:filter.wood||"全部",
    board:filter.board||"全部",
    surface:filter.surface||"全部",
    structure:filter.structure||"全部"
  };
  if(!PRODUCTS.length||countProductsForFilters(next))return next;
  var woodOnly={series:"全部",wood:next.wood,board:next.board,surface:next.surface,structure:next.structure};
  if(next.wood!=="全部"&&countProductsForFilters(woodOnly))return woodOnly;
  var seriesOnly={series:next.series,wood:"全部",board:next.board,surface:next.surface,structure:next.structure};
  if(next.series!=="全部"&&countProductsForFilters(seriesOnly))return seriesOnly;
  return {series:"全部",wood:"全部",board:"全部",surface:"全部",structure:"全部"};
}

function buildFilterRow(group){
  var el=document.getElementById("filter"+group.charAt(0).toUpperCase()+group.slice(1));
  if(!el)return;
  el.innerHTML="";
  var vals=collectValues(group);
  vals.forEach(function(v){
    var c=document.createElement("button");
    var isAlt=(group==="surface"||group==="structure");
    var isActive=v===activeFilters[group]||(group==="series"&&activeFilters[group]!=="全部"&&v.indexOf(activeFilters[group])===0);
    c.type="button";
    c.className="chip"+(isAlt?" alt":"")+(isActive?" active":"");
    c.textContent=getDisplayFilterLabel(group,v);
    c.onclick=function(){setFilter(group,v)};
    el.appendChild(c);
  });
}

function setFilter(group,val){
  activeFilters[group]=val;
  buildFilterRow(group);
  updateFilterSummary();
  buildProds();
  if(isProductFilterRail()){
    window.setTimeout(function(){setMobileFilterGroup(null)},80);
  }
}

function getFiltered(){
  return PRODUCTS.filter(function(p){return matchesProductFilters(p,activeFilters)});
}

function getProductRenderBatchSize(){
  return window.matchMedia&&window.matchMedia("(max-width:640px)").matches?18:32;
}

function scheduleProductRender(callback){
  if("requestIdleCallback" in window){
    requestIdleCallback(callback,{timeout:180});
  }else{
    window.setTimeout(callback,16);
  }
}

function createProductCard(p,index){
  var card=document.createElement("div");
  var selected=isProductSelected(p.code);
  var active=currentProd&&currentProd.code===p.code;
  var eager=index<8;
  var imageSrc=p.map_thumb||p.img_b_thumb||p.img_e_thumb||p.swatch_thumb;
  var imageMarkup=imageSrc?'<img src="'+escapeHtml(imageSrc)+'" loading="'+(eager?"eager":"lazy")+'" fetchpriority="'+(eager?"high":"low")+'" decoding="async" alt="'+escapeHtml(p.code+' '+p.wood+' 木地板纹理')+'">':'<span class="product-card-image-placeholder" aria-hidden="true"></span>';
  var swatchMarkup=p.map_thumb?'<span class="product-card-swatchbar"><i style="--swatch-color:'+escapeHtml(p.swatch_accent||"#b28247")+'"></i><b>'+escapeHtml(p.tone||"木色")+'</b><em>纹理贴图</em></span>':'';
  card.className="pcard action-card"+(p.map_thumb?" has-swatch-assets":"")+(active?" active":"")+(selected?" selected":"");
  card.dataset.productCode=p.code;
  card.setAttribute("role","button");
  card.setAttribute("tabindex","0");
  card.setAttribute("aria-label","查看产品 "+p.code+" "+p.wood+" 详情");
  card.innerHTML=imageMarkup+swatchMarkup+'<span class="pname">'+escapeHtml(p.code)+' · '+escapeHtml(p.wood)+'</span><button class="product-save-chip" type="button" data-product-save="'+escapeHtml(p.code)+'" aria-pressed="'+(selected?"true":"false")+'" aria-label="'+(selected?"已加入选材夹，点击移除":"加入选材夹")+'">'+renderProductSaveIcon(selected)+'</button>';
  card.onclick=function(){selectProd(p)};
  var saveBtn=card.querySelector("[data-product-save]");
  if(saveBtn){
    saveBtn.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      toggleProductSelection(p.code);
    };
  }
  card.onpointerenter=function(){warmProductImages(p,1)};
  card.onfocus=function(){warmProductImages(p,1)};
  card.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();selectProd(p)}};
  return card;
}

function updateProductCardStates(){
  document.querySelectorAll("#prodGrid .pcard").forEach(function(card){
    var code=card.dataset.productCode;
    var active=!!(currentProd&&currentProd.code===code);
    var selected=isProductSelected(code);
    card.classList.toggle("active",active);
    card.classList.toggle("selected",selected);
    var btn=card.querySelector("[data-product-save]");
    if(btn)setProductSaveButton(btn,selected);
  });
}

function appendProductCards(el,list,start,token){
  if(token!==productRenderToken)return;
  var batch=getProductRenderBatchSize();
  var end=Math.min(start+batch,list.length);
  var frag=document.createDocumentFragment();
  for(var i=start;i<end;i++){
    frag.appendChild(createProductCard(list[i],i));
  }
  el.appendChild(frag);
  updateProductCardStates();
  if(end<list.length){
    scheduleProductRender(function(){appendProductCards(el,list,end,token)});
  }
}

function buildProds(){
  var el=document.getElementById("prodGrid");el.innerHTML="";
  productRenderToken++;
  updateFilterSummary();
  if(!PRODUCTS.length){
    document.getElementById("prodCount").textContent="正在加载产品";
    el.innerHTML='<div class="prod-empty"><span>LOADING</span><h3>正在整理产品纹理</h3><p>产品图片与参数正在加载，请稍候。</p></div>';
    return;
  }
  var list=getFiltered();
  document.getElementById("prodCount").textContent=list.length+"/"+PRODUCTS.length+"款";
  if(!list.length){
    el.innerHTML='<div class="prod-empty"><span>NO RESULT</span><h3>没有找到匹配产品</h3><p>可以清除筛选重新浏览，或直接联系管家为您推荐合适系列。</p><div class="page-cta"><button type="button" class="btn-primary" onclick="clearProductFilters()">清除筛选</button><a href="#contact" class="btn-secondary">联系管家</a></div></div>';
    return;
  }
  appendProductCards(el,list,0,productRenderToken);
  updatePavingSelectionUI();
}

function clearProductFilters(){
  resetProductFiltersForSeries("全部");
  buildAllFilters();
  buildProds();
}

function getSelectedProductFilterPairs(){
  var selected=[];
  Object.keys(activeFilters).forEach(function(key){
    if(activeFilters[key]&&activeFilters[key]!=="全部"){
      selected.push({key:key,label:PRODUCT_FILTER_LABELS[key]||key,value:activeFilters[key]});
    }
  });
  return selected;
}

function renderProductFilterState(selected){
  var state=document.getElementById("prodFilterState");
  var clear=document.getElementById("prodClearFilters");
  var filters=document.getElementById("prodFilters");
  if(state){
    state.classList.toggle("is-empty",!selected.length);
    state.innerHTML="";
    if(selected.length){
      selected.forEach(function(item){
        var chip=document.createElement("span");
        chip.textContent=item.label+"："+item.value;
        state.appendChild(chip);
      });
    }else{
      var all=document.createElement("span");
      all.textContent="全部产品";
      state.appendChild(all);
    }
  }
  if(clear){
    clear.classList.toggle("is-visible",selected.length>0);
  }
  if(filters){
    filters.classList.toggle("has-active-filters",selected.length>0);
  }
}

function updateFilterSummary(){
  var el=document.getElementById("filterSummary");
  var selected=getSelectedProductFilterPairs();
  renderProductFilterState(selected);
  if(!el)return;
  el.textContent=selected.length?selected.map(function(item){return item.label+"："+item.value}).join(" / "):"全部产品";
}

function initProductFilterActions(){
  var clear=document.getElementById("prodClearFilters");
  if(clear&&!clear.dataset.bound){
    clear.dataset.bound="true";
    clear.addEventListener("click",function(){
      clearProductFilters();
    });
  }
}

function setMobileFiltersOpen(open){
  var filters=document.getElementById("prodFilters");
  var toggle=document.getElementById("filterToggle");
  var text=document.getElementById("filterToggleText");
  if(!filters)return;
  filters.classList.toggle("open",!!open);
  filters.classList.toggle("filters-collapsed",!open);
  if(toggle)toggle.setAttribute("aria-expanded",open?"true":"false");
  if(text)text.textContent=open?"收起":"展开";
}

function isProductFilterRail(){
  return window.matchMedia&&window.matchMedia("(max-width:640px)").matches;
}

function setMobileFilterGroup(group){
  var filters=document.getElementById("prodFilters");
  var toggle=document.getElementById("filterToggle");
  var text=document.getElementById("filterToggleText");
  var rows=document.querySelectorAll(".filter-row-wrap[data-filter-group]");
  var hasGroup=!!group;
  rows.forEach(function(row){
    row.classList.toggle("mobile-active",row.getAttribute("data-filter-group")===group);
  });
  if(filters){
    filters.classList.toggle("open",hasGroup);
    filters.classList.toggle("filters-collapsed",!hasGroup);
  }
  if(toggle)toggle.setAttribute("aria-expanded",hasGroup?"true":"false");
  if(text)text.textContent=hasGroup?"收起":"选择";
}

function syncMobileFilterLabels(){
  var isRail=isProductFilterRail();
  document.querySelectorAll(".filter-row-wrap[data-filter-group] .filter-label").forEach(function(label){
    if(isRail){
      label.setAttribute("role","button");
      label.setAttribute("tabindex","0");
      label.setAttribute("aria-label","展开"+label.textContent.trim()+"筛选");
    }else{
      label.removeAttribute("role");
      label.removeAttribute("tabindex");
      label.removeAttribute("aria-label");
    }
  });
  if(!isRail)setMobileFilterGroup(null);
}

function initMobileFilterToggle(){
  var toggle=document.getElementById("filterToggle");
  var filters=document.getElementById("prodFilters");
  if(!toggle||!filters)return;
  setMobileFilterGroup(null);
  syncMobileFilterLabels();
  toggle.addEventListener("click",function(){
    setMobileFilterGroup(null);
  });
  document.querySelectorAll(".filter-row-wrap[data-filter-group]").forEach(function(row){
    var label=row.querySelector(".filter-label");
    if(!label)return;
    label.addEventListener("click",function(e){
      if(!isProductFilterRail())return;
      e.preventDefault();
      var group=row.getAttribute("data-filter-group");
      setMobileFilterGroup(row.classList.contains("mobile-active")?null:group);
    });
    label.addEventListener("keydown",function(e){
      if(!isProductFilterRail())return;
      if(e.key==="Enter"||e.key===" "){
        e.preventDefault();
        var group=row.getAttribute("data-filter-group");
        setMobileFilterGroup(row.classList.contains("mobile-active")?null:group);
      }
    });
  });
  document.addEventListener("click",function(e){
    if(!isProductFilterRail()||!filters.classList.contains("open"))return;
    if(!filters.contains(e.target))setMobileFilterGroup(null);
  });
  window.addEventListener("resize",syncMobileFilterLabels);
}

function selectProd(p){
  currentProd=p;
  updateProductCardStates();
  openDrawer(p);
}

function openDrawer(p){
  var prod=p||currentProd;
  if(!prod)return;
  showProductInDrawer(prod);
  document.getElementById('prodDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
  updateDrawerNav();
  bindDrawerSwipe();
}

function closeDrawer(){
  document.getElementById('prodDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
  unbindDrawerSwipe();
}

document.addEventListener("click",function(e){
  if(e.target.closest(".drawer-back")){
    e.preventDefault();
    closeDrawer();
  }
  if(e.target&&e.target.id==="drawerOverlay"){
    closeDrawer();
  }
});

function getFilteredList(){return getFiltered();}

function drawerNavPrev(){
  var list=getFilteredList();
  if(!currentProd||list.length===0)return;
  var idx=-1;
  for(var i=0;i<list.length;i++){if(list[i].code===currentProd.code){idx=i;break;}}
  if(idx>0){currentProd=list[idx-1];showProductInDrawer(currentProd);updateDrawerNav();updateProductCardStates();}
}

function drawerNavNext(){
  var list=getFilteredList();
  if(!currentProd||list.length===0)return;
  var idx=-1;
  for(var i=0;i<list.length;i++){if(list[i].code===currentProd.code){idx=i;break;}}
  if(idx<list.length-1){currentProd=list[idx+1];showProductInDrawer(currentProd);updateDrawerNav();updateProductCardStates();}
}

function updateDrawerNav(){
  var list=getFilteredList();
  var idx=-1;
  if(currentProd){
    for(var i=0;i<list.length;i++){if(list[i].code===currentProd.code){idx=i;break;}}
  }
  document.getElementById('drawerNavPos').textContent=(idx+1)+'/'+list.length;
  document.getElementById('drawerNavUp').style.opacity=idx<=0?'0.3':'1';
  document.getElementById('drawerNavDown').style.opacity=idx>=list.length-1?'0.3':'1';
}

var drawerSwipeBinding=null;
function bindDrawerSwipe(){
  if(drawerSwipeBinding)return;
  var drawer=document.getElementById('prodDrawer');
  var touchStartY=0;
  var touchMoved=false;
  function onTouchStart(e){touchStartY=e.touches[0].clientY;touchMoved=false;}
  function onTouchMove(e){
    if(!touchMoved){touchMoved=true;return;}
  }
  function onTouchEnd(e){
    if(!touchMoved)return;
    var dy=e.changedTouches[0].clientY-touchStartY;
    if(Math.abs(dy)<40)return;
    if(dy<0)drawerNavNext();
    else drawerNavPrev();
  }
  drawer.addEventListener('touchstart',onTouchStart,{passive:true});
  drawer.addEventListener('touchmove',onTouchMove,{passive:true});
  drawer.addEventListener('touchend',onTouchEnd,{passive:true});
  document.getElementById('drawerNavUp').onclick=drawerNavPrev;
  document.getElementById('drawerNavDown').onclick=drawerNavNext;
  drawerSwipeBinding={el:drawer,ts:onTouchStart,tm:onTouchMove,te:onTouchEnd};
}

function unbindDrawerSwipe(){
  if(!drawerSwipeBinding)return;
  var b=drawerSwipeBinding;
  b.el.removeEventListener('touchstart',b.ts);
  b.el.removeEventListener('touchmove',b.tm);
  b.el.removeEventListener('touchend',b.te);
  drawerSwipeBinding=null;
}

function getProductSceneSources(p){
  var sources=[];
  [p.map_full,p.map_thumb,p.scene_thumb,p.texture_thumb,p.swatch_thumb,p.img_e_thumb,p.img_b_thumb,p.img_e_hd,p.img_b_hd].forEach(function(src){
    if(src&&sources.indexOf(src)<0)sources.push(src);
  });
  return sources;
}

var productImageWarmCache={};
var drawerImageLoadToken=0;
var productHdFailureStreak=0;
var productHdDisabled=false;

function uniqueProductSources(sources){
  var unique=[];
  sources.forEach(function(src){
    if(src&&unique.indexOf(src)<0)unique.push(src);
  });
  return unique;
}

function getProductHighResSources(p){
  if(productHdDisabled)return [];
  return uniqueProductSources([p.img_e_hd,p.img_b_hd]);
}

function isProductHdSource(src){
  return !!src&&src.indexOf(COS_BASE+"product-images/")===0;
}

function noteProductHdSuccess(src){
  if(!isProductHdSource(src))return;
  productHdFailureStreak=0;
}

function noteProductHdFailure(src){
  if(!isProductHdSource(src))return;
  productHdFailureStreak+=1;
  if(productHdFailureStreak>=6)productHdDisabled=true;
}

function filterVisibleProductSources(sources){
  var filtered=sources.filter(function(src){return !isTextHeavyProductImage(src)});
  return filtered.length?filtered:sources;
}

function loadWarmImage(src,onLoad,onError){
  if(!src){
    if(onError)onError();
    return;
  }
  var cached=productImageWarmCache[src];
  if(cached&&cached.state==="loaded"){
    if(onLoad)window.setTimeout(function(){onLoad(src)},0);
    return;
  }
  if(cached&&cached.state==="error"){
    if(onError)window.setTimeout(function(){onError(src)},0);
    return;
  }
  if(cached&&cached.state==="loading"){
    if(onLoad)cached.onload.push(onLoad);
    if(onError)cached.onerror.push(onError);
    return;
  }
  var entry={state:"loading",onload:onLoad?[onLoad]:[],onerror:onError?[onError]:[]};
  productImageWarmCache[src]=entry;
  var img=new Image();
  img.decoding="async";
  img.onload=function(){
    entry.state="loaded";
    noteProductHdSuccess(src);
    entry.onload.splice(0).forEach(function(fn){fn(src)});
  };
  img.onerror=function(){
    entry.state="error";
    noteProductHdFailure(src);
    entry.onerror.splice(0).forEach(function(fn){fn(src)});
  };
  img.src=src;
}

function loadFirstWarmImage(sources,onReady){
  var list=uniqueProductSources(sources);
  var index=0;
  function next(){
    if(index>=list.length)return;
    var src=list[index++];
    loadWarmImage(src,function(readySrc){
      onReady(readySrc);
    },next);
  }
  next();
}

function warmProductImages(product,limit){
  filterVisibleProductSources(getProductHighResSources(product)).slice(0,limit||1).forEach(function(src){
    loadWarmImage(src);
  });
}

function warmNeighborProductImages(product){
  var list=getFilteredList();
  if(!product||!list.length)return;
  var idx=-1;
  for(var i=0;i<list.length;i++){
    if(list[i].code===product.code){idx=i;break;}
  }
  [idx-1,idx+1].forEach(function(nextIndex){
    if(nextIndex>=0&&nextIndex<list.length)warmProductImages(list[nextIndex],1);
  });
}

function isTextHeavyProductImage(src){
  if(!src)return false;
  return /logo|banner|poster|text|title|word|qr|wechat|weixin|公众号|海报|文字/i.test(src);
}

function showProductInDrawer(p){
  // Quick fade flash
  var bg=document.querySelector('.drawer-bg');
  bg.classList.add('switching');
  setTimeout(function(){bg.classList.remove('switching')},150);

  // Scene image (full screen bg)
  var sceneImg=document.getElementById('drawerScene');
  var loadToken=++drawerImageLoadToken;
  sceneImg.decoding="async";
  sceneImg.loading="eager";
  sceneImg.classList.remove("is-hd-ready");
  sceneImg.classList.add("is-loading");
  var sceneSources=getProductSceneSources(p).filter(function(src){return !isTextHeavyProductImage(src);});
  if(sceneSources.length===0)sceneSources=getProductSceneSources(p);
  sceneImg.alt=(p.code||'')+' 木地板空间效果图';
  var sourceIndex=0;
  sceneImg.onload=function(){
    if(loadToken!==drawerImageLoadToken)return;
    sceneImg.classList.remove("is-loading");
  };
  sceneImg.onerror=function(){
    if(loadToken!==drawerImageLoadToken)return;
    sourceIndex+=1;
    if(sourceIndex<sceneSources.length)sceneImg.src=sceneSources[sourceIndex];
  };
  sceneImg.src=sceneSources[0]||'';
  loadFirstWarmImage(filterVisibleProductSources(getProductHighResSources(p)),function(hdSrc){
    if(loadToken!==drawerImageLoadToken||!hdSrc)return;
    if(sceneImg.getAttribute("src")===hdSrc){
      sceneImg.classList.add("is-hd-ready");
      return;
    }
    sceneImg.onload=function(){
      if(loadToken!==drawerImageLoadToken)return;
      sceneImg.classList.remove("is-loading");
      sceneImg.classList.add("is-hd-ready");
    };
    sceneImg.onerror=null;
    sceneImg.classList.add("is-loading");
    sceneImg.src=hdSrc;
  });
  warmNeighborProductImages(p);

  // Info panel
  var info=document.getElementById('drawerInfoPanel');
  var drawerVisuals=p.map_thumb?'<div class="drawer-product-visuals"><figure><img src="'+escapeHtml(p.map_thumb)+'" alt="'+escapeHtml(p.code+' 纹理贴图')+'" loading="lazy" decoding="async"><figcaption>贴图</figcaption></figure><figure><img src="'+escapeHtml(p.texture_thumb||p.map_thumb)+'" alt="'+escapeHtml(p.code+' 纹理细节')+'" loading="lazy" decoding="async"><figcaption>纹理</figcaption></figure><figure><img src="'+escapeHtml(p.scene_thumb||p.texture_thumb||p.map_thumb)+'" alt="'+escapeHtml(p.code+' 场景图')+'" loading="lazy" decoding="async"><figcaption>场景</figcaption></figure></div>':'';
  info.innerHTML='<h3>'+p.code+'</h3><div class="d-meta">'+p.wood+' · '+p.surface+'</div>'
    +drawerVisuals
    +'<div class="drawer-cards">'
    +'<div class="drawer-card"><div class="val">'+p.wood+'</div><div class="lbl">木种</div></div>'
    +'<div class="drawer-card"><div class="val">'+p.board+'</div><div class="lbl">板材</div></div>'
    +'<div class="drawer-card"><div class="val">'+p.surface+'</div><div class="lbl">表面</div></div>'
    +'<div class="drawer-card"><div class="val">'+p.structure+'</div><div class="lbl">结构</div></div>'
    +'<div class="drawer-card"><div class="val">'+p.thickness+'mm</div><div class="lbl">厚度</div></div>'
    +'<div class="drawer-card"><div class="val">'+p.width+'mm</div><div class="lbl">宽度</div></div>'
    +'<div class="drawer-card"><div class="val">'+p.length+'mm</div><div class="lbl">长度</div></div>'
    +'<div class="drawer-card"><div class="val">'+p.spec+'</div><div class="lbl">规格</div></div>'
    +'</div>'
    +'<div class="drawer-actions">'
    +'<button class="secondary product-selection-action" type="button" data-product-save="'+escapeHtml(p.code)+'">'+(isProductSelected(p.code)?"已加入":"加入选材夹")+'</button>'
    +'<a href="#contact" onclick="closeDrawer()">咨询这款产品 '+p.code+'</a>'
    +'<a class="secondary" href="#series" onclick="goSeriesIntro(\''+p.series+'\');return false;">看'+getIntroSeriesKey(p.series)+'</a>'
    +'<a class="secondary" href="#service" onclick="closeDrawer()">量尺安装</a>'
    +'</div>';
}

// ===== SERIES DATA =====

// Customer-facing series summaries. Detailed performance claims stay out of the
// public description until the corresponding product documentation is confirmed.
var seriesData={
  "境系列":{
    tagline:"清爽克制，适合日常住宅的大面积通铺",
    hero:"境系列以自然木色、清晰纹理与低光泽表面为主，适合希望空间干净、耐看，又便于搭配家具的家庭。",
    features:[
      {title:"适合谁",text:"偏好现代简约、自然风或浅暖木色，希望全屋视觉连贯的家庭。"},
      {title:"视觉气质",text:"明亮、克制、纹理自然，不会过度抢占墙面与家具的注意力。"},
      {title:"核心工艺",text:"锁扣结构与低光泽薄涂，重点平衡拼缝、触感和天然木纹表现。"},
      {title:"使用建议",text:"先根据采光选择浅木或暖原木，再核对结构、规格和地暖条件。"}
    ]
  },
  "森系列":{
    tagline:"颜色层次丰富，适合重视质感与细节的空间",
    hero:"森系列更强调木色研发与表面层次，适合设计师项目、大宅和希望地面具有细腻变化的空间。",
    features:[
      {title:"适合谁",text:"对颜色、触感和整体搭配有明确要求，希望在自然木纹中增加设计层次。"},
      {title:"视觉气质",text:"木色更丰富，纹理与涂装相互衬托，适合低饱和软装和精细照明。"},
      {title:"核心工艺",text:"围绕着色、涂装与表面保护建立组合工艺，具体配置以产品型号为准。"},
      {title:"使用建议",text:"建议结合现场光源与实物样板判断，避免只凭屏幕颜色确定产品。"}
    ]
  },
  "悦系列":{
    tagline:"低光泽与细腻触感，适合简洁而精致的空间",
    hero:"悦系列强调柔和反光与细腻表面，适合现代住宅、主卧和需要安静视觉感受的空间。",
    features:[
      {title:"适合谁",text:"喜欢简洁线条、柔和触感和低反光地面，希望空间轻盈但不单薄。"},
      {title:"视觉气质",text:"表面光泽克制，木纹在自然光和灯光下保持柔和层次。"},
      {title:"核心工艺",text:"通过表面处理与固化工艺调整触感、反光和日常清洁表现。"},
      {title:"使用建议",text:"卧室和客餐厅可优先比较浅暖木；深色产品需结合面积与采光判断。"}
    ]
  },
  "墨系列":{
    tagline:"沉稳深木，为大尺度空间建立视觉重心",
    hero:"墨系列以深胡桃、深灰木与暖棕色为主，适合书房、会客厅和面积较大的沉静空间。",
    features:[
      {title:"适合谁",text:"偏好深色木纹、金属、皮革或石材搭配，希望空间更稳、更有包裹感。"},
      {title:"视觉气质",text:"深色收束视线，增强家具和灯光层次，整体氛围安静而克制。"},
      {title:"核心工艺",text:"重点控制深色表面的纹理可见度、色调稳定与触感表现。"},
      {title:"使用建议",text:"更适合采光充足或面积较大的房间，选材时需要同步核对墙面与家具明度。"}
    ]
  },
  "匠系列":{
    tagline:"面向整屋木作与特殊节点的项目定制",
    hero:"匠系列用于地板、墙面、木门或柜体需要统一木色和细节语言的项目，方案需结合现场尺寸与设计图纸确认。",
    features:[
      {title:"适合项目",text:"大宅、样板间、商业空间及需要整屋木作协调的设计项目。"},
      {title:"视觉方向",text:"统一木色、纹理和收边关系，减少不同木作之间的视觉割裂。"},
      {title:"方案重点",text:"确认材种、饰面、节点结构、现场尺寸与各品类之间的衔接方式。"},
      {title:"咨询方式",text:"提供项目类型、面积、设计阶段和参考图，由项目顾问准备对应资料。"}
    ]
  },
  "璞系列":{
    tagline:"面向珍稀木种与大规格原木的专项定制",
    hero:"璞系列关注天然木材本身的色泽、纹理和尺度，适合对材种、规格与空间表达有明确要求的项目。",
    features:[
      {title:"适合项目",text:"重视天然材料表现的大宅、会所、收藏空间与个性化设计项目。"},
      {title:"视觉方向",text:"保留天然木纹、色差与材料厚度，让地面呈现更完整的原木尺度。"},
      {title:"方案重点",text:"根据实际木种、批次、尺寸和安装环境确定结构与铺装方式。"},
      {title:"咨询方式",text:"珍稀木种与大规格产品以实物样板、库存批次和专项方案为准。"}
    ]
  }
};

function initSeriesPage(){
  var tabs=document.getElementById('seriesTabs');
  tabs.innerHTML='';
  var keys=Object.keys(seriesData);
  var productsReady=PRODUCTS.length>0;
  var initial=(pendingSeriesKey&&seriesData[pendingSeriesKey])?pendingSeriesKey:(activeSeriesKey&&seriesData[activeSeriesKey]?activeSeriesKey:keys[0]);
  keys.forEach(function(k,i){
    var btn=document.createElement('button');
    var index=i+1<10?'0'+(i+1):String(i+1);
    var count=productsReady?countProductsBySeries(k):0;
    btn.className='series-tab'+(k===initial?' active':'');
    btn.setAttribute('data-index',index);
    btn.innerHTML='<span>'+k+'</span><small>'+(productsReady?(count?'在售产品':'系列档案'):'系列档案')+'</small>';
    btn.onclick=function(){switchSeries(k)};
    tabs.appendChild(btn);
  });
  renderSeriesContent(initial);
  pendingSeriesKey=null;
}

function switchSeries(key){
  activeSeriesKey=key;
  document.querySelectorAll('.series-tab').forEach(function(t){
    t.classList.toggle('active',t.querySelector('span')&&t.querySelector('span').textContent===key);
  });
  renderSeriesContent(key);
}

function renderSeriesContent(key){
  var d=seriesData[key];
  var productsReady=PRODUCTS.length>0;
  var count=productsReady?countProductsBySeries(key):0;
  var hasProducts=productsReady&&count>0;
  var sideCount=productsReady?(hasProducts?count:'档案'):'选品';
  var sideLabel=productsReady?(hasProducts?'在售产品':'定制咨询'):'产品中心';
  var productText=productsReady?(hasProducts?'查看本系列产品':'查看在售产品'):'查看相关产品';
  var productSeries=key;
  var contactText=hasProducts?'预约系列咨询':'预约定制咨询';
  var html='<div class="series-content active">';
  html+='<div class="series-hero">'
    +'<div class="series-hero-kicker">WOOD ALL SERIES</div>'
    +'<div class="series-hero-grid">'
    +'<div class="series-hero-copy"><h2>'+key+'</h2><p class="series-tagline"><strong>'+d.tagline+'</strong></p><p class="series-desc">'+d.hero+'</p></div>'
    +'<div class="series-hero-side '+(productsReady&&!hasProducts?'is-archive':'')+'"><span>'+sideCount+'</span><em>'+sideLabel+'</em><button class="series-link-products" type="button" data-series="'+productSeries+'">'+productText+'</button><button class="series-link-contact" type="button">'+contactText+'</button></div>'
    +'</div></div>';
  html+='<div class="series-grid-detail">';
  d.features.forEach(function(f){
    html+='<div class="detail-card"><h4>'+f.title+'</h4><p>'+f.text+'</p></div>';
  });
  html+='</div></div>';
  document.getElementById('seriesContent').innerHTML=html;
  var productBtn=document.querySelector('.series-link-products');
  if(productBtn)productBtn.onclick=function(){
    var series=this.getAttribute('data-series');
    if(series==="全部") navigate("#products");
    else goProductsBySeries(series);
  };
  var contactBtn=document.querySelector('.series-link-contact');
  if(contactBtn)contactBtn.onclick=function(){navigate('#contact')};
}

// ===== CRAFT DATA =====

var craftData=[
  {title:"地板是否稳定",items:[
    "稳定性同时受到木种、结构、含水状态、锁扣和安装环境影响，不能只看单一参数。",
    "选材时需要说明所在城市、是否地暖和空间用途，再结合具体产品结构判断。",
    "安装前的地面条件、伸缩空间与现场湿度，同样会影响长期使用表现。"
  ]},
  {title:"表面触感如何形成",items:[
    "薄涂、拉丝、手刮和不同固化方式，会改变木纹清晰度、反光程度与脚感。",
    "喜欢自然触感，可优先比较低光泽、显纹理的表面；重视清洁便利，则需同步关注表面保护。",
    "屏幕无法准确还原触感和光泽，最终应以实物样板为准。"
  ]},
  {title:"如何理解天然色差",items:[
    "天然木材会因生长部位、纹理和批次形成色差，这是材料特性的一部分。",
    "着色与涂装可以调整整体色调，但不会让每块木材完全一致。",
    "安装前通过样板核对和试铺排序，可以让深浅变化更自然。"
  ]},
  {title:"是否适合地暖",items:[
    "地暖适配需要结合产品结构、安装方式、地面含水状态和运行温度综合判断。",
    "有地暖时，应在咨询与量尺阶段主动说明，并核对对应型号的安装要求。",
    "首次运行与季节切换应按项目说明逐步调整温度，避免环境快速变化。"
  ]},
  {title:"环保信息怎么看",items:[
    "优先核对具体产品及批次对应的检测资料，不以系列宣传代替产品依据。",
    "除了检测指标，也应关注胶黏、涂装、安装辅材和现场通风条件。",
    "如需项目报审或设计资料，可联系顾问索取对应型号的可用文件。"
  ]}
];

function getVideoPoster(media){
  var match=(media||'').match(/media\/motion-atelier-(\d{2})\.mp4/i);
  if(match) return 'media/motion-atelier-'+match[1]+'-poster.jpg';
  return 'media/brand-story-wood-ring-lite.webp';
}

function initCraftPage(){
  var html='';
  var craftImages=[
    'journal/craft-parquet-system.webp','journal/craft-stone-board.webp','partners/ciranova.jpg','partners/sherwin.jpg',
    'partners/bona.png','media/motion-atelier-02.mp4','journal/wood-art.webp','journal/material-blue-floor.webp',
    'journal/craft-section-shelf.webp','journal/craft-face-grain.webp','journal/craft-floor-face.webp','journal/craft-night-plank.webp',
    'journal/craft-oriental-card-lite.webp','journal/craft-ring-section-lite.webp','journal/craft-human-wood.webp','journal/craft-wood-portrait-art.webp'
  ];
  var craftTags=['LOCK','COATING','COLOR','SURFACE','MATERIAL','STABILITY','JOINERY','ECO'];
  craftData.forEach(function(item,i){
    var media=craftImages[i]||craftImages[i%craftImages.length];
    html+='<div class="craft-item">';
    html+='<div class="craft-item-media">';
    if(/\.mp4($|\?)/i.test(media)){
      html+='<video data-src="'+media+'" muted loop playsinline preload="none" poster="'+getVideoPoster(media)+'" aria-label="'+item.title+'"></video>';
    }else{
      html+='<img src="'+media+'" alt="'+item.title+'" loading="lazy" decoding="async">';
    }
    html+='</div>';
    html+='<div class="craft-item-header"><span class="num">'+String(i+1).padStart(2,'0')+'</span><div><em>'+craftTags[i%craftTags.length]+'</em><h3>'+item.title+'</h3></div></div>';
    html+='<div class="craft-item-body"><ul>';
    item.items.forEach(function(t){html+='<li>'+t+'</li>'});
    html+='</ul></div></div>';
  });
  document.getElementById('craftContent').innerHTML=html;
}

// ===== MUCHI JOURNAL =====
var muchiInitialized=false;
var muchiActiveCategory='all';
var muchiActiveProblem='all';
var muchiListExpanded=false;
var muchiReturnScrollY=0;
var muchiReaderArticleId='';
var muchiDataLoadPromise=null;
var MUCHI_DATA_SRC='journal/muchi_articles_data.min.js?v=content-journey-3';

var MUCHI_PROBLEM_GUIDES=[
  {id:'starter',tag:'FIRST READ',title:'新读者先看',desc:'用三篇文章建立木材、工艺与空间的基本判断。'},
  {id:'wood',tag:'WOOD',title:'如何选木种',desc:'看色泽、纹理、硬度与空间气质。'},
  {id:'stability',tag:'STABILITY',title:'稳定与地暖',desc:'读含水率、伸缩、结构与施工预留。'},
  {id:'craft',tag:'CRAFT',title:'工艺与表面',desc:'理解锁扣、涂装、触感和耐用性。'},
  {id:'space',tag:'SPACE',title:'空间搭配',desc:'从客厅、卧室、茶室与家具关系读木色。'},
  {id:'aesthetic',tag:'AESTHETIC',title:'东方木韵',desc:'读木作的克制、留白与文化气质。'}
];

function escapeHTML(value){
  return String(value||'').replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}

function formatMuchiDate(date){
  return String(date||'').replace(/-/g,'.');
}

function getMuchiDisplayTitle(article){
  var display={
    kicker:article.kicker||'',
    title:article.displayTitle||article.title||'',
    subtitle:article.displaySubtitle||'',
    lines:Array.isArray(article.titleLines)?article.titleLines.filter(Boolean):[]
  };
  if(article.id==='duanzha-04'){
    display.kicker='短札④ · 终章';
    display.title='一木一浮生';
    display.subtitle='木痴专栏结语';
    display.lines=['一木一浮生'];
  }
  return display;
}

function getMuchiData(){
  return window.MUCHI_ARTICLES_DATA||{collection:{},categories:[],articles:[]};
}

function setMuchiLoadingState(message,isError){
  var featured=document.getElementById('muchiFeatured');
  var tabs=document.getElementById('muchiTabs');
  var grid=document.getElementById('muchiGrid');
  var count=document.getElementById('muchiCount');
  var text=message||'痴木志加载中...';
  if(featured&&!window.MUCHI_ARTICLES_DATA){
    featured.innerHTML='<div class="muchi-loading'+(isError?' error':'')+'">'+escapeHTML(text)+'</div>';
  }
  if(tabs&&!window.MUCHI_ARTICLES_DATA) tabs.innerHTML='';
  if(count&&!window.MUCHI_ARTICLES_DATA) count.textContent=isError?'暂时无法读取目录':'正在读取目录';
  if(grid&&!window.MUCHI_ARTICLES_DATA){
    grid.innerHTML='<div class="muchi-loading'+(isError?' error':'')+'">'+escapeHTML(text)+'</div>';
  }
}

function ensureMuchiDataLoaded(callback){
  if(window.MUCHI_ARTICLES_DATA){
    if(callback)callback();
    return;
  }
  setMuchiLoadingState('痴木志加载中...');
  if(!muchiDataLoadPromise){
    muchiDataLoadPromise=new Promise(function(resolve,reject){
      var existing=document.querySelector('script[data-muchi-data]');
      if(existing){
        if(existing.getAttribute('data-loaded')==='true'){
          resolve();
          return;
        }
        existing.parentNode.removeChild(existing);
      }
      var script=document.createElement('script');
      script.src=MUCHI_DATA_SRC;
      script.async=true;
      script.defer=true;
      script.setAttribute('data-muchi-data','true');
      script.onload=function(){
        script.setAttribute('data-loaded','true');
        resolve();
      };
      script.onerror=function(){
        if(script.parentNode)script.parentNode.removeChild(script);
        reject(new Error('muchi data failed'));
      };
      document.body.appendChild(script);
    }).catch(function(error){
      muchiDataLoadPromise=null;
      setMuchiLoadingState('痴木志目录暂时加载失败，请刷新后重试。',true);
      throw error;
    });
  }
  muchiDataLoadPromise.then(function(){
    if(callback)callback();
  }).catch(function(){});
}

function getMuchiSlug(article){
  return String(article.id||'').split('-')[0];
}

function getMuchiVolumeLabel(article){
  return article.volume||((getMuchiSlug(article)||'').toUpperCase());
}

function getMuchiCategoryCounts(data){
  var counts={};
  (data.articles||[]).forEach(function(article){
    var slug=getMuchiSlug(article);
    counts[slug]=(counts[slug]||0)+1;
  });
  return counts;
}

function getMuchiCategory(data,slug){
  return (data.categories||[]).find(function(cat){return cat.slug===slug})||null;
}

function getMuchiProblemGuide(id){
  return MUCHI_PROBLEM_GUIDES.find(function(item){return item.id===id})||null;
}

function getMuchiProblemLabel(id){
  var guide=getMuchiProblemGuide(id);
  return guide?guide.title:'全部文章';
}

function muchiArticleText(article){
  return [article.title,article.excerpt,article.category,article.label,(article.body||[]).join(' ')].join(' ');
}

function muchiTextIncludes(text,words){
  return words.some(function(word){return text.indexOf(word)>-1});
}

function matchesMuchiProblem(article,id){
  if(!id||id==='all')return true;
  var text=muchiArticleText(article);
  var slug=getMuchiSlug(article);
  if(id==='starter')return ['benyuan-01','bianmu-01','qijing-01'].indexOf(article.id)>-1||(['benyuan','bianmu','qijing'].indexOf(slug)>-1&&Number(article.index||99)<=2);
  if(id==='wood')return article.category==='辨木'||muchiTextIncludes(text,['木种','硬木','软木','木纹','纹理','橡木','白蜡','胡桃','柚木','栎木']);
  if(id==='stability')return muchiTextIncludes(text,['含水率','热胀冷缩','稳定','地暖','潮湿','变形','开缝','伸缩','水汽']);
  if(id==='craft')return article.category==='工法'||muchiTextIncludes(text,['工法','涂装','锁扣','拼接','榫卯','表面','耐磨','施工','养护']);
  if(id==='space')return article.category==='栖境'||muchiTextIncludes(text,['空间','客厅','卧室','茶室','家具','地板','居住','家']);
  if(id==='aesthetic')return article.category==='木语'||article.category==='短札'||muchiTextIncludes(text,['审美','传统','现代','东方','自然','留白','文化','时间']);
  return true;
}

function getMuchiFilteredArticles(data){
  return (data.articles||[]).slice().reverse().filter(function(article){
    if(muchiActiveCategory!=='all'&&getMuchiSlug(article)!==muchiActiveCategory)return false;
    if(muchiActiveProblem!=='all'&&!matchesMuchiProblem(article,muchiActiveProblem))return false;
    return true;
  });
}

function getMuchiArticleById(data,id){
  return (data.articles||[]).find(function(item){return item.id===id})||null;
}

function getMuchiShortText(text,limit){
  text=String(text||'').trim();
  limit=limit||72;
  return text.length>limit?text.slice(0,limit-1)+'…':text;
}

function getMuchiCardTitle(title){
  return String(title||'').replace(/^.*?：/,'');
}

function updateMuchiFilterState(){
  document.querySelectorAll('[data-muchi-cat]').forEach(function(btn){
    btn.classList.toggle('active',btn.getAttribute('data-muchi-cat')===muchiActiveCategory&&muchiActiveProblem==='all');
  });
  document.querySelectorAll('[data-muchi-problem]').forEach(function(btn){
    btn.classList.toggle('active',btn.getAttribute('data-muchi-problem')===muchiActiveProblem);
  });
  document.querySelectorAll('[data-muchi-volume]').forEach(function(btn){
    btn.classList.toggle('active',btn.getAttribute('data-muchi-volume')===muchiActiveCategory&&muchiActiveProblem==='all');
  });
}

function scrollMuchiListIntoView(){
  var target=document.getElementById('muchiColumn');
  if(!target)return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setTimeout(function(){
    target.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  },40);
}

function initJournalPage(hash){
  ensureMuchiDataLoaded(function(){
    if(getBaseHash(window.location.hash||'#home')!=='#journal')return;
    if(!muchiInitialized){
      renderMuchiColumn();
      bindMuchiReader();
      muchiInitialized=true;
    }
    var targetHash=window.location.hash||hash||'#journal';
    if(targetHash&&targetHash.indexOf('#journal/muchi/')===0){
      openMuchiArticle(targetHash.replace('#journal/muchi/',''));
    }else{
      closeMuchiReader(false);
    }
  });
}

function renderMuchiColumn(){
  var data=getMuchiData();
  if(!data.articles.length)return;
  renderMuchiEntryBoard(data);
  renderMuchiFeatured(data);
  renderMuchiTabs(data);
  renderMuchiIssueList();
}

function renderMuchiEntryBoard(data){
  renderMuchiEditorPicks(data);
  renderMuchiQuestionGrid(data);
  renderMuchiVolumeGrid(data);
}

function renderMuchiEditorPicks(data){
  var wrap=document.getElementById('muchiEditorPicks');
  if(!wrap)return;
  var fallback=data.articles.slice(-3).reverse();
  var picks=['benyuan-05','bianmu-01','qijing-01'].map(function(id){return getMuchiArticleById(data,id)}).filter(Boolean);
  if(picks.length<3)picks=fallback;
  wrap.innerHTML=picks.slice(0,3).map(function(article,index){
    return '<button class="muchi-pick-card '+(index===0?'large':'')+'" type="button" data-muchi-id="'+escapeHTML(article.id)+'">'+
      '<span class="muchi-pick-img"><img src="'+escapeHTML(article.cover.path)+'" alt="'+escapeHTML(article.cover.alt||article.title)+'" loading="lazy" decoding="async"></span>'+
      '<span class="muchi-pick-copy">'+
        '<em>'+(index===0?'本月先读':'推荐阅读')+'</em>'+
        '<strong>'+escapeHTML(getMuchiCardTitle(article.title))+'</strong>'+
        '<small>'+escapeHTML(getMuchiShortText(article.excerpt,78))+'</small>'+
        '<i>阅读正文</i>'+
      '</span>'+
    '</button>';
  }).join('');
}

function renderMuchiQuestionGrid(data){
  var grid=document.getElementById('muchiQuestionGrid');
  if(!grid)return;
  grid.innerHTML=MUCHI_PROBLEM_GUIDES.map(function(guide){
    var count=(data.articles||[]).filter(function(article){return matchesMuchiProblem(article,guide.id)}).length;
    return '<button class="muchi-question-card" type="button" data-muchi-problem="'+escapeHTML(guide.id)+'">'+
      '<span>'+escapeHTML(guide.tag)+'</span>'+
      '<strong>'+escapeHTML(guide.title)+'</strong>'+
      '<small>'+escapeHTML(guide.desc)+'</small>'+
      '<em>'+String(count)+' 篇</em>'+
    '</button>';
  }).join('');
  updateMuchiFilterState();
}

function renderMuchiVolumeGrid(data){
  var grid=document.getElementById('muchiVolumeGrid');
  if(!grid)return;
  var counts=getMuchiCategoryCounts(data);
  grid.innerHTML=(data.categories||[]).map(function(cat){
    var img=cat.triptych&&cat.triptych.path?cat.triptych.path:'';
    return '<button class="muchi-volume-card" type="button" data-muchi-volume="'+escapeHTML(cat.slug)+'">'+
      (img?'<span class="muchi-volume-img"><img src="'+escapeHTML(img)+'" alt="" loading="lazy" decoding="async"></span>':'')+
      '<span class="muchi-volume-copy">'+
        '<em>'+escapeHTML(cat.label||'VOLUME')+'</em>'+
        '<strong>'+escapeHTML(cat.volumeTitle||cat.name)+'</strong>'+
        '<small>'+escapeHTML(cat.description||'')+'</small>'+
        '<i>'+String(counts[cat.slug]||0)+' 篇</i>'+
      '</span>'+
    '</button>';
  }).join('');
  updateMuchiFilterState();
}

function renderMuchiFeatured(data){
  var featured=document.getElementById('muchiFeatured');
  if(!featured)return;
  var latest=data.articles[data.articles.length-1];
  var issue=data.collection.currentIssue||latest.issue||{};
  featured.innerHTML=
    '<button class="muchi-mag-cover" type="button" data-muchi-id="'+escapeHTML(latest.id)+'">'+
      '<span class="muchi-mag-visual"><img src="'+escapeHTML(latest.cover.path)+'" alt="'+escapeHTML(latest.cover.alt)+'" loading="lazy" decoding="async"></span>'+
      '<span class="muchi-mag-copy">'+
        '<em>CURRENT ISSUE</em>'+
        '<strong>本月一篇</strong>'+
        '<small>痴木堂木作月刊 · SINCE 2024</small>'+
        '<b>'+escapeHTML(issue.display||latest.issue.display)+' / '+escapeHTML(issue.month||latest.issue.month)+'</b>'+
        '<span>'+escapeHTML(latest.title)+'</span>'+
        '<i>进入本月正文</i>'+
      '</span>'+
    '</button>';
}

function renderMuchiTabs(data){
  var tabs=document.getElementById('muchiTabs');
  if(!tabs)return;
  var counts=getMuchiCategoryCounts(data);
  var html='<button type="button" data-muchi-cat="all"><span>全刊</span><strong>全部</strong><em>'+data.articles.length+' 篇</em></button>';
  data.categories.forEach(function(cat){
    html+='<button type="button" data-muchi-cat="'+escapeHTML(cat.slug)+'"><span>'+escapeHTML(cat.volume||'卷')+'</span><strong>'+escapeHTML(cat.name)+'</strong><em>'+String(counts[cat.slug]||0)+' 篇</em></button>';
  });
  tabs.innerHTML=html;
  updateMuchiFilterState();
}

function renderMuchiIssueList(){
  var data=getMuchiData();
  var grid=document.getElementById('muchiGrid');
  var count=document.getElementById('muchiCount');
  var listMore=document.getElementById('muchiListMore');
  if(!grid)return;
  var articles=getMuchiFilteredArticles(data);
  var filtered=muchiActiveCategory!=='all'||muchiActiveProblem!=='all';
  var visible=(!filtered&&!muchiListExpanded)?articles.slice(0,8):articles;
  var title='最新文章';
  if(muchiActiveProblem!=='all')title=getMuchiProblemLabel(muchiActiveProblem);
  if(muchiActiveCategory!=='all'){
    var cat=getMuchiCategory(data,muchiActiveCategory);
    title=cat?(cat.volumeTitle||cat.name):'分卷目录';
  }
  if(count)count.textContent=visible.length+' / '+articles.length+' 篇 · '+title;
  if(!articles.length){
    grid.innerHTML='<div class="muchi-empty"><strong>暂无对应文章</strong><span>可切换问题或查看全刊目录。</span></div>';
  }else{
    grid.innerHTML=visible.map(function(article){
      return '<button class="muchi-issue-row" type="button" data-muchi-id="'+escapeHTML(article.id)+'">'+
        '<span class="muchi-issue-cover"><img src="'+escapeHTML(article.cover.path)+'" alt="'+escapeHTML(article.cover.alt)+'" loading="lazy" decoding="async"></span>'+
        '<span class="muchi-issue-no">'+escapeHTML(article.issue.display)+'<small>'+escapeHTML(formatMuchiDate(article.date))+'</small></span>'+
        '<span class="muchi-issue-copy">'+
          '<em>'+escapeHTML(getMuchiVolumeLabel(article))+' · '+escapeHTML(article.category)+'</em>'+
          '<strong>'+escapeHTML(getMuchiCardTitle(article.title))+'</strong>'+
          '<small>'+escapeHTML(getMuchiShortText(article.excerpt,92))+'</small>'+
        '</span>'+
        '<span class="muchi-issue-action">阅读</span>'+
      '</button>';
    }).join('');
  }
  if(listMore){
    if(!filtered&&!muchiListExpanded&&articles.length>visible.length){
      listMore.innerHTML='<button type="button" data-muchi-expand>展开全部 '+String(articles.length)+' 篇</button>';
    }else if(filtered){
      listMore.innerHTML='<button type="button" data-muchi-clear>回到全刊最新</button>';
    }else{
      listMore.innerHTML='';
    }
  }
  updateMuchiFilterState();
}

function renderMuchiGrid(){
  renderMuchiIssueList();
}

function bindMuchiReader(){
  var page=document.getElementById('page-journal');
  var reader=document.getElementById('muchiReader');
  if(page){
    page.addEventListener('click',function(e){
      var expand=e.target.closest('[data-muchi-expand]');
      if(expand){
        muchiListExpanded=true;
        renderMuchiIssueList();
        return;
      }
      var clear=e.target.closest('[data-muchi-clear]');
      if(clear){
        muchiActiveCategory='all';
        muchiActiveProblem='all';
        muchiListExpanded=false;
        renderMuchiIssueList();
        scrollMuchiListIntoView();
        return;
      }
      var problem=e.target.closest('[data-muchi-problem]');
      if(problem){
        muchiActiveProblem=problem.getAttribute('data-muchi-problem')||'all';
        muchiActiveCategory='all';
        muchiListExpanded=false;
        renderMuchiIssueList();
        scrollMuchiListIntoView();
        return;
      }
      var volume=e.target.closest('[data-muchi-volume]');
      if(volume){
        muchiActiveCategory=volume.getAttribute('data-muchi-volume')||'all';
        muchiActiveProblem='all';
        muchiListExpanded=false;
        renderMuchiIssueList();
        scrollMuchiListIntoView();
        return;
      }
      var cat=e.target.closest('[data-muchi-cat]');
      if(cat){
        muchiActiveCategory=cat.getAttribute('data-muchi-cat')||'all';
        muchiActiveProblem='all';
        muchiListExpanded=false;
        renderMuchiIssueList();
        return;
      }
      var card=e.target.closest('[data-muchi-id]');
      if(card){
        muchiReturnScrollY=window.scrollY||document.documentElement.scrollTop||0;
        navigate('#journal/muchi/'+card.getAttribute('data-muchi-id'),{preserveScroll:true});
      }
    });
  }
  if(reader){
    reader.addEventListener('click',function(e){
      var jump=e.target.closest('[data-muchi-reader-id]');
      if(jump)navigate('#journal/muchi/'+jump.getAttribute('data-muchi-reader-id'),{preserveScroll:true});
    });
  }
  document.querySelectorAll('[data-muchi-close]').forEach(function(el){
    el.addEventListener('click',function(){closeMuchiReader(true)});
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&reader&&reader.classList.contains('open'))closeMuchiReader(true);
  });
}

function getMuchiTriptychCopy(article){
  var map={
    benyuan:{
      title:'先看来处',
      lead:'从年轮、含水与生长痕迹，读懂木材稳定的底层原因。',
      points:['生长','结构','归土']
    },
    bianmu:{
      title:'辨其木性',
      lead:'木色、密度、纹理与气味，决定一块木进入空间的气质。',
      points:['木色','纹理','适配']
    },
    gongfa:{
      title:'工艺成器',
      lead:'锁扣、涂装、拼接与打磨，让木材从自然材料成为可用之材。',
      points:['加工','表面','稳定']
    },
    qijing:{
      title:'入境成家',
      lead:'采光、尺度、动线与软装，共同决定木地板的铺装方向。',
      points:['光线','尺度','秩序']
    },
    muyu:{
      title:'木有其韵',
      lead:'高级感不在堆叠，而在留白、比例与日久可感的温润。',
      points:['留白','比例','时间']
    },
    duanzha:{
      title:'惜木知止',
      lead:'理解天然木材的边界，才会真正善待每一寸纹理。',
      points:['敬畏','缺憾','长久']
    }
  };
  return map[getMuchiSlug(article)]||{
    title:'章节图谱',
    lead:'将文章里的木材知识转成可观察的视觉线索，帮助你更稳地判断材料。',
    points:['看材性','看空间','看工艺']
  };
}

function renderMuchiTriptych(article){
  if(!article.triptych||!article.triptych.path)return'';
  var copy=getMuchiTriptychCopy(article);
  var points=(copy.points||[]).map(function(point,index){
    return '<span><em>0'+String(index+1)+'</em>'+escapeHTML(point)+'</span>';
  }).join('');
  return '<figure class="muchi-triptych">'+
    '<div class="muchi-triptych-copy">'+
      '<em>CHAPTER ATLAS</em>'+
      '<strong>'+escapeHTML(copy.title)+'</strong>'+
      '<p>'+escapeHTML(copy.lead)+'</p>'+
    '</div>'+
    '<div class="muchi-triptych-visual">'+
      '<img src="'+escapeHTML(article.triptych.path)+'" alt="'+escapeHTML(article.title)+'章节图谱" loading="lazy" decoding="async">'+
    '</div>'+
    '<figcaption>'+points+'</figcaption>'+
  '</figure>';
}

function getMuchiSelectionNote(article){
  var title=article.title||'';
  if(title.indexOf('含水率')>-1)return'选地板时，不只看木色，也要看含水率控制。含水率稳定，后期起拱、开缝和变形风险才会更低。';
  if(title.indexOf('热胀冷缩')>-1)return'大面积通铺、地暖或南方潮湿环境，应优先看结构稳定性、伸缩缝预留和安装方案。';
  if(title.indexOf('地暖')>-1)return'地暖空间先看材料稳定、基材结构和安装系统，再决定木种与表面工艺。';
  if(title.indexOf('潮湿')>-1)return'潮湿地域用木，关键不在“绝对防水”，而在稳定结构、通风条件与日常维护。';
  if(title.indexOf('地板VS家具')>-1)return'地板承受踩踏、清洁与温湿变化，选材标准应比家具更重视稳定性和耐磨维护。';
  if(title.indexOf('黑胡桃')>-1||title.indexOf('橡木')>-1)return'木种没有绝对高低，适合的木色、硬度、纹理密度与空间气质，才是选材的核心。';
  if(title.indexOf('榫卯')>-1||title.indexOf('拼接')>-1)return'看工艺，最终要回到结构是否稳定、接缝是否干净，以及长期使用后是否容易维护。';
  var map={
    benyuan:'先理解木材的自然属性，再做产品选择；稳定性、纹理和色差，都来自树木生长本身。',
    bianmu:'辨木不是背木种名，而是把木色、密度、纹理、气味和维护成本放在同一张判断表里。',
    gongfa:'工艺决定木材如何进入日常生活。好的加工，应让天然质感更稳定，而不是遮盖木性。',
    qijing:'空间条件决定用木方向。采光、湿度、地暖、动线和软装色彩，都应一起考虑。',
    muyu:'原木的高级感不靠堆砌，靠比例、留白、光线和长期触摸后的温润变化。',
    duanzha:'天然木材有个性，也有边界。理解它的不完美，才能更长久地与它相处。'
  };
  return map[getMuchiSlug(article)]||'看完文章后，可以带着空间条件、木色偏好和维护习惯，再回到产品中心做筛选。';
}

function renderMuchiSelectionNote(article){
  return '<aside class="muchi-selection-note">'+
    '<span>选材小注</span>'+
    '<p>'+escapeHTML(getMuchiSelectionNote(article))+'</p>'+
  '</aside>';
}

function renderMuchiArticleBody(article){
  var byParagraph={};
  (article.inlineImages||[]).forEach(function(img){
    var index=Number(img.afterParagraph||3);
    if(!byParagraph[index])byParagraph[index]=[];
    byParagraph[index].push(img);
  });
  var html='';
  var triptychAfter=article.triptych?Number(article.triptych.afterParagraph||2):0;
  (article.body||[]).forEach(function(p,index){
    var paragraphNo=index+1;
    html+='<p>'+escapeHTML(p)+'</p>';
    if(paragraphNo===1&&article.editorNote){
      html+='<aside class="muchi-editor-note">'+
        '<span>'+escapeHTML(article.editorNote.label||'编辑手记')+'</span>'+
        '<strong>'+escapeHTML(article.editorNote.text||'')+'</strong>'+
      '</aside>';
    }
    if(paragraphNo===triptychAfter){
      html+=renderMuchiTriptych(article);
      html+=renderMuchiSelectionNote(article);
    }
    (byParagraph[paragraphNo]||[]).forEach(function(img){
      html+='<figure class="muchi-inline-figure '+escapeHTML(img.layout||'wide')+'">'+
        '<img src="'+escapeHTML(img.path)+'" alt="'+escapeHTML(img.alt)+'" loading="lazy" decoding="async">'+
        '<figcaption>'+escapeHTML(img.caption)+'</figcaption>'+
      '</figure>';
    });
  });
  return html;
}

function renderMuchiReaderNav(article,data){
  var nav=document.getElementById('muchiReaderNav');
  if(!nav)return;
  var list=data.articles||[];
  var index=list.findIndex(function(item){return item.id===article.id});
  var prev=list[index-1];
  var next=list[index+1];
  nav.innerHTML=
    '<button type="button" data-muchi-close>返回目录</button>'+
    (prev?'<button type="button" data-muchi-reader-id="'+escapeHTML(prev.id)+'"><span>上一篇</span><strong>'+escapeHTML(prev.title)+'</strong></button>':'<span></span>')+
    (next?'<button type="button" data-muchi-reader-id="'+escapeHTML(next.id)+'"><span>下一篇</span><strong>'+escapeHTML(next.title)+'</strong></button>':'<span></span>');
  nav.querySelectorAll('[data-muchi-close]').forEach(function(btn){
    btn.addEventListener('click',function(){closeMuchiReader(true)});
  });
}

function openMuchiArticle(id){
  var data=getMuchiData();
  var article=data.articles.find(function(item){return item.id===id});
  var reader=document.getElementById('muchiReader');
  if(!article||!reader)return;
  muchiReaderArticleId=article.id;
  document.getElementById('muchiReaderImg').src=article.cover.path;
  document.getElementById('muchiReaderImg').alt=article.cover.alt;
  var displayTitle=getMuchiDisplayTitle(article);
  document.getElementById('muchiReaderIssue').textContent=article.issue.display+' · '+article.issue.month;
  document.getElementById('muchiReaderMeta').textContent=article.issue.display+' · '+article.volume+' · '+(displayTitle.kicker||article.category)+' · '+formatMuchiDate(article.date);
  var readerTitle=document.getElementById('muchiReaderTitle');
  readerTitle.setAttribute('aria-label',article.title);
  if(displayTitle.lines.length){
    readerTitle.innerHTML=displayTitle.lines.map(function(line){return '<span class="title-line">'+escapeHTML(line)+'</span>'}).join('');
  }else{
    readerTitle.textContent=displayTitle.title;
  }
  var readerSubtitle=document.getElementById('muchiReaderSubtitle');
  readerSubtitle.textContent=displayTitle.subtitle;
  readerSubtitle.hidden=!displayTitle.subtitle;
  document.getElementById('muchiReaderExcerpt').textContent=article.excerpt;
  document.getElementById('muchiReaderBody').innerHTML=renderMuchiArticleBody(article);
  document.getElementById('muchiReaderQuote').textContent=article.conclusion;
  renderMuchiReaderNav(article,data);
  reader.classList.add('open');
  reader.setAttribute('aria-hidden','false');
  document.body.classList.add('muchi-reader-open');
  var panel=reader.querySelector('.muchi-reader-panel');
  if(panel)panel.scrollTop=0;
}

function closeMuchiReader(updateHash){
  var reader=document.getElementById('muchiReader');
  if(!reader)return;
  if(updateHash){
    navigate('#journal',{preserveScroll:true});
    return;
  }
  var wasOpen=reader.classList.contains('open');
  reader.classList.remove('open');
  reader.setAttribute('aria-hidden','true');
  document.body.classList.remove('muchi-reader-open');
  muchiReaderArticleId='';
  if(wasOpen&&muchiReturnScrollY){
    window.setTimeout(function(){window.scrollTo(0,muchiReturnScrollY)},40);
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',function(){
  handleHash();
  document.documentElement.removeAttribute('data-initial-route');
});

// ===== QUIET INTERACTIONS =====
document.addEventListener('DOMContentLoaded',function(){
  var heroVideo=document.getElementById('heroVideo');
  if(heroVideo){
    var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarseMobile=window.matchMedia&&window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
    var connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    var saveData=connection&&connection.saveData;
    var slowNetwork=connection&&/(^|-)2g|3g/i.test(connection.effectiveType||'');
    var heroVideoHydrated=false;
    var fadeSeconds=.5;
    var rafId=null;
    function setHeroVideoOpacity(){
      var duration=heroVideo.duration||0;
      var current=heroVideo.currentTime||0;
      var opacity=1;
      if(duration>fadeSeconds*2){
        if(current<fadeSeconds) opacity=current/fadeSeconds;
        else if(duration-current<fadeSeconds) opacity=Math.max(0,(duration-current)/fadeSeconds);
      }
      heroVideo.style.opacity=String(Math.max(0,Math.min(1,opacity*.38)));
      rafId=requestAnimationFrame(setHeroVideoOpacity);
    }
    function hydrateHeroVideo(){
      if(heroVideoHydrated) return;
      heroVideoHydrated=true;
      var poster=heroVideo.getAttribute('data-poster');
      if(poster&&!heroVideo.getAttribute('poster')) heroVideo.setAttribute('poster',poster);
      var src=heroVideo.getAttribute('data-src');
      if(src&&!heroVideo.getAttribute('src')){
        heroVideo.setAttribute('src',src);
        heroVideo.load();
      }
      heroVideo.play().catch(function(){
        heroVideo.style.opacity='0';
      });
    }
    var autoHydrateTimer=null;
    function scheduleHeroHydration(delay){
      if(heroVideoHydrated||autoHydrateTimer)return;
      autoHydrateTimer=window.setTimeout(function(){
        autoHydrateTimer=null;
        if(document.hidden)return;
        hydrateHeroVideo();
      },delay);
    }
    function hydrateHeroVideoSoon(){
      scheduleHeroHydration(700);
    }
    if(reduceMotion||coarseMobile||saveData||slowNetwork){
      heroVideo.style.opacity=coarseMobile?'.22':'0';
    }else{
      heroVideo.addEventListener('ended',function(){
        heroVideo.style.opacity='0';
        window.setTimeout(function(){
          heroVideo.currentTime=0;
          heroVideo.play().catch(function(){});
        },100);
      });
      heroVideo.addEventListener('play',function(){
        if(!rafId) rafId=requestAnimationFrame(setHeroVideoOpacity);
      });
      document.addEventListener('visibilitychange',function(){
        if(document.hidden) heroVideo.pause();
        else if(heroVideoHydrated) heroVideo.play().catch(function(){});
      });
      var heroRoot=heroVideo.closest('.hero')||heroVideo;
      heroRoot.addEventListener('pointerenter',hydrateHeroVideoSoon,{once:true,passive:true});
      heroRoot.addEventListener('focusin',hydrateHeroVideoSoon,{once:true});
      window.addEventListener('scroll',function(){scheduleHeroHydration(1800)},{once:true,passive:true});
      window.addEventListener('load',function(){
        if('requestIdleCallback' in window){
          requestIdleCallback(function(){scheduleHeroHydration(9000)},{timeout:12000});
        }else{
          scheduleHeroHydration(12000);
        }
      },{once:true});
    }
  }

  var gallery=document.querySelector('.hero-gallery');
  if(gallery){
    gallery.addEventListener('mousemove',function(e){
      var rect=gallery.getBoundingClientRect();
      var x=(e.clientX-rect.left)/rect.width-.5;
      var y=(e.clientY-rect.top)/rect.height-.5;
      gallery.style.setProperty('--mx',x.toFixed(3));
      gallery.style.setProperty('--my',y.toFixed(3));
      gallery.style.transform='translate3d('+(x*8)+'px,'+(y*8)+'px,0)';
    });
    gallery.addEventListener('mouseleave',function(){
      gallery.style.transform='';
    });
  }

  var revealItems=document.querySelectorAll('.stats,.home-capabilities,.brand-film-section,.motion-atelier,.space-showcase-section,.section,.prod-page-header,.product-experience-bar,.space-product-guide,.prod-filters,.wood-academy,.journal-intro,.journal-topics,.journal-plan,.muchi-column,.muchi-home-cta,.case-space-hero,.case-space-toolbar,.space-gallery,.space-case-cta');
  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.12});
    revealItems.forEach(function(el){
      el.classList.add('reveal-item');
      observer.observe(el);
    });
  }
  initMotionAtelier();
  initSpaceExperience();
  initMobileFilterToggle();
  initProductFilterActions();
  initCorporateCta();
  initWoodAcademy();
  initJournalDirectory();
  initHomeJournalPreview();
  initPremiumInteractions();
  initImmersiveLuxe();
});

function initImmersiveLuxe(){
  var progress=document.querySelector('.luxe-scroll-progress');
  if(!progress){
    progress=document.createElement('div');
    progress.className='luxe-scroll-progress';
    progress.setAttribute('aria-hidden','true');
    document.body.appendChild(progress);
  }

  function updateProgress(){
    var doc=document.documentElement;
    var max=Math.max(1,doc.scrollHeight-window.innerHeight);
    var amount=Math.max(0,Math.min(1,(window.scrollY||doc.scrollTop||0)/max));
    progress.style.transform='scaleX('+amount.toFixed(4)+')';
  }

  updateProgress();
  window.addEventListener('scroll',updateProgress,{passive:true});
  window.addEventListener('resize',updateProgress);

  var luxeItems=document.querySelectorAll('.luxe-brief-strip,.selection-command,.contact-luxe-lead,.case-atlas-stats,.page-conversion');
  if('IntersectionObserver' in window){
    var luxeObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          luxeObserver.unobserve(entry.target);
        }
      });
    },{threshold:.14,rootMargin:'0px 0px -8% 0px'});
    luxeItems.forEach(function(el){
      el.classList.add('luxe-reveal');
      luxeObserver.observe(el);
    });
  }else{
    luxeItems.forEach(function(el){el.classList.add('is-visible')});
  }

  document.querySelectorAll('.luxe-brief-strip a,.selection-command-steps a,.contact-luxe-lead a').forEach(function(link){
    link.addEventListener('click',function(){
      document.body.classList.add('luxe-routing');
      window.setTimeout(function(){document.body.classList.remove('luxe-routing')},420);
    });
  });
}

function initMotionAtelier(){
  var videos=document.querySelectorAll('.motion-atelier video');
  if(!videos.length) return;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarseMobile=window.matchMedia&&window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  function hydrateVideo(v){
    if(v.dataset.ready==="true") return true;
    setDeferredVideoPoster(v);
    var src=v.getAttribute('data-src');
    if(!src) return false;
    v.src=src;
    v.dataset.ready="true";
    var card=v.closest('button');
    if(card) card.classList.add('is-video-ready');
    v.load();
    return true;
  }
  function playVideo(v){
    if(reduceMotion||coarseMobile) return;
    if(!hydrateVideo(v)) return;
    var attempt=v.play();
    if(attempt&&attempt.catch) attempt.catch(function(){});
  }
  function pauseVideo(v){
    v.pause();
  }
  videos.forEach(function(video){
    var card=video.closest('button');
    if(card){
      card.addEventListener('mouseenter',function(){playVideo(video)});
      card.addEventListener('mouseleave',function(){pauseVideo(video)});
      card.addEventListener('focus',function(){playVideo(video)});
      card.addEventListener('blur',function(){pauseVideo(video)});
    }
  });
  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var video=entry.target;
        if(!entry.isIntersecting){
          pauseVideo(video);
        }
      });
    },{threshold:.45,rootMargin:'0px 0px -10% 0px'});
    videos.forEach(function(video){observer.observe(video)});
  }
}

function initWoodAcademy(){
  var cards=document.querySelectorAll('.wood-family-card');
  if(!cards.length)return;
  cards.forEach(function(card){
    card.setAttribute('tabindex','0');
    card.addEventListener('click',function(e){
      if(e.target.closest('a,button'))return;
      cards.forEach(function(item){item.classList.remove('active')});
      card.classList.add('active');
    });
    card.addEventListener('focusin',function(){
      cards.forEach(function(item){item.classList.remove('active')});
      card.classList.add('active');
    });
    card.addEventListener('mousemove',function(e){
      var rect=card.getBoundingClientRect();
      card.style.setProperty('--px',((e.clientX-rect.left)/rect.width*100).toFixed(1)+'%');
      card.style.setProperty('--py',((e.clientY-rect.top)/rect.height*100).toFixed(1)+'%');
    });
  });
}

function initJournalDirectory(){
  var root=document.querySelector('#page-journal .journal-topics');
  if(!root||root.dataset.directoryReady==="true")return;
  root.dataset.directoryReady="true";
  root.classList.add('journal-directory');
  root.setAttribute('aria-label','痴木志本期目录');

  var filters=[
    {id:"all",label:"全部",note:"本期从空间、材料、工艺、审美与养护五条线索展开。"},
    {id:"space",label:"空间",note:"读光线、房间尺度与木色之间的安静关系。"},
    {id:"material",label:"材料",note:"读树种、纹理、色阶与一块木的天然脾性。"},
    {id:"craft",label:"工艺",note:"读表面、结构、安装与手作细节留下的秩序。"},
    {id:"culture",label:"审美",note:"读东方留白、器物距离与日常里的木韵。"},
    {id:"care",label:"养护",note:"读清洁、维护与长期陪伴一块木的方法。"}
  ];

  var items=[
    {no:"01",category:"space",label:"SPACE",title:"光线先于木色",desc:"用采光判断浅木、中棕与深木的边界。",href:"#cases",img:"journal/space-floor.webp",alt:"木地板空间尺度与光线关系",cta:"看铺装参考"},
    {no:"02",category:"material",label:"MATERIAL",title:"橡木为什么耐看",desc:"从纹理密度、稳定性和色差控制读懂橡木。",href:"#products",img:"journal/surface-wood-mosaic-lite.webp",alt:"多种木材色泽与纹理拼接",cta:"进入产品"},
    {no:"03",category:"origin",label:"ORIGIN",title:"从森林到家",desc:"选材、干燥、环保等级与交付之间的关系。",href:"#craft",img:"journal/home-hero-forest-door-lite.webp",alt:"森林与原木进入家的过程",cta:"读工艺"},
    {no:"04",category:"craft",label:"CRAFT",title:"表面触感档案",desc:"薄涂、染色、UV 与脚感如何共同决定质感。",href:"#craft",img:"journal/touch-wood.webp",alt:"木材表面工艺",cta:"看工艺"},
    {no:"05",category:"space",label:"PAVING",title:"通铺长板的秩序",desc:"客餐厅、卧室与廊道如何减少地面切割。",href:"#cases",img:"journal/paving-reference/ref-living-light.webp",alt:"明亮客厅浅木地板铺装参考",cta:"看案例"},
    {no:"06",category:"culture",label:"AESTHETIC",title:"东方留白与木纹",desc:"让地面成为空间的底色，而不是装饰噪音。",href:"#journal",img:"journal/culture-pine-painting.webp",alt:"东方松木画面与木作气质",cta:"继续阅读"},
    {no:"07",category:"craft",label:"STRUCTURE",title:"结构剖面笔记",desc:"基材、锁扣、厚度和稳定性如何影响使用。",href:"#craft",img:"journal/craft-section-shelf.webp",alt:"木作结构剖面与层次",cta:"看技术"},
    {no:"08",category:"care",label:"CARE",title:"木地板养护清单",desc:"清洁、补油、避水和局部修复的日常顺序。",href:"#service",img:"journal/paving-support/support-maintenance-kit.webp",alt:"木地板养护用品",cta:"看服务"},
    {no:"09",category:"material",label:"COLOR",title:"深色木不显压的条件",desc:"用层高、光源和软装明度控制深色地面。",href:"#cases",img:"journal/paving-reference/ref-study-shadow.webp",alt:"书房深色木地板铺装参考",cta:"看深色参考"},
    {no:"10",category:"culture",label:"OBJECT",title:"木与器物的距离",desc:"茶室、书房和会客厅里的木色留白法。",href:"#cases",img:"journal/paving-reference/ref-tea-room-dark.webp",alt:"暗场茶室木地板铺装参考",cta:"看茶室"},
    {no:"11",category:"space",label:"ROOM",title:"卧室更适合轻呼吸",desc:"休息区的木色应降低视觉重量和纹理干扰。",href:"#cases",img:"journal/paving-reference/ref-bedroom-light.webp",alt:"浅木卧室地板铺装参考",cta:"看卧室"},
    {no:"12",category:"craft",label:"DETAIL",title:"收边决定完成度",desc:"踢脚线、楼梯收口和门槛的细节语言。",href:"#service",img:"journal/paving-support/support-skirting-installed.webp",alt:"踢脚线安装效果",cta:"看安装"}
  ];

  var tabs=filters.map(function(filter){
    return '<button type="button" class="journal-directory-tab" data-journal-filter="'+filter.id+'" aria-pressed="'+(filter.id==="all"?"true":"false")+'">'+escapeHtml(filter.label)+'</button>';
  }).join("");
  var cards=items.map(function(item){
    return '<a class="journal-index-card" href="'+item.href+'" data-journal-category="'+item.category+'" data-journal-note="'+escapeHtml(item.desc)+'"><figure><img src="'+item.img+'" alt="'+escapeHtml(item.alt)+'" loading="lazy" decoding="async"></figure><div class="journal-index-copy"><span><b>'+item.no+'</b>'+escapeHtml(item.label)+'</span><h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.desc)+'</p><em>'+escapeHtml(item.cta)+'</em></div></a>';
  }).join("");

  root.innerHTML='<div class="journal-directory-head"><div class="journal-directory-title"><span>CHIMU INDEX</span><h3>本期目录</h3><p>从光线、木种、工艺、器物与养护五个侧面，翻阅木作进入生活的不同章节。</p></div><div class="journal-directory-tabs" role="group" aria-label="痴木志栏目筛选">'+tabs+'</div><div class="journal-directory-note"><strong id="journalDirectoryCount">'+items.length+'篇</strong><p id="journalDirectoryHint">本期从空间、材料、工艺、审美与养护五条线索展开。</p></div></div><div class="journal-index-grid">'+cards+'</div>';

  var buttons=root.querySelectorAll('[data-journal-filter]');
  var topicCards=root.querySelectorAll('[data-journal-category]');
  var count=root.querySelector('#journalDirectoryCount');
  var hint=root.querySelector('#journalDirectoryHint');

  function filterLabel(id){
    for(var i=0;i<filters.length;i++){
      if(filters[i].id===id)return filters[i];
    }
    return filters[0];
  }

  function setFilter(id){
    var meta=filterLabel(id);
    var visible=0;
    buttons.forEach(function(btn){
      var active=btn.getAttribute('data-journal-filter')===id;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
    topicCards.forEach(function(card){
      var show=id==="all"||card.getAttribute('data-journal-category')===id;
      card.hidden=!show;
      card.classList.toggle('is-visible-topic',show);
      if(show)visible++;
    });
    count.textContent=visible+'篇';
    hint.textContent=meta.note;
    root.dataset.activeFilter=id;
  }

  root.addEventListener('click',function(e){
    var button=e.target.closest&&e.target.closest('[data-journal-filter]');
    if(!button)return;
    setFilter(button.getAttribute('data-journal-filter'));
  });

  root.addEventListener('mouseover',function(e){
    var card=e.target.closest&&e.target.closest('[data-journal-category]');
    if(card&&!card.hidden){
      hint.textContent=card.getAttribute('data-journal-note')||hint.textContent;
    }
  });

  root.addEventListener('focusin',function(e){
    var card=e.target.closest&&e.target.closest('[data-journal-category]');
    if(card&&!card.hidden){
      hint.textContent=card.getAttribute('data-journal-note')||hint.textContent;
    }
  });

  root.addEventListener('mouseleave',function(){
    hint.textContent=filterLabel(root.dataset.activeFilter||"all").note;
  });

  setFilter("all");
}

function initHomeJournalPreview(){
  var root=document.querySelector('#page-home .home-journal-directory');
  if(!root||root.dataset.homeJournalReady==="true")return;
  root.dataset.homeJournalReady="true";
  var buttons=root.querySelectorAll('[data-home-journal-filter]');
  var cards=root.querySelectorAll('[data-home-journal-category]');
  if(!buttons.length||!cards.length)return;

  function setFilter(id){
    buttons.forEach(function(btn){
      var active=btn.getAttribute('data-home-journal-filter')===id;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
    cards.forEach(function(card){
      var show=id==="all"||card.getAttribute('data-home-journal-category')===id;
      card.hidden=!show;
      card.classList.toggle('is-visible-topic',show);
    });
    root.dataset.activeFilter=id;
  }

  root.addEventListener('click',function(e){
    var button=e.target.closest&&e.target.closest('[data-home-journal-filter]');
    if(!button)return;
    setFilter(button.getAttribute('data-home-journal-filter'));
  });

  setFilter('all');
}

function initPremiumInteractions(){
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pressableSelector=[
    'a','button','.chip','.pcard','.series-card','.series-tab','.case-card','.space-card','.space-feature-card','.space-gallery-card','.journal-topic',
    '.journal-hero-card','.journal-mini-card','.craft-item','.service-card','.phase-card-header',
    '.contact-card','.detail-card','.plan-grid div','.wood-family-card','.brand-film-card','.motion-feature','.motion-tile',
    '.space-shortcut','.case-filter-tab','.prod-clear-filter','.fixed-action-rail a','.fixed-action-rail button','.mobile-action-bar a'
  ].join(',');
  var motionCardSelector=[
    '.case-card','.space-card','.space-feature-card','.space-gallery-card','.journal-topic','.craft-item','.service-card','.phase-card','.contact-card',
    '.detail-card','.plan-grid div','.wood-family-card','.space-shortcut','.brand-film-card','.motion-feature','.motion-tile',
    '.pcard','.product-experience-bar','.space-product-guide'
  ].join(',');

  document.querySelectorAll('.phase-card-header').forEach(function(header){
    header.onclick=null;
    header.removeAttribute('onclick');
    header.setAttribute('role','button');
    header.setAttribute('tabindex','0');
    header.setAttribute('aria-expanded',header.parentElement.classList.contains('open')?'true':'false');
  });

  document.addEventListener('click',function(e){
    var phaseHeader=e.target.closest('.phase-card-header');
    if(phaseHeader){
      var card=phaseHeader.parentElement;
      card.classList.toggle('open');
      phaseHeader.setAttribute('aria-expanded',card.classList.contains('open')?'true':'false');
    }

    if(reduceMotion) return;
    var target=e.target.closest(pressableSelector);
    if(!target||target.closest('.prod-drawer')&&target.classList.contains('drawer-scene')) return;
    var rect=target.getBoundingClientRect();
    if(!rect.width||!rect.height) return;
    target.classList.add('is-pressed');
    window.setTimeout(function(){target.classList.remove('is-pressed')},180);
    var ripple=document.createElement('span');
    ripple.className='click-ripple';
    ripple.style.left=(e.clientX-rect.left)+'px';
    ripple.style.top=(e.clientY-rect.top)+'px';
    target.appendChild(ripple);
    window.setTimeout(function(){if(ripple.parentNode) ripple.parentNode.removeChild(ripple)},700);
  });

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      closeMobileNav();
      closeBrandFilm();
      closeSpaceCase();
      closeDrawer();
      if(isProductFilterRail()) setMobileFilterGroup(null);
      return;
    }
    if(e.key!=='Enter'&&e.key!==' ') return;
    var phaseHeader=e.target.closest&&e.target.closest('.phase-card-header');
    if(!phaseHeader) return;
    e.preventDefault();
    phaseHeader.click();
  });

  if(!reduceMotion&&window.matchMedia&&window.matchMedia('(hover: hover)').matches){
    document.addEventListener('pointermove',function(e){
      var card=e.target.closest(motionCardSelector);
      if(!card) return;
      var rect=card.getBoundingClientRect();
      var x=((e.clientX-rect.left)/rect.width*100).toFixed(2)+'%';
      var y=((e.clientY-rect.top)/rect.height*100).toFixed(2)+'%';
      card.style.setProperty('--mx',x);
      card.style.setProperty('--my',y);
    });
    document.addEventListener('pointerleave',function(e){
      var card=e.target.closest&&e.target.closest(motionCardSelector);
      if(!card) return;
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    },true);
  }
}
