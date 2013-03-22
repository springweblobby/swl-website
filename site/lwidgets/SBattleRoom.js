///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/SBattleRoom',
	[
		"dojo/_base/declare",

		"dojo",
		"dijit",
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',

		'dojo/text!./templates/battleroom.html?' + cacheString,
		
		'lwidgets',
		'lwidgets/BattleRoom'

		//extras

	],
	function(declare, dojo, dijit,
		array, domConstruct, domStyle, domAttr, lang,
		template, lwidgets, BattleRoom ){
	return declare( [ BattleRoom ], {
	'templateString' : template,
	
	'gameSelect':null,
	
	'postCreate2':function()
	{
		this.battleId = -1;
		this.commonSetup();
		this.hosting = true;
		this.local = true;
		this.battleMap.hosting = true;
		this.hostPort = 8452;
		//this.hostPort = '';
		this.sourcePort = '';
		this.ip = '';
		//this.scriptPassword = '';
		this.makeBattleButton.set('label','Create Battle Room')
		this.battleInfo.resize({'w':800});
		
		this.subscribe('Lobby/unitsyncRefreshed', 'unitsyncRefreshed' );
		
	}, //postcreate2
	
	/*
	'setSync':function() //override
	{
		this.synced = true;
		//are the below needed?
		this.gotEngine = true;
		this.gotMap = true;
		this.gotGame = true;
	},
	*/
	
	'joinBattle':function( game, hash ) //override
	{
		this.battleId = -1;
		
		domStyle.set( this.hideBattleNode, 'display', 'none' );
		domStyle.set( this.battleDivNode, 'display', 'block' );
		
		this.addPlayer2( this.nick );

		//this.sendPlayState();

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

	}, //joinBattle
	
	'leaveBattle':function() //override
	{
		var smsg;
		
		this.closeBattle();
	},
	
	'unitsyncRefreshed':function() //override
	{
		this.updateGameSelect();
	},
	
	'updateGameSelect':function() 
	{
		var modName;
		var modShortName;
		var games;
		var modCount;
		var setFirst;
		
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
			modName = this.getUnitsync().GetPrimaryModName( i );
			modShortName = this.getUnitsync().GetPrimaryModShortName( i );
			
			games.push( { label: modName, value: i+'' } )
			this.gameSelect.set( 'options', games )
			
			if(setFirst)
			{
				this.gameSelect.set( 'value', i+'' )
				setFirst = false;
			}	
			
		}
		
		
	},
	
	'makeBattle':function() //override
	{
		var dlg, dlgDiv, goButton, rapidGames;
		var engineSelect;
		var engines;
		var i;
		
		var engineVersions = this.appletHandler.listDirs('%springHome%/engine')
		engines = [];
		array.forEach( engineVersions, function(engineVersion){
			engines.push( { label: engineVersion, value: engineVersion} )
		});
		
		if( engines.length === 0 )
		{
			alert2('You do not have any version of the engine. You can log onto the multi player server and it will download an engine for you.')
			return;
		}
		
		this.engine = engineVersions[0];
		
		dlgDiv = domConstruct.create( 'div', {'width':'400px'} );
		
		domConstruct.create('span',{'innerHTML':'Engine '}, dlgDiv )
		engineSelect = new dijit.form.Select({
			//'value':option.value,
			'style':{/*'position':'absolute', 'left':'160px', */'width':'160px'},
			'options': engines,
			'onChange':lang.hitch( this, function(val)
			{
				this.engine = val;
				this.updateGameSelect();
			})
		}).placeAt(dlgDiv)
		domConstruct.create('br',{}, dlgDiv )
		domConstruct.create('br',{}, dlgDiv )
		
		//return
		
		domConstruct.create('span',{'innerHTML':'Game '}, dlgDiv )
		this.gameSelect = new dijit.form.Select({
			//'value':option.value,
			'style':{/*'position':'absolute', 'left':'160px', */'width':'160px'},
			//'options': games
			'options': []
		}).placeAt(dlgDiv)
		domConstruct.create('br',{}, dlgDiv )
		domConstruct.create('br',{}, dlgDiv )
		
		this.updateGameSelect(); //after defining gameSelect
		
		
		dlg = new dijit.Dialog({
            'title': "Start a Single Player Game",
            'style': "width: 400px",
			'content':dlgDiv
        });
		
		goButton = new dijit.form.Button({
			'label':'Create Game',
			'onClick':lang.hitch(this, function(){
				var gameHash;
				
				goButton.set('disabled', true);
				
				gameHash = this.getUnitsync().getPrimaryModChecksum( this.gameSelect.value )
				
				this.joinBattle( this.gameSelect.get('displayedValue'), gameHash );
				
				dlg.hide();
				
			})
		}).placeAt(dlgDiv);
		
		dlg.show();	
	},

	'sendPlayState':function() // override
	{
		this.users[this.nick].setStatusVals({
			'isSpectator':this.specState,
			'allyNumber':this.allianceId,
			'teamNumber':this.getEmptyTeam(this.nick),
			'syncStatus':this.synced ? 'Synced' : 'Unsynced',
			'side':this.faction,
			'isReady':true
		});
		
		this.users[this.nick].processBattleStatusAndColor();
		
	},


	'blank':null
}); });//define lwidgets/Battleroom
