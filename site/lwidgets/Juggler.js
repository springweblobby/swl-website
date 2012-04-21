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
		
		//extra
		'dojox/html/entities',
		
		"dijit/form/Button",
		"dijit/form/Select",
		"dijit/form/CheckBox",
		
	],
	function(declare, dojo, dijit, topic ){
	return declare([ ], {

	'state':null,
	'config':null,
	
	
	'constructor':function(/* Object */args){
		
		dojo.safeMixin(this, args);
		
		dojo.subscribe('Lobby/juggler/showDialog', this, 'showDialog' );
		
		
	}, //constructor
	
	'sendConfig':function()
	{
		var smsg;
		smsg = 'SAYPRIVATE Nightwatch !JSON JugglerConfig ' + JSON.stringify(this.config);
		dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
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
		
		//if( typeof (this.config) === 'null' ) //will be fixed in ES6
		if( this.config === null || this.state === null )
		{
			alert( 'Quickmatch server data is not available yet. Please try again in a few moments.' );
			return;
		}
		
		mainDiv = dojo.create('div', {'style':{'minWidth':'200px' }} );
		curDiv = dojo.create( 'div', { 'innerHTML': '<b>Total Players: ' + this.state.TotalPlayers +'</b>'}, mainDiv);
		
		curDiv = dojo.create( 'div', { 'innerHTML': 'Active: '}, mainDiv);
		activeCheck = new dijit.form.CheckBox({
			'checked':this.config.Active,
			'onChange':dojo.hitch(this, function(value)
			{
				this.config.Active = value;
				this.sendConfig();
			})
		}).placeAt(curDiv)
				
		
		selects = [];
		//dojo.forEach(this.config.Preferences, dojo.hitch(this, function(item, i){
		dojo.forEach(this.state.ModeCounts, dojo.hitch(this, function(item, i){
			var mode, preference, configIndex, curMatchers, options;
			mode = item.Mode;
			//preference = item.Preference;
			configIndex = this.getConfigIndex(mode)
			preference = this.config.Preferences[configIndex].Preference;
			
			curMatchers = item.Count;
			
			
			options = [
				{'value':'Never', 	'label':'Never (0)'},
				{'value':'Ok', 		'label':'Okay (+1)'},
				{'value':'Like',	'label':'Like (+2)'},
				{'value':'Best', 	'label':'Best (+3)'}
			];
			
			curDiv = dojo.create( 'div', {'innerHTML': mode + ' '}, mainDiv);
			selects.push( new dijit.form.Select({
				'style':{'width':'100px' },
				'options':options,
				'value':preference,
				'onChange':dojo.hitch(this, function(value){
					this.config.Preferences[configIndex].Preference = value;
					this.sendConfig();
				})
			}).placeAt(curDiv) );
			
			dojo.create('span', {'innerHTML': ' (' + curMatchers + ')'}, curDiv );
			
		}));
		
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


