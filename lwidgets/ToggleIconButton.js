///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/ToggleIconButton',
	[
		"dojo/_base/declare",
		//"dojo",
		//"dijit",
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		
		'dijit/form/Button',
		
		'dijit/_WidgetBase',
	],
	function(declare,
		//dojo, dijit,
		array, domConstruct, domStyle, domAttr, lang,
		Button,
		WidgetBase ){
	return declare( [ WidgetBase ], {
	
	button: null,
	checked: false,
	
	buildRendering: function()
	{
		//this.domNode = domConstruct.create('div', {'style':this.style});
		this.domNode = domConstruct.create('span', {style: this.style});
		if(typeof this.checkedLabel === 'undefined')
		{
			this.checkedLabel = '';
		}
		if(typeof this.uncheckedLabel === 'undefined')
		{
			this.uncheckedLabel = this.checkedLabel;
		}
		this.button = new Button({
			label: (this.checked ? this.checkedLabel : this.uncheckedLabel ),
			showLabel: false,
			iconClass: (this.checked ? this.checkedIconClass : this.uncheckedIconClass ),
			//'style':{'height':'100%','width':'100%'},
			style: this.style,
			onClick: lang.hitch(this, function(){
				this.setChecked(!this.checked)
				this.onClick(this.checked);
			} )
		}).placeAt(this.domNode);
		
	}, //buildrendering
	
	setChecked: function(val)
	{
		this.checked = val;
		this.button.set('label', (val ? this.checkedLabel : this.uncheckedLabel ) );
		this.button.set('iconClass', (val ? this.checkedIconClass : this.uncheckedIconClass ) );
	},
	
	onClick: function(checked)
	{
		
	},
	
	blank: null
	
}); });//define lwidgets/ToggleIconButton

