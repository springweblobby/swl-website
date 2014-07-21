///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/SpringSettings',
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
		"dijit/form/ValidationTextBox",
		"dijit/form/CheckBox",
		"dijit/form/Button",
		"dijit/form/Select",
		"dijit/form/ToggleButton",
		"dijit/Dialog",
		"dijit/Tooltip",
		
	],
	function(declare,
		topic, array, domConstruct, domStyle, domAttr, lang,
		Deferred, all,
		TextBox,
		ValidationTextBox,
		CheckBox,
		Button,
		Select,
		ToggleButton,
		Dialog,
		Tooltip
	){
	return declare([ ], {

	options: null,
	optionsLoaded: null,
	version: 0,
	appletHandler: null,
	subscription: null,
	
	constructor: function(args)
	{
		declare.safeMixin(this, args);
		
		options = {};
		this.optionsLoaded = new Deferred;
		this.subscription = topic.subscribe('Lobby/commandStream', lang.hitch(this, 'commandStream'));
		var exec = this.appletHandler.getEngineExec(this.version)
		this.optionsJson = '';
		this.commandName = 'spring_settings_' + this.version;
		this.appletHandler.runCommand(this.commandName, [exec, '--list-config-vars']); },

	commandStream: function(data)
	{
		if( data.cmdName === this.commandName )
		{
			if( data.line.match(/Using configuration source/) === null )
				this.optionsJson += data.line;
		}
		else if( data.cmdName === 'exit' && data.line === this.commandName )
		{
			this.options = JSON.parse(this.optionsJson);
			this.subscription.remove();
			this.optionsLoaded.resolve();
		}
	},
		
	showDialog: function()
	{
		return this.optionsLoaded.then(lang.hitch(this, function(){
			return this.makeOptions();
		})).then(lang.hitch(this, function(content){
			var dlg = new Dialog({
				title: 'Engine Options (' + this.version + ')',
				content: content,
				style: {width: '500px'}
			});
			dlg.startup();
			dlg.show();
		}));
	}, //showDialog
	
	makeOptions: function( )
	{
		var unitsync = this.appletHandler.getUnitsync(this.version);
		var content = domConstruct.create( 'div', { style: {width: '100%',height: '380px', overflow: 'auto' } } )
		var values = {};
		for( var optionKey in this.options )
		{
			var option = this.options[optionKey];

			if( option.type === 'std::string' )
				values[optionKey] = unitsync.getSpringConfigString(optionKey, option.defaultValue);
			else if( option.type === 'bool' || option.type === 'int' || option.type === 'unsigned' )
				values[optionKey] = unitsync.getSpringConfigInt(optionKey, option.defaultValue);
			else if( option.type === 'float' )
				values[optionKey] = unitsync.getSpringConfigFloat(optionKey, option.defaultValue);
		}

		return all(values).then(lang.hitch(this, function(values){
			for(var key in values)
			{
				var option = this.options[key];
				var rowDiv = domConstruct.create('div', { class: 'engineOption' }, content );
				var titleDiv = domConstruct.create('div', { class: 'optionTitle' }, rowDiv );
				domConstruct.create('p', { class: 'optionName', innerHTML: key }, titleDiv );
				if( option.description )
					domConstruct.create('p', { class: 'optionDesc', innerHTML: option.description }, titleDiv );
				var control;
				if( option.type === 'bool' )
				{
					control = new CheckBox({
						name: key,
						checked: values[key] === 1 ? true : false,
						class: 'optionControl',
						onChange: function(val){
							unitsync.setSpringConfigInt(this.name, val ? 1 : 0);
						}
					}).placeAt(rowDiv);
				}
				else
				{
					var regexp, setFunc;
					if( option.type === 'std::string' )
					{
						regexp = '.*';
						setFunc = unitsync.setSpringConfigString;
					}
					else if( option.type === 'int' || option.type === 'unsigned' )
					{
						regexp = '-?[0-9]+';
						setFunc = unitsync.setSpringConfigInt;
					}
					else if( option.type === 'float' )
					{
						regexp = '-?[0-9]+(\\.[0-9]+)?([eE][0-9]+)?';
						setFunc = unitsync.setSpringConfigFloat;
					}
					control = new ValidationTextBox({
						name: key,
						value: values[key],
						pattern: regexp,
						intermediateChanges: true,
						class: 'optionControl',
						onChange: function(val){
							if( val.match('^' + this.pattern + '$') !== null )
								setFunc(this.name, val);
						}
					}).placeAt(rowDiv);
				}

				if( option.readOnly == 1 )
					control.set('disabled', true);
			}

			return content;
		}));
	},
	
}); }); //declare lwidgets.SpringSettings
