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
		
	}, //postcreate2
	'joinBattle':function( game, hash )
	{
		this.battleId = -1;
		
		domStyle.set( this.hideBattleNode, 'display', 'none' );
		domStyle.set( this.battleDivNode, 'display', 'block' );
		
		this.addPlayer2( this.nick );

		//this.sendPlayState();

		this.closeNode.set('disabled', false);

		this.resizeAlready(); //for startup

		
		this.gameHash = hash;
		
		this.host = this.nick;
		title = 'Single Player Battle';
		this.game = game;
		//this.ip 		= blistStore.getValue(item, 'ip');
		//this.hostport 	= blistStore.getValue(item, 'hostport');

		this.setSync();
		this.setTitle( title );

		this.loadedBattleData = true;

	}, //joinBattle
	
	'leaveBattle':function()
	{
		var smsg;
		
		this.closeBattle();
	},
	
	'makeBattle':function()
	{
		var dlg, gameSelect, dlgDiv, goButton, rapidGames;
		dlgDiv = domConstruct.create( 'div', {'width':'400px'} );
		
		var modCount = this.getUnitsync().getPrimaryModCount();
		var games = [];
		var modName = '';
		var modShortName = '';
		for(i=0; i < modCount; i++)
		{
			modName = this.getUnitsync().GetPrimaryModName( i );
			modShortName = this.getUnitsync().GetPrimaryModShortName( i );
			games.push( { label: modName, value: i} )
		}
		
		domConstruct.create('span',{'innerHTML':'Game '}, dlgDiv )
		gameSelect = new dijit.form.Select({
			//'value':option.value,
			'style':{/*'position':'absolute', 'left':'160px', */'width':'160px'},
			'options': games
		}).placeAt(dlgDiv)
		domConstruct.create('br',{}, dlgDiv )
		domConstruct.create('br',{}, dlgDiv )
		
		
		dlg = new dijit.Dialog({
            'title': "Start a Single Player Game",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		goButton = new dijit.form.Button({
			'label':'Create Game',
			'onClick':lang.hitch(this, function(){
				var gameHash;
				
				goButton.set('disabled', true);
				
				gameHash = this.getUnitsync().getPrimaryModChecksum( gameSelect.value )
				
				this.joinBattle( gameSelect.get('displayedValue'), gameHash );
				
				dlg.hide();
				
			})
		}).placeAt(dlgDiv);
		
		dlg.show();	
	},

	'sendPlayState':function()
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
