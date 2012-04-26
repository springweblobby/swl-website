///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/DownloadManager',
	[
		"dojo/_base/declare",
		"dojo",
		"dijit",
		'dijit/_WidgetBase',
		// *** extras ***
		'dojo/text', //for dojo.cache
		'dijit/Dialog',
		'dijit/form/Button',
		'dijit/ProgressBar',
	],
	function(declare,
			dojo, dijit,
			WidgetBase
	){
	return declare( [ WidgetBase  ], {
	
	'settings':null,
	'appletHandler':null,
	'battleId':0,
	'bars':null,
	'barDivs':null,
	'barBytes':null,
	'processes':null,
	'barControls':null,
	
	'buildRendering':function()
	{
		var div1;
		this.bars = {};
		this.barControls = {};
		this.barDivs = {};
		this.barBytes = {};
		this.barTitles = {};
		this.processes = {};
		
		div1 = dojo.create('div', {});
		dojo.create('span', {'innerHTML':'Note: Downloads currently only work on Windows.', 'style':{'color':'red'} }, div1 );
		this.domNode = div1;
		
		dojo.subscribe('Lobby/commandStream', this, 'commandStream');
	},
	
	'postCreate' : function()
	{
		this.appletHandler.downloadDownloader();
		
		//this.addBar('test1');
	},
	
	'setOs':function()
	{
		this.appletHandler.setOs()
	},
	
	'downloadPackage':function( packageType, packageName )
	{
		var processName;
		if( packageType === 'map' )
		{
			processName = 'Download Map ' + packageName
		}
		else if( packageType === 'game' )
		{
			processName = 'Download Game ' + packageName
		}
		
		if( !this.processes[processName] )
		{
			this.processes[processName] = true;
			if( packageType === 'map' || packageType === 'game' )
			{	
				this.appletHandler.runCommand(processName,[
					'pr-downloader.exe',
					 (packageType === 'game' ? '--download-game' : '--download-map' ),
					 '' + packageName
				]);
				
			}
			this.addBar(processName)
		}
		return processName;
	},
	
	'commandStream':function(data)
	{
		var processName, line, perc, bytes, title;
		processName = data.cmdName
		if( !this.barControls[processName] )
		{
			return;
		}
		line = data.line;
		
		// [Progress] 69% [==================== ] 5129808/7391361
		perc = line.match(/\[Progress\]\s*(\d*)%/);
		if( perc !== null && perc[1] !== null )
		{
			perc = parseInt( perc[1] );
			this.barControls[processName].bar.update( {'progress': perc } );
			
			bytes = line.match( /\[Progress\].*\/(\d*)\s*$/ );
			if( bytes !== null && bytes[1] !== null )
			{
				bytes = addCommas( bytes[1] );
				dojo.attr( this.barControls[processName].bytes, 'innerHTML', ' ('+ bytes +' bytes)' );
			}
			
			dojo.publish( 'Lobby/download/processProgress', [{'processName':processName, 'perc':perc }] );
		}
		if( line === '[Info] download complete' )
		{
			this.appletHandler.refreshUnitsync();
			dojo.attr( this.barControls[processName].spinner, 'src', '' );
			//dojo.publish( 'Lobby/download/processProgress', [{'processName':processName, 'perc':perc, 'complete':true }] );
		}
		
	},
	
	'getGameIndex':function( gameName )
	{
		var gameIndex;
		gameIndex = parseInt( this.appletHandler.getUnitsync().getPrimaryModIndex( gameName ) );
		/** /
		echo('Got game?')
		echo(gameName)
		echo(gameIndex)
		/**/
		if( gameIndex === -1 || isNaN(gameIndex) )
		{
			gameIndex = false;
		}
		return gameIndex;
	},
	'getMapChecksum':function( mapName )
	{
		var mapChecksum;
		mapChecksum = parseInt(  this.appletHandler.getUnitsync().getMapChecksumFromName( mapName ) );
		/** /
		echo('Got map?')
		echo(mapName)
		echo(mapChecksum)
		/**/
		if( mapChecksum === 0 || isNaN(mapChecksum) )
		{
			mapChecksum = false;
		}
		return mapChecksum;
	},
	
	
	'addBar':function(title)
	{
		var barDiv, titleSpan, killButton;
		barDiv = dojo.create('div', {'style':{'position':'relative', 'height':'30px' } }, this.domNode );

		killButton = new dijit.form.Button({
			'label':'Cancel Download',
			'iconClass':'smallIcon closeImage',
			'showLabel':false,
			'style':{
				'position':'absolute'
			}
		}).placeAt(barDiv);
		this.barControls[title] = {};
		
		//this.bars[title] = new dijit.ProgressBar({
		this.barControls[title].bar = new dijit.ProgressBar({
			'style':{
				'position':'absolute',
				'left':'40px',
				'width':'250px'
			},
			'maximum':100
		}).placeAt(barDiv);
		
		titleSpan = dojo.create('span', {'innerHTML':title, 'style':{'position':'absolute', 'left':'310px', 'right':'3px' } }, barDiv );
		
		this.barControls[title].title = titleSpan;
		this.barControls[title].bytes = dojo.create('span', {}, titleSpan);
		
		this.barControls[title].spinner = dojo.create('img', {'src':'img/greenspinner.gif'} );
		dojo.place( this.barControls[title].spinner, titleSpan, 'first' )
		
		this.barControls[title].div = barDiv;
		
		killButton.set( 'onClick', dojo.hitch( this, function(killButton, title ){
			this.appletHandler.killCommand( title );
			killButton.set('disabled', true);
			this.processes[title] = null;
			delete this.processes[title];
			dojo.style( this.barControls[title].div, 'color', 'red' );
			dojo.attr( this.barControls[title].spinner, 'src', '' );
		}, killButton, title ) );

	},
	
	'blank':null
}); });//declare lwidgets.ChatManager



