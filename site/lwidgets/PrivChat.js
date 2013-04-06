///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/PrivChat',
	[
		"dojo/_base/declare",
		
		//"dojo",
		//"dijit",
		'dojo/topic',
		
		'dojo/text!./templates/privchat.html?' + cacheString,
		
		'lwidgets',
		'lwidgets/Chat',
		
		//extras
		
		
	],
	function(declare,
		//dojo, dijit,
		topic, template, lwidgets, Chat ){
	return declare( [ Chat ], {

	'templateString' : template,	

	'saystring':'SAYPRIVATE',
	'name' : "",
	
	'postCreate2':function()
	{
		this.addSubscription( this.subscribe('Lobby/chat/user/playermessage', 'playerMessage' ) );
	},
	
	
	//override
	'sendMessage':function(msg)
	{
		var smsg;
		
		if( this.users[this.name] )
		{
			this.inherited(arguments);
			return;
		}
		
		smsg = 'SAYPRIVATE Nightwatch !pm ' + this.name + ' ' + msg;
		topic.publish( 'Lobby/notidle', {} );
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
		
		msg = '<span style="color:' + this.settings.settings.chatNickColor + '" class="chatNick">'
			+ dojox.html.entities.encode('<' + this.nick + '>')
			+ '</span> '
			+ msg
		
		this.addLine( msg, 'chatMine', 'Offline' );
		
	},
	
	
	'blank':null
}); }); //declare lwidgets.Privchat



