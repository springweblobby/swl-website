///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/MapOptions',
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
	
	mapIndex:-1,
	title:'Map Options',
	path:'game/mapoptions/',
	
	getUnitsync:function()
	{
		return this.battleMap.battleRoom.getUnitsync();
	},
	
	getOptionCount:function()
	{
		return this.getUnitsync().getMapOptionCount(this.battleMap.map);
	},
	addArchive:function()
	{
		var unitsync;
		unitsync = this.getUnitsync();
		
		unitsync.removeAllArchives();
		archive = unitsync.getMapArchiveName(this.mapIndex);
		unitsync.addAllArchives(archive);
	},
	
	setScriptTag:function( optionKey, value )
	{
		this.battleMap.battleRoom.setScriptTag( 'game/mapoptions/' + optionKey, value );
	},

	isSpads:function() 		{ return this.battleMap.battleRoom.spads; },
	isHosting:function() 	{ return this.battleMap.battleRoom.hosting; },
	isLocal:function() 		{ return this.battleMap.battleRoom.local; },
		
	'blank':null
}); }); //declare lwidgets.MapOptions



