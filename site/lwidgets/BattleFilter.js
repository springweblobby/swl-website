///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/BattleFilter',
	[
		"dojo/_base/declare",
		
		"dojo/topic",
		'dojo/text!./templates/battlefilter.html?' + cacheString,
		'dojo/dom-style',
		'dojo/_base/array',
		
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
		topic, template,
		domStyle,
		array,
		WidgetBase, Templated, WidgetsInTemplate ){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	
	'templateString' : template,
	'postCreate':function()
	{
	},
	
	'isCountableField':function(fieldName)
	{
		return array.indexOf( ['players', 'spectators', 'max_players'], fieldName ) !== -1;
	},
	'isBooleanField':function(fieldName)
	{
		return array.indexOf( ['passworded', 'locked', 'progress'], fieldName ) !== -1;
	},
	'updateFilterName':function(val)
	{
		this.comparator.removeOption(this.comparator.getOptions());
		domStyle.set( this.filterValueSpan, 'display', 'inline' )
		if( this.isCountableField( val ) )
		{
			this.comparator.addOption({ 'value':'>=', 'label':'at least' })
			this.comparator.addOption({ 'value':'<=', 'label':'at most' })
		}
		else if( this.isBooleanField( val ) )
		{
			this.comparator.addOption({ 'value':'true', 'label':'Yes' })
			this.comparator.addOption({ 'value':'false', 'label':'No' })
			domStyle.set( this.filterValueSpan, 'display', 'none' )
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

