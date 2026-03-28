// Rainbow Bridge Chat App
(function(){
  var CLOUD_KEY='rainbow_bridge_cloud';
  function getCloud(){try{return JSON.parse(localStorage.getItem(CLOUD_KEY)||'{}');}catch(e){return {};}}
  function setCloud(data){localStorage.setItem(CLOUD_KEY,JSON.stringify(data));}
  function cloudRead(path){
    var data=getCloud(),keys=path.split('/'),obj=data;
    for(var i=0;i<keys.length;i++){if(obj===undefined)return null;obj=obj[keys[i]];}
    return obj;
  }
  function cloudWrite(path,value){
    var data=getCloud(),keys=path.split('/'),obj=data;
    for(var i=0;i<keys.length-1;i++){if(!obj[keys[i]])obj[keys[i]]={};obj=obj[keys[i]];}
    obj[keys[keys.length-1]]=value;setCloud(data);
  }
  function cloudPush(path,value){
    var data=getCloud(),keys=path.split('/'),obj=data;
    for(var i=0;i<keys.length-1;i++){if(!obj[keys[i]])obj[keys[i]]={};obj=obj[keys[i]];}
    var id=Date.now().toString(36)+Math.random().toString(36).substr(2,9);
    obj[id]=value;setCloud(data);return id;
  }

  var DB={user:null,chats:[],notifications:[],collectedEmojis:[]},currentChat=null,selectedGroupMembers=[];
  var allEmojis=['😀','😂','😍','🤔','😱','🎉','👍','❤️','🔥','💯','😎','🤗','😴','😤','😡','😭','🤣','😅','😆','😉','😊','😇','🙂','😌','😘','😗','🥰','😋','😛','😜','🤪','😝','🤑','🤭','🤫','🤐','😐','😶','🙄','😏','😮','🤥','😔','😪','🤤','😷','🤒','🤕','🤢','🤧','🤬','🤡','👿','😈','💀','☠️','💩','🤓','🖤','💔','💕','💞','💓','💗','💖','💘','💝','💟','👋','👍','👎','👏','🙌','👐','🤝','✌️','🤞','👌','🌹','🌺','🌻','🌼','🌷','🌱','🍀','🎍','⭐','✨','⚡','🌈','☀️','🌤️','⛅','☁️','🌧️','❄️','☃️','💨','💧','☔','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🚗','🏎️','🎯','🎮','🎰','🧩','🎭','🎪','🎨','🎬','🎤','🎧','📱','💻','📷','💰','💎','🔧','🔨','📔','📕','📖','📗','📘','📙','📚'];

  function genId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9);}
  function getTime(){var d=new Date();return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');}
  function getDate(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0');}
  function save(k){localStorage.setItem('rb_'+k,JSON.stringify(DB[k]));}
  function load(k){try{DB[k]=JSON.parse(localStorage.getItem('rb_'+k)||'[]');}catch(e){DB[k]=[];}}
  function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function ge(id){return document.getElementById(id);}

  function login(){
    var name=ge('loginUser').value.trim(),pwd=ge('loginPwd').value;
    if(!name||!pwd){alert('请输入用户名和密码');return;}
    var users=cloudRead('users')||{},user=users[name];
    if(!user){alert('用户不存在，请先注册');return;}
    if(user.password!==pwd){alert('密码错误');return;}
    user.online=true;user.lastSeen=Date.now();users[name]=user;cloudWrite('users',users);
    DB.user={name:name,phone:user.phone,avatar:user.avatar||'👤',online:true,joinTime:user.joinTime};
    localStorage.setItem('rb_current_user',JSON.stringify(DB.user));
    showApp();
  }

  function register(){
    var name=ge('regUser').value.trim(),phone=ge('regPhone').value.trim(),pwd=ge('regPwd').value;
    if(!name||!phone||!pwd){alert('请填写完整信息');return;}
    if(name.length<2||name.length>20){alert('用户名2-20个字符');return;}
    if(!/^1[3-9]\d{9}$/.test(phone)){alert('请输入有效手机号');return;}
    if(pwd.length<6){alert('密码至少6个字符');return;}
    var users=cloudRead('users')||{};
    if(users[name]){alert('用户名已被注册');return;}
    users[name]={name:name,phone:phone,password:pwd,avatar:'👤',online:true,joinTime:Date.now(),lastSeen:Date.now(),status:'在线'};
    cloudWrite('users',users);
    DB.user={name:name,phone:phone,avatar:'👤',online:true,joinTime:getDate()};
    localStorage.setItem('rb_current_user',JSON.stringify(DB.user));
    showApp();
  }

  function logout(){
    if(!confirm('确定退出登录？'))return;
    if(DB.user){
      var users=cloudRead('users')||{};
      if(users[DB.user.name]){users[DB.user.name].online=false;users[DB.user.name].lastSeen=Date.now();cloudWrite('users',users);}
    }
    localStorage.removeItem('rb_current_user');location.reload();
  }

  function switchTab(tab){
    document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
    document.querySelectorAll('.form-panel').forEach(function(p){p.classList.remove('active');});
    if(tab==='login'){ge('loginTab').classList.add('active');ge('loginPanel').classList.add('active');}
    else{ge('registerTab').classList.add('active');ge('registerPanel').classList.add('active');}
  }

  function showApp(){
    ge('login').classList.add('hide');ge('app').classList.add('show');
    loadUserChats();renderChatList();updateNotifBadge();listenForMessages();
  }

  function loadUserChats(){
    if(!DB.user)return;
    var userChats=cloudRead('userChats/'+DB.user.name)||[];
    DB.chats=userChats.map(function(c){var full=cloudRead('chats/'+c.id);return full||c;});
  }

  function renderChatList(){
    if(DB.chats.length===0){ge('chatList').innerHTML='<div class="empty-state"><div class="empty-icon">💬</div><div>暂无聊天</div><div style="font-size:13px">点击"新聊天"开始</div></div>';return;}
    var h='';
    DB.chats.forEach(function(c){
      var unrd=c.unread||0;
      h+='<div class="chat-item '+(currentChat&&currentChat.id===c.id?'active':'')+'" onclick="app.openChat(\''+c.id+'\')">'
        +'<div class="chat-header"><div class="chat-avatar">'+c.avatar+'</div>'
        +'<div class="chat-info"><div class="chat-name">'+esc(c.name)+'</div>'
        +'<div class="chat-preview">'+(c.lastMsg?'...'+esc(c.lastMsg).substr(-20):'')+'</div></div></div>'
        +'<div class="chat-meta"><div class="chat-time">'+(c.time||'')+'</div>'
        +(unrd>0?'<div class="chat-badge">'+unrd+'</div>':'')+'</div></div>';
    });
    ge('chatList').innerHTML=h;
  }

  function searchChats(){
    var q=(ge('searchInput').value||'').toLowerCase();
    if(!q){renderChatList();return;}
    var filtered=DB.chats.filter(function(c){return (c.name||'').toLowerCase().includes(q);});
    var h='';
    filtered.forEach(function(c){h+='<div class="chat-item" onclick="app.openChat(\''+c.id+'\')"><div class="chat-avatar">'+c.avatar+'</div><div class="chat-name">'+esc(c.name)+'</div></div>';});
    ge('chatList').innerHTML=h||'<div class="empty-state"><div>未找到</div></div>';
  }

  function openChat(id){
    currentChat=DB.chats.find(function(c){return c.id===id;});
    if(!currentChat)return;
    currentChat.unread=0;saveUserChatList();
    ge('backBtn').style.display='flex';
    ge('headerTitle').textContent=currentChat.name+(currentChat.type==='group'?' ('+currentChat.memberNames.length+'人)':'');
    ge('chatEmpty').style.display='none';ge('messages').style.display='flex';ge('inputArea').style.display='flex';
    ge('msgInput').focus();renderMessages();renderChatList();
  }

  function renderMessages(){
    if(!currentChat)return;
    var h='';
    (currentChat.msgs||[]).forEach(function(m){
      var mine=m.from===DB.user.name;
      h+='<div class="msg '+(mine?'mine':'')+'">'
        +'<div class="msg-avatar">'+(mine?DB.user.avatar:getAvatarIcon(m.from))+'</div>'
        +'<div><div style="font-size:11px;color:#888;margin-bottom:4px">'+m.from+'</div>'
        +'<div class="msg-bubble">'+(m.type==='image'?'<img src="'+m.text+'" class="msg-img" onclick="app.previewImage(\''+m.text+'\')">':esc(m.text))+'</div>'
        +'<div class="msg-time">'+m.time+'</div></div></div>';
    });
    ge('messages').innerHTML=h;ge('messages').scrollTop=ge('messages').scrollHeight;
  }

  function getAvatarIcon(name){var users=cloudRead('users')||{};var u=users[name];return (u&&u.avatar)||'👤';}

  function sendMsg(){
    var input=ge('msgInput');if(!input||!currentChat)return;
    var text=input.value.trim();if(!text)return;
    var msg={id:genId(),from:DB.user.name,text:text,type:'text',time:getTime(),timestamp:Date.now()};
    cloudPush('chats/'+currentChat.id+'/messages',msg);
    var chats=cloudRead('chats')||{};
    if(chats[currentChat.id]){chats[currentChat.id].lastMsg=text;chats[currentChat.id].time=getTime();chats[currentChat.id].lastTimestamp=Date.now();cloudWrite('chats',chats);}
    if(!currentChat.msgs)currentChat.msgs=[];currentChat.msgs.push(msg);currentChat.lastMsg=text;currentChat.time=getTime();
    input.value='';renderMessages();renderChatList();simulateReply();
  }

  function sendImage(){
    var url=ge('imageUrl')?ge('imageUrl').value.trim():prompt('粘贴图片网址：');
    if(!url)return;
    var msg={id:genId(),from:DB.user.name,text:url,type:'image',time:getTime(),timestamp:Date.now()};
    cloudPush('chats/'+currentChat.id+'/messages',msg);
    var chats=cloudRead('chats')||{};
    if(chats[currentChat.id]){chats[currentChat.id].lastMsg='[图片]';chats[currentChat.id].time=getTime();cloudWrite('chats',chats);}
    if(!currentChat.msgs)currentChat.msgs=[];currentChat.msgs.push(msg);currentChat.lastMsg='[图片]';currentChat.time=getTime();
    closeModal('imageModal');if(ge('imageUrl'))ge('imageUrl').value='';renderMessages();renderChatList();
  }

  function sendEmoji(emoji){
    if(!currentChat)return;
    var msg={id:genId(),from:DB.user.name,text:emoji,type:'text',time:getTime(),timestamp:Date.now()};
    cloudPush('chats/'+currentChat.id+'/messages',msg);
    if(!currentChat.msgs)currentChat.msgs=[];currentChat.msgs.push(msg);currentChat.lastMsg=emoji;currentChat.time=getTime();
    if(!DB.collectedEmojis.includes(emoji)){DB.collectedEmojis.unshift(emoji);if(DB.collectedEmojis.length>30)DB.collectedEmojis.pop();save('collectedEmojis');}
    renderMessages();renderChatList();closeModal('emojiPicker');
  }

  function simulateReply(){
    if(!currentChat)return;
    var replies=['好的','收到','👍','明白了','稍等','好的呢','同意','没问题','我知道了','哈哈','😂'];
    var reply=replies[Math.floor(Math.random()*replies.length)];
    var fromName=currentChat.type==='group'?(currentChat.memberNames[Math.floor(Math.random()*currentChat.memberNames.length)]||'成员'):currentChat.name;
    var msg={id:genId(),from:fromName,text:reply,type:'text',time:getTime(),timestamp:Date.now()};
    cloudPush('chats/'+currentChat.id+'/messages',msg);
    if(!currentChat.msgs)currentChat.msgs=[];currentChat.msgs.push(msg);currentChat.lastMsg=reply;currentChat.time=getTime();
    var chat=DB.chats.find(function(c){return c.id===currentChat.id;});
    if(chat){chat.unread=(chat.unread||0)+1;chat.lastMsg=reply;chat.time=getTime();saveUserChatList();}
    renderMessages();renderChatList();addNotification('新消息',fromName+': '+reply);
  }

  function showNewChat(){
    var users=cloudRead('users')||{},h='',count=0;
    for(var name in users){
      if(name===DB.user.name)continue;
      var u=users[name];
      h+='<div class="member-item" onclick="app.startChat(\''+name+'\')">'
        +'<div class="member-avatar">'+(u.avatar||'👤')+'</div>'
        +'<div class="member-info"><div class="member-name">'+esc(name)+'</div>'
        +'<div class="member-status">'+(u.online?'🟢 在线':'🔴 离线')+' · '+esc(u.phone||'')+'</div></div></div>';
      count++;
    }
    if(count===0)h='<div class="empty-state"><div>暂无其他用户</div><div style="font-size:13px">让其他人也注册来聊天吧</div></div>';
    ge('userList').innerHTML=h;ge('newChatModal').classList.add('show');
  }

  function startChat(name){
    var existing=DB.chats.find(function(c){return c.name===name;});
    if(existing){closeModal('newChatModal');openChat(existing.id);return;}
    var chatId=genId();
    var chat={id:chatId,name:name,type:'person',avatar:'👤',members:[DB.user.name,name],memberNames:[name],msgs:[],lastMsg:'',time:'',unread:0,createdAt:Date.now()};
    var chats=cloudRead('chats')||{};chats[chatId]=chat;cloudWrite('chats',chats);
    var u1=cloudRead('userChats/'+DB.user.name)||[];if(!u1.find(function(c){return c.id===chatId;})){u1.unshift({id:chatId,name:name,type:'person',avatar:'👤',unread:0});cloudWrite('userChats/'+DB.user.name,u1);}
    var u2=cloudRead('userChats/'+name)||[];if(!u2.find(function(c){return c.id===chatId;})){u2.unshift({id:chatId,name:DB.user.name,type:'person',avatar:'👤',unread:0});cloudWrite('userChats/'+name,u2);}
    DB.chats.unshift(chat);saveUserChatList();closeModal('newChatModal');renderChatList();openChat(chatId);
  }

  function showNewGroup(){
    selectedGroupMembers=[];var users=cloudRead('users')||{},h='';
    for(var name in users){
      if(name===DB.user.name)continue;
      var u=users[name];
      h+='<div class="member-item" id="gm-'+name+'" onclick="app.toggleGroupMember(\''+name+'\')">'
        +'<div class="member-avatar">'+(u.avatar||'👤')+'</div>'
        +'<div class="member-info"><div class="member-name">'+esc(name)+'</div><div class="member-status">'+esc(u.phone||'')+'</div></div>'
        +'<div class="member-check" id="gmc-'+name+'"></div></div>';
    }
    ge('groupMemberList').innerHTML=h;ge('newGroupModal').classList.add('show');
  }

  function toggleGroupMember(name){
    var idx=selectedGroupMembers.indexOf(name),el2=document.getElementById('gm-'+name),check=document.getElementById('gmc-'+name);
    if(idx>=0){selectedGroupMembers.splice(idx,1);if(el2)el2.classList.remove('selected');if(check)check.style.background='';}
    else{selectedGroupMembers.push(name);if(el2)el2.classList.add('selected');if(check)check.style.background='#667eea';}
  }

  function createGroup(){
    var name=ge('groupName').value.trim();
    if(!name){alert('请输入群组名称');return;}
    if(selectedGroupMembers.length===0){alert('请选择至少一个成员');return;}
    var chatId=genId(),allMembers=[DB.user.name].concat(selectedGroupMembers);
    var chat={id:chatId,name:name,type:'group',avatar:'👥',members:allMembers,memberNames:selectedGroupMembers,msgs:[],lastMsg:'',time:'',unread:0,createdAt:Date.now()};
    var chats=cloudRead('chats')||{};chats[chatId]=chat;cloudWrite('chats',chats);
    allMembers.forEach(function(m){var uc=cloudRead('userChats/'+m)||[];if(!uc.find(function(c){return c.id===chatId;})){uc.unshift({id:chatId,name:name,type:'group',avatar:'👥',unread:0});cloudWrite('userChats/'+m,uc);}});
    DB.chats.unshift(chat);saveUserChatList();closeModal('newGroupModal');ge('groupName').value='';selectedGroupMembers=[];renderChatList();openChat(chatId);addNotification('群组创建',name+'已创建，共'+allMembers.length+'人');
  }

  function listenForMessages(){
    setInterval(function(){
      if(!currentChat)return;
      var cc=cloudRead('chats/'+currentChat.id);
      if(cc&&cc.msgs){
        var localIds=(currentChat.msgs||[]).map(function(m){return m.id;});
        var newMsgs=cc.msgs.filter(function(m){return !localIds.includes(m.id);});
        if(newMsgs.length>0){
          if(!currentChat.msgs)currentChat.msgs=[];
          currentChat.msgs=currentChat.msgs.concat(newMsgs);
          var last=newMsgs[newMsgs.length-1];
          currentChat.lastMsg=last.type==='image'?'[图片]':last.text;
          currentChat.time=last.time;
          renderMessages();
        }
      }
    },2000);
  }

  function addNotification(title,desc){DB.notifications.unshift({id:genId(),title:title,desc:desc,time:getTime(),read:false,timestamp:Date.now()});if(DB.notifications.length>50)DB.notifications.pop();save('notifications');updateNotifBadge();}
  function updateNotifBadge(){var unread=DB.notifications.filter(function(n){return !n.read;}).length;var badge=ge('notifBadge');if(badge){badge.textContent=unread;badge.style.display=unread>0?'flex':'none';}}
  function showNotifications(){
    var h='';
    if(DB.notifications.length===0){h='<div class="empty-state"><div>暂无通知</div></div>';}
    else{DB.notifications.forEach(function(n){h+='<div style="padding:14px;border-bottom:1px solid #eee;cursor:pointer" onclick="app.markRead(\''+n.id+'\')">'
        +'<div style="font-size:14px;font-weight:600">'+esc(n.title)+'</div>'
        +'<div style="font-size:12px;color:#888;margin-top:4px">'+esc(n.desc)+'</div>'
        +'<div style="font-size:11px;color:#ccc;margin-top:4px">'+n.time+'</div></div>';});}
    ge('notifList').innerHTML=h;ge('notifModal').classList.add('show');
  }
  function markRead(id){var n=DB.notifications.find(function(x){return x.id===id;});if(n){n.read=true;save('notifications');updateNotifBadge();}}

  function showProfile(){ge('profileName').textContent=DB.user.name;ge('profileInfo').textContent=(DB.user.phone||'')+' · 在线';ge('profileAvatar').textContent=DB.user.avatar;ge('profileModal').classList.add('show');}
  function showSettings(){ge('settingsModal').classList.add('show');}

  function toggleEmoji(){
    var picker=ge('emojiPicker');
    if(picker.classList.contains('show')){picker.classList.remove('show');return;}
    var h='';allEmojis.slice(0,56).forEach(function(e){h+='<button class="emoji-btn" onclick="app.sendEmoji(\''+e+'\')">'+e+'</button>';});
    ge('emojiGrid').innerHTML=h;picker.classList.add('show');
  }
  function showImageUpload(){ge('imageModal').classList.add('show');}
  function previewImage(url){ge('previewImage').src=url;ge('previewModal').classList.add('show');}
  function goBack(){currentChat=null;ge('backBtn').style.display='none';ge('headerTitle').textContent='彩虹桥';ge('chatEmpty').style.display='flex';ge('messages').style.display='none';ge('inputArea').style.display='none';renderChatList();}
  function closeModal(id){var e=ge(id);if(e)e.classList.remove('show');}
  function saveUserChatList(){if(!DB.user)return;cloudWrite('userChats/'+DB.user.name,DB.chats.map(function(c){return {id:c.id,name:c.name,type:c.type,avatar:c.avatar||'👤',unread:c.unread||0};}));}

  function init(){
    load('notifications');load('collectedEmojis');
    var saved=localStorage.getItem('rb_current_user');
    if(saved){try{DB.user=JSON.parse(saved);}catch(e){}}
    if(DB.user){
      var userChats=cloudRead('userChats/'+DB.user.name)||[];
      DB.chats=userChats.map(function(c){var full=cloudRead('chats/'+c.id);return full||c;});
      showApp();
    }
    document.addEventListener('click',function(e){if(e.target.classList.contains('modal'))e.target.classList.remove('show');});
    document.addEventListener('click',function(e){
      var picker=ge('emojiPicker');
      if(picker&&picker.classList.contains('show')&&!picker.contains(e.target)&&!e.target.closest('.icon-btn'))picker.classList.remove('show');
    });
  }

  window.app={
    login:login,register:register,logout:logout,switchTab:switchTab,
    openChat:openChat,sendMsg:sendMsg,sendImage:sendImage,sendEmoji:sendEmoji,
    showNewChat:showNewChat,startChat:startChat,
    showNewGroup:showNewGroup,toggleGroupMember:toggleGroupMember,createGroup:createGroup,
    showProfile:showProfile,showSettings:showSettings,showNotifications:showNotifications,
    markRead:markRead,
    toggleEmoji:toggleEmoji,showImageUpload:showImageUpload,previewImage:previewImage,
    goBack:goBack,closeModal:closeModal,searchChats:searchChats
  };

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();
