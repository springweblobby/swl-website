///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/BattleRoom',
	[
		"dojo/_base/declare",

		//"dojo",
		//"dijit",

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
		'lwidgets/ModOptions',
		'lwidgets/GameBots',
		'lwidgets/BattleMap',
		'lwidgets/BattlePlayerList',
		'lwidgets/ScriptManager',
		'lwidgets/ToggleIconButton',
		
		'dijit/ColorPalette',
		'dijit/form/Button',
		'dijit/form/DropDownButton',
		'dijit/form/Select',
		'dijit/Dialog',
		'dijit/ProgressBar',
		'dijit/Tooltip',
		'dijit/TooltipDialog',
		
		//extras
		'dojo/dom', //needed for widget.placeAt to work now

		'dojox/encoding/base64'
	],
	function(declare,
		//dojo, dijit,
		template, array,
		domConstruct, domStyle, domAttr, lang, topic, event, on,
		lwidgets, Chat, ModOptions, GameBots, BattleMap, BattlePlayerList, ScriptManager, ToggleIconButton,
		ColorPalette,
		Button,
		DropDownButton,
		Select,
		Dialog,
		ProgressBar,
		Tooltip,
		TooltipDialog
	){
	return declare( [ Chat ], {

	'templateString' : template,

	'parseOnLoad':false,

	'name':'',
	'host':'',
	'map':'',
	'game':'',
	'gameHash':'',
	'mapHash':'',
	'faction':0,
	'serverEngineVersion':0,
	'engine':'0',

	'battleId':0,

	'specState':true,
	'allianceId':0,
	'teamId':0,
	'runningGame':false,

	'playerlistNode':null,
	'players' : null,
	'ateams':null,
	'ateamNumbers':null,
	'battleListStore':null,		//mixed in

	'bots':null,
	'factions':null,

	'appletHandler':null, //mixed in
	'downloadManager':null, //mixed in

	'synced':false,

	'gotMap':false,
	'gotGame':false,
	'gotEngine':false,
	'gameHashMismatch':false,
	'showingDialog':false,

	'recentAlert':false,
	'gotStatuses':false,

	'modOptions':null,
	'gameBots':null,

	'gameIndex':false,
	'mapIndex':false,
	
	'factionsLoaded':false,
	
	'inBattle':false,

	'loadedBattleData':false,

	'gameDownloadProcessName':'',

	'scriptPassword':'',

	'aiNum':0,
	'playerNum':0,
	'startRects':null,

	'playStateButton':null,

	'extraScriptTags':null,
	
	'sourcePort':8300,
	
	'gameWarningIcon':null,
	'gameWarningIconDiv':null,

	'postCreate2':function()
	{
		this.commonSetup();
		
		
		this.postCreate3();
	}, //postcreate2
	
	'postCreate3':function()
	{
	},
	'sayYes':function()
	{
	},
	'sayNo':function()
	{
	},
	
	
	'getUnitsync':function()
	{
		return this.appletHandler.getUnitsync(this.engine);
	},
	
	'setAlliance':function( allianceId )
	{
		var isSpec;
		isSpec = allianceId === 'S';
		/*
		if( !isSpec && !this.syncCheckDialog( 'You cannot participate in the battle because you are missing content. It will be automatically downloaded.', false ) )
		{
			allianceId = 'S';
			isSpec = true;
		}
		*/
		allianceId = parseInt( allianceId );
		if( isNaN(allianceId) )
		{
			allianceId = 0;
		}
		this.playStateButton.setChecked( !isSpec );
		this.specState = isSpec;
		this.allianceId = allianceId;
		this.sendPlayState();
	},
	
	'commonSetup':function()
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
			'connectId':[this.factionSelect.domNode],
			'position':['below'],
			'label':'Choose your faction.'
		});

		this.playStateButton = new ToggleIconButton({
			'checkedIconClass':'tallIcon playImage',
			'uncheckedIconClass':'tallIcon specImage',
			'checked':false,
			'checkedLabel':'Playing. Click to spectate.',
			'uncheckedLabel':'Spectating. Click to play.',
			'onClick':lang.hitch(this, 'togglePlayState' )
		}).placeAt(this.togglePlayStateNode);
		
		this.battleMap = new BattleMap({
			'appletHandler':this.appletHandler,
			'battleRoom':this
		}).placeAt(this.battleMapDiv);
		//this.playerListNode = new BattlePlayerList({}).placeAt(this.playerListDiv);
		this.playerListNode = new BattlePlayerList({
			'nick':this.nick,
			'style':{'width':'100%', 'height':'100%', 'fontSize':'small' },
			'battleRoom':this
		});

		//this.mainContainer.on( 'mouseup', this.battleMap, 'updateMapDiv' )

	},


	'resizeAlready2':function()
	{
		//this.playerListNode.startup2();
		this.battleMap.updateMapDiv();
		this.playerListNode.resizeAlready();
	},
	'startup2':function()
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
	
	'reloadUnitsync':function()
	{
		this.appletHandler.refreshUnitsync(this.engine);
	},


	'makeBattle':function()
	{
		topic.publish('Lobby/makebattle');
	},


	'startGameClick':function()
	{
		if( !this.hosting && !this.players[this.host].isInGame )
		{
			alert2('The host hasn\'t started the game yet.');
			return;
		}
		this.startGame();
	},
	
	'startGame':function()
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
			this.appletHandler.startSpring( this.generateScript(), this.engine );
			return;
		}
		var dlg;
		var dlgDiv;
		var okButton;
		var cancelButton;
		dlgDiv = domConstruct.create('div', {'innerHTML': 'Game is in progress. Launch?' });
		
		okButton = new Button({
			'label':'OK',
			'onClick':lang.hitch(this, function(){
				dlg.hide();
				this.appletHandler.startSpring( this.generateScript(), this.engine )
			})
		}).placeAt(dlgDiv);
			
		cancelButton = new Button({
			'label':'Cancel',
			'onClick':lang.hitch(this, function(){
				dlg.hide();
			})
		}).placeAt(dlgDiv);
			
		dlg = new Dialog({
			'title': "Launch Spring?",
			'style': "width: 450px",
			'content':dlgDiv
			
		});
		dlg.show();
		//console.log(this.generateScript());
		//this.appletHandler.startSpring( this.generateScript(), this.engine )

	},
	'setTitle': function( title )
	{
		domAttr.set( this.titleText, 'innerHTML',
			'<b>' + title + '</b>'
			+ '<br />'
			//+ '<a href="' + this.getGameDownloadUrl() + '" target="_blank" class="topicDiv" style="color: '+this.settings.settings.headerTextColor+'" >'
			+ '<a href="' + this.getGameDownloadUrl() + '" target="_blank" class="topicDiv"  >'
			+ this.game
			+ '</a> - '
			+ '<i>Engine version ' + this.engine + '</i>'
		);
		
		if( this.gameWarningIconDiv !== null ) //not used in single player
		{
			domConstruct.place( this.gameWarningIconDiv, this.titleText);
		}	
	},
	
	'extractEngineVersion':function(title)
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
	
	'joinBattle':function( data )
	{
	},
	

	'unitsyncRefreshed':function()
	{
		this.setSync();
		this.sendPlayState();
	},
	
	'getGameIndex':function()
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
	'getMapChecksum':function()
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
	
	'setSync':function()
	{
	
	},
	
	
	'focusDownloads':function(e)
	{
		event.stop(e);
		topic.publish('Lobby/focusDownloads' );
	},
	'updateBar':function(data)
	{
		if( data.processName === this.gameDownloadProcessName )
		{
			this.gameDownloadBar.update( {'progress': data.perc } );
			this.gameDownloadBar.set( {'label': 'Game ' + data.perc + '%' } );
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
	'showGameDownloadBar':function()
	{
		domStyle.set( this.gameDownloadBar.domNode, 'display', 'block');
	},
	'hideGameDownloadBar':function()
	{
		this.gameDownloadProcessName = '';
		domStyle.set( this.gameDownloadBar.domNode, 'display', 'none');
	},
	'showEngineDownloadBar':function()
	{
		domStyle.set( this.engineDownloadBar.domNode, 'display', 'block');
	},
	'hideEngineDownloadBar':function()
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
	'_asLittleEndianHex':function(value, bytes) {
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
	
	'loadFactions':function() //note, loadmodoptions first does addallarchives so it must be called before this. fixme
	{
		var listOptions, factionCount, i, factionName;
		if( this.factionsLoaded )
		{
			return;
		}
		factionCount = this.getUnitsync().getSideCount();
		listOptions = [];
		this.factions = [];
		this.factionSelect.removeOption(this.factionSelect.getOptions());
		for( i=0; i<factionCount; i++ )
		{
			factionName = this.getUnitsync().getSideName(i);
			this.factionSelect.addOption({ 'value':i, 'label':factionName })
			this.factions[i] = factionName;
			
			//testing
			/** /
			var sidePath, fd, size, buff;
			sidepath = 'SidePics/' + factionName + '.png';
			fd = this.getUnitsync().openFileVFS(sidepath);
			if( !fd )
			{
				sidepath = 'SidePics/' + factionName + '.bmp';
				fd = this.getUnitsync().openFileVFS(sidepath);
			}
			size = this.getUnitsync().fileSizeVFS(fd);
			
			buff = this.appletHandler.jsReadFileVFS( fd, size, this.engine );
			
			this.getUnitsync().closeFileVFS(fd);
			
			console.log('buff', sidepath, size, buff.length)
			console.log( 'typeof buff', typeof buff )
			
			var str, str64, strTest, testStr64;
			str = '';
			str64 = '';
			
			
			var buffarr = []
		
			var start = 56;
			strTest = '';
			for(var j = 0; j < start; j+=1)
			{
				strTest += String.fromCharCode( buff[j] );
				str += String.fromCharCode( buff[j] );
			}
			strTest = 
				'BM' +               // "Magic Number"
                this._asLittleEndianHex( 822+54, 4) +     // size of the file (bytes)*
                '\x00\x00' +         // reserved
                '\x00\x00' +         // reserved
                '\x36\x00\x00\x00' + // offset of where BMP data lives (54 bytes)
                '\x28\x00\x00\x00' + // number of remaining bytes in header from here (40 bytes)
                this._asLittleEndianHex( 16,4) +              // the width of the bitmap in pixels*
                this._asLittleEndianHex( 16,4) +             // the height of the bitmap in pixels*
                '\x01\x00' +         // the number of color planes (1)
                '\x18\x00' +         // 24 bits / pixel
                '\x00\x00\x00\x00' + // No compression (0)
                this._asLittleEndianHex( 822, 4) +     // size of the BMP data (bytes)*
                '\x13\x0B\x00\x00' + // 2835 pixels/meter - horizontal resolution
                '\x13\x0B\x00\x00' + // 2835 pixels/meter - the vertical resolution
                '\x00\x00\x00\x00' + // Number of colors in the palette (keep 0 for 24-bit)
                '\x00\x00\x00\x00'  // 0 important colors (means all colors are important)
			
			//for (var j = 0; j < buff.length; j+=1)
			for (var j = start; j < buff.length; j+=1)
			{
				buffarr.push(buff[j] + ' || ' + (buff[j] & 255) )
				//str += String.fromCharCode( parseInt( buff[j] ) & 255 );
				str += String.fromCharCode( buff[j] );
				//strTest += String.fromCharCode( buff[j] );
				//strTest += String.fromCharCode( parseInt( buff[j] ) & 255 );
				//strTest += '\x00\xff\x00';
			}
			//str = String.fromCharCode.apply(String, buff);
			
			console.log(buffarr);
			
			console.log(str )
			var str2 = '';
			
			var pixellen = 3;
			
			
			for (var j = start; j < buff.length; j+=pixellen)
			{
				if( (j-start) % (16*pixellen) === 0 )
				{
					str2 += '\n';
				}
					
				var temppixel = buff[j] + buff[j+1] + buff[j+2];
				//var temppixel = buff[j] & 255 + buff[j+1] & 255 + buff[j+2] & 255;
				
				strTest += '\xff\xff\x00';
				if( temppixel <= 0)
				{
					str2 += '.'
					//strTest += '\x00\x00\x00';
					
				}
				else
				{
					str2 += '8';
					//strTest += '\xff\xff\xff';
				}
				
				if( (j-start) % (16*pixellen) === 0 )
				{
					//strTest += '\x00\x00\x00';
				}
				
				
			}
			console.log(str2);
			
			//str64 = dojox.encoding.base64.encode( str );
			str64 = Base64.encode( str );
			//testStr64 = Base64.encode( strTest );
			//console.log(str64 )
			//console.log('sizes', str.length, str64.length)
			
			
			domConstruct.create( 'img', {'src':'img/warning.png'}, this.factionImageTest )
			domConstruct.create( 'img', {'src': 'data:image/bmp;base64,' + str64, 'title':factionName }, this.factionImageTest )
			//domConstruct.create( 'img', {'src': 'data:image/bmp;base64,' + testStr64, 'title':factionName }, this.factionImageTest )
			domConstruct.create( 'img', {'src': 'data:image/bmp,' + str, 'title':factionName }, this.factionImageTest )
			domConstruct.create( 'img', {'src': 'data:image/bmp,' + strTest, 'title':factionName }, this.factionImageTest )
			/**/
			
		}
		
		this.factionsLoaded = true;
		//refresh user icons now that we have a side data
		this.refreshUsers();
	},
	'refreshUsers':function()
	{
		var name, user;
		for( name in this.players )
		{
			user = this.players[name];
			topic.publish('Lobby/battle/playerstatus', {'name':name, user:user } );
		}
	},

	'loadModOptions':function()
	{
		var dlg, val;
		if( this.modOptions !== null )
		{
			return;
		}
		this.modOptions = new ModOptions({
			'appletHandler':this.appletHandler,
			'gameIndex':this.gameIndex,
			'battleRoom':this
		})

		for( key in this.extraScriptTags )
		{
			val = this.extraScriptTags[key]
			if( key.toLowerCase().match( /game\/modoptions\// ) )
			{
				optionKey = key.toLowerCase().replace( 'game/modoptions/', '' );
				this.modOptions.updateModOption({'key': optionKey, 'value':val}  );
			}
		}

	},

	'loadGameBots':function()
	{
		var dlg, gameBots;
		if( this.gameBots !== null )
		{
			return;
		}
		this.gameBots = new GameBots({
			'appletHandler':this.appletHandler,
			'gameIndex':this.gameIndex,
			'users':this.users,
			'battleRoom':this
		});
	},


	//function needed for template dojoattachevent
	'showModOptions':function()
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

	'showGameBots':function(team)
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



	'updateBattle':function(data)
	{
		if( this.battleId !== data.battleId )
		{
			return;
		}
		if( typeof data.map !== 'undefined' )
		{
			this.map = data.map;
		}
		this.setSync();
		this.battleMap.setMap( this.map );
	},


	'leaveBattle':function()
	{
		var smsg;
		this.inBattle = false;
		if( !this.local )
		{
			smsg = 'LEAVEBATTLE'
			topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
		}
		this.closeBattle();


	},

	'closeBattle':function( )
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
	},

	'getGameDownloadUrl':function() {
		if (this.game.indexOf("Zero-K") != -1) { // check if the string contains Zero-K

			return 'http://packages.springrts.com/builds/?C=M;O=D';
		} else {
			return 'http://springfiles.com/finder/1/' + this.game;
		}
	},

	'syncCheckDialog':function( message, forceShowAlert )
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

			domConstruct.create('span',{'innerHTML': message }, dlgDiv )

			domConstruct.create('br',{}, dlgDiv )
			domConstruct.create('br',{}, dlgDiv )

			closeButton = new Button({
				'label':'Close',
				'onClick':lang.hitch(this, function(){
					dlg.hide();
					this.showingDialog = false;
				})
			}).placeAt(dlgDiv);

			dlg = new Dialog({
				'title': "You are missing content",
				'style': "width: 450px",
				'content':dlgDiv,
				'onHide':lang.hitch(this, function(){
					this.showingDialog = false;
				})
			});
			this.showingDialog = true;
			dlg.show();
		}

		return false;

	},

	'togglePlayState':function()
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
		this.sendPlayState();
	},
	'updateFaction':function(value)
	{
		this.faction = value;
		this.sendPlayState();
	},
	'setColor':function(val)
	{
		this.users[this.nick].setTeamColor(val);
		this.sendPlayState();
	},
	'sendPlayState':function()
	{
	
	},
	
	
	'addPlayerByName':function( pname )
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
			//this.sendPlayState();
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


	'remPlayerByName':function( pname )
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


	'addStartRect':function(allianceId, x1, y1, x2, y2)
	{
		this.startRects[allianceId] = [x1, y1, x2, y2];
		this.battleMap.addStartRect(allianceId, x1, y1, x2, y2)
	},
	'remStartRect':function(allianceId)
	{
		delete this.startRects[allianceId];
		this.battleMap.remStartRect(allianceId);
	},

	'removeScriptTag':function(key)
	{
		delete this.extraScriptTags[key];
		if( this.gotGame && key.toLowerCase().match( /game\/modoptions\// ) )
		{
			optionKey = key.toLowerCase().replace( 'game/modoptions/', '' );
			this.modOptions.updateModOption({'key': optionKey, 'value':null})
		}
	},

	'setScriptTag':function(key, val)
	{
		var optionKey;
		var user;
		var userName;

		//this.scriptManager.addScriptTag(key, val);
		this.extraScriptTags[key.toLowerCase()] = (''+val).toLowerCase();

		if( this.gotGame && key.toLowerCase().match( /game\/modoptions\// ) )
		{
			optionKey = key.toLowerCase().replace( 'game/modoptions/', '' );
			this.modOptions.updateModOption({'key': optionKey, 'value':val}  );
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
	},
	
	'getPlayerNameByLowerCase':function(userName)
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

	'generateScript':function()
	{
		var scriptManager, startRect, x1, y1, x2, y2, name, aiNum,
			teams, teamLeader, alliances, alliance,
			numUsers, numPlayers, allianceNum, alliance,
			teamNum, team, scriptCountry
			;
		
		
		teams = {};
		alliances = {};
		numUsers = 0;
		numPlayers = 0;

		scriptManager = new ScriptManager({});

		scriptManager.addScriptTag( "game/HostIP", 		this.ip );
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
				'allyTeam':user.allyNumber,
				'teamleader':teamLeader,
				'side':user.side,
				'color':(user.r/256) + ' ' + (user.g/256) + ' ' + (user.b/256)
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

	'getEmptyTeam':function(userName)
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

	'getEmptyAllyTeams':function()
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

	'editBot':function(botName)
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
		

		mainDiv = domConstruct.create('div', {'style':{'minWidth':'250px' }} );

		domConstruct.create('span', {'innerHTML':'Team: '}, mainDiv)
		teamOptions = [];
		for(i=1; i<=16; i+=1)
		{
			teamOptions.push({'label':i, 'value':i+''})
		}

		teamSelect = new Select({
			'value':(parseInt(bot.allyNumber)+1)+'',
			'style':{'width':'50px'},
			'options':teamOptions,
			'onChange':lang.hitch( this, function(val){
				var allyNumber;
				allyNumber = parseInt( teamSelect.get('value') );
				allyNumber = isNaN(allyNumber) ? 1 : allyNumber;
				allyNumber -= 1;
				this.users[botName].setStatusVals({
					'allyNumber':allyNumber,
					'isSpectator':false,
					'isReady':true,
					'teamNumber':this.getEmptyTeam(botName),
					//'syncStatus':this.synced ? 'Synced' : 'Unsynced'
					'syncStatus':'Synced'
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
			'value':this.users[botName].color,
			'onChange':lang.hitch( this, function(val){
			
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
				'iconClass':'smallIcon colorsImage',
				'showLabel':false,
				'label':'Choose team color',
				'dropDown':colorChooser
				
		}).placeAt(mainDiv);

		
		botRemoveButton = new Button({
			'iconClass':'smallIcon closeImage',
			'showLabel':false,
			'label':'Remove Bot',
			'onClick':lang.hitch(this, function(){
				var smsg;
				if( this.local )
				{
					this.remPlayerByName( botName );
				}
				else
				{
					smsg = 'REMOVEBOT ' + name;
					topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
				}
				dlg.destroy();
			})
		}).placeAt(mainDiv);

		
		dlg = new TooltipDialog({
			'content':mainDiv,
			'style':{ 'width':'200px' },
		})
		return dlg;

	},


	'blank':null
}); });//define lwidgets/Battleroom
