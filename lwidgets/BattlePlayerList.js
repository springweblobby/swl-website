///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/BattlePlayerList',
	[
		"dojo/_base/declare",
		
		'dojo/_base/lang',
		'dojo/topic',
		'dojo/dom-construct',
		'dojo/_base/array',
		'dojo/_base/event',
		'dojo/dom-attr',
		'dojo/dom-style',
		
		'lwidgets',
		'lwidgets/UserList',
		
		"dojo/store/Memory",
		"dojo/store/Observable",
		
		'dgrid/OnDemandGrid',
		'dgrid/Selection',
		'dgrid/extensions/ColumnResizer',
		
		'dijit/form/Button',
		'dijit/form/DropDownButton',
		'dijit/Tooltip',
		
		//extras
		'dojo/dom', //needed for widget.placeAt to work now
		
		
	],
	function(declare,
		lang,
		topic, domConstruct, array,
		event, domAttr, domStyle,
		lwidgets, UserList, 
		
		Memory, Observable,
		Grid, Selection, ColumnResizer,
		
		Button,
		DropDownButton,
		Tooltip
		){
	return declare( [ UserList ], {


	ateams: null,
	ateamNumbers: null,
	nick: '',
	
	local: false,
	
	buildRendering: function()
	{
		var div1, layout;
		
		this.local = this.battleRoom.local;
		
		this.playerCountSpan = domConstruct.create('span', {} );
		this.specCountSpan = domConstruct.create('span', {} );
		this.ateams = {};
		if( !this.style )
		{
			this.style = {width: '100%'};
		}
								
		div1 = domConstruct.create('div', {style: this.style});
		this.domNode = div1;
		layout = [
			{	field: 'battleMain',
				sortable: false,
				
				/*
				'renderHeaderCell':function (node)
				{
					return domConstruct.create('span',{'style':{'fontSize':'medium'}, 'innerHTML':'Players' } );
				},
				*/
				
				renderHeaderCell: lang.hitch(this, function (node) {
					var headerCell = domConstruct.create('div',{style: {padding:'2px', height:'21px', fontSize: 'medium'}, innerHTML: 'Players &nbsp; ' } );
					domConstruct.create('img',{src: 'img/soldier.png'}, headerCell );
					domConstruct.place( this.playerCountSpan, headerCell );
					domConstruct.create('span',{ innerHTML: '&nbsp; &nbsp;'}, headerCell );
					domConstruct.create('img',{src: 'img/smurf.png'}, headerCell );
					domConstruct.place( this.specCountSpan, headerCell );
					
					return headerCell;
				} ),
				
				
				//width: (170) + 'px',
				//formatter: lang.hitch(this, function(valueStr)
				renderCell: lang.hitch( this, function (object, value, cell)
				{
					var lobbyClient, os, setAlliancePublisher, botEditButton, div,
						teamButton, newTeamButton, clearTeamsButton,
						botButton, spectators;
					var divContent;
					var isSynced;
					var battleIcon;
					var curIcon;
					
					//return domConstruct.create('div',{innerHTML:value});
					isSynced = object.syncStatus === 'Synced';
					//value = eval( '(' + valueStr + ')' );
					
					if( object.isTeam )
					{
						spectators = object.name === 'Spectators';
						div = domConstruct.create( 'div', { style: {textAlign: 'center',padding: '2px' } } );
						teamButton = new Button({
							label: object.name,
							iconClass: spectators ? 'smallIcon searchImage' : 'smallIcon flagImage',
							onClick: lang.hitch(this, function(){
								this.setAlliance( object.teamNum );
							})
						}).placeAt(div);
						
						if( spectators )
						{
							newTeamButton = new Button({
								label: 'Add a new team',
								showLabel: false,
								iconClass: 'smallIcon flagPlusImage',
								onClick: lang.hitch(this, function(){
									var i, curTeam, emptyTeam;
									for(i=0; i<16; i++)
									{
										curTeam = i+'';
										if( !( curTeam in this.ateams ) )
										{
											this.addTeam(i, false)
											return;
										}
									}
									
								})
							}).placeAt(div);
							clearTeamsButton = new Button({
								label: 'Clear empty teams',
								showLabel: false,
								iconClass: 'smallIcon flagMinusImage',
								onClick: lang.hitch(this, function(){
									var emptyAllyTeams, items;
									emptyAllyTeams = this.battleRoom.getEmptyAllyTeams();
									items = this.store.query({teamNum: new RegExp('(^('+emptyAllyTeams.join('|')+')$)')})
									array.forEach(items, function(item){
										var teamName;
										teamName = this.store.get(item.id).teamNum + '';
										this.ateams[teamName] = null;
										delete this.ateams[teamName];
										this.store.remove(item.id);
											
									}, this)
								})
							}).placeAt(div);
						}
						else
						{
							botButton = new Button({
								label: 'Add a bot to this team',
								showLabel: false,
								iconClass: 'smallIcon botPlusImage',
								onClick: lang.hitch(this, 'showGameBots', object.teamNum)
							}).placeAt(div);
						}
						
						return div;
					}
					
					
					var syncedAndReadyTooltip = ''
					var syncedIcon = null;
					if (isSynced && object.isReady)
					{
						syncedAndReadyTooltip = '[Synced and Ready]'
						syncedIcon = 'synced.png'
					}
					if (!isSynced)
					{
						syncedAndReadyTooltip += '[Not Synced]'
						syncedIcon = 'unsynced.png'
					}
					if (!object.isReady)
					{
						syncedAndReadyTooltip += ' [Not Ready]'
						if(syncedIcon === null)
							syncedIcon = 'not_ready.png'
					}
					
					div = domConstruct.create( 'div', { style: {padding: 0} } );
					
					var extra = ''
					if( object.isSharing )
					{
						//extra = 'L '
						extra = '\u221F '
					}
					domConstruct.create('span', { innerHTML: extra }, div);
					
					lobbyClient = object.getLobbyClientIcon();
					os = object.getOsIcon()
					
					domConstruct.place( object.getFlag(), div );
					domConstruct.place( this.getUserIconForBattle( object ), div );
					
					domConstruct.place( this.getSideIcon( object ), div );
					
					var nameSpan = domConstruct.create('span', {}, div);
					var iconSpan = domConstruct.create( 'span', { style: { backgroundColor: '#'+object.hexColor,
							padding: '2px' } }, nameSpan );
					domConstruct.create('img', { src: 'img/' + syncedIcon, title: syncedAndReadyTooltip, width: 12 }, iconSpan );
					domConstruct.create('span', { class: object.name === this.nick ? 'chatMine': null,
							innerHTML: object.toString() }, nameSpan);
					
					if( lobbyClient )
					{
						domAttr.set( lobbyClient, 'align', 'right')
						domConstruct.place( lobbyClient, div );
					}
					if( os )
					{
						domAttr.set( os, 'align', 'right')
						domConstruct.place( os, div );
					}
					if( object.isAdmin )
					{
						curIcon = object.getAdminIcon();
						domAttr.set( curIcon, 'align', 'right')
						domConstruct.place( curIcon, div );
					}
					if( object.isAway )
					{
						curIcon = object.getAwayIcon();
						domAttr.set( curIcon, 'align', 'right')
						domConstruct.place( curIcon, div );
					}
					if( object.isInGame ) //don't show if user is not in battle
					{
						battleIcon = object.getBattleIcon(true) //without link
						domStyle.set( battleIcon, 'float', 'right'); //this is a div
						domConstruct.place( battleIcon, div );
					}
					if( object.clan )
					{
						curIcon = object.getClanIcon();
						domAttr.set( curIcon, 'align', 'right')
						domConstruct.place( curIcon, div );
					}
					
					
					if( object.owner === this.nick )
					{
						botEditButton = new DropDownButton({
						//botEditButton = new Button({
							iconClass: 'smallIcon settingsImage',
							showLabel: false,
							label: 'Edit Bot',
							dropDown: this.editBot(object.name)
						}).placeAt(div);
						
					}
					return div;
				})//hitch
			}
        ];
		/*
		domConstruct.create('style', {innerHTML: ''
			+ ' .dgrid-cell-padding {  padding:0; } '
			//+ ' .field-battleMain { width: 220px; } '
			//+ ' .dgrid { letterSpacing:-1px; height:100%; width:100%;  } '
		}, div1 );
		*/
		this.setupStore();
		ResizeGrid = declare([Grid, Selection, ColumnResizer]);
		this.grid = new ResizeGrid({
			
			useTouchScroll: false,
			store: this.store,
            columns: layout,
		//}, domConstruct.create('div', {'style':{ 'height':'100%', 'width':'100%', /*doesnt help*/'minHeight':'50px' }}, div1) ); // no placeAt because not dijit
		}, div1 ); // no placeAt because not dijit
		//} ); // no placeAt because not dijit
		this.grid.set('sort', 'battleMain');
		this.grid.on(".dgrid-row:dblclick", lang.hitch(this, 'queryPlayer') );
		this.grid.on(".dgrid-row:click", lang.hitch(this, function(e){
			this.grid.clearSelection();
			this.grid.select(e);
		}));
		
		this.subscribe('Lobby/battle/playerstatus', 'updateUser' );
		this.subscribe('SetNick', function(data){ if(this.local){return;} this.nick = data.nick } );
		//this.domNode = this.grid;
		
	},
	
	editBot: function(name)
	{
		return this.battleRoom.editBot( name );
	},
	
	postCreate: function()
	{
		if( !this.local )
		{
			this.subscribe('Lobby/connecting', 'empty' );
		}
		this.postCreate2();
	},
	
	showGameBots: function(team)
	{
		this.battleRoom.showGameBots(team);
	},
	
	setAlliance: function(allianceId)
	{
		this.battleRoom.setAlliance( allianceId )
	},

	queryPlayer: function( e )
	{
		var row, name;
		if( this.local )
		{
			return;
		}
		row = this.grid.row(e).data;
		if( row.isTeam )
		{
			this.setAlliance( row.teamNum )
			return;
		}
		else if( row.owner )
		{
			return;
		}
		name = row.id;
		topic.publish('Lobby/chat/addprivchat', {name: name, msg: '' }  );
		
		setTimeout( function(){ topic.publish('Lobby/focuschat', {name: name, isRoom: false } ); }, 500 );
	},

	
	addTeam: function(ateamNum, spec)
	{
		var ateamItem, ateamStringSort, ateamStringName, ateamShortName, ateamNumPlus, ateamNum2;
		
		if(ateamNum === null || ateamNum === undefined )
		{
			//console.log('%%% <BattlePlayerList> Error #1')
			return;
		}
		ateamNum2 = parseInt( ateamNum );
		
		if( isNaN( ateamNum2 ) ) //fixme, why would this happen
		{
			//console.log('%%% <BattlePlayerList> Error #3')
			return;
		}
		
		ateamNumPlus = ateamNum2 + 1;
		ateamStringSort = ateamNumPlus + 'A'
		if( ateamNumPlus < 10 )
		{
			ateamStringSort = '0' + ateamStringSort;
		}
		
		ateamStringName = 'Team ' + ateamNumPlus;
		ateamShortName = ateamNum2+'';
		if(spec)
		{
			ateamStringSort = 'SA';
			ateamStringName = 'Spectators';
			ateamShortName = 'S';
		}
		
		if( ateamShortName in this.ateams )
		{
			return;
		}
		
		this.ateams[ateamShortName] = true;
		ateamItem = {
			//team: 'Team ' + ateamStringSort,
			name: ateamStringName,
			isTeam: true,
			teamNum : ateamShortName,
			battleMain: 'Team-' + ateamStringSort,
		}
		ateamItem.id = ateamItem.name;
		this.store.put( ateamItem );
		
	},
	
	userCount: 0,
	specCount: 0,
	addUser: function(user)
	{
		this.addTeam( user.allyNumber, user.isSpectator );
		
		user.battleMain = this.setupDisplayName(user);
		
		user.id = user.name;
		this.store.put( user );
		
		this.updateShare(user.teamNumber);
		
		if( user.isSpectator )
		{
			this.specCount += 1;
		}
		this.userCount += 1;
		this.setCount();
	},
	
	
	updateUser: function( data )
	{
		var name, user, userOld;
		name = data.name;
		user = data.user;
		userOld = data.userOld;
		
		if( user.battleId !== this.battleRoom.battleId )
		{
			return;
		}
		if( typeof this.store.get(name) === 'undefined' ) //calling store.notify will add a user if it doesn't exist
		{
			return;
		}
		
		this.addTeam( user.allyNumber, user.isSpectator );
		
		user.battleMain = this.setupDisplayName(user);
		this.store.notify( user, name );
		
		this.updateShare(userOld.teamNumber);
		this.updateShare(user.teamNumber);

		if ( userOld.allyNumber !== null && ( user.allyNumber != userOld.allyNumber ||
			( user.isSpectator && !userOld.isSpectator ) ) )
		{
			setTimeout(lang.hitch(this, function(){
				this.removeOnMove(userOld);
			}), 7000);
		}
		
		if( user.isSpectator && !userOld.isSpectator )
		{
			this.specCount += 1;
		}
		if( !user.isSpectator && userOld.isSpectator )
		{
			this.specCount -= 1;
		}
		this.setCount();
		
	},

	// If user's team is currently empty, remove it.
	removeOnMove: function(user)
	{
		if(this.battleRoom.getEmptyAllyTeams().indexOf(user.allyNumber) !== -1 && !user.isSpectator)
		{
			var items;
			items = this.store.query( {teamNum: user.allyNumber } )
			array.forEach(items, function(item){
				var teamName;
				teamName = this.store.get(item.id).teamNum + '';
				if( teamName === '0' || teamName === 'S' ) return;
				delete this.ateams[teamName];
				this.store.remove(item.id);
			}, this);
		}
	},

	removeUser: function(user)
	{
		this.inherited(arguments);
		setTimeout(lang.hitch(this, function(){
			this.removeOnMove(user);
		}), 1000); // yay hax
		
		this.updateShare(user.teamNumber);
		
		if( user.isSpectator )
		{
			this.specCount -= 1;
		}
		this.userCount -= 1;
		this.setCount();
	},
	
	updateShare:function(tn)
	{
		return;
		var items;
		items = this.store.query( {teamNumber: tn } )
		
		if(items.length === 1)
		{
		}
		
		var share = 0;
		var shareSortName = '';
		array.forEach(items, function(item){
			item.battleMain = this.setupDisplayName(item, share, shareSortName);
			if( share === 0 )
			{
				item.isSharing = false;
				shareSortName = item.battleMain;
			}
			else
			{
				item.isSharing = true;
			}
			this.store.notify(item, item.id);
			if (!item.isSpectator)
			{
				share += 1;
			}
			
		}, this);
	},
	
	getSideIcon:function(user)
	{
		var faction = this.battleRoom.factions[ parseInt(user.side) ];
		return domConstruct.create('img', {src: this.battleRoom.factionIcons[ faction ], title: 'Faction: ' + faction, width: '16'})
	},
	
	getUserIconForBattle: function(user)
	{
		var chatLink;
		var img;
		var battleIcon, battleTitle, side
		
		side = parseInt(user.side)
		
		battleIcon = 'smurf.png'; battleTitle = 'Spectator.';
		if( !user.isSpectator )	{ battleIcon = 'soldier.png';	battleTitle = 'Player.' }
		if( user.owner )		{ battleIcon = 'robot.png';		battleTitle = 'Bot' }
		if( user.isHost )		{
			battleIcon = 'napoleon.png';	battleTitle = 'Battle Host.';
			if( user.isSpectator )
			{
				battleTitle = 'Battle Host (Spectating).';
			}
		}
		
		if (!user.owner && !this.local) {
			battleTitle += '<div>Click to open chat.</div>';
			if( !user.isSpectator )
			{
				if( user.skill !== '' )
					battleTitle += '<div style="font-size:x-small">Trueskill rank: ' + user.skill + '</div>';
				if( user.elo !== '' )
					battleTitle += '<div style="font-size:x-small">Elo rank: ' + user.elo + '</div>';
			}	
			battleTitle += '<div style="font-size:x-small">Gameplay Time Rank: ' + user.rank + '</div>';
		}
		
		img = domConstruct.create('img', {src: 'img/'+battleIcon, /*title: battleTitle, */ width: '16'})
		
		var tooltipHtml;
		tooltipHtml = battleTitle
		var tt = new Tooltip({
			connectId: [img],
			position: ['before', 'above'],
			label: tooltipHtml
		});
		
		if( this.local || user.owner )
		{	
			return img;
		}
		
		chatLink = domConstruct.create('a', {
			href: '#',
			onclick: lang.hitch(this, function( user, e ){
				event.stop(e);
				topic.publish('Lobby/chat/addprivchat', {name: user.name, msg: '' }  );
				topic.publish('Lobby/focuschat', {name: user.name, isRoom: false }  );
				return false;
			}, user )
		} );
		
		domConstruct.place( img, chatLink );
		return chatLink;
		//return {battleIcon:battleIcon, battleTitle:battleTitle};
	},
	
	setupDisplayName: function(user, share, shareSortName)
	{
		var icon, title, teamString, teamNumPlus, skill, elo;
		var sortName = '';
		
		teamNumPlus = user.allyNumber + 1;
		teamString = teamNumPlus + 'Z'
		var lname = user.name.toLowerCase();

		if( typeof share === 'undefined' )
		{
			share = 0;
		}
		share = share
		
		if( teamNumPlus < 10 )
		{
			teamString = '0' + teamString;
		}
		//if(user.isSpectator)
		if(user.isSpectator && !user.owner ) //some lobby client appears to have bots that are spectators.
		{
			teamString = 'SZ'
		}

		sortName = 'Team-' + teamString + '-' + lname;
		if (!user.isSpectator) {
			if( share > 0 )
			{
				sortName = shareSortName + '-' + lname;
			}
		}		
		return sortName;
	},
	
	empty: function()
	{
		var items;
		this.ateams = {};
		items = this.store.query({id: new RegExp('.*') });
		array.forEach(items, function(item){
			teamName = this.store.get(item.id).teamNum + '';
			if( teamName === '0' || teamName === 'S' ) return;
			this.store.remove(item.id)
		}, this)
		
		this.specCount = 0;
		this.userCount = 0;
		//this.store.setData([])
	},
	
	postCreate2: function()
	{
		this.addTeam( 0, true ); // add spectator team
		this.addTeam( 0, false ); // add Team 1
		//this.subscribe('Lobby/battle/playerstatus', 'playerStatus' );
	},
	
	setCount: function()
	{
		domAttr.set( this.playerCountSpan, 'innerHTML', this.userCount - this.specCount );
		domAttr.set( this.specCountSpan, 'innerHTML', this.specCount );
	},
	
	
	blank: null
}); });//declare lwidgets.BattlePlayerList2
