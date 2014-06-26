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
	
	templateString : template,
	name: null,
	
	postCreate: function()
	{
		if( this.fieldName !== null )
		{
			this.fieldNameSelect.set( 'value', this.fieldName );
			this.updateFilterName( this.fieldName );
			this.comparatorSelect.set( 'value', this.comparator );
			this.filterValueText.set( 'value', this.filterValue );
		}

		dropDownDontStealFocus(this.fieldNameSelect);
		dropDownDontStealFocus(this.comparatorSelect);
	},
	
	isCountableField: function(fieldName)
	{
		return array.indexOf( ['players', 'spectators', 'max_players'], fieldName ) !== -1;
	},
	isBooleanField: function(fieldName)
	{
		return array.indexOf( ['passworded', 'locked', 'progress'], fieldName ) !== -1;
	},
	updateFilterName: function(val)
	{
		this.comparatorSelect.removeOption(this.comparatorSelect.getOptions());
		domStyle.set( this.filterValueSpan, 'display', 'inline' )
		if( this.isCountableField( val ) )
		{
			this.comparatorSelect.addOption({ value: '>=', label: 'at least' })
			this.comparatorSelect.addOption({ value: '<=', label: 'at most' })
		}
		else if( this.isBooleanField( val ) )
		{
			this.comparatorSelect.addOption({ value: 'true', label: 'Yes' })
			this.comparatorSelect.addOption({ value: 'false', label: 'No' })
			this.comparatorSelect.set( 'value', 'false' );
			domStyle.set( this.filterValueSpan, 'display', 'none' )
		}
		else
		{
			this.comparatorSelect.addOption({ value: '*=', label: 'contains' })
			this.comparatorSelect.addOption({ value: '=', label: 'is' })
		}
		this.updateFilter();	
	},
	get2: function(field)
	{
		if(field === 'fieldName')
		{
			return this.fieldNameSelect.value;
			//return this.fieldNameSelect.get('value');
		}
		if(field === 'comparator')
		{
			return this.comparatorSelect.value;
		}
		if(field === 'filterValue')
		{
			return this.filterValueText.displayedValue;
		}
		
		return {
			fieldName: this.get2('fieldName'),
			comparator: this.get2('comparator'),
			filterValue: this.get2('filterValue'),
		};
		
	},
	updateFilter: function()
	{
		topic.publish( 'Lobby/battles/updatefilters', {} );
	},
	killFilter: function()
	{
		//defined in battlemanager
	},
	
	blank: null
}); });//declare BattleFilter

