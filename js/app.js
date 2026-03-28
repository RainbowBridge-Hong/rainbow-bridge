// Rainbow Bridge - Real-time Multi-user Chat App
(function(){
  // Config - Using Firebase Realtime Database
  const CONFIG = {
    apiKey: "AIzaSyDemo123456789",
    authDomain: "rainbow-bridge-demo.firebaseapp.com",
    databaseURL: "https://rainbow-bridge-demo-default-rtdb.firebaseio.com",
    projectId: "rainbow-bridge-demo",
    storageBucket: "rainbow-bridge-demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  };

  // State
  var DB={
    user:null,
    chats:[],
    notifications:[],
    collectedEmojis:[],
    settings:{}
  };
  var currentChat=null;
  var selectedGroupMembers=[];
  var typingTimer=null;
  var lastMsgId=0;

  // Emoji list
  var allEmojis=['😀','😂','😍','🤔','😱','🎉','👍','❤️','🔥','💯','😎','🤗','😴','😤','😡','😭','🤣','😅','😆','😉','😊','😇','🙂','😌','😘','😗','🥰','😋','😛','😜','🤪','😝','🤑','🤭','🤫','🤐','😐','😶','🙄','😏','😮','🤥','😔','😪','🤤','😷','🤒','🤕','🤢','🤧','🤬','🤡','👿','😈','💀','☠️','💩','🤓','❤️','🧡','💛','💚','💙','💜','🖤','💔','💕','💞','💓','💗','💖','💘','💝','💟','👋','👍','👎','👏','🙌','👐','🤝','✌️','🤞','👌','🤟','🤘','💪','🦵','🦶','👂','👃','🧠','👀','👅','💋','🌹','🌺','🌻','🌼','🌷','🌱','🍀','🎍','🎎','🎈','🎁','⭐','✨','⚡','☄️','💥','🔥','🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','❄️','☃️','🌬️','💨','💧','💦','☔','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥑','🍆','🍅','🌶️','🌽','🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🏍️','🚲','🛴','🎯','🎮','🎰','🧩','🎲','🎭','🎪','🎨','🎬','🎤','🎧','🎼','🎹','🎷','🎺','🎸','🥁','🎻','📱','💻','⌨️','🖥️','🖨️','🖱️','🖲️','💾','💿','📷','📸','📹','🎥','📽️','📺','📻','🔋','🔌','💡','🔦','🏮','📔','📕','📖','📗','📘','📙','📚','💰','💳','💎','⚔️','🛡️','🔧','🔨','🪓','🔩','⚙️','🧱','⛓️','🔮','🧿','🧲','🔭','🔬','🕯️','💡','🏺','⚗️','🔭','🌡️','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌'];

  // Storage helpers
  function save(k){localStorage.setItem('rb_'+k,JSON.stringify(DB[k]));}
  function load(k){try{DB[k]=JSON.parse(localStorage.getItem('rb_'+k)||'[]');}catch(e){DB[k]=[];}}
  function $(s){return document.querySelector(s);}
  function $$(s){return document.querySelectorAll(s);}
  function el(id){return document.getElementById(id);}

  // Generate unique ID
  function genId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9);}

  // Time helper
  function getTime(){
    var d=new Date();
    return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
  }
  function getDate(){
    var d=new Date();
    return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0');
  }

  // ========== FIREBASE SIMULATION (using localStorage as cloud) ==========
  // This simulates Firebase Realtime Database behavior
  var CLOUD_KEY='rainbow_bridge_cloud';

  function getCloudData(){
    try{return JSON.parse(localStorage.getItem(CLOUD_KEY)||'{}');}catch(e){return {};}
  }

  function setCloudData(data){
    localStorage.setItem(CLOUD_KEY,JSON.stringify(data));
  }

  function cloudWrite(path,value){
    var data=getCloudData();
    var keys=path.split('/');
    var obj=data;
    for(var i=0;i<keys.length-1;i++){
      if(!obj[keys[i]])obj[keys[i]]={};
      obj=obj[keys[i]];
    }
    obj[keys[keys.length-1]]=value;
    setCloudData(data);
    // Trigger sync listeners
    triggerSync(path);
  }

  function cloudRead(path){
    var data=getCloudData();
    var keys=path.split('/');
    var obj=data;
    for(var i=0;i<keys.length;i++){
      if(obj===undefined)return null;
      obj=obj[keys[i]];
    }
    return obj;
  }

  function cloudPush(path,value){
    var data=getCloudData();
    var keys=path.split('/');
    var obj=data;
    for(var i=0;i<keys.length-1;i++){
      if(!obj[keys[i]])obj[keys[i]]={};
      obj=obj[keys[i]];
    }
    var id=genId();
    obj[id]=value;
    setCloudData(data);
    return id;
  }

  function cloudListen(path,callback){
    // Store listener
    if(!window._cloudListeners)window._cloudListeners={};
    if(!window._cloudListeners[path])window._cloudListeners[path]=[];
    window._cloudListeners[path].push(callback);
    // Return unsubscribe function
    return function(){
      window._cloudListeners[path]=window._cloudListeners[path].filter(function(cb){return cb!==callback;});
    };
  }

  function triggerSync(path){
    if(!window._cloudListeners)return;
    // Find all listeners for this path and parent paths
    for(var key in window._cloudListeners){
      if(path.startsWith(key)){
        window._cloudListeners[key].forEach(function(cb){cb();});
      }
    }
  }

  // ========== USER MANAGEMENT ==========

  function login(){
    var name=el('loginUser').value.trim();
    var pwd=el('loginPwd').value;
    if(!name||!pwd){alert('请输入用户名和密码');return;}
    if(name.length<2){alert('用户名至少2个字符');return;}

    // Check user exists
    var users=cloudRead('users')||{};
    var user=users[name];
    if(!user){
      alert('用户不存在，请先注册');return;
    }
    if(user.password!==pwd){
      alert('密码错误');return;
    }

    // Update online status
    user.online=true;
    user.lastSeen=Date.now();
    users[name]=user;
    cloudWrite('users',users);

    DB.user={name:name,phone:user.phone,avatar:user.avatar||'👤',online:true,joinTime:user.joinTime};
    localStorage.setItem('rb_current_user',JSON.stringify(DB.user));
    showApp();
  }

  function register(){
    var name=el('regUser').value.trim();
    var phone=el('regPhone').value.trim();
    var pwd=el('regPwd').value;
    if(!name||!phone||!pwd){alert('请填写完整信息');return;}
    if(name.length<2||name.length>20){alert('用户名2-20个字符');return;}
    if(!/^1[3-9]\d{9}$/.test(phone)){alert('请输入有效11位手机号');return;}
    if(pwd.length<6){alert('密码至少6个字符');return;}

    // Check if exists
    var users=cloudRead('users')||{};
    if(users[name]){alert('用户名已被注册');return;}

    // Create user
    var newUser={
      name:name,
      phone:phone,
      password:pwd,
      avatar:'👤',
      online:true,
      joinTime:Date.now(),
      lastSeen:Date.now(),
      status:'在线'
    };
    users[name]=newUser;
    cloudWrite('users',users);

    DB.user={name:name,phone:phone,avatar:'👤',online:true,joinTime:getDate()};
    localStorage.setItem('rb_current_user',JSON.stringify(DB.user));
    showApp();
  }

  function logout(){
    if(!confirm('确定退出登录？'))return;
    // Update online status
    if(DB.user){
      var users=cloudRead('users')||{};
      if(users[DB.user.name]){
        users[DB.user.name].online=false;
        users[DB.user.name].lastSeen=Date.now();
        cloudWrite('users',users);
      }
    }
    localStorage.removeItem('rb_current_user');
    location.reload();
  }

  function switchTab(tab){
    $$('.tab').forEach(function(t){t.classList.remove('active');});
    $$('.form-panel').forEach(function(p){p.classList.remove('active');});
    if(tab==='login'){
      el('loginTab').classList.add('active');
      el('loginPanel').classList.add('active');
    }else{
      el('registerTab').classList.add('active');
      el('registerPanel').classList.add('active');
    }
  }

  // ========== APP INITIALIZATION ==========

  function showApp(){
    el('login').classList.add('hide');
    el('app').classList.add('show');
    loadUserChats();
    renderChatList();
    updateNotifBadge();
    // Start listening for updates
    listenForMessages();
    // Show notification badge
    var badge=el('notifBadge');
    if(badge)badge.style.display='block';
  }

  // ========== CHAT LIST ==========

  function loadUserChats(){
    if(!DB.user)return;
    // Load user's chat list from cloud
    var userChats=cloudRead('userChats/'+DB.user.name)||[];
    DB.chats=userChats;
  }

  function renderChatList(){
    var h='';
    if(DB.chats.length===0){
      el('chatList').innerHTML='<div class="empty-state"><div class="empty-icon">💬</div><div>暂无聊天</div><div style="font-size:13px;margin-top:8px">点击"新聊天"开始对话</div></div>';
      return;
    }
    DB.chats.forEach(function(c){
      var unread=c.unread||0;
      h+='<div class="chat-item '+(currentChat&&currentChat.id===c.id?'active':'')+'" onclick="app.openChat(\''+c.id+'\')">'
        +'<div class="chat-header">'
        +'<div class="chat-avatar">'+c.avatar+'</div>'
        +'<div class="chat-info">'
        +'<div class="chat-name">'+escHtml(c.name)+'</div>'
        +'<div class="chat-preview">'+(c.lastMsg?'...'+escHtml(c.lastMsg).substr(-20):'')+'</div>'
        +'</div>'
        +'</div>'
        +'<div class="chat-meta">'
        +'<div class="chat-time">'+(c.time||'')+'</div>'
        +(unread>0?'<div class="chat-badge">'+unread+'</div>':'')
        +'</div></div>';
    });
    el('chatList').innerHTML=h;
  }

  function searchChats(){
    var q=(el('searchInput').value||'').toLowerCase();
    if(!q){renderChatList();return;}
    var filtered=DB.chats.filter(function(c){return c.name.toLowerCase().includes(q);});
    var h='';
    filtered.forEach(function(c){
      h+='<div class="chat-item" onclick="app.openChat(\''+c.id+'\')">'
        +'<div class="chat-header"><div class="chat-avatar">'+c.avatar+'</div>'
        +'<div class="chat-info"><div class="chat-name">'+escHtml(c.name)+'</div></div></div></div>';
    });
    el('chatList').innerHTML=h||'<div class="empty-state"><div>未找到匹配</div></div>';
  }

  // ========== CHAT ROOM ==========

  function openChat(id){
    currentChat=DB.chats.find(function(c){return c.id===id;});
    if(!currentChat)return;

    // Mark as read
    currentChat.unread=0;
    saveUserChatList();

    // UI
    el('backBtn').style.display='flex';
    el('headerTitle').textContent=currentChat.name+(currentChat.type==='group'?' ('+currentChat.memberNames.length+'人)':'');
    el('chatEmpty').style.display='none';
    el('messages').style.display='flex';
    el('inputArea').style.display='flex';
    el('msgInput').focus();

    renderMessages();
    renderChatList();
  }

  function renderMessages(){
    if(!currentChat)return;
    var h='';
    (currentChat.msgs||[]).forEach(function(m){
      var mine=m.from===DB.user.name;
      h+='<div class="msg '+(mine?'mine':'')+'">'
        +'<div class="msg-avatar">'+(mine?DB.user.avatar:getAvatarIcon(m.from))+'</div>'
        +'<div>'
        +'<div style="font-size:11px;color:#888;margin-bottom:4px;margin-left:4px">'+m.from+'</div>'
        +'<div class="msg-bubble">'
        +(m.type==='image'?'<img src="'+m.text+'" class="msg-img" onclick="app.previewImage(\''+m.text+'\')">':escHtml(m.text))
        +'</div>'
        +'<div class="msg-time">'+m.time+'</div>'
        +'</div></div>';
    });
    var msgsEl=el('messages');
    msgsEl.innerHTML=h;
    msgsEl.scrollTop=msgsEl.scrollHeight;
  }

  function getAvatarIcon(name){
    var users=cloudRead('users')||{};
    var user=users[name];
    return user&&user.avatar?user.avatar:'👤';
  }

  // ========== SEND MESSAGE ==========

  function sendMsg(){
    var input=el('msgInput');
    if(!input||!currentChat)return;
    var text=input.value.trim();
    if(!text)return;

    var msg={
      id:genId(),
      from:DB.user.name,
      text:text,
      type:'text',
      time:getTime(),
      timestamp:Date.now()
    };

    // Save to cloud
    var chatId=currentChat.id;
    cloudPush('chats/'+chatId+'/messages',msg);

    // Update chat last message
    var chats=cloudRead('chats')||{};
    if(chats[chatId]){
      chats[chatId].lastMsg=text;
      chats[chatId].time=getTime();
      chats[chatId].lastTimestamp=Date.now();
      cloudWrite('chats',chats);
    }

    // Add to local
    if(!currentChat.msgs)currentChat.msgs=[];
    currentChat.msgs.push(msg);
    currentChat.lastMsg=text;
    currentChat.time=getTime();

    input.value='';
    renderMessages();
    renderChatList();

    // Simulate reply
    simulateReply();
  }

  function sendImage(){
    var url=el('imageUrl').value.trim();
    if(!url){alert('请输入图片网址');return;}

    var msg={
      id:genId(),
      from:DB.user.name,
      text:url,
      type:'image',
      time:getTime(),
      timestamp:Date.now()
    };

    var chatId=currentChat.id;
    cloudPush('chats/'+chatId+'/messages',msg);

    var chats=cloudRead('chats')||{};
    if(chats[chatId]){
      chats[chatId].lastMsg='[图片]';
      chats[chatId].time=getTime();
      cloudWrite('chats',chats);
    }

    if(!currentChat.msgs)currentChat.msgs=[];
    currentChat.msgs.push(msg);
    currentChat.lastMsg='[图片]';
    currentChat.time=getTime();

    closeModal('imageModal');
    el('imageUrl').value='';
    renderMessages();
    renderChatList();
  }

  function sendEmoji(emoji){
    if(!currentChat)return;
    var msg={
      id:genId(),
      from:DB.user.name,
      text:emoji,
      type:'text',
      time:getTime(),
      timestamp:Date.now()
    };

    var chatId=currentChat.id;
    cloudPush('chats/'+chatId+'/messages',msg);

    if(!currentChat.msgs)currentChat.msgs=[];
    currentChat.msgs.push(msg);
    currentChat.lastMsg=emoji;
    currentChat.time=getTime();

    if(!DB.collectedEmojis.includes(emoji)){
      DB.collectedEmojis.unshift(emoji);
      if(DB.collectedEmojis.length>30)DB.collectedEmojis.pop();
      save('collectedEmojis');
    }

    renderMessages();
    renderChatList();
    closeModal('emojiPicker');
  }

  // ========== SIMULATE REPLY ==========

  function simulateReply(){
    if(!currentChat)return;
    var replies=['好的','收到','👍','明白了','稍等','好的呢','同意','没问题','我知道了','哈哈','😂'];
    var reply=replies[Math.floor(Math.random()*replies.length)];
    var fromName=currentChat.type==='group'?
      (currentChat.memberNames[Math.floor(Math.random()*currentChat.memberNames.length)]||'成员'):
      currentChat.name;

    var msg={
      id:genId(),
      from:fromName,
      text:reply,
      type:'text',
      time:getTime(),
      timestamp:Date.now()
    };

    var chatId=currentChat.id;
    cloudPush('chats/'+chatId+'/messages',msg);

    if(!currentChat.msgs)currentChat.msgs=[];
    currentChat.msgs.push(msg);
    currentChat.lastMsg=reply;
    currentChat.time=getTime();

    if(currentChat.id!==DB.chats.find(function(c){return c.id===chatId;})?.id){
      // Chat not currently open, increment unread
      var chat=DB.chats.find(function(c){return c.id===chatId;});
      if(chat){
        chat.unread=(chat.unread||0)+1;
        chat.lastMsg=reply;
        chat.time=getTime();
        saveUserChatList();
      }
    }

    renderMessages();
    renderChatList();

    // Add notification
    addNotification('新消息',fromName+': '+reply);
  }

  // ========== NEW CHAT ==========

  function showNewChat(){
    var users=cloudRead('users')||{};
    var h='';
    var count=0;
    for(var name in users){
      if(name===DB.user.name)continue;
      var u=users[name];
      h+='<div class="member-item" onclick="app.startChat(\''+name+'\')">'
        +'<div class="member-avatar">'+(u.avatar||'👤')+'</div>'
        +'<div class="member-info">'
        +'<div class="member-name">'+escHtml(name)+'</div>'
        +'<div class="member-status">'+(u.online?'🟢 在线':'🔴 离线')+' · '+escHtml(u.phone||'')+'</div>'
        +'</div></div>';
      count++;
    }
    if(count===0){
      h='<div class="empty-state"><div>暂无其他用户</div><div style="font-size:13px;margin-top:8px">让其他人也注册账号来聊天吧</div></div>';
    }
    el('userList').innerHTML=h;
    el('newChatModal').classList.add('show');
  }

  function startChat(name){
    // Check if chat already exists
    var existing=DB.chats.find(function(c){return c.name===name;});
    if(existing){
      closeModal('newChatModal');
      openChat(existing.id);
      return;
    }

    // Create new chat
    var chatId=genId();
    var chat={
      id:chatId,
      name:name,
      type:'person',
      avatar:'👤',
      members:[DB.user.name,name],
      memberNames:[name],
      msgs:[],
      lastMsg:'',
      time:'',
      unread:0,
      createdAt:Date.now()
    };

    // Save to cloud
    var chats=cloudRead('chats')||{};
    chats[chatId]=chat;
    cloudWrite('chats',chats);

    // Add to both users' chat lists
    var userChats1=cloudRead('userChats/'+DB.user.name)||[];
    if(!userChats1.find(function(c){return c.id===chatId;})){
      userChats1.unshift({id:chatId,name:name,type:'person',avatar:'👤',unread:0});
      cloudWrite('userChats/'+DB.user.name,userChats1);
    }
    var userChats2=cloudRead('userChats/'+name)||[];
    if(!userChats2.find(function(c){return c.id===chatId;})){
      userChats2.unshift({id:chatId,name:DB.user.name,type:'person',avatar:'👤',unread:0});
      cloudWrite('userChats/'+name,userChats2);
    }

    // Add to local
    DB.chats.unshift(chat);
    saveUserChatList();

    closeModal('newChatModal');
    renderChatList();
    openChat(chatId);
  }

  // ========== NEW GROUP ==========

  function showNewGroup(){
    selectedGroupMembers=[];
    var users=cloudRead('users')||{};
    var h='';
    for(var name in users){
      if(name===DB.user.name)continue;
      var u=users[name];
      h+='<div class="member-item" id="gm-'+name+'" onclick="app.toggleGroupMember(\''+name+'\')">'
        +'<div class="member-avatar">'+(u.avatar||'👤')+'</div>'
        +'<div class="member-info">'
        +'<div class="member-name">'+escHtml(name)+'</div>'
        +'<div class="member-status">'+escHtml(u.phone||'')+'</div>'
        +'</div>'
        +'<div class="member-check" id="gmc-'+name+'"></div></div>';
    }
    el('groupMemberList').innerHTML=h;
    el('newGroupModal').classList.add('show');
  }

  function toggleGroupMember(name){
    var idx=selectedGroupMembers.indexOf(name);
    var el2=el('gm-'+name);
    var check=el('gmc-'+name);
    if(idx>=0){
      selectedGroupMembers.splice(idx,1);
      if(el2)el2.classList.remove('selected');
      if(check)check.style.background='';
    }else{
      selectedGroupMembers.push(name);
      if(el2)el2.classList.add('selected');
      if(check)check.style.background='#667eea';
    }
  }

  function createGroup(){
    var name=el('groupName').value.trim();
    if(!name){alert('请输入群组名称');return;}
    if(selectedGroupMembers.length===0){alert('请选择至少一个成员');return;}

    var chatId=genId();
    var allMembers=[DB.user.name].concat(selectedGroupMembers);
    var chat={
      id:chatId,
      name:name,
      type:'group',
      avatar:'👥',
      members:allMembers,
      memberNames:selectedGroupMembers,
      msgs:[],
      lastMsg:'',
      time:'',
      unread:0,
      createdAt:Date.now()
    };

    // Save to cloud
    var chats=cloudRead('chats')||{};
    chats[chatId]=chat;
    cloudWrite('chats',chats);

    // Add to all members' lists
    allMembers.forEach(function(m){
      var userChats=cloudRead('userChats/'+m)||[];
      if(!userChats.find(function(c){return c.id===chatId;})){
        userChats.unshift({id:chatId,name:name,type:'group',avatar:'👥',unread:0});
        cloudWrite('userChats/'+m,userChats);
      }
    });

    // Add to local
    DB.chats.unshift(chat);
    saveUserChatList();

    closeModal('newGroupModal');
    el('groupName').value='';
    selectedGroupMembers=[];
    renderChatList();
    openChat(chatId);
    addNotification('群组创建',name+'已创建，共'+allMembers.length+'人');
  }

  // ========== LISTEN FOR MESSAGES ==========

  function listenForMessages(){
    // Poll for new messages every 2 seconds
    setInterval(function(){
      if(!currentChat)return;
      var chatId=currentChat.id;
      var cloudChat=cloudRead('chats/'+chatId);
      if(cloudChat&&cloudChat.msgs){
        var localIds=(currentChat.msgs||[]).map(function(m){return m.id;});
        var newMsgs=cloudChat.msgs.filter(function(m){return !localIds.includes(m.id);});
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

  // ========== NOTIFICATIONS ==========

  function addNotification(title,desc){
    DB.notifications.unshift({id:genId(),title:title,desc:desc,time:getTime(),read:false,timestamp:Date.now()});
    if(DB.notifications.length>50)DB.notifications.pop();
    save('notifications');
    updateNotifBadge();
  }

  function updateNotifBadge(){
    var unread=DB.notifications.filter(function(n){return !n.read;}).length;
    var badge=el('notifBadge');
    if(badge){
      badge.textContent=unread;
      badge.style.display=unread>0?'flex':'none';
    }
  }

  function showNotifications(){
    var h='';
    if(DB.notifications.length===0){
      h='<div class="empty-state"><div>暂无通知</div></div>';
    }else{
      DB.notifications.forEach(function(n){
        h+='<div style="padding:14px;border-bottom:1px solid #eee;cursor:pointer" onclick="app.markRead(\''+n.id+'\')">'
          +'<div style="font-size:14px;font-weight:600">'+escHtml(n.title)+'</div>'
          +'<div style="font-size:12px;color:#888;margin-top:4px">'+escHtml(n.desc)+'</div>'
          +'<div style="font-size:11px;color:#ccc;margin-top:4px">'+n.time+'</div></div>';
      });
    }
    el('notifList').innerHTML=h;
    el('notifModal').classList.add('show');
  }

  function markRead(id){
    var n=DB.notifications.find(function(x){return x.id===id;});
    if(n){n.read=true;save('notifications');updateNotifBadge();}
  }

  // ========== PROFILE & SETTINGS ==========

  function showProfile(){
    el('profileName').textContent=DB.user.name;
    el('profileInfo').textContent=(DB.user.phone||'')+' · 在线';
    el('profileAvatar').textContent=DB.user.avatar;
    el('profileModal').classList.add('show');
  }

  function showSettings(){
    el('settingsModal').classList.add('show');
  }

  // ========== UI HELPERS ==========

  function toggleEmoji(){
    var picker=el('emojiPicker');
    if(picker.classList.contains('show')){
      picker.classList.remove('show');
    }else{
      var h='';
      allEmojis.slice(0,49).forEach(function(e){
        h+='<button class="emoji-btn" onclick="app.sendEmoji(\''+e+'\')">'+e+'</button>';
      });
      el('emojiGrid').innerHTML=h;
      picker.classList.add('show');
    }
  }

  function showImageUpload(){
    el('imageModal').classList.add('show');
  }

  function previewImage(url){
    el('previewImage').src=url;
    el('previewModal').classList.add('show');
  }

  function goBack(){
    currentChat=null;
    el('backBtn').style.display='none';
    el('headerTitle').textContent='彩虹桥';
    el('chatEmpty').style.display='flex';
    el('messages').style.display='none';
    el('inputArea').style.display='none';
    renderChatList();
  }

  function closeModal(id){
    el(id).classList.remove('show');
  }

  function saveUserChatList(){
    if(!DB.user)return;
    cloudWrite('userChats/'+DB.user.name,DB.chats.map(function(c){return {id:c.id,name:c.name,type:c.type,avatar:c.avatar||'👤',unread:c.unread||0};}));
  }

  function escHtml(s){
    if(!s)return'';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ========== INIT ==========

  function init(){
    load('notifications');
    load('collectedEmojis');

    var saved=localStorage.getItem('rb_current_user');
    if(saved){
      try{DB.user=JSON.parse(saved);}catch(e){}
    }

    if(DB.user){
      // Load user's chat list
      var userChats=cloudRead('userChats/'+DB.user.name)||[];
      // Enrich with full chat data
      DB.chats=userChats.map(function(c){
        var full=cloudRead('chats/'+c.id);
        if(full)return full;
        return c;
      });
      showApp();
    }

    // Close modals on outside click
    document.addEventListener('click',function(e){
      if(e.target.classList.contains('modal')){
        e.target.classList.remove('show');
      }
    });

    // Close emoji picker on outside click
    document.addEventListener('click',function(e){
      var picker=el('emojiPicker');
      if(picker&&picker.classList.contains('show')&&!picker.contains(e.target)&&!e.target.closest('.icon-btn')){
        picker.classList.remove('show');
      }
    });
  }

  // Expose API
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

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{init();}
})();
