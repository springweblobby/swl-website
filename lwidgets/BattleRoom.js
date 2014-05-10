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
		"dojo/store/Memory",
		
		
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
		Memory,
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
	factionIcons: null,

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
		// Workaround for 91.0 unitsync crashing. This should be removed once zk finally moves on to a newer version.
		if( this.engine === "91.0" )
		{
			if( this.appletHandler.getUnitsync("91.0") === null || this.appletHandler.getUnitsync("96.0") === null )
				return null;
			else
				return this.appletHandler.getUnitsync("96.0");
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
		this.factionIcons = [];
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
			if( this.specState )
			{
				alert2("The game hasn't started yet. Either wait for it to start and watch it as a spectator or join a team (by clicking on the team button) and play with others.");
			}
			else if( this.syncCheckDialog( 'You cannot participate in the battle because you are missing content. It will be automatically downloaded.', true ) )
			{
				this.safeSay( this.spads ? '!cv start' : '!start' );
			}
		}
		else
		{
			this.startGame(true);
		}
	},
	
	startGame: function(instant)
	{
		var aiNum, name;
		var uriContent, newWindow;
		var dlg;

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
		
		
		if( instant )
		{
			this.appletHandler.startSpringScript( this.generateScript(), this.engine );
		}
		else
		{
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
		}

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
		
		var gameOptionsStore = new Memory({ });
		
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
			
			
			//this.gameSelect.set( 'options', games )
			
			
			
			
			//gameOptionsStore.put( { label: 'Loading Games, please wait...', id: '' } );
			gameOptionsStore.put( { name: modName, label: modName, id: i+'' } );
			/*
			var items;
			items = gameOptionsStore.query({id: new RegExp('.*') });
			array.forEach(items, function(item){
				gameOptionsStore.remove(item.id)
			}, this);
			*/
			//gameOptionsStore.put( { label: 'Loading Games, please wait...', id: '' } );
			
			
			if(setFirst)
			{
				//this.gameSelect.set( 'value', i+'' )
				setFirst = false;
			}
		}
		this.gameSelect.set( 'store', gameOptionsStore );
		this.gameSelect.set( 'queryExpr', '*${0}*' ); //when placed in the template, it interprets the {} as some sort of var
	},
	
	getGameIndex: function()
	{
		var gameIndex;
		//console.log(this.getUnitsync())
		gameIndex = parseInt( this.getUnitsync().getPrimaryModIndex( this.game ) );
		//echo(' ========== Got game? ' + this.engine + ": " + this.game + ": " + gameIndex)
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
		this.gameDownloadBar.update( {progress: 0} );
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
		var fd, size, iconType, strRep;
		iconType = 'image/png';
		fd = this.getUnitsync().openFileVFS( 'SidePics/' + factionName + '.png' );
		if( fd === 0 )
		{
			//sidepath = 'SidePics/' + factionName + '_16.png';
			iconType = 'image/bmp';
			fd = this.getUnitsync().openFileVFS( 'SidePics/' + factionName + '.bmp' );
			if( fd === 0 )
			{
				console.log("Could not load faction icon for " + factionName);
				return "";
			}
		}

		size = this.getUnitsync().fileSizeVFS(fd);
		strRep = this.getUnitsync().jsReadFileVFS( fd, size );
		this.getUnitsync().closeFileVFS(fd);
		
		return 'data:' + iconType + ',' + strRep;
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
			this.factions[i] = factionName;
			this.factionIcons[factionName] = this.getFactionIcon(factionName);
			
			this.factionSelect.addOption({ value: i,
				label: "<img src=" + this.factionIcons[factionName] + "> " + factionName })
			
			
			
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
			this.startGame(false);
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
		this.factionIcons = [];
		this.factionsLoaded = false;

		this.synced = false;
		this.gotGame = false;
		this.gotMap = false;
		this.gotEngine = false;
		
		//fixme, see mbattleroom leavebattle
		this.spads = false;
		
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

		scriptManager.addScriptTag( "game/HostIP",		this.hosting ? '127.0.0.1' : this.ip );
		scriptManager.addScriptTag( "game/HostPort",	this.hostPort );
		scriptManager.addScriptTag( "game/IsHost",		this.hosting ? '1' : '0' );
		scriptManager.addScriptTag( "game/MyPlayerName", this.nick );
		if( this.scriptPassword !== '')
		{
			scriptManager.addScriptTag( "game/MyPasswd",	this.scriptPassword );
		}
		if( !this.hosting )
		{
			return scriptManager.getScript();
		}
		
		scriptManager.addScriptTag( "game/GameType",	this.game );
		scriptManager.addScriptTag( "game/MapName",		this.map );
		scriptManager.addScriptTag( "game/SourcePort",	this.sourcePort );
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
			scriptManager.addScriptTag( 'game/ALLYTEAM' + allianceNum + '/NumAllies',	0 );
			if( allianceNum in this.startRects )
			{
				startRect = this.startRects[allianceNum];
				x1 = startRect[0];
				y1 = startRect[1];
				x2 = startRect[2];
				y2 = startRect[3];
				scriptManager.addScriptTag( 'game/ALLYTEAM' + allianceNum + '/StartRectLeft',	x1/200 );
				scriptManager.addScriptTag( 'game/ALLYTEAM' + allianceNum + '/StartRectTop',	y1/200 );
				scriptManager.addScriptTag( 'game/ALLYTEAM' + allianceNum + '/StartRectRight',	x2/200 );
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

	
	
	sendBotData:function(botName)
	{
		if(this.local)
		{
			this.users[botName].processBattleStatusAndColor();
		}
		else
		{
			this.users[botName].sendBattleStatus(true);
		}
	},
	
	
	editBot: function(botName)
	{
		var dlg, mainDiv, teamSelect, teamOptions, i;
		var botRemoveButton;
		var factionSelect;
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
				this.sendBotData(botName);
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
		
		var factionName
		var options
		options = [];
		for( i=0; i<this.factions.length; i++ )
		{
			factionName = this.factions[i]
			options.push({ value: i+'',
				label: "<img src=" + this.factionIcons[factionName] + ">" })
		}
		factionSelect = new Select({
			value: parseInt(bot.side) +'',
			style: {width: '30px'},
			options: options,
			onChange: lang.hitch( this, function(val){
				this.users[botName].setStatusVals({
					side:parseInt( val )
				});
				this.sendBotData(botName);
				dlg.destroy();
			})
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
			style: { width: '250px' },
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
