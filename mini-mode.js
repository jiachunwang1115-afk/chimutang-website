(function(){
  'use strict';

  var query=new URLSearchParams(window.location.search);
  var isWeimob=query.get('channel')==='weimob';
  var requestedSeries=query.get('series')||'';
  var appointmentPath=query.get('appointment')||'';
  var SELECTION_V2='woodallSelection:v2';
  var PRODUCT_WORKSPACE='woodallProductWorkspace:v1';
  var originalGetBaseHash=window.getBaseHash;
  var originalNavigate=window.navigate;
  var originalSelectProd=window.selectProd;
  var originalCloseDrawer=window.closeDrawer;
  var originalDrawerPrev=window.drawerNavPrev;
  var originalDrawerNext=window.drawerNavNext;
  var originalGetFiltered=window.getFiltered;
  var originalClearFilters=window.clearProductFilters;
  var originalUpdateFilterSummary=window.updateFilterSummary;
  var originalBuildProds=window.buildProds;
  var originalAppendProductCards=window.appendProductCards;
  var originalCreateProductCard=window.createProductCard;
  var originalOpenDrawer=window.openDrawer;
  var originalShowProductInDrawer=window.showProductInDrawer;
  var originalCloseMuchiReader=window.closeMuchiReader;
  var originalOpenMuchiArticle=window.openMuchiArticle;
  var originalGetSelectionText=window.getPavingSelectionText;
  var productQuery='';
  var restoredProductWorkspace=false;
  var productDetailTimer=0;
  var muchiFavoriteRenderPending=false;
  var miniProductPageSize=24;
  var miniProductVisibleLimit=miniProductPageSize;
  var miniProductSignature='';
  var miniPreserveProductLimit=false;
  var MINI_SERIES=[
    {key:'境系列',code:'A3-B805',label:'境',mood:'清透与秩序',copy:'从浅木到自然棕，适合明亮、安静的日常空间。'},
    {key:'悦系列',code:'Q3-X802',label:'悦',mood:'柔和与细腻',copy:'细腻木色与克制纹理，为现代住宅留出呼吸感。'},
    {key:'森系列',code:'B3-X809',label:'森',mood:'自然与层次',copy:'保留更鲜明的木纹层次，让空间更接近木的本来面貌。'},
    {key:'墨系列',code:'M9-B701',label:'墨',mood:'深色与安定',copy:'深棕与灰调木色，为采光充足的大空间建立重心。'}
  ];

  if(isWeimob){
    document.documentElement.setAttribute('data-channel','weimob');
  }

  if(Array.isArray(window.ROUTES)&&window.ROUTES.indexOf('#selection')<0){
    window.ROUTES.push('#selection');
  }
  if(window.MOBILE_NAV_META){
    window.MOBILE_NAV_META['#selection']={eyebrow:'MY WOOD ALL',title:'我的选材'};
  }

  function safeParse(raw,fallback){
    try{return raw?JSON.parse(raw):fallback}catch(error){return fallback}
  }

  function uniqueStrings(list){
    var seen={};
    return (Array.isArray(list)?list:[]).map(function(value){return String(value||'').trim()}).filter(function(value){
      if(!value||seen[value])return false;
      seen[value]=true;
      return true;
    });
  }

  function escapeMiniHtml(value){
    return String(value===undefined||value===null?'':value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function getMiniSeriesKey(value){
    value=String(value||'');
    for(var index=0;index<MINI_SERIES.length;index++){
      if(value.indexOf(MINI_SERIES[index].key)===0)return MINI_SERIES[index].key;
    }
    return'';
  }

  function getMiniSeriesValue(key){
    var list=Array.isArray(window.PRODUCTS)?window.PRODUCTS:[];
    var match=list.find(function(product){return String(product.series||'').indexOf(key)===0});
    return match?match.series:key;
  }

  function getMiniSeriesProducts(key){
    return (Array.isArray(window.PRODUCTS)?window.PRODUCTS:[]).filter(function(product){
      return String(product.series||'').indexOf(key)===0;
    });
  }

  function getMiniProductImage(product){
    return product&&(product.img_e_thumb||product.img_a_thumb||product.img_b_thumb||product.map_thumb||product.swatch_thumb)||'';
  }

  function emptySelection(){
    return {version:2,products:[],cases:[],articles:[],updatedAt:''};
  }

  function readSelection(){
    var state=safeParse(window.localStorage.getItem(SELECTION_V2),null);
    if(!state||state.version!==2){
      state=emptySelection();
      state.products=uniqueStrings(safeParse(window.localStorage.getItem('woodallProductSelection'),[]));
      state.cases=uniqueStrings(safeParse(window.localStorage.getItem('woodallPavingSelection'),[]));
      writeSelection(state);
    }
    state.products=uniqueStrings(state.products);
    state.cases=uniqueStrings(state.cases);
    state.articles=uniqueStrings(state.articles);
    return state;
  }

  function writeSelection(state){
    state=state||emptySelection();
    state.version=2;
    state.products=uniqueStrings(state.products);
    state.cases=uniqueStrings(state.cases);
    state.articles=uniqueStrings(state.articles);
    state.updatedAt=new Date().toISOString();
    try{
      window.localStorage.setItem(SELECTION_V2,JSON.stringify(state));
      window.localStorage.setItem('woodallProductSelection',JSON.stringify(state.products));
      window.localStorage.setItem('woodallPavingSelection',JSON.stringify(state.cases));
    }catch(error){}
    return state;
  }

  window.getProductSelection=function(){return readSelection().products.slice()};
  window.setProductSelection=function(list){
    var state=readSelection();
    state.products=uniqueStrings(list);
    writeSelection(state);
    if(typeof window.updatePavingSelectionUI==='function')window.updatePavingSelectionUI();
  };
  window.getPavingSelection=function(){return readSelection().cases.slice()};
  window.setPavingSelection=function(list){
    var state=readSelection();
    state.cases=uniqueStrings(list);
    writeSelection(state);
    if(typeof window.updatePavingSelectionUI==='function')window.updatePavingSelectionUI();
  };

  function getArticleSelection(){return readSelection().articles.slice()}
  function isArticleSelected(id){return getArticleSelection().indexOf(id)>=0}
  function toggleArticleSelection(id){
    var state=readSelection();
    var index=state.articles.indexOf(id);
    if(index>=0)state.articles.splice(index,1);
    else state.articles.push(id);
    writeSelection(state);
    syncSelectionCount();
    syncArticleFavoriteButton();
    renderSelectionPage();
    showToast(index>=0?'已取消收藏':'已收藏文章');
  }

  function routeBase(hash){
    hash=hash||'#home';
    if(hash.indexOf('#products/')===0)return'#products';
    if(hash==='#selection')return'#selection';
    return originalGetBaseHash?originalGetBaseHash(hash):hash;
  }
  window.getBaseHash=routeBase;

  function normalizeProductCode(hash){
    if(String(hash||'').indexOf('#products/')!==0)return'';
    try{return decodeURIComponent(String(hash).slice('#products/'.length)).trim()}catch(error){return''}
  }

  function withHash(hash){
    return window.location.pathname+window.location.search+hash;
  }

  function updateMiniNavigation(hash){
    var base=routeBase(hash||window.location.hash||'#home');
    document.querySelectorAll('[data-mini-tab]').forEach(function(link){
      var target=link.getAttribute('data-mini-tab');
      var active=target===base||(target==='#cases'&&base==='#journal');
      link.classList.toggle('active',active);
      link.setAttribute('aria-current',active?'page':'false');
      var normal=link.querySelector('[data-icon-normal]');
      var activeIcon=link.querySelector('[data-icon-active]');
      if(normal)normal.hidden=active;
      if(activeIcon)activeIcon.hidden=!active;
    });
    document.querySelectorAll('[data-inspiration-route]').forEach(function(link){
      var active=link.getAttribute('data-inspiration-route')===base;
      link.classList.toggle('active',active);
      link.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function waitForProductDetail(code){
    window.clearTimeout(productDetailTimer);
    var attempts=0;
    function open(){
      attempts++;
      var product=typeof window.findProductByCode==='function'?window.findProductByCode(code):null;
      if(product){
        window.currentProd=product;
        if(typeof window.openDrawer==='function')window.openDrawer(product);
        return;
      }
      if(attempts<80)productDetailTimer=window.setTimeout(open,100);
      else showToast('没有找到该产品型号');
    }
    open();
  }

  function saveProductWorkspace(){
    if(routeBase(window.location.hash)!=='#products')return;
    var payload={query:productQuery,filters:window.activeFilters||{},scrollY:window.scrollY||0,visibleLimit:miniProductVisibleLimit};
    try{window.sessionStorage.setItem(PRODUCT_WORKSPACE,JSON.stringify(payload))}catch(error){}
  }

  function restoreProductWorkspace(){
    if(restoredProductWorkspace)return;
    restoredProductWorkspace=true;
    var payload=safeParse(window.sessionStorage.getItem(PRODUCT_WORKSPACE),null);
    if(!payload)return;
    productQuery=String(payload.query||'');
    if(payload.filters&&window.activeFilters){
      Object.keys(window.activeFilters).forEach(function(key){
        if(payload.filters[key])window.activeFilters[key]=payload.filters[key];
      });
    }
    miniProductVisibleLimit=Math.max(miniProductPageSize,Number(payload.visibleLimit)||miniProductPageSize);
    var input=document.getElementById('prodSearchInput');
    if(input)input.value=productQuery;
    var clear=document.getElementById('prodSearchClear');
    if(clear)clear.hidden=!productQuery;
    function apply(){
      if(!window.PRODUCTS||!window.PRODUCTS.length){window.setTimeout(apply,100);return}
      if(typeof window.buildAllFilters==='function')window.buildAllFilters();
      if(typeof window.buildProds==='function')window.buildProds();
      window.setTimeout(function(){window.scrollTo(0,Number(payload.scrollY)||0)},50);
    }
    apply();
  }

  window.navigate=function(hash,options){
    var previousBase=routeBase(window.location.hash||'#home');
    if(previousBase==='#products'&&routeBase(hash)!=='#products')saveProductWorkspace();
    var result=originalNavigate(hash,options);
    var base=routeBase(hash);
    updateMiniNavigation(hash);
    if(base==='#products'){
      restoreProductWorkspace();
      var code=normalizeProductCode(hash);
      if(code)waitForProductDetail(code);
      else if(originalCloseDrawer)originalCloseDrawer();
    }
    if(base==='#selection')renderSelectionPage();
    return result;
  };

  window.selectProd=function(product){
    if(product&&product.code){
      window.history.pushState({woodallProduct:true},'',withHash('#products/'+encodeURIComponent(product.code)));
      updateMiniNavigation('#products');
    }
    return originalSelectProd(product);
  };

  window.closeDrawer=function(){
    var result=originalCloseDrawer();
    document.body.classList.remove('mini-product-detail-open');
    if(normalizeProductCode(window.location.hash)){
      window.history.replaceState({woodallProductList:true},'',withHash('#products'));
      updateMiniNavigation('#products');
    }
    return result;
  };

  function syncProductDetailHash(){
    if(window.currentProd&&window.currentProd.code){
      window.history.replaceState({woodallProduct:true},'',withHash('#products/'+encodeURIComponent(window.currentProd.code)));
    }
  }
  window.drawerNavPrev=function(){var result=originalDrawerPrev();syncProductDetailHash();return result};
  window.drawerNavNext=function(){var result=originalDrawerNext();syncProductDetailHash();return result};

  function decorateMiniProductDetail(product){
    if(!isWeimob||!product)return;
    var info=document.getElementById('drawerInfoPanel');
    if(!info)return;
    var heading=info.querySelector('h3');
    if(heading&&!info.querySelector('.mini-detail-series')){
      var series=document.createElement('span');
      series.className='mini-detail-series';
      series.textContent=(getMiniSeriesKey(product.series)||product.series)+' · '+product.wood;
      heading.insertAdjacentElement('beforebegin',series);
    }
    var appointment=info.querySelector('.drawer-actions a:not(.secondary)');
    if(appointment){
      appointment.removeAttribute('onclick');
      appointment.setAttribute('href','#');
      appointment.setAttribute('data-mini-appointment','预约看样');
      appointment.setAttribute('data-product-code',product.code);
      appointment.textContent='预约看样';
    }
    if(!info.querySelector('.mini-detail-reference')){
      var note=document.createElement('p');
      note.className='mini-detail-reference';
      note.textContent='图片用于辨认木色与纹理，实际颜色以门店样板为准。';
      info.appendChild(note);
    }
  }

  if(originalShowProductInDrawer){
    window.showProductInDrawer=function(product){
      var result=originalShowProductInDrawer(product);
      decorateMiniProductDetail(product);
      return result;
    };
  }

  if(originalOpenDrawer){
    window.openDrawer=function(product){
      document.body.classList.add('mini-product-detail-open');
      var result=originalOpenDrawer(product);
      decorateMiniProductDetail(product||window.currentProd);
      return result;
    };
  }

  function normalizeSearch(value){return String(value||'').trim().toLowerCase()}
  function productMatchesQuery(product){
    if(!productQuery)return true;
    var haystack=[product.code,product.model,product.wood,product.series,product.board,product.surface,product.structure,product.tone,product.spec].join(' ').toLowerCase();
    return productQuery.split(/\s+/).every(function(token){return haystack.indexOf(token)>=0});
  }
  window.getFiltered=function(){
    var list=originalGetFiltered();
    return list.filter(productMatchesQuery);
  };

  function syncSearchState(){
    var input=document.getElementById('prodSearchInput');
    var clear=document.getElementById('prodSearchClear');
    if(input&&input.value!==productQuery)input.value=productQuery;
    if(clear)clear.hidden=!productQuery;
  }

  function setProductQuery(value){
    productQuery=normalizeSearch(value);
    syncSearchState();
    saveProductWorkspace();
    if(typeof window.buildProds==='function')window.buildProds();
  }

  window.clearProductFilters=function(){
    productQuery='';
    syncSearchState();
    var result=originalClearFilters();
    saveProductWorkspace();
    return result;
  };

  window.updateFilterSummary=function(){
    var result=originalUpdateFilterSummary();
    var selected=typeof window.getSelectedProductFilterPairs==='function'?window.getSelectedProductFilterPairs():[];
    var state=document.getElementById('prodFilterState');
    var clear=document.getElementById('prodClearFilters');
    if(productQuery&&state){
      var chip=document.createElement('span');
      chip.textContent='搜索：'+productQuery;
      state.appendChild(chip);
    }
    var hasActive=!!productQuery||selected.length>0;
    if(clear)clear.classList.toggle('is-visible',hasActive);
    syncSearchState();
    syncMiniSeriesState();
    return result;
  };

  function syncMiniSeriesState(){
    if(!isWeimob)return;
    var active=getMiniSeriesKey(window.activeFilters&&window.activeFilters.series);
    document.querySelectorAll('[data-mini-product-series]').forEach(function(button){
      var selected=button.getAttribute('data-mini-product-series')===active;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',selected?'true':'false');
    });
    var all=document.querySelector('[data-mini-product-series-all]');
    if(all){
      all.classList.toggle('active',!active);
      all.setAttribute('aria-pressed',active?'false':'true');
    }
  }

  function syncMiniHomeSeriesCards(){
    if(!isWeimob||!window.PRODUCTS||!window.PRODUCTS.length)return;
    document.querySelectorAll('[data-mini-series-link]').forEach(function(card){
      var key=card.getAttribute('data-mini-series-link');
      var config=MINI_SERIES.find(function(item){return item.key===key});
      var title=card.querySelector('h3');
      var copy=card.querySelector('p');
      if(title)title.textContent=key+' · '+getMiniSeriesProducts(key).length+'款';
      if(copy&&config)copy.textContent=config.copy;
    });
  }

  function renderMiniSeriesHub(){
    if(!isWeimob)return;
    var root=document.getElementById('miniSeriesHub');
    if(!root)return;
    if(!window.PRODUCTS||!window.PRODUCTS.length){
      root.innerHTML='<div class="mini-series-loading">正在整理四个产品系列...</div>';
      window.clearTimeout(renderMiniSeriesHub.timer);
      renderMiniSeriesHub.timer=window.setTimeout(renderMiniSeriesHub,120);
      return;
    }
    var cards=MINI_SERIES.map(function(config){
      var products=getMiniSeriesProducts(config.key);
      var representative=products.find(function(product){return product.code===config.code})||products[0];
      var src=getMiniProductImage(representative);
      return '<button class="mini-series-card" type="button" data-mini-product-series="'+escapeMiniHtml(config.key)+'" aria-pressed="false">'+
        '<span class="mini-series-visual">'+(src?'<img src="'+escapeMiniHtml(src)+'" alt="'+escapeMiniHtml(config.key+'真实产品木色')+'" loading="lazy" decoding="async">':'')+'<b>'+escapeMiniHtml(config.label)+'</b></span>'+
        '<span class="mini-series-copy"><small>'+products.length+' 款</small><strong>'+escapeMiniHtml(config.key)+'</strong><em>'+escapeMiniHtml(config.mood)+'</em><span>'+escapeMiniHtml(config.copy)+'</span></span>'+
      '</button>';
    }).join('');
    root.innerHTML='<div class="mini-series-head"><div><span>FOUR COLLECTIONS</span><h3>先按系列选木</h3><p>138 款真实产品分为四个系列。先看整体气质，再用木种、板型、表面和结构继续缩小范围。</p></div><button type="button" data-mini-product-series-all aria-pressed="true">全部 '+window.PRODUCTS.length+' 款</button></div><div class="mini-series-grid">'+cards+'</div>';
    syncMiniSeriesState();
    syncMiniHomeSeriesCards();
  }

  function setMiniProductSeries(key){
    if(!window.activeFilters)return;
    productQuery='';
    window.activeFilters.series=key?getMiniSeriesValue(key):'全部';
    ['wood','board','surface','structure'].forEach(function(group){window.activeFilters[group]='全部'});
    miniProductVisibleLimit=miniProductPageSize;
    miniProductSignature='';
    syncSearchState();
    if(routeBase(window.location.hash||'#home')!=='#products')window.navigate('#products');
    if(typeof window.buildAllFilters==='function')window.buildAllFilters();
    if(typeof window.buildProds==='function')window.buildProds();
    syncMiniSeriesState();
    window.setTimeout(function(){
      var target=document.querySelector('#page-products .prod-mobile-workspace');
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    },100);
  }

  function applyRequestedSeries(attempt){
    if(!isWeimob||!requestedSeries)return;
    var requested=String(requestedSeries).trim();
    var config=MINI_SERIES.find(function(item){
      return item.key===requested||item.key.indexOf(requested)===0||item.label===requested;
    });
    if(!config)return;
    if(!window.activeFilters||!window.PRODUCTS||!window.PRODUCTS.length){
      if((attempt||0)<50)window.setTimeout(function(){applyRequestedSeries((attempt||0)+1)},120);
      return;
    }
    requestedSeries='';
    setMiniProductSeries(config.key);
  }

  function getMiniProductSignature(){
    var filters=window.activeFilters||{};
    return [productQuery,filters.series,filters.wood,filters.board,filters.surface,filters.structure].join('|');
  }

  function updateMiniProductPager(){
    if(!isWeimob)return;
    var root=document.getElementById('miniProductPager');
    if(!root)return;
    var list=typeof window.getFiltered==='function'?window.getFiltered():[];
    var shown=Math.min(miniProductVisibleLimit,list.length);
    root.hidden=!list.length;
    var status=root.querySelector('[data-mini-product-progress]');
    var more=root.querySelector('[data-mini-product-more]');
    if(status)status.textContent='已显示 '+shown+' / '+list.length+' 款';
    if(more){
      more.hidden=shown>=list.length;
      more.textContent=shown>=list.length?'已显示全部':'继续查看 '+Math.min(miniProductPageSize,list.length-shown)+' 款';
    }
  }

  if(originalCreateProductCard){
    window.createProductCard=function(product,index){
      var card=originalCreateProductCard(product,index);
      if(!isWeimob||!card)return card;
      var name=card.querySelector('.pname');
      if(name)name.textContent=product.code;
      var meta=document.createElement('span');
      meta.className='mini-product-meta';
      meta.textContent=(getMiniSeriesKey(product.series)||product.series)+' · '+product.wood;
      if(name)name.insertAdjacentElement('afterend',meta);
      card.setAttribute('aria-label','查看'+(getMiniSeriesKey(product.series)||'')+'产品 '+product.code+' '+product.wood+' 详情');
      return card;
    };
  }

  if(originalAppendProductCards){
    window.appendProductCards=function(element,list,start,token){
      if(!isWeimob)return originalAppendProductCards(element,list,start,token);
      return originalAppendProductCards(element,list.slice(0,miniProductVisibleLimit),start,token);
    };
  }

  if(originalBuildProds){
    window.buildProds=function(){
      if(!isWeimob)return originalBuildProds();
      var signature=getMiniProductSignature();
      if(!miniPreserveProductLimit&&miniProductSignature&&signature!==miniProductSignature){
        miniProductVisibleLimit=miniProductPageSize;
      }
      miniProductSignature=signature;
      miniPreserveProductLimit=false;
      var result=originalBuildProds();
      updateMiniProductPager();
      window.setTimeout(updateMiniProductPager,40);
      window.setTimeout(updateMiniProductPager,360);
      syncMiniSeriesState();
      return result;
    };
  }

  function copyText(text){
    text=String(text||'');
    if(!text)return Promise.resolve(false);
    if(navigator.clipboard&&navigator.clipboard.writeText){
      return navigator.clipboard.writeText(text).then(function(){return true}).catch(function(){return legacyCopy(text)});
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text){
    var area=document.createElement('textarea');
    area.value=text;
    area.setAttribute('readonly','');
    area.style.position='fixed';
    area.style.opacity='0';
    document.body.appendChild(area);
    area.select();
    var ok=false;
    try{ok=document.execCommand('copy')}catch(error){}
    area.remove();
    return ok;
  }

  function showToast(message){
    var toast=document.getElementById('woodallMiniToast');
    if(!toast){
      toast=document.createElement('div');
      toast.id='woodallMiniToast';
      toast.className='mini-toast';
      toast.setAttribute('role','status');
      document.body.appendChild(toast);
    }
    toast.textContent=message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer=window.setTimeout(function(){toast.classList.remove('show')},1800);
  }

  function selectionText(){
    var text=originalGetSelectionText?originalGetSelectionText():'';
    var articleIds=getArticleSelection();
    var data=typeof window.getMuchiData==='function'?window.getMuchiData():{articles:[]};
    var articles=articleIds.map(function(id){return typeof window.getMuchiArticleById==='function'?window.getMuchiArticleById(data,id):null}).filter(Boolean);
    if(articles.length){
      if(!text)text='痴木堂选材清单';
      text+='\n\n【收藏文章】\n'+articles.map(function(article,index){return(index+1)+'. '+article.title}).join('\n');
    }
    return text;
  }
  window.getPavingSelectionText=selectionText;

  function ensureWeixinSdk(){
    if(window.wx&&window.wx.miniProgram)return Promise.resolve(window.wx);
    return new Promise(function(resolve,reject){
      var existing=document.querySelector('script[data-weixin-sdk]');
      if(existing){
        existing.addEventListener('load',function(){resolve(window.wx)},{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      var script=document.createElement('script');
      script.src='https://res.wx.qq.com/open/js/jweixin-1.3.2.js';
      script.async=true;
      script.setAttribute('data-weixin-sdk','true');
      script.onload=function(){resolve(window.wx)};
      script.onerror=reject;
      document.head.appendChild(script);
    });
  }

  function appendRouteQuery(path,params){
    var joiner=path.indexOf('?')>=0?'&':'?';
    var values=[];
    Object.keys(params).forEach(function(key){
      if(params[key]!==undefined&&params[key]!==null&&params[key]!=='')values.push(encodeURIComponent(key)+'='+encodeURIComponent(params[key]));
    });
    return path+(values.length?joiner+values.join('&'):'');
  }

  function openAppointment(intent,code){
    var state=readSelection();
    if(code&&state.products.indexOf(code)<0)state.products.push(code);
    writeSelection(state);
    var text=selectionText()||('痴木堂预约：'+(code||intent||'预约选材'));
    return copyText(text).then(function(){
      if(isWeimob&&appointmentPath){
        return ensureWeixinSdk().then(function(wx){
          if(!wx||!wx.miniProgram)throw new Error('mini program bridge unavailable');
          var path=appendRouteQuery(appointmentPath,{intent:intent||'预约选材',codes:state.products.join(','),selection:text});
          showToast('选材清单已复制，正在打开预约');
          wx.miniProgram.navigateTo({url:path});
          return true;
        }).catch(function(){
          showToast('清单已复制，请在预约页粘贴');
          window.navigate('#contact');
          return false;
        });
      }
      showToast(text?'选材清单已复制':'正在打开咨询');
      window.navigate('#contact');
      return false;
    });
  }

  window.WoodallMini={
    enabled:isWeimob,
    openAppointment:openAppointment,
    renderSelection:renderSelectionPage,
    getSelection:readSelection
  };

  function productCard(product){
    var src=product.img_a_thumb||product.img_b_thumb||product.img_e_thumb||product.map_thumb||product.swatch_thumb||'';
    return '<article class="selection-item selection-product">'+
      '<button class="selection-item-open" type="button" data-selection-product="'+escapeHtml(product.code)+'">'+
        (src?'<img src="'+escapeHtml(src)+'" alt="'+escapeHtml(product.code+' '+product.wood)+'" loading="lazy" decoding="async">':'')+
        '<span><small>PRODUCT</small><strong>'+escapeHtml(product.code)+'</strong><em>'+escapeHtml(product.wood+' · '+product.board)+'</em></span>'+
      '</button><button class="selection-remove" type="button" data-remove-product="'+escapeHtml(product.code)+'" aria-label="移除 '+escapeHtml(product.code)+'">移除</button></article>';
  }

  function caseCard(item){
    return '<article class="selection-item selection-case">'+
      '<button class="selection-item-open" type="button" data-selection-case="'+escapeHtml(item.id)+'">'+
        '<img src="'+escapeHtml(item.src)+'" alt="'+escapeHtml(item.alt||item.title)+'" loading="lazy" decoding="async">'+
        '<span><small>PAVING</small><strong>'+escapeHtml(item.title)+'</strong><em>'+escapeHtml(item.roomType+' · '+item.colorTone+' · '+item.pattern)+'</em></span>'+
      '</button><button class="selection-remove" type="button" data-remove-case="'+escapeHtml(item.id)+'" aria-label="移除 '+escapeHtml(item.title)+'">移除</button></article>';
  }

  function articleCard(article){
    return '<article class="selection-item selection-article">'+
      '<button class="selection-item-open" type="button" data-selection-article="'+escapeHTML(article.id)+'">'+
        '<img src="'+escapeHTML(article.cover.path)+'" alt="'+escapeHTML(article.cover.alt||article.title)+'" loading="lazy" decoding="async">'+
        '<span><small>JOURNAL</small><strong>'+escapeHTML(article.title)+'</strong><em>'+escapeHTML(article.category+' · '+formatMuchiDate(article.date))+'</em></span>'+
      '</button><button class="selection-remove" type="button" data-remove-article="'+escapeHTML(article.id)+'" aria-label="移除文章">移除</button></article>';
  }

  function renderSelectionPage(){
    var root=document.getElementById('selectionContent');
    if(!root)return;
    var state=readSelection();
    var products=state.products.map(function(code){return typeof window.findProductByCode==='function'?window.findProductByCode(code):null}).filter(Boolean);
    var cases=state.cases.map(function(id){return typeof window.getSpaceById==='function'?window.getSpaceById(id):null}).filter(Boolean);
    var data=typeof window.getMuchiData==='function'?window.getMuchiData():{articles:[]};
    var articles=state.articles.map(function(id){return typeof window.getMuchiArticleById==='function'?window.getMuchiArticleById(data,id):null}).filter(Boolean);
    var count=state.products.length+state.cases.length+state.articles.length;
    var countNode=document.getElementById('selectionTotalCount');
    if(countNode)countNode.textContent=String(count);
    if(!count){
      root.innerHTML='<div class="selection-empty"><span>SELECTION IS EMPTY</span><h3>先从喜欢的空间与木色开始。</h3><p>产品、铺装参考和文章都可以加入这里，再一起交给选材顾问。</p><a href="#products" class="btn-primary">开始选材</a></div>';
      return;
    }
    var html='';
    if(state.products.length){
      html+='<section class="selection-group"><div class="selection-group-head"><span>PRODUCTS</span><h3>产品 '+state.products.length+'</h3></div><div class="selection-grid">'+(products.length?products.map(productCard).join(''):'<p class="selection-loading">产品资料正在加载...</p>')+'</div></section>';
    }
    if(cases.length){
      html+='<section class="selection-group"><div class="selection-group-head"><span>PAVING</span><h3>铺装参考 '+cases.length+'</h3></div><div class="selection-grid">'+cases.map(caseCard).join('')+'</div></section>';
    }
    if(state.articles.length){
      html+='<section class="selection-group"><div class="selection-group-head"><span>JOURNAL</span><h3>收藏文章 '+state.articles.length+'</h3></div><div class="selection-grid">'+(articles.length?articles.map(articleCard).join(''):'<p class="selection-loading">文章目录正在加载...</p>')+'</div></section>';
      if(!articles.length&&!muchiFavoriteRenderPending&&typeof window.ensureMuchiDataLoaded==='function'){
        muchiFavoriteRenderPending=true;
        window.ensureMuchiDataLoaded(function(){muchiFavoriteRenderPending=false;renderSelectionPage()});
      }
    }
    root.innerHTML=html;
  }

  function syncSelectionCount(){
    var state=readSelection();
    var total=state.products.length+state.cases.length+state.articles.length;
    var rail=document.getElementById('pavingSelectionCount');
    if(rail)rail.textContent=String(total);
    var badge=document.getElementById('miniSelectionBadge');
    if(badge){badge.textContent=String(total);badge.hidden=!total}
    var totalNode=document.getElementById('selectionTotalCount');
    if(totalNode)totalNode.textContent=String(total);
  }

  var originalUpdatePavingSelectionUI=window.updatePavingSelectionUI;
  window.updatePavingSelectionUI=function(){
    var result=originalUpdatePavingSelectionUI?originalUpdatePavingSelectionUI():undefined;
    syncSelectionCount();
    renderSelectionPage();
    return result;
  };

  function syncArticleFavoriteButton(){
    var button=document.querySelector('[data-muchi-favorite]');
    if(!button)return;
    var selected=!!window.muchiReaderArticleId&&isArticleSelected(window.muchiReaderArticleId);
    button.classList.toggle('active',selected);
    button.setAttribute('aria-pressed',selected?'true':'false');
    button.textContent=selected?'已收藏':'收藏';
  }

  window.openMuchiArticle=function(id){
    if(isWeimob){
      document.documentElement.scrollTop=0;
      document.body.scrollTop=0;
      window.scrollTo(0,0);
    }
    var result=originalOpenMuchiArticle(id);
    if(isWeimob){
      document.body.classList.add('mini-article-detail-open');
    }
    function resetReaderViewport(){
      if(!isWeimob)return;
      document.body.classList.remove('muchi-reader-open','mini-article-detail-open');
      var previousScrollBehavior=document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior='auto';
      document.documentElement.scrollTop=0;
      document.body.scrollTop=0;
      window.scrollTo(0,0);
      document.documentElement.style.scrollBehavior=previousScrollBehavior;
      document.body.classList.add('muchi-reader-open','mini-article-detail-open');
      var panel=document.querySelector('#muchiReader .muchi-reader-panel');
      if(panel)panel.scrollTop=0;
    }
    window.setTimeout(function(){
      resetReaderViewport();
      syncArticleFavoriteButton();
      var panel=document.querySelector('#muchiReader .muchi-reader-panel');
      if(panel)panel.scrollTop=0;
    },0);
    window.setTimeout(function(){
      resetReaderViewport();
    },180);
    return result;
  };

  if(originalCloseMuchiReader){
    window.closeMuchiReader=function(updateHash){
      document.body.classList.remove('mini-article-detail-open');
      return originalCloseMuchiReader(updateHash);
    };
  }

  function shareCurrentArticle(){
    var data=typeof window.getMuchiData==='function'?window.getMuchiData():{articles:[]};
    var article=typeof window.getMuchiArticleById==='function'?window.getMuchiArticleById(data,window.muchiReaderArticleId):null;
    var payload={title:article?article.title:document.title,text:article?article.excerpt:'痴木堂木作阅读',url:window.location.href};
    if(navigator.share){
      navigator.share(payload).catch(function(){});
    }else{
      copyText(payload.url).then(function(){showToast('文章链接已复制')});
    }
  }

  function renderMiniHomeJournal(){
    if(!isWeimob)return;
    var root=document.getElementById('miniHomeJournalGrid');
    if(!root)return;
    var data=typeof window.getMuchiData==='function'?window.getMuchiData():{articles:[]};
    if(!data.articles||!data.articles.length){
      root.innerHTML='<p class="mini-home-journal-loading">正在打开本期痴木志...</p>';
      if(typeof window.ensureMuchiDataLoaded==='function'){
        window.ensureMuchiDataLoaded(function(){renderMiniHomeJournal()});
      }
      return;
    }
    var articles=data.articles.slice(-3).reverse();
    root.innerHTML=articles.map(function(article,index){
      return '<a class="mini-home-journal-card'+(index===0?' lead':'')+'" href="#journal/muchi/'+escapeMiniHtml(article.id)+'">'+
        '<img src="'+escapeMiniHtml(article.cover.path)+'" alt="'+escapeMiniHtml(article.cover.alt||article.title)+'" loading="lazy" decoding="async">'+
        '<span><small>'+escapeMiniHtml(article.issue.display+' · '+article.category)+'</small><strong>'+escapeMiniHtml(article.title)+'</strong><p>'+escapeMiniHtml(article.excerpt)+'</p><em>阅读文章</em></span>'+
      '</a>';
    }).join('');
  }

  function installDom(){
    if(document.getElementById('page-selection'))return;
    var footer=document.querySelector('.footer');

    var homeContent=document.getElementById('home-content');
    if(homeContent){
      var featuredSection=homeContent.querySelector('.series-grid');
      featuredSection=featuredSection?featuredSection.closest('.section'):null;
      if(featuredSection){
        featuredSection.classList.add('mini-home-featured');
        if(isWeimob){
          var featuredTitle=featuredSection.querySelector('.section-title h2');
          var featuredCopy=featuredSection.querySelector('.section-title p');
          if(featuredTitle)featuredTitle.textContent='四个产品系列';
          if(featuredCopy)featuredCopy.textContent='从系列气质开始，再进入真实木色与完整参数。';
          featuredSection.querySelectorAll('.series-card[data-series-intro]').forEach(function(card){
            var key=card.getAttribute('data-series-intro');
            var config=MINI_SERIES.find(function(item){return item.key===key});
            if(!config){card.hidden=true;return}
            card.setAttribute('href','#products');
            card.setAttribute('data-mini-series-link',key);
          });
        }
      }
      var partnerGrid=homeContent.querySelector('.partners');
      var partnerSection=partnerGrid?partnerGrid.closest('.section'):null;
      if(partnerSection)partnerSection.classList.add('mini-home-partners');

      if(isWeimob){
        var journalSection=document.createElement('section');
        journalSection.className='mini-home-journal';
        journalSection.innerHTML='<div class="mini-home-journal-head"><div><span>CHIMU JOURNAL</span><h2>痴木志，不只是一组封面。</h2><p>六卷、37 篇正文，从木材本源、辨木、工法到空间与日常，逐篇可读、可收藏。</p></div><a href="#journal">查看全部文章</a></div><div class="mini-home-journal-grid" id="miniHomeJournalGrid"></div>';
        homeContent.appendChild(journalSection);

        var appointmentBand=document.createElement('section');
        appointmentBand.className='mini-home-appointment';
        appointmentBand.innerHTML='<div><span>PRIVATE SELECTION</span><h2>带着空间与木色，预约一次选材。</h2><p>顾问会结合城市、面积、采光和意向型号，先替项目缩小范围。</p><button type="button" class="btn-primary" data-mini-appointment="预约选材">预约选材</button></div>';
        homeContent.appendChild(appointmentBand);
      }
    }

    var selection=document.createElement('section');
    selection.className='page';
    selection.id='page-selection';
    selection.innerHTML='<div class="selection-page container"><header class="selection-hero"><span class="page-eyebrow">MY WOOD ALL</span><h2>我的选材</h2><p>把喜欢的产品、铺装参考与文章放在一起，形成可直接沟通的选材清单。</p><div class="selection-summary"><strong><b id="selectionTotalCount">0</b> 项</strong><span>仅保存在当前设备</span></div></header><nav class="selection-quick-actions" aria-label="我的服务"><a href="#products"><span>继续选木</span><strong>浏览四个系列</strong></a><button type="button" data-mini-appointment="预约选材"><span>预约服务</span><strong>带着清单沟通</strong></button><a href="#contact"><span>联系顾问</span><strong>选材与售后咨询</strong></a></nav><div id="selectionContent"></div><div class="selection-actions"><button type="button" class="btn-secondary" data-copy-selection>复制清单</button><button type="button" class="btn-primary" data-mini-appointment="预约选材">带着清单预约</button><button type="button" class="selection-clear" data-clear-selection>清空</button></div></div>';
    document.body.insertBefore(selection,footer||null);

    var workspace=document.querySelector('#page-products .prod-mobile-workspace');
    if(workspace){
      if(isWeimob){
        var seriesHub=document.createElement('section');
        seriesHub.className='mini-series-hub';
        seriesHub.id='miniSeriesHub';
        seriesHub.setAttribute('aria-label','产品系列');
        seriesHub.innerHTML='<div class="mini-series-loading">正在整理四个产品系列...</div>';
        workspace.parentNode.insertBefore(seriesHub,workspace);
      }

      var search=document.createElement('div');
      search.className='product-search';
      search.innerHTML='<label for="prodSearchInput">搜索产品</label><div><input id="prodSearchInput" type="search" inputmode="search" autocomplete="off" placeholder="输入型号、木种、系列或工艺" aria-label="搜索产品"><button id="prodSearchClear" type="button" aria-label="清除搜索" title="清除搜索" hidden>×</button></div>';
      workspace.insertBefore(search,workspace.firstChild);

      var grid=document.getElementById('prodGrid');
      if(isWeimob&&grid){
        var pager=document.createElement('div');
        pager.className='mini-product-pager';
        pager.id='miniProductPager';
        pager.hidden=true;
        pager.innerHTML='<span data-mini-product-progress aria-live="polite"></span><button type="button" data-mini-product-more>继续查看</button>';
        grid.insertAdjacentElement('afterend',pager);
      }
    }

    document.querySelectorAll('#page-cases .case-space-page,#page-journal .journal-page>.container').forEach(function(container){
      var switcher=document.createElement('nav');
      switcher.className='mini-inspiration-switcher';
      switcher.setAttribute('aria-label','灵感内容切换');
      switcher.innerHTML='<a href="#cases" data-inspiration-route="#cases">铺装参考</a><a href="#journal" data-inspiration-route="#journal">痴木志</a>';
      container.insertBefore(switcher,container.firstChild);
    });

    var readerTopbar=document.querySelector('.muchi-reader-topbar');
    if(readerTopbar){
      var actions=document.createElement('div');
      actions.className='muchi-reader-actions';
      actions.innerHTML='<button type="button" data-muchi-favorite aria-pressed="false">收藏</button><button type="button" data-muchi-share>分享</button>';
      readerTopbar.appendChild(actions);
    }

    var tabbar=document.createElement('nav');
    tabbar.className='mini-tabbar';
    tabbar.setAttribute('aria-label','痴木堂小程序导航');
    tabbar.innerHTML=[
      ['#home','首页','home'],['#products','产品','products'],['#cases','灵感','journal'],['#service','服务','service'],['#selection','我的','profile']
    ].map(function(item){
      return '<a href="'+item[0]+'" data-mini-tab="'+item[0]+'"><span class="mini-tab-icon"><img data-icon-normal src="media/mini-nav/'+item[2]+'-default.png" alt=""><img data-icon-active src="media/mini-nav/'+item[2]+'-active.png" alt="" hidden></span><span>'+item[1]+'</span>'+(item[0]==='#selection'?'<b id="miniSelectionBadge" hidden>0</b>':'')+'</a>';
    }).join('');
    document.body.appendChild(tabbar);

    var railButton=document.getElementById('pavingSelectionButton');
    if(railButton){
      railButton.setAttribute('aria-label','打开选材夹');
      railButton.addEventListener('click',function(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        window.navigate('#selection');
      },true);
    }
  }

  installDom();
  renderMiniSeriesHub();
  renderMiniHomeJournal();
  applyRequestedSeries(0);

  var miniDetailObserver=new MutationObserver(function(){
    var drawer=document.getElementById('prodDrawer');
    var reader=document.getElementById('muchiReader');
    document.body.classList.toggle('mini-product-detail-open',!!(drawer&&drawer.classList.contains('open')));
    document.body.classList.toggle('mini-article-detail-open',!!(reader&&reader.classList.contains('open')));
  });
  var observedDrawer=document.getElementById('prodDrawer');
  var observedReader=document.getElementById('muchiReader');
  if(observedDrawer)miniDetailObserver.observe(observedDrawer,{attributes:true,attributeFilter:['class']});
  if(observedReader)miniDetailObserver.observe(observedReader,{attributes:true,attributeFilter:['class']});

  var searchInput=document.getElementById('prodSearchInput');
  if(searchInput){
    var searchTimer=0;
    searchInput.addEventListener('input',function(){
      window.clearTimeout(searchTimer);
      var value=searchInput.value;
      searchTimer=window.setTimeout(function(){setProductQuery(value)},120);
    });
    searchInput.addEventListener('search',function(){setProductQuery(searchInput.value)});
  }
  var searchClear=document.getElementById('prodSearchClear');
  if(searchClear)searchClear.addEventListener('click',function(){setProductQuery('');if(searchInput)searchInput.focus()});

  document.addEventListener('click',function(event){
    var homeSeries=event.target.closest('[data-mini-series-link]');
    if(homeSeries){
      event.preventDefault();
      setMiniProductSeries(homeSeries.getAttribute('data-mini-series-link'));
      return;
    }
    var series=event.target.closest('[data-mini-product-series]');
    if(series){
      event.preventDefault();
      setMiniProductSeries(series.getAttribute('data-mini-product-series'));
      return;
    }
    if(event.target.closest('[data-mini-product-series-all]')){
      event.preventDefault();
      setMiniProductSeries('');
      return;
    }
    if(event.target.closest('[data-mini-product-more]')){
      event.preventDefault();
      var scrollY=window.scrollY||0;
      miniProductVisibleLimit+=miniProductPageSize;
      miniPreserveProductLimit=true;
      if(typeof window.buildProds==='function')window.buildProds();
      window.setTimeout(function(){window.scrollTo(0,scrollY)},50);
      return;
    }
    var appointment=event.target.closest('[data-mini-appointment]');
    if(appointment){
      event.preventDefault();
      openAppointment(appointment.getAttribute('data-mini-appointment'),appointment.getAttribute('data-product-code')||'');
      return;
    }
    if(isWeimob&&appointmentPath){
      var contactLink=event.target.closest('a[href="#contact"]');
      if(contactLink){
        event.preventDefault();
        openAppointment('预约选材','');
        return;
      }
    }
    var product=event.target.closest('[data-selection-product]');
    if(product){window.navigate('#products/'+encodeURIComponent(product.getAttribute('data-selection-product')));return}
    var caseItem=event.target.closest('[data-selection-case]');
    if(caseItem){window.navigate('#cases');window.setTimeout(function(){window.openSpaceCase(caseItem.getAttribute('data-selection-case'))},80);return}
    var article=event.target.closest('[data-selection-article]');
    if(article){window.navigate('#journal/muchi/'+article.getAttribute('data-selection-article'),{preserveScroll:true});return}
    var removeProduct=event.target.closest('[data-remove-product]');
    if(removeProduct){window.setProductSelection(window.getProductSelection().filter(function(code){return code!==removeProduct.getAttribute('data-remove-product')}));return}
    var removeCase=event.target.closest('[data-remove-case]');
    if(removeCase){window.setPavingSelection(window.getPavingSelection().filter(function(id){return id!==removeCase.getAttribute('data-remove-case')}));return}
    var removeArticle=event.target.closest('[data-remove-article]');
    if(removeArticle){toggleArticleSelection(removeArticle.getAttribute('data-remove-article'));return}
    if(event.target.closest('[data-copy-selection]')){copyText(selectionText()).then(function(){showToast('选材清单已复制')});return}
    if(event.target.closest('[data-clear-selection]')){
      if(window.confirm('清空全部选材内容？')){writeSelection(emptySelection());window.updatePavingSelectionUI()}
      return;
    }
    if(event.target.closest('[data-muchi-favorite]')){if(window.muchiReaderArticleId)toggleArticleSelection(window.muchiReaderArticleId);return}
    if(event.target.closest('[data-muchi-share]')){shareCurrentArticle();return}
  });

  window.addEventListener('popstate',function(){
    var hash=window.location.hash||'#home';
    window.navigate(hash,{preserveScroll:routeBase(hash)==='#products'});
  });
  window.addEventListener('beforeunload',saveProductWorkspace);
  window.addEventListener('scroll',function(){
    if(routeBase(window.location.hash)==='#products'){
      window.clearTimeout(saveProductWorkspace.timer);
      saveProductWorkspace.timer=window.setTimeout(saveProductWorkspace,180);
    }
  },{passive:true});

  document.addEventListener('DOMContentLoaded',function(){
    restoreProductWorkspace();
    applyRequestedSeries(0);
    updateMiniNavigation(window.location.hash||'#home');
    syncSelectionCount();
    renderSelectionPage();
    var code=normalizeProductCode(window.location.hash);
    if(code)waitForProductDetail(code);
  });
})();
