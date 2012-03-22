///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/BattleFilter',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		//extras
		
		'dijit/form/Select',
		'dijit/form/Button',
		'dijit/form/TextBox',
		
		
		
	],
	function(declare, dojo, dijit, WidgetBase, Templated, WidgetsInTemplate ){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	
	'templateString' : dojo.cache("lwidgets", "templates/battlefilter.html?" + cacheString),
	'postCreate':function()
	{
	},
	'updateFilter':function()
	{
		dojo.publish( 'Lobby/battles/updatefilters', [{}] );
	},
	'killFilter':function()
	{
		//defined in battlemanager
	},
	
	'blank':null
}); });//declare BattleFilter

