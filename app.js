// ===== ROUTING =====
function navigate(hash){
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
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

function showPage(hash){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  var pageId='page-'+hash.replace('#','');
  var page=document.getElementById(pageId);
  if(page){page.classList.add('active');window.scrollTo(0,0)}
}

// Hamburger
document.getElementById('hamburger').addEventListener('click',function(){
  this.classList.toggle('open');
  document.getElementById('navLinks').classList.toggle('open');
});

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
}).catch(function(e){
  console.error('Product data load failed', e);
}); currentProd=null, COS_BASE='https://woodall-1307516706.cos.ap-guangzhou.myqcloud.com/';
var activeFilters={series:"全部",wood:"全部",board:"全部",surface:"全部",structure:"全部"};
var productsInitialized=false;

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

function buildFilterRow(group){
  var el=document.getElementById("filter"+group.charAt(0).toUpperCase()+group.slice(1));
  if(!el)return;
  el.innerHTML="";
  var vals=collectValues(group);
  vals.forEach(function(v){
    var c=document.createElement("span");
    var isAlt=(group==="surface"||group==="structure");
    c.className="chip"+(isAlt?" alt":"")+(v===activeFilters[group]?" active":"");
    c.textContent=v;
    c.onclick=function(){setFilter(group,v)};
    el.appendChild(c);
  });
}

function setFilter(group,val){
  activeFilters[group]=val;
  buildFilterRow(group);
  buildProds();
}

function getFiltered(){
  return PRODUCTS.filter(function(p){
    return (activeFilters.series==="全部"||p.series===activeFilters.series)
      &&(activeFilters.wood==="全部"||p.wood===activeFilters.wood)
      &&(activeFilters.board==="全部"||p.board===activeFilters.board)
      &&(activeFilters.surface==="全部"||matchSurface(p.surface,activeFilters.surface))
      &&(activeFilters.structure==="全部"||p.structure===activeFilters.structure);
  });
}

function buildProds(){
  var el=document.getElementById("prodGrid");el.innerHTML="";
  var list=getFiltered();
  document.getElementById("prodCount").textContent=list.length+"/"+PRODUCTS.length+"款";
  list.forEach(function(p){
    var card=document.createElement("div");
    card.className="pcard"+(currentProd&&currentProd.code===p.code?" active":"");
    card.innerHTML='<img src="'+p.img_b_thumb+'" loading="lazy"><span class="pname">'+p.code+' · '+p.wood+'</span>';
    card.onclick=function(){selectProd(p)};
    el.appendChild(card);
  });
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
  keys.forEach(function(k,i){
    var btn=document.createElement('button');
    btn.className='series-tab'+(i===0?' active':'');
    btn.textContent=k+' ('+(i+1)+')';
    btn.onclick=function(){switchSeries(k)};
    tabs.appendChild(btn);
  });
  renderSeriesContent(keys[0]);
}

function switchSeries(key){
  document.querySelectorAll('.series-tab').forEach(function(t){
    t.classList.toggle('active',t.textContent.indexOf(key)===0);
  });
  renderSeriesContent(key);
}

function renderSeriesContent(key){
  var d=seriesData[key];
  var html='<div class="series-content active">';
  html+='<div class="series-hero"><h2>'+key+'</h2><p><strong>'+d.tagline+'</strong></p><p style="margin-top:8px">'+d.hero+'</p></div>';
  html+='<div class="series-grid-detail">';
  d.features.forEach(function(f){
    html+='<div class="detail-card"><h4>'+f.title+'</h4><p>'+f.text+'</p></div>';
  });
  html+='</div></div>';
  document.getElementById('seriesContent').innerHTML=html;
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
    'journal/craft-oriental-card.png','journal/craft-ring-section.png','journal/craft-human-wood.png','journal/craft-wood-portrait-art.png'
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

  var revealItems=document.querySelectorAll('.stats,.section,.prod-page-header,.product-experience-bar,.prod-filters,.journal-intro,.journal-topics,.journal-plan');
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
});
