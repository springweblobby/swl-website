///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/ChatManager',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		
		//"lwidgets",
		'dijit/_WidgetBase',
		
		
		'lwidgets/LobbySettings',
		'lwidgets/ChatRoom',
		'lwidgets/PrivChat',
		
		
		// *** extras ***
		
		'dojo/text', //for dojo.cache
		
		
		'dijit/Dialog',
		
		'dijit/layout/BorderContainer',
		'dijit/layout/TabContainer',
		'dijit/layout/ContentPane',
		
		'dijit/form/TextBox',
		'dijit/form/Select',
		'dijit/form/Button',
		
		
		
	],
	function(declare,
			
			dojo, dijit,
			
			WidgetBase,
			
			LobbySettings,
			Chatroom,
			PrivChat
			
	){
	return declare( [ WidgetBase  ], {
	
	
	'chatrooms':null,
	'privchats':null,
	
	'started':false,
	'curChatroom':'',
	'tabCont':'',
	'tabs':null,
	
	'settings':null,
	'nick':'',
	
	'users':null, //mixed in
	
	'madeChannelList':false,
	
	'channelListDiv':null,
	
	'buildRendering':function()
	{
		var buttons, newButton;
		
		this.chatrooms = {};
		this.privchats = {};
		this.tabs = {};
		
		this.domNode = dojo.create('div', {'style': {'height': '100%', 'width': '100%;' } });
		
		this.tabCont = new dijit.layout.TabContainer( {
		    //'style': {'height': '100%', 'width': '100%'  },
            'style': {'position':'absolute', 'top': '2px', 'bottom': '2px', 'left': '38px', 'right':'0px'  },
			'tabPosition':'left-h',
			'useSlider':true
        }).placeAt(this.domNode);
        
		buttons = dojo.create('div', {'id':'chatmanagerbuttons', 'style': {'position':'absolute', 'padding':'0px', 'left':'0px', 'top':'0px' ,'height': '150px', 'width': '20px' } }, this.domNode );
		newButton = new dijit.form.Button( {
            'style': {'height': '20px', 'width': '20px'  },
			'label':'Join a Channel',
			'showLabel':false,
			'iconClass':'smallIcon roomchatPlusImage',
			'onClick':dojo.hitch( this, 'makeNewChatRoomDialog' )
        }).placeAt(buttons);
		newButton = new dijit.form.Button( {
            'style': {'height': '20px', 'width': '20px'  },
			'label':'Open a Private Message Window',
			'showLabel':false,
			'iconClass':'smallIcon privchatPlusImage',
			'onClick':dojo.hitch( this, 'makeNewPrivChatDialog' )
        }).placeAt(buttons);
		dojo.create('br', {}, buttons);
		dojo.create('br', {}, buttons);
		newButton = new dijit.form.Button( {
            'style': {'height': '20px', 'width': '20px'  },
			'label':'See the Channel List',
			'showLabel':false,
			'iconClass':'smallIcon channelListImage',
			'onClick':dojo.hitch( this, function(){
				if( this.channelListDiv )
				{
					dojo.empty( this.channelListDiv );
				}
				dojo.publish( 'Lobby/rawmsg', [{'msg':'CHANNELS' }] );
			} )
        }).placeAt(buttons);
		
		
		dojo.subscribe('SetNick', this, function(data){ this.nick = data.nick } );
		
		//stupid hax
		dojo.subscribe('ResizeNeeded', this, function(){ setTimeout( function(thisObj){ thisObj.resizeAlready(); }, 200, this );  } );
		
		dojo.subscribe('Lobby/chat/channels', this, 'addToChannelList' );
		
		dojo.subscribe('Lobby/focuschat', this, 'focusChat');
		
	},
	
	'postCreate' : function()
	{
		dojo.subscribe('Lobby/chat/addroom', this, function(data){ this.addChat(data, true) });
		dojo.subscribe('Lobby/chat/remroom', this, 'remChatRoom' );
		
		dojo.subscribe('Lobby/chat/addprivchat', this, 'addChat' );
		
	},
	
	'focusChat':function( data )
	{
		setTimeout( function(thisObj){
			thisObj.tabCont.selectChild( thisObj.tabs[(data.isRoom ? '#' : '') + data.name] );
		}, 500, this );
	},
		
	
	'addToChannelList':function(data)
	{
		var channelRow, channelInfo, channelLink;
		this.makeChannelList();
		//channelRow = dojo.create( 'div', {'innerHTML': channelInfo }, this.channelListDiv );
		channelRow = dojo.create( 'div', {}, this.channelListDiv );
		channelLink = dojo.create('a', {
			'href':'#',
			'innerHTML':data.channel,
			'onclick':dojo.partial( function(channel, e)
			{
				var smsg = 'JOIN ' + channel
				dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
				dojo.stopEvent(e);
				return false;
			}, data.channel)
		}, channelRow );
		channelInfo = dojo.create('span', {'innerHTML': (' (' + data.userCount + ' users) ' + data.topic.replace(/\\n/g, '<br />') ) }, channelRow);
		
		dojo.create( 'hr', {}, this.channelListDiv );
	},
	
	'makeChannelList':function()
	{
		var cp;
		if(!this.madeChannelList)
		{
			this.channelListDiv = dojo.create( 'div', {} );
			cp = new dijit.layout.ContentPane({
				'title': 'Channels',
				'content': this.channelListDiv,
				'iconClass':'smallIcon channelListImage',
				'closable':true,
				//'onClose':dojo.hitch(this, function(){delete this.channelListDiv; this.madeChannelList = false; } ),
				'shown':false
			});
			
			dojo.connect(cp, 'onClose', dojo.hitch(this, function(){delete this.channelListDiv; this.madeChannelList = false; } ) );
			
			this.tabCont.addChild( cp );
			this.madeChannelList = true;
		}
		
	},
	
	'join':function(input, dlg, e)
	{
		var smsg, value;
		value = dojo.attr( input, 'value' )
		if( e.keyCode === 13 )
		{
			smsg = 'JOIN ' + value
			dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
			dlg.hide();
		}
	},
	
	'openPrivChat':function(input, dlg, e)
	{
		var value;
		value = dojo.attr( input, 'value' )
		if( e.keyCode === 13 )
		{
			this.addChat( {'name':value} , false )
			dlg.hide();
		}
	},
	
	'makeNewChatRoomDialog':function()
	{
		var dlg, input, contentDiv;
		contentDiv = dojo.create( 'div', {} );
		dojo.create( 'span', {'innerHTML':'Channel Name '}, contentDiv );
		input = dojo.create( 'input', {'type':'text'}, contentDiv );
		
		dlg = new dijit.Dialog({
            'title': "Join A Channel",
            'style': "width: 300px",
			'content':contentDiv
        });
		dojo.connect(input, 'onkeyup', dojo.hitch(this, 'join', input, dlg ) )
		
		dlg.show();
	},
	'makeNewPrivChatDialog':function()
	{
		var dlg, input, contentDiv;
		contentDiv = dojo.create( 'div', {} );
		dojo.create( 'span', {'innerHTML':'User Name '}, contentDiv );
		input = dojo.create( 'input', {'type':'text'}, contentDiv );
		
		dlg = new dijit.Dialog({
            'title': "Open A Private Message Window",
            'style': "width: 300px",
			'content':contentDiv
        });
		dojo.connect(input, 'onkeyup', dojo.hitch(this, 'openPrivChat', input, dlg ) )
		
		dlg.show();
	},
	
	'addChat':function( data, isRoom )
	{	
		var newChat, roomName, cpChatroom, iconClass, chatName, chatTabName;
		chatName = data.name;
		chatTabName = chatName;
		
		data.settings = this.settings;
		data.nick = this.nick;
		data.users = this.users;
		
		
		//data.id = data.name; //fixme this is a test
		if(isRoom)
		{
			if( this.chatrooms[chatName] )
			{
				//this.chatrooms[chatName].playerListNode.empty();
				return;
			}
			newChat = new Chatroom( data );
			//newChat = new lwidgets.Chatroom2( data );
			this.chatrooms[chatName] = newChat;
			iconClass = 'smallIcon roomchatImage';
			chatTabName = '#'+chatName;
		}
		else
		{
			if( this.privchats[chatName] ) return;
			newChat = new PrivChat( data );
			this.privchats[chatName] = newChat;
			iconClass = 'smallIcon privchatImage';
		}
		
		cpChat = new dijit.layout.ContentPane({
			'title': chatName,
            'content': newChat.domNode,
			'iconClass':iconClass,
			'onShow':dojo.hitch( this, function(chat1) {
				if( this.started )
				{
					setTimeout( function(chat2){
						chat2.startup2();
					}, 200, chat1 );
				}
			}, newChat ),
			/**/
			'closable':true,
			
			//custom stuff
			'origTitle':chatName,
			'shown':false
        });
		
		dojo.connect(cpChat, 'onShow', dojo.hitch( cpChat, 'set', 'title', chatName ) );
		dojo.connect(cpChat, 'onShow', dojo.hitch( cpChat, 'set', 'shown', true ) ); //different from focus
		dojo.connect(cpChat, 'onHide', dojo.hitch( cpChat, 'set', 'shown', false ) ); //different from focus
		
		/*
		if(isRoom)
		{
			//dojo.connect( cpChat, 'onClose', dojo.hitch( this, 'remChatRoom', {'name':chatName} ) ); //don't use this
			cpChat.onClose = dojo.hitch( this, 'remChatRoom', {'name':chatName} );
		}
		else
		{
			dojo.connect( cpChat, 'onClose', dojo.hitch( this, function(){
				delete this.privchats[chatName];
				delete this.tabs[chatName];
			}, chatName ));
			
		}
		*/
		
		cpChat.onClose = dojo.hitch( this, 'remChatRoom', {'name':chatName} );
		
		
		dojo.subscribe('Lobby/chat/channel/playermessage', this, dojo.hitch( this, 'notifyActivity', chatName, cpChat ) );
		dojo.subscribe('Lobby/chat/user/playermessage', this, dojo.hitch( this, 'notifyActivity', chatName, cpChat ) );
		
		this.tabs[chatTabName] = cpChat;
		
		this.tabCont.addChild( cpChat );
		
		
		//don't focus window if someone messaged you
		if( typeof data.msg !== 'string' ) 
		{
			setTimeout( function(thisObj){
				thisObj.tabCont.selectChild( cpChat );
			}, 500, this );
		}
		
	},
	
	'notifyActivity':function(chatName, cpChat, data)
	{
		if( !cpChat.shown //different from focus
		   && ( chatName === data.channel || chatName === data.userWindow )
		   ) 
		{
			cpChat.set('title' , '<b>'+cpChat.origTitle+'</b>' );
		}
	},

	'remChatRoom':function( data )
	{
		var name, tabName, smsg;
		name = data.name
		tabName = this.chatrooms[name] ? '#' + name : name;
		this.tabCont.removeChild( this.tabs[tabName] );
		if( this.chatrooms[name] )
		{
			this.chatrooms[name].destroyMe();
			delete this.chatrooms[name];
			smsg = 'LEAVE ' + name;
			dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
		}
		else if( this.privchats[name] )
		{
			this.privchats[name].destroyMe();
			delete this.privchats[name];
		}
		delete this.tabs[tabName];
	},
	
	//stupid hax
	'resizeAlready':function()
	{
		this.tabCont.resize();
		//dojo.forEach(this.tabCont.getChildren(), function(child){ child.resize(); });
	},
	'startup2':function()
	{
		var firstCp
		if( this.started )
		{
			return;
		}
		this.tabCont.startup();
		this.resizeAlready();

		setTimeout( function(thisObj){
			var chat, firstTab, firstChat;
			
			thisObj.resizeAlready();
			dojo.forEach(thisObj.tabCont.getChildren(), function(tab)
			{
				chat = tab.getChildren()[0]
				if(chat)
				{
					chat.startup2();
					chat.resizeAlready();
				}
			});
			
			thisObj.started = true;
		
		}, 1000, this );
		
	},
	
	'blank':null
}); });//declare lwidgets.ChatManager



