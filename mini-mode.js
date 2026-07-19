(function(){
  'use strict';

  var query=new URLSearchParams(window.location.search);
  var isWeimob=query.get('channel')==='weimob';
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
  var originalOpenMuchiArticle=window.openMuchiArticle;
  var originalGetSelectionText=window.getPavingSelectionText;
  var productQuery='';
  var restoredProductWorkspace=false;
  var productDetailTimer=0;
  var muchiFavoriteRenderPending=false;

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
    var payload={query:productQuery,filters:window.activeFilters||{},scrollY:window.scrollY||0};
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
    return result;
  };

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
    var result=originalOpenMuchiArticle(id);
    window.setTimeout(syncArticleFavoriteButton,0);
    return result;
  };

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
          if(featuredTitle)featuredTitle.textContent='精选产品';
          if(featuredCopy)featuredCopy.textContent='四种代表木色，打开即可查看空间、纹理与完整参数。';
          var featureCodes={'境系列':'A3-B805','森系列':'B3-X809','悦系列':'Q3-X802','墨系列':'M9-B701'};
          featuredSection.querySelectorAll('.series-card[data-series-intro]').forEach(function(card){
            var code=featureCodes[card.getAttribute('data-series-intro')];
            if(!code){card.hidden=true;return}
            card.setAttribute('href','#products/'+code);
            card.removeAttribute('data-series-intro');
            var title=card.querySelector('h3');
            if(title)title.textContent=title.textContent+' · '+code;
          });
        }
      }
      var partnerGrid=homeContent.querySelector('.partners');
      var partnerSection=partnerGrid?partnerGrid.closest('.section'):null;
      if(partnerSection)partnerSection.classList.add('mini-home-partners');

      if(isWeimob){
        var appointmentBand=document.createElement('section');
        appointmentBand.className='mini-home-appointment';
        appointmentBand.innerHTML='<div><span>PRIVATE SELECTION</span><h2>带着空间与木色，预约一次选材。</h2><p>顾问会结合城市、面积、采光和意向型号，先替项目缩小范围。</p><button type="button" class="btn-primary" data-mini-appointment="预约选材">预约选材</button></div>';
        homeContent.appendChild(appointmentBand);
      }
    }

    var selection=document.createElement('section');
    selection.className='page';
    selection.id='page-selection';
    selection.innerHTML='<div class="selection-page container"><header class="selection-hero"><span class="page-eyebrow">MY WOOD ALL</span><h2>我的选材</h2><p>把喜欢的产品、铺装参考与文章放在一起，形成可直接沟通的选材清单。</p><div class="selection-summary"><strong><b id="selectionTotalCount">0</b> 项</strong><span>仅保存在当前设备</span></div></header><div id="selectionContent"></div><div class="selection-actions"><button type="button" class="btn-secondary" data-copy-selection>复制清单</button><button type="button" class="btn-primary" data-mini-appointment="预约选材">带着清单预约</button><button type="button" class="selection-clear" data-clear-selection>清空</button></div></div>';
    document.body.insertBefore(selection,footer||null);

    var workspace=document.querySelector('#page-products .prod-mobile-workspace');
    if(workspace){
      var search=document.createElement('div');
      search.className='product-search';
      search.innerHTML='<label for="prodSearchInput">搜索产品</label><div><input id="prodSearchInput" type="search" inputmode="search" autocomplete="off" placeholder="输入型号、木种、系列或工艺" aria-label="搜索产品"><button id="prodSearchClear" type="button" aria-label="清除搜索" title="清除搜索" hidden>×</button></div>';
      workspace.insertBefore(search,workspace.firstChild);
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
    updateMiniNavigation(window.location.hash||'#home');
    syncSelectionCount();
    renderSelectionPage();
    var code=normalizeProductCode(window.location.hash);
    if(code)waitForProductDetail(code);
  });
})();
