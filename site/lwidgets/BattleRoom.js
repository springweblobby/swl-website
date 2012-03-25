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
		'lwidgets/BattleMap',
		'lwidgets/BattlePlayerList',
		//extras
		
	],
	function(declare, dojo, dijit, template, domConstruct, lwidgets, Chat, ModOptions, BattleMap, BattlePlayerList ){
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
	
	'battleId':0,
	
	'specState':true,
	'allianceId':true,
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
	
	'gameIndex':false,
	'mapIndex':false,
	
	'loadedGameData':false,
	
	'postCreate2':function()
	{
		var titleNode;
		
		this.players = {};
		this.ateams = {};
		this.ateamNumbers = [];
		this.bots = {};
		
		dojo.subscribe('Lobby/battle/joinbattle', this, 'joinBattle' );
		dojo.subscribe('Lobby/battles/addplayer', this, 'addPlayer' );
		dojo.subscribe('Lobby/battles/remplayer', this, 'remPlayer' );
		dojo.subscribe('Lobby/battle/playermessage', this, 'playerMessage' );
		dojo.subscribe('Lobby/battle/ring', this, 'ring' );
		
		dojo.subscribe('Lobby/battles/updatebattle', this, 'updateBattle' );
		
		dojo.subscribe('Lobby/battle/checkStart', this, 'checkStart' );
		
		dojo.subscribe('Lobby/unitsyncRefreshed', this, 'setSync' );
		
		dojo.subscribe('Lobby/battle/setAlliance', this, function(data){
			if(data.allianceId === 'S')
			{
				this.specState = true;
				this.playStateNode.set('iconClass', 'tallIcon specImage' );
				this.sendPlayState();
				return;
			}
			
			if( !this.syncCheck( 'You cannot participate in the battle because you are missing content.', false ) )
			{
				return;
			}
			this.specState = false;
			this.playStateNode.set('iconClass', 'tallIcon playImage' );
			this.allianceId = data.allianceId;
			this.sendPlayState();
		} );
		
		this.battleMap = new BattleMap({}).placeAt(this.battleMapDiv);
		//this.playerListNode = new BattlePlayerList({}).placeAt(this.playerListDiv);
		this.playerListNode = new BattlePlayerList({})
		
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
		this.startGame();
	},
		
	'ring':function( data )
	{
		var name, line;
		name = data.name;
		line = '*** ' + name + ' is ringing you!';
		this.addLine( line, {}, '' );
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
		
		dojo.publish('Lobby/startgame');
	},
	
	'joinBattle':function( data )
	{
		var blistStore = this.battleListStore;
		
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
				var members, playerlist, title, gameWarning;
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
				this.loadedGameData = true;
				
				
			}
		});
	}, //joinBattle
	
	'setSync':function()
	{
		var mapIndex, gameHash, processName;
		this.synced = false;
		this.gotGame = false;
		this.gotMap = false;
		this.gameHashMismatch = false;
		this.recentAlert = false;
		if( this.appletHandler.getUnitsync() !== null )
		{
			this.gameIndex = this.downloadManager.getGameIndex(this.game);
			this.mapIndex = this.downloadManager.getMapIndex(this.map);
			if( this.gameIndex )
			{
				gameHash = this.appletHandler.getUnitsync().getPrimaryModChecksum( this.gameIndex )
				if( this.gameHash === 0 || this.gameHash === gameHash ) //fixme optimize
				{
					this.gotGame = true;
					this.loadModOptions();
					this.loadFactions();
				}
				else
				{
					this.gameHashMismatch = true;
				}
			}
			else
			{
				//this.downloadManager.downloadPackage( 'game', this.game );
			}
			
			if( this.mapIndex )
			{
				this.gotMap = true;
				this.battleMap.hideBar()
			}
			else
			{
				//dojo.publish( 'Lobby/downloader/downloadMap', [{'map':this.map }] );	
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
	
	'loadFactions':function() //note, loadmodoptions first does addallarchives so it must be called before this. fixme
	{
		var listOptions, factionCount, i, factionName ;
		
		// GetSideStartUnit -- what's this for?
		
		this.factionSelect.set( 'options', [] );
		
		factionCount = this.appletHandler.getUnitsync().getSideCount();
		listOptions = [];
		for( i=0; i<factionCount; i++ )
		{
			factionName = this.appletHandler.getUnitsync().getSideName(i);
			listOptions.push({ 'value':factionName, 'label':factionName })
		}
		this.factionSelect.set( 'options', listOptions );
	},
	
	'loadModOptions':function()
	{
		var dlg, modOptions;
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
	
	//function needed for template dojoattachevent
	'showModOptions':function()
	{
		if( !this.loadedGameData )
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
		
		if( this.modOptions !== null )
		{
			this.modOptions.destroy();
			delete this.modOptions;
			this.modOptions = null;
		}
		this.battleMap.clearMap();
		this.host = '';
		this.loadedGameData = false;
		this.gotStatuses = false;
		this.closeBattle();
		
		dojo.create('hr', {}, this.messageNode.domNode )
		
		dojo.attr( this.titleText, 'innerHTML', 'Please wait...' );
	},
	
	'closeBattle':function( )
	{
		for( name in this.bots )
		{
			dojo.publish('Lobby/battles/remplayer', [{'name': name, 'battle_id':this.battleId }] );
			delete this.users[name]; //may not be needed due to above event
		}
		
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
		this.playStateNode.set('iconClass', this.specState ? 'tallIcon specImage' : 'tallIcon playImage'  );
		
		this.sendPlayState();
	},
	'updateFaction':function()
	{
		
	},
	'setColor':function(val)
	{
		var r,g,b, color;
		//dojo.style(this.colorPickNode, 'backgroundColor','green')
		
		r = val.substr(1,2);
		g = val.substr(3,2);
		b = val.substr(5,2);
		r = parseInt(r, 16);
		g = parseInt(g, 16);
		b = parseInt(b, 16);
		
		var color = b;
		color = color << 8;
		color += g;
		color = color << 8;
		color += r;
		
		this.users[this.nick].teamColor = color;
		
		this.sendPlayState();
		
	},
	'sendPlayState':function()
	{
		if( this.battleId !== 0 )
		{
			this.users[this.nick].setStatusVals({
				'isSpectator':this.specState,
				'allyNumber':this.allianceId,
				'syncStatus':this.synced ? 'Synced' : 'Unsynced'
			});
			smsg = "MYBATTLESTATUS " + this.users[this.nick].battleStatus + ' ' + this.users[this.nick].teamColor;
			dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
		}
	},
	
	'addPlayer':function( data )
	{
		var pname, line, user, ateam;
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
		
		if( user.owner !== '' )
		{
			this.bots[pname] = true;
		}
		this.players[pname] = user;
		this.playerListNode.addUser(user);
		line = '*** ' + pname + ' has joined the battle.';
		if( this.bots[pname] )
		{
			line = '*** Bot: ' + pname + ' has been added.';
		}
		
		if( pname === this.nick )
		{
			this.sendPlayState();
		}
		
		//this.addLine( line, {'color':this.settings.settings.chatLeaveColor}, 'chatJoin' );
		if( this.gotStatuses )
		{
			this.addLine(
				line,
				{
					'color':this.settings.settings.chatJoinColor,
					'display':this.settings.settings.showJoinsAndLeaves ? 'block' :'none'
				},
				'chatJoin'
			);
		}
		
		//for updating the player list
		setTimeout( function(thisObj){
			thisObj.resizeAlready2();
		}, 400, this );
	},
	
	'remPlayer':function( data )
	{
		var pname, line, ateam, user;
		if( data.battle_id !== this.battleId )
		{
			return;
		}
		pname = data.name;
		user = this.users[pname];
		
		delete this.players[pname];
		
		//fixme: this errored user=undefined
		this.playerListNode.removeUser(user);
		
		line = '*** ' + pname + ' has left the battle.';
		if( this.bots[pname] )
		{
			line = '*** Bot: ' + pname + ' has been removed.';
		}
		
		//this.addLine( line, {'color':this.settings.settings.chatLeaveColor}, 'chatLeave' );
		this.addLine(
			line,
			{
				'color':this.settings.settings.chatLeaveColor,
				'display':this.settings.settings.showJoinsAndLeaves ? 'block' :'none'
			},
			'chatLeave'
			);
		
		if( pname === this.nick )
		{
			this.closeBattle();
		}
	},
	
	'blank':null
}); });//define lwidgets/Battleroom

