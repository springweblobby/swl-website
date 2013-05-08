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

		"dijit/form/TextBox",
		"dijit/form/Button",
		"dijit/form/Select",
		"dijit/form/ToggleButton",
		"dijit/form/HorizontalSlider",
		"dijit/form/HorizontalRule",
		"dijit/form/HorizontalRuleLabels",
		"dijit/layout/TabContainer",
		"dijit/layout/ContentPane",
		"dijit/Dialog",
		"dijit/Tooltip",
		
		"lwidgets/ModOptions",
		
	],
	function(declare,
		topic, array, domConstruct, domStyle, domAttr, lang,
		TextBox,
		Button,
		Select,
		ToggleButton,
		HorizontalSlider,
		HorizontalRule,
		HorizontalRuleLabels,
		TabContainer,
		ContentPane,
		Dialog,
		Tooltip,
		ModOptions
	){
	return declare([ ModOptions ], {
	
	mapIndex:-1,
	title:'Game Options',
	
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
	isSpads:function()
	{
		return this.battleMap.battleRoom.spads;
	},
	
	'blank':null
}); }); //declare lwidgets.MapOptions



