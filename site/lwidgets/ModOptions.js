///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/ModOptions',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		'dojo/topic',
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',

		
		//extra
		
		"dijit/form/TextBox",
		"dijit/form/ToggleButton",
		"dijit/form/HorizontalSlider",
		"dijit/layout/TabContainer",
		"dijit/layout/ContentPane",
		
		
		
		
		
		
	],
	function(declare, dojo, dijit, topic, array, domConstruct, domStyle, domAttr, lang ){
	return declare([ ], {

	'appletHandler': null, 
	'gameIndex': null,
	'options':null,
	'sections':null,
	
	//'tabCont':null,
	
	'divChanges':null,
	
	'curChanges':null,
	'changes':null,
	'changeDivs':null,
	
	'battleRoom':null,
	
	'hosting':false,
	
	//'buildRendering':function()
	'constructor':function(/* Object */args){
		var handle, archive, optionCount, i,j, optionKey,
			section,
			option,
			optionName,optionType,optionDesc,optionDefault,
			optionTypes
			;
		
		dojo.safeMixin(this, args);
		
		this.hosting = this.battleRoom.hosting; //after safeMixin
		
		optionTypes = [
			'',
			'bool',
			'list',
			'number',
			'',
			'section',
		]
		this.changeDivs = {}
		this.curChanges = {}
		
		this.battleRoom.getUnitsync().removeAllArchives();
		archive = this.battleRoom.getUnitsync().getPrimaryModArchive(this.gameIndex);
		this.battleRoom.getUnitsync().addAllArchives(archive);
		
		//echo('******* <ModOptions> add archive ' + this.gameIndex);
		
		var temp = '';
		
		sections = {};
		options = {};
		
		optionCount = this.battleRoom.getUnitsync().getModOptionCount();
		
		for( i=0; i< optionCount; i++ )
		{
			optionKey = this.battleRoom.getUnitsync().getOptionKey(i);
			section = this.battleRoom.getUnitsync().getOptionSection(i);
			
			optionType = optionTypes[ this.battleRoom.getUnitsync().getOptionType(i) ];
			optionName = this.battleRoom.getUnitsync().getOptionName(i);
			optionDesc = this.battleRoom.getUnitsync().getOptionDesc(i);
			
			
			if( optionType !== 'section' )
			{
				if( section === '' )
				{
					section = 'No Category';
				}
				
				if( typeof sections[section] === 'undefined' )
				{
					sections[section] = {
						'name':'No Category',
						'options':{}
					};
				}
				
				optionDefault = this.getDefaultValue( optionType, i )
				
				option = {
					'key':optionKey,
					'section':section,
					'name':optionName,
					'type':optionType,
					'desc':optionDesc,
					'default':optionDefault,
					'value':optionDefault
				};
				if( optionType === 'number' )
				{
					option.min = this.battleRoom.getUnitsync().getOptionNumberMin(i);
					option.max = this.battleRoom.getUnitsync().getOptionNumberMax(i);
					option.step = this.battleRoom.getUnitsync().getOptionNumberStep(i);
					
					option.min = this.fixBadNumber(option.min);
					option.max = this.fixBadNumber(option.max);
					option.step = this.fixBadNumber(option.step);
				}
				else if( optionType === 'list' )
				{
					var listCount = this.battleRoom.getUnitsync().getOptionListCount(i);
					option.items = {}
					for( j=0; j< listCount; j++ )
					{
						var listItemKey = this.battleRoom.getUnitsync().getOptionListItemKey(i, j);
						var listItemName = this.battleRoom.getUnitsync().getOptionListItemName(i, j);
						var listItemDesc = this.battleRoom.getUnitsync().getOptionListItemDesc(i, j);
						
						//option.items.push({
						option.items[listItemKey] = {
							'key': listItemKey,
							'name': listItemName,
							'desc': listItemDesc
						};
					}
				}
				
				sections[section].options[optionKey] = option;
				options[optionKey] = option;
			}
			else
			{
				if( typeof sections[optionKey] === 'undefined' )
				{
					sections[optionKey] = {
						'options':{}
					};
				}
				
				sections[optionKey].name = optionName;
			}
		}
		
		this.options = options;
		this.sections = sections;
		
		this.subscriptions = [];
		
		if( !this.hosting )
		{
			handle = this.subscribe('Lobby/modoptions/updatemodoption', 'updateModOption' );
			this.subscriptions.push(handle);
		}
		
		this.loaded = true;
		
	}, //constructor
	
	'destroy':function()
	{
		array.forEach(this.subscriptions, function(subscription){
			subscription.remove(); //not working!
		});
	},
	
	
	'springieValue':function(value)
	{
		if( typeof value == 'boolean' )
		{
			return value ? 1 : 0;
		}
		return value;
	},
	
	'showDialog':function()
	{
		var dlg, mainDiv, tc, cp, mainContentPane, applyButton;
		
		mainDiv = domConstruct.create('div', {} );
		
		applyButton = new dijit.form.Button({
			'label':'Apply Settings',
			'onClick':lang.hitch(this, function(){
				var smsg, curValue, optionKey, changes ;
				dlg.hide();
				this.showingDialog = false;
					
				if( !this.hosting )
				{
					changes = [];
					
					smsg = 'SAYBATTLE !setoptions ';
					for( optionKey in this.curChanges ) { if( this.curChanges.hasOwnProperty(optionKey) )
					{
						curValue = this.curChanges[optionKey];
						changes.push( optionKey + '=' + this.springieValue(curValue) );
					}}
					smsg += changes.join(',');
					topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
				}
				else
				{
					for( optionKey in this.curChanges ) { if( this.curChanges.hasOwnProperty(optionKey) )
					{
						curValue = this.curChanges[optionKey];
						//this.updateModOption({'key':optionKey, 'value':curValue})
						this.battleRoom.setScriptTag( 'game/modoptions/' + optionKey, curValue );
					}}
					
				}
				
				this.curChanges = {};
			})
		}).placeAt(mainDiv);
		
		
		
		mainContentPane = new dijit.layout.ContentPane({
			'title': 'm',
			'style': {"width": '600px', 'height':'400px'}
		}).placeAt(mainDiv);
		
		tc = new dijit.layout.TabContainer( {
            'style': {"width": '100%', 'height':'100%'},
			'tabPosition':'left-h',
			'useSlider':true
        }).placeAt(mainContentPane.domNode);
		
		this.divChanges = domConstruct.create( 'div', {} );
		cp = new dijit.layout.ContentPane({
			'title': '<b>Non Default Settings</b>',
			'content': this.divChanges
		});
		tc.addChild( cp );
		
		for(section in this.sections)
		{
			cp = new dijit.layout.ContentPane({
				'title': this.sections[section].name,
				'content': this.makeSectionOptions( this.sections[section].options )
			});
			tc.addChild( cp );
		}
		
		//this.tabCont = tc;
		//this.tabCont.startup();
		//this.tabCont.resize();
		
		
		dlg = new dijit.Dialog({
			'title': 'Game Options',
			'content':mainDiv,
			//'onClose': lang.hitch(this, function(){
			'onHide': lang.hitch(this, function(){
				this.curChanges = {};	
			})
		});
		dlg.startup();
		dlg.show();
	}, //showDialog
	
	'updateModOption':function( data )
	{
		var option = this.options[ data.key ];
		if( typeof option === 'undefined' )
		{
			console.log('Mod Option Error #2!' )
			console.log( data )
		}
		
		if( data.value === null )
		{
			data.value = data.default;
		}
		if( option.type === 'bool' )
		{
			if( data.value === '0' )
			{
				data.value = false;
			}
			data.value = !!data.value;
		}
		else if( option.type === 'number' )
		{
			data.value = parseInt( data.value );
		}
		
		this.options[ data.key ].value = data.value;
		this.updateChanges( option );
	},
	
	'getDefaultValue':function( optionType, i )
	{
		var def;
		def = '';
		if( optionType === 'bool' )
		{
			def = this.battleRoom.getUnitsync().getOptionBoolDef(i) === 1;
		}
		else if( optionType === 'number' )
		{
			def = this.battleRoom.getUnitsync().getOptionNumberDef(i);
			def = this.fixBadNumber(def);
		}
		else if( optionType === 'list' )
		{
			def = this.battleRoom.getUnitsync().getOptionListDef(i);
		}
		
		return def;
	},
	
	'fixBadNumber':function(number)
	{
		number *= 1000;
		number = Math.round(number);
		number /= 1000;
		return number;
	},
	
	'makeSectionOptions':function( options )
	{
		var option, content, curOptionControl,
			slider,
			rowDiv, nameDiv, controlDiv,
			discreteValues,
			listOptions,
			itemKey, item,
			desc
			;
		
		content = domConstruct.create( 'div', { 'style':{'width':'100%','height':'380px', 'overflow':'auto' } } )
		
		
		for( optionKey in options )
		{
			option = options[optionKey];
			if( option.type === 'bool' )
			{
				rowDiv = domConstruct.create('div', {'style':{'height':'40px', 'width':'200px', 'position':'relative'  } }, content );
				curOptionControl = new dijit.form.ToggleButton({
					'label': option.name,
					
					'title':option.desc,
					
					'name': optionKey,
					'iconClass': 'dijitCheckBoxIcon',
					'checked': option.value,
					'onChange': lang.hitch(this, function(option, value){
						this.curChanges[option.key] = value; //don't use optionKey here unless added to hitch
						this.updateChanges( option );
					}, option)
				}).placeAt(rowDiv)
			}
			if( option.type === 'list' )
			{
				rowDiv = domConstruct.create('div', {'style':{'height':'40px', 'width':'200px', 'position':'relative'  } }, content );
				nameDiv = domConstruct.create('div', {'innerHTML': option.name, 'style':{'position':'absolute' } }, rowDiv );
				
				desc = option.desc + '<br /><ul>';
				
				listOptions = []
				
				//array.forEach( option.items, function(item){
				for( itemKey in option.items )
				{
					item = option.items[itemKey];
					listOptions.push({ 'value':item.key, 'label':item.name })
					desc += '<li><b>' + item.name + '</b>: ' + item.desc + '</li>';
				}
				desc += '</ul>';
				
				curOptionControl = new dijit.form.Select({
					'name': optionKey,
					'value':option.value,
					'style':{'position':'absolute', 'left':'160px', 'width':'150px'},
					'options': listOptions,
					'onChange': lang.hitch(this, function(option, value){
						this.curChanges[option.key] = value;
						this.updateChanges( option );
					}, option)
				}).placeAt(rowDiv)
				
				var temp = new dijit.Tooltip({
					'connectId':[curOptionControl.domNode],
					'label':desc
				});
				
			}
			if( option.type === 'number' )
			{
				rowDiv = domConstruct.create('div', {'style':{'height':'40px', 'width':'200px', 'position':'relative'  } }, content );
				nameDiv = domConstruct.create('div', {'innerHTML': option.name, 'style':{'position':'absolute' } }, rowDiv );
				//controlDiv = domConstruct.create('div', { }, rowDiv );
				
				curOptionControl = new dijit.form.TextBox({
					'name': option.key,
					'value':option.value,
					'style':{'position':'absolute', 'left':'160px', 'width':'50px'},
					'disabled':true
				}).placeAt(rowDiv)
				
				discreteValues = Math.round((option.max - option.min) / option.step) + 1;
				
				var rulesNode = domConstruct.create("div", {}, rowDiv);
				/*
				var sliderRules = new dijit.form.HorizontalRule({
					'container':'topDecoration',
					'count':2,
					'style': "width: 5px;"
				}).placeAt(rulesNode)
				
				var labelsNode = domConstruct.create("div", {}, rowDiv);
				*/
				
				/*
				//this one causes crash
				var sliderLabels = new dijit.form.HorizontalRuleLabels({
					'container':'bottomDecoration',
					 labelStyle: "font-style: italic; font-size: 0.75em"
				}).placeAt(labelsNode)
				*/
				
				slider = new dijit.form.HorizontalSlider({
					'name': optionKey + '_slider',
					
					'title':option.desc,
					
					
					'value': option.value,
					'minimum': option.min,
					'maximum': option.max,
					'intermediateChanges': false,
					'discreteValues':discreteValues,
					
					'style': {'position':'absolute', 'left':'220px','width':'140px'},
					
					'onChange': lang.hitch(this, function(option, curOptionControl, value){
						value = this.fixBadNumber(value);
						this.curChanges[option.key] = value;
						curOptionControl.set( 'value', value );
						this.updateChanges( option );
					}, option, curOptionControl)
					
				}).placeAt(rowDiv)
				
				//slider.startup()
				//sliderRules.startup();
				//sliderLabels.startup();
				
			}
			this.updateChanges( option );
		} //for( optionKey in options )
		return content;
	},
	
	'updateChanges':function( option )
	{
		var change, divChange, value;
		
		value = option.value;
		
		if( typeof this.curChanges[option.key] !== 'undefined' )
		{
			value = this.curChanges[option.key];
		}
		
		change = value !== option.default;
		domConstruct.destroy( this.changeDivs[option.key] )
		
		if( change )
		{
			if( option.type === 'bool' )
			{
				divChange = domConstruct.create('div', {
					'innerHTML': option.name + ': <b>' + (value ? 'Enabled' : 'Disabled') + '</b>'
				}, this.divChanges )
			}
			else if( option.type === 'number' )
			{
				divChange = domConstruct.create('div', {
					'innerHTML': option.name + ': <b>' + value + '</b>'
				}, this.divChanges )
			}
			else if( option.type === 'list' )
			{
				divChange = domConstruct.create('div', {
					'innerHTML': option.name + ': <b>' + option.items[ value ].name + '</b>'
				}, this.divChanges )
			}
			this.changeDivs[option.key] = divChange;
		}
		
	},
	
	
	'blank':null
}); }); //declare lwidgets.ModOptions



