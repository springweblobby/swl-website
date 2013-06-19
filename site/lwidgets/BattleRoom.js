///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/BattleRoom',
	[
		"dojo/_base/declare",
		'dojo/text!./templates/battleroom.html?' + cacheString,
		'dojo/_base/array',

		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		'dojo/_base/event',
		'dojo/on',

		'lwidgets',
		'lwidgets/Chat',
		'lwidgets/GameOptions',
		'lwidgets/GameBots',
		'lwidgets/BattleMap',
		'lwidgets/BattlePlayerList',
		'lwidgets/ScriptManager',
		'lwidgets/ToggleIconButton',
		'lwidgets/ConfirmationDialog',
		
		'dijit/ColorPalette',
		'dijit/form/Button',
		'dijit/form/DropDownButton',
		'dijit/form/Select',
		'dijit/Dialog',
		'dijit/ProgressBar',
		'dijit/Tooltip',
		'dijit/TooltipDialog',
		
		
		'dijit/layout/TabContainer',
		
		//extras
		'dojo/dom', //needed for widget.placeAt to work now

		'dojox/encoding/base64',
		
		'dijit/layout/ContentPane',
		'dijit/form/TextBox',
		
		//'dijit/layout/TabController',
		
	],
	function(declare,
		template, array,
		domConstruct, domStyle, domAttr, lang, topic, event, on,
		lwidgets, Chat, GameOptions, GameBots, BattleMap, BattlePlayerList, ScriptManager, ToggleIconButton, ConfirmationDialog,
		ColorPalette,
		Button,
		DropDownButton,
		Select,
		Dialog,
		ProgressBar,
		Tooltip,
		TooltipDialog,
		TabContainer
	){
	return declare( [ Chat ], {

	templateString : template,

	parseOnLoad: false,
	
	chatType: 'battle',

	name: '',
	host: '',
	map: '',
	game: '',
	gameHash: '',
	mapHash: '',
	faction: 0,
	teamColor: '#000000',
	serverEngineVersion: 0,
	engine: 0,

	battleId: 0,

	specState: true,
	allianceId: 0,
	teamId: 0,
	runningGame: false,

	playerlistNode: null,
	players : null,
	ateams: null,
	ateamNumbers: null,
	battleListStore: null,		//mixed in

	bots: null,
	factions: null,

	appletHandler: null, //mixed in
	downloadManager: null, //mixed in

	synced: false,

	gotMap: false,
	gotGame: false,
	gotEngine: false,
	gameHashMismatch: false,
	showingDialog: false,

	recentAlert: false,
	gotStatuses: false,

	modOptions: null,
	gameBots: null,

	gameIndex: false,
	mapIndex: false,
	
	factionsLoaded: false,
	
	inBattle: false,

	loadedBattleData: false,

	gameDownloadProcessName: '',

	scriptPassword: '',

	aiNum: 0,
	playerNum: 0,
	startRects: null,

	playStateButton: null,

	extraScriptTags: null,
	
	sourcePort: 8300,
	/*
		return dsocket.getLocalPort(); 
		for client, you write that number in script.txt as SourcePort
		for host, it belong as HostPort
		
		and for client, ( HOSTPORT port ) is hostport
	*/
	
	gameWarningIcon: null,
	gameWarningIconDiv: null,
	
	gameSelect: null,
	
	scriptMissionScript: '',

	postCreate2: function()
	{
		this.commonSetup();
		
		
		this.postCreate3();
	}, //postcreate2
	
	postCreate3: function()
	{
	},
	
	sayYes: function() { },
	sayNo: function() {},
	
	
	getUnitsync: function()
	{
		if( this.engine === 0 )
		{
			console.log('Battleroom tried to get unitsync before engine was set. ', this.bname);
			return null;
		}
		return this.appletHandler.getUnitsync(this.engine);
	},
	
	setAlliance: function( allianceId )
	{
		var isSpec;
		isSpec = allianceId === 'S';
		allianceId = parseInt( allianceId );
		if( isNaN(allianceId) )
		{
			allianceId = 0;
		}
		this.playStateButton.setChecked( !isSpec );
		this.specState = isSpec;
		this.allianceId = allianceId;
		this.updatePlayState();
	},
	
	commonSetup: function()
	{
		var factionTooltip;

		this.factions = [];
		this.players = {};
		this.ateams = {};
		this.ateamNumbers = [];
		this.bots = {};

		this.startRects = {};
		this.extraScriptTags = {};

		factionTooltip = new Tooltip({
			connectId: [this.factionSelect.domNode],
			position: ['below'],
			label: 'Choose your faction.'
		});
		
		this.battleMap = new BattleMap({
			appletHandler: this.appletHandler,
			battleRoom: this
		}).placeAt(this.battleMapDiv);
		//this.playerListNode = new BattlePlayerList({}).placeAt(this.playerListDiv);
		this.playerListNode = new BattlePlayerList({
			nick: this.nick,
			style: {width: '100%', height: '100%', fontSize: 'small' },
			battleRoom: this
		});
		
		this.progressIconDiv = domConstruct.create('span', {style: { display: 'none', padding: '2px' }} );
		this.progressIcon = domConstruct.create('img', {
			src: 'img/blue_loader.gif',
			height: '16',
			title: 'Game is in progress.',
		}, this.progressIconDiv);
		

		//this.mainContainer.on( 'mouseup', this.battleMap, 'updateMapDiv' )

	},


	resizeAlready2: function()
	{
		//this.playerListNode.startup2();
		this.battleMap.updateMapDiv();
		this.playerListNode.resizeAlready();
	},
	startup2: function()
	{
		//sucky hax
		setTimeout( function(thisObj){ thisObj.resizeAlready(); }, 400, this );
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
			this.playerListNode.placeAt(this.playerListDiv)
			this.playerListNode.startup2();
		}
	},
	
	reloadUnitsync: function()
	{
		this.appletHandler.refreshUnitsync(this.engine);
	},


	makeBattle: function()
	{
		//topic.publish('Lobby/makebattle');
	},


	startGameClick: function()
	{
		if( !this.hosting && !this.players[this.host].isInGame )
		{
			alert2('The host hasn\'t started the game yet.');
			return;
		}
		this.startGame();
	},
	
	startGame: function()
	{
		var aiNum, name;
		var uriContent, newWindow;

		if( !this.hosting && !this.runningGame && !this.loadedBattleData )
		{
			return;
		}
		
		this.setSync();

		/*
		if( this.getUnitsync() === null )
		{
			if( !confirm( 'Your Spring path cannot be accessed so it is not known if you have the map and game for this battle. '+
				'You will have to open spring yourself using a downloaded script. '+
				'Start anyway?' )
			)
			{
				return;
			}
			uriContent = "data:application/x-spring-game," + encodeURIComponent( this.generateScript() );
			newWindow = window.open(uriContent, 'script.spg');
			return;
		}
		*/
		
		if( !this.syncCheckDialog( 'You cannot participate in the battle because you are missing content. It will be automatically downloaded.', true ) )
		{
			return;
		}

		//if( !this.hosting && !confirm('Game is in progress. Launch?\n ') )
		if( this.hosting )
		{
			this.touchTheClients()
			if( this.hostTabShowing === 'replayHostingTab' )
			{
				this.appletHandler.startSpringReplay( this.replaySelect.get('value'), this.engine );
			}
			else
			{
				this.appletHandler.startSpringScript( this.generateScript(), this.engine );
			}
			return;
		}
		var dlg;
		
		dlg = new ConfirmationDialog({
			msg: 'Game is in progress. Launch?',
			onConfirm: lang.hitch(this, function(accept)
			{
				if(accept)
				{
					this.appletHandler.startSpringScript( this.generateScript(), this.engine )
				}
				else
				{
					//nothing
				}
			})
		});

	},
	
	touchTheClients: function()
	{
		var user, i;
		
		if( this.natType !== '1' )
		{
			return;
		}
		
		for( i=1; i<=5; i++ )
		{
			for( name in this.players )
			{
				user = this.users[name];
				if( user && user.ip )
				{
					this.appletHandler.sendSomePacketToClient( user.ip, user.clientUdpSourcePort );
				}	
			}
		}
	},
	
	setTitle: function( title )
	{
		domAttr.set( this.titleText, 'innerHTML',
			'<b>' + title + '</b>'
			+ '<br />'
			+ '<a href="' + this.getGameDownloadUrl() + '" target="_blank" class="topicDiv"  >'
			+ this.game
			+ '</a> - '
			+ '<i>Engine version ' + this.engine + '</i>'
		);
		
		if( this.gameWarningIconDiv !== null ) //not used in single player
		{
			domConstruct.place( this.gameWarningIconDiv, this.titleText);
		}
		domConstruct.place( this.progressIconDiv, this.titleText);
	},
	
	extractEngineVersion: function(title)
	{
		var titleVersion;
		//this.engineVersion default
		var engineVersion = this.serverEngineVersion;
		
		titleVersion = title.match(/\(spring ([\d\.]*)\)/);
		
		if ( titleVersion !== null )
		{
			titleVersion = titleVersion[1];
			
			if ( parseFloat( titleVersion[1] ) !== 0 )
			{
				engineVersion = titleVersion;
			}
		}
		
		return engineVersion
	},
	
	joinBattle: function( data )
	{
	},
	

	unitsyncRefreshed: function(version)
	{
		if( version !== this.engine )
		{
			return;
		}
		this.setSync();
		this.updatePlayState();
		this.updateGameSelect();
	},
	
	updateGameSelect: function() 
	{
		var modName;
		var modShortName;
		var games;
		var modCount;
		var setFirst;
		var modInfoCount;
		var j;
		var infoKey;
		
		setFirst = true;
		if( this.gameSelect === null || this.getUnitsync() === null )
		{
			return
		}
		
		modCount = this.getUnitsync().getPrimaryModCount();
		games = [];
		modName = '';
		modShortName = '';
		for(i=0; i < modCount; i++)
		{
			modInfoCount = this.getUnitsync().getPrimaryModInfoCount( i );
			for( j=0; j<modInfoCount; j++ )
			{
				infoKey =  this.getUnitsync().getInfoKey( j );
				if(infoKey === 'shortname' )
				{
					modShortName = this.getUnitsync().getInfoValueString( j );
				}
				else if(infoKey === 'name' )
				{
					modName = this.getUnitsync().getInfoValueString( j );
				}
			}
			
			games.push( { label: modName, value: i+'' } )
			this.gameSelect.set( 'options', games )
			
			if(setFirst)
			{
				this.gameSelect.set( 'value', i+'' )
				setFirst = false;
			}
		}
	},
	
	getGameIndex: function()
	{
		var gameIndex;
		//console.log(this.getUnitsync())
		gameIndex = parseInt( this.getUnitsync().getPrimaryModIndex( this.game ) );
		//echo(' ========== Got game?', this.engine, this.game, gameIndex)
		if( typeof gameIndex === 'undefined' || gameIndex === -1 || isNaN(gameIndex) )
		{
			gameIndex = false;
		}
		return gameIndex;
	},
	getMapChecksum: function()
	{
		var mapChecksum;
		mapChecksum = parseInt(  this.getUnitsync().getMapChecksumFromName( this.map ) );
		//echo('========= Got map?', this.map, mapChecksum)
		if( mapChecksum === 0 || isNaN(mapChecksum) )
		{
			mapChecksum = false;
		}
		return mapChecksum;
	},
	
	setSync: function()
	{
	},
	
	focusDownloads: function(e)
	{
		event.stop(e);
		topic.publish('Lobby/focusDownloads' );
	},
	updateBar: function(data)
	{
		if( data.processName === this.gameDownloadProcessName )
		{
			this.gameDownloadBar.update( {progress: data.perc } );
			this.gameDownloadBar.set( {label: 'Game ' + data.perc + '%' } );
		}
		/*
		//update this when engine download can show progress
		else if( data.processName === 'Downloading Engine ' + this.engine )
		{
			this.engineDownloadBar.set( {'label': 'Engine Downloading' } );
		}
		*/
		
		//this.gameDownloadBar.update( {'progress':data.perc} );
		
	},
	showGameDownloadBar: function()
	{
		domStyle.set( this.gameDownloadBar.domNode, 'display', 'block');
	},
	hideGameDownloadBar: function()
	{
		this.gameDownloadProcessName = '';
		domStyle.set( this.gameDownloadBar.domNode, 'display', 'none');
	},
	showEngineDownloadBar: function()
	{
		domStyle.set( this.engineDownloadBar.domNode, 'display', 'block');
	},
	hideEngineDownloadBar: function()
	{
		this.gameDownloadProcessName = '';
		domStyle.set( this.engineDownloadBar.domNode, 'display', 'none');
	},
	/*
	'rgb565':function(pixel)
	{
		var red_mask, green_mask, blue_mask
		var red_value, green_value, blue_value
		var red, green, blue
		
		red_mask = parseInt( 'F800' , 16) ;
		green_mask = parseInt( '7E0' , 16) ;
		blue_mask = parseInt( '1F' , 16) ;
		
		red_value = (pixel & red_mask) >> 11;
		green_value = (pixel & green_mask) >> 5;
		blue_value = (pixel & blue_mask);

		// Expand to 8-bit values.
		red   = red_value << 3;
		green = green_value << 2;
		blue  = blue_value << 3;

		pixel = 0 * Math.pow(8,4)
			+ red * Math.pow(8,3)
			+ green * Math.pow(8,2)
			+ blue * Math.pow(8,1)
		
		return pixel;
	},
	*/
	_asLittleEndianHex: function(value, bytes) {
        // Convert value into little endian hex bytes
        // value - the number as a decimal integer (representing bytes)
        // bytes - the number of bytes that this value takes up in a string

        // Example:
        // _asLittleEndianHex(2835, 4)
        // > '\x13\x0b\x00\x00'

        var result = [];

        for (; bytes>0; bytes--) {
            result.push(String.fromCharCode(value & 255));
            value >>= 8;
        }

        return result.join('');
    },
	
    getFactionIcon: function(factionName)
	{
		var sidePath, fd, size, buff;
		sidepath = 'SidePics/' + factionName + '.png';
		//fd = this.getUnitsync().openFileVFS(sidepath);
		//if( !fd )
		{
			sidepath = 'SidePics/' + factionName + '.bmp';
			//sidepath = 'SidePics/' + factionName + '_16.png';
			fd = this.getUnitsync().openFileVFS(sidepath);
		}
		size = this.getUnitsync().fileSizeVFS(fd);
		
		buff = this.appletHandler.jsReadFileVFS( fd, size, this.engine );
		
		this.getUnitsync().closeFileVFS(fd);
		
		echo('buff', sidepath, size, buff.length)
		echo( 'typeof buff', typeof buff )
		echo( buff )
		
		/*
		echo( 'num_file_bytes start' )
		echo( 'num_file_bytes', this._asLittleEndianHex(824, 4))
		echo( 'num_file_bytes end' )
		return;
		*/
		
		var str, str64, strTest, testStr64;
		str = '';
		str64 = '';
		var fullStr
		
		
		var buffarr = []
	
		var start = 56;
		strTest = '';
		for(var j = 0; j < start; j+=1)
		{
			strTest += String.fromCharCode( buff[j] );
			str += String.fromCharCode( buff[j] );
		}
		
		var height = 16;                                // the number of rows
		var width = 16;
		var row_padding = (4 - (width * 3) % 4) % 4;             // pad each row to a multiple of 4 bytes
		var num_data_bytes = (width * 3 + row_padding) * height; // size in bytes of BMP data
		var num_file_bytes = 54 + num_data_bytes;                // full header size (offset) + size of data file;

		//num_file_bytes = 824
		//echo( 'num_file_bytes', num_file_bytes)
		height = this._asLittleEndianHex(height, 4);
		width = this._asLittleEndianHex(width, 4);
		num_data_bytes = this._asLittleEndianHex(num_data_bytes, 4);
		num_file_bytes = this._asLittleEndianHex(num_file_bytes, 4);
		
		// these are the actual bytes of the file...

		file = ('BM' +               // "Magic Number"
			num_file_bytes +     // size of the file (bytes)*
			'\x00\x00' +         // reserved
			'\x00\x00' +         // reserved
			'\x36\x00\x00\x00' + // offset of where BMP data lives (54 bytes)
			'\x28\x00\x00\x00' + // number of remaining bytes in header from here (40 bytes)
			width +              // the width of the bitmap in pixels*
			height +             // the height of the bitmap in pixels*
			'\x01\x00' +         // the number of color planes (1)
			'\x18\x00' +         // 24 bits / pixel
			'\x00\x00\x00\x00' + // No compression (0)
			num_data_bytes +     // size of the BMP data (bytes)*
			'\x13\x0B\x00\x00' + // 2835 pixels/meter - horizontal resolution
			'\x13\x0B\x00\x00' + // 2835 pixels/meter - the vertical resolution
			'\x00\x00\x00\x00' + // Number of colors in the palette (keep 0 for 24-bit)
			'\x00\x00\x00\x00' + // 0 important colors (means all colors are important)
			//_collapseData(rows, row_padding)
			''
		   );
		strTest = file;
		var padding = '';
		for (; row_padding > 0; row_padding--) {
			padding += '\x00';
		}
		
		//str64 = dojox.encoding.base64.encode( str );
		str64 = Base64.encode( str );
		testStr64 = Base64.encode( strTest );
		//console.log(str64 )
		//console.log('sizes', str.length, str64.length)
		
		fullStr = '';
		var fullStr2 = '';
		//fullArr = [];
		
		fullStr2 = file;
		j=0;
		while( j < file.length )
		{
			buffByte = file[j];
			/*
			echo( j, ']',
				buffByte.charCodeAt(0),
				buffByte
			)
			*/
			j++;
		}
		j=0
		var buffByte 
		while( j < buff.length )
		{
			buffByte = parseInt( buff[j] );
			//fullStr += String.fromCharCode( buffByte );
			fullStr += encodeURIComponent( String.fromCharCode( buffByte & 255 ) );
			j+=1;
		}
		
		//for( var j = 0; j < buff.length; j+=1 )
		
		/*
		-119 ? 137 ? 127 
		
		//good site http://software.hixie.ch/utilities/cgi/data/data
		data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F%F3%FFa%00%00%00%01sRGB%00%AE%CE%1C%E9%00%00%00%06bKGD%00%FF%00%FF%00%FF%A0%BD%A7%93%00%00%00%09pHYs%00%00%0B2%00%00%0B2%01%40%F5_h%00%00%00%07tIME%07%D9%0B%05%05%073O%B1%13%5E%00%00%02%F5IDAT8%CBu%93%5DlSu%18%87%9F%FF%D9zNO%3A%B6%AE%1B%03Z%BA%AEK%91%B9%A2%02v%99%CEp%A1%20h%8C%12%E2%9D%14%81%60%22uc%C0%82%891%1A%13!%91%F8E%C2%123%BF%06~%DCxa%201~DQ%20%CC%0Ff%165n%BA%B1t%92%AD%A3%95%D5%ADcu%A7g%9C%F5%F5n%86%AF%F7%EA%7D%DF%3C%F9%5D%FD%1E%C5Mf%FBS%3B%C5%A9%BE%CAH!Iq%AEHH%0B%E3%CE%1B%7Cx%FC%03u%3D%7B%CD%E3%E9%B6%84%F47%FF%CE%60%F9%00%9E%AAr*%CA%7C0%07%93%E3SL%0ENQ%9F%A9%E3%3E%FB%5E%DE%E9%EAR7%04%EC%3Ft%40%3En%E9fi%CCO%CD%A2%00E%14E%14%02HQ!%0Ed~%1E'%F9%C9%10m%9E%04%9D%87%8F(%00%0D%A0%F5%40%BB%7C%B4%FE%18%2B%EF%8Fb%F4%7B%18%3B%9C%C2%E5%B8%F1P%81%87r%5C%9AA%FA%F5Q%DCi%0Fw%26%9A%E9%9C%E9%A2u_%BB%2C%04%FC%B4%B9%87%D0%3Du%5C%F9t%86%D1%3D)t%C7%CD%2F%B1%F3%94%E2B%C7%A4%FF%EE%F3%B8%E6%DDL%1C%1D%C3%FA*O%FD%96('%E5K%00%B4%C4smri%F1%25%7C%F8%C8%1E%CB%B2%E6t%8C%D8%0B-T%3F%B6%8C%89%CF%FE%26%FB%F5e%BC%1B%96%B0%FA%C5u4%9Ejf%FA%F3%09%7C%B55%A4%8D%2C%89%8E6Q%3B%DF%DB%25%BD%BB~%20H%18%03%0Fn%CAP%E8%94%A0SDC%01%0Ep%15%07%87yf%C9c%FDk1%7C%E2%0F%D6'%9B(%1D%5Dt%91LG%96%8C%F3%0F%BAi%A2%2B%9D9%DB%01J0%0C%03%94%C2%B2m%A4(%B8%8CRl%99%C3N%17%98%9F%9Cg%E8%AE%24%DAtn%9A%E8%B9(%C3%BB%878%12x%95%15_%84%E8%DB%DECo%FC%3B%1E%1F%DF%C4%C6%3F%5B%E8%8B%7F%CBo%3B%CEp%C77a%8E.%7D%99%B1%97%06X7%B3%86%2B%F9%3C%A5%B7%D1%C0%D9%CA3T6zY%C5*%BC%3DU%2C%5B%ED%07%20%D8%14%22%97%9B%26%B06%08%40ec5%0D%0FD%A9%88x%19(%0C%B3%B6%BA%09%CD%9B%AAd%DCN1%D2%7B%11%D34%B1%AC%C2B%B1%ACY%0Bk%D6Z%B8m%AB%80i%9A%A4%07%D3%A42I%FC%85%C5ho%1D%ECT%BE%87%7D%C4%9F%8F%A3%D9%25%98n%F3%96e%D5%0D%1D%5D%5Cl%DD%FB%24%AE%87%AA%E8z%A5Si%00O%E4%E2%FCX%F6%3D%1B7l%A2%B6%26p%5D%80%2Clu%FE%10%8F%3C%F8(%A7gN%B1%BBj%DB%B5%D8%BE%83%1DB%0C%F1%07%832%D8wADD%DE%7F%B7%5B%DEx%EDM%11%11%19%FE%F5%82%04Caa%25%B2%F7%D0%B3r3%09I%B4%B7%CA%F2%ADAAG%02%0D%B5%12Y%D1%20%E1%FA%88%2C%BF%BDN0%90%C0%B6zyf%FF%1E%B9%A5%8D%FF%EB%BCC%A6T%8E%BF.%8F%20%9A%22%B2%24%82W*8%FEv%F7%0D%FC%7F%87b(%04%9E%A5%3D%A0%00%00%00%00IEND%AEB%60%82
		
		data:image/png,   %89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F      %F3%FFa%00%00%00%01sRGB%00   %AE%CE%1C%E9%00%00%00%06bKGD%00%FF%00%FF%00%FF%A0%BD%A7%93%00%00%00%09pHYs%00%00%0B2%00%00%0B2%01%40%F5_h%00%00%00%07tIME%07%D9%0B%05%05%073O%B1%13%5E%00%00%02%F5IDAT8%CBu%93%5DlSu%18%87%9F%FF%D9zNO%3A%B6%AE%1B%03Z%BA%AEK%91%B9%A2%02v%99%CEp%A1%20h%8C%12%E2%9D%14%81%60%22uc%C0%82%891%1A%13!%91%F8E%C2%123%BF%06~%DCxa%201~DQ%20%CC%0Ff%165n%BA%B1t%92%AD%A3%95%D5%ADcu%A7g%9C%F5%F5n%86%AF%F7%EA%7D%DF%3C%F9%5D%FD%1E%C5Mf%FBS%3B%C5%A9%BE%CAH!Iq%AEHH%0B%E3%CE%1B%7Cx%FC%03u%3D%7B%CD%E3%E9%B6%84%F47%FF%CE%60%F9%00%9E%AAr*%CA%7C0%07%93%E3SL%0ENQ%9F%A9%E3%3E%FB%5E%DE%E9%EAR7%04%EC%3Ft%40%3En%E9fi%CCO%CD%A2%00E%14E%14%02HQ!%0Ed~%1E'%F9%C9%10m%9E%04%9D%87%8F(%00%0D%A0%F5%40%BB%7C%B4%FE%18%2B%EF%8Fb%F4%7B%18%3B%9C%C2%E5%B8%F1P%81%87r%5C%9AA%FA%F5Q%DCi%0Fw%26%9A%E9%9C%E9%A2u_%BB%2C%04%FC%B4%B9%87%D0%3Du%5C%F9t%86%D1%3D)t%C7%CD%2F%B1%F3%94%E2B%C7%A4%FF%EE%F3%B8%E6%DDL%1C%1D%C3%FA*O%FD%96('%E5K%00%B4%C4smri%F1%25%7C%F8%C8%1E%CB%B2%E6t%8C%D8%0B-T%3F%B6%8C%89%CF%FE%26%FB%F5e%BC%1B%96%B0%FA%C5u4%9Ejf%FA%F3%09%7C%B55%A4%8D%2C%89%8E6Q%3B%DF%DB%25%BD%BB~%20H%18%03%0Fn%CAP%E8%94%A0SDC%01%0Ep%15%07%87yf%C9c%FDk1%7C%E2%0F%D6'%9B(%1D%5Dt%91LG%96%8C%F3%0F%BAi%A2%2B%9D9%DB%01J0%0C%03%94%C2%B2m%A4(%B8%8CRl%99%C3N%17%98%9F%9Cg%E8%AE%24%DAtn%9A%E8%B9(%C3%BB%878%12x%95%15_%84%E8%DB%DECo%FC%3B%1E%1F%DF%C4%C6%3F%5B%E8%8B%7F%CBo%3B%CEp%C77a%8E.%7D%99%B1%97%06X7%B3%86%2B%F9%3C%A5%B7%D1%C0%D9%CA3T6zY%C5*%BC%3DU%2C%5B%ED%07%20%D8%14%22%97%9B%26%B06%08%40ec5%0D%0FD%A9%88x%19(%0C%B3%B6%BA%09%CD%9B%AAd%DCN1%D2%7B%11%D34%B1%AC%C2B%B1%ACY%0Bk%D6Z%B8m%AB%80i%9A%A4%07%D3%A42I%FC%85%C5ho%1D%ECT%BE%87%7D%C4%9F%8F%A3%D9%25%98n%F3%96e%D5%0D%1D%5D%5Cl%DD%FB%24%AE%87%AA%E8z%A5Si%00O%E4%E2%FCX%F6%3D%1B7l%A2%B6%26p%5D%80%2Clu%FE%10%8F%3C%F8(%A7gN%B1%BBj%DB%B5%D8%BE%83%1DB%0C%F1%07%832%D8wADD%DE%7F%B7%5B%DEx%EDM%11%11%19%FE%F5%82%04Caa%25%B2%F7%D0%B3r3%09I%B4%B7%CA%F2%ADAAG%02%0D%B5%12Y%D1%20%E1%FA%88%2C%BF%BDN0%90%C0%B6zyf%FF%1E%B9%A5%8D%FF%EB%BCC%A6T%8E%BF.%8F%20%9A%22%B2%24%82W*8%FEv%F7%0D%FC%7F%87b(%04%9E%A5%3D%A0%00%00%00%00IEND%AEB%60%82
		data:image/png,%C2%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F%C3%B3%C3%BFa%00%00%00%01sRGB%00%C2%AE%C3%8E%1C%C3%A9%00%00%00%06bKGD%00%C3%BF%00%C3%BF%00%C3%BF%C2%A0%C2%BD%C2%A7%C2%93%00%00%00%09pHYs%00%00%0B2%00%00%0B2%01%40%C3%B5_h%00%00%00%07tIME%07%C3%99%0B%05%05%073O%C2%B1%13%5E%00%00%02%C3%B5IDAT8%C3%8Bu%C2%93%5DlSu%18%C2%87%C2%9F%C3%BF%C3%99zNO%3A%C2%B6%C2%AE%1B%03Z%C2%BA%C2%AEK%C2%91%C2%B9%C2%A2%02v%C2%99%C3%8Ep%C2%A1%20h%C2%8C%12%C3%A2%C2%9D%14%C2%81%60%22uc%C3%80%C2%82%C2%891%1A%13!%C2%91%C3%B8E%C3%82%123%C2%BF%06~%C3%9Cxa%201~DQ%20%C3%8C%0Ff%165n%C2%BA%C2%B1t%C2%92%C2%AD%C2%A3%C2%95%C3%95%C2%ADcu%C2%A7g%C2%9C%C3%B5%C3%B5n%C2%86%C2%AF%C3%B7%C3%AA%7D%C3%9F%3C%C3%B9%5D%C3%BD%1E%C3%85Mf%C3%BBS%3B%C3%85%C2%A9%C2%BE%C3%8AH!Iq%C2%AEHH%0B%C3%A3%C3%8E%1B%7Cx%C3%BC%03u%3D%7B%C3%8D%C3%A3%C3%A9%C2%B6%C2%84%C3%B47%C3%BF%C3%8E%60%C3%B9%00%C2%9E%C2%AAr*%C3%8A%7C0%07%C2%93%C3%A3SL%0ENQ%C2%9F%C2%A9%C3%A3%3E%C3%BB%5E%C3%9E%C3%A9%C3%AAR7%04%C3%AC%3Ft%40%3En%C3%A9fi%C3%8CO%C3%8D%C2%A2%00E%14E%14%02HQ!%0Ed~%1E'%C3%B9%C3%89%10m%C2%9E%04%C2%9D%C2%87%C2%8F(%00%0D%C2%A0%C3%B5%40%C2%BB%7C%C2%B4%C3%BE%18%2B%C3%AF%C2%8Fb%C3%B4%7B%18%3B%C2%9C%C3%82%C3%A5%C2%B8%C3%B1P%C2%81%C2%87r%5C%C2%9AA%C3%BA%C3%B5Q%C3%9Ci%0Fw%26%C2%9A%C3%A9%C2%9C%C3%A9%C2%A2u_%C2%BB%2C%04%C3%BC%C2%B4%C2%B9%C2%87%C3%90%3Du%5C%C3%B9t%C2%86%C3%91%3D)t%C3%87%C3%8D%2F%C2%B1%C3%B3%C2%94%C3%A2B%C3%87%C2%A4%C3%BF%C3%AE%C3%B3%C2%B8%C3%A6%C3%9DL%1C%1D%C3%83%C3%BA*O%C3%BD%C2%96('%C3%A5K%00%C2%B4%C3%84smri%C3%B1%25%7C%C3%B8%C3%88%1E%C3%8B%C2%B2%C3%A6t%C2%8C%C3%98%0B-T%3F%C2%B6%C2%8C%C2%89%C3%8F%C3%BE%26%C3%BB%C3%B5e%C2%BC%1B%C2%96%C2%B0%C3%BA%C3%85u4%C2%9Ejf%C3%BA%C3%B3%09%7C%C2%B55%C2%A4%C2%8D%2C%C2%89%C2%8E6Q%3B%C3%9F%C3%9B%25%C2%BD%C2%BB~%20H%18%03%0Fn%C3%8AP%C3%A8%C2%94%C2%A0SDC%01%0Ep%15%07%C2%87yf%C3%89c%C3%BDk1%7C%C3%A2%0F%C3%96'%C2%9B(%1D%5Dt%C2%91LG%C2%96%C2%8C%C3%B3%0F%C2%BAi%C2%A2%2B%C2%9D9%C3%9B%01J0%0C%03%C2%94%C3%82%C2%B2m%C2%A4(%C2%B8%C2%8CRl%C2%99%C3%83N%17%C2%98%C2%9F%C2%9Cg%C3%A8%C2%AE%24%C3%9Atn%C2%9A%C3%A8%C2%B9(%C3%83%C2%BB%C2%878%12x%C2%95%15_%C2%84%C3%A8%C3%9B%C3%9ECo%C3%BC%3B%1E%1F%C3%9F%C3%84%C3%86%3F%5B%C3%A8%C2%8B%7F%C3%8Bo%3B%C3%8Ep%C3%877a%C2%8E.%7D%C2%99%C2%B1%C2%97%06X7%C2%B3%C2%86%2B%C3%B9%3C%C2%A5%C2%B7%C3%91%C3%80%C3%99%C3%8A3T6zY%C3%85*%C2%BC%3DU%2C%5B%C3%AD%07%20%C3%98%14%22%C2%97%C2%9B%26%C2%B06%08%40ec5%0D%0FD%C2%A9%C2%88x%19(%0C%C2%B3%C2%B6%C2%BA%09%C3%8D%C2%9B%C2%AAd%C3%9CN1%C3%92%7B%11%C3%934%C2%B1%C2%AC%C3%82B%C2%B1%C2%ACY%0Bk%C3%96Z%C2%B8m%C2%AB%C2%80i%C2%9A%C2%A4%07%C3%93%C2%A42I%C3%BC%C2%85%C3%85ho%1D%C3%ACT%C2%BE%C2%87%7D%C3%84%C2%9F%C2%8F%C2%A3%C3%99%25%C2%98n%C3%B3%C2%96e%C3%95%0D%1D%5D%5Cl%C3%9D%C3%BB%24%C2%AE%C2%87%C2%AA%C3%A8z%C2%A5Si%00O%C3%A4%C3%A2%C3%BCX%C3%B6%3D%1B7l%C2%A2%C2%B6%26p%5D%C2%80%2Clu%C3%BE%10%C2%8F%3C%C3%B8(%C2%A7gN%C2%B1%C2%BBj%C3%9B%C2%B5%C3%98%C2%BE%C2%83%1DB%0C%C3%B1%07%C2%832%C3%98wADD%C3%9E%7F%C2%B7%5B%C3%9Ex%C3%ADM%11%11%19%C3%BE%C3%B5%C2%82%04Caa%25%C2%B2%C3%B7%C3%90%C2%B3r3%09I%C2%B4%C2%B7%C3%8A%C3%B2%C2%ADAAG%02%0D%C2%B5%12Y%C3%91%20%C3%A1%C3%BA%C2%88%2C%C2%BF%C2%BDN0%C2%90%C3%80%C2%B6zyf%C3%BF%1E%C2%B9%C2%A5%C2%8D%C3%BF%C3%AB%C2%BCC%C2%A6T%C2%8E%C2%BF.%C2%8F%20%C2%9A%22%C2%B2%24%C2%82W*8%C3%BEv%C3%B7%0D%C3%BC%7F%C2%87b(%04%C2%9E%C2%A5%3D%C2%A0%00%00%00%00IEND%C2%AEB%60%C2%82
		
		data:image/png,      %89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F            %F3%FFa%00%00%00%01sRGB%00%AE%CE%1C%E9%00%00%00%06bKGD%00%FF%00%FF%00%FF%A0%BD%A7%93%00%00%00%09pHYs%00%00%0B2%00%00%0B2%01%40%F5_h%00%00%00%07tIME%07%D9%0B%05%05%073O%B1%13%5E%00%00%02%F5IDAT8%CBu%93%5DlSu%18%87%9F%FF%D9zNO%3A%B6%AE%1B%03Z%BA%AEK%91%B9%A2%02v%99%CEp%A1%20h%8C%12%E2%9D%14%81%60%22uc%C0%82%891%1A%13!%91%F8E%C2%123%BF%06~%DCxa%201~DQ%20%CC%0Ff%165n%BA%B1t%92%AD%A3%95%D5%ADcu%A7g%9C%F5%F5n%86%AF%F7%EA%7D%DF%3C%F9%5D%FD%1E%C5Mf%FBS%3B%C5%A9%BE%CAH!Iq%AEHH%0B%E3%CE%1B%7Cx%FC%03u%3D%7B%CD%E3%E9%B6%84%F47%FF%CE%60%F9%00%9E%AAr*%CA%7C0%07%93%E3SL%0ENQ%9F%A9%E3%3E%FB%5E%DE%E9%EAR7%04%EC%3Ft%40%3En%E9fi%CCO%CD%A2%00E%14E%14%02HQ!%0Ed~%1E'%F9%C9%10m%9E%04%9D%87%8F(%00%0D%A0%F5%40%BB%7C%B4%FE%18%2B%EF%8Fb%F4%7B%18%3B%9C%C2%E5%B8%F1P%81%87r%5C%9AA%FA%F5Q%DCi%0Fw%26%9A%E9%9C%E9%A2u_%BB%2C%04%FC%B4%B9%87%D0%3Du%5C%F9t%86%D1%3D)t%C7%CD%2F%B1%F3%94%E2B%C7%A4%FF%EE%F3%B8%E6%DDL%1C%1D%C3%FA*O%FD%96('%E5K%00%B4%C4smri%F1%25%7C%F8%C8%1E%CB%B2%E6t%8C%D8%0B-T%3F%B6%8C%89%CF%FE%26%FB%F5e%BC%1B%96%B0%FA%C5u4%9Ejf%FA%F3%09%7C%B55%A4%8D%2C%89%8E6Q%3B%DF%DB%25%BD%BB~%20H%18%03%0Fn%CAP%E8%94%A0SDC%01%0Ep%15%07%87yf%C9c%FDk1%7C%E2%0F%D6'%9B(%1D%5Dt%91LG%96%8C%F3%0F%BAi%A2%2B%9D9%DB%01J0%0C%03%94%C2%B2m%A4(%B8%8CRl%99%C3N%17%98%9F%9Cg%E8%AE%24%DAtn%9A%E8%B9(%C3%BB%878%12x%95%15_%84%E8%DB%DECo%FC%3B%1E%1F%DF%C4%C6%3F%5B%E8%8B%7F%CBo%3B%CEp%C77a%8E.%7D%99%B1%97%06X7%B3%86%2B%F9%3C%A5%B7%D1%C0%D9%CA3T6zY%C5*%BC%3DU%2C%5B%ED%07%20%D8%14%22%97%9B%26%B06%08%40ec5%0D%0FD%A9%88x%19(%0C%B3%B6%BA%09%CD%9B%AAd%DCN1%D2%7B%11%D34%B1%AC%C2B%B1%ACY%0Bk%D6Z%B8m%AB%80i%9A%A4%07%D3%A42I%FC%85%C5ho%1D%ECT%BE%87%7D%C4%9F%8F%A3%D9%25%98n%F3%96e%D5%0D%1D%5D%5Cl%DD%FB%24%AE%87%AA%E8z%A5Si%00O%E4%E2%FCX%F6%3D%1B7l%A2%B6%26p%5D%80%2Clu%FE%10%8F%3C%F8(%A7gN%B1%BBj%DB%B5%D8%BE%83%1DB%0C%F1%07%832%D8wADD%DE%7F%B7%5B%DEx%EDM%11%11%19%FE%F5%82%04Caa%25%B2%F7%D0%B3r3%09I%B4%B7%CA%F2%ADAAG%02%0D%B5%12Y%D1%20%E1%FA%88%2C%BF%BDN0%90%C0%B6zyf%FF%1E%B9%A5%8D%FF%EB%BCC%A6T%8E%BF.%8F%20%9A%22%B2%24%82W*8%FEv%F7%0D%FC%7F%87b(%04%9E%A5%3D%A0%00%00%00%00IEND%AEB%60%82
		data:image/png,%EF%BE%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F%EF%BF%B3%EF%BF%BFa%00%00%00%01sRGB%00%EF%BE%AE%EF%BF%8E%1C%EF%BF%A9%00%00%00%06bKGD%00%EF%BF%BF%00%EF%BF%BF%00%EF%BF%BF%EF%BE%A0%EF%BE%BD%EF%BE%A7%EF%BE%93%00%00%00%09pHYs%00%00%0B2%00%00%0B2%01%40%EF%BF%B5_h%00%00%00%07tIME%07%EF%BF%99%0B%05%05%073O%EF%BE%B1%13%5E%00%00%02%EF%BF%B5IDAT8%EF%BF%8Bu%EF%BE%93%5DlSu%18%EF%BE%87%EF%BE%9F%EF%BF%BF%EF%BF%99zNO%3A%EF%BE%B6%EF%BE%AE%1B%03Z%EF%BE%BA%EF%BE%AEK%EF%BE%91%EF%BE%B9%EF%BE%A2%02v%EF%BE%99%EF%BF%8Ep%EF%BE%A1%20h%EF%BE%8C%12%EF%BF%A2%EF%BE%9D%14%EF%BE%81%60%22uc%EF%BF%80%EF%BE%82%EF%BE%891%1A%13!%EF%BE%91%EF%BF%B8E%EF%BF%82%123%EF%BE%BF%06~%EF%BF%9Cxa%201~DQ%20%EF%BF%8C%0Ff%165n%EF%BE%BA%EF%BE%B1t%EF%BE%92%EF%BE%AD%EF%BE%A3%EF%BE%95%EF%BF%95%EF%BE%ADcu%EF%BE%A7g%EF%BE%9C%EF%BF%B5%EF%BF%B5n%EF%BE%86%EF%BE%AF%EF%BF%B7%EF%BF%AA%7D%EF%BF%9F%3C%EF%BF%B9%5D%EF%BF%BD%1E%EF%BF%85Mf%EF%BF%BBS%3B%EF%BF%85%EF%BE%A9%EF%BE%BE%EF%BF%8AH!Iq%EF%BE%AEHH%0B%EF%BF%A3%EF%BF%8E%1B%7Cx%EF%BF%BC%03u%3D%7B%EF%BF%8D%EF%BF%A3%EF%BF%A9%EF%BE%B6%EF%BE%84%EF%BF%B47%EF%BF%BF%EF%BF%8E%60%EF%BF%B9%00%EF%BE%9E%EF%BE%AAr*%EF%BF%8A%7C0%07%EF%BE%93%EF%BF%A3SL%0ENQ%EF%BE%9F%EF%BE%A9%EF%BF%A3%3E%EF%BF%BB%5E%EF%BF%9E%EF%BF%A9%EF%BF%AAR7%04%EF%BF%AC%3Ft%40%3En%EF%BF%A9fi%EF%BF%8CO%EF%BF%8D%EF%BE%A2%00E%14E%14%02HQ!%0Ed~%1E'%EF%BF%B9%EF%BF%89%10m%EF%BE%9E%04%EF%BE%9D%EF%BE%87%EF%BE%8F(%00%0D%EF%BE%A0%EF%BF%B5%40%EF%BE%BB%7C%EF%BE%B4%EF%BF%BE%18%2B%EF%BF%AF%EF%BE%8Fb%EF%BF%B4%7B%18%3B%EF%BE%9C%EF%BF%82%EF%BF%A5%EF%BE%B8%EF%BF%B1P%EF%BE%81%EF%BE%87r%5C%EF%BE%9AA%EF%BF%BA%EF%BF%B5Q%EF%BF%9Ci%0Fw%26%EF%BE%9A%EF%BF%A9%EF%BE%9C%EF%BF%A9%EF%BE%A2u_%EF%BE%BB%2C%04%EF%BF%BC%EF%BE%B4%EF%BE%B9%EF%BE%87%EF%BF%90%3Du%5C%EF%BF%B9t%EF%BE%86%EF%BF%91%3D)t%EF%BF%87%EF%BF%8D%2F%EF%BE%B1%EF%BF%B3%EF%BE%94%EF%BF%A2B%EF%BF%87%EF%BE%A4%EF%BF%BF%EF%BF%AE%EF%BF%B3%EF%BE%B8%EF%BF%A6%EF%BF%9DL%1C%1D%EF%BF%83%EF%BF%BA*O%EF%BF%BD%EF%BE%96('%EF%BF%A5K%00%EF%BE%B4%EF%BF%84smri%EF%BF%B1%25%7C%EF%BF%B8%EF%BF%88%1E%EF%BF%8B%EF%BE%B2%EF%BF%A6t%EF%BE%8C%EF%BF%98%0B-T%3F%EF%BE%B6%EF%BE%8C%EF%BE%89%EF%BF%8F%EF%BF%BE%26%EF%BF%BB%EF%BF%B5e%EF%BE%BC%1B%EF%BE%96%EF%BE%B0%EF%BF%BA%EF%BF%85u4%EF%BE%9Ejf%EF%BF%BA%EF%BF%B3%09%7C%EF%BE%B55%EF%BE%A4%EF%BE%8D%2C%EF%BE%89%EF%BE%8E6Q%3B%EF%BF%9F%EF%BF%9B%25%EF%BE%BD%EF%BE%BB~%20H%18%03%0Fn%EF%BF%8AP%EF%BF%A8%EF%BE%94%EF%BE%A0SDC%01%0Ep%15%07%EF%BE%87yf%EF%BF%89c%EF%BF%BDk1%7C%EF%BF%A2%0F%EF%BF%96'%EF%BE%9B(%1D%5Dt%EF%BE%91LG%EF%BE%96%EF%BE%8C%EF%BF%B3%0F%EF%BE%BAi%EF%BE%A2%2B%EF%BE%9D9%EF%BF%9B%01J0%0C%03%EF%BE%94%EF%BF%82%EF%BE%B2m%EF%BE%A4(%EF%BE%B8%EF%BE%8CRl%EF%BE%99%EF%BF%83N%17%EF%BE%98%EF%BE%9F%EF%BE%9Cg%EF%BF%A8%EF%BE%AE%24%EF%BF%9Atn%EF%BE%9A%EF%BF%A8%EF%BE%B9(%EF%BF%83%EF%BE%BB%EF%BE%878%12x%EF%BE%95%15_%EF%BE%84%EF%BF%A8%EF%BF%9B%EF%BF%9ECo%EF%BF%BC%3B%1E%1F%EF%BF%9F%EF%BF%84%EF%BF%86%3F%5B%EF%BF%A8%EF%BE%8B%7F%EF%BF%8Bo%3B%EF%BF%8Ep%EF%BF%877a%EF%BE%8E.%7D%EF%BE%99%EF%BE%B1%EF%BE%97%06X7%EF%BE%B3%EF%BE%86%2B%EF%BF%B9%3C%EF%BE%A5%EF%BE%B7%EF%BF%91%EF%BF%80%EF%BF%99%EF%BF%8A3T6zY%EF%BF%85*%EF%BE%BC%3DU%2C%5B%EF%BF%AD%07%20%EF%BF%98%14%22%EF%BE%97%EF%BE%9B%26%EF%BE%B06%08%40ec5%0D%0FD%EF%BE%A9%EF%BE%88x%19(%0C%EF%BE%B3%EF%BE%B6%EF%BE%BA%09%EF%BF%8D%EF%BE%9B%EF%BE%AAd%EF%BF%9CN1%EF%BF%92%7B%11%EF%BF%934%EF%BE%B1%EF%BE%AC%EF%BF%82B%EF%BE%B1%EF%BE%ACY%0Bk%EF%BF%96Z%EF%BE%B8m%EF%BE%AB%EF%BE%80i%EF%BE%9A%EF%BE%A4%07%EF%BF%93%EF%BE%A42I%EF%BF%BC%EF%BE%85%EF%BF%85ho%1D%EF%BF%ACT%EF%BE%BE%EF%BE%87%7D%EF%BF%84%EF%BE%9F%EF%BE%8F%EF%BE%A3%EF%BF%99%25%EF%BE%98n%EF%BF%B3%EF%BE%96e%EF%BF%95%0D%1D%5D%5Cl%EF%BF%9D%EF%BF%BB%24%EF%BE%AE%EF%BE%87%EF%BE%AA%EF%BF%A8z%EF%BE%A5Si%00O%EF%BF%A4%EF%BF%A2%EF%BF%BCX%EF%BF%B6%3D%1B7l%EF%BE%A2%EF%BE%B6%26p%5D%EF%BE%80%2Clu%EF%BF%BE%10%EF%BE%8F%3C%EF%BF%B8(%EF%BE%A7gN%EF%BE%B1%EF%BE%BBj%EF%BF%9B%EF%BE%B5%EF%BF%98%EF%BE%BE%EF%BE%83%1DB%0C%EF%BF%B1%07%EF%BE%832%EF%BF%98wADD%EF%BF%9E%7F%EF%BE%B7%5B%EF%BF%9Ex%EF%BF%ADM%11%11%19%EF%BF%BE%EF%BF%B5%EF%BE%82%04Caa%25%EF%BE%B2%EF%BF%B7%EF%BF%90%EF%BE%B3r3%09I%EF%BE%B4%EF%BE%B7%EF%BF%8A%EF%BF%B2%EF%BE%ADAAG%02%0D%EF%BE%B5%12Y%EF%BF%91%20%EF%BF%A1%EF%BF%BA%EF%BE%88%2C%EF%BE%BF%EF%BE%BDN0%EF%BE%90%EF%BF%80%EF%BE%B6zyf%EF%BF%BF%1E%EF%BE%B9%EF%BE%A5%EF%BE%8D%EF%BF%BF%EF%BF%AB%EF%BE%BCC%EF%BE%A6T%EF%BE%8E%EF%BE%BF.%EF%BE%8F%20%EF%BE%9A%22%EF%BE%B2%24%EF%BE%82W*8%EF%BF%BEv%EF%BF%B7%0D%EF%BF%BC%7F%EF%BE%87b(%04%EF%BE%9E%EF%BE%A5%3D%EF%BE%A0%00%00%00%00IEND%EF%BE%AEB%60%EF%BE%82
		
		
		data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F%F3%FFa%00%00%00%01sRGB%00%AE%CE%1C%E9%00%00%00%06bKGD%00%FF%00%FF%00%FF%A0%BD%A7%93%00%00%00%09pHYs%00%00%0B2%00%00%0B2%01%40%F5_h%00%00%00%07tIME%07%D9%0B%05%05%073O%B1%13%5E%00%00%02%F5IDAT8%CBu%93%5DlSu%18%87%9F%FF%D9zNO%3A%B6%AE%1B%03Z%BA%AEK%91%B9%A2%02v%99%CEp%A1%20h%8C%12%E2%9D%14%81%60%22uc%C0%82%891%1A%13!%91%F8E%C2%123%BF%06~%DCxa%201~DQ%20%CC%0Ff%165n%BA%B1t%92%AD%A3%95%D5%ADcu%A7g%9C%F5%F5n%86%AF%F7%EA%7D%DF%3C%F9%5D%FD%1E%C5Mf%FBS%3B%C5%A9%BE%CAH!Iq%AEHH%0B%E3%CE%1B%7Cx%FC%03u%3D%7B%CD%E3%E9%B6%84%F47%FF%CE%60%F9%00%9E%AAr*%CA%7C0%07%93%E3SL%0ENQ%9F%A9%E3%3E%FB%5E%DE%E9%EAR7%04%EC%3Ft%40%3En%E9fi%CCO%CD%A2%00E%14E%14%02HQ!%0Ed~%1E'%F9%C9%10m%9E%04%9D%87%8F(%00%0D%A0%F5%40%BB%7C%B4%FE%18%2B%EF%8Fb%F4%7B%18%3B%9C%C2%E5%B8%F1P%81%87r%5C%9AA%FA%F5Q%DCi%0Fw%26%9A%E9%9C%E9%A2u_%BB%2C%04%FC%B4%B9%87%D0%3Du%5C%F9t%86%D1%3D)t%C7%CD%2F%B1%F3%94%E2B%C7%A4%FF%EE%F3%B8%E6%DDL%1C%1D%C3%FA*O%FD%96('%E5K%00%B4%C4smri%F1%25%7C%F8%C8%1E%CB%B2%E6t%8C%D8%0B-T%3F%B6%8C%89%CF%FE%26%FB%F5e%BC%1B%96%B0%FA%C5u4%9Ejf%FA%F3%09%7C%B55%A4%8D%2C%89%8E6Q%3B%DF%DB%25%BD%BB~%20H%18%03%0Fn%CAP%E8%94%A0SDC%01%0Ep%15%07%87yf%C9c%FDk1%7C%E2%0F%D6'%9B(%1D%5Dt%91LG%96%8C%F3%0F%BAi%A2%2B%9D9%DB%01J0%0C%03%94%C2%B2m%A4(%B8%8CRl%99%C3N%17%98%9F%9Cg%E8%AE%24%DAtn%9A%E8%B9(%C3%BB%878%12x%95%15_%84%E8%DB%DECo%FC%3B%1E%1F%DF%C4%C6%3F%5B%E8%8B%7F%CBo%3B%CEp%C77a%8E.%7D%99%B1%97%06X7%B3%86%2B%F9%3C%A5%B7%D1%C0%D9%CA3T6zY%C5*%BC%3DU%2C%5B%ED%07%20%D8%14%22%97%9B%26%B06%08%40ec5%0D%0FD%A9%88x%19(%0C%B3%B6%BA%09%CD%9B%AAd%DCN1%D2%7B%11%D34%B1%AC%C2B%B1%ACY%0Bk%D6Z%B8m%AB%80i%9A%A4%07%D3%A42I%FC%85%C5ho%1D%ECT%BE%87%7D%C4%9F%8F%A3%D9%25%98n%F3%96e%D5%0D%1D%5D%5Cl%DD%FB%24%AE%87%AA%E8z%A5Si%00O%E4%E2%FCX%F6%3D%1B7l%A2%B6%26p%5D%80%2Clu%FE%10%8F%3C%F8(%A7gN%B1%BBj%DB%B5%D8%BE%83%1DB%0C%F1%07%832%D8wADD%DE%7F%B7%5B%DEx%EDM%11%11%19%FE%F5%82%04Caa%25%B2%F7%D0%B3r3%09I%B4%B7%CA%F2%ADAAG%02%0D%B5%12Y%D1%20%E1%FA%88%2C%BF%BDN0%90%C0%B6zyf%FF%1E%B9%A5%8D%FF%EB%BCC%A6T%8E%BF.%8F%20%9A%22%B2%24%82W*8%FEv%F7%0D%FC%7F%87b(%04%9E%A5%3D%A0%00%00%00%00IEND%AEB%60%82
		data:image/png,PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1Fa%00%00%00%01sRGB%00%1C%00%00%00%06bKGD%00%00%00%00%00%00%09pHYs%00%00%0B2%00%00%0B2%01%40_h%00%00%00%07tIME%07%0B%05%05%073O%13%5E%00%00%02IDAT8u%5DlSu%18zNO%3A%1B%03ZK%02vp%20h%12%14%60%22uc1%1A%13!E%123%06~xa%201~DQ%20%0Ff%165ntcugn%7D%3C%5D%1EMfS%3BH!IqHH%0B%1B%7Cx%03u%3D%7B7%60%00r*%7C0%07SL%0ENQ%3E%5ER7%04%3Ft%40%3EnfiO%00E%14E%14%02HQ!%0Ed~%1E'%10m%04(%00%0D%40%7C%18%2Bb%7B%18%3BPr%5CAQi%0Fw%26u_%2C%04%3Du%5Ct%3D)t%2FBL%1C%1D*O('K%00smri%25%7C%1Et%0B-T%3F%26e%1Bu4jf%09%7C5%2C6Q%3B%25~%20H%18%03%0FnPSDC%01%0Ep%15%07yfck1%7C%0F'(%1D%5DtLG%0Fi%2B9%01J0%0C%03m(RlN%17g%24tn(8%12x%15_Co%3B%1E%1F%3F%5B%7Fo%3Bp7a.%7D%06X7%2B%3C3T6zY*%3DU%2C%5B%07%20%14%22%266%08%40ec5%0D%0FDx%19(%0C%09dN1%7B%114BY%0BkZmi%072Iho%1DT%7D%25ne%0D%1D%5D%5Cl%24zSi%00OX%3D%1B7l%26p%5D%2Clu%10%3C(gNj%1DB%0C%072wADD%7F%5BxM%11%11%19%04Caa%25r3%09IAAG%02%0D%12Y%20%2CN0zyf%1ECT.%20%22%24W*8v%0D%7Fb(%04%3D%00%00%00%00IENDB%60
		*/
		j=0
		while( j < buff.length )
		{
		
			buffByte = parseInt( buff[j] );
			echo( j, ']',
				buffByte, String.fromCharCode( buffByte ),
				buffByte & 255, String.fromCharCode( buffByte & 255 ),
				Math.min( buffByte & 0xff, 127 ), String.fromCharCode( Math.min( buffByte & 0xff, 127 ) )
			)
			
			//fullStr += String.fromCharCode( Math.min( buffByte & 255, 127 )  ) ; //this is the closest, some icons are garbled
			//fullStr += String.fromCharCode( Math.min( buffByte & 0xff )  ) ;
			if( j < 54 )
			{
				//fullStr += String.fromCharCode( Math.min( buffByte, 127 ) );
				//fullStr2 += String.fromCharCode( buffByte & 127 );
				j+=1;
			}
			else
			{
				//if( j < 822)
				{
					//fullStr += String.fromCharCode( Math.min( buffByte & 0xff, 127 )  ) ; //this is the closest, some icons are garbled
					fullStr2 += String.fromCharCode( Math.min( buffByte & 0xff, 127 )  ) ;
				}	
				//fullArr.push (String.fromCharCode( Math.min( buffByte & 0xff, 127 )  ) ) ; //this is the closest, some icons are garbled
				
				
				//fullStr += String.fromCharCode( Math.min( buffByte, 127 ) );
				//fullStr += String.fromCharCode( Math.min( buffByte, 255 ) );
				//fullStr += String.fromCharCode( buffByte & 255 );
				//fullStr += String.fromCharCode( buffByte & 127 );
				//fullStr += String.fromCharCode( buffByte >>> 0 );
				
				
				j+=1;
				
			}
			if( j > 54 && (j-54)%(16*3) == 0 )
			{
				echo('-------------------------')
			}
			
			//strTest += String.fromCharCode( buff[j] );
		}
		//fullStr = file;
		echo('fullStr len', fullStr.length)
		var val1
		for(var iii=1; iii<=16; iii++)
		{
			for(var ii=1; ii<=16; ii++)
			{
				/**/
				//fullStr2 += String.fromCharCode( 0, 127, 0, 0 );
				//fullStr2 += String.fromCharCode( 0, 127, 0 );
				/**/		
			}
		}
		
		
		domConstruct.create( 'img', {src: 'img/warning.png'}, this.factionImageTest )
		/**/
		//domConstruct.create( 'img', {'src': 'data:image/bmp;base64,' + str64, 'title':factionName }, this.factionImageTest )
		//domConstruct.create( 'img', {'src': 'data:image/bmp;base64,' + testStr64, 'title':factionName }, this.factionImageTest )
		//domConstruct.create( 'img', {'src': 'data:image/bmp,' + str, 'title':factionName }, this.factionImageTest )
		//domConstruct.create( 'img', {'src': 'data:image/bmp,' + strTest, 'title':factionName+'3' }, this.factionImageTest )
		
		//var temp1 = "%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F%F3%FFa%00%00%00%01sRGB%00%AE%CE%1C%E9%00%00%00%06bKGD%00%FF%00%FF%00%FF%A0%BD%A7%93%00%00%00%09pHYs%00%00%0B2%00%00%0B2%01%40%F5_h%00%00%00%07tIME%07%D9%0B%05%05%073O%B1%13%5E%00%00%02%F5IDAT8%CBu%93%5DlSu%18%87%9F%FF%D9zNO%3A%B6%AE%1B%03Z%BA%AEK%91%B9%A2%02v%99%CEp%A1%20h%8C%12%E2%9D%14%81%60%22uc%C0%82%891%1A%13!%91%F8E%C2%123%BF%06~%DCxa%201~DQ%20%CC%0Ff%165n%BA%B1t%92%AD%A3%95%D5%ADcu%A7g%9C%F5%F5n%86%AF%F7%EA%7D%DF%3C%F9%5D%FD%1E%C5Mf%FBS%3B%C5%A9%BE%CAH!Iq%AEHH%0B%E3%CE%1B%7Cx%FC%03u%3D%7B%CD%E3%E9%B6%84%F47%FF%CE%60%F9%00%9E%AAr*%CA%7C0%07%93%E3SL%0ENQ%9F%A9%E3%3E%FB%5E%DE%E9%EAR7%04%EC%3Ft%40%3En%E9fi%CCO%CD%A2%00E%14E%14%02HQ!%0Ed~%1E'%F9%C9%10m%9E%04%9D%87%8F(%00%0D%A0%F5%40%BB%7C%B4%FE%18%2B%EF%8Fb%F4%7B%18%3B%9C%C2%E5%B8%F1P%81%87r%5C%9AA%FA%F5Q%DCi%0Fw%26%9A%E9%9C%E9%A2u_%BB%2C%04%FC%B4%B9%87%D0%3Du%5C%F9t%86%D1%3D)t%C7%CD%2F%B1%F3%94%E2B%C7%A4%FF%EE%F3%B8%E6%DDL%1C%1D%C3%FA*O%FD%96('%E5K%00%B4%C4smri%F1%25%7C%F8%C8%1E%CB%B2%E6t%8C%D8%0B-T%3F%B6%8C%89%CF%FE%26%FB%F5e%BC%1B%96%B0%FA%C5u4%9Ejf%FA%F3%09%7C%B55%A4%8D%2C%89%8E6Q%3B%DF%DB%25%BD%BB~%20H%18%03%0Fn%CAP%E8%94%A0SDC%01%0Ep%15%07%87yf%C9c%FDk1%7C%E2%0F%D6'%9B(%1D%5Dt%91LG%96%8C%F3%0F%BAi%A2%2B%9D9%DB%01J0%0C%03%94%C2%B2m%A4(%B8%8CRl%99%C3N%17%98%9F%9Cg%E8%AE%24%DAtn%9A%E8%B9(%C3%BB%878%12x%95%15_%84%E8%DB%DECo%FC%3B%1E%1F%DF%C4%C6%3F%5B%E8%8B%7F%CBo%3B%CEp%C77a%8E.%7D%99%B1%97%06X7%B3%86%2B%F9%3C%A5%B7%D1%C0%D9%CA3T6zY%C5*%BC%3DU%2C%5B%ED%07%20%D8%14%22%97%9B%26%B06%08%40ec5%0D%0FD%A9%88x%19(%0C%B3%B6%BA%09%CD%9B%AAd%DCN1%D2%7B%11%D34%B1%AC%C2B%B1%ACY%0Bk%D6Z%B8m%AB%80i%9A%A4%07%D3%A42I%FC%85%C5ho%1D%ECT%BE%87%7D%C4%9F%8F%A3%D9%25%98n%F3%96e%D5%0D%1D%5D%5Cl%DD%FB%24%AE%87%AA%E8z%A5Si%00O%E4%E2%FCX%F6%3D%1B7l%A2%B6%26p%5D%80%2Clu%FE%10%8F%3C%F8(%A7gN%B1%BBj%DB%B5%D8%BE%83%1DB%0C%F1%07%832%D8wADD%DE%7F%B7%5B%DEx%EDM%11%11%19%FE%F5%82%04Caa%25%B2%F7%D0%B3r3%09I%B4%B7%CA%F2%ADAAG%02%0D%B5%12Y%D1%20%E1%FA%88%2C%BF%BDN0%90%C0%B6zyf%FF%1E%B9%A5%8D%FF%EB%BCC%A6T%8E%BF.%8F%20%9A%22%B2%24%82W*8%FEv%F7%0D%FC%7F%87b(%04%9E%A5%3D%A0%00%00%00%00IEND%AEB%60%82"
		domConstruct.create( 'img', {src: 'data:image/png,' + fullStr, title: factionName+'4' }, this.factionImageTest )
		//domConstruct.create( 'img', {'src': 'data:image/png,' + temp1, 'title':factionName+'4' }, this.factionImageTest )
		domConstruct.create( 'img', {src: 'data:image/bmp,' + fullStr2, title: factionName+'5' }, this.factionImageTest )
		//domConstruct.create( 'img', {'src': 'data:image/png;base64,' + Base64.encode( fullStr ), 'title':factionName+'5' }, this.factionImageTest )
		
		var canvas = domConstruct.create( 'canvas', {width: 16, height: 16, name: factionName+'6' }, this.factionImageTest )
		var ctx = canvas.getContext("2d");
		var imgData = ctx.createImageData(16,16);
		var k=0;
		
		var j 
		start = 54;
		var rows = [];
		var row = [];
		var pixels = [];
		j = start;
		var pixel
		var p=0
		while( j < buff.length-1 )
		{
			row.push( parseInt( buff[j] & 255 ) );
			j+=1;
			if( row.length % (16*3) === 0 )
			{
				rows.push(row);
				row = [];
			}
			p+=1
		}
		rows.reverse();
		
		pixels=[];
		array.forEach(rows, function(row)
		{
			array.forEach(row, function(pixel)
			{
				pixels.push( pixel );
			});
		});
		
		echo('len', buff.length - start)
		echo('len2',imgData.data.length)
		
		j=0
		while( j < pixels.length )
		{
			imgData.data[k]=pixels[j+2]
			k+=1;
			imgData.data[k]=pixels[j+1]
			k+=1;
			imgData.data[k]=pixels[j]
			k+=1;
			imgData.data[k]=255;
			k+=1;
			
			j+=3;
		}
		ctx.putImageData(imgData,0,0);
		/**/
		
		return canvas;
	},
	
	loadFactions: function() //note, loadmodoptions first does addallarchives so it must be called before this. fixme
	{
		var listOptions, factionCount, i, factionName;
		var factionIcon
		var factionLabel
		if( this.factionsLoaded )
		{
			return;
		}
		factionCount = this.getUnitsync().getSideCount();
		listOptions = [];
		this.factions = [];
		this.factionSelect.removeOption(this.factionSelect.getOptions());
		
		domConstruct.empty( this.factionImageTest )
		
		for( i=0; i<factionCount; i++ )
		{
			factionName = this.getUnitsync().getSideName(i);
			
			factionLabel = factionName;
			
			//domConstruct.place( this.getFactionIcon(factionName), factionLabel )
			
			//factionLabel = this.getFactionIcon(factionName).domNode
			
			this.factionSelect.addOption({ value: i, label: factionLabel })
			this.factions[i] = factionName;
			
			
			
		}
		
		this.factionsLoaded = true;
		//refresh user icons now that we have a side data
		this.refreshUsers();
	},
	refreshUsers: function()
	{
		var name, user;
		for( name in this.players )
		{
			user = this.players[name];
			topic.publish('Lobby/battle/playerstatus', {name: name, user: user, userOld: user } );
		}
	},

	loadModOptions: function()
	{
		var val;
		if( this.modOptions !== null )
		{
			return;
		}
		this.modOptions = new GameOptions({
			gameIndex: this.gameIndex,
			battleRoom: this
		})

		for( key in this.extraScriptTags )
		{
			val = this.extraScriptTags[key]
			if( key.toLowerCase().match( /game\/modoptions\// ) )
			{
				optionKey = key.toLowerCase().replace( 'game/modoptions/', '' );
				this.modOptions.updateModOption({key: optionKey, value: val}  );
			}
		}

	},

	loadGameBots: function()
	{
		var gameBots;
		if( this.gameBots !== null )
		{
			return;
		}
		this.gameBots = new GameBots({
			appletHandler: this.appletHandler,
			gameIndex: this.gameIndex,
			users: this.users,
			battleRoom: this
		});
	},


	//function needed for template dojoattachevent
	showModOptions: function()
	{
		if( !this.loadedBattleData )
		{
			alert2('Still loading game data, please wait...')
			return;
		}
		if( this.getUnitsync() === null )
		{
			alert2('Game options not available.')
			return;
		}

		if( this.modOptions === null )
		{
			this.syncCheckDialog( 'You cannot edit the game options because you are missing the game.', true );
			return;
		}
		this.modOptions.showDialog();
	},

	showGameBots: function(team)
	{
		if( !this.loadedBattleData )
		{
			alert2('Still loading game data, please wait...')
			return;
		}
		if( this.getUnitsync() === null )
		{
			alert2('Bots not available.')
			return;
		}

		if( this.modOptions === null )
		{
			this.syncCheckDialog( 'You cannot add a bot because you are missing the game.', true );
			return;
		}
		this.gameBots.showDialog(team);
	},



	updateBattle: function(data) //move to MBattleRoom?
	{
		var smsg;
		if( this.battleId !== data.battleId )
		{
			return;
		}
		if( typeof data.map !== 'undefined' )
		{
			this.map = data.map;
		}
		
		this.battleMap.setMap( this.map ); 
		this.setSync(); //call setmap before this line because this function will load mapoptions based on that map
		
		if( this.hosting )
		{
			smsg = 'UPDATEBATTLEINFO 0 0 ' + this.mapHash + ' ' + this.map;
			topic.publish( 'Lobby/rawmsg', {msg: smsg } );
				
			return;
		}
		
		if( !this.runningGame && data.progress && this.gotStatuses ) //only start game automatically if you were already in the room
		{
			this.startGame();
		}
		if( typeof data.progress !== 'undefined' )
		{
			this.runningGame = data.progress;
			domStyle.set( this.progressIconDiv, 'display', this.runningGame ? 'inline' : 'none' );
		}
	},
	
	leaveBattle: function() //override
	{
		this.closeBattle();
	},
	
	closeBattle: function( )
	{
		var name;
		this.inBattle = false;
		if( this.modOptions !== null )
		{
			this.modOptions.destroy();
			delete this.modOptions;
			this.modOptions = null;
		}
		if( this.gameBots !== null )
		{
			this.gameBots.destroy();
			delete this.gameBots;
			this.gameBots = null;
		}

		//this.factionSelect.set( 'options', [] );
		this.factionSelect.removeOption(this.factionSelect.getOptions());
		this.battleMap.clearMap();
		this.host = '';
		this.loadedBattleData = false;
		this.gotStatuses = false;
		this.factions = [];
		this.factionsLoaded = false;

		this.synced = false;
		this.gotGame = false;
		this.gotMap = false;
		this.gotEngine = false;
		
		this.map = '';
		this.scriptMissionScript = '';

		this.extraScriptTags = {}

		domConstruct.create('hr', {}, this.messageNode.domNode )

		domAttr.set( this.titleText, 'innerHTML', 'Please wait...' );

		for( name in this.bots )
		{
			delete this.users[name];
			this.users[name] = null;
		}
		this.bots = {};
		

		this.battleId = 0;
		domStyle.set( this.hideBattleNode, 'display', 'block' );
		domStyle.set( this.battleDivNode, 'display', 'none' );
		this.closeNode.set('disabled', true);
		this.playerListNode.empty();
		this.players = {};
		Tooltip.hide(this.startGameButton.domNode);
	},

	getGameDownloadUrl: function() {
		if (this.game.indexOf("Zero-K") != -1) { // check if the string contains Zero-K

			return 'http://packages.springrts.com/builds/?C=M;O=D';
		} else {
			return 'http://springfiles.com/finder/1/' + this.game;
		}
	},

	syncCheckDialog: function( message, forceShowAlert )
	{
		var dlg, dlgDiv, closeButton;

		if(this.synced)
		{
			return true;
		}

		message += '<br /><ul>';
		if( !this.gotEngine )
		{
			message += '<li>Missing engine version: '
				+ this.engine + '</a></li>';
		}
		else
		{
			if( !this.gotGame )
			{
				if( this.gameHashMismatch )
				{
					message += '<li>Game does match hosts\'s: <a href="' + this.getGameDownloadUrl()
						+ '" target="_blank" >'
						+ this.game + '</a></li>';
				}
				else
				{
					message += '<li>Missing game: <a href="' + this.getGameDownloadUrl()
						+ '" target="_blank" >'
						+ this.game + '</a></li>';
				}
	
			}
			if( !this.gotMap )
			{
				message += '<li>Missing map: <a href="' + this.battleMap.getMapLink()
					+ '" target="_blank" >'
					+ this.map + '</a></li>';
			}	
		}
		
		
		message += '</ul>';
		
		

		if( this.map === '' )
		{
			message = 'You need to choose a map before starting.';
		}
		
		if( !this.showingDialog && (forceShowAlert || !this.recentAlert ) )
		{
			this.recentAlert = true;
			setTimeout( function(thisObj){
				thisObj.recentAlert = false;
			}, 30000, this );

			dlgDiv = domConstruct.create( 'div', {} );

			domConstruct.create('span',{innerHTML: message }, dlgDiv )

			domConstruct.create('br',{}, dlgDiv )
			domConstruct.create('br',{}, dlgDiv )

			closeButton = new Button({
				label: 'Close',
				onClick: lang.hitch(this, function(){
					dlg.hide();
					this.showingDialog = false;
				})
			}).placeAt(dlgDiv);

			dlg = new Dialog({
				title: "You are missing content",
				style: "width: 450px",
				content: dlgDiv,
				onHide: lang.hitch(this, function(){
					this.showingDialog = false;
				})
			});
			this.showingDialog = true;
			dlg.show();
		}

		return false;

	},

	togglePlayState: function()
	{
		/*
		if( this.specState )
		{
			if( !this.syncCheckDialog( 'You cannot participate in the battle because you are missing content. It will be automatically downloaded.', true ) )
			{
				return;
			}
		}
		*/
		this.specState = !this.specState;
		this.updatePlayState();
	},
	updateFaction: function(value)
	{
		this.faction = value;
		this.updatePlayState();
	},
	setColor: function(value)
	{
		this.teamColor = value;
		this.updatePlayState();
	},
	updatePlayState: function()
	{
	},
	
	
	addPlayerByName: function( pname )
	{
		var line, user, ateam, aiNum;
		var source;
		
		user = this.users[pname];
		user.playerNum = this.playerNum;
		this.playerNum += 1;

		if( user.owner !== '' )
		{
			aiNum = this.aiNum
			this.bots[pname] = aiNum;
			this.aiNum += 1;
		}
		else
		{

		}

		this.players[pname] = user;
		this.playerListNode.addUser(user);
		line = pname + ' has joined the battle.';
		if( pname in this.bots )
		{
			line = 'Bot: ' + pname + ' has been added.';
		}

		if( pname === this.nick )
		{
			//this.updatePlayState();
		}

		if( this.gotStatuses )
		{
			this.addLine( line, 'chatJoin' );
		}

		//for updating the player list
		setTimeout( function(thisObj){
			thisObj.resizeAlready2();
		}, 400, this );
	},


	remPlayerByName: function( pname )
	{
		var line, user;
		var source;
		
		user = this.users[pname];

		//fixme: this errored user=undefined
		this.playerListNode.removeUser(user);

		line = pname + ' has left the battle.';
		if( pname in this.bots )
		{
			line = 'Bot: ' + pname + ' has been removed.';
			delete this.bots[pname];
			delete this.users[pname];
		}

		delete this.players[pname];

		this.addLine( line, 'chatLeave' );
		if( pname === this.nick )
		{
			this.closeBattle();
		}
	},


	addStartRect: function(allianceId, x1, y1, x2, y2)
	{
		this.startRects[allianceId] = [x1, y1, x2, y2];
		this.battleMap.addStartRect(allianceId, x1, y1, x2, y2)
	},
	remStartRect: function(allianceId)
	{
		delete this.startRects[allianceId];
		this.battleMap.remStartRect(allianceId);
	},

	removeScriptTag: function(key)
	{
		delete this.extraScriptTags[key];
		if( this.gotGame && key.toLowerCase().match( /game\/modoptions\// ) )
		{
			optionKey = key.toLowerCase().replace( 'game/modoptions/', '' );
			this.modOptions.updateModOption({key: optionKey, value: null})
		}
		if( this.gotGame && key.toLowerCase().match( /game\/mapoptions\// ) )
		{
			if( this.battleMap.modOptions )
			{
				optionKey = key.toLowerCase().replace( 'game/mapoptions/', '' );
				this.battleMap.modOptions.updateModOption({key: optionKey, value: null}  );
			}
			else
			{
				/*
					uncommon scenario: map changes, setting map and gotmap, modoptions are loading,
					but before they are finished loading, lobby calls SETSCRIPTTAGS game/mapoptions and arrive here
					where this.battleMap.modOptions is null.
					
					Can try setting this.gotmap only after this.battleMap.modOptions is loaded, but it is not exact.
					Can try setting other variable after modoption is loaded, but it would be no different than current if block
				*/
			}
		}
		
	},

	setScriptTag: function(key, val)
	{
		var optionKey;
		var user;
		var userName;

		//this.scriptManager.addScriptTag(key, val);
		this.extraScriptTags[key.toLowerCase()] = (''+val).toLowerCase();

		if( this.gotGame && key.toLowerCase().match( /game\/modoptions\// ) )
		{
			optionKey = key.toLowerCase().replace( 'game/modoptions/', '' );
			this.modOptions.updateModOption({key: optionKey, value: val}  );
		}
		if( this.gotMap && key.toLowerCase().match( /game\/mapoptions\// ) )
		{
			if( this.battleMap.modOptions )
			{
				optionKey = key.toLowerCase().replace( 'game/mapoptions/', '' );
				this.battleMap.modOptions.updateModOption({key: optionKey, value: val}  );
			}
			else
			{
				/*
					uncommon scenario: map changes, setting map and gotmap, modoptions are loading,
					but before they are finished loading, lobby calls SETSCRIPTTAGS game/mapoptions and arrive here
					where this.battleMap.modOptions is null.
					
					Can try setting this.gotmap only after this.battleMap.modOptions is loaded, but it is not exact.
					Can try setting other variable after modoption is loaded, but it would be no different than current if block
				*/
			}
		}
		
		userName = key.match('game/players/(.*)/skill')
		if( userName !== null )
		{
			userName = userName[1];
			
			user = this.getPlayerNameByLowerCase(userName)
			if( user !== null )
			{
				user.skill = val;
			}
		}
		
		if( key.toLowerCase() === 'game/hosttype' && val === 'SPADS' )
		{
			this.spads = true;
		}
	},
	
	getPlayerNameByLowerCase: function(userName)
	{
		var user;
		var curUserName;
		
		user = this.players[userName]
		if( user )
		{
			return user;
		}
		for( curUserName in this.players )
		{
			if( curUserName.toLowerCase() === userName )
			{
				return this.players[curUserName]
			}
		}
		return null;
	},

	generateScript: function()
	{
		var scriptManager, startRect, x1, y1, x2, y2, name, aiNum,
			teams, teamLeader, alliances, alliance,
			numUsers, numPlayers, allianceNum, alliance,
			teamNum, team, scriptCountry
			;
			
		if( this.scriptMissionScript !== null && typeof this.scriptMissionScript !== 'undefined' && this.scriptMissionScript !== '' )
		{
			return this.scriptMissionScript;
		}
		
		
		teams = {};
		alliances = {};
		numUsers = 0;
		numPlayers = 0;

		scriptManager = new ScriptManager({});

		scriptManager.addScriptTag( "game/HostIP", 		this.hosting ? '127.0.0.1' : this.ip );
		scriptManager.addScriptTag( "game/HostPort", 	this.hostPort );
		scriptManager.addScriptTag( "game/IsHost", 		this.hosting ? '1' : '0' );
		scriptManager.addScriptTag( "game/MyPlayerName", this.nick );
		if( this.scriptPassword !== '')
		{
			scriptManager.addScriptTag( "game/MyPasswd", 	this.scriptPassword );
		}
		if( !this.hosting )
		{
			return scriptManager.getScript();
		}
		
		scriptManager.addScriptTag( "game/GameType", 	this.game );
		scriptManager.addScriptTag( "game/MapName", 	this.map );
		scriptManager.addScriptTag( "game/SourcePort", 	this.sourcePort );
		scriptManager.addScriptTag( "game/modhash", this.gameHash );
		scriptManager.addScriptTag( "game/maphash", this.mapHash );
		
		scriptManager.addScriptTag( "game/nohelperais", 0 ); //fixme
		//scriptManager.addScriptTag( "game/onlylocal", this.local ? 1 : 0 );
		scriptManager.addScriptTag( "game/startPosType", 2 ); //fixme
		
		
		

		for( key in this.extraScriptTags )
		{
			val = this.extraScriptTags[key]
			scriptManager.addScriptTag(key, val);
		}
		
		for( name in this.players )
		{
			numUsers += 1;
			user = this.players[name];
			scriptCountry = user.country === 'unknown' ? '' : user.country;
			if( name in this.bots )
			{
				aiNum = this.bots[name]
				scriptManager.addScriptTag( 'game/AI' + aiNum + '/Team', user.teamNumber );
				scriptManager.addScriptTag( 'game/AI' + aiNum + '/ShortName', user.ai_dll );
				scriptManager.addScriptTag( 'game/AI' + aiNum + '/Name', user.name );
				//scriptManager.addScriptTag( 'AI' + aiNum + '/Version', '' );
				scriptManager.addScriptTag( 'game/AI' + aiNum + '/IsFromDemo', 0 );
				scriptManager.addScriptTag( 'game/AI' + aiNum + '/Spectator', user.isSpectator ? 1 : 0 );
				scriptManager.addScriptTag( 'game/AI' + aiNum + '/host', this.players[user.owner].playerNum );
				scriptManager.addScriptTag( 'game/AI' + aiNum + '/CountryCode', scriptCountry );
				
				teamLeader = this.players[user.owner].playerNum;
			}
			else
			{
				numPlayers += 1;
			
				if( !user.isSpectator )
				{
					scriptManager.addScriptTag( 'game/PLAYER' + user.playerNum + '/Team', user.teamNumber );
				}
				scriptManager.addScriptTag( 'game/PLAYER' + user.playerNum + '/Name', user.name );
				scriptManager.addScriptTag( 'game/PLAYER' + user.playerNum + '/Spectator', user.isSpectator ? 1 : 0 );
				scriptManager.addScriptTag( 'game/PLAYER' + user.playerNum + '/Rank', user.rank );
				scriptManager.addScriptTag( 'game/PLAYER' + user.playerNum + '/CountryCode', scriptCountry );
				scriptManager.addScriptTag( 'game/PLAYER' + user.playerNum + '/isfromdemo', 0 );
				//lobbyID? lobbyrank?
				if( user.scriptPassword !== '' )
				{
					scriptManager.addScriptTag( 'game/PLAYER' + user.playerNum + '/Password', user.scriptPassword );
				}
				
				teamLeader = user.playerNum;
			}
			teams[user.teamNumber] = {
				allyTeam: user.allyNumber,
				teamleader: teamLeader,
				side: user.side,
				color: (user.r/256) + ' ' + (user.g/256) + ' ' + (user.b/256)
			}
			alliances[user.allyNumber] = {
			
			}
		}
		scriptManager.addScriptTag( "game/numPlayers", numPlayers ); //fixme
		scriptManager.addScriptTag( "game/numUsers", numUsers ); //fixme
	
		for( teamNum in teams )
		{
			team = teams[teamNum]
			scriptManager.addScriptTag( 'game/TEAM' + teamNum + '/allyTeam', team.allyTeam );
			scriptManager.addScriptTag( 'game/TEAM' + teamNum + '/teamleader', team.teamleader );
			scriptManager.addScriptTag( 'game/TEAM' + teamNum + '/side', this.factions[ team.side ] );
			scriptManager.addScriptTag( 'game/TEAM' + teamNum + '/rgbcolor', team.color );
			scriptManager.addScriptTag( 'game/TEAM' + teamNum + '/handicap', '' );
		}
		
	
		for( allianceNum in alliances )
		{
			alliance = alliances[allianceNum];
			scriptManager.addScriptTag( 'game/ALLYTEAM' + allianceNum + '/NumAllies', 	0 );
			if( allianceNum in this.startRects )
			{
				startRect = this.startRects[allianceNum];
				x1 = startRect[0];
				y1 = startRect[1];
				x2 = startRect[2];
				y2 = startRect[3];
				scriptManager.addScriptTag( 'game/ALLYTEAM' + allianceNum + '/StartRectLeft', 	x1/200 );
				scriptManager.addScriptTag( 'game/ALLYTEAM' + allianceNum + '/StartRectTop', 	y1/200 );
				scriptManager.addScriptTag( 'game/ALLYTEAM' + allianceNum + '/StartRectRight', 	x2/200 );
				scriptManager.addScriptTag( 'game/ALLYTEAM' + allianceNum + '/StartRectBottom', y2/200 );
			}
		}
		
		//console.log( scriptManager.getScript() );
		return scriptManager.getScript();

	}, //generateScript

	getEmptyTeam: function(userName)
	{
		var user, teams, emptyTeam, name, team, name;
		teams = {};
		for( name in this.players )
		{
			if( name !== userName )
			{
				user = this.players[name];
				if( !user.isSpectator )
				{
					teams[user.teamNumber+0] = true;
				}
			}
		}
		emptyTeam = 0;
		while( emptyTeam in teams )
		{
			emptyTeam += 1;
		}
		return emptyTeam;
	},

	getEmptyAllyTeams: function()
	{
		var emptyAllyTeams, i, name, user, allyNumber, indexOfAllyNumber;
		emptyAllyTeams = []
		for(i=0; i<16; i++)
		{
			emptyAllyTeams[i] = i;
		}
		for( name in this.players )
		{
			user = this.players[name];
			if( !user.isSpectator )
			{
				allyNumber = parseInt( user.allyNumber );
				indexOfAllyNumber = array.indexOf(emptyAllyTeams, allyNumber);
				if( indexOfAllyNumber !== -1 )
				{
					emptyAllyTeams.splice( indexOfAllyNumber, 1 )
				}
			}
		}

		return emptyAllyTeams;
	},

	editBot: function(botName)
	{
		var dlg, mainDiv, teamText, teamSelect, teamOptions, i;
		var botRemoveButton;
		var name, bot, colorChooser, colorChooserButton;

		botName =  '<BOT>'+botName;
		bot = this.users[botName];
		if( !bot )
		{
			console.log('GameBot> Error: no such bot ' + botName)
		}
		name = bot.name;
		

		mainDiv = domConstruct.create('div', {style: {minWidth: '250px' }} );

		domConstruct.create('span', {innerHTML: 'Team: '}, mainDiv)
		teamOptions = [];
		for(i=1; i<=16; i+=1)
		{
			teamOptions.push({label: i, value: i+''})
		}

		teamSelect = new Select({
			value: (parseInt(bot.allyNumber)+1)+'',
			style: {width: '50px'},
			options: teamOptions,
			onChange: lang.hitch( this, function(val){
				var allyNumber;
				allyNumber = parseInt( teamSelect.get('value') );
				allyNumber = isNaN(allyNumber) ? 1 : allyNumber;
				allyNumber -= 1;
				this.users[botName].setStatusVals({
					allyNumber: allyNumber,
					isSpectator: false,
					isReady: true,
					teamNumber: this.getEmptyTeam(botName),
					//'syncStatus':this.synced ? 'Synced' : 'Unsynced'
					syncStatus: 'Synced'
				});
				if(this.local)
				{
					this.users[botName].processBattleStatusAndColor();
				}
				else
				{
					this.users[botName].sendBattleStatus(true);
				}
				dlg.destroy();
			})
		}).placeAt(mainDiv);

		colorChooser = new ColorPalette({
			value: this.users[botName].color,
			onChange: lang.hitch( this, function(val){
			
				if( typeof val === 'undefined')
				{
					return;
				}
				//this.users[botName].setTeamColor( colorChooser.get('value') );
				this.users[botName].setTeamColor( val );
				if(this.local)
				{
					this.users[botName].processBattleStatusAndColor();
				}
				else
				{
					this.users[botName].sendBattleStatus(true);
				}
				dlg.destroy();
			})
		});
		colorChooserButton = new DropDownButton({
				iconClass: 'smallIcon colorsImage',
				showLabel: false,
				label: 'Choose team color',
				dropDown: colorChooser
				
		}).placeAt(mainDiv);

		
		botRemoveButton = new Button({
			iconClass: 'smallIcon closeImage',
			showLabel: false,
			label: 'Remove Bot',
			onClick: lang.hitch(this, function(){
				var smsg;
				if( this.local )
				{
					this.remPlayerByName( botName );
				}
				else
				{
					smsg = 'REMOVEBOT ' + name;
					topic.publish( 'Lobby/rawmsg', {msg: smsg } );
				}
				dlg.destroy();
			})
		}).placeAt(mainDiv);

		
		dlg = new TooltipDialog({
			content: mainDiv,
			style: { width: '200px' },
		})
		return dlg;

	},
	
	engineSelectChangeFreeze: false,
	engineSelectChange: function(val)
	{
		if( this.engineSelectChangeFreeze )
		{
			return;
		}
		this.engine = val;
		this.updateGameSelect();
	},
	
	updateDirectHostingForm: function()
	{
		var engineVersions;
		var engineOptions;
		
		engineVersions = this.appletHandler.getEngineVersions();
		if( engineVersions.length === 0 )
		{
			alert2('You do not have any version of the engine. You can log onto the multi player server and it will download an engine for you.')
			return;
		}
		engineOptions = [];
		array.forEach( engineVersions, function(engineVersion){
			engineOptions.push( { label: engineVersion, value: engineVersion} )
		});
		engineOptions.reverse();
		
		this.engine = engineOptions[0].value;
		
		this.engineSelectChangeFreeze = true;
		this.engineSelect.removeOption(this.engineSelect.getOptions());
		array.forEach( engineOptions, function(engineOption){
			this.engineSelect.addOption(engineOption)
		}, this);
		this.engineSelectChangeFreeze = false;
		
		//echo('updateDirectHostingForm', this.engine)
		this.updateGameSelect();
	},
	
	updateRapidTag: function(val) {},
	newBattleAdvancedToggle: function(val) {},
	createGameButtonClick: function(val) {},
	changeHostTab: function(val) {},


	blank: null
}); });//define lwidgets/Battleroom
