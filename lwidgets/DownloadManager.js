///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

/*

pr-downloader --filesystem-writepath "user\Documents\My Games\Spring\" --download-engine 92.0

*/


define(
	'lwidgets/DownloadManager',
	[
		"dojo/_base/declare",
				
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		'dijit/form/Button',
		'dijit/ProgressBar',
		'dijit/Dialog',
		
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		
		'dojo/text!./templates/downloadmanager.html?' + cacheString,
		
		// *** extras ***
		'dojo/text',
		
		'dijit/form/TextBox',
		'dijit/form/Select',
		
	],
	function(declare,
			
			array, domConstruct, domStyle, domAttr, lang, topic,
			Button,
			ProgressBar,
			Dialog,
			WidgetBase, Templated, WidgetsInTemplate,
			template
	){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	
	settings: null,
	appletHandler: null,
	battleId: 0,
	bars: null,
	barDivs: null,
	barBytes: null,
	processes: null,
	barControls: null,
	
	templateString: template,
	
	postCreate: function()
	{
		this.bars = {};
		this.barControls = {};
		this.barDivs = {};
		this.barBytes = {};
		this.barTitles = {};
		this.processes = {};
		
		//div1 = domConstruct.create('div', {});
		//domConstruct.create('span', {'innerHTML':'Note: Downloads currently only work on Windows and Mac.', 'style':{'color':'red'} }, div1 );
		//this.domNode = div1;
		
		this.subscribe('Lobby/commandStream', 'commandStream');

		dropDownDontStealFocus(this.rapidTypeSelect);
	},
	
	downloadEngine: function( version )
	{
		var processName;
		
		processName = 'Downloading Engine ' + version;
		if( !( processName in this.processes ) )
		{
			//alert2('Downloading Spring version ' + version + '...' );
			
			this.processes[processName] = true;
			
			this.appletHandler.runCommand(processName,[
				this.appletHandler.springHome + '/weblobby/pr-downloader/pr-downloader' + (this.os === 'Windows' ? ".exe" : ""),
				'--filesystem-writepath',
				this.appletHandler.springHome + '/weblobby',
				'--download-engine',
				version
			]);
			
			
			this.addBar(processName)
		}
		
		
	},
	
	downloadPackage: function( packageType, packageName )
	{
		var processName;
		if( packageName === '' )
		{
			return '';
		}
		/*
		if( this.os !== 'Windows' )
		{
			return '';
		}
		*/
		if( packageType === 'map' )
		{
			processName = 'Downloading Map ' + packageName
		}
		else if( packageType === 'game' )
		{
			processName = 'Downloading Game ' + packageName
		}
		
		if( !this.processes[processName] )
		{
			this.processes[processName] = true;
			if( packageType === 'map' || packageType === 'game' )
			{
				//console.log('>>>> testing', packageType, packageName)
            // In Windows on user accounts with non-ASCII names, pr-downloader defaults to
            // c:\My games\Spring instead of Documents\My games\Spring
            // We fix this by specifying --filesystem-writepath.
				this.appletHandler.runCommand(processName,[
					this.appletHandler.springHome + '/weblobby/pr-downloader/pr-downloader' + (this.os === 'Windows' ? ".exe" : ""),
                    "--filesystem-writepath", this.appletHandler.springHome,
					(packageType === 'game' ? '--download-game' : '--download-map' ),
					'' + packageName
				]);
			}
			this.addBar(processName)
		}
		return processName;
	},
	
	commandStream: function(data)
	{
		var processName, line, perc, bytes, title;
		processName = data.cmdName;
		line = data.line;
		if( (processName !== 'exit' && !this.barControls[processName]) ||
			(processName === 'exit' && !this.barControls[line]) )
		{
			return;
		}
		
		// [Progress] 69% [==================== ] 5129808/7391361
		perc = line.match(/\[Progress\]\s*(\d*)%/);
		if( perc !== null && perc[1] !== null )
		{
			perc = parseInt( perc[1] );
			this.barControls[processName].bar.update( {progress: perc } );
			
			bytes = line.match( /\[Progress\].*\/(\d*)\s*$/ );
			if( bytes !== null && bytes[1] !== null )
			{
				bytes = addCommas( bytes[1] );
				domAttr.set( this.barControls[processName].bytes, 'innerHTML', ' ('+ bytes +' bytes)' );
			}
			
			topic.publish( 'Lobby/download/processProgress', {processName: processName, perc: perc } );
		}
		if( line.match(/^\[Info\] download complete/) ||
			line.match(/^\[Info\] Download complete!/) || //engine download
			processName === 'exit'
		)
		{
			if( processName === 'exit' )
				processName = line;
			this.barControls[processName].bar.set( {indeterminate: false } );
			if( processName in this.processes )
			{
				this.barControls[processName].bar.update( {progress: 100 } );
				if( processName.match(/^Downloading Engine/) )
				{
					this.appletHandler.refreshUnitsync( processName.replace(/^Downloading Engine /, '') );
				}
				else
				{
					this.appletHandler.refreshUnitsync();
				}
			}
			domConstruct.destroy( this.barControls[processName].spinner );
		}
		
	},
	
	addBar: function(title)
	{
		var barDiv, titleSpan, killButton;
		barDiv = domConstruct.create('div', {style: {position: 'relative', height: '35px', marginRight: '16em' } }, this.domNode );

		killButton = new Button({
			label: 'Cancel Download',
			iconClass: 'smallIcon closeImage',
			showLabel: false,
			style: {
				position: 'absolute'
			}
		}).placeAt(barDiv);
		this.barControls[title] = {};
		
		this.barControls[title].bar = new ProgressBar({
			style: {
				position: 'absolute',
				left: '40px',
				width: '250px'
			},
			maximum: 100,
			indeterminate: false
		}).placeAt(barDiv);
		
		titleSpan = domConstruct.create('span', {innerHTML: ' ' + title, style: {position: 'absolute', left: '310px', right: '3px' } }, barDiv );
		
		this.barControls[title].title = titleSpan;
		this.barControls[title].bytes = domConstruct.create('span', {}, titleSpan);
		
		this.barControls[title].spinner = domConstruct.create('img', {src: 'img/bluespinner.gif'} );
		domConstruct.place( this.barControls[title].spinner, titleSpan, 'first' )
		
		this.barControls[title].div = barDiv;
		
		killButton.set( 'onClick', lang.hitch( this, function(killButton, title ){
			this.appletHandler.killCommand( title );
			killButton.set('disabled', true);
			delete this.processes[title];
			domStyle.set( this.barControls[title].div, 'color', 'red' );
			domConstruct.destroy( this.barControls[title].spinner );
		}, killButton, title ) );

	},
	
	
	downloadDialog: function()
	{
		this.manualDownloadDialog.show();	
	},
	
	download: function()
	{
		var rapidType;
		var rapidName;
		rapidType = this.rapidTypeSelect.get('value')
		rapidName = this.rapidDownloadName.get('value')
		if( rapidType === 'engine' )
		{
			this.downloadEngine( rapidName )
		}
		if( rapidType === 'game' || rapidType === 'map' )
		{
			this.downloadPackage( rapidType, rapidName )
		}
		
	},
	
	blank: null
}); });//declare lwidgets.ChatManager



