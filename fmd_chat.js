/*
* Shoutbox for Forumotion forums
* Developed by Ange Tuteur - FM Design
* Database must be installed for full functionality ( http://fmdesign.forumotion.com/t281- )
*/
$(function() {
  var config = {
    pid : 1759,
    char_limit : 750,
    msg_max : 50,
    msg_del : 10,
    timeout : 60,
    public_chat : 0,
    title : 'Shoutbox',
    
    mods : [1],
    banned : [-1],
    
    timezone : -5,
    rights : 1, // choose to allow a small backlink to the developer's website
    
    plugins : function() {
      // custom content such as buttons and modifications can go here
    }
  };
  
  if (!config.public_chat && !_userdata.session_logged_in) return;
  var fo = {},
      ud = {
        id : _userdata.user_id,
        name : _userdata.username,
        ava : _userdata.avatar,
        mod : 0
      },
      main = document.getElementById('content') || document.getElementById('page-body'),
      fmd_chat = cre({
        tag : 'DIV',
        id : 'fmd_chatbox'
      }),
      
      box = cre({
        tag : 'DIV',
        id : 'fmd_chat_messagebox'
      }),
      
      header = cre({
        tag : 'DIV',
        id : 'fmd_chat_header',
        html : '<span class="fmd_chat_title">'+config.title+'</span><div class="fmd_chat_options"></div><div style="clear:both"></div>'
      }),
      
      footer = cre({
        tag : 'DIV',
        id : 'fmd_chat_footer'
      }),
      
      actions = cre({
        tag : 'DIV',
        classname : 'fmd_chat_actions'
      }),
  
      emo_frame = cre({
        tag : 'IFRAME',
        classname : 'fmd_chat_frame',
        src : '/post?mode=smilies_chatbox'
      }),
      
      color_frame = cre({
        tag : 'IFRAME',
        classname : 'fmd_chat_frame',
        src : '/chatbox/selectcolor'
      }),
      
      color_selected = cre({
        tag : 'DIV',
        classname : 'fmd_color_selected'
      }),
      
      message = cre({
        tag : 'INPUT',
        type : 'text',
        style : 'font-weight:normal;font-style:normal',
        id : 'fmd_chat_message'
      }),
      
      send = cre({
        tag : 'INPUT',
        type : 'button',
        id : 'fmd_chat_send',
        value : 'Send'
      }),
      
      refresh = cre({
        tag : 'INPUT',
        id : 'fmd_chat_refresh',
        type : 'checkbox',
        title : 'Auto refresh',
        checked : (my_getcookie('fmd_chat_refresh') && my_getcookie('fmd_chat_refresh').length) ? Number(my_getcookie('fmd_chat_refresh')) : 1,
        click : function() {
          this.checked ? my_setcookie('fmd_chat_refresh',1) : my_setcookie('fmd_chat_refresh',0);
          idle = 0;
          this.previousSibling.className.match(/fmd_idle/) && (this.previousSibling.className = '');
        }
      }),
      
      reftxt = cre({
        tag : 'LABEL',
        forId : 'fmd_chat_refresh',
        html : 'Auto : <div class="fmd_chat_dropdown fmd_notice">Auto-refresh has been disabled due to inactivity.. Click this message to enable it.</div>',
        style : 'cursor:pointer',
        title : 'Auto refresh'
      }),
      
      cnote = cre({
        tag : 'DIV',
        html : '\x44\x65\x76\x65\x6c\x6f\x70\x65\x64\x20\x62\x79\x20\x3c\x61\x20\x68\x72\x65\x66\x3d\x22\x68\x74\x74\x70\x3a\x2f\x2f\x66\x6d\x64\x65\x73\x69\x67\x6e\x2e\x66\x6f\x72\x75\x6d\x6f\x74\x69\x6f\x6e\x2e\x63\x6f\x6d\x2f\x74\x33\x31\x38\x2d\x66\x6d\x64\x2d\x73\x68\x6f\x75\x74\x62\x6f\x78\x23\x32\x30\x39\x35\x22\x20\x74\x61\x72\x67\x65\x74\x3d\x22\x5f\x62\x6c\x61\x6e\x6b\x22\x3e\x41\x6e\x67\x65\x20\x54\x75\x74\x65\x75\x72\x3c\x2f\x61\x3e',
        style : 'text-align:right'
      }),
      options = header.childNodes[1],
      doct = document.title,
      newmsg = 0,
      loading = 0,
      idle = 0,
      focus = 1,
      msg,
      color;
      
  fmd_chat.appendChild(header);
  options.appendChild(reftxt);
  options.appendChild(refresh);
  fmd_chat.appendChild(box);
  fmd_chat.appendChild(footer);
  footer.appendChild(message);
  footer.appendChild(send);
  footer.appendChild(actions);
  config.rights && fmd_chat.appendChild(cnote);
    
  /* check if the user is a moderator */
  for (var i=0,j=config.mods.length; i<j; i++) ud.id == config.mods[i] && (ud.mod = 1);

  /* check if the user has been blocked from writing */
  for (var i=0,j=config.banned.length; i<j; i++) {
    if (ud.id == config.banned[i]) {
      if (ud.id == -1) footer.innerHTML = '<p class="fmd_chat_error">Please <a href="/login">login</a> or <a href="/register">register</a> to use the shoutbox.</p>';
      else footer.innerHTML = '<p class="fmd_chat_error">You have been blocked from using the shoutbox. Please contact the board Administrator for more information.</p>';
    }
  }
  
  
  popup({
    text : '?',
    title : 'help',
    content : '<table class="fmd_chat_help"><tr class="fmd_chat_header"><td width="25%">Command Line</td><td>Explanation</td></tr><tr><td colspan="2">All command lines are used at the beginning of a message. They\'re not case sensitive and can be written capital or lowercase.</td></tr><tr><td>/me</td><td>This is replaced with your username. <br/>Example : <em>/me smells the flowers</em> <b>will send as</b> <em>* '+ud.name+' smells the flowers</em></td></tr><tr><td>/rand<br/>/random</td><td>Will return a number between 1 and 100. You can pass along your own range by writing /rand <strong>(n1:n2)</strong>. n1 is the minimum and n2 is the maximum. <br/>Example : '+ud.name+' thinks of a number between 1 and 100 ...24 !</td></tr><tr><td>/8ball</td><td>Ask a question to the Magic 8-ball and get an answer ! <br/>Example : <em>/8ball will it snow ?</em> <b>will send as</b> <em>will it snow ? <strong>[The Magic 8-Ball says : Signs point to yes]</strong></em></td></tr>'+ (ud.mod ? '<tr><td>/cls<br/>/clear</td><td>This command clears all shoutbox messages.</td></tr>' : '') +'</table>',
    pop_style : 'width:99%;overflow-y:auto',
    where : actions
  });
  
  
  button({
    name : 'refresh messages',
    text : 'Refresh',
    where : options,
    advanced : function(b) {
      b.onclick = function() {
        idle = 0;
        getMessages({
          apply : function() { b.style.opacity = 0.3 },
          callback : function() {
            b.style.opacity = '';
            scrollBox();
          }
        });
      }
    }
  });
  
  button({
    name : 'resize shoutbox',
    text : '+',
    where : options,
    advanced : function(b) {
      b.style.fontWeight = 'bold';
      b.onclick = function() {
        scrollBox();
        if (!fmd_chat.style.zIndex) {
          this.innerHTML = '-';
          document.body.style.overflow = 'hidden';
          fmd_chat.className = 'fmd_chat_max';
          fmd_chat.style.zIndex = '1000000';
        } else {
          this.innerHTML = '+';
          document.body.style.overflow = '';
          fmd_chat.className = '';
          fmd_chat.style.zIndex = '';
        }
      };
    }
  });
  
  button({
    name : 'bold',
    text : 'B',
    css : 'font-weight:bold',
    tags : ['[b]','[/b]'],
    where : actions
  });
      
  button({
    name : 'italic',
    text : 'I',
    css : 'font-style:italic',
    tags : ['[i]','[/i]'],
    where : actions
  });
  
  button({
    name : 'underline',
    text : 'U',
    css : 'text-decoration:underline',
    tags : ['[u]','[/u]'],
    where : actions
  });
      
  button({
    name : 'strike',
    text : 'S',
    css : 'text-decoration:line-through',
    tags : ['[strike]','[/strike]'],
    where : actions
  });
  
  // emoticons
  popup({
    text : 'Smilies',
	title : 'Insert emoticon',
    add : emo_frame,
	where : actions,
    advanced : function(b, box) {
      emo_frame.onload = function() {
        for (var i=0,frame=frameContent(emo_frame),a=frame.getElementsByTagName('A'); i<a.length; i++) {
          if (/close\(\)/.test(a[i].href)) {
            a[i].href = '#close';
            a[i].onclick = function() { box.style.display = 'none' }
          }
          if (/chatboxsmilie/.test(a[i].href)) {
            a[i].href = '#' + a[i].href.match(/chatboxsmilie\('(.*?)'\)/)[1];
            a[i].onclick = function() {
              message.value += ' ' + this.getAttribute('href').slice(1);
              box.style.display = 'none';
            }
          }
        }
      };
    }
  });

  // colors
  popup({
    text : 'Color',
	title : 'Change text color',
    add : color_frame,
  	where : actions,
    advanced : function(b, box) {
      var colortxt = my_getcookie('fmd_chat_colortxt') || '';
      b.appendChild(color_selected);
      color_frame.onload = function() {
        function setColor(val) {
          my_setcookie('fmd_chat_colortxt',val);
          message.style.color = val;
          color_selected.style.background = val;
          box.style.display = 'none';
        };
        var frame = frameContent(color_frame), hex = frame.getElementById('ColorHex'),
            remove = cre({
              tag : 'A',
              html : 'Remove Color',
              href : '#',
              style : 'font-size:12px;text-decoration:none;position:absolute;right:20px;color:red',
              click : function() {
                my_setcookie('fmd_chat_colortxt',0);
                setColor('');
                return false;
              }
            });
    
        if (!hex) return;
        hex.parentNode.appendChild(remove);
        hex.onkeydown = function(e) { if (e.keyCode == 13) { setColor(this.value); return false } };
        for (var i=0,td=frame.getElementsByTagName('TD'); i<td.length; i++) if (td[i].bgColor) td[i].onclick = function() { setColor(this.bgColor) }
      };
      
      if (colortxt.length) {
        message.style.color = colortxt;
        color_selected.style.background = colortxt;
      } 
    }
  });
  
  /* apply plugins, and add the shoutbox to the page */
  config.plugins();
  main.insertBefore(fmd_chat,main.firstChild);
  
  
  /* get the messages, and refresh them if auto-refresh enabled */
  getMessages();
  var chatRefresh = window.setInterval(function() {
    if (!refresh.checked || message.disabled) return;
    getMessages();
    
    /*
    * idle time is 5*60(5mins) without typing
    * used to prevent extra requests and members appearing active if they left their browser unattended
    */
    idle++;
    if (idle > config.timeout) {
      refresh.checked = 0;
      reftxt.className = 'fmd_idle';
    }
  },5000);
  
  /* determine the window state */
  window.onblur = function() { focus = 0 };
  window.onfocus = function() {
    if (!focus) {
      focus = 1;
      newmsg = 0;
      document.title = doct;
    }
  };
  
  /* typing and message submission */
  message.onkeydown = function(e) {
    if (e.keyCode == 8) return true;
    else if (this.value.length > config.char_limit) e.preventDefault(); /* prevent further typing if char limit is reached */
  };
  message.onkeyup = function(e) {
    e.keyCode == 13 && sendMessage();
    idle > 0 && (idle = 0);
    if (reftxt.className.match(/fmd_idle/)) {
      reftxt.className = '';
      refresh.checked = 1;
    }
  };
  send.onclick = function() { sendMessage() };
  
  /* get message rows from the database */
  function getMessages(o) {
    if (loading) return;
    (o && o.apply) && o.apply();
    
    loading = 1;
    $.get(_database.tid, function(data) {
      var table = $('#fmd_chat',data), dbr=$('#fmd_chat .db_chat_row',data), sbr = box.childNodes, idset = [];
      
      /* check if the last sent message is in the database, if not we'll resend the message */
      if (o && o.last && !table.find('#'+o.last).length) {
        message.value = o.msg;
        sendMessage('Error detected, resending message...');
      }
      
      /* remove shouts from database that exceed the maximum limit */
      if (dbr.length > config.msg_max) {
        $.get('/post?p='+config.pid+'&mode=editpost',function(data){
          var rows = $('#text_editor_textarea',data).val().match(/\[tr id="shout_u.*?" class="db_chat_row"\]\[td\].*?\[\/td\]\[td\].*?\[\/td\]\[td\].*?\[\/td\]\[\/tr\]/g);
          $.post('/post?p='+config.pid+'&mode=editpost',{
            subject : _database.name,
            message : '[table id="fmd_chat" class="database_table"][tr][td]User[/td][td]Avatar[/td][td]Message[/td][/tr]'+rows.slice(Number(rows.length - config.msg_max) + config.msg_del,rows.length).join('')+'[/table]',
            post : 1
          });
        }); 
      }
      
      /* remove messages from the shoutbox that aren't in the database */
      for (var i=0,j=sbr.length; i<j; i++) !table.find('#'+sbr[i].id).length && idset.push(sbr[i].id);
      for (var i=0,j=idset.length; i<j; i++) box.removeChild(document.getElementById(idset[i]));
      
      /* apply new messages */
      if (sbr.length < dbr.length) {
        for (var i=0,j=dbr.length,rid; i<j; i++) {
          rid = dbr[i].id;
          if (!document.getElementById(rid)) {
            var uid = dbr[i].firstChild.innerHTML.match(/(.*?):.*?:.*/)[1], unm = dbr[i].firstChild.innerHTML.match(/.*?:(.*?):.*/)[1],
            crow = cre({
              tag : 'DIV',
              id : rid,
              classname : 'fmd_chat_row',
              html : '<div class="fmd_chat_avatar"><a href="/u'+uid+'" title="View '+unm+'\'s profile"><img src="'+(dbr[i].childNodes[1].firstChild.tagName == 'A' ? dbr[i].childNodes[1].firstChild.innerHTML : dbr[i].childNodes[1].innerHTML)+'" alt="avatar"/></a></div><div class="fmd_chat_name">&nbsp;<span class="fmd_chat_time"><img class="fmd_chat_clock" src="http://i38.servimg.com/u/f38/18/45/41/65/time10.png" alt="time :"/> '+dbr[i].firstChild.innerHTML.match(/.*?:.*?:(.*)/)[1]+'</span></div><div class="fmd_chat_message">'+dbr[i].lastChild.innerHTML.replace(/\[custom (.*?)\]/ig,'<span $1>').replace(/\[\/custom\]/ig,'</span>')+'</div>'
            }),
            ulink = cre({
              tag : 'A',
              href : '/u' + uid,
              html : unm,
              title : 'Mention ' + unm,
              click : function() {
                message.focus();
                message.value += '@"'+this.innerHTML+'" ';
                return false;
              }
            });
            
            crow.childNodes[1].insertBefore(ulink,crow.childNodes[1].firstChild);
            box.appendChild(crow);
            !focus && newmsg++;
          }
        }
        !focus && (document.title = '** '+newmsg+' NEW MESSAGE'+ (newmsg > 1 ? 'S' : '') +' **');
        scrollBox();
      }
      
      (o && o.callback) && o.callback();
      loading = 0;
    });
  };
  

  /* post a message to the database */
  function sendMessage(txt) {
    /* filter out tags */
    msg = message.value.replace(/(\[td\]|\[\/td\]|\[tr\]|\[\/tr\]|\[table\]|\[\/table\]|\[th\]|\[\/th\]|\[tbody\]|\[\/tbody\]|\[quote\]|\[quote=.*?\]|\[\/quote\]|\[code\]|\[\/code\]|\[hide\]|\[\/hide\]|\[spoiler\]|\[spoiler=.*?\]|\[\/spoiler\])/gi,'');

    if (!msg.length || msg.length > config.char_limit + 1 || message.disabled) return;
    message.value = txt ? txt : 'Sending...';
    message.disabled = true;
    footer.className = 'fmd_chat_sending';
    
    /* command lines */
    /^\/me/i.test(msg) && (msg = '[b]* ' + msg.replace(/^\/me/i,ud.name) + '[/b]');
    
    /^\/8ball/i.test(msg) && (msg = msg.replace(/^\/8ball/i,'') + ' [b][The Magic 8-Ball says : ' + ['It is certain','It is decidedly so','Without a doubt','Yes definitely','You may rely on it','As I see it, yes','Most likely','Outlook good','Yes','Signs point to yes','Reply hazy try again','Ask again later','Better not tell you now','Cannot predict now','Concentrate and ask again','Don\'t count on it','My reply is no','My sources say no','Outlook not so good','Very doubtful'][Math.floor(Math.random()*20)] + '][/b]');
    
    if (/^(\/random|\/rand)/i.test(msg)) {
      var min = 1, max = 100, n = Math.floor(Math.random() * (max - min + 1)) + min;
      if (msg.match(/\(\d+:\d+\)/)) {
        min = Number(msg.match(/\((\d+):\d+\)/)[1]), max = Number(msg.match(/\(\d+:(\d+)\)/)[1]);
        n = Math.floor(Math.random() * (max - min + 1)) + min;
      }
      msg = ud.name + ' thinks of a number between ' + min + ' and ' + max + ' ...' + n + ' !';
    };
    
    if (/^(\/clear|\/cls)/i.test(msg) && ud.mod) {
      message.value = 'Clearing messages...';
      $.post('/post?p='+config.pid+'&mode=editpost',{
        subject : _database.name,
        message : '[table id="fmd_chat" class="database_table"][tr][td]User[/td][td]Avatar[/td][td]Message[/td][/tr][tr id="shout_u' + ud.id + '-' + +new Date + '" class="db_chat_row"][td]'+ud.id+':Shout Monster:'+setDate()+'[/td][td]http://i38.servimg.com/u/f38/18/21/60/73/sm11.png[/td][td][b]MESSAGES HAVE BEEN CLEARED BY '+ud.name.toUpperCase()+'[/b][/td][/tr][/table]',
        post : 1
      },function() {
        msgEnabled();
        getMessages();
      });
      return;
    }
    
    // formatting
    if (message.style.length) for (var i in fo) RegExp(fo[i].d.a[1], 'i').test(message.style[fo[i].d.a[0]]) && (msg = fo[i].d.b[0] + msg + fo[i].d.b[1]);
    
    // coloring
    if (message.style.color) {
      color = message.style.color.replace(/\s/g,'').toUpperCase();
      color.match(/RGB/) ? msg = '[color='+toHex(color.match(/RGB\((\d+),\d+,\d+\)/)[1], color.match(/RGB\(\d+,(\d+),\d+\)/)[1], color.match(/RGB\(\d+,\d+,(\d+)\)/)[1])+']' + msg + '[/color]' : msg = '[color='+color+']' + msg + '[/color]';
    }
    
    var rid = 'shout_u' + ud.id + '-' + +new Date;
    _database.post({
      pid : config.pid,
      tableid : 'null',
      update : ['null','null'],
      newRow : '[tr id="'+rid+'" class="db_chat_row"][td]'+ud.id+':'+ud.name+':'+setDate()+'[/td][td]'+ud.ava.match(/src="(.*?)"/)[1]+'[/td][td]'+msg+'[/td][/tr]',
      callback : function(state) {
        msgEnabled();
        getMessages({ last : rid, msg : msg });
        state == 'ERROR' && ( footer.innerHTML = '<p class="fmd_chat_error">An error occured : You don\'t have permission to send messages. Please contact the board Administrator for more information.</p>' );
      }
    });
  };
  
  function msgEnabled() { message.disabled = false; footer.className = ''; message.value = ''; message.focus() };
  function scrollBox() { box.scrollTop = 99999 };
  
  function setDate() {
    var a=new Date(), b=new Date(a.getTime()+(a.getTimezoneOffset()*60000)+(3600000*config.timezone));
    function set(i) { return i > 9 ? i : '0' + i };
    return b.getDate() + '/' + (b.getMonth() + 1) + '/' + b.getFullYear() + ' - ' + set(b.getHours()) + ':' + set(b.getMinutes()) + ':' + set(b.getSeconds());
  };
  
  function toHex() {
    for (var i=0, n=arguments, j=n.length, colorString = '#', h; i<j; i++) {
      h = Number(n[i]).toString(16);
      colorString += (h.length < 2 ? '0' + h : h);
    }
    return colorString.toUpperCase();
  };
  
  function cre(o) {
    var el = document.createElement(o.tag);
    o.html && (el.innerHTML = o.html);
    o.id && (el.id = o.id);
    o.forId && (el.htmlFor = o.forId);
    o.classname && (el.className = o.classname);
    o.src && (el.src = o.src);
    o.type && (el.type = o.type);
    o.href && (el.href = o.href);
    o.title && (el.title = o.title);
    o.value && (el.value = o.value);
    o.checked && (el.checked = o.checked);
    if (o.style) {
      o.style = o.style.split(';');
      for (var i = 0, j = o.style.length, d; i<j; i++) {
        if (o.style[i].length) {
          d = o.style[i].split(':');
          el.style[d[0]] = d[1];
        }
      }
    }
    
    o.click && (el.onclick = o.click);
    o.mouseup && (el.onmouseup = o.mouseup);
    
    return el;
  };
  
  function frameContent(frame) {
    if (frame.contentDocument) frame = frame.contentDocument;
    else if (frame.contentWindow) frame = frame.contentWindow.document;
    frame.body.style.background = 'none';
    return frame;
  };
  
  function button(o) {
    var actif = my_getcookie('fmd_chat_'+o.name) == 1,font,a;
    if (o.tags) {
      a = o.css.split(':'), font = a[0].match(/(font-weight|font-style)/);
      fo[o.name] = {
        d : { a : a, b : o.tags },
        press : function() {
          if (message.style[a[0]].match(RegExp(a[1],'i'))) {
            message.style[a[0]] = message.style[a[0]].replace(RegExp(a[1],'i'),(font ? 'normal' : ''));
            this.className = this.className.replace(/actif/,'');
            my_setcookie('fmd_chat_'+o.name,0);
          } else {
            font ? message.style[a[0]] = a[1] : message.style[a[0]] += ' ' + a[1];
            this.className += ' actif';
            my_setcookie('fmd_chat_'+o.name,1);
          }
        }
      };
      actif && (font ? message.style[a[0]] = a[1] : message.style[a[0]] += ' ' + a[1]);
    }
    
    var button = cre({
      tag : 'DIV',
      classname : 'fmd_chat_button' + (o.text.length < 2 ? ' fmd_small' : '') + (actif ? ' actif' : ''),
      html : o.text,
      title : o.name,
      style : (o.style ? o.style : ''),
      mouseup : (fo[o.name] ? fo[o.name].press : '')
    });
    
    o.where.appendChild(button);
    o.advanced && o.advanced(button);
  };
  
  function popup(o) {
    var box = cre({
      tag : 'DIV',
      classname : 'fmd_chat_dropdown',
      style : 'display:none;z-index:10000;' + (o.pop_style ? o.pop_style : ''),
      html : (o.content ? o.content : '')
    }),
    button = cre({
      tag : 'DIV',
      title : (o.title ? o.title : ''),
      classname : 'fmd_chat_button' + (o.text.length < 2 ? ' fmd_small' : ''),
      style : (o.but_style ? o.but_style : ''),
      html : o.text,
      mouseup : function() {
        /none/i.test(box.style.display) ? box.style.display = 'block' : box.style.display = 'none';
        o.add && (!box.childNodes.length && box.appendChild(o.add));
      }
    });
    o.where.appendChild(button);
    o.where.appendChild(box);
    o.advanced && o.advanced(button, box);
  };
});
