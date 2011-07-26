///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

///////////////////////////////////

dojo.provide("lwidgets.Chat");
dojo.declare("lwidgets.Chat", [ dijit._Widget, dijit._Templated ], {
	'widgetsInTemplate':true,
	
	//'templateString' : dojo.cache("lwidgets", "templates/chatroom.html"), //ARG
	
	//'templateString' : dojo.cache("lwidgets", "templates/chatroom_nopane.html"),
	'mainContainer':'',
	'messageNode':'',

	'name' : "",
	'startMeUp':true,
	
	'settings':null,
	
	'maxLines':100,
	'nick':'',
	
	'queryPlayer':function( e )
	{
		var option, name;
		option = e.currentTarget;
		name = dojo.attr( option, 'innerHTML' );
		dojo.publish('Lobby/chat/addprivchat', [{'name':name, 'msg':'' }]  )
	},
	
	'postCreate' : function()
	{
		dojoattachpoint:"mainContainer"
		this.mainContainer = new dijit.layout.BorderContainer({
			design:"sidebar",
			gutters:true,
			liveSplitters:true
		}, this.mainContainerNode);
		
		this.messageNode = new dijit.layout.ContentPane({ splitter:true, region:"center" }, this.messageDivNode );
		this.inputNode = new dijit.layout.ContentPane({ splitter:false, region:"bottom" }, this.inputDivNode );
		
		this.postCreate2();
		setTimeout( function(thisObj){ dojo.publish('SetColors') }, 1000, this );
		
		dojo.subscribe('SetNick', this, function(data){ this.nick = data.nick } );
		
		//dumb hax
		dojo.subscribe('ResizeNeeded', this, function(){ setTimeout( function(thisObj){ thisObj.resizeAlready(); }, 400, this );  } );
		
	},
	
	
	'postCreate2':function()
	{
	},
	
	'send':function(e)
	{
		var msg, smsg, msg_arr, rest;
		//enter
		if(e.keyCode != 13) return;
		
		msg = this.textInputNode.value;
		
		msg_arr = msg.split(' ');
		cmd = msg_arr[0];
		
		if( cmd == '/me' )
		{
			rest = msg_arr.slice(1).join(' ')
			smsg = this.saystring + 'EX ' + this.name + ' ' + rest;
		}
		else
		{
			smsg = this.saystring + ' ' + this.name + ' ' + msg;
		}
		dojo.publish( 'Server/message', [{'msg':smsg }] );
		this.textInputNode.value = '';
	},
	
	
	'scrollToBottom':function()
	{
		this.messageNode.domNode.scrollTop = 9999;
	},
	
	'addLine':function(line, style, className)
	{
		var toPlace, newNode, date, timestamp, line_ts, line_clean;
		date = new Date();
		timestamp = '[' + date.toLocaleTimeString() + ']';
		toPlace = this.messageNode.domNode;
		line_ts = timestamp + ' ' + line;
		newNode = dojo.create('div', {
			'innerHTML':line_ts,
			'style':style ? style : {},
			'class':className ? className : ''
		}, toPlace )
		
		//fixme: hidden join/leaves will cause confusing removal of chat lines
		while( toPlace.children.length > this.maxLines )
		{
			dojo.destroy( toPlace.firstChild );
		}
		this.scrollToBottom(newNode);
	},
	
	'playerMessage':function( data )
	{
		var pname, msg, line, lineStyle, lineClass;
		
		if(data.channel !== this.name && data.userWindow !== this.name && data.battle === undefined )
		{
			console.log('return')
			return;
		}
		
		msg = data.msg;
		msg = dojox.html.entities.encode(msg);
		pname = data.name;
		
		if(data.ex)
		{
			line = '* ' + pname + ' ' + msg
		}
		else
		{
			line = 	dojox.html.entities.encode('<')
					+ pname
					+ dojox.html.entities.encode('> ')
					+ msg
		}
		
		lineStyle = {};
		lineClass = '';
		if(data.ex)
		{
			lineStyle = {'color':this.settings.settings.chatActionColor};
			lineClass = 'chatAction';
		}
		else if(pname == this.nick)
		{
			lineStyle = {'color':this.settings.fadedColor };
			lineClass = 'chatMine';
		}
		this.addLine( line, lineStyle, lineClass );
	},
	
	//stupid hax
	'resizeAlready':function()
	{
		this.mainContainer.resize();
	},
	'startup2':function()
	{
		//sucky hax
		setTimeout( function(thisObj){ thisObj.resizeAlready(); }, 400, this );
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
		}
	},
	
	'blank':''
});//declare lwidgets.Chatroom


dojo.provide("lwidgets.Chatroom");
dojo.declare("lwidgets.Chatroom", [ lwidgets.Chat ], {
	'widgetsInTemplate':true,
	
	//'templateString' : dojo.cache("lwidgets", "templates/chatroom.html"), //ARG
	
	'templateString' : dojo.cache("lwidgets", "templates/chatroom_nopane.html"),
	
	'playerlistNode':'',
	'topicNode':'',

	'saystring':'SAY',
	'name' : "",
	'players' : null,
	'playersOptions' : null,
	
	
	'postCreate2':function()
	{
		this.players = {};
		this.playersOptions = {};
		
		this.playerlistNode = new dijit.layout.ContentPane({ splitter:true, region:"trailing" }, this.playerlistDivNode );
		this.topicNode = new dijit.layout.ContentPane({ splitter:true, region:"top" }, this.topicDivNode );
		
		dojo.subscribe('Lobby/chat/channel/topic', this, 'setTopic' );
		dojo.subscribe('Lobby/chat/channel/addplayer', this, 'addPlayer' );
		dojo.subscribe('Lobby/chat/channel/remplayer', this, 'remPlayer' );
		dojo.subscribe('Lobby/chat/channel/playermessage', this, 'playerMessage' );
		
		//setTimeout( function(thisObj){ thisObj.sortPlayerlist(); }, 2000, this );
		
	},
	
	
	/*
	'sortPlayerlist':function()
	{
		this.playerlistSelect.domNode.empty();
	},
	*/
	
	'setTopic':function(data)
	{
		var msg, topicStr, timestamp, date;
		if(data.channel !== this.name)
		{
			return;
		}
		msg = data.msg;
		date = new Date();
		date.setTime(data.time);
		timestamp = date.toLocaleString();
		msg = msg.replace(/\\n/g, '<br />');
		topicStr = msg + "<br /><div align='right' style='font-style:italic'>(Topic set by " + data.name + ' on ' + timestamp + ')</div>';
		dojo.attr( this.topicDivNode, 'innerHTML', topicStr );
	},
	
	
	
	'addPlayer':function( data )
	{
		var pname, line;
		
		if(data.channel !== this.name)
		{
			return;
		}
		
		pname = data.name;
		
		this.players[pname] = new User();
		this.playersOptions[pname] = dojo.create('option', {'innerHTML':pname }, this.playerlistSelect.domNode )
		
		dojo.connect( this.playersOptions[pname], 'ondblclick', this, 'queryPlayer', this.playersOptions[pname] );
		
		//if( data.joined && this.settings.settings.showJoinsAndLeaves )
		if( data.joined )
		{
			line = '*** ' + pname + ' has joined ' + this.name;
			//this.addLine( line, {'color':this.settings.settings.chatLeaveColor}, 'chatJoin' );
			this.addLine(
				line,
				{
					'color':this.settings.settings.chatJoinColor,
					'display':this.settings.settings.showJoinsAndLeaves ? 'block' :'none'
				},
				'chatJoin'
				);
		}
	},
	
	
	'remPlayer':function( data )
	{
		var pname, line;
		if(data.channel !== this.name)
		{
			return;
		}
		pname = data.name;
		
		dojo.destroy(this.playersOptions[pname])
		delete this.playersOptions[pname];
		delete this.players[pname];
		//if( this.settings.settings.showJoinsAndLeaves )
		{
			line = '*** ' + pname + ' has left ' + this.name + ' ('+ data.msg +')';
			//this.addLine( line, {'color':this.settings.settings.chatLeaveColor}, 'chatLeave' );
			this.addLine(
				line,
				{
					'color':this.settings.settings.chatLeaveColor,
					'display':this.settings.settings.showJoinsAndLeaves ? 'block' :'none'
				},
				'chatLeave'
				);
		}
	},
	
	
	'blank':''
});//declare lwidgets.Chatroom




dojo.provide("lwidgets.Battleroom");
dojo.declare("lwidgets.Battleroom", [ lwidgets.Chat ], {
	'widgetsInTemplate':true,
	
	'templateString' : dojo.cache("lwidgets", "templates/battleroom_nopane.html"),
	

	'saystring':'SAYBATTLE',
	'name':'',
	'host':'',
	
	'battle_id':0,
	
	'playerlistNode':null,
	'players' : null,
	'playersOptions' : null,
	
	'ateams':null,
	'ateamNumbers':null,
	
	'battleList':null,		//mixed in
	'lobbyPlayers':null,	//mixed in
	
	'runningGame':false,
	
	'postCreate2':function()
	{
		this.players = {};
		this.playersOptions = {};
		this.ateams = {};
		this.ateamNumbers = [];
		
		
		this.playerlistNode = new dijit.layout.ContentPane({ splitter:true, region:"trailing" }, this.playerlistDivNode );
		
		dojo.subscribe('Lobby/battle/joinbattle', this, 'joinBattle' );
		dojo.subscribe('Lobby/battles/addplayer', this, 'addPlayer' );
		dojo.subscribe('Lobby/battles/remplayer', this, 'remPlayer' );
		dojo.subscribe('Lobby/battle/playermessage', this, 'playerMessage' );
		dojo.subscribe('Lobby/battle/playerstatus', this, function(data){ this.playerStatus(data) });
		
		dojo.subscribe('Lobby/battle/checkStart', this, 'checkStart' );
	},
	
	'checkStart':function()
	{
		if( this.players[this.host] )
		{
			if( this.players[this.host].isInGame && !this.runningGame )
			{
				dojo.publish('Lobby/startgame');
			}
			this.runningGame = this.players[this.host].isInGame;
		}
	},
	
	'joinBattle':function( data )
	{
		var blistStore = this.battleList.store;
		
		this.battle_id = data.battle_id;
		dojo.style( this.hideBattleNode, 'display', 'none' );
		dojo.style( this.battleDivNode, 'display', 'block' );
		
		blistStore.fetchItemByIdentity({
			'identity':data.battle_id,
			'scope':this,
			'onItem':function(item)
			{
				var members, playerlist;
				members 	= parseInt( blistStore.getValue(item, 'members') );
				playerlist 	= blistStore.getValue(item, 'playerlist');
				this.host	= blistStore.getValue(item, 'host');
				
				
				for(player_name in playerlist)
				{
					this.addPlayer( { 'battle_id':this.battle_id, 'name':player_name } )
				}
				
				this.addPlayer( { 'battle_id':this.battle_id, 'name':this.nick } )
				
				//console.log(blistStore.getValue(item, 'ip'))
			}
		});
		this.setupPlayerList();
		
		//dojo.publish('Lobby/startgame');
	},
	
	'leaveBattle':function()
	{
		var smsg;
		smsg = 'LEAVEBATTLE'
		dojo.publish( 'Server/message', [{'msg':smsg }] );
		this.host = '';
		this.closeBattle();
	},
	
	'closeBattle':function( )
	{
		this.battle_id = 0;
		dojo.style( this.hideBattleNode, 'display', 'block' );
		dojo.style( this.battleDivNode, 'display', 'none' );
		dojo.empty( this.playerlistSelect.domNode );
		this.playersOptions = {};
		this.players = {};
	},
	
	'makePlayerOption':function(user)
	{
		this.playersOptions[user.name] = dojo.create('option', {'innerHTML':user.toString() }, this.playerlistSelect.domNode );
		dojo.connect( this.playersOptions[user.name], 'ondblclick', this, 'queryPlayer', this.playersOptions[user.name] );
	},
	
	'addPlayer':function( data )
	{
		var pname, line, user, ateam;
		pname = data.name;
		
		if( pname === '' )
		{
			return;
		}
		if( data.battle_id === this.battle_id )
		{
			//user = new User({'name':pname});
			user = this.lobbyPlayers[pname];
			this.players[pname] = user;
			
			if( data.joined )
			{
				line = '*** ' + pname + ' has joined the battle.';
				this.addLine(line);
			}
		}
		this.setupPlayerList();
	},
	
	'remPlayer':function( data )
	{
		var pname, line, battle_id, ateam;
		if( data.battle_id === this.battle_id )
		{
			pname = data.name;
			delete this.players[pname];
			
			line = '*** ' + pname + ' has left the battle.';
			this.addLine(line);
			
			if( pname === this.nick )
			{
				this.closeBattle();
			}
		}
		this.setupPlayerList();
	},
	
	'playerStatus':function( data )
	{
		var user;
		user = this.players[data.name];
		this.players[data.name].setBattleStatus( data.battlestatus, data.teamColor );
		
		this.setupPlayerList();
	},
	
	'setupTeamList':function()
	{
		var name, ateam, spec, user;
		
		this.ateams = {};
		this.ateamNumbers = [];
		for( name in this.players )
		{
			user = this.players[name];
			
			ateam = user.allyNumber;
			spec = user.isSpectator;
			if( spec )
			{
				ateam = '-1';
			}
			
			if(!this.ateams[ateam])
			{
				this.ateams[ateam] = {};
				this.ateamNumbers.push(ateam);
			}
			this.ateams[ateam][name] = user;
		}
		this.ateamNumbers.sort(function(a,b) { return a - b; });
	},	
	
	'setupPlayerList':function()
	{
		var user, name, ateam, ateamOut, ateamUsers ;
		
		this.setupTeamList();
		
		dojo.empty( this.playerlistSelect.domNode );
		/*
		for( name in this.players )
		{
			user = this.players[name];
			this.makePlayerOption( user );
		}
		*/
		
		//for( ateam in this.ateams ){
		dojo.forEach(this.ateamNumbers, function(ateam){
			if(ateam !== '-1')
			{
				ateamOut = '<< TEAM ' + (parseInt(ateam)+1) + ' >>'
				dojo.create('option', {'innerHTML': ateamOut }, this.playerlistSelect.domNode );
				
				ateamUsers = this.ateams[ateam]
				for( name in ateamUsers  )
				{	
					user = ateamUsers[name];	
					this.makePlayerOption( user );
				}
			}
		}, this);
		
		ateamOut = '<< Spectators >>'
		dojo.create('option', {'innerHTML': ateamOut }, this.playerlistSelect.domNode );
		
		ateamUsers = this.ateams['-1']
		for( name in ateamUsers  )
		{	
			user = ateamUsers[name];	
			this.makePlayerOption( user );
		}
		
		
			
	},
	
	'blank':''
});//declare lwidgets.Battleroom



dojo.provide("lwidgets.Privchat");
dojo.declare("lwidgets.Privchat", [ lwidgets.Chat ], {
	'widgetsInTemplate':true,
	
	//'templateString' : dojo.cache("lwidgets", "templates/chatroom.html"), //ARG
	
	'templateString' : dojo.cache("lwidgets", "templates/privchat_nopane.html"),
	
	'saystring':'SAYPRIVATE',
	'name' : "",
	
	'postCreate2':function()
	{
		this.playerlistNode = new dijit.layout.ContentPane({ splitter:true, region:"trailing" }, this.playerlistDivNode );
		//stupid hax
		dojo.connect(this.mainContainer, 'onMouseDown', this, this.resizeAlready)
		
		//dojo.subscribe('Lobby/chat/user/' + this.name + '/playermessage', this, function(data){ this.playerMessage(data) });
		dojo.subscribe('Lobby/chat/user/playermessage', this, 'playerMessage' );
	},
	
	'blank':''
});//declare lwidgets.Privchat



