// Rainbow Bridge - Admin Panel
(function(){
  var ADMIN_KEY='rb_admin';
  var ADMIN_DEFAULT={user:'admin',pwd:'admin123'};
  var currentConfirm=null;

  // Cloud storage
  var CLOUD_KEY='rainbow_bridge_cloud';

  function getCloud(){
    try{return JSON.parse(localStorage.getItem(CLOUD_KEY)||'{}');}catch(e){return {};}
  }

  function setCloud(data){
    localStorage.setItem(CLOUD_KEY,JSON.stringify(data));
  }

  function cloudRead(path){
    var data=getCloud();
    var keys=path.split('/');
    var obj=data;
    for(var i=0;i<keys.length;i++){
      if(obj===undefined)return null;
      obj=obj[keys[i]];
    }
    return obj;
  }

  function cloudWrite(path,value){
    var data=getCloud();
    var keys=path.split('/');
    var obj=data;
    for(var i=0;i<keys.length-1;i++){
      if(!obj[keys[i]])obj[keys[i]]={};
      obj=obj[keys[i]];
    }
    obj[keys[keys.length-1]]=value;
    setCloud(data);
  }

  // Admin auth
  function adminLogin(){
    var user=document.getElementById('adminUser').value.trim();
    var pwd=document.getElementById('adminPwd').value;
    if(!user||!pwd){alert('请输入账号和密码');return;}

    var saved=JSON.parse(localStorage.getItem(ADMIN_KEY)||'null');
    var admin=saved||ADMIN_DEFAULT;

    if(user!==admin.user||pwd!==admin.pwd){
      alert('账号或密码错误');return;
    }

    localStorage.setItem(ADMIN_KEY,JSON.stringify({user:user,pwd:pwd,loginTime:Date.now()}));
    showAdminPanel();
  }

  function adminLogout(){
    if(!confirm('确定退出管理后台？'))return;
    localStorage.removeItem(ADMIN_KEY);
    location.reload();
  }

  function checkAdmin(){
    var saved=localStorage.getItem(ADMIN_KEY);
    if(saved){
      try{
        var admin=JSON.parse(saved);
        if(admin.user&&admin.pwd)return admin;
      }catch(e){}
    }
    return null;
  }

  function showAdminPanel(){
    document.getElementById('login').classList.add('hide');
    document.getElementById('admin').classList.add('show');
    var admin=checkAdmin();
    if(admin){
      document.getElementById('adminName').textContent='👤 '+admin.user;
    }
    loadDashboard();
  }

  // Sections
  function showSection(name){
    document.querySelectorAll('.section').forEach(function(s){s.style.display='none';});
    document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
    document.getElementById('section-'+name).style.display='block';
    event.target&&event.target.classList.add('active');

    if(name==='dashboard')loadDashboard();
    else if(name==='users')loadUsers();
    else if(name==='chats')loadChats();
    else if(name==='settings')loadSettings();
  }

  // Dashboard
  function loadDashboard(){
    var users=cloudRead('users')||{};
    var chats=cloudRead('chats')||{};
    var totalMsgs=0;
    var online=0;
    for(var u in users){
      if(users[u].online)online++;
    }
    for(var c in chats){
      totalMsgs+=(chats[c].msgs||[]).length;
    }

    document.getElementById('statUsers').textContent=Object.keys(users).length;
    document.getElementById('statOnline').textContent=online;
    document.getElementById('statChats').textContent=Object.keys(chats).length;
    document.getElementById('statMessages').textContent=totalMsgs;

    // Recent activity
    var activities=[];
    var now=Date.now();
    for(var u in users){
      if(users[u].lastSeen){
        var diff=Math.floor((now-users[u].lastSeen)/1000/60);
        if(diff<60)activities.push(u+'活跃于'+diff+'分钟前');
      }
    }
    var el=document.getElementById('recentActivity');
    if(activities.length>0){
      el.innerHTML=activities.slice(0,10).map(function(a){return '<div style="padding:8px 0;border-bottom:1px solid #f5f5f5">'+a+'</div>';}).join('');
    }else{
      el.innerHTML='<div style="padding:20px;text-align:center;color:#888">暂无活动记录</div>';
    }
  }

  // Users
  function loadUsers(){
    var users=cloudRead('users')||{};
    var html='';
    var list=Object.keys(users).map(function(name){return users[name];});
    list.sort(function(a,b){return (b.joinTime||0)-(a.joinTime||0);});

    if(list.length===0){
      html='<tr><td colspan="5" style="text-align:center;padding:40px;color:#888">暂无用户</td></tr>';
    }else{
      list.forEach(function(u){
        var time=u.joinTime?new Date(u.joinTime).toLocaleString('zh-CN'):'未知';
        html+='<tr>'
          +'<td><div style="font-weight:600">'+escHtml(u.name||'')+'</div></td>'
          +'<td>'+escHtml(u.phone||'')+'</td>'
          +'<td><span class="badge '+(u.online?'badge-success':'badge-danger')+'">'+(u.online?'🟢 在线':'🔴 离线')+'</span></td>'
          +'<td style="color:#888;font-size:12px">'+time+'</td>'
          +'<td><div class="actions">'
          +'<button class="btn-sm btn-primary" onclick="showEditUser(\''+escHtml(u.name||'')+'\')">编辑</button>'
          +'<button class="btn-sm btn-warning" onclick="showResetPwd(\''+escHtml(u.name||'')+'\')">改密</button>'
          +'<button class="btn-sm btn-danger" onclick="confirmDelete(\''+escHtml(u.name||'')+'\',\'user\')">删除</button>'
          +'</div></td></tr>';
      });
    }
    document.getElementById('usersTable').innerHTML=html;
  }

  function filterUsers(){
    var q=document.getElementById('userSearch').value.toLowerCase();
    var users=cloudRead('users')||{};
    var html='';
    var list=Object.keys(users).filter(function(name){
      return name.toLowerCase().includes(q)||(users[name].phone||'').includes(q);
    }).map(function(name){return users[name];});

    list.forEach(function(u){
      html+='<tr>'
        +'<td><div style="font-weight:600">'+escHtml(u.name||'')+'</div></td>'
        +'<td>'+escHtml(u.phone||'')+'</td>'
        +'<td><span class="badge '+(u.online?'badge-success':'badge-danger')+'">'+(u.online?'🟢 在线':'🔴 离线')+'</span></td>'
        +'<td style="color:#888;font-size:12px">'+(u.joinTime?new Date(u.joinTime).toLocaleString('zh-CN'):'未知')+'</td>'
        +'<td><div class="actions">'
        +'<button class="btn-sm btn-primary" onclick="showEditUser(\''+escHtml(u.name||'')+'\')">编辑</button>'
        +'<button class="btn-sm btn-warning" onclick="showResetPwd(\''+escHtml(u.name||'')+'\')">改密</button>'
        +'<button class="btn-sm btn-danger" onclick="confirmDelete(\''+escHtml(u.name||'')+'\',\'user\')">删除</button>'
        +'</div></td></tr>';
    });
    if(!html)html='<tr><td colspan="5" style="text-align:center;padding:40px;color:#888">未找到匹配用户</td></tr>';
    document.getElementById('usersTable').innerHTML=html;
  }

  function showAddUser(){
    document.getElementById('newUserName').value='';
    document.getElementById('newUserPhone').value='';
    document.getElementById('newUserPwd').value='';
    document.getElementById('addUserModal').classList.add('show');
  }

  function addUser(){
    var name=document.getElementById('newUserName').value.trim();
    var phone=document.getElementById('newUserPhone').value.trim();
    var pwd=document.getElementById('newUserPwd').value;
    if(!name||!phone||!pwd){alert('请填写完整信息');return;}
    if(name.length<2||name.length>20){alert('用户名2-20个字符');return;}
    if(!/^1[3-9]\d{9}$/.test(phone)){alert('请输入有效手机号');return;}
    if(pwd.length<6){alert('密码至少6个字符');return;}

    var users=cloudRead('users')||{};
    if(users[name]){alert('用户名已存在');return;}

    users[name]={
      name:name,
      phone:phone,
      password:pwd,
      avatar:'👤',
      online:false,
      joinTime:Date.now(),
      lastSeen:Date.now(),
      status:'离线'
    };
    cloudWrite('users',users);
    closeModal('addUserModal');
    loadUsers();
    alert('用户添加成功！');
  }

  function showEditUser(name){
    var users=cloudRead('users')||{};
    var u=users[name];
    if(!u){alert('用户不存在');return;}
    document.getElementById('editUserName').value=name;
    document.getElementById('editUserPhone').value=u.phone||'';
    document.getElementById('editUserPwd').value='';
    document.getElementById('editUserModal').classList.add('show');
  }

  function saveUser(){
    var name=document.getElementById('editUserName').value;
    var phone=document.getElementById('editUserPhone').value.trim();
    var pwd=document.getElementById('editUserPwd').value;
    if(!phone){alert('请输入手机号');return;}
    if(!/^1[3-9]\d{9}$/.test(phone)){alert('请输入有效手机号');return;}

    var users=cloudRead('users')||{};
    if(!users[name]){alert('用户不存在');return;}

    users[name].phone=phone;
    if(pwd&&pwd.length>=6){
      users[name].password=pwd;
    }
    cloudWrite('users',users);
    closeModal('editUserModal');
    loadUsers();
    alert('用户信息已保存！');
  }

  function showResetPwd(name){
    document.getElementById('resetPwdUser').value=name;
    document.getElementById('resetPwdNew').value='';
    document.getElementById('resetPwdModal').classList.add('show');
  }

  function doResetPwd(){
    var name=document.getElementById('resetPwdUser').value;
    var pwd=document.getElementById('resetPwdNew').value;
    if(!pwd||pwd.length<6){alert('密码至少6个字符');return;}

    var users=cloudRead('users')||{};
    if(!users[name]){alert('用户不存在');return;}

    users[name].password=pwd;
    cloudWrite('users',users);
    closeModal('resetPwdModal');
    loadUsers();
    alert('密码已重置！');
  }

  function confirmDelete(name,type){
    document.getElementById('confirmTitle').textContent='确认删除';
    document.getElementById('confirmMsg').textContent='确定要删除 '+(type==='user'?'用户':'聊天')+' "'+name+'" 吗？此操作不可恢复！';
    document.getElementById('confirmBtn').style.background='#ff4757';
    currentConfirm={type:type,name:name};
    document.getElementById('confirmModal').classList.add('show');
  }

  function doConfirm(){
    if(!currentConfirm)return;
    var type=currentConfirm.type;
    var name=currentConfirm.name;

    if(type==='user'){
      var users=cloudRead('users')||{};
      delete users[name];
      cloudWrite('users',users);
      // Also delete user's chat list
      localStorage.removeItem('rb_userChats_'+name);
      loadUsers();
      alert('用户已删除');
    }else if(type==='chat'){
      var chats=cloudRead('chats')||{};
      delete chats[name];
      cloudWrite('chats',chats);
      loadChats();
      alert('聊天记录已清空');
    }

    closeModal('confirmModal');
    currentConfirm=null;
  }

  // Chats
  function loadChats(){
    var chats=cloudRead('chats')||{};
    var html='';
    var list=Object.keys(chats).map(function(id){return chats[id];});
    list.sort(function(a,b){return (b.lastTimestamp||0)-(a.lastTimestamp||0);});

    if(list.length===0){
      html='<tr><td colspan="5" style="text-align:center;padding:40px;color:#888">暂无聊天记录</td></tr>';
    }else{
      list.forEach(function(c){
        var msgCount=(c.msgs||[]).length;
        html+='<tr>'
          +'<td><div style="font-weight:600">'+escHtml(c.name||'')+'</div></td>'
          +'<td><span class="badge '+(c.type==='group'?'badge-info':'badge-success')+'">'+(c.type==='group'?'群聊':'私聊')+'</span></td>'
          +'<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(c.lastMsg||'')+'</td>'
          +'<td>'+msgCount+'</td>'
          +'<td><div class="actions">'
          +'<button class="btn-sm btn-primary" onclick="viewChat(\''+c.id+'\')">查看</button>'
          +'<button class="btn-sm btn-danger" onclick="confirmDelete(\''+c.id+'\',\'chat\')">清空</button>'
          +'</div></td></tr>';
      });
    }
    document.getElementById('chatsTable').innerHTML=html;
  }

  function filterChats(){
    var q=document.getElementById('chatSearch').value.toLowerCase();
    var chats=cloudRead('chats')||{};
    var html='';
    var list=Object.keys(chats).filter(function(id){
      return (chats[id].name||'').toLowerCase().includes(q)||(chats[id].lastMsg||'').toLowerCase().includes(q);
    }).map(function(id){return chats[id];});

    list.forEach(function(c){
      html+='<tr>'
        +'<td><div style="font-weight:600">'+escHtml(c.name||'')+'</div></td>'
        +'<td><span class="badge '+(c.type==='group'?'badge-info':'badge-success')+'">'+(c.type==='group'?'群聊':'私聊')+'</span></td>'
        +'<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">'+escHtml(c.lastMsg||'')+'</td>'
        +'<td>'+(c.msgs||[]).length+'</td>'
        +'<td><div class="actions">'
        +'<button class="btn-sm btn-primary" onclick="viewChat(\''+c.id+'\')">查看</button>'
        +'<button class="btn-sm btn-danger" onclick="confirmDelete(\''+c.id+'\',\'chat\')">清空</button>'
        +'</div></td></tr>';
    });
    if(!html)html='<tr><td colspan="5" style="text-align:center;padding:40px;color:#888">未找到匹配聊天</td></tr>';
    document.getElementById('chatsTable').innerHTML=html;
  }

  function viewChat(id){
    var chats=cloudRead('chats')||{};
    var chat=chats[id];
    if(!chat){alert('聊天不存在');return;}

    document.getElementById('chatDetailTitle').textContent='💬 '+escHtml(chat.name||'');
    var msgs=chat.msgs||[];
    var html='';
    if(msgs.length===0){
      html='<div style="text-align:center;padding:40px;color:#888">暂无消息</div>';
    }else{
      msgs.forEach(function(m){
        var mine=m.from===chat.members?.[0];
        html+='<div class="chat-msg '+(mine?'from-me':'from-other')+'">'
          +'<div>'+escHtml(m.from||'')+': '+escHtml(m.type==='image'?'[图片]':m.text||'')+'</div>'
          +'<div class="chat-msg-time">'+escHtml(m.time||'')+'</div></div>';
      });
    }
    document.getElementById('chatDetailContent').innerHTML=html;
    document.getElementById('chatDetailModal').classList.add('show');
  }

  function clearChatHistory(){
    var title=document.getElementById('chatDetailTitle').textContent;
    var name=title.replace('💬 ','');
    var chats=cloudRead('chats')||{};
    for(var id in chats){
      if(chats[id].name===name){
        chats[id].msgs=[];
        chats[id].lastMsg='';
        chats[id].lastTimestamp=0;
        cloudWrite('chats',chats);
        break;
      }
    }
    closeModal('chatDetailModal');
    loadChats();
    alert('聊天记录已清空');
  }

  // Settings
  function loadSettings(){
    var settings=JSON.parse(localStorage.getItem('rb_settings')||'{}');
    document.getElementById('toggleRegister').classList[settings.allowRegister!==false?'add':'remove']('active');
    document.getElementById('toggleRealName').classList[settings.requireRealName!==false?'add':'remove']('active');
    document.getElementById('togglePrivate').classList[settings.allowPrivateChat!==false?'add':'remove']('active');
    document.getElementById('toggleGroup').classList[settings.allowGroupChat!==false?'add':'remove']('active');
    document.getElementById('toggleImage').classList[settings.allowImage!==false?'add':'remove']('active');
    document.getElementById('toggleFilter').classList[settings.sensitiveFilter?'add':'remove']('active');
    document.getElementById('msgRetention').value=settings.msgRetention||'30';
  }

  function toggleSetting(key){
    var settings=JSON.parse(localStorage.getItem('rb_settings')||'{}');
    settings[key]=!settings[key];
    localStorage.setItem('rb_settings',JSON.stringify(settings));
    loadSettings();
  }

  function setRetention(){
    var val=document.getElementById('msgRetention').value;
    var settings=JSON.parse(localStorage.getItem('rb_settings')||'{}');
    settings.msgRetention=val;
    localStorage.setItem('rb_settings',JSON.stringify(settings));
    alert('设置已保存');
  }

  function showChangePwd(){
    document.getElementById('curAdminPwd').value='';
    document.getElementById('newAdminPwd').value='';
    document.getElementById('newAdminPwd2').value='';
    document.getElementById('changePwdModal').classList.add('show');
  }

  function doChangeAdminPwd(){
    var cur=document.getElementById('curAdminPwd').value;
    var new1=document.getElementById('newAdminPwd').value;
    var new2=document.getElementById('newAdminPwd2').value;
    var saved=JSON.parse(localStorage.getItem(ADMIN_KEY)||'null');
    var admin=saved||ADMIN_DEFAULT;

    if(cur!==admin.pwd){alert('当前密码错误');return;}
    if(new1.length<6){alert('新密码至少6个字符');return;}
    if(new1!==new2){alert('两次密码不一致');return;}

    var newAdmin={user:admin.user,pwd:new1,loginTime:Date.now()};
    localStorage.setItem(ADMIN_KEY,JSON.stringify(newAdmin));
    closeModal('changePwdModal');
    alert('管理员密码已修改！');
  }

  // Modal helpers
  function closeModal(id){
    document.getElementById(id).classList.remove('show');
  }

  function escHtml(s){
    if(!s)return'';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Init
  function init(){
    var admin=checkAdmin();
    if(admin){
      showAdminPanel();
    }

    document.addEventListener('click',function(e){
      if(e.target.classList.contains('modal')){
        e.target.classList.remove('show');
      }
    });
  }

  init();
})();
