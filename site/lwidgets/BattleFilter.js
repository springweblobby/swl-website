///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/BattleFilter',
	[
		"dojo/_base/declare",
		
		//"dojo",
		//"dijit",
		"dojo/topic",
		'dojo/text!./templates/battlefilter.html?' + cacheString,
		
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		//extras
		
		'dijit/form/Select',
		'dijit/form/Button',
		'dijit/form/TextBox',
		
		
		
	],
	function(declare,
		//dojo, dijit,
		topic, template, WidgetBase, Templated, WidgetsInTemplate ){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	
	'templateString' : template,
	'postCreate':function()
	{
	},
	
	'isCountableField':function(fieldName)
	{
		return fieldName in {'players':1, 'spectators':1, 'max_players':1 };
	},
	'updateFilterName':function(val)
	{
		this.comparator.removeOption(this.comparator.getOptions());
		if( this.isCountableField( val ) )
		{
			this.comparator.addOption({ 'value':'>=', 'label':'at least' })
			this.comparator.addOption({ 'value':'<=', 'label':'at most' })
		}
		else
		{
			this.comparator.addOption({ 'value':'*=', 'label':'contains' })
			this.comparator.addOption({ 'value':'=', 'label':'is' })
		}
		this.updateFilter();	
	},
	'updateFilter':function()
	{
		topic.publish( 'Lobby/battles/updatefilters', {} );
	},
	'killFilter':function()
	{
		//defined in battlemanager
	},
	
	'blank':null
}); });//declare BattleFilter

