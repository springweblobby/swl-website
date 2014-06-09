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
	
	title: 'Map Options',
	path: 'game/mapoptions/',
	
	getUnitsync: function()
	{
		return this.battleMap.battleRoom.getUnitsync();
	},
	
	getOptionCount: function()
	{
		return this.getUnitsync().getMapOptionCount(this.battleMap.map);
	},
	addArchive: function()
	{
		var unitsync;
		var archive;
		unitsync = this.getUnitsync();
		
		unitsync.removeAllArchives(); // FIXME
		var count = unitsync.getMapArchiveCount(this.battleMap.map);
		for( var i = 0; i < count; i++)
		{
			unitsync.addArchive(unitsync.getMapArchiveName(i));
		}
	},
	
	setScriptTag: function( optionKey, value )
	{
		this.battleMap.battleRoom.setScriptTag( 'game/mapoptions/' + optionKey, value );
	},
	
	getBattleRoom: function()
	{
		return this.battleMap.battleRoom;
	},

	getCacheKey: function()
	{
		return this.battleMap.map;
	},
		
	blank: null
}); }); //declare lwidgets.MapOptions



