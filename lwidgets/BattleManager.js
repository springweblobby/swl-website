///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/BattleManager',
	[
		"dojo/_base/declare",
		
		'dijit/_WidgetBase',
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		
		'dojo/_base/event',
		
		'dojo/topic',
		'dojo/on',
		
		'lwidgets/BattleFilter',
		'lwidgets/UserList',
		
		"dojo/store/Memory",
		"dojo/store/Observable",
		
		'dgrid/OnDemandGrid',
		'dgrid/Selection',
		'dgrid/extensions/ColumnResizer',
		'dgrid/extensions/ColumnReorder',
	
		'dijit/form/Button',
		'dijit/form/DropDownButton',
		
		'dijit/Dialog',
		'dijit/TooltipDialog',
		"dijit/popup",
		
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
			
			WidgetBase,
			array, domConstruct, domStyle, domAttr, lang, event, topic, on,
			
			BattleFilter,
			UserList,
			
			Memory, Observable,
			Grid, Selection, ColumnResizer,
			ColumnReorder,
			
			Button, DropDownButton,
			Dialog,
			TooltipDialog, popup,
		
			BorderContainer,
			TabContainer,
			ContentPane,
			TextBox,
			Select
			
	){


return declare( [ WidgetBase ], {
	grid: null,
	startMeUp: true,
	//store:null, //mixed in
	
	filters: null,
	scriptPassword: 'a',
	users: null,
	
	bc: null,
	filterDiv: null,
	filterBodyDiv: null,
	
	quickMatchButton: null,
	
	postponeUpdateFilters: true,
	
	count: 0,
	userCountSpan: null,
	
	setQuickMatchButton: function( enabled )
	{
		this.quickMatchButton.set( 'label', enabled ?
			'Quickmatch - <span style="color:green; ">Enabled' :
			'Quickmatch - <span style="color:red; ">Disabled'
		);
	},
	
	buildRendering: function()
	{
		var filterTitleDiv, layout, newFilterButton, mainDiv, iconWidth,
			tempPane1, tempPane2,
			rightPaneDiv
			;
		//this.store = {};
		this.filters = [];
		
		mainDiv = domConstruct.create('div', {
			style: {
				//position:'absolute', left:'40px', bottom:'0px',
				width: '100%',
				height: '100%',
				padding: '0px',
			},
		});
		this.domNode = mainDiv;
		
		this.userCountSpan = domConstruct.create('span', {} );
		/*
		var buttons;
		buttons = domConstruct.create('div', {id: 'chatmanagerbuttons', style: {position: 'absolute', padding: '0px', left: '0px', top: '0px' ,height: '150px', width: '20px' } }, this.domNode );
		
		newButton = new Button( {
            style: {height: '20px', width: '20px'  },
			label: 'Join Selected Battle Room',
			showLabel: false,
			iconClass: 'smallIcon startImage',
			onClick: lang.hitch( this, 'joinSelBattle' )
        }).placeAt(buttons);
		
		this.quickMatchButton = new Button( {
            style: {height: '20px', width: '20px'  },
			label: 'Open "Quick Match" Dialog',
			showLabel: false,
			iconClass: 'smallIcon qmImage',
			onClick: function(){
				topic.publish('Lobby/juggler/showDialog', {} );
			}
        }).placeAt(buttons);
		*/
		this.bc = new BorderContainer({
			design: "sidebar",
			gutters: true,
			liveSplitters: true,
			style: {
				position:'absolute', left:'0px', right:'0px', top:'0px',
				bottom:'15px', //temporary fix until a solution is found to why lobby toppane is cut off.
				//width: '100%',
				//height: '90%',
				padding: '0px'
			}
		}).placeAt(mainDiv);
		
		
		tempPane1 = new ContentPane({ splitter: true, region: 'center',
			style: {
				width: '100%', height: '100%', padding: '1px', overflow: 'hidden',
			},
			class:'battlesSection',
		});
		tempPane2 = new ContentPane({ splitter: true, region: 'trailing', minSize: 50, maxSize: 600, style: {width: '300px', padding: '0px', overflowX: 'hidden'} } );
		this.bc.addChild(tempPane1)
		this.bc.addChild(tempPane2)
		
		iconWidth = 35;
		
		// set the layout structure:
        layout = [
			{	field: 'title',
				renderHeaderCell: lang.hitch(this, function (node) {
					var headerCell = domConstruct.create('span', { innerHTML: '<img src="img/battlehalf.png" /> Battle Name ' } );
					domConstruct.place( this.userCountSpan, headerCell );
					return headerCell;
				}),
				renderCell: lang.hitch(this, function(object, value, cell)
				{
					var div, joinLink;
					var joinButton
					
					div = domConstruct.create( 'div', { style: { padding: '1px' } } );
					
					joinButton = new Button( {
						style: {height: '24px', width: '24px'  },
						label: (object.type === '1' ? 'This is a replay.' : 'This is a battle.') + ' Click to join.',
						showLabel: false,
						iconClass: 'smallIcon ' + (object.type === '1' ? 'replayImage' : 'startImage'),
						onClick: lang.hitch( this, 'joinBattleCheckPassword', object.battleId )
					}).placeAt(div);
					/*
					joinLink = domConstruct.create('a', {
						href: '#',
						onclick: lang.hitch(this, function( battleId, e ){
							event.stop(e);
							this.joinBattleCheckPassword( battleId )
							return false;
						}, object.battleId )
					}, div );
					
					domConstruct.create('img', {
						src:		object.type === '1' ? 'img/control_play_blue.png' 	: 'img/battlehalf.png',
						title: 	(object.type === '1' ? 'This is a replay.' 			: 'This is a battle.') + ' Click to join.',
						width: '16',
						onmouseover: function() { domAttr.set( this, 'width', 18 ) },
						onmouseout: function() { domAttr.set( this, 'width', 16 ) },
					}, joinLink);
					*/
					domConstruct.create( 'span', {innerHTML: value}, div )
					
					
					if( object.passworded )
					{
						domConstruct.create('img', { src: 'img/key.png', width: 16, title: "A password is required to join", align: 'right'}, div);
					}
					if( object.locked )
					{
						domConstruct.create('img', { src: 'img/lock.png', width: 16, title: "This battle is locked and cannot be joined", align: 'right' }, div);
					}
					if( object.progress )
					{
						domConstruct.create('img', { src: 'img/blue_loader.gif', width: 16, title: "This battle is in progress", align: 'right' }, div);
					}
					if( object.rank > 0 )
					{
						domConstruct.create('span', { style: {fontSize: 'small'}, innerHTML: ' <i>[Rank'+object.rank+']</i>' }, div);
						//domConstruct.create('p', { 'style':{'fontSize':'small'}, 'innerHTML':' <i>[Rank'+object.rank+']</i>', align:'right' }, div);
					}
					if( object.natType === '1' )
					{
						domConstruct.create('img', { src: 'img/punch_glove.png', width: 16, title: "This battle is using hole punching.", align: 'right' }, div);
					}
					
					
					
					
					return div;
				})
			},
			
			{	field: 'game',
				renderHeaderCell: function (node) { return domConstruct.create('span', {innerHTML: '<img src="img/game.png" /> Game' } );}
			},
			{	field: 'map',
				renderHeaderCell: function (node) { return domConstruct.create('span', {innerHTML: '<img src="img/map.png" /> Map' } );},
				
				renderCell: lang.hitch(this, function(object, value, cell)
				{
					var div, mapLink;
					div = domConstruct.create( 'div', { style: { padding: '1px',  } } );
					domConstruct.create('span', { innerHTML: value }, div);
					if( this.settings.settings.minimapsInBattleList )
					{
						mapLink = domConstruct.create('a', { href: this.getMapLink(value), target:"_blank" }, div);
						domConstruct.create('img', { src: this.getMapImgFromName(value), height: 32, title: value, align: 'right',
							style:{maxWidth:'50%'}
						}, mapLink);
					}
					return div;
				})
				
			},
			{	field: 'country',
				renderHeaderCell: function (node) { return domConstruct.create('span', {innerHTML: '<img src="img/globe.png" title="Host Location" />' } );},
				renderCell: function(object, value, cell)
				{
					country = value in countryCodes ? countryCodes[value] : 'country not found' ;
					if(value === '??')
					{
						return domConstruct.create('img', {src: "img/flags/unknown.png", title: "Unknown Location", width: "16" } );
					}
					return domConstruct.create('img', {src: 'img/flags/'+value.toLowerCase()+'.png', title: country, width: "16" } );					
				}
			},
			{	field: 'host',
				renderHeaderCell: function (node) { return domConstruct.create('span', {innerHTML: '<img src="img/napoleon.png" /> Host' } );}
			},
			{	field: 'players',
				renderHeaderCell: function (node) { return domConstruct.create('span', {innerHTML: '<img src="img/soldier.png" title="Active Players">' } );},
			},
			{	field: 'max_players',
				renderHeaderCell: function (node) { return domConstruct.create('span', {innerHTML: '<img src="img/grayuser.png" title="Maximum Spots">' } );}
			},
			{	field: 'spectators',
				renderHeaderCell: function (node) { return domConstruct.create('span', {innerHTML: '<img src="img/search.png" title="Spectators" width="16" >' } );}
			},
        ];
		
		ResizeGrid = declare([ Grid, Selection, ColumnResizer, ColumnReorder ]);
		this.grid = new ResizeGrid({
			useTouchScroll: false,
			selectionMode: 'single',
			query: {id: new RegExp('.*') },
			queryOptions: {ignoreCase: true},
            store: this.store,
        
            columns: layout,
		} );
		this.grid.set('sort', 'players', true );
		this.grid.on(".dgrid-row:dblclick", lang.hitch(this, 'joinRowBattle') );
		this.grid.on(".dgrid-row:click", lang.hitch(this, function(e){
			this.grid.clearSelection();
			this.grid.select(e);
		}));
		
		this.grid.on("dgrid-select", lang.hitch(this, 'selectRowBattle') );
		
		tempPane1.set('content', this.grid)
		
		rightPaneDiv = domConstruct.create('div', {
			style: {
				width: '100%', height: '100%',
				padding:'0px',
				overflow:'hidden',
			}
		});
		tempPane2.set('content', rightPaneDiv)
		
		
		this.userList = new UserList({name: 'battle list', style: { height: '49%' } }).placeAt(rightPaneDiv);
		
		domConstruct.create('div', { style: { height: '1%' } }, rightPaneDiv);
		
		this.filterDiv = domConstruct.create('div', {
			style: {
				border: '1px solid black',margin: '0px', padding: '0px',
				overflow:'auto',
				height: '49%',
				position: 'relative',
			},
			class:'filtersSection',
		}, rightPaneDiv);
		
		
		
		filterTitleDiv = domConstruct.create('div', { style: {fontWeight: 'bold'}, 'class': 'topicDiv' }, this.filterDiv );
		
		this.filterBodyDiv = domConstruct.create('div', {
			style: {
				position: 'absolute',
				top:'35px',
				bottom:'0px',
				width:'100%',
				margin: '0px', padding: '0px',
				overflow:'auto',
			}
		}, this.filterDiv);
		
		
		newFilterButton = new Button({
			label: 'Add a Filter',
			showLabel: false,
			iconClass: 'smallIcon plusImage',
			onClick: lang.hitch(this, 'addFilter')
		}).placeAt(filterTitleDiv);
		
		domConstruct.create('span', {innerHTML: 'Filters'}, filterTitleDiv )
		
		var quickFiltersButton;
		quickFiltersButton = new DropDownButton({
			iconClass: 'smallIcon starImage',
			showLabel: false,
			label: 'Quick Filters',
			dropDown: this.makeQuickFiltersDialog(),
			style: {float: 'right'}
		}).placeAt(filterTitleDiv);
		
		
		array.forEach( this.settings.settings.filters, function(filter)
		{
			/*
			this.addFilter({
				'name':'progress',
				'comparator':'false',
				'value':'Zero',
			})*/
			
			this.addFilter( filter )
		}, this);
		
		this.subscribe('Lobby/battles/updatebattle', 'updateBattle' );
		this.subscribe('Lobby/battles/addplayer', function(data){ data.add=true; this.setPlayer(data) });
		this.subscribe('Lobby/battles/remplayer', function(data){ data.add=false; this.setPlayer(data) });
		
		this.subscribe('Lobby/battles/updatefilters', 'updateFilters');
		this.subscribe('Lobby/battles/joinbattle', 'joinBattleCheckPassword');
		
		//dumb hax
		this.subscribe('ResizeNeeded', function(){
			setTimeout( function(thisObj){
				thisObj.resizeAlready();
			}, 400, this );
		} );
		
	},
	
	getMapImgFromName: function(mapName)
	{
		mapName = mapName.replace(/ /g, '_');
		return 'http://zero-k.info/Resources/' + mapName + '.minimap.jpg';
	},
	
	getMapLink: function(mapName)
	{
		mapName = mapName.replace(/ /g, '%20');
		return 'http://zero-k.info/Maps/DetailName?name='+ mapName;
	},
	
	addFilter: function( filterData )
	{
		if( filterData === null || typeof filterData === 'undefined' )
		{
			filterData = {};
		}
		var filter1 = new BattleFilter( filterData ).placeAt(this.filterBodyDiv);
		this.filters.push( filter1 );
		filter1.killFilter = lang.hitch(this, function(){
			this.filters.remove(filter1)
			filter1.destroyRecursive(false);
			//delete filter1
			this.updateFilters();
		});
	},
	makeQuickFiltersDialog: function()
	{
		var dlg;
		var mainDiv;
		var button;
		
		mainDiv = domConstruct.create('div', {} );
		dlg = new TooltipDialog({
			content: mainDiv,
			style: { width: '220px' },
		});
		domConstruct.create('div', {innerHTML: '<b>Quick Filters</b>', style: {textAlign: 'center'}}, mainDiv)
		button = new Button({
			label: 'Hide Empty Battles',
			onClick: lang.hitch(this, function(dlg){
				this.addFilter({
					fieldName: 'players',
					comparator: '>=',
					filterValue: '1',});
				popup.close(dlg);
			}, dlg)
		}).placeAt(mainDiv);
		button = new Button({
			label: 'Hide Passworded Battles',
			onClick: lang.hitch(this, function(dlg){
				this.addFilter({
					fieldName: 'passworded',
					comparator: 'false',
					//'filterValue':'',
					});
				popup.close(dlg);
			}, dlg)
		}).placeAt(mainDiv);
		
		
		return dlg;
	},
	
	isCountableField: function(fieldName)
	{
		return array.indexOf( ['players', 'spectators', 'max_players'], fieldName ) !== -1;
	},
	isBooleanField: function(fieldName)
	{
		return array.indexOf( ['passworded', 'locked', 'progress'], fieldName ) !== -1;
	},
	
	updateFilters: function()
	{
		var queryObj, addedQuery, queryVal, queryStr,
			queryObj2,queryValList, tempElement, filterSettings
		;
		
		filterSettings = [];
		array.forEach(this.filters, function(filter){
			filterSettings.push(filter.get2())
		});
		this.settings.setSetting('filters', filterSettings)
		
		if( this.postponeUpdateFilters )
		{
			return;
		}
		
		queryStr = '';
		queryObj2 = {};
		queryObj = {};
		newFilters = [];
		addedQuery = false;
		
		array.forEach(this.filters, function(filter){
			var fieldName, comparator, value;
			
			/*
			fieldName = filter.fieldName.value;
			comparator = filter.comparator.value;
			filterValue = filter.filterValue.displayedValue;
			*/
			fieldName = filter.get2('fieldName');
			comparator = filter.get2('comparator');
			filterValue = filter.get2('filterValue');
			
			
			filterValue = filterValue.trim();
			
			if( filterValue !== '' || this.isBooleanField( fieldName ) )
			{
				if( this.isCountableField( fieldName ) )
				{
					filterValue = { value: filterValue, comparator: comparator }
				}
				else if( this.isBooleanField( fieldName ) )
				{
					filterValue = { value: comparator === 'true', comparator: '=' }
				}
				else
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
				}
				
				if( !queryObj[ fieldName ] )
				{
					queryObj[ fieldName ] = [];
				}
				
				
				queryObj[ fieldName ].push( filterValue );
				
				addedQuery = true;
			}
			
			
		}, this );
		
		for(fieldName in queryObj)
		{
			queryValList =  queryObj[fieldName];
			if( this.isCountableField( fieldName ) || this.isBooleanField( fieldName )  )
			{
				queryObj2[fieldName] = queryValList;
			}
			else
			{	
				queryStr = this.getQueryVal(queryValList)
				queryObj2[fieldName] = new RegExp(queryStr, 'i');
			}
		}
		
		if(!addedQuery)
		{
			queryObj2 = {id: new RegExp('.*') };
		}
		//this.grid.set('query', queryObj2);
		this.grid.set('query', lang.hitch(this, function(object){
			var fieldName, fieldVal
			
			for( fieldName in queryObj2 )
			{
				fieldVal = queryObj2[fieldName]
				
				if( this.isCountableField( fieldName ) )
				{
					if( array.some( fieldVal, function(fieldValItem){
						if( fieldValItem.comparator === '>=' )
						{
							if( parseInt( object[fieldName] ) < parseInt( fieldValItem.value ) )
							{
								return true;
							}
						}
						else if( fieldValItem.comparator === '<=' )
						{
							if( parseInt( object[fieldName] ) > parseInt( fieldValItem.value ) )
							{
								return true;
							}
						}
						return false;
					}) )
					{
						return false
					}
				}
				else if( this.isBooleanField( fieldName ) )
				{
					if( array.some( fieldVal, function(fieldValItem){
						return object[fieldName] !== fieldValItem.value;
					}) )
					{
						return false
					}
				}
				else
				{
					if( object[fieldName].search(fieldVal) === -1 )
					{
						return false;
					}
				}
			}
			return true;
			
		} ) );
		

	}, //updateFilters
	
	getQueryVal: function(queryValList)
	{
		var queryStr, queryChunks;
		queryStr = '';
		array.forEach(queryValList, function(queryVal){
			//queryStr += '(?=' + queryVal + ')'
			queryStr += queryVal;
		});	
		return queryStr;
	},
	selectRowBattle: function(e)
	{
		var player, players;
		players = e.rows[0].data.playerlist;
		this.userList.empty();
		for( player in players )
		{
			this.userList.addUser( this.users[player] );
		}
	},
	joinRowBattle: function(e)
	{
		var row, battleId, smsg;
		var password;
		
		row = this.grid.row(e);
		battleId = row.id;
		
		this.joinBattleCheckPassword(battleId)
	},
	
	joinSelBattle: function()
	{
		echo( this.grid )
		var sel;
		sel = this.grid.selection
		for(battleId in sel)
		{
			this.joinBattleCheckPassword(battleId);
			return;
		}
	},
	
	joinBattleCheckPassword: function( battleId )
	{
		var item = this.store.get( battleId );
		var password
		password = '';
		
		if( typeof item === 'undefined' )
		{
			console.log( 'Error! Tried to join battle that doesn\'t exist: ' + battleId );
			return;
		}
		
		if( item.passworded === true )
		{
			this.passwordDialog( battleId );
			return;
		}
		this.joinBattle(battleId, '');
	},
	
	joinBattle: function( battleId, battlePassword )
	{
		var smsg;
		smsg = 'LEAVEBATTLE'
		topic.publish( 'Lobby/rawmsg', {msg: smsg } );
		smsg = "JOINBATTLE " + battleId + ' ' + battlePassword + ' ' + this.scriptPassword;
		topic.publish( 'Lobby/rawmsg', {msg: smsg } );
	},
	
	passwordDialogKeyUp: function(battleId, input, dlg, e)
	{
		var password;
		
		password = domAttr.get( input, 'value' )
		if( e.keyCode === 13 )
		{
			this.joinBattle( battleId, password );
			dlg.hide();
		}
	},
	
	passwordDialog: function( battleId )
	{
		var dlg, input, contentDiv;
		contentDiv = domConstruct.create( 'div', {} );
		domConstruct.create( 'span', {innerHTML: 'Password '}, contentDiv );
		input = domConstruct.create( 'input', {type: 'text'}, contentDiv );
		
		dlg = new Dialog({
            title: "Enter Battle Password",
            style: "width: 300px",
			content: contentDiv
        });
		
		on(input, 'keyup', lang.hitch(this, 'passwordDialogKeyUp', battleId, input, dlg ) )
		
		dlg.show();
	},
	
	addBattle: function(data)
	{
		//data.status = this.statusFromData(data);
		data.playerlist = {};
		data.members = 1;
		data.players = 1;
		data.spectators = 0;
		data.playerlist[data.host] = true;
		
		data.id = data.battleId;
		this.store.put(data);
		
		this.count += 1;
		this.setCount();
	},
	
	removeBattle: function(data)
	{
		this.count -= 1;
		this.setCount();
	},
	
	empty: function()
	{
		var items;
		items = this.store.query({id: new RegExp('.*') });
		array.forEach(items, function(item){ this.store.remove(item.id) }, this)
		this.count = 0;
		this.setCount();
	},
	
	updateBattle: function(data)
	{
		var members;
		var item = this.store.get( data.battleId );
		if( typeof item === 'undefined' )
		{
			return;
		}
		
		for(attr in data){
			if( attr !== 'battleId' )
			{
				item[attr] = data[attr];
			}
		}
		
		//item.status = this.statusFromData(item);
		
		item.players = parseInt( item.members ) - parseInt( item.spectators );
		
		this.store.notify( item, item.id );
	},
	
	setPlayer: function(data)
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
	
	
	startup2: function()
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
			
			this.updateFilters();
		}
	},
	
	setCount: function()
	{
		domAttr.set( this.userCountSpan, 'innerHTML', '(' + this.count + ')' );
	},
	
	resizeAlready: function()
	{
		this.startup2();
		this.bc.resize();
		this.grid.resize();
		this.userList.resizeAlready();
	},
	blank: null
}); }); //declare lwidgets.BattleManager
