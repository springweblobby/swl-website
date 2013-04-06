///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/BattleManager',
	[
		"dojo/_base/declare",
		
		//"dojo",
		//"dijit",
		
		//"lwidgets",
		'dijit/_WidgetBase',
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		
		'dojo/_base/event',
		
		'dojo/topic',
		'dojo/on',
		
		'lwidgets/LobbySettings',
		'lwidgets/BattleFilter',
		'lwidgets/UserList',
		
		"dojo/store/Memory",
		"dojo/store/Observable",
		
		'dgrid/OnDemandGrid',
		'dgrid/Selection',
		'dgrid/extensions/ColumnResizer',
	
		'dijit/form/Button',
		
		'dijit/Dialog',
		
		'dijit/layout/BorderContainer',
		'dijit/layout/TabContainer',
		'dijit/layout/ContentPane',
		
		'dijit/form/TextBox',
		'dijit/form/Select',
		
		
		// *** extras ***
		
		'dojo/text',
		
		'dijit/_Templated'
		
		
	],
	function(declare,
			
			//dojo, dijit,
			
			WidgetBase,
			array, domConstruct, domStyle, domAttr, lang, event, topic, on,
			
			LobbySettings,
			BattleFilter,
			UserList,
			
			Memory, Observable,
			Grid, Selection, ColumnResizer,
			
			Button,
			Dialog,
		
			BorderContainer,
			TabContainer,
			ContentPane,
			TextBox,
			Select
			
	){


return declare( [ WidgetBase ], {
	'grid':null,
	'startMeUp':true,
	//'store':null, //mixed in
	
	'filters':null,
	'scriptPassword':'a',
	'users':null,
	
	'bc':null,
	
	'quickMatchButton':null,
	
	'delayedUpdateFiltersTimeOut':null,
	
	'setQuickMatchButton':function( enabled )
	{
		this.quickMatchButton.set( 'label', enabled ?
			'Quickmatch - <span style="color:green; ">Enabled' :
			'Quickmatch - <span style="color:red; ">Disabled'
		);
	},
	
	'buildRendering':function()
	{
		var div1, filterDiv, filterTitleDiv, layout, newFilterButton, mainDiv, iconWidth,
			tempPane1, tempPane2,
			rightPaneDiv
			;
		//this.store = {};
		this.filters = [];
		
		mainDiv = domConstruct.create('div', {  'style':{'width':'100%', 'height':'100%' }
								  });
		this.domNode = mainDiv;
		//div1 = domConstruct.create('div', {  'style':{}});
		this.bc = new BorderContainer({
			'design':"sidebar",
			'gutters':true,
			'liveSplitters':true,
			'style': {'height': '100%', 'width': '100%;' }
		}).placeAt(mainDiv);
		
		
		tempPane1 = new ContentPane({ 'splitter':true, 'region':'center',
			'style':{'width':'100%', 'height':'100%', /*'fontSize':'small',*/'letterSpacing':'-1px', 'padding':'1px', 'overflow':'hidden' }
		});
		tempPane2 = new ContentPane({ 'splitter':true, 'region':'trailing', 'minSize':50, 'maxSize':600, 'style':{'width':'250px', 'padding':'0px'} } );
		this.bc.addChild(tempPane1)
		this.bc.addChild(tempPane2)
		
		iconWidth = 35;
		
		// set the layout structure:
        layout = [
			{	'field': 'status',
				'renderHeaderCell': function (node) { return domConstruct.create('img', {src:'img/info.png', 'title': 'Room type and status' } ); },
				'renderCell': lang.hitch(this, function(object, value, cell)
				{
					var div, joinLink;
					
					div = domConstruct.create( 'div', { 'style':{ 'padding':'1px' } } );
					
					joinLink = domConstruct.create('a', {
						'href': '#',
						'onclick': lang.hitch(this, function( battleId, passworded, e ){
							event.stop(e);
							if( passworded )
							{
								this.passwordDialog( battleId );
								return false;
							}
							this.joinBattle( battleId, '' );
							return false;
							
						}, object.battleId, object.passworded )
					}, div );
					domConstruct.create('img', {
						'src': 			object.type === '1' ? 'img/control_play_blue.png' 	: 'img/battle.png',
						'innerHTML': 	object.type === '1' ? 'This is a replay' 			: 'This is a battle',
					}, joinLink);
					
					if( object.passworded )
					{
						domConstruct.create('img', { 'src': 'img/key.png', 'width':16, 'title':"A password is required to join" }, div);
					}
					if( object.locked )
					{
						domConstruct.create('img', { 'src': 'img/lock.png', 'width':16, 'title':"This battle is locked and cannot be joined" }, div);
					}
					if( object.progress )
					{
						domConstruct.create('img', { 'src': 'img/blue_loader.gif', 'width':16, 'title':"This battle is in progress" }, div);
					}
					if( object.rank > 0 )
					{
						domConstruct.create('span', { 'style':{'fontSize':'small'}, 'innerHTML':'['+object.rank+']' }, div);
					}
					
					return div;
				})
			},
			{	field: 'title',
				'renderHeaderCell': function (node) { return domConstruct.create('span', {'innerHTML':'<img src="img/battle.png" /> Battle Name' } );}
			},
			{	field: 'game',
				'renderHeaderCell': function (node) { return domConstruct.create('span', {'innerHTML':'<img src="img/game.png" /> Game' } );}
			},
			{	field: 'map',
				'renderHeaderCell': function (node) { return domConstruct.create('span', {'innerHTML':'<img src="img/map.png" /> Map' } );}
			},
			{	field: 'country',
				'renderHeaderCell': function (node) { return domConstruct.create('span', {'innerHTML':'<img src="img/globe.png" title="Host Location" />' } );},
				'renderCell': function(object, value, cell)
				{
					country = value in countryCodes ? countryCodes[value] : 'country not found' ;
					if(value === '??')
					{
						return domConstruct.create('img', {'src':"img/flags/unknown.png", 'title':"Unknown Location", 'width':"16" } );
					}
					return domConstruct.create('img', {'src':'img/flags/'+value.toLowerCase()+'.png', 'title':"'+country+'", 'width':"16" } );					
				}
			},
			{	field: 'host',
				'renderHeaderCell': function (node) { return domConstruct.create('span', {'innerHTML':'<img src="img/napoleon.png" /> Host' } );}
			},
			{	field: 'players',
				'renderHeaderCell': function (node) { return domConstruct.create('span', {'innerHTML':'<img src="img/soldier.png" title="Active Players">' } );}
			},
			{	field: 'max_players',
				'renderHeaderCell': function (node) { return domConstruct.create('span', {'innerHTML':'<img src="img/grayuser.png" title="Maximum Spots">' } );}
			},
			{	field: 'spectators',
				'renderHeaderCell': function (node) { return domConstruct.create('span', {'innerHTML':'<img src="img/search.png" title="Spectators" width="16" >' } );}
			},
        ];
		
		domConstruct.create('style', {'innerHTML':''
			+ ' .dgrid { letterSpacing:-1px } '
			+ ' .dgrid-cell-padding {  padding:0; } '
			+ '.field-status { width: 60px; } '
			+ '.field-title { width: 200px; } '
			+ '.field-game { width: 200px; } '
			+ '.field-map { width: 200px; } '
			+ '.field-country { width: '+iconWidth+'px; } '
			+ '.field-host { width: 100px; } '
			+ '.field-players { width: '+iconWidth+'px; } '
			+ '.field-max_players { width: '+iconWidth+'px; } '
			+ '.field-spectators { width: '+iconWidth+'px; } '
		}, mainDiv );
		
		
		ResizeGrid = declare([Grid, Selection, ColumnResizer]);
		this.grid = new ResizeGrid({
			'query':{'id': new RegExp('.*') },
			'queryOptions':{'ignoreCase': true},
            'store': this.store,
        
            'columns': layout,
		}, domConstruct.create('div', {'style':{ 'height':'100%', 'width':'100%', /*doesnt help*/'minHeight':'50px' }}, div1) ); // no placeAt because not dijit
		//} );
		this.grid.set('sort', 'players', true );
		this.grid.on(".dgrid-row:dblclick", lang.hitch(this, 'joinRowBattle') );
		//this.grid.on(".dgrid-row:click", lang.hitch(this, 'selectRowBatte') );
		this.grid.on("dgrid-select", lang.hitch(this, 'selectRowBattle') );
		
		tempPane1.set('content', this.grid)
		
		rightPaneDiv = domConstruct.create('div', {'style':{'width':'100%', 'height':'100%', /*'padding':'3px' */ }});
		tempPane2.set('content', rightPaneDiv)
		
		
		this.userList = new UserList({'name':'battle list', 'style':{'height':'300px'}}).placeAt(rightPaneDiv);
		
		filterDiv = domConstruct.create('div', {'style':{'border':'1px solid black','margin':'5px', 'padding':'3px'}}, rightPaneDiv);
		
		
		filterTitleDiv = domConstruct.create('div', { 'innerHTML':'Filters', 'style':{'fontWeight':'bold'} }, filterDiv );
		
		newFilterButton = new Button({
			'label':'Add a Filter',
			'showLabel':false,
			'iconClass':'smallIcon plusImage',
			'onClick':lang.hitch(this, function(){
				var filter1 = new BattleFilter( {} ).placeAt(filterDiv);
				this.filters.push( filter1 );
				filter1.killFilter = lang.hitch(this, function(){
					this.filters.remove(filter1)
					filter1.destroyRecursive(false);
					//delete filter1
					this.updateFilters();
				});
			} )
		}).placeAt(filterTitleDiv);
		
		var quickMatchDiv;
		quickMatchDiv = domConstruct.create('div', {'style':{'border':'1px solid black','margin':'5px', 'padding':'3px'}}, rightPaneDiv);
		this.quickMatchButton = new Button({
			'label':'Quickmatch - Loading...',
			'onClick':function(){
				topic.publish('Lobby/juggler/showDialog', {} );
			}
		}).placeAt(quickMatchDiv)
		
		
		this.subscribe('Lobby/battles/updatebattle', 'updateBattle' );
		this.subscribe('Lobby/battles/addplayer', function(data){ data.add=true; this.setPlayer(data) });
		this.subscribe('Lobby/battles/remplayer', function(data){ data.add=false; this.setPlayer(data) });
		
		this.subscribe('Lobby/battles/updatefilters', 'updateFilters');
		
		//dumb hax
		this.subscribe('ResizeNeeded', function(){
			setTimeout( function(thisObj){
				thisObj.resizeAlready();
			}, 400, this );
		} );
		
	},
	
	'delayedUpdateFilters':function()
	{
		if( this.delayedUpdateFiltersTimeOut === null )
		{
			this.delayedUpdateFiltersTimeOut = setTimeout( function(thisObj){ thisObj.updateFilters(); }, 400, this );
		}
		
	},
	'updateFilters':function()
	{
		var queryObj, addedQuery, queryVal, queryStr,
			queryObj2,queryValList, tempElement
		;
		queryStr = '';
		queryObj2 = {};
		queryObj = {};
		newFilters = [];
		addedQuery = false;
		
		
		array.forEach(this.filters, function(filter){
			var fieldName, comparator, value;
			fieldName = filter.fieldName.value;
			comparator = filter.comparator.value;
			filterValue = filter.filterValue.displayedValue;
			
			filterValue = filterValue.trim();
			
			if( filterValue !== '' )
			{
				filterValue = filterValue.replace(/\./, '\\.')
				filterValue = filterValue.replace(/\-/, '\\-')
				
				if( comparator === '=' )
				{
					filterValue = '^' + filterValue + '$'
					filterValue = '(?=' + filterValue + ')'
				}
				else if( comparator === '*=' )
				{
					filterValue = '.*' + filterValue + '.*'
					filterValue = '(?=' + filterValue + ')'
				}
				
				/*
				else if( comparator === '!=' )
				{
					filterValue = '[^(^' + filterValue + '$)]'
					filterValue = '(?!' + filterValue + ')'
				}
				else if( comparator === '!*=' )
				{
					//filterValue = '^((?!'+filterValue+').)*$'
					filterValue = '(?!.*'+filterValue+'.*)'
				}
				*/
				
				if( !queryObj[ fieldName ] )
				{
					queryObj[ fieldName ] = [];
				}
				
				
				queryObj[ fieldName ].push( filterValue );
				
				addedQuery = true;
			}
			
			
		}, this );
		
		for(fieldname in queryObj)
		{
			queryValList =  queryObj[fieldname];
			queryStr = this.getQueryVal(queryValList)
			queryObj2[fieldname] = new RegExp(queryStr, 'i');
		}
		
		if(!addedQuery)
		{
			queryObj2 = {'id':new RegExp('.*') };
		}
		this.grid.set('query', queryObj2);
		this.delayedUpdateFiltersTimeOut = null;
	},
	
	'getQueryVal':function(queryValList)
	{
		var queryStr, queryChunks;
		queryStr = '';
		array.forEach(queryValList, function(queryVal){
			//queryStr += '(?=' + queryVal + ')'
			queryStr += queryVal;
		});	
		return queryStr;
	},
	'selectRowBattle':function(e)
	{
		var player, players;
		players = e.rows[0].data.playerlist;
		this.userList.empty();
		for( player in players )
		{
			this.userList.addUser( this.users[player] );
		}
	},
	'joinRowBattle':function(e)
	{
		var row, battleId, smsg;
		
		row = this.grid.row(e);
		battleId = row.id;
		
		password = '';
		if( row.data.passworded === true )
		{
			this.passwordDialog( battleId );
			return;
		}
		this.joinBattle(battleId, '');
	},
	
	'joinBattle':function( battleId, battlePassword )
	{
		var smsg;
		smsg = 'LEAVEBATTLE'
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
		smsg = "JOINBATTLE " + battleId + ' ' + battlePassword + ' ' + this.scriptPassword;
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
	},
	
	'passwordDialogKeyUp':function(battleId, input, dlg, e)
	{
		var password;
		
		password = domAttr.get( input, 'value' )
		if( e.keyCode === 13 )
		{
			this.joinBattle( battleId, password );
			dlg.hide();
		}
	},
	
	'passwordDialog':function( battleId )
	{
		var dlg, input, contentDiv;
		contentDiv = domConstruct.create( 'div', {} );
		domConstruct.create( 'span', {'innerHTML':'Password '}, contentDiv );
		input = domConstruct.create( 'input', {'type':'text'}, contentDiv );
		
		dlg = new Dialog({
            'title': "Enter Battle Password",
            'style': "width: 300px",
			'content':contentDiv
        });
		
		on(input, 'keyup', lang.hitch(this, 'passwordDialogKeyUp', battleId, input, dlg ) )
		
		dlg.show();
	},
	
	'addBattle':function(data)
	{
		data.status = this.statusFromData(data);
		data.playerlist = {};
		data.members = 1;
		data.players = 1;
		data.spectators = 0;
		data.playerlist[data.host] = true;
		
		data.id = data.battleId;
		this.store.put(data);
		this.delayedUpdateFilters();
	},
	
	//just used to for sorting order
	'statusFromData':function(data)
	{
		var statusObj;
		statusObj = {
			'type':data.type,
			'passworded':data.passworded,
			'locked':data.locked,
			'rank':data.rank,
			'progress':data.progress
		};
		return JSON.stringify( statusObj )
	},
	
	'updateBattle':function(data)
	{
		var members;
		var item = this.store.get( data.battleId );
		if( typeof item === 'undefined' )
		{
			return;
		}
		for(attr in data){
			if(attr !== 'battleId' )
			{	
				item[attr] = data[attr];
			}
		}
		
		item.status = this.statusFromData(data);
		members = item.members;
		item.players = parseInt( members ) - parseInt( data.spectators );
		this.delayedUpdateFilters();
		this.store.notify( item, data.battleId );
	},
	
	'setPlayer':function(data)
	{
		var members, playerlist, spectators ;
		var item = this.store.get( data.battleId );
		if( typeof item === 'undefined' )
		{
			return;
		}
		
		members = parseInt( item.members );
		playerlist = item.playerlist;
		spectators = parseInt( item.spectators );
		if( data.add )
		{
			members += 1;
			playerlist[data.name] = true;
		}
		else
		{
			members -= 1;
			delete playerlist[data.name];
		}
		item.members = members;
		item.playerlist = playerlist;
		item.players = members - spectators;
		
		this.store.notify( item, data.battleId )
	},
	
	
	'startup2':function()
	{
		if( this.startMeUp )
		{
			this.bc.startup();
			//this.resizeAlready();
			if( this.grid.domNode.clientHeight === 0 )
			{
				return;
			}
			this.startMeUp = false;
			//this.startup();
			this.grid.startup();
			this.userList.startup2();
			
			this.delayedUpdateFilters();
		}
	},
	'resizeAlready':function()
	{
		this.startup2();
		this.bc.resize();
	},
	'blank':null
}); }); //declare lwidgets.BattleManager
