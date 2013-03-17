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
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		
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
			
			array, domConstruct, domStyle, domAttr, lang,
			
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
	'subscribedChannels':null, //mixed in
	
	'madeChannelList':false,
	
	'channelListDiv':null,
	
	'buildRendering':function()
	{
		var buttons, newButton;
		
		this.chatrooms = {};
		this.privchats = {};
		this.tabs = {};
		this.subscribedChannels = [];
		
		this.domNode = domConstruct.create('div', {'style': {'height': '100%', 'width': '100%;' } });
		
		this.tabCont = new dijit.layout.TabContainer( {
		    //'style': {'height': '100%', 'width': '100%'  },
            'style': {'position':'absolute', 'top': '2px', 'bottom': '2px', 'left': '38px', 'right':'0px'  },
			'tabPosition':'left-h',
			'useSlider':true
        }).placeAt(this.domNode);
        
		buttons = domConstruct.create('div', {'id':'chatmanagerbuttons', 'style': {'position':'absolute', 'padding':'0px', 'left':'0px', 'top':'0px' ,'height': '150px', 'width': '20px' } }, this.domNode );
		newButton = new dijit.form.Button( {
            'style': {'height': '20px', 'width': '20px'  },
			'label':'Join a Channel',
			'showLabel':false,
			'iconClass':'smallIcon roomchatPlusImage',
			'onClick':lang.hitch( this, 'makeNewChatRoomDialog' )
        }).placeAt(buttons);
		newButton = new dijit.form.Button( {
            'style': {'height': '20px', 'width': '20px'  },
			'label':'Open a Private Message Window',
			'showLabel':false,
			'iconClass':'smallIcon privchatPlusImage',
			'onClick':lang.hitch( this, 'makeNewPrivChatDialog' )
        }).placeAt(buttons);
		domConstruct.create('br', {}, buttons);
		domConstruct.create('br', {}, buttons);
		newButton = new dijit.form.Button( {
            'style': {'height': '20px', 'width': '20px'  },
			'label':'See the Channel List',
			'showLabel':false,
			'iconClass':'smallIcon channelListImage',
			'onClick':lang.hitch( this, function(){
				if( this.channelListDiv )
				{
					domConstruct.empty( this.channelListDiv );
				}
				dojo.publish( 'Lobby/rawmsg', [{'msg':'CHANNELS' }] );
			} )
        }).placeAt(buttons);
		
		
		dojo.subscribe('SetNick', this, function(data){ this.nick = data.nick } );
		
		//stupid hax
		dojo.subscribe('ResizeNeeded', this, function(){ setTimeout( function(thisObj){ thisObj.resizeAlready(); }, 1, this );  } );
		//dojo.subscribe('ResizeNeeded', this, 'resizeAlready' );
		
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
		this.tabCont.selectChild( this.tabs[(data.isRoom ? '#' : '') + data.name] );
	},
		
	
	'addToChannelList':function(data)
	{
		var channelRow, channelInfo, channelLink;
		this.makeChannelList();
		//channelRow = domConstruct.create( 'div', {'innerHTML': channelInfo }, this.channelListDiv );
		channelRow = domConstruct.create( 'div', {}, this.channelListDiv );
		channelLink = domConstruct.create('a', {
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
		channelInfo = domConstruct.create('span', {'innerHTML': (' (' + data.userCount + ' users) ' + data.topic.replace(/\\n/g, '<br />') ) }, channelRow);
		
		domConstruct.create( 'hr', {}, this.channelListDiv );
	},
	
	'makeChannelList':function()
	{
		var cp;
		if(!this.madeChannelList)
		{
			this.channelListDiv = domConstruct.create( 'div', {} );
			cp = new dijit.layout.ContentPane({
				'title': 'Channels',
				'content': this.channelListDiv,
				'iconClass':'smallIcon channelListImage',
				'closable':true,
				//'onClose':lang.hitch(this, function(){delete this.channelListDiv; this.madeChannelList = false; } ),
				'shown':false
			});
			
			dojo.connect(cp, 'onClose', lang.hitch(this, function(){delete this.channelListDiv; this.madeChannelList = false; } ) );
			
			this.tabCont.addChild( cp );
			this.madeChannelList = true;
		}
		
	},
	
	'join':function(input, dlg, e)
	{
		var smsg, value;
		value = domAttr.get( input, 'value' )
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
		value = domAttr.get( input, 'value' )
		if( e.keyCode === 13 )
		{
			this.addChat( {'name':value} , false )
			dlg.hide();
		}
	},
	
	'makeNewChatRoomDialog':function()
	{
		var dlg, input, contentDiv;
		contentDiv = domConstruct.create( 'div', {} );
		domConstruct.create( 'span', {'innerHTML':'Channel Name '}, contentDiv );
		input = domConstruct.create( 'input', {'type':'text'}, contentDiv );
		
		dlg = new dijit.Dialog({
            'title': "Join A Channel",
            'style': "width: 300px",
			'content':contentDiv
        });
		dojo.connect(input, 'onkeyup', lang.hitch(this, 'join', input, dlg ) )
		
		dlg.show();
	},
	'makeNewPrivChatDialog':function()
	{
		var dlg, input, contentDiv;
		contentDiv = domConstruct.create( 'div', {} );
		domConstruct.create( 'span', {'innerHTML':'User Name '}, contentDiv );
		input = domConstruct.create( 'input', {'type':'text'}, contentDiv );
		
		dlg = new dijit.Dialog({
            'title': "Open A Private Message Window",
            'style': "width: 300px",
			'content':contentDiv
        });
		dojo.connect(input, 'onkeyup', lang.hitch(this, 'openPrivChat', input, dlg ) )
		
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
		
		if(isRoom)
		{
			if( this.chatrooms[chatName] )
			{
				//this.chatrooms[chatName].playerListNode.empty();
				return;
			}
			if( array.indexOf(this.subscribedChannels, data.name) !== -1 )
			{
				data.subscribed = true;
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
			'onShow':lang.hitch( this, function(chat1) {
				chat1.startup2();
				//chat1.resizeAlready();
				setTimeout( function(chat2){
					chat2.resizeAlready();
				}, 1, chat1 );
			}, newChat ),
			'closable':true,
			
			//custom stuff
			'origTitle':chatName,
			'shown':false
        });
		newChat.startup2();
		
		dojo.connect(cpChat, 'onShow', lang.hitch( cpChat, 'set', 'title', chatName ) );
		dojo.connect(cpChat, 'onShow', lang.hitch( cpChat, 'set', 'shown', true ) ); //different from focus
		dojo.connect(cpChat, 'onHide', lang.hitch( cpChat, 'set', 'shown', false ) ); //different from focus
		
		cpChat.onClose = lang.hitch( this, 'remChatRoom', {'name':chatName} );
		
		
		dojo.subscribe('Lobby/chat/channel/playermessage', this, lang.hitch( this, 'notifyActivity', chatName, cpChat ) );
		dojo.subscribe('Lobby/chat/user/playermessage', this, lang.hitch( this, 'notifyActivity', chatName, cpChat ) );
		
		this.tabs[chatTabName] = cpChat;
		
		this.tabCont.addChild( cpChat );
		
		
		//don't focus window if someone messaged you
		if( typeof data.msg !== 'string' ) 
		{
			this.tabCont.selectChild( cpChat );
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
		var chat, firstTab, firstChat;
	},
	'startup2':function()
	{
		var chat, firstTab, firstChat;
		var firstCp
		if( this.started )
		{
			return;
		}
		this.tabCont.startup();
		array.forEach(this.tabCont.getChildren(), function(tab)
		{
			chat = tab.getChildren()[0]
			if(chat)
			{
				chat.startup2();
			}
		});
		this.started = true;	
	},
	
	'blank':null
}); });//declare lwidgets.ChatManager



