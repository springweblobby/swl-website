///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////



define(
	//'lwidgets.BattleMap',
	[
		"dojo/_base/declare",
		
		'dojo/text!./templates/battlemap.html?' + cacheString,
		
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		'dojo/_base/event',
		
		'lwidgets',
		'lwidgets/ToggleIconButton',
		'lwidgets/MapOptions',
		
		
		'dijit/ProgressBar',
		'dijit/Dialog',
		'dijit/form/Select',
		'dijit/form/FilteringSelect',
		'dijit/form/ComboBox',
		'dijit/form/Button',
		
		'dojo/store/Memory',
		'dojo/request/script',
		'dojo/request/xhr',
		
		//extras
		
	],
	function(declare,
		template, WidgetBase, Templated, WidgetsInTemplate,
		array, domConstruct, domStyle, domAttr, lang, topic, event,
		lwidgets, ToggleIconButton, MapOptions,
		ProgressBar,
		Dialog,
		Select, FilteringSelect, ComboBox,
		Button,
		
		Memory,
		script,
		xhr
		){
	//function(declare, dojo, dijit, WidgetBase ){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {		

	templateString : template,
	
	map: '',
	mapClean: '',
	mapCleanUnderscores: '',
	mapTypeIndex: 0,
	mapTypes : [ 'minimap', 'heightmap', 'metalmap' ],
	
	startBoxes: null,
	startBoxColors: null,
	curStartBoxColor: 0,
	
	newBox_x1: false,
	newBox_y1: false,
	
	newBox_x2: false,
	newBox_y2: false,
	
	paintDiv: null,
	drawing: false,
	
	addBoxes: true,
	
	gotMap: false,
	
	interimStartBox: null,
	processName: '',
	
	appletHandler: null,
	battleRoom: null,
	
	preventDrawMap: true,
	
	modOptions: null,
	
	mapParamWidgets:null,
	
	selAllianceStyle: '3px solid cyan',
	
	postCreate: function()
	{
		var boxButton;
		//this.startBoxColors = ['green', 'red', /*'blue',*/ 'cyan', 'yellow', 'magenta', 'lime', 'maroon', /*'navy'*/, 'olive', 'purple', 'teal' ];
		this.startBoxColors = ['red', 'maroon', 'crimson', 'tomato', 'salmon' ];
		this.updateMap();
		
		this.mapParamWidgets = {};
		
		this.startBoxes = {};
		/*
		this.subscribe('Lobby/map/addrect', 'addRectangle' );
		this.subscribe('Lobby/map/remrect', function(data){
			var startBox = this.startBoxes[ data.aID ];
			domConstruct.destroy( startBox  );
		} );
		*/
		this.subscribe('Lobby/download/processProgress', 'updateBar' );

		dropDownDontStealFocus(this.boxesDropDown);
	},
	
	remStartRect: function(aID)
	{
		if( aID in this.startBoxes )
		{
			var startBox = this.startBoxes[ aID ];
			domConstruct.destroy( startBox  );
			delete this.startBoxes[ aID ];
		}
	},
	
	focusDownloads: function(e)
	{
		event.stop(e);
		topic.publish('Lobby/focusDownloads' );
	},
	
	updateBar: function(data)
	{
		if( data.processName !== this.processName )
		{
			return;
		}
		this.mapDownloadBar.update( {progress: data.perc} );
	},
	showBar: function( processName )
	{
		this.processName = processName;
		this.mapDownloadBar.update( {progress: 0} );
		domStyle.set( this.mapDownloadBar.domNode, 'display', 'block');
	},
	hideBar: function()
	{
		this.processName = '';
		domStyle.set( this.mapDownloadBar.domNode, 'display', 'none');
	},
		
	boxButtonToggle: function(val)
	{
		this.addBoxes = val;
		domStyle.set( this.paintDiv, 'zIndex', (val ? '3' : '-8') );
	},
	
	setGotMap: function(gotMap)
	{
		var mapName;
		var mapCount, i;
		domStyle.set( this.mapWarning, 'display', gotMap ? 'none' : 'inline');
		if( gotMap )
		{
			var os = this.appletHandler.lobby.os;
			return this.loadMapOptions();
		}
	},
	
	isHosting: function() 	{ return this.battleRoom.hosting; },
	isLocal: function() 		{ return this.battleRoom.local; },
	
	startDrawMap: function(e)
	{
		var	x1,y1,x2,y2,
			s_x1,s_y1,s_x2,s_y2,
			s_w,s_h, addboxMessage, mouseCoord,
			i, aID
			;
		
		if( !this.addBoxes || this.preventDrawMap )
		{
			return;
		}
		
		if(this.drawing)
		{
			this.drawing = false;
			
			//pwidth = parseInt( domStyle.getComputedStyle(this.mapImg).width );
			//pheight = parseInt( domStyle.getComputedStyle(this.mapImg).height );
			pwidth = parseInt( domStyle.get(this.boxesDiv, 'width' ) );
			pheight = parseInt( domStyle.get(this.boxesDiv, 'height' ) );
			
			x1 = parseInt( domStyle.get(this.interimStartBox, 'left' ) )
			y1 = parseInt( domStyle.get(this.interimStartBox, 'top' ) )
			x2 = pwidth - parseInt( domStyle.get(this.interimStartBox, 'right') )
			y2 = pheight - parseInt( domStyle.get(this.interimStartBox, 'bottom') )
			
			
			x1 = Math.round( (x1/pwidth)*200);
			y1 = Math.round( (y1/pheight)*200);
			x2 = Math.round( (x2/pwidth)*200);
			y2 = Math.round( (y2/pheight)*200);
			
			this.addStartBox(x1, y1, x2, y2);
			
			domConstruct.destroy( this.interimStartBox );
			
			return;
		}
		this.drawing = true;
		
		// http://stackoverflow.com/questions/5085689/tracking-mouse-position-in-canvas
		/*
		this.newBox_x1 = e.layerX;
		this.newBox_y1 = e.layerY;
		*/
		//mouseCoord = getMouseCoord(this.mapDiv, e)
		mouseCoord = getMouseCoord(this.boxesDiv, e)
		this.newBox_x1 = mouseCoord.x;
		this.newBox_y1 = mouseCoord.y;
		
		
		this.interimStartBox = domConstruct.create('div',
			{
				style: {
					background: 'gray',
					border: '1px dotted black',
					
					left: this.newBox_x1 +'px',
					top: this.newBox_y1 +'px',
					minWidth: 50,
					minHeight: 50,
					
					width: 10,
					height: 10,
					opacity: 0.8,
					position: 'absolute',
					//'position':'relative',
					zIndex: 2
				}
			},
			//this.mapDiv
			this.boxesDiv
			//this.paintDiv
		);
		this.intStartBoxPosX = this.newBox_x1;
		this.intStartBoxPosY = this.newBox_y1;
	},
	
	addStartBox:function(x1,y1,x2,y2)
	{
		var s_x, sy, s_w, s_h; //springie boxes
		
		//direct hosting
		if( this.isHosting() || this.battleRoom.spads )
		{
			if( this.battleRoom.spads )
			{
				addboxMessage = "!addbox " + x1 +" "+ y1 +" "+ x2 +" "+ y2;
				this.battleRoom.say(addboxMessage);
			}
			else
			{
				for(aID=0; aID<16; aID+=1)
				{
					if( !(aID in this.startBoxes ) )
					{
						this.battleRoom.addStartRect(aID, x1, y1, x2, y2)
						if( !this.isLocal() )
						{
							addboxMessage = 'ADDSTARTRECT ' + aID + ' ' + x1 +" "+ y1 +" "+ x2 +" "+ y2;
							topic.publish( 'Lobby/rawmsg', {msg: addboxMessage} );
						}
						break;
					}
				}
			}
		}
		else
		{
			//Springie commands
			s_x = Math.round( x1/2 );
			s_y = Math.round( y1/2 );
			
			s_w = Math.round( (x2-x1)/2 );
			s_h = Math.round( (y2-y1)/2 );
			
			addboxMessage = "!addbox " + s_x +" "+ s_y +" "+ s_w +" "+ s_h;
			this.battleRoom.say(addboxMessage);
		}
	},
	
	intStartBoxPosX:0,
	intStartBoxPosY:0,
	
	drawInterimStartBox: function(e)
	{
		var left, top;
		var right, bottom;
		var parentWidth, parentHeight;
			
		if( this.drawing )
		{
			mouseCoord = getMouseCoord(this.boxesDiv, e);
			
			right = Math.max( this.intStartBoxPosX, mouseCoord.x );
			left = Math.min( this.intStartBoxPosX, mouseCoord.x );
			top = Math.min( this.intStartBoxPosY, mouseCoord.y );
			bottom = Math.max( this.intStartBoxPosY, mouseCoord.y );
			
			this.newBox_x2 = right;
			this.newBox_y2 = bottom;
			
			parentWidth 	= domStyle.get(this.boxesDiv, 'width');
			parentHeight 	= domStyle.get(this.boxesDiv, 'height');
			
			right 	= parentWidth - right;
			bottom 	= parentHeight-bottom;
			
			left 	= Math.max(left, 0);
			top 	= Math.max(top, 0);
			right 	= Math.max(right, 0);
			bottom 	= Math.max(bottom, 0);
			
			domStyle.set( this.interimStartBox, 'right', right+'px' );
			domStyle.set( this.interimStartBox, 'bottom', bottom+'px' );
			
			domStyle.set( this.interimStartBox, 'left', left+'px' );
			domStyle.set( this.interimStartBox, 'top', top+'px' );
		}
	},
	
	selAlliance:-1,
	setSelectedAlliance:function(selAlliance, isSpec)
	{
		var color;
		selAlliance = (isSpec ? -1 : parseInt( selAlliance ) );
		if( this.selAlliance === selAlliance )
		{
			return;
		}
		this.selAlliance = selAlliance;
		for( aID in this.startBoxes)
		{
			aID = parseInt(aID)
			
			domStyle.set( this.startBoxes[aID], 'border', aID === this.selAlliance ? this.selAllianceStyle: '' );
			
			color = this.startBoxColors[ this.curStartBoxColor ];
			this.curStartBoxColor += 1;
			this.curStartBoxColor %= this.startBoxColors.length;
			
			domStyle.set( this.startBoxes[aID], 'background', aID === this.selAlliance ? 'green': color );
			
		}
	},
	
	addStartRect: function(aID, x1, y1, x2, y2)
	{
		var color;
		var x1p,y1p,x2p,y2p;
		var startBoxDiv, allyDiv;
		var range;
		
		range = 200;
		
		
		aID = parseInt(aID);

		if( aID in this.startBoxes )
		{
			this.remStartRect(aID);
		}

		
		color = this.startBoxColors[ this.curStartBoxColor ];
		this.curStartBoxColor += 1;
		this.curStartBoxColor %= this.startBoxColors.length;
		
		x1p = Math.round( x1 / range * 100 );
		y1p = Math.round( y1 / range * 100 ); 
		x2p = 100-Math.round( x2 / range * 100 );
		y2p = 100-Math.round( y2 / range * 100 );
		
		startBoxDiv = domConstruct.create('div',
			{
				style: {
					background: color,
					
					left: x1p + "%",
					top: y1p + "%",
					
					right: x2p + "%",
					bottom: y2p + "%",
					opacity: 0.5,
					position: 'absolute',
					zIndex: 1,
					
					border:aID === this.selAlliance ? this.selAllianceStyle : '',
				},
				onmousedown: lang.hitch(this, function(){
					var clearBoxMessage;
					if (this.preventDrawMap)
					{
						this.battleRoom.setAlliance( aID );
						return;
					}
					else if( this.addBoxes )
					{
						return;
					}
					
					if( this.isHosting() )
					{
						this.battleRoom.remStartRect(aID);
						if( !this.isLocal() )
						{
							clearBoxMessage = 'REMOVESTARTRECT ' + aID;
							topic.publish( 'Lobby/rawmsg', {msg: clearBoxMessage} );
						}
					}
					else
					{
						clearBoxMessage = "!clearbox " + (aID+1);
						topic.publish( 'Lobby/rawmsg', {msg: 'SAYBATTLE '+ clearBoxMessage} );
					}
				}),
				onmouseover: function(e){
					domStyle.set( startBoxDiv, 'border', '2px dotted white' )
				},
				onmouseout: lang.hitch(this, function(e){
					domStyle.set( startBoxDiv, 'border', ( aID === this.selAlliance ? this.selAllianceStyle : '') )
				})
			},
			//this.mapDiv
			this.boxesDiv
			//this.paintDiv
		);
		if( aID === this.selAlliance )
		{
			domStyle.set(startBoxDiv, { backgroundColor: 'green' });
		}
		allyDiv = domConstruct.create('div',
			{
				innerHTML: (aID+1),
				style: {
					//'width':'auto',
					width: '100%',
					left: '1px',
					position: 'absolute',
					verticalAlign: 'middle',
					textAlign: 'center',
					//'background':'black',
					color: 'white',
					fontWeight: 'bold',
					top: '1px',
					textShadow: '2px 2px black'
				}
			},
			startBoxDiv
		);
		this.startBoxes[aID] = startBoxDiv;
	},
	
	setMap: function(map)
	{
		this.map = map;
		this.modOptions = null;
		this.mapClean = this.map.replace(/ /g, '%20');
		this.mapCleanUnderscores = this.map.replace(/ /g, '_');
		this.updateMap();
		
	},
	clearMap: function()
	{
		var aID;
		this.map = null;
		domAttr.set( this.mapImg, 'src', '' );
		domAttr.set( this.mapImg, 'title', '' );
		domAttr.set( this.mapLink, 'href', '' );
		domAttr.set( this.mapLink, 'innerHTML', '' );
		
		for(aID in this.startBoxes){
			var startBox = this.startBoxes[aID];
			domConstruct.destroy(startBox);
		}
		this.startBoxes = {};
	},
	
	cycleMaps: function()
	{
		this.mapTypeIndex += 1;
		this.mapTypeIndex %= 3;
		
		this.updateMap();
	},
	
	getMapImgFromName: function(mapName)
	{
		mapName = mapName.replace(/ /g, '_');
		return 'http://zero-k.info/Resources/' + mapName + '.minimap.jpg';
	},
	
	getMapLink: function()
	{
		return 'http://zero-k.info/Maps/DetailName?name='+ this.mapClean;
	},
	
	updateMap: function()
	{
		if(this.mapClean === '')
		{
			return;
		}
		domAttr.set( this.mapImg, 'src', 'http://zero-k.info/Resources/' + this.mapCleanUnderscores + '.' + this.mapTypes[this.mapTypeIndex] + '.jpg' );
		domAttr.set( this.mapImg, 'title', this.map );
		domAttr.set( this.mapLink, 'href', this.getMapLink() );
		domAttr.set( this.mapLink, 'innerHTML', this.map );
		
		this.updateMapDiv();
	},
	
	updateMapDiv: function()
	{
		var mapImgHeight = domStyle.getComputedStyle(this.mapImg).height
		var mapImgWidth = domStyle.getComputedStyle(this.mapImg).width
		var mapDivWidth  = domStyle.getComputedStyle( this.mapDiv ).width ;
		
		domStyle.set(this.boxesDiv, 'height', mapImgHeight );
		domStyle.set(this.boxesDiv, 'width', mapImgWidth );
		domStyle.set(this.boxesDiv, 'left', ((parseInt(mapDivWidth) - parseInt(mapImgWidth))/2)+'px' );
	},
	updateMapSelect: function(mapSelect, mapOptionsStore, val)
	{
		var query;
		var param;
		var mapParamWidget;
		query = {search: mapSelect.get('displayedValue') };
		
		for( param in this.mapParamWidgets )
		{
			mapParamWidget = this.mapParamWidgets[param];
			query[param] = mapParamWidget.get('value');
		}
		
		//empty it
		var items;
		items = mapOptionsStore.query({id: new RegExp('.*') });
		array.forEach(items, function(item){
			mapOptionsStore.remove(item.id)
		}, this);
		
		mapOptionsStore.put( { label: 'Loading maps, please wait...', id: '' } );
		
		//this is hacky
		script.get("http://zero-k.info/Maps/JsonSearch", {
			jsonp: "callback",
			query: query
		}).then(lang.hitch(this, function(mapOptionsStore, data){
		
			//empty it
			var items;
			var addedMap;
			items = mapOptionsStore.query({id: new RegExp('.*') });
			array.forEach(items, function(item){
				mapOptionsStore.remove(item.id)
			}, this);
		
			//console.log(data)
			array.forEach( data, function(map){
				var mapName
				addedMap = true;
				mapName = map.InternalName;
				mapOptionsStore.put( {
					name: mapName,
					id: mapName,
					label: ''
						+ '<div style="position:relative; height:50px; ">'
							+ '<div style="position:absolute; width:50px; height:50px; padding:2px;  ">'
								+ '<img src="' + this.getMapImgFromName(mapName) + '" style="max-width:100%; max-height:100%" /> '
							+ '</div>'
							+ '<div style="position:absolute; padding:2px; width:150px; height:50px; left:60px; ">'
									+ mapName
									+ '<br /><i>by '
									+ map.AuthorName
									+ '</i>'
								
							+ '</div>'
						+ '</div>'
						
						+'',
						
				} )
			}, this )
			
			if (!addedMap)
			{
				mapOptionsStore.put( { label: 'No maps found, please change your search.', id: '' } );
			}	
			
		}, mapOptionsStore), function(err){
			// Handle the error condition
			console.log(err)
		});
		
		
	},
				
	selectMap: function()
	{
		var dlg, content, mapCount, i, mapName, mapSelect, mapOptions, okButton, url;
		var mapParams
		
		content = domConstruct.create('div', {innerHTML: 'Select Map: '})
		
		if( !this.isHosting() )
		{
		
			/*
			url = "http://zero-k.info/Maps";
			window.open(url,'_blank');
			return;
			*/
			
			
			mapOptions = [];
			var mapOptionsStore = new Memory({ });
			
			mapSelect = new FilteringSelect({
				//'value':+'', //must be string
				style: {width: '250px'},
				//options:mapOptions,
				queryExpr:'*${0}*',
				//highlightMatch:'all',
				autoComplete:false,
				store: mapOptionsStore ,
				searchAttr: 'name',
				labelAttr: "label",
				labelType: "html",
				pageSize: 5,
			}).placeAt(content);
			mapSelect.on( 'keyup', lang.hitch(this, 'updateMapSelect', mapSelect, mapOptionsStore ) );
		
			/*
				assymetrical	Any
				chicken	Any
				elongated	Any
				featured	true
				featured	false
				ffa	Any
				hills	Any
				is1v1	Any
				isDownloadable	1
				needsTagging	false
				offset	0
				sea	Any
				search	test
				size	Any
				special	0
			*/
			mapParams = [
				'assymetrical',
				'chicken',
				'elongated',
				'ffa',
				'special',
				'featured' //bool
			];
			
			boolParams = [ {label:'Yes', value:'true'}, {label:'No', value:'false'},  ]
			triStateParams = [ {label:'Any', value:'Any'}, {label:'Yes', value:'true'}, {label:'No', value:'false'},  ];
			
			triStateParams2 = [ {label:'Any', value:'-1'}, {label:'Yes', value:'true'}, {label:'No', value:'false'},  ];
			
			var mapParamSelect;
			
			domConstruct.create('br', {}, content )
			domConstruct.create('br', {}, content )
				
				
			array.forEach(mapParams, function(param){
				var selectParams;
				var rowDiv;
				var div;
				
				rowDiv = domConstruct.create('div', {style:{display:'table-row', height:'40px' }  }, content )
				div = domConstruct.create('div', {innerHTML:param.substr(0,1).toUpperCase() + param.substr(1) + '&nbsp;&nbsp;', style:{display:'table-cell'}  }, rowDiv )
				div = domConstruct.create('div', {style:{display:'table-cell'}  }, rowDiv )
				selectParams = triStateParams;
				if( param === 'featured' )
				{
					selectParams = boolParams;
				}
				else if( param === 'special' ) //sigh
				{
					selectParams = triStateParams2;
				}
				
				mapParamSelect = new Select({
					options: selectParams,
					onChange:lang.hitch(this, 'updateMapSelect', mapSelect, mapOptionsStore ),
					style:{width:'80px'}
				}).placeAt(div );
				dropDownDontStealFocus(mapParamSelect);
				mapParamSelect.on('change', lang.hitch(this,function(mapSelect){
					mapSelect.set('value', '');
				}, mapSelect ) );
				this.mapParamWidgets[param] = mapParamSelect;
			}, this);
			
			domConstruct.create('br', {}, content )
			
			this.updateMapSelect(mapSelect, mapOptionsStore);
			
			okButton = new Button({
				label: 'Select',
				onClick: lang.hitch(this, function(){
					var smsg;
					smsg = "!map " + mapSelect.get('value');
					topic.publish( 'Lobby/rawmsg', {msg: 'SAYBATTLE '+ smsg} );
					dlg.hide();
				})
			}).placeAt(content);
		
		}
		else
		{
		
			this.battleRoom.getUnitsync().getMapCount().then(lang.hitch(this, function(mapCount){
			
				mapOptions = [];
				for(i=0; i < mapCount; i++)
				{
					this.battleRoom.getUnitsync().getMapName( i ).then(lang.hitch(this, function(mapName){
						mapOptions.push( {
							name: mapName,
							id: mapName,
							label: ''
								+ '<div style="height:50px;">'
								+ '<img src="' + this.getMapImgFromName(mapName)
								+ '" style="max-height:100%; max-width:50px; vertical-align:middle; " /> '
								+ mapName
								+ '</div>',
						} )
					}));
				}
				
				mapSelect = new FilteringSelect({
					//'value':+'', //must be string
					style: {width: '250px'},
					queryExpr:'*${0}*',
					autoComplete:false,
					store: new Memory({ data: mapOptions }),
					searchAttr: 'name',
					labelAttr: "label",
					labelType: "html",
					pageSize: 5,
				}).placeAt(content);
				
				okButton = new Button({
					label: 'Select',
					onClick: lang.hitch(this, function(){
						this.battleRoom.updateBattle({
							battleId: this.battleRoom.battleId,
							map: mapSelect.get('value')
						});
						dlg.hide();
					})
				}).placeAt(content);
			}));
		}
		
		
		
		dlg = new Dialog({
			title: 'Select Map',
			content: content
		});
		dlg.show();
	},
	
	showMapOptions: function()
	{
		//alert2('Map options are disabled on weblobby at this time.'); return;
		
		
		/*
		if( !this.loadedBattleData )
		{
			alert2('Still loading game data, please wait...')
			return;
		}
		*/
		if( this.battleRoom.getUnitsync() === null )
		{
			alert2('Map options not available.')
			return;
		}

		if( this.modOptions === null )
		{
			this.battleRoom.syncCheckDialog( 'You cannot edit the map options because you are missing the map.', true );
			return;
		}
		this.modOptions.showDialog();
	},
	
	loadMapOptions: function()
	{
		if( this.map === null )
		{
			return;
		}
		
		this.modOptions = new MapOptions({
			battleMap: this,
		})
		
		return this.modOptions.loadedPromise.then(lang.hitch(this, function(){
			for( var key in this.extraScriptTags )
			{
				var val = this.extraScriptTags[key]
				if( key.toLowerCase().match( /game\/mapoptions\// ) )
				{
					var optionKey = key.toLowerCase().replace( 'game/mapoptions/', '' );
					this.modOptions.updateModOption({key: optionKey, value: val}  );
				}
			}
		}));
	},
	
	
	toggleEditBoxDiv:function(val)
	{
		this.preventDrawMap = !val;
		//this.boxEditTypeButton.setDisabled(!val);
		
		domStyle.set( this.startBoxButtonsDiv, 'border', val ? '1px dotted red' : '');
		domStyle.set( this.mapImg, 'outline', val ? '2px dotted red' : '');
		
		if(val)
		{
			domStyle.set( this.paintDiv, 'zIndex', (this.addBoxes ? '3' : '-8') );
			domStyle.set( this.editBoxDiv, 'display', 'block' );
			domStyle.set( this.mapDiv, 'top', '90px' );	
		}
		else
		{
			domStyle.set( this.paintDiv, 'zIndex', '-8' );
			domStyle.set( this.editBoxDiv, 'display', 'none' );
			domStyle.set( this.mapDiv, 'top', '55px' );	
		}
	},
	
	clearBoxes:function()
	{
		if( !this.isHosting() )
		{
			this.battleRoom.say('!clearbox');
			return;
		}
		for( aID in this.startBoxes )
		{
			this.remStartRect(aID);
		}
	},
	
	doSplit:function(vh, splitter)
	{
		var msg;
		
		if( !this.isHosting() )
		{
			msg = '!split ' + vh + ' ' + splitter.get('value');
			this.battleRoom.say(msg);
			return;
		}
		
		this.clearBoxes();
		
		splitVal = splitter.get('value');
		splitVal /= 100;
		splitVal200 = Math.floor( splitVal*200 );
		if (vh === 'h')
		{
			this.addStartBox(0, 0, 200, splitVal200 );
			this.addStartBox(0, 200 - splitVal200, 200, 200);
		}
		else
		{
			this.addStartBox(0, 0, splitVal200, 200 );
			this.addStartBox(200 - splitVal200, 0, 200, 200);
		}
		
	},
	
	
	doHorizontalSplit:function()
	{
		this.doSplit('h', this.horizSplitter);
	},
	doVerticalSplit:function()
	{
		this.doSplit('v', this.vertSplitter);
	},
	
	doCornerSplit:function()
	{
		var alt = this.cornerSplitterAlt.get('checked') ? 'b' : 'a';
		if( !this.isHosting() )
		{
			this.battleRoom.say('!corners ' + alt + ' ' + this.cornerSplitter.get('value') );
			return;
		}
		this.clearBoxes();
		
		splitVal = this.cornerSplitter.get('value');
		splitVal /= 100;
		splitVal200 = Math.floor( splitVal*200 );
		if (alt === 'a')
		{
			this.addStartBox(0, 0, splitVal200, splitVal200 );
			this.addStartBox(200-splitVal200, 200-splitVal200, 200, 200 );
			
			this.addStartBox(0, 200-splitVal200, splitVal200, 200 );
			this.addStartBox(200-splitVal200, 0, 200, splitVal200 );
			
		}
		else
		{
			this.addStartBox(0, 200-splitVal200, splitVal200, 200 );
			this.addStartBox(200-splitVal200, 0, 200, splitVal200 );
			
			this.addStartBox(0, 0, splitVal200, splitVal200 );
			this.addStartBox(200-splitVal200, 200-splitVal200, 200, 200 );
			
		}
	},
	
	setRadialBoxCount:function(value)
	{
		this.radialBoxCount.set('value', value);
	},
	setRadialBoxes:function()
	{
		var n = this.radialBoxCount.get('value');
		var r = this.radialBoxRadius.get('value');
		var a = this.radialBoxSize.get('value');
		
		var pi = 3.1415;
		var x,y
		var i;
		
		this.clearBoxes();
		
		for(i = 0.001; i <= 2*pi; i += 2*pi/n )
		{
			x = 100 + Math.sin(i)*r;
			y = 100 + Math.cos(i)*r;
		  
			x = Math.floor (x);
			y = Math.floor (y);
			
			this.addStartBox( x-a, y-a, x+a, y+a);
			
		}
		
	}
	
	
}); }); //declare lwidgets.BattleMap
