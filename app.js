// ===== ROUTING =====
var ROUTES=['#home','#products','#series','#craft','#journal','#cases','#about','#service','#contact'];

function navigate(hash){
  if(ROUTES.indexOf(hash)<0) hash='#not-found';
  window.location.hash=hash;
  updateNav(hash);
  showPage(hash);
  if(hash==='#products') initProductsPage();
  if(hash==='#series') initSeriesPage();
  if(hash==='#craft') initCraftPage();
}

function updateNav(hash){
  document.querySelectorAll('.nav-links a').forEach(function(a){
    a.classList.toggle('active',a.getAttribute('href')===hash);
  });
  closeMobileNav();
}

function showPage(hash){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  var pageId='page-'+hash.replace('#','');
  var page=document.getElementById(pageId);
  if(!page) page=document.getElementById('page-not-found');
  document.body.classList.add('route-changing');
  if(page){page.classList.add('active');window.scrollTo(0,0)}
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
  var backdrop=document.getElementById('navBackdrop');
  if(navLinks) navLinks.classList.remove('open');
  if(hamburger){
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded','false');
  }
  if(backdrop) backdrop.classList.remove('open');
  document.body.classList.remove('nav-open');
}

function openMobileNav(){
  var navLinks=document.getElementById('navLinks');
  var hamburger=document.getElementById('hamburger');
  var backdrop=document.getElementById('navBackdrop');
  if(navLinks) navLinks.classList.add('open');
  if(hamburger){
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded','true');
  }
  if(backdrop) backdrop.classList.add('open');
  document.body.classList.add('nav-open');
}

var mobileMenuButton=document.getElementById('hamburger');
var mobileMenuBackdrop=document.getElementById('navBackdrop');

if(mobileMenuButton){
  mobileMenuButton.addEventListener('click',function(){
    var navLinks=document.getElementById('navLinks');
    if(navLinks&&navLinks.classList.contains('open')) closeMobileNav();
    else openMobileNav();
  });
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

// Handle initial hash
function handleHash(){
  var hash=window.location.hash||'#home';
  navigate(hash);
}
window.addEventListener('hashchange',handleHash);

// ===== PRODUCT DATA & FILTERING =====
var SPACE_MEDIA=[
  {
    id:"living-oak",
    mediaType:"image",
    src:"journal/case-family-room.webp",
    alt:"客厅橡木地板与柔和家具空间",
    title:"客厅里的安静底色",
    spaceType:"客厅",
    wood:"橡木",
    series:"境系列",
    summary:"浅橡木适合大面积客餐厅，它让光线停留得更柔和，也让家具、墙面和人的动线自然分层。",
    productFilter:{series:"境系列",wood:"橡木"},
    journalLink:"#journal"
  },
  {
    id:"bedroom-ash",
    mediaType:"image",
    src:"journal/case-light.webp",
    alt:"卧室浅橡木地板与自然光",
    title:"卧室需要更轻的呼吸感",
    spaceType:"卧室",
    wood:"橡木",
    series:"悦系列",
    summary:"浅橡木能降低卧室视觉重量，适合柔和织物、低饱和墙面和简洁收纳系统。",
    productFilter:{series:"悦系列",wood:"橡木"},
    journalLink:"#journal"
  },
  {
    id:"study-walnut",
    mediaType:"image",
    src:"journal/case-villa.webp",
    alt:"书房深色木地板与沉静空间",
    title:"书房的沉静与尺度",
    spaceType:"书房",
    wood:"黑胡桃",
    series:"境系列",
    summary:"深色木纹可以建立更稳定的专注氛围，适合书房、会客室和需要安静秩序的大宅区域。",
    productFilter:{series:"境系列",wood:"黑胡桃"},
    journalLink:"#journal"
  },
  {
    id:"tea-room-walnut",
    mediaType:"image",
    src:"journal/craft-lounge-board.webp",
    alt:"茶室休闲空间与木地板温润气质",
    title:"茶室里的时间纹理",
    spaceType:"茶室",
    wood:"胡桃木",
    series:"森系列",
    summary:"茶室更看重木材的静气和触感。温润深木色能承接器物、光影和留白。",
    productFilter:{series:"森系列",wood:"胡桃木"},
    journalLink:"#journal"
  },
  {
    id:"showroom-motion",
    mediaType:"video",
    src:"media/motion-atelier-01.mp4",
    poster:"media/brand-film-poster.jpg",
    alt:"展厅大板木纹动态影像",
    title:"展厅里的木纹尺度",
    spaceType:"展厅",
    wood:"欧橡",
    series:"森系列",
    summary:"展厅适合用大幅面影像呈现纹理连续性，让客户更快理解木色、比例和空间延展感。",
    productFilter:{series:"森系列",wood:"欧橡"},
    journalLink:"#craft"
  },
  {
    id:"commercial-system",
    mediaType:"image",
    src:"journal/culture-color-door.webp",
    alt:"商业空间木作与色彩设计",
    title:"商业空间的品牌底色",
    spaceType:"商业空间",
    wood:"橡木",
    series:"境系列",
    summary:"酒店、展厅和会所需要更稳定的材料叙事。木地板既是耐用界面，也是品牌氛围的一部分。",
    productFilter:{series:"境系列",wood:"橡木"},
    journalLink:"#service"
  }
];

var PRODUCTS=[], currentProd=null, COS_BASE='https://woodall-1307516706.cos.ap-guangzhou.myqcloud.com/';
fetch('./products_clean.json').then(function(r){return r.json()}).then(function(data){
  PRODUCTS=data.map(function(p){
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
  if(window.location.hash==='#products'){
    currentProd=PRODUCTS[0]||null;
    buildAllFilters();
    buildProds();
  }
}).catch(function(e){
  console.error('Product data load failed', e);
  var grid=document.getElementById("prodGrid");
  if(grid)grid.innerHTML='<div class="prod-empty"><span>LOAD FAILED</span><h3>产品数据暂时加载失败</h3><p>请刷新页面，或直接联系管家获取产品资料。</p><div class="page-cta"><a href="#contact" class="btn-primary">联系管家</a></div></div>';
});
var activeFilters={series:"全部",wood:"全部",board:"全部",surface:"全部",structure:"全部"};
var productsInitialized=false;
var activeSeriesKey=null;
var pendingSeriesKey=null;
var activeCaseSpaceType="全部";

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
  return matched?matched.series:series;
}

function resetProductFiltersForSeries(series){
  activeFilters.series=getProductSeriesValue(series);
  activeFilters.wood="全部";
  activeFilters.board="全部";
  activeFilters.surface="全部";
  activeFilters.structure="全部";
}

function goProductsBySeries(series){
  closeDrawer();
  resetProductFiltersForSeries(series);
  navigate("#products");
  setTimeout(function(){
    buildAllFilters();
    buildProds();
    var header=document.querySelector(".prod-page-header");
    if(header)header.scrollIntoView({behavior:"smooth",block:"start"});
  },0);
}

function goProductsByWood(wood){
  closeDrawer();
  activeFilters={series:"全部",wood:wood,board:"全部",surface:"全部",structure:"全部"};
  navigate("#products");
  setTimeout(function(){
    if(PRODUCTS.length){
      buildAllFilters();
      buildProds();
    }
    var header=document.querySelector(".prod-page-header");
    if(header)header.scrollIntoView({behavior:"smooth",block:"start"});
  },0);
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

function getSpaceTypes(){
  var seen={"全部":true},types=["全部"];
  SPACE_MEDIA.forEach(function(item){
    if(item.spaceType&&!seen[item.spaceType]){
      seen[item.spaceType]=true;
      types.push(item.spaceType);
    }
  });
  return types;
}

function renderSpaceMedia(item, className){
  var cls=className?className:"";
  if(item.mediaType==="video"){
    return '<video class="'+cls+'" muted playsinline loop preload="metadata" poster="'+escapeHtml(item.poster||"")+'" aria-label="'+escapeHtml(item.alt)+'"><source src="'+escapeHtml(item.src)+'" type="video/mp4"></video>';
  }
  return '<img class="'+cls+'" src="'+escapeHtml(item.src)+'" alt="'+escapeHtml(item.alt)+'" loading="lazy" decoding="async">';
}

function playSpaceVideos(scope){
  var root=scope||document;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion)return;
  root.querySelectorAll('.space-feature-card video, .space-card video, .space-gallery-card video, .space-case-media video').forEach(function(video){
    var attempt=video.play();
    if(attempt&&attempt.catch) attempt.catch(function(){});
  });
}

function renderHomeSpaces(){
  var feature=document.getElementById("homeSpaceFeature");
  var grid=document.getElementById("homeSpaceGrid");
  if(!feature||!grid)return;
  var lead=SPACE_MEDIA[0];
  feature.innerHTML='<button class="space-feature-card" type="button" data-space-id="'+lead.id+'" aria-label="查看'+escapeHtml(lead.title)+'">'+renderSpaceMedia(lead,'space-media')+'<span class="space-image-shade"></span><span class="space-logo-mark" aria-hidden="true"></span><div class="space-feature-copy"><span>'+escapeHtml(lead.spaceType)+' / '+escapeHtml(lead.wood)+'</span><h3>'+escapeHtml(lead.title)+'</h3><p>'+escapeHtml(lead.summary)+'</p><em>查看空间案例</em></div></button>';
  grid.innerHTML=SPACE_MEDIA.slice(1,6).map(function(item){
    return '<button class="space-card" type="button" data-space-id="'+item.id+'" aria-label="查看'+escapeHtml(item.title)+'">'+renderSpaceMedia(item,'space-media')+'<span class="space-image-shade"></span><div class="space-card-copy"><span>'+escapeHtml(item.spaceType)+' · '+escapeHtml(item.wood)+'</span><strong>'+escapeHtml(item.title)+'</strong><em>'+escapeHtml(item.series)+'</em></div></button>';
  }).join("");
  playSpaceVideos(document.getElementById("homeSpaceSection"));
}

function renderProductSpaceShortcuts(){
  var el=document.getElementById("prodSpaceShortcuts");
  if(!el)return;
  el.innerHTML=SPACE_MEDIA.map(function(item){
    return '<button class="space-shortcut" type="button" data-space-id="'+item.id+'" aria-label="按'+escapeHtml(item.spaceType)+'筛选产品"><span>'+escapeHtml(item.spaceType)+'</span><em>'+escapeHtml(item.wood)+' / '+escapeHtml(item.series)+'</em></button>';
  }).join("");
}

function renderCaseFilters(){
  var el=document.getElementById("caseSpaceFilters");
  if(!el)return;
  el.innerHTML=getSpaceTypes().map(function(type){
    return '<button class="case-filter-tab'+(type===activeCaseSpaceType?' active':'')+'" type="button" data-space-type="'+escapeHtml(type)+'">'+escapeHtml(type)+'</button>';
  }).join("");
}

function renderCaseGallery(){
  var el=document.getElementById("caseSpaceGallery");
  if(!el)return;
  var list=SPACE_MEDIA.filter(function(item){return activeCaseSpaceType==="全部"||item.spaceType===activeCaseSpaceType});
  el.innerHTML=list.map(function(item,index){
    var large=index===0&&activeCaseSpaceType==="全部"?" large":"";
    return '<button class="space-gallery-card'+large+'" type="button" data-space-id="'+item.id+'" aria-label="打开'+escapeHtml(item.title)+'案例">'+renderSpaceMedia(item,'space-media')+'<span class="space-image-shade"></span><span class="space-logo-mark" aria-hidden="true"></span><div class="space-gallery-copy"><span>'+escapeHtml(item.spaceType)+' · '+escapeHtml(item.wood)+'</span><h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.summary)+'</p><em>'+escapeHtml(item.series)+' · 查看详情</em></div></button>';
  }).join("");
  playSpaceVideos(el);
}

function applyProductFilterObject(filter){
  filter=filter||{};
  activeFilters=resolveProductFilterObject(filter);
  closeSpaceCase();
  navigate("#products");
  setTimeout(function(){
    if(PRODUCTS.length){
      buildAllFilters();
      buildProds();
    }
    renderProductSpaceShortcuts();
    var header=document.querySelector(".prod-page-header");
    if(header)header.scrollIntoView({behavior:"smooth",block:"start"});
  },0);
}

function openSpaceCase(id){
  var item=getSpaceById(id);
  var modal=document.getElementById("spaceCaseModal");
  var media=document.getElementById("spaceCaseMedia");
  var copy=document.getElementById("spaceCaseCopy");
  if(!item||!modal||!media||!copy)return;
  media.innerHTML=renderSpaceMedia(item,'space-case-asset')+'<span class="space-image-shade"></span><span class="space-logo-mark" aria-hidden="true"></span>';
  copy.innerHTML='<span>SPACE CASE / '+escapeHtml(item.spaceType)+'</span><h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.summary)+'</p><dl><div><dt>推荐木种</dt><dd>'+escapeHtml(item.wood)+'</dd></div><div><dt>适配系列</dt><dd>'+escapeHtml(item.series)+'</dd></div></dl><div class="page-cta"><button class="btn-primary" type="button" data-case-products="'+item.id+'">查看相关产品</button><a class="btn-secondary" href="'+escapeHtml(item.journalLink||"#journal")+'">阅读木作内容</a><a class="btn-secondary" href="#contact">预约咨询</a></div>';
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("space-case-open");
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
    var tab=e.target.closest(".case-filter-tab");
    if(tab){
      activeCaseSpaceType=tab.getAttribute("data-space-type")||"全部";
      renderCaseFilters();
      renderCaseGallery();
      return;
    }
    var caseLink=e.target.closest(".space-case-copy a[href^='#']");
    if(caseLink){
      closeSpaceCase();
      return;
    }
    var productBtn=e.target.closest("[data-case-products]");
    if(productBtn){
      e.preventDefault();
      var caseItem=getSpaceById(productBtn.getAttribute("data-case-products"));
      if(caseItem)applyProductFilterObject(caseItem.productFilter);
      return;
    }
    var mediaCard=e.target.closest("[data-space-id]");
    if(mediaCard){
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
  {id:"H05",route:"#home",page:"首页",selector:"#page-home .brand-film-card",title:"品牌故事影片封面",asset:"media/brand-story-wood-ring.webp"},
  {id:"M01",route:"#home",page:"首页",selector:"#page-home .motion-feature",title:"WOOD ALL MOTION 主视频",asset:"media/motion-atelier-01.mp4"},
  {id:"M02",route:"#home",page:"首页",selector:"#page-home .motion-tile[data-video-src='media/motion-atelier-02.mp4']",title:"影像小卡 02",asset:"media/motion-atelier-02.mp4"},
  {id:"M03",route:"#home",page:"首页",selector:"#page-home .motion-tile[data-video-src='media/motion-atelier-03.mp4']",title:"影像小卡 03",asset:"media/motion-atelier-03.mp4"},
  {id:"M04",route:"#home",page:"首页",selector:"#page-home .motion-tile[data-video-src='media/motion-atelier-04.mp4']",title:"影像小卡 04",asset:"media/motion-atelier-04.mp4"},
  {id:"S01",route:"#home",page:"首页",selector:"#homeSpaceFeature [data-space-id='living-oak']",title:"空间应用主图：客厅",asset:"journal/case-family-room.webp"},
  {id:"S02",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='bedroom-ash']",title:"空间应用卡：卧室",asset:"journal/case-light.webp"},
  {id:"S03",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='study-walnut']",title:"空间应用卡：书房",asset:"journal/case-villa.webp"},
  {id:"S04",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='tea-room-walnut']",title:"空间应用卡：茶室",asset:"journal/craft-lounge-board.webp"},
  {id:"S05",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='showroom-motion']",title:"空间应用卡：展厅视频",asset:"media/motion-atelier-01.mp4"},
  {id:"S06",route:"#home",page:"首页",selector:"#homeSpaceGrid [data-space-id='commercial-system']",title:"空间应用卡：商业空间",asset:"journal/culture-color-door.webp"},
  {id:"H06",route:"#home",page:"首页",selector:"#page-home .design-media-panel",title:"木作内容主入口大图",asset:"journal/case-lake-residence.webp"},
  {id:"H07",route:"#home",page:"首页",selector:"#page-home .design-mini-card:nth-child(1)",title:"首页内容入口：材料触感",asset:"journal/craft-soft-touch.webp"},
  {id:"H08",route:"#home",page:"首页",selector:"#page-home .design-mini-card:nth-child(2)",title:"首页内容入口：森林来源",asset:"journal/forest-origin.webp"},
  {id:"H09",route:"#home",page:"首页",selector:"#page-home .design-mini-card:nth-child(3)",title:"首页内容入口：光线脚感",asset:"journal/craft-light-step.webp"},
  {id:"P01",route:"#products",page:"产品中心",selector:"#page-products .space-product-guide",title:"按空间选地板快捷入口区",asset:"SPACE_MEDIA"},
  {id:"P02",route:"#products",page:"产品中心",selector:"#page-products #prodGrid",title:"产品缩略图网格（由产品数据生成）",asset:"product-images-thumb/*"},
  {id:"T01",route:"#craft",page:"工艺技术",selector:"#page-craft .craft-editorial",title:"工艺页头图",asset:"journal/craft-hand.webp"},
  {id:"T02",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(1)",title:"工艺卡 01",asset:"journal/craft-parquet-system.png"},
  {id:"T03",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(2)",title:"工艺卡 02",asset:"journal/craft-stone-board.png"},
  {id:"T04",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(3)",title:"工艺卡 03",asset:"journal/craft-color-steps.png"},
  {id:"T05",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(4)",title:"工艺卡 04",asset:"journal/craft-table-object.png"},
  {id:"T06",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(5)",title:"工艺卡 05",asset:"journal/craft-eye-grain.png"},
  {id:"T07",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(6)",title:"工艺卡 06",asset:"journal/craft-barefoot-dark.png"},
  {id:"T08",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(7)",title:"工艺卡 07",asset:"journal/craft-section-line.png"},
  {id:"T09",route:"#craft",page:"工艺技术",selector:"#craftContent .craft-item:nth-child(8)",title:"工艺卡 08",asset:"journal/craft-material-blocks.png"},
  {id:"J01",route:"#journal",page:"木作志",selector:"#page-journal .journal-cover",title:"木作志封面",asset:"journal/craft-oriental-card.webp"},
  {id:"J02",route:"#journal",page:"木作志",selector:"#woodAcademy .wood-academy-media",title:"木材学堂主图",asset:"journal/wood-ring.webp"},
  {id:"J03",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic.large",title:"木作志卡片：空间灵感",asset:"journal/craft-warm-room.webp"},
  {id:"J04",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic:nth-child(2)",title:"木作志卡片：木材百科",asset:"journal/craft-material-blocks.webp"},
  {id:"J05",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic:nth-child(3)",title:"木作志卡片：从森林到家",asset:"journal/culture-pine-painting.webp"},
  {id:"J06",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic:nth-child(4)",title:"木作志卡片：工艺手记",asset:"journal/touch-wood.webp"},
  {id:"J07",route:"#journal",page:"木作志",selector:"#page-journal .journal-topic:nth-child(5)",title:"木作志卡片：全屋木作系统",asset:"journal/system-section-house.webp"},
  {id:"C01",route:"#cases",page:"空间灵感库",selector:"#caseSpaceGallery [data-space-id='living-oak']",title:"空间案例：客厅",asset:"journal/case-family-room.webp"},
  {id:"C02",route:"#cases",page:"空间灵感库",selector:"#caseSpaceGallery [data-space-id='bedroom-ash']",title:"空间案例：卧室",asset:"journal/case-light.webp"},
  {id:"C03",route:"#cases",page:"空间灵感库",selector:"#caseSpaceGallery [data-space-id='study-walnut']",title:"空间案例：书房",asset:"journal/case-villa.webp"},
  {id:"C04",route:"#cases",page:"空间灵感库",selector:"#caseSpaceGallery [data-space-id='tea-room-walnut']",title:"空间案例：茶室",asset:"journal/craft-lounge-board.webp"},
  {id:"C05",route:"#cases",page:"空间灵感库",selector:"#caseSpaceGallery [data-space-id='showroom-motion']",title:"空间案例：展厅视频",asset:"media/motion-atelier-01.mp4"},
  {id:"C06",route:"#cases",page:"空间灵感库",selector:"#caseSpaceGallery [data-space-id='commercial-system']",title:"空间案例：商业空间",asset:"journal/culture-color-door.webp"}
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
    var c=document.createElement("span");
    var isAlt=(group==="surface"||group==="structure");
    var isActive=v===activeFilters[group]||(group==="series"&&activeFilters[group]!=="全部"&&v.indexOf(activeFilters[group])===0);
    c.className="chip"+(isAlt?" alt":"")+(isActive?" active":"");
    c.textContent=v;
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

function buildProds(){
  var el=document.getElementById("prodGrid");el.innerHTML="";
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
  list.forEach(function(p){
    var card=document.createElement("div");
    card.className="pcard"+(currentProd&&currentProd.code===p.code?" active":"");
    card.setAttribute("role","button");
    card.setAttribute("tabindex","0");
    card.setAttribute("aria-label","查看产品 "+p.code+" "+p.wood+" 详情");
    card.innerHTML='<img src="'+p.img_b_thumb+'" loading="lazy" decoding="async" alt="'+p.code+' '+p.wood+' 木地板纹理"><span class="pname">'+p.code+' · '+p.wood+'</span>';
    card.onclick=function(){selectProd(p)};
    card.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();selectProd(p)}};
    el.appendChild(card);
  });
}

function clearProductFilters(){
  resetProductFiltersForSeries("全部");
  buildAllFilters();
  buildProds();
}

function updateFilterSummary(){
  var el=document.getElementById("filterSummary");
  if(!el)return;
  var labels={series:"系列",wood:"木种",board:"板材",surface:"表面",structure:"结构"};
  var selected=[];
  Object.keys(activeFilters).forEach(function(key){
    if(activeFilters[key]&&activeFilters[key]!=="全部"){
      selected.push(labels[key]+"："+activeFilters[key]);
    }
  });
  el.textContent=selected.length?selected.join(" / "):"全部产品";
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
  buildProds();
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
  if(idx>0){currentProd=list[idx-1];showProductInDrawer(currentProd);updateDrawerNav();}
}

function drawerNavNext(){
  var list=getFilteredList();
  if(!currentProd||list.length===0)return;
  var idx=-1;
  for(var i=0;i<list.length;i++){if(list[i].code===currentProd.code){idx=i;break;}}
  if(idx<list.length-1){currentProd=list[idx+1];showProductInDrawer(currentProd);updateDrawerNav();}
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
  function onWheel(e){
    if(e.deltaY>20)drawerNavNext();
    else if(e.deltaY<-20)drawerNavPrev();
  }
  drawer.addEventListener('touchstart',onTouchStart,{passive:true});
  drawer.addEventListener('touchmove',onTouchMove,{passive:true});
  drawer.addEventListener('touchend',onTouchEnd,{passive:true});
  drawer.addEventListener('wheel',onWheel,{passive:true});
  document.getElementById('drawerNavUp').onclick=drawerNavPrev;
  document.getElementById('drawerNavDown').onclick=drawerNavNext;
  drawerSwipeBinding={el:drawer,ts:onTouchStart,tm:onTouchMove,te:onTouchEnd,wh:onWheel};
}

function unbindDrawerSwipe(){
  if(!drawerSwipeBinding)return;
  var b=drawerSwipeBinding;
  b.el.removeEventListener('touchstart',b.ts);
  b.el.removeEventListener('touchmove',b.tm);
  b.el.removeEventListener('touchend',b.te);
  b.el.removeEventListener('wheel',b.wh);
  drawerSwipeBinding=null;
}

function showProductInDrawer(p){
  // Quick fade flash
  var bg=document.querySelector('.drawer-bg');
  bg.classList.add('switching');
  setTimeout(function(){bg.classList.remove('switching')},150);

  // Scene image (full screen bg)
  var sceneImg=document.getElementById('drawerScene');
  sceneImg.src=p.img_e_thumb||p.img_b_thumb||'';
  var hdS=new Image();hdS.onload=function(){sceneImg.src=hdS.src};
  if(p.img_e_hd)hdS.src=p.img_e_hd;
  else if(p.img_b_hd)hdS.src=p.img_b_hd;

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
    +'<a href="#contact" onclick="closeDrawer()">咨询这款 '+p.code+'</a>'
    +'<a class="secondary" href="#series" onclick="goSeriesIntro(\''+p.series+'\');return false;">查看'+getIntroSeriesKey(p.series)+'介绍</a>'
    +'<a class="secondary" href="#service" onclick="closeDrawer()">预约量尺与安装</a>'
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
  var initial=(pendingSeriesKey&&seriesData[pendingSeriesKey])?pendingSeriesKey:(activeSeriesKey&&seriesData[activeSeriesKey]?activeSeriesKey:keys[0]);
  keys.forEach(function(k,i){
    var btn=document.createElement('button');
    var index=i+1<10?'0'+(i+1):String(i+1);
    var count=countProductsBySeries(k);
    btn.className='series-tab'+(k===initial?' active':'');
    btn.setAttribute('data-index',index);
    btn.innerHTML='<span>'+k+'</span><small>'+(count?count+'款产品':'系列档案')+'</small>';
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
  var count=countProductsBySeries(key);
  var html='<div class="series-content active">';
  html+='<div class="series-hero">'
    +'<div class="series-hero-kicker">WOOD ALL SERIES</div>'
    +'<div class="series-hero-grid">'
    +'<div class="series-hero-copy"><h2>'+key+'</h2><p class="series-tagline"><strong>'+d.tagline+'</strong></p><p class="series-desc">'+d.hero+'</p></div>'
    +'<div class="series-hero-side"><span>'+(count||'--')+'</span><em>在售产品</em><button class="series-link-products" type="button" data-series="'+key+'">查看本系列产品</button><button class="series-link-contact" type="button">预约系列咨询</button></div>'
    +'</div></div>';
  html+='<div class="series-grid-detail">';
  d.features.forEach(function(f){
    html+='<div class="detail-card"><h4>'+f.title+'</h4><p>'+f.text+'</p></div>';
  });
  html+='</div></div>';
  document.getElementById('seriesContent').innerHTML=html;
  var productBtn=document.querySelector('.series-link-products');
  if(productBtn)productBtn.onclick=function(){goProductsBySeries(this.getAttribute('data-series'))};
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

function initCraftPage(){
  var html='';
  var craftImages=[
    'journal/craft-parquet-system.png','journal/craft-stone-board.png','journal/craft-color-steps.png','journal/craft-table-object.png',
    'journal/craft-eye-grain.png','journal/craft-barefoot-dark.png','journal/craft-section-line.png','journal/craft-material-blocks.png',
    'journal/craft-section-shelf.png','journal/craft-face-grain.png','journal/craft-floor-face.png','journal/craft-night-plank.png',
    'journal/craft-oriental-card.webp','journal/craft-ring-section.png','journal/craft-human-wood.png','journal/craft-wood-portrait-art.png'
  ];
  var craftTags=['LOCK','COATING','COLOR','SURFACE','MATERIAL','STABILITY','JOINERY','ECO'];
  craftData.forEach(function(item,i){
    html+='<div class="craft-item">';
    html+='<div class="craft-item-media"><img src="'+(craftImages[i]||craftImages[i%craftImages.length])+'" alt="'+item.title+'"></div>';
    html+='<div class="craft-item-header"><span class="num">'+String(i+1).padStart(2,'0')+'</span><div><em>'+craftTags[i%craftTags.length]+'</em><h3>'+item.title+'</h3></div></div>';
    html+='<div class="craft-item-body"><ul>';
    item.items.forEach(function(t){html+='<li>'+t+'</li>'});
    html+='</ul></div></div>';
  });
  document.getElementById('craftContent').innerHTML=html;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',function(){handleHash()});

// ===== QUIET INTERACTIONS =====
document.addEventListener('DOMContentLoaded',function(){
  var heroVideo=document.getElementById('heroVideo');
  if(heroVideo){
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
    heroVideo.play().catch(function(){
      heroVideo.style.opacity='0';
    });
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

  var revealItems=document.querySelectorAll('.stats,.home-capabilities,.brand-film-section,.motion-atelier,.space-showcase-section,.section,.prod-page-header,.product-experience-bar,.space-product-guide,.prod-filters,.wood-academy,.journal-intro,.journal-topics,.journal-plan,.case-space-hero,.case-space-toolbar,.space-gallery,.space-case-cta');
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
  initWoodAcademy();
  initPremiumInteractions();
});

function initMotionAtelier(){
  var videos=document.querySelectorAll('.motion-atelier video');
  if(!videos.length) return;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function playVideo(v){
    if(reduceMotion) return;
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
        if(entry.isIntersecting) playVideo(video);
        else pauseVideo(video);
      });
    },{threshold:.38});
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

function initPremiumInteractions(){
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pressableSelector=[
    'a','button','.chip','.pcard','.series-card','.series-tab','.case-card','.space-card','.space-feature-card','.space-gallery-card','.journal-topic',
    '.journal-hero-card','.journal-mini-card','.craft-item','.service-card','.phase-card-header',
    '.contact-card','.detail-card','.plan-grid div','.wood-family-card'
  ].join(',');
  var motionCardSelector=[
    '.case-card','.space-card','.space-feature-card','.space-gallery-card','.journal-topic','.craft-item','.service-card','.phase-card','.contact-card',
    '.detail-card','.plan-grid div','.wood-family-card','.space-shortcut'
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
    var ripple=document.createElement('span');
    ripple.className='click-ripple';
    ripple.style.left=(e.clientX-rect.left)+'px';
    ripple.style.top=(e.clientY-rect.top)+'px';
    target.appendChild(ripple);
    window.setTimeout(function(){if(ripple.parentNode) ripple.parentNode.removeChild(ripple)},700);
  });

  document.addEventListener('keydown',function(e){
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
