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
		//stupid hax
		dojo.connect(this.mainContainer, 'onMouseDown', this, this.resizeAlready)
		this.addSubscription( dojo.subscribe('Lobby/chat/user/playermessage', this, 'playerMessage' ) );
	},
	
	'blank':null
}); }); //declare lwidgets.Privchat



