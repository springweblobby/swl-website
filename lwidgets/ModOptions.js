///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/ModOptions',
	[
		"dojo/_base/declare",
		
		'dojo/topic',
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/Deferred',
		'dojo/promise/all',

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
		
	],
	function(declare,
		topic, array, domConstruct, domStyle, domAttr, lang, Deferred, all,
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
		Tooltip
	){
	return declare([ ], {

	gameIndex: null,
	options: null,
	sections: null,
	
	loadedPromise: null,
	
	divChanges: null,
	
	curChanges: null,
	changes: null,
	changeDivs: null,
	
	battleRoom: null,
	
	
	//'buildRendering':function()
	constructor: function(/* Object */args){
		var handle, optionCount, i,j, optionKey,
			loadedDeferred,
			section,
			options,
			sections,
			option,
			optionName,optionType,optionDesc,optionDefault,
			optionTypes
			;

		declare.safeMixin(this, args);
		
		loadedDeferred = new Deferred();
		this.loadedPromise = loadedDeferred.promise;

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
		
		options = sections = null;

		if( this.getCacheKey() !== "")
		{
			sections = JSON.parse( localStorage.getItem(this.getCacheKey() + '/sections') );
			options = {};
			for( i in sections )
			{
				declare.safeMixin(options, sections[i].options);
			}
		}

		if( options === null || sections === null )
		{
			options = {};
			sections = {};

			var processOption = lang.hitch(this, function(opt){
				var after;
				if( opt.type === 'number' )
				{
					after = all({
						min: this.getUnitsync().getOptionNumberMin(opt.idx).then(this.fixBadNumber),
						max: this.getUnitsync().getOptionNumberMax(opt.idx).then(this.fixBadNumber),
						step: this.getUnitsync().getOptionNumberStep(opt.idx).then(this.fixBadNumber),
					}).then(function(obj){
						lang.mixin(opt, obj);
					});
				}
				else if( opt.type === 'list' )
				{
					opt.items = {};
					after = this.getUnitsync().getOptionListCount(opt.idx).then(lang.hitch(this, function(count){
						var end;
						for(var i = 0; i < count; i++)
						{
							end = all({
								key: this.getUnitsync().getOptionListItemKey(opt.idx, i),
								name: this.getUnitsync().getOptionListItemName(opt.idx, i),
								desc: this.getUnitsync().getOptionListItemDesc(opt.idx, i)
							}).then(function(obj){
								opt.items[obj.key] = obj;
							});
						}
						return end;
					}));
				}
				else
				{
					delete opt.idx;
					sections[opt.section].options[opt.key] = opt;
					options[opt.key] = opt;
					return;
				}
				return after.then(function(){
					delete opt.idx;
					sections[opt.section].options[opt.key] = opt;
					options[opt.key] = opt;
				});
			});

			this.getOptionCount().then(lang.hitch(this, function(optionCount){
				var end;
				for( var i = 0; i < optionCount; i++ )
				{
					end = all({
						key: this.getUnitsync().getOptionKey(i),
						section: this.getUnitsync().getOptionSection(i),
						type: this.getUnitsync().getOptionType(i),
						name: this.getUnitsync().getOptionName(i),
						desc: this.getUnitsync().getOptionDesc(i)
					}).then(lang.hitch(this, lang.partial(function(i, opt){
						opt.idx = i;
						opt.type = optionTypes[opt.type];
						if( opt.type === 'section' )
						{
							if( typeof sections[opt.key] === 'undefined' )
								sections[opt.key] = { options: {} };
							sections[opt.key].name = opt.name;
						}
						else
						{
							if( typeof sections[opt.section] === 'undefined' )
								sections[opt.section] = { name: 'No Category', options: {} };

							return this.getDefaultValue(opt.type, i).then(function(def){
								opt['default'] = opt.value = def;
								return processOption(opt);
							});
						}
					}, i)));
				}
				return end;
			})).then(lang.hitch(this, function(){
				if( this.getCacheKey() !== "" )
				{
					localStorage.setItem(this.getCacheKey() + '/sections', JSON.stringify(sections));
				}
				loadedDeferred.resolve();
			}));
		}
		else
		{
			loadedDeferred.resolve();
		}
		
		this.options = options;
		this.sections = sections;
		
		this.subscriptions = [];
		
		if( !this.isHosting() )
		{
			handle = topic.subscribe('Lobby/modoptions/updatemodoption', lang.hitch(this, 'updateModOption' ) );
			this.subscriptions.push(handle);
		}
		
		this.loaded = true;
		
	}, //constructor

	getCacheKey: function()
	{
		return "";
	},
	
	destroy: function()
	{
		array.forEach(this.subscriptions, function(subscription){
			subscription.remove(); //not working!
		});
	},
	
	
	springieValue: function(value)
	{
		if( typeof value === 'boolean' )
		{
			return value ? 1 : 0;
		}
		return value;
	},
	
	showDialog: function()
	{
		var dlg, mainDiv, tc, cp, mainContentPane, applyButton;
		
		mainDiv = domConstruct.create('div', {} );
		
		applyButton = new Button({
			label: 'Apply Settings',
			onClick: lang.hitch(this, function(){
				var smsg, curValue, optionKey, changes ;
				dlg.hide();
				this.showingDialog = false;
				changes = [];
				
				if( !this.isHosting() )
				{
					if( this.isSpads() )
					{
						for( optionKey in this.curChanges ) { if( this.curChanges.hasOwnProperty(optionKey) )
						{
							curValue = this.curChanges[optionKey];
							smsg = 'SAYBATTLE !bset ' + optionKey + ' ' + this.springieValue(curValue);
							topic.publish( 'Lobby/rawmsg', {msg: smsg } );
						}}
					}
					else
					{
						smsg = 'SAYBATTLE !setoptions ';
						for( optionKey in this.curChanges ) { if( this.curChanges.hasOwnProperty(optionKey) )
						{
							curValue = this.curChanges[optionKey];
							changes.push( optionKey + '=' + this.springieValue(curValue) );
						}}
						smsg += changes.join(',');
						topic.publish( 'Lobby/rawmsg', {msg: smsg } );
					}
				}
				else
				{
					for( optionKey in this.curChanges ) { if( this.curChanges.hasOwnProperty(optionKey) )
					{
						curValue = this.curChanges[optionKey];
						this.setScriptTag( optionKey, curValue );
						
						changes.push( this.path + optionKey + '=' + curValue );
					}}
					if( !this.isLocal() )
					{
						smsg = 'SETSCRIPTTAGS ';
						smsg += changes.join('\t');
						topic.publish( 'Lobby/rawmsg', {msg: smsg } );
					}
					
				}
				
				this.curChanges = {};
			})
		}).placeAt(mainDiv);
		
		
		
		mainContentPane = new ContentPane({
			title: 'm',
			style: {width: '600px', height: '400px'}
		}).placeAt(mainDiv);
		
		tc = new TabContainer( {
            style: {width: '100%', height: '100%'},
			tabPosition: 'left-h',
			useSlider: true
        }).placeAt(mainContentPane.domNode);
		
		this.divChanges = domConstruct.create( 'div', {} );
		cp = new ContentPane({
			title: '<b>Non Default Settings</b>',
			content: this.divChanges
		});
		tc.addChild( cp );
		
		for(section in this.sections)
		{
			cp = new ContentPane({
				title: this.sections[section].name,
				content: this.makeSectionOptions( this.sections[section].options )
			});
			tc.addChild( cp );
		}
		
		//this.tabCont = tc;
		//this.tabCont.startup();
		//this.tabCont.resize();
		
		
		dlg = new Dialog({
			title: this.title,
			content: mainDiv,
			//'onClose': lang.hitch(this, function(){
			onHide: lang.hitch(this, function(){
				this.curChanges = {};	
			})
		});
		dlg.startup();
		dlg.show();
	}, //showDialog
	
	
	
	updateModOption: function( data )
	{
		var option = this.options[ data.key ];
		if( typeof option === 'undefined' )
		{
			console.log('Mod Option Error #2!' )
			console.log( JSON.stringify(data) )
			//console.log( this.options )
		}
		
		if( data.value === null )
		{
			data.value = data['default'];
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
	
	getDefaultValue: function( optionType, i )
	{
		if( optionType === 'bool' )
		{
			return this.getUnitsync().getOptionBoolDef(i).then(function(n){
				return n === 1;
			});
		}
		else if( optionType === 'number' )
		{
			return this.getUnitsync().getOptionNumberDef(i).then(this.fixBadNumber);
		}
		else if( optionType === 'list' )
		{
			return this.getUnitsync().getOptionListDef(i);
		}
	},
	
	fixBadNumber: function(number)
	{
		number *= 1000;
		number = Math.round(number);
		number /= 1000;
		return number;
	},
	
	makeSectionOptions: function( options )
	{
		var option, content, curOptionControl,
			slider,
			rowDiv, nameDiv, controlDiv,
			discreteValues,
			listOptions,
			itemKey, item,
			desc
			;
		
		content = domConstruct.create( 'div', { style: {width: '100%',height: '380px', overflow: 'auto' } } )
		
		
		for( optionKey in options )
		{
			option = options[optionKey];
			if( option.type === 'bool' )
			{
				rowDiv = domConstruct.create('div', {style: {height: '40px', width: '200px', position: 'relative'  } }, content );
				curOptionControl = new ToggleButton({
					label: option.name,
					
					title: option.desc,
					
					name: optionKey,
					iconClass: 'dijitCheckBoxIcon',
					checked: option.value,
					onChange: lang.hitch(this, function(option, value){
						this.curChanges[option.key] = value; //don't use optionKey here unless added to hitch
						this.updateChanges( option );
					}, option)
				}).placeAt(rowDiv)
			}
			if( option.type === 'list' )
			{
				rowDiv = domConstruct.create('div', {style: {height: '40px', width: '200px', position: 'relative'  } }, content );
				nameDiv = domConstruct.create('div', {innerHTML: option.name, style: {position: 'absolute' } }, rowDiv );
				
				desc = option.desc + '<br /><ul>';
				
				listOptions = []
				
				//array.forEach( option.items, function(item){
				for( itemKey in option.items )
				{
					item = option.items[itemKey];
					listOptions.push({ value: item.key, label: item.name })
					desc += '<li><b>' + item.name + '</b>: ' + item.desc + '</li>';
				}
				desc += '</ul>';
				
				curOptionControl = new Select({
					name: optionKey,
					value: option.value,
					style: {position: 'absolute', left: '160px', width: '150px'},
					options: listOptions,
					onChange: lang.hitch(this, function(option, value){
						this.curChanges[option.key] = value;
						this.updateChanges( option );
					}, option)
				}).placeAt(rowDiv)
				dropDownDontStealFocus(curOptionControl);
				
				var temp = new Tooltip({
					connectId: [curOptionControl.domNode],
					label: desc
				});
				
			}
			if( option.type === 'number' )
			{
				rowDiv = domConstruct.create('div', {style: {height: '40px', width: '200px', position: 'relative'  } }, content );
				nameDiv = domConstruct.create('div', {innerHTML: option.name, style: {position: 'absolute' } }, rowDiv );
				//controlDiv = domConstruct.create('div', { }, rowDiv );
				
				curOptionControl = new TextBox({
					name: option.key,
					value: option.value,
					style: {position: 'absolute', left: '160px', width: '50px'},
					disabled: true
				}).placeAt(rowDiv)
				
				discreteValues = Math.round((option.max - option.min) / option.step) + 1;
				
				var rulesNode = domConstruct.create("div", {}, rowDiv);
				/*
				var sliderRules = new dijit .form.HorizontalRule({
					'container':'topDecoration',
					'count':2,
					'style': "width: 5px;"
				}).placeAt(rulesNode)
				
				var labelsNode = domConstruct.create("div", {}, rowDiv);
				*/
				
				/*
				//this one causes crash
				var sliderLabels = new dijit .form.HorizontalRuleLabels({
					'container':'bottomDecoration',
					 labelStyle: "font-style: italic; font-size: 0.75em"
				}).placeAt(labelsNode)
				*/
				
				slider = new HorizontalSlider({
					name: optionKey + '_slider',
					
					title: option.desc,
					
					
					value: option.value,
					minimum: option.min,
					maximum: option.max,
					intermediateChanges: false,
					discreteValues: discreteValues,
					
					style: {position: 'absolute', left: '220px',width: '140px'},
					
					onChange: lang.hitch(this, function(option, curOptionControl, value){
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
	
	updateChanges: function( option )
	{
		var change, divChange, value;
		
		value = option.value;
		
		if( typeof this.curChanges[option.key] !== 'undefined' )
		{
			value = this.curChanges[option.key];
		}
		
		change = value !== option['default'];
		domConstruct.destroy( this.changeDivs[option.key] )
		
		if( change )
		{
			if( option.type === 'bool' )
			{
				divChange = domConstruct.create('div', {
					innerHTML: option.name + ': <b>' + (value ? 'Enabled' : 'Disabled') + '</b>'
				}, this.divChanges )
			}
			else if( option.type === 'number' )
			{
				divChange = domConstruct.create('div', {
					innerHTML: option.name + ': <b>' + value + '</b>'
				}, this.divChanges )
			}
			else if( option.type === 'list' )
			{
				divChange = domConstruct.create('div', {
					innerHTML: option.name + ': <b>' + option.items[ value ].name + '</b>'
				}, this.divChanges )
			}
			this.changeDivs[option.key] = divChange;
		}
		
	},
	
	isSpads: function() 		{ return this.getBattleRoom().spads; },
	isHosting: function() 	{ return this.getBattleRoom().hosting; },
	isLocal: function() 		{ return this.getBattleRoom().local; },
	
	blank: null
}); }); //declare lwidgets.ModOptions



