// ===== ROUTING =====
var ROUTES=['#home','#products','#series','#craft','#journal','#cases','#about','#service','#contact'];
var MOBILE_NAV_META={
  '#home':{eyebrow:'WOOD ALL',title:'痴木堂'},
  '#products':{eyebrow:'PRODUCT CENTER',title:'产品中心'},
  '#series':{eyebrow:'SERIES ARCHIVE',title:'系列介绍'},
  '#craft':{eyebrow:'CRAFT ARCHIVE',title:'工艺技术'},
  '#journal':{eyebrow:'WOOD ALL JOURNAL',title:'木作志'},
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
  paving({id:"gallery-library",src:"journal/paving-reference/ref-gallery-library.webp",alt:"展厅木地板与书墙空间参考",headline:"展厅藏木",subline:"材料入库",roomType:"展厅",colorTone:"中棕",styleTag:"商业雅奢",pattern:"宽板",mood:"沉静",wood:"橡木",series:"境系列",summary:"展厅需要让材料被看见。中棕地面能承接样板、书墙和灯光，让客户更快建立材质判断。",detailPoints:["空间观感：专业、稳重，适合材料展厅。","木色建议：中棕色不抢展陈。","铺法建议：宽板更能展示纹理尺度。"],support:["oakBrown","section"],productFilter:{series:"境系列",wood:"橡木"},featured:false}),
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
    return {
      code:p.code,wood:p.wood,board:p.board,surface:p.surface,structure:p.structure,spec:p.spec,thickness:p.thickness,width:p.width,length:p.length,base:p.base,grade:p.grade,series:p.series,
      img_b_thumb:fixPath(p.img_b),
      img_e_thumb:fixPath(p.img_e),
      img_b_hd:p.img_b?COS_BASE+'product-images/'+p.img_b.replace(/^.*[\\/]/,''):'',
      img_e_hd:p.img_e?COS_BASE+'product-images/'+p.img_e.replace(/^.*[\\/]/,''):''
    };
  });
}

function showProductDataError(e){
  console.error('Product data load failed', e);
  var grid=document.getElementById("prodGrid");
  if(grid)grid.innerHTML='<div class="prod-empty"><span>LOAD FAILED</span><h3>产品数据暂时加载失败</h3><p>请刷新页面，或直接联系管家获取产品资料。</p><div class="page-cta"><a href="#contact" class="btn-primary">联系管家</a></div></div>';
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
    btn.textContent=selected?"已入库":"入库";
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
    btn.textContent=selected?"已入库":"入库";
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
  feature.innerHTML='<button class="space-feature-card action-card" type="button" data-space-id="'+lead.id+'" aria-label="查看'+escapeHtml(lead.title)+'">'+renderSpaceMedia(lead,'space-media')+'<span class="space-image-shade"></span><span class="space-logo-mark" aria-hidden="true"></span><div class="space-feature-copy"><span>'+escapeHtml(lead.roomType)+' / '+escapeHtml(lead.colorTone)+' / '+escapeHtml(lead.pattern)+'</span><h3>'+escapeHtml(lead.title)+'</h3><p>'+escapeHtml(lead.summary)+'</p><em>入境查看</em></div></button>';
  grid.innerHTML=list.slice(1,8).map(function(item){
    return '<button class="space-card action-card" type="button" data-space-id="'+item.id+'" aria-label="查看'+escapeHtml(item.title)+'">'+renderSpaceMedia(item,'space-media')+'<span class="space-image-shade"></span><div class="space-card-copy"><span>'+escapeHtml(item.roomType)+' · '+escapeHtml(item.colorTone)+'</span><strong>'+escapeHtml(item.title)+'</strong><em>入境查看</em></div></button>';
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
    return '<article class="space-gallery-card action-card'+large+'" role="button" tabindex="0" data-space-id="'+item.id+'" aria-label="打开'+escapeHtml(item.title)+'铺装参考">'+renderSpaceMedia(item,'space-media')+'<span class="space-image-shade"></span><span class="space-logo-mark" aria-hidden="true"></span><button class="case-save-chip" type="button" data-case-save="'+escapeHtml(item.id)+'" aria-pressed="'+(selected?"true":"false")+'" aria-label="'+(selected?"已加入选材夹，点击移除":"加入选材夹")+'">'+renderCaseSaveIcon(selected)+'</button><div class="space-gallery-copy"><span>'+escapeHtml(item.roomType)+' · '+escapeHtml(item.colorTone)+' · '+escapeHtml(item.pattern)+'</span><h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.summary)+'</p><em>入境查看 / 同色产品</em></div></article>';
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
  copy.innerHTML='<span>PAVING ATLAS / '+escapeHtml(item.roomType)+'</span><h3>'+escapeHtml(item.title)+'</h3><strong class="space-case-subline">'+escapeHtml(item.subline)+'</strong><p>'+escapeHtml(item.summary)+'</p><div class="space-case-tags"><span>'+escapeHtml(item.colorTone)+'</span><span>'+escapeHtml(item.styleTag)+'</span><span>'+escapeHtml(item.pattern)+'</span><span>'+escapeHtml(item.mood)+'</span></div><dl><div><dt>推荐木种</dt><dd>'+escapeHtml(item.wood)+'</dd></div><div><dt>适配系列</dt><dd>'+escapeHtml(item.series)+'</dd></div></dl><div class="space-case-commentary">'+commentary+'</div><ul class="space-case-detail">'+details+'</ul><div class="page-cta"><button class="btn-primary" type="button" data-case-products="'+item.id+'">看相关产品</button><button class="btn-secondary" type="button" data-case-save="'+item.id+'">'+(isPavingSelected(item.id)?"已入库":"入库")+'</button><a class="btn-secondary" href="#contact">预约咨询</a></div>';
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
  {id:"J01",route:"#journal",page:"木作志",selector:"#page-journal .journal-cover",title:"木作志封面",asset:"journal/craft-oriental-card-lite.webp"},
  {id:"J02",route:"#journal",page:"木作志",selector:"#woodAcademy .wood-academy-media",title:"木材学堂主图",asset:"journal/craft-ring-section-lite.webp"},
  {id:"J03",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic.large",title:"木作志卡片：空间灵感",asset:"journal/space-floor.webp"},
  {id:"J04",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic:nth-child(2)",title:"木作志卡片：木材百科",asset:"journal/surface-wood-mosaic-lite.webp"},
  {id:"J05",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic:nth-child(3)",title:"木作志卡片：从森林到家",asset:"journal/home-hero-forest-door-lite.webp"},
  {id:"J06",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic:nth-child(4)",title:"木作志卡片：工艺手记",asset:"journal/touch-wood.webp"},
  {id:"J07",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic:nth-child(5)",title:"木作志卡片：全屋木作系统",asset:"journal/system-section-house.webp"},
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
    buildAllFilters();
    buildProds();
    return;
  }
  productsInitialized=true;
  currentProd=PRODUCTS[0];
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
  card.className="pcard action-card"+(active?" active":"")+(selected?" selected":"");
  card.dataset.productCode=p.code;
  card.setAttribute("role","button");
  card.setAttribute("tabindex","0");
  card.setAttribute("aria-label","查看产品 "+p.code+" "+p.wood+" 详情");
  card.innerHTML='<img src="'+escapeHtml(p.img_b_thumb)+'" loading="'+(eager?"eager":"lazy")+'" fetchpriority="'+(eager?"high":"low")+'" decoding="async" alt="'+escapeHtml(p.code+' '+p.wood+' 木地板纹理')+'"><span class="pname">'+escapeHtml(p.code)+' · '+escapeHtml(p.wood)+'</span><button class="product-save-chip" type="button" data-product-save="'+escapeHtml(p.code)+'" aria-pressed="'+(selected?"true":"false")+'" aria-label="'+(selected?"已加入选材夹，点击移除":"加入选材夹")+'">'+renderProductSaveIcon(selected)+'</button>';
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
  [p.img_e_thumb,p.img_b_thumb,p.img_e_hd,p.img_b_hd].forEach(function(src){
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
  info.innerHTML='<h3>'+p.code+'</h3><div class="d-meta">'+p.wood+' · '+p.surface+'</div>'
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
    +'<button class="secondary product-selection-action" type="button" data-product-save="'+escapeHtml(p.code)+'">'+(isProductSelected(p.code)?"已入库":"入库")+'</button>'
    +'<a href="#contact" onclick="closeDrawer()">预约选材 '+p.code+'</a>'
    +'<a class="secondary" href="#series" onclick="goSeriesIntro(\''+p.series+'\');return false;">看'+getIntroSeriesKey(p.series)+'</a>'
    +'<a class="secondary" href="#service" onclick="closeDrawer()">量尺安装</a>'
    +'</div>';
}

// ===== SERIES DATA =====
var seriesData={
  "境系列":{
    tagline:"高品质流量款 · 打破「低价=低质」的认知误区",
    hero:"境系列从产品原料、生产过程、产品验收三大环节实施标准化管控，采用德国豪迈高速开槽设备、意大利水性涂装工艺，全自动化生产线是该系列立足市场且优于同类产品的核心优势。",
    features:[
      {title:"无缝拼接技术",text:"采用比利时尤林林（Valinge）锁扣专利，拼装高低误差不超过0.02mm，实现「无缝地板」效果。"},
      {title:"环保性能",text:"胶水、涂料均为无醛添加级别，碳排放量仅为0.01-0.05mg/m²，达到F4星环保标准。"},
      {title:"工艺技术",text:"德国豪迈高速开槽设备、意大利水性涂装工艺、全自动化生产线。"},
      {title:"零度薄涂工艺",text:"0-1度哑光+薄涂多层+半透显纹，主打「见木不见漆」的原生质感。光泽度≤1°，总涂层厚度30-60μm。"},
      {title:"材料品质",text:"主要采用俄罗斯全桦基材、阿尔卑斯山橡木等优质木材。"},
      {title:"产品矩阵",text:"涵盖纯三层、全桦多层，打造一色多形的丰富产品组合，面向设计师和追求个性化定制的消费群体。"}
    ]
  },
  "森系列":{
    tagline:"国际联名款 · 全维度领先，赋能设计与体验",
    hero:"森系列的核心竞争力源自国际顶尖工艺背书，依托色彩工艺双巨头加持，与比利时禧拉挪佤（Ciranova）、瑞典博纳（Bona）达成战略合作；牵手美国宣伟（Sherwin-Williams），实现涂装体系精益求精。",
    features:[
      {title:"通体化染工艺（Ciranova）",text:"通过化学染料渗透到木材的导管和纤维内部，实现颜色均匀、与木材纹理深度融合的效果，不易出现色差、褪色，保留木材天然触感。"},
      {title:"宣伟UV漆（Sherwin-Williams）",text:"VOC极低（高端线<1g/L），零甲醛、净味设计。耐擦洗2万次+，漆膜硬度≥1H，远超行业HB标准。薄涂多层工艺，通透显纹，呈现肤感/哑光高级质感。"},
      {title:"专属色彩研发（Bona）",text:"联合瑞典博纳成立专属色彩研发部，依托博纳在木材色彩调配的百年经验，色彩选择更丰富、适配场景更广泛。"},
      {title:"结构稳定性（Dynea+Valinge）",text:"与芬兰太尔合作优化层间粘合工艺，联合瑞典威林格持续研发先进锁扣结构，有效避免潮湿、地暖环境下的变形问题。"}
    ]
  },
  "悦系列":{
    tagline:"意式简奢高端款 · 国内唯一将氮气工艺应用于木地板的系列",
    hero:"悦系列核心优势兼备原创设计、顶尖氮气工艺、N+1表面处理工艺，严选优质原料，恪守环保安全标准，同时提供全流程定制服务。表现力+功能性双重突破，区别于市场流通产品。",
    features:[
      {title:"172纳米氮气工艺",text:"源自德国IOT公司的UV固化「黑科技」，广泛应用于汽车、航空等高端领域。在氮气隔绝氧气环境下，利用172纳米准分子光照射UV涂料引发固化。光泽度低至3以下，表面硬度达4H以上，耐污抗指纹。"},
      {title:"N+1表面处理",text:"国内唯一应用于木地板的创新工艺。通过人工工具刻意处理+无氧浮装工艺组合，先塑造丰富肌理，再优化触感与视觉效果，实现超哑光、超润滑的肌肤触感。"},
      {title:"意式上色系统",text:"采用意大利沃兰塔纳米色浆技术+传统手工上色工艺，色牢度极强，不易黄变褪色。可实现烟熏、化变等多样化自然视觉效果。"}
    ]
  },
  "墨系列":{
    tagline:"现代深色系 · 稳重大宅质感",
    hero:"墨系列面向偏好深色木纹、沉稳空间和现代轻奢风格的用户，强调视觉秩序、空间压舱感与高级灰、石材、金属等材质的搭配能力。",
    features:[
      {title:"空间适配",text:"适合大平层、别墅、书房、会所与展厅等需要稳重气质的场景。"},
      {title:"色彩表达",text:"以深色、灰调、暖棕调为主，弱化浮夸纹理，强化整体空间的安定感。"},
      {title:"选型建议",text:"建议结合采光、墙面色彩和家具材质选择，深色产品更适合光线充足或面积较大的空间。"}
    ]
  },
  "匠系列":{
    tagline:"全屋一体化定制 · 工艺精湛+设计美学+空间一体化",
    hero:"匠系列传承意大利家居设计与工艺基因，聚焦中高端消费群体，以工艺领先性为核心支撑，打造一体化、高品质的家居空间解决方案。打破传统家居品类割裂，满足品质、美学与实用性的双重追求。",
    features:[
      {title:"全域同纹同色一体化",text:"依托高精度数控雕刻设备+手工雕刻双重工艺，实现地板、墙面、木门、柜体等多品类产品的纹路与颜色完全统一，打破传统家居品类间的视觉割裂。"},
      {title:"专利隐藏式榫卯结构",text:"无需胶黏剂辅助连接。抗拉力是传统钉接的1.8倍，抗剪切力达传统工艺的2.3倍，单组榫卯连接可承受500公斤以上拉力。针对性改善高端木种自然收缩开裂问题。"},
      {title:"意大利MDV饰面技术",text:"源自意大利的高端饰面技术，通过多维纹理还原与表面处理，让木材肌理更细腻、触感更舒适，同时增强表面耐磨性与抗污性。"},
      {title:"高端木种",text:"精选缅甸柚木、北美胡桃木、东南亚白柚木、沙比利、相思木等稀缺木种，实木表板厚度≥3.0mm。"}
    ]
  },
  "璞系列":{
    tagline:"高端原木与红木地板 · 30年原木深耕 · 15年地暖地板技术",
    hero:"璞系列专研高端原木与红木地板，核心优势集中在珍稀木种、稳定工艺、地暖适配、环保健康与美学设计。痴木堂在浙江南浔和广东中山设有原木地板工厂。",
    features:[
      {title:"珍稀木种",text:"全球直采FSC认证原木，优选200年以上活树芯材。非洲花梨（刺猬紫檀）、落腺豆（第九种红木）、巴拉圭紫檀等红木级产品，兼具收藏与增值潜力。"},
      {title:"108道全流程工序",text:"含12次片检、12次除尘、9底3面涂漆，逐片检测含水率。引进德国/日本ABB含水率测试仪，严控品质。"},
      {title:"抗变形专项技术",text:"长城抗变形技术（背栅工型结构）+燕尾榫卯技术（切断横向纤维）+双榫锁扣+四季调节锁扣，四重保障解决大材板变形难题。"},
      {title:"德国坚弗油漆",text:"纳米级改良树脂，兼顾弹性与硬度，透底性好。不遮盖木材天然纹理，提升木纹通透感与光泽度，环保指标符合国标与欧盟标准。"},
      {title:"恒温烘干与养生",text:"30天自然养生+42.8℃恒温活性烘干，避免高温破坏木纤维，保障木材尺寸稳定。"}
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
  {title:"Valinge 锁扣技术（境系列/森系列）",items:[
    "采用比利时尤林林（Valinge）或瑞典威林格（Valinge）锁扣专利，拼装高低误差不超过0.02mm，实现「无缝地板」拼接效果。",
    "安装便捷精准、拼接缝隙更小，既保障地面美观度，又增强使用过程中的稳固性，适配不同户型的安装需求。"
  ]},
  {title:"零度薄涂工艺（境系列）",items:[
    "光泽度≤1°（60°角测量），呈现极致哑光肤感，无反光、无塑料感。",
    "总涂层厚度控制在30-60μm，底漆2-3遍、面漆1-2遍，每层极薄（约5-15μm），保留木材天然触感。",
    "半透效果：介于清漆（全透）与实色漆（全遮）之间，用纳米色浆轻着色，均匀色差又不遮盖木纹导管。"
  ]},
  {title:"通体化染工艺 · Ciranova（森系列）",items:[
    "通过化学染料渗透到木材的导管和纤维内部，实现颜色均匀、与木材纹理深度融合的效果。",
    "与传统表面染色的区别：传统染色多停留在木材表层，颜色附着力和自然度相对较弱；通体化染不易出现色差、褪色，且能保留木材天然的触感。",
    "化变处理工艺：通过活化剂、化变水剂等与木材单宁酸发生氧化反应，实现自然老化效果，让纹理更立体、颜色更自然。活化剂产品采用有机天然成分，比常规氨水化变更绿色环保。"
  ]},
  {title:"宣伟 UV 漆 · Sherwin-Williams（森系列）",items:[
    "全球最大涂料制造商，赋予地板丝缎柔光的高级质感，漆膜硬度≥1H，远超行业HB标准。",
    "环保性：VOC极低（高端线<1g/L），零甲醛、净味设计，通过多项国际环保认证。",
    "耐用性：耐擦洗2万次+，具备抗紫外、防霉、抗裂性能，保色时长可达5-10年。",
    "薄涂多层工艺（总涂层厚度50-80μm），通透显纹，呈现肤感/哑光高级质感。",
    "快干技术，重涂间隔短，漆底合一，可反复拆装，适配多样安装场景。"
  ]},
  {title:"Bona 色彩研发（森系列）",items:[
    "瑞典博纳（Bona）是全球木地板涂装与养护领军品牌，百年木材色彩调配经验。",
    "痴木堂联合博纳成立专属色彩研发部，色彩选择更丰富、适配场景更广泛。",
    "借助博纳在环保涂装的技术优势，进一步提升产品环保等级，甲醛释放量远低于国标。"
  ]},
  {title:"172 纳米氮气工艺（悦系列）",items:[
    "工艺起源：源自德国IOT公司UV固化「黑科技」，广泛应用于汽车、航空等高端领域，后创新适配木地板表面处理。",
    "核心原理：在氮气隔绝氧气环境下（氧气浓度<100ppm），利用172纳米准分子光照射UV涂料引发固化。",
    "超哑光+肤感：涂层形成均匀细微褶皱纹理，光泽度低至3以下，接近零反光；触感细腻亲肤。",
    "表面硬度达4H以上：172nm准分子表面固化+高压汞灯全固化双重处理，涂层交联密度高。",
    "耐污抗指纹：氮气低温固化让涂层结构致密，搭配氟硅改性成分，表面张力极低，水渍油渍不易附着。",
    "环保性：氮气惰性环境+低温紫外光固化，无涂料分解挥发；对光引发剂依赖度低，减少残留与VOC释放。",
    "工艺步骤：涂料涂布→395nm LED预固化→172nm准分子氮气固化→高压汞灯全固化。"
  ]},
  {title:"N+1 表面处理工艺（悦系列）",items:[
    "国内唯一应用于木地板的创新工艺，通过人工工具刻意处理+无氧浮装工艺组合。",
    "肌理塑造：人工使用刮刀、喷砂、拉丝、雕刻等工具对木材表面进行刻意处理，呈现细腻或粗犷的纹理。",
    "质感优化：结合172纳米无氧浮装工艺，最终实现超哑光、超润滑的肌肤触感。"
  ]},
  {title:"意式上色系统 · 纳米色浆+手工（悦系列）",items:[
    "采用意大利沃兰塔先进纳米色浆技术，结合传统手工上色工艺，秉承「不烟熏、不化变」理念。",
    "色牢度极强，颜色稳定，不易黄变、不易褪色。",
    "高色彩饱和度，搭配纳米色浆技术，营造高端视觉享受。",
    "可实现烟熏、化变等多样化自然视觉效果，适配不同设计需求。"
  ]},
  {title:"全域同纹同色一体化（匠系列）",items:[
    "依托高精度数控雕刻设备+手工雕刻双重工艺，在实木基材上精准雕刻复杂纹理，充分还原木材天然肌理。",
    "核心优势：实现地板、墙面、木门、柜体等多品类产品的纹路与颜色完全统一，打破传统家居品类间的视觉割裂。",
    "兼容现代极简、新中式等多种风格，支持个性化造型定制，适配别墅、大平层、精品酒店等场景。"
  ]},
  {title:"专利隐藏式榫卯结构（匠系列）",items:[
    "采用专利隐藏式设计，通过榫卯结构精准咬合，无需胶黏剂辅助连接。",
    "实验验证：抗拉力是传统钉接的1.8倍；抗剪切力达传统工艺的2.3倍；单组榫卯可承受500公斤以上拉力。",
    "核心作用：针对性改善高端木种自然收缩开裂、各向异性脱层等物理缺陷；适配地暖、潮湿等复杂环境。"
  ]},
  {title:"长城抗变形技术（璞系列）",items:[
    "技术原理：背栅呈工型结构，切断木材横向纤维，释放横向变形应力；深型凹槽设计，通风透气，防止水汽积聚。",
    "核心价值：减少形变，提升稳定性，保障地板耐用性，保持居室干爽，优化人居体验。"
  ]},
  {title:"燕尾榫卯技术（璞系列）",items:[
    "针对超长超宽大材板设计，切断横向纤维结构，释放内部变形应力。",
    "配合双榫锁扣+四季调节锁扣，四重抗变形保障。四季调节锁扣可根据木材「湿胀干缩」特性，调节不同季节、气候、地域导致的变形量。"
  ]},
  {title:"108道全流程工序（璞系列）",items:[
    "核心环节：12次片检（严控瑕疵）、12次除尘（保障涂层附着力）、9底3面涂漆（强化防护与质感）。",
    "30天自然养生+42.8℃恒温活性烘干，避免高温破坏木纤维。",
    "德国坚弗环保耐磨漆：纳米级改良树脂，无异味，兼顾弹性与硬度，透底性好，易清洁，耐磨耐撞。",
    "九级控温技术：根据木种、产地、使用区域差异，精准调控木材含水率，做到「因材而控、因地而控」。"
  ]},
  {title:"进口全桦基材（全系列通用）",items:[
    "除部分引流产品外，多层系列产品均采用俄罗斯进口全桦基材，是中高端多层板材的标杆选择。",
    "极致稳定性：吸膨率仅为国标普通板材的1/5，经72小时水煮测试无分层；含水率控制精准（8±1%），适配南北方不同气候环境。",
    "卓越物理性能：硬度与静曲强度比普通国产基材高15%以上，静曲强度≥34MPa，弹性模量≥6000MPa；密度达680±20kg/m³。",
    "环保与美学：环保等级达ENF级，甲醛释放量≤0.015mg/m³；材质白净细腻，层次分明，保留天然山形纹与矿物线。"
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
var muchiReturnScrollY=0;
var muchiReaderArticleId='';
var muchiDataLoadPromise=null;
var MUCHI_DATA_SRC='journal/muchi_articles_data.min.js?v=asset-fallback-3';

function escapeHTML(value){
  return String(value||'').replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}

function formatMuchiDate(date){
  return String(date||'').replace(/-/g,'.');
}

function getMuchiData(){
  return window.MUCHI_ARTICLES_DATA||{collection:{},categories:[],articles:[]};
}

function setMuchiLoadingState(message,isError){
  var featured=document.getElementById('muchiFeatured');
  var tabs=document.getElementById('muchiTabs');
  var grid=document.getElementById('muchiGrid');
  var count=document.getElementById('muchiCount');
  var text=message||'木作志加载中...';
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
  setMuchiLoadingState('木作志加载中...');
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
      setMuchiLoadingState('木作志目录暂时加载失败，请刷新后重试。',true);
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

function initJournalPage(hash){
  ensureMuchiDataLoaded(function(){
    if(getBaseHash(window.location.hash||'#home')!=='#journal')return;
    if(!muchiInitialized){
      renderMuchiColumn();
      bindMuchiReader();
      muchiInitialized=true;
    }
    var targetHash=hash||window.location.hash||'#journal';
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
  renderMuchiFeatured(data);
  renderMuchiTabs(data);
  renderMuchiIssueList();
}

function renderMuchiFeatured(data){
  var featured=document.getElementById('muchiFeatured');
  if(!featured)return;
  var latest=data.articles[data.articles.length-1];
  var issue=data.collection.currentIssue||latest.issue||{};
  featured.innerHTML=
    '<button class="muchi-mag-cover" type="button" data-muchi-id="'+escapeHTML(latest.id)+'">'+
      '<span class="muchi-mag-visual"><img src="'+escapeHTML(latest.cover.path)+'" alt="'+escapeHTML(latest.cover.alt)+'"></span>'+
      '<span class="muchi-mag-copy">'+
        '<em>MUCHI JOURNAL</em>'+
        '<strong>木痴</strong>'+
        '<small>痴木堂木作月刊 · SINCE 2024</small>'+
        '<b>'+escapeHTML(issue.display||latest.issue.display)+' / '+escapeHTML(issue.month||latest.issue.month)+'</b>'+
        '<span>'+escapeHTML(latest.title)+'</span>'+
        '<i>READ CURRENT ISSUE</i>'+
      '</span>'+
    '</button>';
}

function renderMuchiTabs(data){
  var tabs=document.getElementById('muchiTabs');
  if(!tabs)return;
  var counts=getMuchiCategoryCounts(data);
  var html='<button type="button" class="active" data-muchi-cat="all"><span>全刊</span><strong>目录</strong><em>'+data.articles.length+' 篇</em></button>';
  data.categories.forEach(function(cat){
    html+='<button type="button" data-muchi-cat="'+escapeHTML(cat.slug)+'"><span>'+escapeHTML(cat.volume||'卷')+'</span><strong>'+escapeHTML(cat.name)+'</strong><em>'+String(counts[cat.slug]||0)+' 篇</em></button>';
  });
  tabs.innerHTML=html;
  tabs.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click',function(){
      muchiActiveCategory=this.getAttribute('data-muchi-cat');
      tabs.querySelectorAll('button').forEach(function(item){item.classList.remove('active')});
      this.classList.add('active');
      renderMuchiIssueList();
    });
  });
}

function renderMuchiIssueList(){
  var data=getMuchiData();
  var grid=document.getElementById('muchiGrid');
  var count=document.getElementById('muchiCount');
  if(!grid)return;
  var articles=data.articles.slice().reverse().filter(function(article){
    return muchiActiveCategory==='all'||getMuchiSlug(article)===muchiActiveCategory;
  });
  if(count)count.textContent=articles.length+' 篇文章 · '+(muchiActiveCategory==='all'?'全刊目录':'分卷目录');
  grid.innerHTML=articles.map(function(article){
    return '<button class="muchi-issue-row" type="button" data-muchi-id="'+escapeHTML(article.id)+'">'+
      '<span class="muchi-issue-cover"><img src="'+escapeHTML(article.cover.path)+'" alt="'+escapeHTML(article.cover.alt)+'" loading="lazy" decoding="async"></span>'+
      '<span class="muchi-issue-no">'+escapeHTML(article.issue.display)+'<small>'+escapeHTML(formatMuchiDate(article.date))+'</small></span>'+
      '<span class="muchi-issue-copy">'+
        '<em>'+escapeHTML(getMuchiVolumeLabel(article))+' · '+escapeHTML(article.category)+'</em>'+
        '<strong>'+escapeHTML(article.title)+'</strong>'+
        '<small>'+escapeHTML(article.excerpt)+'</small>'+
      '</span>'+
      '<span class="muchi-issue-action">READ</span>'+
    '</button>';
  }).join('');
}

function renderMuchiGrid(){
  renderMuchiIssueList();
}

function bindMuchiReader(){
  var column=document.getElementById('muchiColumn');
  var reader=document.getElementById('muchiReader');
  if(column){
    column.addEventListener('click',function(e){
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

function renderMuchiArticleBody(article){
  var byParagraph={};
  (article.inlineImages||[]).forEach(function(img){
    var index=Number(img.afterParagraph||3);
    if(!byParagraph[index])byParagraph[index]=[];
    byParagraph[index].push(img);
  });
  var html='';
  (article.body||[]).forEach(function(p,index){
    var paragraphNo=index+1;
    html+='<p>'+escapeHTML(p)+'</p>';
    if(paragraphNo===1&&article.editorNote){
      html+='<aside class="muchi-editor-note">'+
        '<span>'+escapeHTML(article.editorNote.label||'编辑手记')+'</span>'+
        '<strong>'+escapeHTML(article.editorNote.text||'')+'</strong>'+
      '</aside>';
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
  document.getElementById('muchiReaderIssue').textContent=article.issue.display+' · '+article.issue.month;
  document.getElementById('muchiReaderMeta').textContent=article.issue.display+' · '+article.volume+' '+article.category+' · '+formatMuchiDate(article.date);
  document.getElementById('muchiReaderTitle').textContent=article.title;
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
  root.setAttribute('aria-label','木作志杂志目录');

  var filters=[
    {id:"all",label:"全部",note:"以目录方式快速浏览木作志题材。"},
    {id:"space",label:"空间",note:"按房间、光线和铺法阅读空间灵感。"},
    {id:"material",label:"材料",note:"从木种、纹理、色阶理解产品选择。"},
    {id:"craft",label:"工艺",note:"把表面、结构和安装逻辑拆成可读条目。"},
    {id:"culture",label:"审美",note:"记录东方秩序、留白和器物关系。"},
    {id:"care",label:"养护",note:"整理清洁、维护和长期使用方法。"}
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

  root.innerHTML='<div class="journal-directory-head"><div class="journal-directory-title"><span>MAGAZINE INDEX</span><h3>按题材进入木作志</h3><p>像翻目录一样，从空间、材料、工艺、审美与养护进入阅读。</p></div><div class="journal-directory-tabs" role="group" aria-label="木作志题材筛选">'+tabs+'</div><div class="journal-directory-note"><strong id="journalDirectoryCount">'+items.length+'篇</strong><p id="journalDirectoryHint">以目录方式快速浏览木作志题材。</p></div></div><div class="journal-index-grid">'+cards+'</div>';

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
