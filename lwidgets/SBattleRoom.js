///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/SBattleRoom',
	[
		"dojo/_base/declare",

		//"dojo",
		//"dijit",
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',

		'lwidgets',
		'lwidgets/BattleRoom',
	
		'dijit/form/Select',
		'dijit/form/Button',
		'dijit/Dialog',
		"dijit/form/CheckBox",
		"dijit/form/Form",
		//extras

	],
	function(declare,
		//dojo, dijit,
		array, domConstruct, domStyle, domAttr, lang,
		lwidgets, BattleRoom,
		Select,
		Button,
		Dialog,
		CheckBox,
		Form
		){
	return declare( [ BattleRoom ], {
	
	gameSelect: null,
	bname: 'Singleplayer Battleroom',
	
	postCreate3: function()
	{
		this.battleId = -1;
		this.hosting = true;
		this.local = true;
		this.hostPort = 8452;
		//this.hostPort = '';
		this.sourcePort = '';
		this.ip = '';
		//this.scriptPassword = '';
		this.makeBattleButton.set('label','Start a Single Player Battle')
		this.battleInfo.resize({w: 800});
		
		this.subscribe('Lobby/unitsyncRefreshed', 'unitsyncRefreshed' );
		
		domAttr.set(this.textInputNode, 'disabled', true);
		domAttr.set(this.battleMap.mapWarning, 'title', 'You have not yet selected a map.');
		
		this.battleInfo.set('region', 'center');
		this.titleNode.set('region', 'top');
		this.messageNode.set('region', 'left');
		this.mainContainer.removeChild(this.messageNode);
		this.mainContainer.removeChild(this.inputNode);
		domStyle.set(this.battleMapDiv, 'width', '70%');
		domStyle.set(this.playerListDiv, 'width', '30%');
		this.mainContainer.layout();
	}, //postcreate2
	
	sendButtonClick: function()
	{
		//override
	},
	
	/**/
	setSync: function() //override
	{
		this.synced = false;
		this.gotMap = false;
		if( this.map !== '' )
		{
			this.synced = true;
			this.gotMap = true;
			this.battleMap.setGotMap( true );
			this.battleMap.setDefaultMapBoxes();
		}
		
		//are the below needed?
		this.gotEngine = true;
		
		this.gotGame = true;
		
		this.gameIndex = this.getGameIndex();
		this.loadModOptions();
		this.loadGameBots();
		this.loadFactions();
		
		this.hideGameDownloadBar();
		this.battleMap.hideBar();

		// Update synced icon.
		this.updatePlayState();
	},
	/**/
	
	joinBattle: function( game, hash ) //override
	{
		this.battleId = -1;
		
		domStyle.set( this.hideBattleNode, 'display', 'none' );
		domStyle.set( this.battleDivNode, 'display', 'block' );
		
		this.addPlayerByName( this.nick );

		this.closeNode.set('disabled', false);

		this.resizeAlready(); //for startup

		this.gameHash = hash;
		this.inBattle = true;
		
		this.host = this.nick;
		title = 'Single Player Battle';
		this.game = game;
		//this.ip 		= blistStore.getValue(item, 'ip');
		//this.hostport 	= blistStore.getValue(item, 'hostport');

		this.gotEngine = true;
		this.setSync();
		this.setTitle( title );

		this.loadedBattleData = true;
		
		this.goButton.set('disabled', false);

		// Join Team 1
		this.setAlliance(0);
		
		// Prompt to select map.
		this.battleMap.selectMap();

	}, //joinBattle
	
	unitsyncRefreshed: function(version) //override
	{
		if( version !== this.engine )
		{
			return;
		}
		this.updateGameSelect();
	},
	
	
	setNick: function(data)
	{
		//override. don't allow nick to be set by lobby topic
	},
	
	
	createDialog: null,
	goButton: null,
	
	makeBattle: function() //override
	{
		var dlgDiv;
		var form;
		
		if( this.createDialog === null )
		{
			this.updateDirectHostingForm();
			dlgDiv = this.directHostingTabDiv;
			
			//form for gameselection validation.
			form = new Form({
				action:"",
				method:"",
				onSubmit:function(){
					return false;
				}
			})
			
			domConstruct.place( dlgDiv, form.domNode );
			
			this.createDialog = new Dialog({
				title: "Start a Single Player Game",
				style: "width: 400px",
				content: form
			});
			
			this.goButton = new Button({
				label: 'Create Custom Game',
				type: 'submit',
				onClick: lang.hitch(this, function(){
					var gameHash;
					
					if(!form.validate())
					{
						alert('Please make a proper game selection.');
						return;
					}
					this.goButton.set('disabled', true);
					gameHash = this.getUnitsync().getPrimaryModChecksum( this.gameSelect.value );
					this.joinBattle( this.gameSelect.get('displayedValue'), gameHash );
					this.createDialog.hide();
				})
			}).placeAt(this.directHostingTabDivButtonDiv);
			
			var goButton2 = new Button({
				label: 'Launch Game Directly',
				disabled:true,
				onClick: lang.hitch(this, function(){
					var gameHash;
					var mapCount
					if(!form.validate())
					{
						alert('Please make a proper game selection.');
						return;
					}
					mapCount = this.getUnitsync().getMapCount();
					if( mapCount === 0 )
					{
						alert('You must download at least one map to start the game. Please log onto the multiplayer server and join any battle, and a map will be downloaded.')
					}
					else
					{
						gameHash = this.getUnitsync().getPrimaryModChecksum( this.gameSelect.value );
						this.game = this.gameSelect.get('displayedValue');
						this.gameHash = gameHash;
						this.inBattle = true;
						this.map = this.getUnitsync().getMapName( 0 );
						this.addPlayerByName( this.nick );
						this.host = this.nick;
						
						this.appletHandler.startSpringScript( this.generateScript(), this.engine );
						this.closeBattle(); //clears map and game, etc.
					}
					this.createDialog.hide();
				})
			}).placeAt(this.directHostingTabDivButtonDiv);
			
			
		}
		
		this.createDialog.show();
		if( this.appletHandler.getEngineVersions().length === 0 )
		{
			alert2('If you are starting out, please join a multiplayer battle room first in order to make sure the engine, game and maps are downloaded to your computer.');
		}
		
	},

	updatePlayState: function()
	{
		this.users[this.nick].setStatusVals({
			isSpectator: this.specState,
			allyNumber: this.allianceId,
			teamNumber: this.getEmptyTeam(this.nick),
			syncStatus: this.synced ? 'Synced' : 'Unsynced',
			side: this.faction,
			isReady: true
		});
		this.users[this.nick].setTeamColor(this.teamColor);
		this.users[this.nick].processBattleStatusAndColor();
		
		
		this.battleMap.setSelectedAlliance(this.allianceId, this.specState);
	},


	blank: null
}); });//define lwidgets/Battleroom
