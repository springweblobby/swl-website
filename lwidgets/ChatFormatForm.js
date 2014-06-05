///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/ChatFormatForm',
	[
		"dojo/_base/declare",
		
		'dojo/topic',
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
        
		'lwidgets/User',
		
		'dojo/text!./templates/gamebots.html?' + cacheString,
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		
		"dijit/TooltipDialog",
		"dijit/form/Button",
		"dijit/form/DropDownButton",
		"dijit/form/TextBox",
		"dijit/form/ToggleButton",
		"dijit/ColorPalette",
		"dijit/Dialog",
		
		//extra
		'dojox/html/entities',
		
		
	],
	function(declare,
		topic,
		array, domConstruct, domStyle, domAttr, lang,
		User,
		
		template,
		WidgetBase, Templated, WidgetsInTemplate,
		
		TooltipDialog,
		
		Button,
		DropDownButton,
		TextBox,
		ToggleButton,
		ColorPalette,
		Dialog
		){
	return declare([ WidgetBase ], {

	//templateString : template,
	
	
	buildRendering: function(){
		var mainDiv
		
		
		mainDiv = domConstruct.create('div' );
		
		
		domConstruct.create('h3', {'innerHTML':'Color'}, mainDiv);
		this.fcp = new ColorPalette({
			palette: "3x4",
		}).placeAt(mainDiv);
		
		domConstruct.create( 'hr', {}, mainDiv )
		
		
		domConstruct.create('h3', {'innerHTML':'Background'}, mainDiv);
		
		domConstruct.create( 'label', {}, mainDiv )
		this.useBcp = new ToggleButton({
			label:'Use'
		}).placeAt(mainDiv);
		domConstruct.create( 'br', {}, mainDiv )
		
		this.bcp = new ColorPalette({
			palette: "3x4",
		}).placeAt(mainDiv);
		
		domConstruct.create( 'hr', {}, mainDiv )
		
		
		var button = new Button({
			label:'Apply',
			type:'submit',
			onClick:lang.hitch(this, 'applyClick')
		}).placeAt(mainDiv)
		
		
		this.domNode = mainDiv
		
	}, //buildRendering
	
	applyClick:function()
	{
		//echo( this.fcp.get('value') )
		var foreColor, backColor
		var colArr
		
		colArr = {
			'#ffffff':0,
			'#000000':1,	
			'#000080':2,
			'#008000':3,
			'#ff0000':4,
			//brown,
			'#800080':6, //purple
			//orange,
			'#ffff00':8,
			'#00ff00':9,
			//teal
			//lightcyan
			'#0000ff':12, //blue
			'#ff00ff':13, //pink
			'#808080':14, //gray
			'#c0c0c0':15, //lightgray
		}
		
		foreColor = this.fcp.get('value')
		foreColor = (foreColor in colArr ? colArr[foreColor] : 1 )
		
		
		backColor = this.bcp.get('value');
		backColor = (backColor in colArr ? colArr[backColor] : 1 )
		
		if( !this.useBcp.get('checked') )
		{
			backColor = '';
		}
		
		//echo ( 'colors?', 'color', this.fcp.get('value'), this.bcp.get('value') )
		//echo ( 'colors2?', 'color', foreColor, backColor )
		this.onsubmit( 'color', foreColor, backColor )
	},
	onsubmit:function(a,b,c)
	{		
	},
	
}); }); //declare lwidgets.GameBots



