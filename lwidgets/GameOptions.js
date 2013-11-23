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
	
	title: 'Game Options',
	path: 'game/modoptions/',

	getCacheKey: function()
	{
		return this.path + this.getBattleRoom().game;
	},
	
	getUnitsync: function()
	{
		return this.battleRoom.getUnitsync();
	},
	
	getOptionCount: function()
	{
		return this.getUnitsync().getModOptionCount();
	},
	
	addArchive: function()
	{
		var unitsync;
		var archive;
		unitsync = this.getUnitsync();
		
		unitsync.removeAllArchives();
		archive = unitsync.getPrimaryModArchive(this.gameIndex);
		unitsync.addAllArchives(archive);
	},
	
	setScriptTag: function( optionKey, value )
	{
		this.battleRoom.setScriptTag( 'game/modoptions/' + optionKey, value );
	},
	
	getBattleRoom: function()
	{
		return this.battleRoom;
	},

	blank: null
}); }); //declare lwidgets.GameOptions



