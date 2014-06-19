///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/ChatRoom',
	[
		"dojo/_base/declare",
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		'dojo/text!./templates/chatroom.html?' + cacheString,
		
		'lwidgets',
		'lwidgets/Chat',
		'lwidgets/UserList',
		'lwidgets/ToggleIconButton',
		
		//extras
		
	],
	function(declare,
		array, domConstruct, domStyle, domAttr, lang, topic,
		template, lwidgets, Chat,
		UserList,
		ToggleIconButton ){
	return declare( [ Chat ], {
		
	templateString : template,
	
	saystring: 'SAY',
	name : "",

	players : null,
	chatType: 'channel',
	
	subscribed: false,
	
	postCreate2: function()
	{
		var handle, content, content2
		this.players = {};
		
		this.autoJoinButton.setChecked( this.settings.isInList( this.name, 'autoJoinChannelsList' ) );
		
		this.subscribeButton.setChecked( this.subscribed );
		
		this.addSubscription( this.subscribe('Lobby/chat/channel/topic', 'setTopic' ) );
		this.addSubscription( this.subscribe('Lobby/chat/channel/addplayer', 'addPlayer' ) );
		this.addSubscription( this.subscribe('Lobby/chat/channel/remplayer', 'remPlayer' ) );
		this.addSubscription( this.subscribe('Lobby/chat/channel/playermessage', 'playerMessage' ) );
		this.addSubscription( this.subscribe('Lobby/chat/channel/subscribe', function(data){
			if( data.name === this.name )
			{
				this.subscribed = data.subscribed;
				this.subscribeButton.setChecked(true);
			}
		} ) );
		this.playerListNode = new UserList({style: {width: '100%', height: '100%'}, nick:this.nick})
		
		//this.playerListNode.startup2();
		this.playerListNode.empty(); //weird hax
		
		this.showLog();
		
	},//postcreate2
	
	startup2: function()
	{
		//sucky hax
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
			this.playerListNode.placeAt(this.playerlistPaneDiv)
			this.playerListNode.startup2();
		}
	},
	
	resizeAlready: function()
	{
		this.inherited(arguments);
		if( this.playerListNode ) //fixme
		{
			this.playerListNode.resizeAlready();
		}
	},
	
	subscribeToggle: function(val)
	{
		var smsg;
		smsg = "SAYPRIVATE Nightwatch !" + (val ? '' : 'un' ) + 'subscribe #' +this.name;
		topic.publish( 'Lobby/rawmsg', {msg: smsg } );
	},
	
	autoJoinToggle:function(value)
	{
		this.settings.setListSetting(this.name, value, 'autoJoinChannelsList' )
	},
	
	setTopic: function(data)
	{
		var msg, topicStr, timestamp, date;
		if(data.channel !== this.name)
		{
			return;
		}
		msg = makeLinks( data.msg, this.settings.settings.headerTextColor );
		date = new Date();
		date.setTime(data.time);
		timestamp = date.toLocaleString();
		msg = msg.replace(/\\n/g, '<br />');
		topicStr = msg + "<br /><div align='right' class='topicAuthor' "
			+ "style='font-style:italic; color:" + this.settings.fadedTopicColor + "; '>"
			+ "(Topic set by " + data.name + ' on ' + timestamp + ')</div>';
		//domAttr.set( this.topicPaneDiv, 'innerHTML', topicStr );
		//this.topicPane.set( 'content', topicStr );
		domAttr.set( this.topicDiv, 'innerHTML', topicStr );
		
	},
	
	addPlayer: function( data )
	{
		var pname, line, user;
		if(data.channel !== this.name)
		{
			return;
		}
		pname = data.name;
		//user = new User();
		user = this.users[pname];
		if (user === undefined) {
			
			//server reported a user in a channel after not reporting clientstatus so user doesn't exist
			return;
		}
		this.players[pname] = user;
		this.playerListNode.addUser(user);
		if( data.joined && this.settings.settings.showJoinsAndLeaves )
		//if( data.joined )
		{
			line = pname + ' has joined ' + this.name;
			this.addLine( line, 'chatJoin' );
		}
	},
	
	
	remPlayer: function( data )
	{
		var pname, line;
		if(data.channel !== this.name)
		{
			return;
		}
		pname = data.name;
		this.playerListNode.removeUser( this.players[pname] );
		
		delete this.players[pname];
		
		if( this.settings.settings.showJoinsAndLeaves )
		{
			line = pname + ' has left ' + this.name + ' ('+ data.msg +')';
			this.addLine( line, 'chatLeave' );
		}
	},
	
	
	blank: null
}); }); //declare lwidgets.Chatroom
