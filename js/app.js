// ===== RAINBOW BRIDGE APP v2 =====
(function(){
  var DB={user:null,tasks:[],chats:[],meetings:[],accounts:[],members:[]};

  function save(k){localStorage.setItem('rb_'+k,JSON.stringify(DB[k]));}
  function load(k){try{DB[k]=JSON.parse(localStorage.getItem('rb_'+k)||'[]');}catch(e){DB[k]=[];}}

  function initData(){
    DB.user={name:'陈默',dept:'产品运营部',role:'产品经理'};
    DB.tasks=[
      {id:1,title:'完成彩虹桥APP v1.0 PRD文档',done:false,time:'今天 14:00',priority:'紧急'},
      {id:2,title:'Q2季度OKR对齐会议',done:false,time:'今天 16:00',priority:'重要'},
      {id:3,title:'用户反馈收集与分析',done:true,time:'明天 10:00',priority:'普通'},
      {id:4,title:'竞品调研报告提交',done:false,time:'明天 18:00',priority:'重要'}
    ];
    DB.chats=[
      {id:1,name:'产品一部群',type:'group',lastMsg:'王姐：收到，马上去处理！',time:'刚刚',badge:0,online:true},
      {id:2,name:'张伟',type:'person',lastMsg:'那个需求我确认一下',time:'10:30',badge:2,online:true},
      {id:3,name:'技术部群',type:'group',lastMsg:'服务器升级公告',time:'昨天',badge:0,online:false},
      {id:4,name:'刘芳',type:'person',lastMsg:'好的，明天见~',time:'昨天',badge:0,online:true},
      {id:5,name:'项目协作群',type:'group',lastMsg:'林总：本周五截止',time:'周一',badge:5,online:false},
      {id:6,name:'陈雪',type:'person',lastMsg:'图做好了，等你确认',time:'周一',badge:1,online:true}
    ];
    DB.meetings=[
      {id:1,title:'彩虹桥APP产品评审会',time:'今天 14:00-15:30',people:['陈默','张伟','王姐','林总'],desc:'v1.0功能评审，确认上线计划'},
      {id:2,title:'Q2 OKR对齐会议',time:'今天 16:00-17:00',people:['陈默','刘芳','陈雪'],desc:'各成员OKR目标对齐与分解'},
      {id:3,title:'技术方案评审',time:'明天 10:00-11:30',people:['张伟','陈雪','技术部'],desc:'后台架构升级方案评审'},
      {id:4,title:'用户访谈',time:'后天 15:00-16:00',people:['陈默','刘芳'],desc:'种子用户深度访谈第一轮'}
    ];
    DB.accounts=[
      {id:1,cat:'🍔',note:'午餐',amount:'-28.5',type:'out',date:'今天'},
      {id:2,cat:'🚊',note:'地铁',amount:'-4.00',type:'out',date:'今天'},
      {id:3,cat:'💰',note:'项目奖金',amount:'+8000',type:'in',date:'昨天'},
      {id:4,cat:'☕',note:'咖啡',amount:'-32',type:'out',date:'昨天'},
      {id:5,cat:'🛒',note:'日用品',amount:'-156.8',type:'out',date:'周一'},
      {id:6,cat:'🍜',note:'晚餐',amount:'-45',type:'out',date:'周一'}
    ];
    DB.members=[
      {id:1,name:'陈默',dept:'产品运营部',role:'产品经理',online:true},
      {id:2,name:'张伟',dept:'技术研发部',role:'技术负责人',online:true},
      {id:3,name:'刘芳',dept:'产品运营部',role:'运营主管',online:true},
      {id:4,name:'王姐',dept:'产品运营部',role:'UI设计师',online:false},
      {id:5,name:'陈雪',dept:'技术研发部',role:'前端工程师',online:true},
      {id:6,name:'林总',dept:'管理层',role:'总经理',online:false},
      {id:7,name:'小李',dept:'市场部',role:'市场专员',online:true},
      {id:8,name:'赵姐',dept:'行政部',role:'行政主管',online:false}
    ];
    ['tasks','chats','meetings','accounts','members'].forEach(save);
    save('user');
  }

  var currentChatId=null;
  var $APP,$LOGIN;

  function $(s){return document.querySelector(s);}
  function $$(s){return document.querySelectorAll(s);}
  function el(id){return document.getElementById(id);}

  // ===== LOGIN =====
  function doLogin(){
    var name=el('li-name').value.trim()||'用户';
    var pw=el('li-pw').value;
    if(!pw){alert('请输入密码');return false;}
    var user={name:name,dept:'产品运营部',role:'产品经理'};
    localStorage.setItem('rb_user',JSON.stringify(user));
    DB.user=user;
    $LOGIN.classList.add('n');
    $APP.classList.add('show');
    switchTabBar(0);
    return false;
  }
  function doReg(){
    var name=el('re-name').value.trim();
    var pw=el('re-pw').value;
    var dept=el('re-dept').value.trim()||'新部门';
    if(!name||!pw){alert('请填写完整');return false;}
    var user={name:name,dept:dept,role:'新成员'};
    localStorage.setItem('rb_user',JSON.stringify(user));
    DB.user=user;
    $LOGIN.classList.add('n');
    $APP.classList.add('show');
    switchTabBar(0);
    return false;
  }
  function switchTab(tab){
    $$('.tab').forEach(function(b){b.classList.remove('on');});
    $$('.form-body').forEach(function(f){f.classList.remove('on');});
    if(tab==='login'){
      el('tab-login').classList.add('on');
      el('form-login').classList.add('on');
    } else {
      el('tab-reg').classList.add('on');
      el('form-reg').classList.add('on');
    }
  }

  // ===== TAB BAR =====
  // HTML uses .ti for tab buttons, id="tab-0" to "tab-4"
  // Pages: home-screen, chat-screen, work-screen, contacts-screen, profile-screen
  // But HTML doesn't have these screens! We use sub-screens instead.
  // So we build home/chat/work/contacts/profile as dynamic content inside #app
  function switchTabBar(idx){
    // Update tab button states
    for(var i=0;i<5;i++){
      var btn=el('tab-'+i);
      if(btn) btn.classList[i===idx?'add':'remove']('on');
    }
    // Hide all screens
    $$('.screen').forEach(function(s){s.classList.remove('on');});
    // Show the right main view
    if(idx===0) showHome();
    else if(idx===1) showChatList();
    else if(idx===2) showWork();
    else if(idx===3){showSubPage('contacts');}
    else if(idx===4){showSubPage('profile');}
    if(idx===1) updateChatBadge();
  }

  // ===== DYNAMIC MAIN SCREENS =====
  // We inject content into #app-main div
  function getMain(){
    var m=el('app-main');
    if(!m){
      m=document.createElement('div');
      m.id='app-main';
      m.style.cssText='flex:1;overflow-y:auto;overflow-x:hidden;padding-bottom:64px;';
      // Insert before tabbar
      var tb=$('.tabbar');
      if(tb) $APP.insertBefore(m,tb);
      else $APP.appendChild(m);
    }
    return m;
  }

  function showHome(){
    var m=getMain();
    m.style.display='block';
    var h=new Date().getHours();
    var greet=h<12?'上午好':h<18?'下午好':'晚上好';
    var name=DB.user?DB.user.name:'朋友';
    // Weather placeholder
    var wHtml='<div style="background:linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,.1));border-radius:12px;padding:14px;border:1px solid rgba(255,255,255,.25)">'
      +'<div style="display:flex;align-items:center;gap:10px">'
      +'<span id="w-ic" style="font-size:36px">⛅</span>'
      +'<div><div id="w-tmp" style="font-size:30px;font-weight:700;color:#fff;line-height:1">--°C</div>'
      +'<div id="w-desc" style="color:rgba(255,255,255,.85);font-size:13px">加载中...</div></div>'
      +'<div style="flex:1;text-align:right">'
      +'<div style="color:rgba(255,255,255,.7);font-size:11px">湿度 <span id="w-hum">--%</span></div>'
      +'<div style="color:rgba(255,255,255,.7);font-size:11px">风速 <span id="w-ws">--km/h</span></div>'
      +'<div style="color:rgba(255,255,255,.7);font-size:11px">体感 <span id="w-fl">--°C</span></div>'
      +'</div></div></div>';

    // Quick actions
    var qHtml='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">'
      +qBtn('📋','任务',"app.show('tasks')",'#e3f2fd')
      +qBtn('💬','消息',"app.switchTabBar(1)",'#f3e5f5')
      +qBtn('📅','会议',"app.show('meetings')",'#fff3e0')
      +qBtn('💰','记账',"app.show('accounts')",'#e8f5e9')
      +qBtn('🖼','相册',"app.show('gallery')",'#fce4ec')
      +qBtn('🏢','组织',"app.show('org')",'#e0f7fa')
      +qBtn('📞','通讯录',"app.switchTabBar(3)",'#ede7f6')
      +qBtn('🔔','通知',"app.show('notif')",'#e8faf0')
      +'</div>';

    // Upcoming meeting
    var mtg=DB.meetings.filter(function(x){return !x.done;})[0];
    var mtgHtml=mtg
      ?'<div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:12px;color:#fff;cursor:pointer" onclick="app.show(\'meetings\')">'
        +'<div style="font-size:13px;font-weight:600">📅 '+mtg.title+'</div>'
        +'<div style="font-size:11px;opacity:.8;margin-top:3px">🕐 '+mtg.time+'</div>'
        +'<div style="font-size:11px;opacity:.65;margin-top:2px">👥 '+mtg.people.slice(0,3).join('、')+(mtg.people.length>3?'…':'')+'</div>'
        +'</div>'
      :'<div style="text-align:center;color:#9aaab8;padding:12px;font-size:13px">暂无会议安排</div>';

    // Tasks preview
    var tasks=DB.tasks.filter(function(x){return !x.done;}).slice(0,3);
    var taskHtml='';
    tasks.forEach(function(t){
      var pc=t.priority==='紧急'?'#e91e63':t.priority==='重要'?'#fa709a':'#9aaab8';
      taskHtml+='<div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:8px;box-shadow:0 2px 10px rgba(79,172,254,.08);display:flex;gap:10px;align-items:flex-start;cursor:pointer" onclick="app.show(\'tasks\')">'
        +'<button style="width:20px;height:20px;border-radius:50%;border:2px solid #ddd;flex-shrink:0;margin-top:2px;background:transparent;cursor:pointer" onclick="event.stopPropagation();app.toggleTask('+t.id+')"></button>'
        +'<div style="flex:1"><div style="font-size:13px;font-weight:500">'+t.title+'</div>'
        +'<div style="display:flex;gap:5px;margin-top:3px">'
        +'<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#fff3e0;color:#f57c00">🕐 '+t.time+'</span>'
        +'<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:'+pc+'22;color:'+pc+'">'+t.priority+'</span>'
        +'</div></div></div>';
    });
    if(!taskHtml) taskHtml='<div style="text-align:center;color:#9aaab8;padding:12px;font-size:13px">暂无待办任务 🎉</div>';

    m.innerHTML='<div style="background:linear-gradient(160deg,#4facfe,#00c6fb 60%,#a8edff);padding:18px 14px 48px;border-radius:0 0 24px 24px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
      +'<div><div style="color:rgba(255,255,255,.9);font-size:12px">'+greet+'</div>'
      +'<div style="color:#fff;font-size:20px;font-weight:700">'+name+'</div></div>'
      +'<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid rgba(255,255,255,.5)">👤</div>'
      +'</div>'+wHtml+'</div>'
      +'<div style="margin-top:-30px;padding:0 12px">'
      +'<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 4px"><span style="font-size:15px;font-weight:700">快捷功能</span></div>'+qHtml+'</div>'
      +'<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 4px"><span style="font-size:15px;font-weight:700">最近会议</span><span style="font-size:12px;color:#4facfe;cursor:pointer" onclick="app.show(\'meetings\')">查看全部</span></div>'+mtgHtml+'</div>'
      +'<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 4px"><span style="font-size:15px;font-weight:700">待办任务</span><span style="font-size:12px;color:#4facfe;cursor:pointer" onclick="app.show(\'tasks\')">查看全部</span></div>'+taskHtml+'</div>'
      +'</div>';
    fetchWeather();
  }

  function qBtn(icon,label,onclick,bg){
    return '<button style="background:#fff;border-radius:12px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;box-shadow:0 2px 10px rgba(79,172,254,.08);border:none;font-family:inherit;width:100%" onclick="'+onclick+'">'
      +'<div style="width:36px;height:36px;border-radius:10px;background:'+bg+';display:flex;align-items:center;justify-content:center;font-size:18px">'+icon+'</div>'
      +'<span style="font-size:10px;color:#5a6a7a;font-weight:500">'+label+'</span></button>';
  }

  function showChatList(){
    var m=getMain();
    m.style.display='block';
    var html='<div style="background:linear-gradient(135deg,#4facfe,#00c6fb);padding:14px;"><div style="font-size:16px;font-weight:600;color:#fff;text-align:center">消息</div></div>'
      +'<div style="padding:10px 14px"><div style="background:#fff;border-radius:12px;display:flex;align-items:center;gap:8px;padding:9px 12px;box-shadow:0 2px 10px rgba(79,172,254,.08);margin-bottom:10px"><span style="color:#9aaab8">🔍</span><span style="color:#9aaab8;font-size:13px">搜索</span></div></div>'
      +'<div id="chat-lst">';
    DB.chats.forEach(function(c){
      var badge=c.badge>0?'<span style="min-width:16px;height:16px;border-radius:9px;background:#ff6b6b;color:#fff;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;padding:0 4px">'+(c.badge>99?'99+':c.badge)+'</span>':'';
      var av=c.type==='group'
        ?'<div style="width:46px;height:46px;border-radius:50%;display:flex;flex-wrap:wrap;overflow:hidden;gap:1px;background:#eee;flex-shrink:0"><span style="width:50%;height:50%;display:flex;align-items:center;justify-content:center;font-size:14px;background:#e3f2fd">👤</span><span style="width:50%;height:50%;display:flex;align-items:center;justify-content:center;font-size:14px;background:#f3e5f5">👩</span><span style="width:50%;height:50%;display:flex;align-items:center;justify-content:center;font-size:14px;background:#fff3e0">👨</span><span style="width:50%;height:50%;display:flex;align-items:center;justify-content:center;font-size:14px;background:#e8f5e9">👥</span></div>'
        :'<div style="width:46px;height:46px;border-radius:50%;background:#e3f2fd;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;position:relative">👤'+(c.online?'<span style="position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:#43e97b;border:2px solid #fff"></span>':'')+'</div>';
      html+='<div style="display:flex;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f5f5f5" onclick="app.openChat('+c.id+')">'
        +av
        +'<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+c.name+'</div>'
        +'<div style="font-size:12px;color:#9aaab8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(c.lastMsg||'')+'</div></div>'
        +'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0"><span style="font-size:10px;color:#9aaab8">'+(c.time||'')+'</span>'+badge+'</div>'
        +'</div>';
    });
    html+='</div>';
    m.innerHTML=html;
  }

  function showWork(){
    var m=getMain();
    m.style.display='block';
    var done=DB.tasks.filter(function(t){return t.done;}).length;
    var total=DB.tasks.length;
    var urgent=DB.tasks.filter(function(t){return t.priority==='紧急'&&!t.done;}).length;
    var exp=DB.accounts.filter(function(a){return a.type==='out';}).reduce(function(s,a){return s+parseFloat(a.amount);},0);

    m.innerHTML='<div style="background:linear-gradient(135deg,#4facfe,#00c6fb);padding:14px;"><div style="font-size:16px;font-weight:600;color:#fff;text-align:center">工作台</div></div>'
      +'<div style="padding:10px 14px">'
      +'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px">'
      +statCard('总任务',total,'#4facfe')
      +statCard('已完成',done,'#43e97b')
      +statCard('紧急',urgent,'#e91e63')
      +statCard('本月支出','¥'+exp.toFixed(0),'#fa709a')
      +'</div>'
      +'<div style="display:flex;gap:7px;margin-bottom:14px;overflow-x:auto">'
      +wTab('ov','概览',true)+wTab('tasks','任务',false)+wTab('accts','记账',false)+wTab('mtgs','会议',false)
      +'</div>'
      +'<div id="wp-ov" class="wp-panel">'
        +'<div style="font-size:14px;font-weight:600;margin-bottom:10px">最近任务</div>'
        +'<div id="tasks-list"></div>'
      +'</div>'
      +'<div id="wp-tasks" class="wp-panel" style="display:none"><div id="tasks-list2"></div></div>'
      +'<div id="wp-accts" class="wp-panel" style="display:none"><div id="accounts-list"></div></div>'
      +'<div id="wp-mtgs" class="wp-panel" style="display:none"><div id="meetings-list"></div></div>'
      +'</div>';
    renderTasksList();
    renderAccountsList();
    renderMeetingsList();
  }

  function statCard(label,val,color){
    return '<div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 10px rgba(79,172,254,.08)">'
      +'<div style="font-size:11px;color:#9aaab8;margin-bottom:4px">'+label+'</div>'
      +'<div style="font-size:22px;font-weight:700;color:'+color+'">'+val+'</div></div>';
  }
  function wTab(id,label,active){
    return '<button id="wt-'+id+'" style="padding:6px 14px;border-radius:18px;font-size:12px;font-weight:500;background:'+(active?'#4facfe':'#fff')+';color:'+(active?'#fff':'#5a6a7a')+';border:none;cursor:pointer;box-shadow:0 2px 10px rgba(79,172,254,.08);white-space:nowrap;font-family:inherit" onclick="app.switchWorkTab(\''+id+'\')">'
      +label+'</button>';
  }

  function switchWorkTab(tab){
    var tabs=['ov','tasks','accts','mtgs'];
    tabs.forEach(function(t){
      var btn=el('wt-'+t);
      var panel=el('wp-'+t);
      if(btn){btn.style.background=t===tab?'#4facfe':'#fff';btn.style.color=t===tab?'#fff':'#5a6a7a';}
      if(panel)panel.style.display=t===tab?'block':'none';
    });
    if(tab==='tasks') renderTasksList();
    if(tab==='accts') renderAccountsList();
    if(tab==='mtgs') renderMeetingsList();
  }

  // ===== WEATHER =====
  function fetchWeather(){
    fetch('https://wttr.in/haikou?format=j1&lang=zh').then(function(r){return r.json();})
      .then(function(data){
        var c=data.current_condition[0];
        var wm={113:'☀️',116:'⛅',119:'☁️',122:'☁️',176:'🌦',200:'⛈',263:'🌧',293:'🌧',296:'🌧',353:'🌧'};
        var wd={113:'晴朗',116:'多云',119:'阴天',122:'阴天',176:'阵雨',200:'雷暴',263:'小雨',293:'小雨',296:'中雨',353:'阵雨'};
        var wic=el('w-ic'); if(wic)wic.textContent=wm[c.weatherCode]||'⛅';
        var wtmp=el('w-tmp'); if(wtmp)wtmp.textContent=c.temp_C+'°C';
        var wdesc=el('w-desc'); if(wdesc)wdesc.textContent=wd[c.weatherCode]||'多云';
        var whum=el('w-hum'); if(whum)whum.textContent=c.humidity+'%';
        var wws=el('w-ws'); if(wws)wws.textContent=c.windspeedKmph+'km/h';
        var wfl=el('w-fl'); if(wfl)wfl.textContent=c.feelsLikeC+'°C';
      })
      .catch(function(){
        var wic=el('w-ic'); if(wic)wic.textContent='⛅';
        var wtmp=el('w-tmp'); if(wtmp)wtmp.textContent='26°C';
        var wdesc=el('w-desc'); if(wdesc)wdesc.textContent='晴转多云';
      });
  }

  // ===== CHAT DETAIL =====
  function openChat(id){
    currentChatId=id;
    var c=DB.chats.find(function(x){return x.id===id;});
    if(!c)return;
    c.badge=0;save('chats');updateChatBadge();
    // Hide main content
    var m=el('app-main');
    if(m)m.style.display='none';
    // Hide all screens
    $$('.screen').forEach(function(s){s.classList.remove('on');});
    // Show chat detail
    var cd=el('chat-detail-screen');
    if(cd)cd.classList.add('on');
    var ct=el('chat-title');
    if(ct)ct.textContent=c.name;
    renderChatMsgs(c);
  }
  function renderChatMsgs(c){
    var msgs=el('chat-msgs');
    if(!msgs)return;
    var items=c.msgs||getDefaultMsgs(c);
    var html='';
    items.forEach(function(m){
      html+='<div style="display:flex;gap:7px;max-width:78%;'+(m.mine?'align-self:flex-end;flex-direction:row-reverse':'')+'">'
        +'<div style="width:30px;height:30px;border-radius:50%;background:'+(m.mine?'#e3f2fd':'#f3e5f5')+';display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;align-self:flex-end">👤</div>'
        +'<div><div style="padding:9px 12px;border-radius:16px;font-size:13px;line-height:1.5;max-width:100%;word-break:break-all;'+(m.mine?'background:linear-gradient(135deg,#4facfe,#00c6fb);color:#fff;border-bottom-right-radius:4px':'background:#fff;box-shadow:0 2px 10px rgba(79,172,254,.08);border-bottom-left-radius:4px')+'">'+escHtml(m.text)+'</div>'
        +'<div style="font-size:9px;color:#9aaab8;margin-top:2px;'+(m.mine?'text-align:right':'')+'">'+(m.time||'')+'</div></div></div>';
    });
    msgs.innerHTML=html;
    msgs.scrollTop=msgs.scrollHeight;
  }
  function getDefaultMsgs(c){
    if(c.type==='group') return[
      {from:'李明',text:'各位，彩虹桥的测试报告出来了',time:'14:20',mine:false},
      {from:'王姐',text:'收到，马上去处理！',time:'14:22',mine:false}
    ];
    return[{from:c.name,text:'你好！有什么可以帮你的？',time:'刚刚',mine:false}];
  }
  function sendChatMsg(){
    var input=el('chat-input');
    if(!input||!currentChatId)return;
    var text=input.value.trim();
    if(!text)return;
    var c=DB.chats.find(function(x){return x.id===currentChatId;});
    if(!c)return;
    if(!c.msgs)c.msgs=getDefaultMsgs(c);
    c.msgs.push({from:'我',text:text,time:'刚刚',mine:true});
    c.lastMsg=text;c.time='刚刚';save('chats');
    input.value='';
    renderChatMsgs(c);
    var replies=['好的，收到！','了解~','👍没问题','稍等确认一下','好的，等你'];
    setTimeout(function(){
      var reply=replies[Math.floor(Math.random()*replies.length)];
      c.msgs.push({from:c.name,text:reply,time:'刚刚',mine:false});
      c.lastMsg=reply;save('chats');
      renderChatMsgs(c);
    },800+Math.random()*1200);
  }
  function updateChatBadge(){
    var total=DB.chats.reduce(function(s,c){return s+(c.badge||0);},0);
    var dot=$('.ti-dot');
    if(dot){dot.style.display=total>0?'block':'none';dot.textContent=total>99?'99+':total;}
  }

  // ===== TASKS =====
  function renderTasksList(){
    var elems=[el('tasks-list'),el('tasks-list2')];
    elems.forEach(function(e){
      if(!e)return;
      var html='';
      DB.tasks.forEach(function(t){
        var pc=t.priority==='紧急'?'#e91e63':t.priority==='重要'?'#fa709a':'#43e97b';
        html+='<div style="background:#fff;border-radius:12px;padding:12px;box-shadow:0 2px 10px rgba(79,172,254,.08);display:flex;gap:10px;margin-bottom:8px">'
          +'<button style="width:22px;height:22px;border-radius:50%;border:2px solid '+(t.done?'#43e97b':'#ddd')+';flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:'+(t.done?'#43e97b':'transparent')+';color:#fff;font-size:12px" onclick="app.toggleTask('+t.id+')">'+(t.done?'✓':'')+'</button>'
          +'<div style="flex:1"><div style="font-size:14px;font-weight:500;text-decoration:'+(t.done?'line-through':'')+';color:'+(t.done?'#9aaab8':'')+'">'+t.title+'</div>'
          +'<div style="font-size:11px;color:#9aaab8;margin-top:3px">'+(t.done?'已完成':'待处理')+'</div>'
          +'<div style="display:flex;gap:5px;margin-top:7px">'
          +'<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#fff3e0;color:#f57c00">🕐 '+(t.time||'')+'</span>'
          +'<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:'+pc+'22;color:'+pc+'">'+t.priority+'</span>'
          +'</div></div></div>';
      });
      e.innerHTML=html||'<div style="text-align:center;color:#9aaab8;padding:20px">暂无任务</div>';
    });
  }
  function toggleTask(id){
    var t=DB.tasks.find(function(x){return x.id===id;});
    if(t){t.done=!t.done;save('tasks');}
    renderTasksList();
  }
  function quickAdd(){
    var title=prompt('输入任务标题：');
    if(!title)return;
    DB.tasks.unshift({id:Date.now(),title:title,done:false,time:'今天',priority:'普通'});
    save('tasks');renderTasksList();
  }

  // ===== ACCOUNTS =====
  function renderAccountsList(){
    var e=el('accounts-list');
    if(!e)return;
    var inc=0,exp=0;
    DB.accounts.forEach(function(a){if(a.type==='in')inc+=parseFloat(a.amount);else exp+=parseFloat(a.amount);});
    var bal=inc-exp;
    var bv=el('bal-val'); if(bv)bv.textContent='¥'+bal.toFixed(2);
    var iv=el('inc-val'); if(iv)iv.textContent='+¥'+inc.toFixed(2);
    var ev=el('exp-val'); if(ev)ev.textContent='-¥'+Math.abs(exp).toFixed(2);
    var html='';
    DB.accounts.forEach(function(a){
      var ac=a.type==='in'?'#43e97b':'#ff6b6b';
      var bg=a.type==='in'?'#e8f5e9':'#fce4ec';
      html+='<div style="background:#fff;border-radius:12px;padding:12px;box-shadow:0 2px 10px rgba(79,172,254,.08);display:flex;gap:10px;align-items:center;margin-bottom:7px">'
        +'<div style="width:38px;height:38px;border-radius:10px;background:'+bg+';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+a.cat+'</div>'
        +'<div style="flex:1"><div style="font-size:13px;font-weight:500">'+a.note+'</div><div style="font-size:11px;color:#9aaab8;margin-top:1px">'+(a.date||'')+'</div></div>'
        +'<div style="font-size:15px;font-weight:700;color:'+ac+'">'+(a.type==='in'?'+':'')+a.amount+'</div></div>';
    });
    e.innerHTML=html;
  }

  // ===== MEETINGS =====
  function renderMeetingsList(){
    var e=el('meetings-list');
    if(!e)return;
    var html='';
    DB.meetings.forEach(function(m){
      html+='<div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 10px rgba(79,172,254,.08);border-left:3px solid #4facfe;margin-bottom:10px">'
        +'<div style="font-size:14px;font-weight:600">'+m.title+'</div>'
        +'<div style="font-size:11px;color:#4facfe;margin-top:3px;font-weight:500">🕐 '+m.time+'</div>'
        +'<div style="font-size:12px;color:#5a6a7a;margin-top:5px;line-height:1.5">'+m.desc+'</div>'
        +'<div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">'+m.people.map(function(){return '<span style="width:26px;height:26px;border-radius:50%;background:#e3f2fd;display:inline-flex;align-items:center;justify-content:center;font-size:12px">👤</span>';}).join('')+'</div></div>';
    });
    e.innerHTML=html;
  }

  // ===== ORG =====
  function renderOrg(){
    var e=el('org-tree');
    if(!e)return;
    e.innerHTML='<div style="display:flex;flex-direction:column;align-items:center">'
      +'<div style="background:#fff;border-radius:12px;padding:12px 18px;text-align:center;box-shadow:0 8px 24px rgba(79,172,254,.12);border:2px solid #4facfe;min-width:130px">'
      +'<div style="font-size:14px;font-weight:700">林总</div><div style="font-size:11px;color:#9aaab8">总经理</div>'
      +'<div style="font-size:10px;color:#4facfe;background:#e3f2fd;padding:1px 7px;border-radius:20px;margin-top:5px;display:inline-block">管理层</div></div>'
      +'<div style="width:2px;height:22px;background:#e0f2fe"></div>'
      +'<div style="display:flex;gap:14px">'
      +orgCard('张伟','技术负责人','技术研发部')
      +orgCard('陈默','产品经理','产品运营部')
      +'</div></div>';
  }
  function orgCard(name,role,dept){
    return '<div style="display:flex;flex-direction:column;align-items:center">'
      +'<div style="background:#fff;border-radius:12px;padding:12px 18px;text-align:center;box-shadow:0 8px 24px rgba(79,172,254,.12);border:2px solid #e0f2fe;min-width:110px">'
      +'<div style="font-size:14px;font-weight:700">'+name+'</div>'
      +'<div style="font-size:11px;color:#9aaab8">'+role+'</div>'
      +'<div style="font-size:10px;color:#4facfe;background:#e3f2fd;padding:1px 7px;border-radius:20px;margin-top:5px;display:inline-block">'+dept+'</div></div></div>';
  }

  // ===== CONTACTS =====
  function renderContacts(){
    var e=el('contacts-list');
    if(!e)return;
    var depts={};
    DB.members.forEach(function(m){if(!depts[m.dept])depts[m.dept]=[];depts[m.dept].push(m);});
    var html='',i=0;
    Object.keys(depts).forEach(function(dept){
      var ms=depts[dept];
      html+='<div style="background:#fff;border-radius:12px;margin-bottom:7px;overflow:hidden;box-shadow:0 2px 10px rgba(79,172,254,.08)" id="dept-'+i+'">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer" onclick="app.toggleDept('+i+')">'
        +'<div><div style="font-size:13px;font-weight:600">'+dept+'</div><div style="font-size:11px;color:#9aaab8">'+ms.length+'人</div></div>'
        +'<span id="dept-arr-'+i+'" style="font-size:11px;color:#9aaab8;transition:transform .2s">▼</span></div>'
        +'<div id="dept-ms-'+i+'" style="display:none;padding:0 14px 10px">'
        +ms.map(function(m){
          return '<div style="display:flex;gap:9px;padding:9px 0;align-items:center;cursor:pointer;border-top:1px solid #f0f0f0" onclick="app.openChatByMember(\''+m.name+'\')">'
            +'<div style="width:36px;height:36px;border-radius:50%;background:'+(m.online?'#e3f2fd':'#f5f5f5')+';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">👤</div>'
            +'<div><div style="font-size:13px;font-weight:500">'+m.name+'</div>'
            +'<div style="font-size:11px;color:#9aaab8">'+m.role+' · '+(m.online?'🟢在线':'⚫离线')+'</div></div></div>';
        }).join('')
        +'</div></div>';
      i++;
    });
    e.innerHTML=html;
  }
  function toggleDept(i){
    var ms=el('dept-ms-'+i);
    var arr=el('dept-arr-'+i);
    if(ms){
      var open=ms.style.display==='block';
      ms.style.display=open?'none':'block';
      if(arr)arr.style.transform=open?'':'rotate(180deg)';
    }
  }
  function openChatByMember(name){
    var c=DB.chats.find(function(x){return x.name===name;});
    if(!c){
      c={id:Date.now(),name:name,type:'person',lastMsg:'开始聊天吧~',time:'刚刚',badge:0,online:true,msgs:[{from:name,text:'开始聊天吧~',time:'刚刚',mine:false}]};
      DB.chats.unshift(c);save('chats');
    }
    openChat(c.id);
  }

  // ===== PROFILE =====
  function showProfile(){
    var m=getMain();
    m.style.display='block';
    if(!DB.user)return;
    var done=DB.tasks.filter(function(t){return t.done;}).length;
    var total=DB.tasks.length;
    var unread=DB.chats.filter(function(c){return c.badge>0;}).length;
    m.innerHTML='<div style="background:linear-gradient(160deg,#4facfe,#00c6fb);padding:28px 14px 48px;border-radius:0 0 28px 28px">'
      +'<div style="display:flex;gap:12px;align-items:center">'
      +'<div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:28px;border:2px solid rgba(255,255,255,.5)">👤</div>'
      +'<div><div style="font-size:18px;font-weight:700;color:#fff">'+DB.user.name+'</div>'
      +'<div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:1px">'+DB.user.dept+'</div>'
      +'<div style="display:inline-block;font-size:10px;background:rgba(255,255,255,.25);color:#fff;padding:2px 9px;border-radius:20px;margin-top:5px">'+DB.user.role+'</div></div></div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.15);margin-top:18px;border-radius:18px;overflow:hidden">'
      +'<div style="background:rgba(255,255,255,.15);padding:12px 6px;text-align:center"><div style="font-size:16px;font-weight:700;color:#fff">'+total+'</div><div style="font-size:10px;color:rgba(255,255,255,.7);margin-top:1px">总任务</div></div>'
      +'<div style="background:rgba(255,255,255,.15);padding:12px 6px;text-align:center"><div style="font-size:16px;font-weight:700;color:#fff">'+done+'</div><div style="font-size:10px;color:rgba(255,255,255,.7);margin-top:1px">已完成</div></div>'
      +'<div style="background:rgba(255,255,255,.15);padding:12px 6px;text-align:center"><div style="font-size:16px;font-weight:700;color:#fff">'+unread+'</div><div style="font-size:10px;color:rgba(255,255,255,.7);margin-top:1px">未读消息</div></div>'
      +'</div></div>'
      +'<div style="margin-top:-22px;padding:0 14px">'
      +'<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(79,172,254,.08);overflow:hidden">'
      +menuItem('📋','我的任务',"app.show('tasks')",'#e3f2fd')
      +menuItem('💰','我的账本',"app.show('accounts')",'#e8f5e9')
      +menuItem('📅','我的会议',"app.show('meetings')",'#fff3e0')
      +'<div style="display:flex;gap:10px;align-items:center;padding:13px 14px;cursor:pointer;border-top:1px solid #f5f5f5" onclick="app.logout()">'
      +'<div style="width:32px;height:32px;border-radius:9px;background:#fce4ec;display:flex;align-items:center;justify-content:center;font-size:16px">⏻</div>'
      +'<div style="flex:1;font-size:14px;font-weight:500;color:#ff6b6b">退出登录</div></div>'
      +'</div></div>';
  }
  function menuItem(icon,label,onclick,bg){
    return '<div style="display:flex;gap:10px;align-items:center;padding:13px 14px;cursor:pointer;border-top:1px solid #f5f5f5" onclick="'+onclick+'">'
      +'<div style="width:32px;height:32px;border-radius:9px;background:'+bg+';display:flex;align-items:center;justify-content:center;font-size:16px">'+icon+'</div>'
      +'<div style="flex:1;font-size:14px;font-weight:500">'+label+'</div>'
      +'<span style="color:#9aaab8;font-size:13px">›</span></div>';
  }

  // ===== NOTIFICATIONS =====
  function renderNotifications(){
    var e=el('notif-list');
    if(!e)return;
    var items=[
      {icon:'📋',title:'任务变更',desc:'「彩虹桥PRD文档」标记为紧急',time:'10分钟前'},
      {icon:'📅',title:'会议提醒',desc:'「产品评审会」将于今天14:00开始',time:'30分钟前'},
      {icon:'💬',title:'新消息',desc:'张伟：那个需求我确认一下',time:'2小时前'},
      {icon:'✅',title:'任务完成',desc:'「用户反馈收集」已完成',time:'昨天'},
      {icon:'🏢',title:'组织通知',desc:'本周五将进行季度OKR评估',time:'2天前'}
    ];
    e.innerHTML=items.map(function(n){
      return '<div style="display:flex;gap:10px;padding:12px 14px;background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(79,172,254,.08);align-items:flex-start">'
        +'<div style="width:36px;height:36px;background:#e3f2fd;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">'+n.icon+'</div>'
        +'<div style="flex:1"><div style="font-size:13px;font-weight:600">'+n.title+'</div>'
        +'<div style="font-size:11px;color:#5a6a7a;margin-top:2px">'+n.desc+'</div>'
        +'<div style="font-size:10px;color:#9aaab8;margin-top:2px">'+n.time+'</div></div></div>';
    }).join('');
  }

  // ===== GALLERY =====
  function renderGallery(){
    var e=el('gallery-grid');
    if(!e)return;
    var cols=['#e3f2fd','#f3e5f5','#fff3e0','#e8f5e9','#fce4ec','#e0f7fa','#ede7f6','#e8faf0','#fef9e7'];
    var emos=['🏔','🌅','🌊','🌸','🌿','🏙','🌙','🌈','☁️'];
    var html='';
    for(var i=0;i<18;i++){
      html+='<div style="aspect-ratio:1;border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:28px;background:'+cols[i%cols.length]+'">'+emos[i%emos.length]+'</div>';
    }
    e.innerHTML=html;
  }

  // ===== SHOW SUB PAGE =====
  function showSubPage(id){
    // Hide main dynamic content
    var m=el('app-main');
    if(m)m.style.display='none';
    // Hide all screens
    $$('.screen').forEach(function(s){s.classList.remove('on');});
    // Deactivate tab buttons
    for(var i=0;i<5;i++){var btn=el('tab-'+i);if(btn)btn.classList.remove('on');}

    if(id==='contacts'){
      // Show contacts screen
      var cs=el('contacts-screen');
      if(cs){cs.classList.add('on');renderContacts();}
      el('tab-3').classList.add('on');
      return;
    }
    if(id==='profile'){
      // Show profile screen
      var ps=el('profile-screen');
      if(ps){ps.classList.add('on');}
      el('tab-4').classList.add('on');
      // Render profile into profile-screen body
      renderProfileInto();
      return;
    }

    var map={tasks:'tasks-screen',accounts:'accounts-screen',meetings:'meetings-screen',gallery:'gallery-screen',org:'org-screen',notif:'notif-screen'};
    var sid=map[id];
    if(sid){
      var se=el(sid);
      if(se)se.classList.add('on');
    }
    if(id==='tasks')renderTasksList();
    if(id==='accounts')renderAccountsList();
    if(id==='meetings')renderMeetingsList();
    if(id==='gallery')renderGallery();
    if(id==='org')renderOrg();
    if(id==='notif')renderNotifications();
  }

  function renderProfileInto(){
    if(!DB.user)return;
    var done=DB.tasks.filter(function(t){return t.done;}).length;
    var total=DB.tasks.length;
    var unread=DB.chats.filter(function(c){return c.badge>0;}).length;
    var pn=el('profile-name'); if(pn)pn.textContent=DB.user.name;
    var pd=el('profile-dept'); if(pd)pd.textContent=DB.user.dept||'';
    var pr=el('profile-role'); if(pr)pr.textContent=DB.user.role||'';
    var pt=el('ps-total'); if(pt)pt.textContent=total;
    var pdo=el('ps-done'); if(pdo)pdo.textContent=done;
    var pm=el('ps-msg'); if(pm)pm.textContent=unread;
  }

  function backHome(){
    switchTabBar(0);
  }

  function logout(){
    localStorage.removeItem('rb_user');
    localStorage.removeItem('rb_inited');
    location.reload();
  }

  function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // ===== INIT =====
  function init(){
    $LOGIN=el('login');
    $APP=el('app');

    ['tasks','chats','meetings','accounts','members'].forEach(load);
    var saved=localStorage.getItem('rb_user');
    if(saved){try{DB.user=JSON.parse(saved);}catch(e){}}
    if(!localStorage.getItem('rb_inited')){initData();localStorage.setItem('rb_inited','1');}

    if(DB.user){
      $LOGIN.classList.add('n');
      $APP.classList.add('show');
      switchTabBar(0);
    }

    // Wire up send button
    var sendBtn=$('.csend');
    if(sendBtn)sendBtn.onclick=sendChatMsg;
    var chatInput=el('chat-input');
    if(chatInput)chatInput.onkeydown=function(e){if(e.key==='Enter')sendChatMsg();};
  }

  // Expose API
  window.app={
    doLogin:doLogin,doReg:doReg,switchTab:switchTab,
    switchTabBar:switchTabBar,show:showSubPage,
    openChat:openChat,backHome:backHome,
    switchWorkTab:switchWorkTab,toggleTask:toggleTask,
    toggleDept:toggleDept,openChatByMember:openChatByMember,
    quickAdd:quickAdd,logout:logout
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else {init();}
})();
