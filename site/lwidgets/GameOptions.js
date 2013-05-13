///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/GameOptions',
	[
		"dojo/_base/declare",
		
		'dojo/topic',
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',

		"lwidgets/ModOptions",
		
	],
	function(declare,
		topic, array, domConstruct, domStyle, domAttr, lang,
		
		ModOptions
	){
	return declare([ ModOptions ], {
	
	title:'Game Options',
	path:'game/modoptions/',
	
	getUnitsync:function()
	{
		return this.battleRoom.getUnitsync();
	},
	
	getOptionCount:function()
	{
		return this.getUnitsync().getModOptionCount();
	},
	
	addArchive:function()
	{
		var unitsync;
		unitsync = this.getUnitsync();
		
		unitsync.removeAllArchives();
		archive = unitsync.getPrimaryModArchive(this.gameIndex);
		unitsync.addAllArchives(archive);
	},
	
	setScriptTag:function( optionKey, value )
	{
		this.battleRoom.setScriptTag( 'game/modoptions/' + optionKey, value );
	},
	
	isSpads:function() 		{ return this.battleRoom.spads; },
	isHosting:function() 	{ return this.battleRoom.hosting; },
	isLocal:function() 		{ return this.battleRoom.local; },
	
	'blank':null
}); }); //declare lwidgets.GameOptions



