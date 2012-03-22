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
	'addedBytes':null,
	'processes':null,
	
	'buildRendering':function()
	{
		var div1;
		this.bars = {};
		this.barDivs = {};
		this.barTitles = {};
		this.addedBytes = {};
		this.processes = {};
		
		div1 = dojo.create('div', {});
		dojo.create('span', {'innerHTML':'Note: Downloads currently only work on Windows.', 'style':{'color':'red'} }, div1 );
		this.domNode = div1;
		
		dojo.subscribe('Lobby/downloader/downloadMap', this, 'downloadMap' );
		dojo.subscribe('Lobby/commandStream', this, 'commandStream');
	},
	
	'postCreate' : function()
	{
		
		//dojo.subscribe('Lobby/chat/addprivchat', this, 'addChat' );
		this.appletHandler.downloadDownloader();
		
		//this.addBar('test1');
	},
	
	'downloadMap':function(data)
	{
		this.downloadPackage('map', data.map );
	},
	
	'downloadPackage':function( packageType, packageName )
	{
		var processName;
		if( !this.processes[packageName] )
		{
			this.processes[packageName] = true;
			if( packageType === 'map' )
			{
				processName = 'Download Map ' + packageName
				this.addBar(processName)
				
				this.appletHandler.runCommand(processName, [
					'cd "%USERPROFILE%\\My Documents\\My Games\\Spring\\pr-downloader"',
					'pr-downloader.exe --download-map "' + packageName + '"'
				]);
			}
		}
	},
	
	'commandStream':function(data)
	{
		var processName, line, perc, bytes, title;
		processName = data.cmdName
		if( !this.bars[processName] )
		{
			return;
		}
		line = data.line;
		
		// [Progress] 69% [==================== ] 5129808/7391361
		perc = line.match(/\[Progress\]\s*(\d*)%/);
		if( perc !== null && perc[1] !== null )
		{
			perc = parseInt( perc[1] );
			if( perc === 100 )
			{
				//refresh unitsync
				this.appletHandler.refreshUnitsync();
			}
			this.bars[processName].update( {'progress': perc } );
			
			if( !this.addedBytes[processName] && perc === 0 )
			{
				bytes = line.match(/(\d*)\s*$/);
				if( bytes !== null && bytes[1] !== null )
				{
					this.addedBytes[processName] = true;
					//bytes = parseInt( bytes[1] );
					bytes = addCommas( bytes[1] );
					title = dojo.attr( this.barTitles[processName], 'innerHTML' );
					dojo.attr( this.barTitles[processName], 'innerHTML', title + ' ('+ bytes +' bytes)' );
				}
			}
			
		}
		
		
	},
	
	'addBar':function(title)
	{
		var barDiv, titleSpan;
		barDiv = dojo.create('div', {'style':{'position':'relative', 'height':'30px' } }, this.domNode );
		
		
		this.bars[title] = new dijit.ProgressBar({
			'style':{
				'position':'absolute',
				'left':'3px',
				'width':'300px'
			},
			'maximum':100
		}).placeAt(barDiv);
		
		titleSpan = dojo.create('span', {'innerHTML':title , 'style':{'position':'absolute', 'left':'310px', 'right':'3px' } }, barDiv );
		
		this.barTitles[title] = titleSpan;
		
		this.barDivs[title] = barDiv;
	},
	
	'blank':null
}); });//declare lwidgets.ChatManager



