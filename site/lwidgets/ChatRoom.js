///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/ChatRoom',
	[
		"dojo/_base/declare",
		
		//"dojo",
		//"dijit",
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		//'dojo/text!./templates/chatroom_nopane.html?' + cacheString,
		'dojo/text!./templates/chatroom.html?' + cacheString,
		
		'lwidgets',
		'lwidgets/Chat',
		'lwidgets/UserList',
		'lwidgets/ToggleIconButton',
		
		
		//extras
		
		
	],
	function(declare,
		//dojo, dijit,
		array, domConstruct, domStyle, domAttr, lang, topic,
		template, lwidgets, Chat,
		UserList,
		ToggleIconButton ){
	return declare( [ Chat ], {
		
	'templateString' : template,
	
	'saystring':'SAY',
	'name' : "",

	'players' : null,
	'subscribeButton' : null,
	//'playerListContent':null,
	
	'subscribed':false,
	
	'postCreate2':function()
	{
		var handle, content, content2, autoJoinButton, autoJoinChans;
		this.players = {};
		
		autoJoinChans = this.settings.settings.autoJoinChannelsList.split('\n');
		
		this.subscribeButton = new ToggleIconButton({
			'style':{'height':'22px', 'width':'25px' },
			'checkedIconClass':'smallIcon subscribeImage',
			'uncheckedIconClass':'smallIcon unsubscribeImage',
			'checked':this.subscribed,
			'checkedLabel':'Subscribed to this channel. Click to cancel.',
			'uncheckedLabel':'Click to subscribe this channel.',
			'onClick':lang.hitch(this, 'subscribeToggle' )
		}).placeAt(this.controlsNode);
		autoJoinButton = new ToggleIconButton({
			'style':{'height':'22px', 'width':'25px' },
			'checkedIconClass':'smallIcon autoJoinImage',
			'uncheckedIconClass':'smallIcon noAutoJoinImage',
			'checked':(array.indexOf(autoJoinChans, this.name)!== -1),
			'checkedLabel':'Auto join this channel. Click to cancel.',
			'uncheckedLabel':'Click to auto-join this channel.',
			'onClick':lang.hitch(this, 'autoJoinToggle' )
		}).placeAt(this.controlsNode);
		
		
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
		this.playerListNode = new UserList({'style':{'width':'100%', 'height':'100%'}})
		
		//this.playerListNode.startup2();
		this.playerListNode.empty(); //weird hax
	},//postcreate2
	
	'startup2':function()
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
	
	'resizeAlready2':function()
	{
		if( this.playerListNode ) //fixme
		{
			this.playerListNode.resizeAlready();
		}
	},
	
	'subscribeToggle':function(val)
	{
		var smsg;
		smsg = "SAYPRIVATE Nightwatch !" + (val ? '' : 'un' ) + 'subscribe #' +this.name;
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
	},
	
	'autoJoinToggle':function(val)
	{
		var autoJoinChans;
		if(val)
		{
			this.settings.setSetting( 'autoJoinChannelsList', this.settings.settings.autoJoinChannelsList + ('\n' + this.name) );
		}
		else
		{
			autoJoinChans = this.settings.settings.autoJoinChannelsList.split('\n');
			autoJoinChans = array.filter( autoJoinChans, lang.hitch(this, function(chanName){ return chanName !== this.name } ) )
			this.settings.setSetting( 'autoJoinChannelsList', autoJoinChans.join('\n') );
		}
	},
	
	'setTopic':function(data)
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
	
	'addPlayer':function( data )
	{
		var pname, line, user;
		if(data.channel !== this.name)
		{
			return;
		}
		pname = data.name;
		//user = new User();
		user = this.users[pname];
		this.players[pname] = user;
		this.playerListNode.addUser(user);
		if( data.joined && this.settings.settings.showJoinsAndLeaves )
		//if( data.joined )
		{
			line = 'has joined ' + this.name;
			this.addLine( line, 'chatJoin', null, pname );
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
		this.playerListNode.removeUser( this.players[pname] );
		
		delete this.players[pname];
		
		if( this.settings.settings.showJoinsAndLeaves )
		{
			line = 'has left ' + this.name + ' ('+ data.msg +')';
			this.addLine( line, 'chatLeave', null, pname );
		}
	},
	
	
	'blank':null
}); }); //declare lwidgets.Chatroom
