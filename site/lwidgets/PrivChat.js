///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/PrivChat',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		
		'dojo/text!./templates/privchat.html?' + cacheString,
		
		'lwidgets',
		'lwidgets/Chat',
		
		//extras
		
		
	],
	function(declare, dojo, dijit, template, lwidgets, Chat ){
	return declare( [ Chat ], {

	'templateString' : template,	

	'saystring':'SAYPRIVATE',
	'name' : "",
	
	'postCreate2':function()
	{
		this.addSubscription( dojo.subscribe('Lobby/chat/user/playermessage', this, 'playerMessage' ) );
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
		dojo.publish( 'Lobby/notidle', [{}] );
		dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
		
		msg = '<span style="color:' + this.settings.settings.chatNickColor + '" class="chatNick">'
			+ dojox.html.entities.encode('<' + this.nick + '>')
			+ '</span> '
			+ msg
		
		this.addLine( msg, 'chatMine', 'Offline' );
		
	},
	
	
	'blank':null
}); }); //declare lwidgets.Privchat



