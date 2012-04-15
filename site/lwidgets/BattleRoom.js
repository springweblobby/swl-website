///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/BattleRoom',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		
		'dojo/text!./templates/battleroom.html?' + cacheString,
		'dojo/dom-construct',
		
		'lwidgets',
		'lwidgets/Chat',
		'lwidgets/ModOptions',
		'lwidgets/GameBots',
		'lwidgets/BattleMap',
		'lwidgets/BattlePlayerList',
		'lwidgets/ScriptManager',
		'lwidgets/ToggleIconButton',
		
		//extras
		
		'dijit/ColorPalette',
		'dijit/form/Button',
		'dijit/form/TextBox',
		'dijit/Dialog'
	],
	function(declare, dojo, dijit, template, domConstruct, lwidgets, Chat, ModOptions, GameBots, BattleMap, BattlePlayerList, ScriptManager, ToggleIconButton ){
	return declare( [ Chat ], {
	
	//'templateString' : dojo.cache("lwidgets", "templates/battleroom_nopane.html?" + cacheString),
	'templateString' : template,
	
	'parseOnLoad':false,
	
	'saystring':'SAYBATTLE',
	'name':'',
	'host':'',
	'map':'',
	'game':'',
	'gameHash':'',
	'faction':0,
	
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
	
	'appletHandler':null, //mixed in
	'downloadManager':null, //mixed in
	
	'synced':false,
	
	'gotMap':false,
	'gotGame':false,
	'gameHashMismatch':false,
	'showingDialog':false,
	
	'recentAlert':false,
	'gotStatuses':false,
	
	'modOptions':null,
	'gameBots':null,
	
	'gameIndex':false,
	'mapIndex':false,
	
	'loadedBattleData':false,
	
	'processName':'',
	
	'scriptManager':null,
	
	'scriptPassword':'',
	
	'aiNum':0,
	'playerNum':0,
	
	'playStateButton':null,
	
	'postCreate2':function()
	{
		var titleNode, factionTooltip;
		
		this.players = {};
		this.ateams = {};
		this.ateamNumbers = [];
		this.bots = {};
		
		this.scriptManager = new ScriptManager({});
		
		factionTooltip = new dijit.Tooltip({
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
			'onClick':dojo.hitch(this, 'togglePlayState' )
		}).placeAt(this.togglePlayStateNode)
		
		dojo.subscribe('Lobby/battles/addplayer', this, 'addPlayer' );
		dojo.subscribe('Lobby/battles/remplayer', this, 'remPlayer' );
		dojo.subscribe('Lobby/battle/playermessage', this, 'playerMessage' );
		dojo.subscribe('Lobby/battle/ring', this, 'ring' );
		dojo.subscribe('Lobby/battles/updatebattle', this, 'updateBattle' );
		dojo.subscribe('Lobby/battle/checkStart', this, 'checkStart' );
		dojo.subscribe('Lobby/unitsyncRefreshed', this, 'setSync' );
		dojo.subscribe('Lobby/download/processProgress', this, 'updateBar' );
		dojo.subscribe('Lobby/battle/editBot', this, 'editBot' );
		
		dojo.subscribe('Lobby/battle/setAlliance', this, function(data){
			
			this.playStateButton.setChecked( data.allianceId !== 'S' );
			
			if(data.allianceId === 'S')
			{
				this.specState = true;
				this.sendPlayState();
				return;
			}
			
			if( !this.syncCheck( 'You cannot participate in the battle because you are missing content.', false ) )
			{
				return;
			}
			this.specState = false;
			this.allianceId = data.allianceId;
			this.sendPlayState();
		} );
		
		this.battleMap = new BattleMap({}).placeAt(this.battleMapDiv);
		//this.playerListNode = new BattlePlayerList({}).placeAt(this.playerListDiv);
		this.playerListNode = new BattlePlayerList({
			'nick':this.nick,
			'style':{'width':'99%', 'height':'99%', 'fontSize':'small' }
		});
		
		dojo.connect(this.mainContainer, 'onMouseUp', this.battleMap, this.battleMap.updateMapDiv )
	}, //postcreate2
	
	
	'resizeAlready2':function()
	{
		//this.playerListNode.startup2();
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
	'finishedBattleStatuses':function()
	{
		this.gotStatuses = true;
		this.sendPlayState();
		this.startGame();
	},
		
	'ring':function( data )
	{
		var name, line;
		name = data.name;
		line = '*** ' + name + ' is ringing you!';
		this.addLine( line, '' );
	},
	
	'makeBattle':function()
	{
		dojo.publish('Lobby/makebattle');
	},
	
	//from User
	'checkStart':function(data)
	{
		if( data.battleId !== this.battleId )
		{
			return;
		}
		if( !this.runningGame )
		{
			this.startGame();
		}
		this.runningGame = this.players[this.host].isInGame;
	},
	
	'startGame':function()
	{
		var aiNum, name;
		if( !this.players[this.host] )
		{
			return;
		}
		if( !this.players[this.host].isInGame )
		{
			return;
		}
		
		if( this.appletHandler.getUnitsync() === null )
		{
			if( !confirm( 'Your Spring path cannot be accessed so it is not known if you have the map and game for this battle. Start anyway?' ) )
			{
				return;
			}
		}
		else if( !this.syncCheck( 'You cannot participate in the battle because you are missing content.', true ) )
		{
			return;
		}
		
		//dojo.publish('Lobby/startgame');
		
		var uriContent, newWindow;
		if( !confirm('Let\'s start Spring! \n A script file will be downloaded now. Open it with spring.exe.') )
		{
			return;
		}
		//console.log(this.scriptManager.getScript());
		
		
		for( name in this.players )
		{
			user = this.players[name];
			if( name in this.bots )
			{
				aiNum = this.bots[name]
				this.scriptManager.addScriptTag( 'AI' + aiNum + '/Team', user.teamNumber );
				this.scriptManager.addScriptTag( 'AI' + aiNum + '/ShortName', user.ai_dll );
				this.scriptManager.addScriptTag( 'AI' + aiNum + '/Name', user.name );
				//this.scriptManager.addScriptTag( 'AI' + aiNum + '/Version', '' );
				this.scriptManager.addScriptTag( 'AI' + aiNum + '/IsFromDemo', 0 );
				this.scriptManager.addScriptTag( 'AI' + aiNum + '/Spectator', user.isSpectator ? 1 : 0 );
				this.scriptManager.addScriptTag( 'AI' + aiNum + '/userNum', this.players[user.owner].playerNum );
			}
			else
			{
				this.scriptManager.addScriptTag( 'PLAYER' + user.playerNum + '/Team', user.teamNumber );
				this.scriptManager.addScriptTag( 'PLAYER' + user.playerNum + '/Name', user.name );
				this.scriptManager.addScriptTag( 'PLAYER' + user.playerNum + '/Spectator', user.isSpectator ? 1 : 0 );
				this.scriptManager.addScriptTag( 'PLAYER' + user.playerNum + '/Rank', user.rank );
				this.scriptManager.addScriptTag( 'PLAYER' + user.playerNum + '/CountryCode', user.country );
				//lobbyID? lobbyrank?
				if( user.scriptPassword !== '' )
				{
					this.scriptManager.addScriptTag( 'PLAYER' + user.playerNum + '/Password', user.scriptPassword );
				}
				
			}
			
		}
		
		
		uriContent = "data:application/x-spring-game," + encodeURIComponent( this.scriptManager.getScript() );
		newWindow = window.open(uriContent, 'script.spg');
	
	},
	
	'joinBattle':function( data )
	{
		var blistStore = this.battleListStore;
		
		delete this.scriptManager;
		this.scriptManager = new ScriptManager();
		
		this.battleId = data.battle_id;
		dojo.style( this.hideBattleNode, 'display', 'none' );
		dojo.style( this.battleDivNode, 'display', 'block' );
		
		this.sendPlayState();
		
		this.closeNode.set('disabled', false);
		
		this.resizeAlready(); //for startup
		
		this.gameHash = data.gameHash;
				
		
		blistStore.fetchItemByIdentity({
			'identity':data.battle_id,
			'scope':this,
			'onItem':function(item)
			{
				var members, playerlist, title, gameWarning, player_name;
				members 	= parseInt( blistStore.getValue(item, 'members') );
				playerlist 	= blistStore.getValue(item, 'playerlist');
				this.host	= blistStore.getValue(item, 'host');
				this.map	= blistStore.getValue(item, 'map');
				title		= blistStore.getValue(item, 'title');
				this.game 	= blistStore.getValue(item, 'game');
				
				this.setSync();
				
				dojo.attr( this.titleText, 'innerHTML',
					'<b>' + title + '</b>'
					+ '<br />'
					+ '<a href="http://springfiles.com/finder/1/' + this.game + '" target="_blank" >'
					+ this.game
					+ '</a> '
				);
				
				if(!this.gotGame )
				{
					gameWarning = this.gameHashMismatch
						? 'Your game does not match the hash for this battle! Follow the link to re-download it.'
						: 'You do not have this game! Follow the link to download it.';
					dojo.create('img', {
						'src':'img/warning.png',
						'height':'16',
						'title':gameWarning
					}, this.titleText);
				}
				
				this.battleMap.setMap( this.map );
				
				for(player_name in playerlist)
				{
					this.addPlayer( { 'battle_id':this.battleId, 'name':player_name } )
				}
				
				this.resizeAlready();
				this.loadedBattleData = true;	
			}	
		});
		
		this.generateScript();
		
	}, //joinBattle
	
	'setSync':function()
	{
		var mapChecksum, gameHash, processName, getGame;
		this.gotMap = false;
		this.gameHashMismatch = false;
		this.recentAlert = false;
		if( this.appletHandler.getUnitsync() !== null )
		{
			if( !this.gotGame )
			{
				getGame = false;
				this.gameIndex = this.downloadManager.getGameIndex(this.game);
				if( this.gameIndex !== false )
				{
					gameHash = this.appletHandler.getUnitsync().getPrimaryModChecksum( this.gameIndex )
					if( this.gameHash === 0 || this.gameHash === gameHash )
					{
						this.gotGame = true;
						this.loadModOptions();
						this.loadGameBots();
						this.loadFactions();
						this.hideGameDownloadBar();
					}
					else
					{
						this.gameHashMismatch = true;
						getGame = true;
					}
				}
				else
				{
					getGame = true;
				}
				//if( getGame )
				if( 0 )
				{
					this.processName = this.downloadManager.downloadPackage( 'game', this.game );
					this.showGameDownloadBar();
				}
			}
			
			mapChecksum = this.downloadManager.getMapChecksum(this.map);
			if( mapChecksum !== false )
			{
				this.gotMap = true;
				this.battleMap.hideBar();
			}
			else
			{
				processName = this.downloadManager.downloadPackage( 'map', this.map );
				this.battleMap.showBar(processName)
			}
			this.battleMap.setGotMap( this.gotMap );
			
			if( this.gotGame && this.gotMap )
			{
				//alert('synced!');
				this.synced = true;
			}
		}
	},
	'focusDownloads':function(e)
	{
		dojo.stopEvent(e);
		dojo.publish('Lobby/focusDownloads', [] );
	},
	'updateBar':function(data)
	{
		if( data.processName !== this.processName )
		{
			return;
		}
		this.gameDownloadBar.update( {'progress':data.perc} );
	},
	'showGameDownloadBar':function()
	{
		dojo.style( this.gameDownloadBar.domNode, 'display', 'block');
	},
	'hideGameDownloadBar':function()
	{
		this.processName = '';
		dojo.style( this.gameDownloadBar.domNode, 'display', 'none');
	},
	
	'loadFactions':function() //note, loadmodoptions first does addallarchives so it must be called before this. fixme
	{
		var listOptions, factionCount, i, factionName;
		factionCount = this.appletHandler.getUnitsync().getSideCount();
		listOptions = [];
		for( i=0; i<factionCount; i++ )
		{
			factionName = this.appletHandler.getUnitsync().getSideName(i);
			this.factionSelect.addOption({ 'value':i, 'label':factionName })
		}
	},
	
	'loadModOptions':function()
	{
		var dlg;
		if( this.modOptions !== null )
		{
			return;
		}
		this.modOptions = new ModOptions({
			'appletHandler':this.appletHandler,
			'gameIndex':this.gameIndex
			
			//,'battleId':this.battleId
		})
		//this.showModOptions(); //testing
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
			'users':this.users
		})
		
		//this.showGameBots(); //testing
	},
	
	
	//function needed for template dojoattachevent
	'showModOptions':function()
	{
		if( !this.loadedBattleData )
		{
			alert('Still loading game data, please wait...')
			return;
		}
		if( this.appletHandler.getUnitsync() === null )
		{
			alert('Game options not available.')
			return;
		}
		
		if( this.modOptions === null )
		{
			this.syncCheck( 'You cannot edit the game options because you are missing the game.', true );
			return;
		}
		this.modOptions.showDialog();
	},
	
	'showGameBots':function()
	{
		if( !this.loadedBattleData )
		{
			alert('Still loading game data, please wait...')
			return;
		}
		if( this.appletHandler.getUnitsync() === null )
		{
			alert('Bots not available.')
			return;
		}
		
		if( this.modOptions === null )
		{
			this.syncCheck( 'You cannot add a bot because you are missing the game.', true );
			return;
		}
		this.gameBots.showDialog();
	},
	
	
	
	'updateBattle':function(data)
	{
		var blistStore = this.battleListStore;
		
		if( this.battleId !== data.battle_id )
		{
			return;
		}
		this.map = data.map;
		this.setSync();
		this.battleMap.setMap( this.map );
	},
	
	
	'leaveBattle':function()
	{
		var smsg;
		smsg = 'LEAVEBATTLE'
		dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
		
		this.closeBattle();
		
		
	},
	
	'closeBattle':function( )
	{
		var name;
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
		
		this.synced = false;
		this.gotGame = false;
		this.gotMap = false;
		
		dojo.create('hr', {}, this.messageNode.domNode )
		
		dojo.attr( this.titleText, 'innerHTML', 'Please wait...' );
		
		for( name in this.bots )
		{
			dojo.publish('Lobby/battles/remplayer', [{'name': name, 'battle_id':this.battleId }] );
			delete this.users[name]; //may not be needed due to above event
			this.users[name] = null; //may not be needed due to above event
		}
		this.bots = {};
		
		
		this.battleId = 0;
		dojo.style( this.hideBattleNode, 'display', 'block' );
		dojo.style( this.battleDivNode, 'display', 'none' );
		this.closeNode.set('disabled', true);
		this.playerListNode.empty();
		this.players = {};
	},
	
	'syncCheck':function( message, forceShowAlert )
	{
		var dlg, dlgDiv, closeButton;
		
		if(this.synced)
		{
			return true;
		}
		
		message += '<br /><ul>';
		if( !this.gotGame )
		{
			message += '<li>Missing game: <a href="http://springfiles.com/finder/1/' + this.game
				+ '" target="_blank" >'
				+ this.game + '</a></li>';
			
		}
		if( !this.gotMap )
		{
			message += '<li>Missing map: <a href="' + this.battleMap.getMapLink()
				+ '" target="_blank" >'
				+ this.map + '</a></li>';
		}
		message += '</ul>';
	
		if( !this.showingDialog && (forceShowAlert || !this.recentAlert ) )
		{
			this.recentAlert = true;
			setTimeout( function(thisObj){
				thisObj.recentAlert = false;
			}, 30000, this );
			
			dlgDiv = dojo.create( 'div', {} );
			
			dojo.create('span',{'innerHTML': message }, dlgDiv )
			
			dojo.create('br',{}, dlgDiv )
			dojo.create('br',{}, dlgDiv )
			
			closeButton = new dijit.form.Button({
				'label':'Close',
				'onClick':dojo.hitch(this, function(){
					dlg.hide();
					this.showingDialog = false;
				})
			}).placeAt(dlgDiv);
			
			dlg = new dijit.Dialog({
				'title': "You are missing content",
				'style': "width: 450px",
				'content':dlgDiv,
				'onHide':dojo.hitch(this, function(){
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
		if( this.specState )
		{
			if( !this.syncCheck( 'You cannot participate in the battle because you are missing content.', true ) )
			{
				return;
			}
		}
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
		if( this.battleId !== 0 && this.gotStatuses )
		{
			this.users[this.nick].setStatusVals({
				'isSpectator':this.specState,
				'allyNumber':this.allianceId,
				'teamNumber':this.getEmptyTeam(this.nick),
				'syncStatus':this.synced ? 'Synced' : 'Unsynced',
				'side':this.faction,
				'isReady':true
			});
			this.users[this.nick].sendBattleStatus();
			
		}
	},
	
	'addPlayer':function( data )
	{

		var pname, line, user, ateam, aiNum;
		pname = data.name;
		
		if( pname === '' )
		{
			return;
		}
		if( data.battle_id !== this.battleId )
		{
			return;
		}
		
		user = this.users[pname];
		user.playerNum = this.playerNum;
		this.playerNum += 1;
		
		if( user.owner !== '' )
		{
			aiNum = this.aiNum
			this.bots[pname] = aiNum;
			
			this.aiNum += 1;
			
			//console.log( this.scriptManager.getScript() )
		}
		else
		{
			
		}
		
		
		this.players[pname] = user;
		this.playerListNode.addUser(user);
		line = '*** ' + pname + ' has joined the battle.';
		if( pname in this.bots )
		{
			line = '*** Bot: ' + pname + ' has been added.';
		}
		
		if( pname === this.nick )
		{
			//this.sendPlayState();
		}
		
		//this.addLine( line, {'color':this.settings.settings.chatLeaveColor}, 'chatJoin' );
		if( this.gotStatuses )
		{
			this.addLine( line, 'chatJoin' );
		}
		
		//for updating the player list
		setTimeout( function(thisObj){
			thisObj.resizeAlready2();
		}, 400, this );
	},
	
	'remPlayer':function( data )
	{
		var pname, line, ateam, user, aiNum;
		if( data.battle_id !== this.battleId )
		{
			return;
		}
		
		pname = data.name;
		user = this.users[pname];
		
		
		
		//fixme: this errored user=undefined
		this.playerListNode.removeUser(user);
		
		line = '*** ' + pname + ' has left the battle.';
		if( pname in this.bots )
		{
			line = '*** Bot: ' + pname + ' has been removed.';
			aiNum = this.bots[pname];
			delete this.bots[pname];
			this.scriptManager.removeScriptTag( 'AI' + aiNum );
		}
		else
		{
			this.scriptManager.removeScriptTag( 'PLAYER' + user.playerNum );
		}
		
		delete this.players[pname];
		
		//this.addLine( line, {'color':this.settings.settings.chatLeaveColor}, 'chatLeave' );
		this.addLine( line, 'chatLeave' );
		if( pname === this.nick )
		{
			this.closeBattle();
		}
	},
	
	'removeScriptTag':function(key)
	{
		this.scriptManager.removeScriptTag(key);
		if( key.toLowerCase().match( /game\/modoptions\// ) )
		{
			optionKey = scriptTag.toLowerCase().replace( 'game/modoptions/', '' );
			this.modOptions.updateModOption( {'key': optionKey, 'value':null} );
			//topic.publish('Lobby/modoptions/updatemodoption', {'key': optionKey, 'value':null}  )
		}
		
	},
	'addStartRect':function(allianceId, x1, y1, x2, y2)
	{
		this.scriptManager.addScriptTag( 'ALLYTEAM' + allianceId + '/NumAllies', 	0 );
		this.scriptManager.addScriptTag( 'ALLYTEAM' + allianceId + '/StartRectLeft', 	x1 );
		this.scriptManager.addScriptTag( 'ALLYTEAM' + allianceId + '/StartRectTop', 	y1 );
		this.scriptManager.addScriptTag( 'ALLYTEAM' + allianceId + '/StartRectRight', 	x2 );
		this.scriptManager.addScriptTag( 'ALLYTEAM' + allianceId + '/StartRectBottom', 	y2 );
		this.battleMap.addStartRect(allianceId, x1, y1, x2, y2)
	},
	'remStartRect':function(allianceId)
	{
		this.scriptManager.removeScriptTag( 'ALLYTEAM' + allianceId + '/NumAllies' );
		this.scriptManager.removeScriptTag( 'ALLYTEAM' + allianceId + '/StartRectLeft' );
		this.scriptManager.removeScriptTag( 'ALLYTEAM' + allianceId + '/StartRectTop' );
		this.scriptManager.removeScriptTag( 'ALLYTEAM' + allianceId + '/StartRectRight' );
		this.scriptManager.removeScriptTag( 'ALLYTEAM' + allianceId + '/StartRectBottom' );
		this.battleMap.remStartRect(allianceId);
	},
	
	'removeScriptTag':function(key)
	{
		this.scriptManager.removeScriptTag(key);
				
		if( key.toLowerCase().match( /game\/modoptions\// ) )
		{
			optionKey = key.toLowerCase().replace( 'game/modoptions/', '' );
			//fixme: modoptions might not be loaded yet!
			this.modOptions.updateModOption({'key': optionKey, 'value':null})
		}
	},
	
	'setScriptTag':function(key, val)
	{
		var optionKey;
		
		this.scriptManager.addScriptTag(key, val);
		if( key.toLowerCase().match( /game\/modoptions\// ) )
		{
			optionKey = key.toLowerCase().replace( 'game/modoptions/', '' );
			//fixme: modoptions might not be loaded yet!
			this.modOptions.updateModOption({'key': optionKey, 'value':val}  );
		}
	},
	
	'generateScript':function()
	{
		var blistStore = this.battleListStore;
		//fixme - not needed
		blistStore.fetchItemByIdentity({
			'identity':this.battleId,
			'scope':this,
			'onItem':function(item)
			{
				var ip, host, hostport, game, map;
				
				ip 			= blistStore.getValue(item, 'ip');
				host 		= blistStore.getValue(item, 'host');
				hostport 	= blistStore.getValue(item, 'hostport');
				game 		= blistStore.getValue(item, 'game');
				map 		= blistStore.getValue(item, 'map');
				
				//ModHash
				//AutohostPort
				
				this.scriptManager.addScriptTag( "game/GameType", 		game );
				this.scriptManager.addScriptTag( "game/SourcePort", 	'8300' );
				this.scriptManager.addScriptTag( "game/HostIP", 		ip );
				this.scriptManager.addScriptTag( "game/HostPort", 		hostport );
				this.scriptManager.addScriptTag( "game/IsHost", 		host === this.nick ? '1' : '0' );
				this.scriptManager.addScriptTag( "game/MyPlayerName", 	this.nick );
				
				if( this.scriptPassword !== '')
				{
					this.scriptManager.addScriptTag( "game/MyPasswd", 	this.scriptPassword );
				}
				
				//console.log(this.scriptManager.getScript())
			}
		});
	},
	
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
	
	'editBot':function(data)
	{
		var dlg, mainDiv, applyButton, teamText, teamSelect, teamOptions, i;
		var botName, name, bot, colorChooser, colorChooserButton;
		
		//botName =  dojox.html.entities.decode(data.botName);
		botName =  '<BOT>'+data.botName;
		bot = this.users[botName]; 
		if( !bot )
		{
			console.log('GameBot> Error: no such bot ' + botName)
		}
		name = bot.name;
		//console.log(bot)
		
		mainDiv = dojo.create('div', {'style':{'minWidth':'250px' }} );
		
		dojo.create('span', {'innerHTML':'Team: '}, mainDiv)
		/*
		teamText = new dijit.form.TextBox({
			'value':1,
			'style':{'width':'100px'}
		}).placeAt(mainDiv);
		*/
		teamOptions = [];
		for(i=1; i<=16; i+=1)
		{
			teamOptions.push({'label':i, 'value':i})
		}
		
		teamSelect = new dijit.form.Select({
			'value':1,
			'style':{'width':'100px'},
			'options':teamOptions
		}).placeAt(mainDiv);
		
		colorChooser = new dijit.ColorPalette({});
			
		colorChooserButton = new dijit.form.DropDownButton({
				'iconClass':'smallIcon colorsImage',
				'showLabel':false,
				'label':'Choose team color',
				'dropDown':colorChooser
		}).placeAt(mainDiv);
		
		applyButton = new dijit.form.Button({
			'label':'Apply',
			'onClick':dojo.hitch(this, function(botName){
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
				this.users[botName].setTeamColor( colorChooser.get('value') );
				//console.log(this.users[botName])
				this.users[botName].sendBattleStatus(true);
				dlg.hide();
			}, botName)
		}).placeAt(mainDiv);
		
		dlg = new dijit.Dialog({
			'title': 'Edit AI Bot',
			'content':mainDiv
		});
		dlg.startup();
		dlg.show();
		
	},

	
	'blank':null
}); });//define lwidgets/Battleroom

