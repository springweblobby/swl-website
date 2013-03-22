///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
'lwidgets/Juggler',
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
		'dojo/on',
		
		//extra
		'dojox/html/entities',
		
		"dijit/form/Button",
		"dijit/form/Select",
		"dijit/form/CheckBox",
		
	],
	function(declare, dojo, dijit, topic,
	
	array, domConstruct, domStyle, domAttr, lang, on
	
	){
	return declare([ ], {

	'state':null,
	'config':null,
	
	
	'constructor':function(/* Object */args){
		
		dojo.safeMixin(this, args);
		
		//this.subscribe('Lobby/juggler/showDialog', 'showDialog' );
		topic.subscribe('Lobby/juggler/showDialog', lang.hitch(this, 'showDialog' ) );
		
		
	}, //constructor
	
	'sendConfig':function()
	{
		var smsg;
		smsg = 'SAYPRIVATE Nightwatch !JSON JugglerConfig ' + JSON.stringify(this.config);
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
	},
	
	'getConfigIndex':function(mode)
	{
		var configIndex;
		configIndex = 0;
		this.config.Preferences
		dojo.some(this.config.Preferences, dojo.hitch(this, function(mode, item, i){
			if( item.Mode === mode )
			{
				configIndex = i;
			}
			return ( item.Mode === mode );
		}, mode));
		return configIndex;
	},
	
	'showDialog':function()
	{
		var dlg, mainDiv, curDiv, doneButton, selects, activeCheck;
		var modeNames;
		var label;
		
		//if( typeof (this.config) === 'null' ) //will be fixed in ES6
		if( this.config === null || this.state === null )
		{
			alert( 'Quickmatch server data is not available yet. Please try again in a few moments.' );
			return;
		}
		
		mainDiv = domConstruct.create('div', {'style':{'minWidth':'300px' }} );
		
		curDiv = domConstruct.create( 'div', { 'style':{'padding':'5px'} }, mainDiv);
		
		label = domConstruct.create( 'label', { 'innerHTML': ' <b>Enable Quick Matching</b>'}, curDiv );
		activeCheck = new dijit.form.CheckBox({
			'checked':this.config.Active,
			'onChange':dojo.hitch(this, function(value)
			{
				this.config.Active = value;
				this.sendConfig();
			})
		}).placeAt(label, 'first')
				
		modeNames = {
			2:	'Planetwars',
			3:	'1v1',
			4:	'FFA (free for all)',
			5:	'Cooperative (vs AI)',
			6:	'Teams',
			7:	'Small teams',
			8:	'Newbies only',
			9:	'Experienced only',
		};
		
		selects = [];
		//dojo.forEach(this.config.Preferences, dojo.hitch(this, function(item, i){
		dojo.forEach(this.state.ModeCounts, dojo.hitch(this, function(item, i){
			var mode, preference, configIndex, curMatchers, curPlayers, options;
			var modeName,
			mode = item.Mode;
			modeName = mode in modeNames ? modeNames[mode] : 'Unknown Mode';
			
			if( modeName !== 'Unknown Mode')
			{
				//preference = item.Preference;
				configIndex = this.getConfigIndex(mode)
				preference = this.config.Preferences[configIndex].Preference + '';
				
				curMatchers = item.Count;
				curPlayers = item.Playing;
				/*
				options = [
					{'value':'Never', 	'label':'Never (0)'},
					{'value':'Ok', 		'label':'Okay (+1)'},
					{'value':'Like',	'label':'Like (+2)'},
					{'value':'Best', 	'label':'Best (+3)'}
				];
				*/
				options = [
					{'value':'-2', 	'label':'Never'},
					{'value':'-1', 	'label':'Okay'},
					{'value':'0',	'label':'Like'},
					{'value':'1', 	'label':'Best'}
				];
				
				curDiv = domConstruct.create( 'div', {'style':{'position':'relative', 'height':'30px'}}, mainDiv);
				
				domConstruct.create( 'div', {'innerHTML': modeName + ' (' + curMatchers + ' + ' + curPlayers + ')', 'style':{'position':'absolute', } }, curDiv);
				
				selects.push( new dijit.form.Select({
					//'style':{'width':'100px' },
					'options':options,
					'value':preference,
					'onChange':dojo.hitch(this, function(value){
						this.config.Preferences[configIndex].Preference = parseInt(value);
						this.sendConfig();
					}),
					'style':{'width':'100px','position':'absolute', 'right':'0px'}
				}).placeAt(curDiv) );
				
				//domConstruct.create('span', {'innerHTML': ' (' + curMatchers + ' + ' + curPlayers + ')'}, curDiv );
			}
		}));
		
		curDiv = domConstruct.create( 'div', { 'innerHTML': '<b>Total Players: ' + this.state.TotalPlayers +'</b>', 'style':{ 'padding':'5px' } }, mainDiv);
		
		doneButton = new dijit.form.Button({
			'label':'Done',
			'onClick':function(){ dlg.hide() }
		}).placeAt(mainDiv)
		
		dlg = new dijit.Dialog({
			'title': 'Quick Match',
			'content':mainDiv,
			//'onClose': dojo.hitch(this, function(){
			'onHide': dojo.hitch(this, function(){
				
			})
		});
		dlg.startup();
		dlg.show();

	}, //showDialog
	
	'blank':null
}); }); //declare 


