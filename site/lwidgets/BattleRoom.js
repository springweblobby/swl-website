///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

///////////////////////////////////


define(
	'lwidgets/BattleRoom',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		
		'dojo/text!./templates/battleroom.html?' + cacheString,
		
		'lwidgets',
		'lwidgets/Chat',
		'lwidgets/ModOptions',
		'lwidgets/BattleMap',
		'lwidgets/BattlePlayerList',
		//extras
		
	],
	function(declare, dojo, dijit, template, lwidgets, Chat, ModOptions, BattleMap, BattlePlayerList ){
	return declare( [ Chat ], {
	
	//'templateString' : dojo.cache("lwidgets", "templates/battleroom_nopane.html?" + cacheString),
	'templateString' : template,
	
	'parseOnLoad':false,
	
	'saystring':'SAYBATTLE',
	'name':'',
	'host':'',
	'map':'',
	'game':'',
	
	'battle_id':0,
	
	'specState':true,
	'allianceId':true,
	'runningGame':false,
	
	'playerlistNode':null,
	'players' : null,
	'ateams':null,
	'ateamNumbers':null,
	'battleListStore':null,		//mixed in
	
	'bots':null,
	
	'unitSync':null, //mixed in
	
	'synced':false,
	
	'gotMap':false,
	'gotGame':false,
	'showingDialog':false,
	
	'recentAlert':false,
	
	'modOptions':null,
	
	'gameIndex':0,
	
	'loadedGameData':false,
	
	'postCreate2':function()
	{
		var titleNode;
		
		this.players = {};
		this.ateams = {};
		this.ateamNumbers = [];
		this.bots = {};
		
		/*
		this.playerlistNode = new dijit.layout.ContentPane({ 'splitter':true, 'region':'trailing', 'minSize':350, 'maxSize':500 }, this.playerlistDivNode );
		titleNode = new dijit.layout.ContentPane({ 'splitter':true, region:'top', 'minSize':50, 'maxSize':100 }, this.titleDivNode );
		*/
		
		dojo.subscribe('Lobby/battle/joinbattle', this, 'joinBattle' );
		dojo.subscribe('Lobby/battles/addplayer', this, 'addPlayer' );
		dojo.subscribe('Lobby/battles/remplayer', this, 'remPlayer' );
		dojo.subscribe('Lobby/battle/playermessage', this, 'playerMessage' );
		dojo.subscribe('Lobby/battle/ring', this, 'ring' );
		
		dojo.subscribe('Lobby/battles/updatebattle', this, 'updateBattle' );
		
		dojo.subscribe('Lobby/battle/checkStart', this, 'checkStart' );
		
		dojo.subscribe('Lobby/battle/setAlliance', this, function(data){
			if(data.allianceId === 'S')
			{
				this.specState = true;
				this.playStateNode.set('iconClass', 'tallIcon specImage' );
				this.sendPlayState();
				return;
			}
			
			if( !this.syncCheck( 'You cannot participate in the battle because:', false ) )
			{
				return;
			}
			this.specState = false;
			this.playStateNode.set('iconClass', 'tallIcon playImage' );
			this.allianceId = data.allianceId;
			this.sendPlayState();
		} );
		
		this.battleMapNode = new BattleMap({}).placeAt(this.battleMapDiv);
		//this.playerListNode = new BattlePlayerList({}).placeAt(this.playerListDiv);
		this.playerListNode = new BattlePlayerList({})
		
		dojo.connect(this.mainContainer, 'onMouseUp', this.battleMapNode, this.battleMapNode.updateMapDiv )
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
	
	'checkStart':function()
	{
		if( !this.players[this.host] )
		{
			return;
		}
		
		if( this.unitSync.getUnitsync() === null )
		{
			if( !confirm( 'Your Spring path cannot be accessed so it is not known if you have the map and game for this battle. Start anyway?' ) )
			{
				return;
			}
		}
		else if( !this.syncCheck( 'You cannot participate in the battle because:', false ) )
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
		
		if( this.unitSync.getUnitsync() === null )
		{
			if( !confirm( 'Your Spring path cannot be accessed so it is not known if you have the map and game for this battle. Start anyway?' ) )
			{
				return;
			}
		}
		else if( !this.syncCheck( 'You cannot participate in the battle because:', true ) )
		{
			return;
		}
		if( this.players[this.host].isInGame )
		{
			dojo.publish('Lobby/startgame');
		}
	},
	
	'joinBattle':function( data )
	{
		var blistStore = this.battleListStore;
		
		this.battle_id = data.battle_id;
		dojo.style( this.hideBattleNode, 'display', 'none' );
		dojo.style( this.battleDivNode, 'display', 'block' );
		
		this.sendPlayState();
		
		this.closeNode.set('disabled', false);
		
		this.resizeAlready(); //for startup
		
		blistStore.fetchItemByIdentity({
			'identity':data.battle_id,
			'scope':this,
			'onItem':function(item)
			{
				var members, playerlist, title, game, gameIndex, mapIndex;
				members 	= parseInt( blistStore.getValue(item, 'members') );
				playerlist 	= blistStore.getValue(item, 'playerlist');
				this.host	= blistStore.getValue(item, 'host');
				this.map	= blistStore.getValue(item, 'map');
				title		= blistStore.getValue(item, 'title');
				this.game 	= blistStore.getValue(item, 'game');
				
				//var temp = this.unitSync.getUnitsync().getPrimaryModIndex( game );
				
				this.synced = false;
				this.gotGame = false;
				this.gotMap = false;
				this.recentAlert = false;
				
				if( this.unitSync.getUnitsync() !== null )
				{
					this.gameIndex = this.unitSync.getUnitsync().getPrimaryModIndex( this.game ) + '';
					mapIndex = this.unitSync.getUnitsync().getMapChecksumFromName( this.map ) + '';
					
					//console.log('testing: ' +  gameIndex);
					//console.log('testing: ' +  mapIndex);
					
					if( this.gameIndex !==  '' && this.gameIndex !==  '0' && this.gameIndex !== '-1' )
					{
						this.loadModOptions();
						this.gotGame = true;
					}
					if( mapIndex !==  '' && mapIndex !==  '0' && mapIndex !== '-1' )
					{
						this.gotMap = true;
					}
					
					if( this.gotGame && this.gotMap )
					{
						//alert('synced!');
						this.synced = true;
					}
				}
				
				dojo.attr( this.titleText, 'innerHTML', '<b>' + title + '</b> <br /><i>' + this.game + '</i>');
				
				this.battleMapNode.setMap( this.map );
				
				for(player_name in playerlist)
				{
					this.addPlayer( { 'battle_id':this.battle_id, 'name':player_name } )
				}
				
				this.resizeAlready();
				this.loadedGameData = true;
			}
		});
	}, //joinBattle
	
	'loadModOptions':function()
	{
		var dlg, modOptions;
		
		this.modOptions = new ModOptions({
			'unitSync':this.unitSync,
			'gameIndex':this.gameIndex
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
		if( this.unitSync.getUnitsync() === null )
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
		
		if( this.battle_id !== data.battle_id )
		{
			return;
		}
		this.map = data.map;
		this.battleMapNode.setMap( this.map );
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
		this.battleMapNode.clearMap();
		this.host = '';
		this.loadedGameData = false;
		this.closeBattle();
		
		dojo.create('hr', {}, this.messageNode.domNode )
		
		dojo.attr( this.titleText, 'innerHTML', 'Please wait...' );
	},
	
	'closeBattle':function( )
	{
		for( name in this.bots )
		{
			dojo.publish('Lobby/battles/remplayer', [{'name': name, 'battle_id':this.battle_id }] );
			delete this.users[name]; //may not be needed due to above event
		}
		
		this.battle_id = 0;
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
			message += '<li>You do not have the game: <a href="http://springfiles.com/finder/1/' + this.game
				+ '" target="_blank" >'
				+ this.game + '</a></li>';
			
		}
		if( !this.gotMap )
		{
			message += '<li>You do not have the map: <a href="' + this.battleMapNode.getMapLink()
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
			if( !this.syncCheck( 'You cannot participate in the battle because:', true ) )
			{
				return;
			}
		}
		this.specState = !this.specState;
		this.playStateNode.set('iconClass', this.specState ? 'tallIcon specImage' : 'tallIcon playImage'  );
		
		this.sendPlayState();
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
		if( this.battle_id !== 0 )
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
		if( data.battle_id !== this.battle_id )
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
		this.addLine(
			line,
			{
				'color':this.settings.settings.chatJoinColor,
				'display':this.settings.settings.showJoinsAndLeaves ? 'block' :'none'
			},
			'chatJoin'
		);
		
		//for updating the player list
		setTimeout( function(thisObj){
			thisObj.resizeAlready2();
		}, 400, this );
	},
	
	'remPlayer':function( data )
	{
		var pname, line, battle_id, ateam, user;
		if( data.battle_id !== this.battle_id )
		{
			return;
		}
		pname = data.name;
		user = this.users[pname];
		
		delete this.players[pname];
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

