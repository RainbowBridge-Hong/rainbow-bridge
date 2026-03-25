// ===== RAINBOW BRIDGE APP =====
(function(){
  var DB={user:null,tasks:[],chats:[],meetings:[],accounts:[],members:[]};

  function save(k){localStorage.setItem('rb_'+k,JSON.stringify(DB[k]));}
  function load(k){try{DB[k]=JSON.parse(localStorage.getItem('rb_'+k)||'[]');}catch(e){DB[k]=[];}}

  function initData(){
    DB.user={name:'陈默',avatar:'&#x1F464;',dept:'产品运营部',role:'产品经理'};
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
      {id:1,cat:'&#x1F354;',note:'午餐',amount:'-28.5',type:'out',date:'今天'},
      {id:2,cat:'&#x1F69A;',note:'地铁',amount:'-4.00',type:'out',date:'今天'},
      {id:3,cat:'&#x1F4B0;',note:'项目奖金',amount:'+8000',type:'in',date:'昨天'},
      {id:4,cat:'&#x2615;',note:'咖啡',amount:'-32',type:'out',date:'昨天'},
      {id:5,cat:'&#x1F6D2;',note:'日用品',amount:'-156.8',type:'out',date:'周一'},
      {id:6,cat:'&#x1F35C;',note:'晚餐',amount:'-45',type:'out',date:'周一'}
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

  var currentTabBar=0,currentChatId=null;
  var $APP,$LOGIN;

  function $(s){return document.querySelector(s);}
  function $$(s){return document.querySelectorAll(s);}

  // ===== LOGIN =====
  function doLogin(){
    var name=$('#li-name').value.trim()||'用户';
    var pw=$('#li-pw').value;
    if(!pw){alert('请输入密码');return false;}
    var user={name:name,dept:'产品运营部',role:'产品经理'};
    localStorage.setItem('rb_user',JSON.stringify(user));
    DB.user=user; afterLogin(); return false;
  }
  function doReg(){
    var name=$('#re-name').value.trim();
    var pw=$('#re-pw').value;
    var dept=$('#re-dept').value.trim()||'新部门';
    if(!name||!pw){alert('请填写完整');return false;}
    var user={name:name,dept:dept,role:'新成员'};
    localStorage.setItem('rb_user',JSON.stringify(user));
    DB.user=user; afterLogin(); return false;
  }
  function switchTab(tab){
    $$('.tab').forEach(function(b){b.classList.remove('on');});
    $$('.form-body').forEach(function(f){f.classList.remove('on');});
    if(tab==='login'){
      $('.tab-login').classList.add('on');
      $('#form-login').classList.add('on');
    } else {
      $('.tab-reg').classList.add('on');
      $('#form-reg').classList.add('on');
    }
  }

  // ===== TAB BAR =====
  function switchTabBar(idx){
    currentTabBar=idx;
    var pages=['home-screen','chat-screen','work-screen','contacts-screen','profile-screen'];
    $$('.tab-item').forEach(function(t){t.classList.remove('on');});
    $$('.screen').forEach(function(s){s.classList.remove('on');});
    $$('.tab-item')[idx].classList.add('on');
    $('#'+pages[idx]).classList.add('on');
    if(idx===1) updateChatBadge();
  }

  // ===== APP ENTRY =====
  function afterLogin(){
    $LOGIN.classList.add('n');
    $APP.classList.add('show');
    renderAll();
    switchTabBar(0);
    fetchWeather();
  }

  // ===== RENDER ALL =====
  function renderAll(){
    renderHome();
    renderChatList();
    renderWork();
    renderContacts();
    renderProfile();
    updateChatBadge();
  }

  // ===== HOME =====
  function renderHome(){
    if(!DB.user)return;
    var h=new Date().getHours();
    var greet=h<12?'上午好':h<18?'下午好':'晚上好';
    $('#greet-t').textContent=greet+'，';
    $('#greet-n').textContent=DB.user.name;
    renderHomeMeetings();
    renderHomeTasks();
  }
  function renderHomeMeetings(){
    var el=$('#home-mtg');
    if(!el)return;
    var m=DB.meetings.filter(function(x){return !x.done;})[0];
    if(!m){el.innerHTML='';return;}
    el.innerHTML='<div class="mc" onclick="app.show(\'meetings\')">'+
      '<div class="mct">&#x1F4C5; '+m.title+'</div>'+
      '<div class="mti">&#x1F551; '+m.time+'</div>'+
      '<div class="mpl">&#x1F465; '+m.people.slice(0,3).join('、')+(m.people.length>3?'…':'')+'</div></div>';
  }
  function renderHomeTasks(){
    var el=$('#home-task');
    if(!el)return;
    var all=DB.tasks.filter(function(x){return !x.done;}).concat(DB.tasks.filter(function(x){return x.done;})).slice(0,3);
    var html='';
    all.forEach(function(t){
      var pc=t.priority==='紧急'?'#e91e63':t.priority==='重要'?'#fa709a':'#9aaab8';
      html+='<div class="tc" onclick="app.show(\'tasks\')">'+
        '<button class="tcc '+(t.done?'done':'')+'" onclick="e.stopPropagation();app.toggleTask('+t.id+')">'+(t.done?'&#x2713;':'')+'</button>'+
        '<div class="tcb"><div class="tct '+(t.done?'done':'')+'">'+t.title+'</div>'+
        '<div class="tc-meta"><span class="ttag ttime">&#x1F551; '+t.time+'</span><span class="ttag tpri" style="background:'+pc+'22;color:'+pc+'">'+t.priority+'</span></div></div></div>';
    });
    el.innerHTML=html||'<div style="text-align:center;color:#9aaab8;padding:16px">暂无任务</div>';
  }

  // ===== WEATHER =====
  function fetchWeather(){
    var el=$('#w-ic');
    if(!el)return;
    fetch('https://wttr.in/haikou?format=j1&lang=zh').then(function(r){return r.json();})
      .then(function(data){
        var c=data.current_condition[0];
        var wm={113:'&#x2600;',116:'&#x26C5;',119:'&#x2601;',122:'&#x2601;',176:'&#x1F326;',200:'&#x26C8;',263:'&#x1F327;',293:'&#x1F327;',296:'&#x1F327;',353:'&#x1F327;'};
        var wd={113:'晴朗',116:'多云',119:'阴天',122:'阴天',176:'阵雨',200:'雷暴',263:'小雨',293:'小雨',296:'中雨',353:'阵雨'};
        el.textContent=wm[c.weatherCode]||'&#x26C5;';
        $('#w-tmp').textContent=c.temp_C+'°C';
        $('#w-desc').textContent=wd[c.weatherCode]||'多云';
        $('#w-hum').textContent=c.humidity+'%';
        $('#w-ws').textContent=c.windspeedKmph+'km/h';
        $('#w-fl').textContent=c.feelsLikeC+'°C';
      })
      .catch(function(){
        el.textContent='&#x26C5;';
        $('#w-tmp').textContent='26°C';
        $('#w-desc').textContent='晴转多云';
      });
  }

  // ===== CHAT LIST =====
  function renderChatList(){
    var el=$('#chat-lst');
    if(!el)return;
    var html='';
    DB.chats.forEach(function(c){
      var badge=c.badge>0?'<span class="cb2">'+(c.badge>99?'99+':c.badge)+'</span>':'<span class="cb2" style="display:none">0</span>';
      var gi=c.type==='group'
        ?'<div class="gi"><span style="background:#e3f2fd">&#x1F464;</span><span style="background:#f3e5f5">&#x1F469;</span><span style="background:#fff3e0">&#x1F468;</span><span style="background:#e8f5e9">&#x1F465;</span></div>'
        :'<span style="font-size:22px">&#x1F464;</span>';
      html+='<div class="ci" onclick="app.openChat('+c.id+')">'+
        '<div class="ca">'+gi+(c.type==='person'&&c.online?'<span class="od"></span>':'')+'</div>'+
        '<div class="cb"><div class="cn">'+c.name+'</div><div class="cm2">'+(c.lastMsg||'')+'</div></div>'+
        '<div class="cmt"><span class="cti">'+(c.time||'')+'</span>'+badge+'</div></div>';
    });
    el.innerHTML=html;
  }
  function updateChatBadge(){
    var total=DB.chats.reduce(function(s,c){return s+(c.badge||0);},0);
    var dot=$('.ti-dot');
    if(dot){dot.style.display=total>0?'block':'none';dot.textContent=total>99?'99+':total;}
  }

  // ===== CHAT DETAIL =====
  function openChat(id){
    currentChatId=id;
    var c=DB.chats.find(function(x){return x.id===id;});
    if(!c)return;
    c.badge=0;save('chats');updateChatBadge();
    switchTabBar(-1);
    $$('.screen').forEach(function(s){s.classList.remove('on');});
    $('#chat-detail-screen').classList.add('on');
    $('#chat-detail-screen .ht').textContent=c.name;
    renderChatMsgs(c);
  }
  function renderChatMsgs(c){
    var el=$('#chat-msgs');
    if(!el)return;
    var msgs=c.msgs||getDefaultMsgs(c);
    var html='';
    msgs.forEach(function(m){
      html+='<div class="mr '+(m.mine?'mine':'')+'">'+
        '<div class="mrav" style="background:'+(m.mine?'#e3f2fd':'#f3e5f5')+'">&#x1F464;</div>'+
        '<div><div class="mrb">'+escHtml(m.text)+'</div><div class="mrti">'+(m.time||'')+'</div></div></div>';
    });
    el.innerHTML=html;
    el.scrollTop=el.scrollHeight;
  }
  function getDefaultMsgs(c){
    if(c.type==='group') return[
      {from:'李明',text:'各位，彩虹桥的测试报告出来了',time:'14:20',mine:false},
      {from:'王姐',text:'收到，马上去处理！',time:'14:22',mine:false}
    ];
    return[{from:c.name,text:'你好！',time:'刚刚',mine:false}];
  }
  function sendChatMsg(){
    var input=$('#chat-input');
    if(!input||!currentChatId)return;
    var text=input.value.trim();
    if(!text)return;
    var c=DB.chats.find(function(x){return x.id===currentChatId;});
    if(!c){c={id:currentChatId,name:'新对话',type:'person',lastMsg:text,time:'刚刚',badge:0,online:true,msgs:[]};DB.chats.push(c);}
    c.msgs.push({from:'我',text:text,time:'刚刚',mine:true});
    c.lastMsg=text;c.time='刚刚';save('chats');
    input.value='';
    renderChatMsgs(c);
    renderChatList();
    var replies=['好的，收到！','了解~','&#x1F44D;没问题','稍等确认一下','好的，等你'];
    var self=this;
    setTimeout(function(){
      var reply=replies[Math.floor(Math.random()*replies.length)];
      c.msgs.push({from:c.name,text:reply,time:'刚刚',mine:false});
      c.lastMsg=reply;save('chats');
      renderChatMsgs(c);
      renderChatList();
    },800+Math.random()*1200);
  }

  // ===== WORK =====
  function renderWork(){
    renderTasksStats();
    renderTasksList();
    renderAccountsList();
    renderMeetingsList();
    renderOrg();
    renderWorkStats();
  }
  function renderWorkStats(){
    var done=DB.tasks.filter(function(t){return t.done;}).length;
    var total=DB.tasks.length;
    var urgent=DB.tasks.filter(function(t){return t.priority==='紧急'&&!t.done;}).length;
    var exp=DB.accounts.filter(function(a){return a.type==='out';}).reduce(function(s,a){return s+parseFloat(a.amount);},0);
    $('#st-total').textContent=total;
    $('#st-done').textContent=done;
    $('#st-urg').textContent=urgent;
    $('#st-exp').textContent='¥'+exp.toFixed(0);
  }
  function switchWorkTab(tab){
    $$('.wtbtn').forEach(function(b){b.classList.remove('on');});
    $$('.wp').forEach(function(p){p.classList.remove('on');});
    var map={ov:'wp-ov',tasks:'wp-tasks',accts:'wp-accts',mtgs:'wp-mtgs'};
    $('#wt-'+tab).classList.add('on');
    $('#'+map[tab]).classList.add('on');
    if(tab==='tasks') renderTasksList();
    if(tab==='accts') renderAccountsList();
    if(tab==='mtgs') renderMeetingsList();
  }
  function renderTasksList(){
    var el=$('#tasks-list');
    if(!el)return;
    var html='';
    DB.tasks.forEach(function(t){
      var pc=t.priority==='紧急'?'#e91e63':t.priority==='重要'?'#fa709a':'#43e97b';
      html+='<div class="tfi">'+
        '<button class="tfcheck '+(t.done?'done':'')+'" onclick="app.toggleTask('+t.id+')">'+(t.done?'&#x2713;':'')+'</button>'+
        '<div class="tfb"><div class="tft" style="text-decoration:'+(t.done?'line-through':'')+';color:'+(t.done?'#9aaab8':'')+'">'+t.title+'</div>'+
        '<div class="tfd">'+(t.done?'已完成':'待处理')+'</div>'+
        '<div class="tff"><span class="ttag ttime">&#x1F551; '+(t.time||'')+'</span><span class="ttag tpri" style="background:'+pc+'22;color:'+pc+'">'+t.priority+'</span></div></div></div>';
    });
    el.innerHTML=html||'<div style="text-align:center;color:#9aaab8;padding:20px">暂无任务</div>';
  }
  function renderTasksStats(){
    var done=DB.tasks.filter(function(t){return t.done;}).length;
    var total=DB.tasks.length;
    var urgent=DB.tasks.filter(function(t){return t.priority==='紧急'&&!t.done;}).length;
    $('#st-total').textContent=total;
    $('#st-done').textContent=done;
    $('#st-urg').textContent=urgent;
  }
  function toggleTask(id){
    var t=DB.tasks.find(function(x){return x.id===id;});
    if(t){t.done=!t.done;save('tasks');}
    renderTasksList();renderTasksStats();renderHomeTasks();
  }
  function renderAccountsList(){
    var el=$('#accounts-list');
    if(!el)return;
    var inc=0,exp=0;
    DB.accounts.forEach(function(a){if(a.type==='in')inc+=parseFloat(a.amount);else exp+=parseFloat(a.amount);});
    var bal=inc-exp;
    if($('.bv'))$('.bv').textContent='¥'+bal.toFixed(2);
    if($('.bsv'))$('.bsv').textContent='+¥'+inc.toFixed(2);
    if($('.bsv2'))$('.bsv2').textContent='-¥'+exp.toFixed(2);
    var html='';
    DB.accounts.forEach(function(a){
      var ac=a.type==='in'?'#43e97b':'#ff6b6b';
      var bg=a.type==='in'?'#e8f5e9':'#fce4ec';
      html+='<div class="ai"><div class="aicat" style="background:'+bg+'">'+a.cat+'</div>'+
        '<div class="aii"><div class="ain">'+a.note+'</div><div class="aid">'+(a.date||'')+'</div></div>'+
        '<div class="amt '+(a.type==='in'?'in':'out')+'" style="color:'+ac+'">'+(a.type==='in'?'+':'')+a.amount+'</div></div>';
    });
    el.innerHTML=html;
  }
  function renderMeetingsList(){
    var el=$('#meetings-list');
    if(!el)return;
    var html='';
    DB.meetings.forEach(function(m){
      html+='<div class="mi3 '+(m.done?'done':'')+'">'+
        '<div class="mtit" style="opacity:'+(m.done?'0.5':'1')+'">'+m.title+'</div>'+
        '<div class="mtim">&#x1F551; '+m.time+'</div>'+
        '<div class="mdesc">'+m.desc+'</div>'+
        '<div class="mpeople">'+m.people.map(function(p){return '<span class="mav">&#x1F464;</span>';}).join('')+'</div></div>';
    });
    el.innerHTML=html;
  }
  function renderOrg(){
    var el=$('#org-tree');
    if(!el)return;
    el.innerHTML='<div class="on">'+
      '<div class="oc main"><div class="oname">林总</div><div class="orole">总经理</div><div class="odept">管理层</div></div>'+
      '<div class="oline"></div>'+
      '<div class="ochildren">'+
        '<div class="on"><div class="oc"><div class="oname">张伟</div><div class="orole">技术负责人</div><div class="odept">技术研发部</div></div>'+
          '<div class="oline"></div><div class="ochildren" style="padding-left:14px">'+
            '<div class="on"><div class="oc" style="min-width:100px"><div class="oname">陈雪</div><div class="orole">前端工程师</div></div></div>'+
            '<div class="on"><div class="oc" style="min-width:100px"><div class="oname">小王</div><div class="orole">后端工程师</div></div></div></div></div>'+
        '<div class="on"><div class="oc"><div class="oname">陈默</div><div class="orole">产品经理</div><div class="odept">产品运营部</div></div>'+
          '<div class="oline"></div><div class="ochildren" style="padding-left:14px">'+
            '<div class="on"><div class="oc" style="min-width:100px"><div class="oname">刘芳</div><div class="orole">运营主管</div></div></div>'+
            '<div class="on"><div class="oc" style="min-width:100px"><div class="oname">王姐</div><div class="orole">UI设计师</div></div></div></div></div>'+
      '</div></div>';
  }

  // ===== CONTACTS =====
  function renderContacts(){
    var el=$('#contacts-list');
    if(!el)return;
    var depts={};
    DB.members.forEach(function(m){if(!depts[m.dept])depts[m.dept]=[];depts[m.dept].push(m);});
    var html='',i=0;
    Object.keys(depts).forEach(function(dept){
      var ms=depts[dept];
      html+='<div class="dept" id="dept-'+i+'">'+
        '<div class="dept-h" onclick="app.toggleDept('+i+')">'+
          '<div><div class="dept-n">'+dept+'</div><div class="dept-c2">'+ms.length+'人</div></div>'+
          '<span class="dept-arr">&#x25BC;</span></div>'+
        '<div class="dept-ms">'+ms.map(function(m){
          return '<div class="mitem" onclick="app.openChatByMember(\''+m.name+'\')">'+
            '<div class="miav" style="background:'+(m.online?'#e3f2fd':'#f5f5f5')+'">&#x1F464;</div>'+
            '<div><div class="miname">'+m.name+'</div><div class="mirole">'+m.role+' · '+(m.online?'&#x1F7E2;在线':'⚫离线')+'</div></div></div>';
        }).join('')+'</div></div>';
      i++;
    });
    el.innerHTML=html;
  }
  function toggleDept(i){
    var el=$('#dept-'+i);
    if(el)el.classList.toggle('on');
  }
  function openChatByMember(name){
    var c=DB.chats.find(function(x){return x.name===name;});
    if(!c){
      c={id:Date.now(),name:name,type:'person',lastMsg:'开始聊天吧~',time:'刚刚',badge:0,online:true,msgs:[{from:name,text:'开始聊天吧~',time:'刚刚',mine:false}]};
      DB.chats.unshift(c);save('chats');
      renderChatList();
    }
    openChat(c.id);
  }

  // ===== PROFILE =====
  function renderProfile(){
    if(!DB.user)return;
    $('.pn').textContent=DB.user.name;
    $('.pde').textContent=DB.user.dept||'';
    $('.prol').textContent=DB.user.role||'';
    var done=DB.tasks.filter(function(t){return t.done;}).length;
    var total=DB.tasks.length;
    var unread=DB.chats.filter(function(c){return c.badge>0;}).length;
    $$('.psv').forEach(function(el,i){
      if(i===0)el.textContent=total;
      if(i===1)el.textContent=done;
      if(i===2)el.textContent=unread;
    });
  }

  // ===== NOTIFICATIONS =====
  function renderNotifications(){
    var el=$('#notif-list');
    if(!el)return;
    var items=[
      {icon:'&#x1F4CB;',title:'任务变更',desc:'「彩虹桥PRD文档」标记为紧急',time:'10分钟前'},
      {icon:'&#x1F4C5;',title:'会议提醒',desc:'「产品评审会」将于今天14:00开始',time:'30分钟前'},
      {icon:'&#x1F4AC;',title:'新消息',desc:'张伟：那个需求我确认一下',time:'2小时前'},
      {icon:'&#x2705;',title:'任务完成',desc:'「用户反馈收集」已完成',time:'昨天'},
      {icon:'&#x1F3E2;',title:'组织通知',desc:'本周五将进行季度OKR评估',time:'2天前'}
    ];
    el.innerHTML=items.map(function(n){
      return '<div class="ni"><div class="niic">'+n.icon+'</div><div class="nib"><div class="nit">'+n.title+'</div><div class="nid">'+n.desc+'</div><div class="niti">'+n.time+'</div></div></div>';
    }).join('');
  }

  // ===== QUICK ADD =====
  function quickAdd(){
    var title=prompt('输入任务标题：');
    if(!title)return;
    DB.tasks.unshift({id:Date.now(),title:title,done:false,time:'今天',priority:'普通'});
    save('tasks');renderTasksList();renderTasksStats();renderHomeTasks();
  }

  // ===== SHOW SUB PAGE =====
  function showSubPage(id){
    $$('.screen').forEach(function(s){s.classList.remove('on');});
    $$('.tab-item').forEach(function(t){t.classList.remove('on');});
    var map={
      tasks:'tasks-screen',accounts:'accounts-screen',meetings:'meetings-screen',
      gallery:'gallery-screen',org:'org-screen',contacts:'contacts-screen',notif:'notif-screen'
    };
    var sid=map[id]||id+'-screen';
    var el=$('#'+sid);
    if(el)el.classList.add('on');
    if(id==='tasks'){renderTasksList();renderTasksStats();}
    if(id==='accounts')renderAccountsList();
    if(id==='meetings')renderMeetingsList();
    if(id==='gallery')renderGallery();
    if(id==='contacts')renderContacts();
    if(id==='org')renderOrg();
    if(id==='notif')renderNotifications();
  }

  function backHome(){
    switchTabBar(0);
  }

  function renderGallery(){
    var el=$('#gallery-grid');
    if(!el)return;
    var cols=['#e3f2fd','#f3e5f5','#fff3e0','#e8f5e9','#fce4ec','#e0f7fa','#ede7f6','#e8faf0','#fef9e7'];
    var emos=['&#x1F3D4;','&#x1F305;','&#x1F30A;','&#x1F338;','&#x1F33F;','&#x1F3D9;','&#x1F319;','&#x1F308;','&#x2601;'];
    var html='';
    for(var i=0;i<18;i++){
      html+='<div class="gimg" style="background:'+cols[i%cols.length]+'">'+emos[i%emos.length]+'</div>';
    }
    el.innerHTML=html;
  }

  function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // ===== INIT =====
  function init(){
    $LOGIN=$('#login');
    $APP=$('#app');

    ['tasks','chats','meetings','accounts','members'].forEach(load);
    var saved=localStorage.getItem('rb_user');
    if(saved){try{DB.user=JSON.parse(saved);}catch(e){}}
    if(!localStorage.getItem('rb_inited')){initData();localStorage.setItem('rb_inited','1');}

    if(DB.user){
      $LOGIN.classList.add('n');
      $APP.classList.add('show');
      renderAll();
      switchTabBar(0);
      fetchWeather();
    }

    // Wire up send button
    var sendBtn=$('.csend');
    if(sendBtn)sendBtn.onclick=sendChatMsg;
    var chatInput=$('#chat-input');
    if(chatInput)chatInput.onkeydown=function(e){if(e.key==='Enter')sendChatMsg();};
  }

  // Expose API
  window.app={
    doLogin:doLogin,doReg:doReg,switchTab:switchTab,
    switchTabBar:switchTabBar,show:showSubPage,
    openChat:openChat,backHome:backHome,
    switchWorkTab:switchWorkTab,toggleTask:toggleTask,
    toggleDept:toggleDept,openChatByMember:openChatByMember,
    quickAdd:quickAdd
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else {init();}
})();
</script>
