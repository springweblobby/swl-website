///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////



define(
	//'lwidgets.BattleMap',
	[
		"dojo/_base/declare",
		//"dojo",
		//"dijit",
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
		
		
		'dijit/ProgressBar',
		'dijit/Dialog',
		'dijit/form/Select',
		'dijit/form/Button',
		
		//extras
		
	],
	function(declare,
		//dojo, dijit,
		template, WidgetBase, Templated, WidgetsInTemplate,
		array, domConstruct, domStyle, domAttr, lang, topic, event,
		lwidgets, ToggleIconButton,
		ProgressBar,
		Dialog,
		Select,
		Button
		){
	//function(declare, dojo, dijit, WidgetBase ){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {		

	templateString : template,
	
	map:'',
	mapClean:'',
	mapCleanUnderscores:'',
	mapTypeIndex:0,
	mapTypes : [ 'minimap', 'heightmap', 'metalmap' ],
	
	startBoxes:null,
	startBoxColors:null,
	curStartBoxColor:0,
	
	newBox_x1:false,
	newBox_y1:false,
	
	newBox_x2:false,
	newBox_y2:false,
	
	paintDiv:null,
	drawing:false,
	
	addBoxes:true,
	
	gotMap:false,
	
	interimStartBox:null,
	processName:'',
	
	appletHandler:null,
	battleRoom:null,
	
	hosting:false,
	preventDrawMap:false,
	
	'postCreate':function()
	{
		var boxButton;
		this.startBoxColors = ['green', 'red', 'blue', 'cyan', 'yellow', 'magenta', 'lime', 'maroon', 'navy', 'olive', 'purple', 'teal' ];
		this.updateMap();
		
		this.startBoxes = {};
		/*
		this.subscribe('Lobby/map/addrect', 'addRectangle' );
		this.subscribe('Lobby/map/remrect', function(data){
			var startBox = this.startBoxes[ data.aID ];
			domConstruct.destroy( startBox  );
		} );
		*/
		this.subscribe('Lobby/download/processProgress', 'updateBar' );
		
		boxButton = new ToggleIconButton({
			'style':{'height':'22px', 'width':'52px' },
			'checkedIconClass':'wideIcon boxesPlusImage',
			'uncheckedIconClass':'wideIcon boxesMinusImage',
			'checked':true,
			'checkedLabel':'"Add Start Box" mode. Click to enter "Remove Start Box" mode.',
			'uncheckedLabel':'"Remove Start Box" mode. Click to enter "Add Start Box" mode.',
			'onClick':lang.hitch(this, 'boxButtonToggle' )
		}).placeAt(this.boxButtonSpan)
	},
	
	'remStartRect':function(aID)
	{
		var startBox = this.startBoxes[ aID ];
		domConstruct.destroy( startBox  );
		delete this.startBoxes[ aID ];
	},
	
	'focusDownloads':function(e)
	{
		event.stop(e);
		topic.publish('Lobby/focusDownloads' );
	},
	
	'updateBar':function(data)
	{
		if( data.processName !== this.processName )
		{
			return;
		}
		this.mapDownloadBar.update( {'progress':data.perc} );
	},
	'showBar':function( processName )
	{
		this.processName = processName;
		domStyle.set( this.mapDownloadBar.domNode, 'display', 'block');
	},
	'hideBar':function()
	{
		this.processName = '';
		domStyle.set( this.mapDownloadBar.domNode, 'display', 'none');
	},
		
	'boxButtonToggle':function(val)
	{
		this.addBoxes = val;
		domStyle.set( this.paintDiv, 'zIndex', (val ? '3' : '-8') );
	},
	
	
	'setGotMap':function(gotMap)
	{
		domAttr.set( this.mapWarning, 'src', gotMap ? '' : 'img/warning.png');
	},
	
	'startDrawMap':function(e)
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
			
			//direct hosting
			if( this.hosting || this.battleRoom.spads )
			{
				x1 = Math.round( (x1/pwidth)*200);
				y1 = Math.round( (y1/pheight)*200);
				x2 = Math.round( (x2/pwidth)*200);
				y2 = Math.round( (y2/pheight)*200);
				if( this.battleRoom.spads )
				{
					addboxMessage = "!addbox " + x1 +" "+ y1 +" "+ x2 +" "+ y2;
					topic.publish( 'Lobby/rawmsg', {'msg':'SAYBATTLE '+ addboxMessage} );
				}
				else
				{
					for(aID=0; aID<16; aID+=1)
					{
						if( !(aID in this.startBoxes ) )
						{
							this.battleRoom.addStartRect(aID, x1, y1, x2, y2)
							break;
						}
					}
				}
			}
			else
			{
				//Springie commands
				s_w = parseInt( domStyle.get(this.interimStartBox, 'width' ) )
				s_h = parseInt( domStyle.get(this.interimStartBox, 'height' ) )
			
				s_x1 = Math.round( (x1/pwidth)*100);
				s_y1 = Math.round( (y1/pheight)*100);
				s_w = Math.round( (s_w/pwidth)*100); 
				s_h = Math.round( (s_h/pheight)*100);
				
				addboxMessage = "!addbox " + s_x1 +" "+ s_y1 +" "+ s_w +" "+ s_h;
				topic.publish( 'Lobby/rawmsg', {'msg':'SAYBATTLE '+ addboxMessage} );	
			}
			
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
				'style':{
					'background':'gray',
					'border':'1px dotted black',
					
					'left':this.newBox_x1 +'px',
					'top':this.newBox_y1 +'px',
					'minWidth':10,
					'minHeight':10,
					
					'width':10,
					'height':10,
					'opacity':0.8,
					'position':'absolute',
					//'position':'relative',
					'zIndex':2
				}
			},
			//this.mapDiv
			this.boxesDiv
			//this.paintDiv
		);
	},
	'drawInterimStartBox':function(e)
	{
		var right, bottom;
		if( this.drawing )
		{
			//mouseCoord = getMouseCoord(this.mapDiv, e)
			mouseCoord = getMouseCoord(this.boxesDiv, e)
			this.newBox_x2 = mouseCoord.x;
			this.newBox_y2 = mouseCoord.y;
			
			var parentWidth, parentHeight;
			/*
			parentWidth = domStyle.get(this.mapDiv, 'width');
			parentHeight = domStyle.get(this.mapDiv, 'height');
			*/
			parentWidth = domStyle.get(this.boxesDiv, 'width');
			parentHeight = domStyle.get(this.boxesDiv, 'height');
			
			right = Math.min( parentWidth-this.newBox_x2, parentWidth-(this.newBox_x1+10) )
			bottom = Math.min( parentHeight-this.newBox_y2, parentHeight-(this.newBox_y1+10) )
			
			domStyle.set( this.interimStartBox, 'right', right+'px' )
			domStyle.set( this.interimStartBox, 'bottom', bottom+'px' )
		}
	},
	
	'addStartRect':function(aID, x1, y1, x2, y2)
	{
		var color;
		var x1p,y1p,x2p,y2p;
		var startBoxDiv, allyDiv;
		var range;
		
		range = 200;
		
		
		aID = parseInt(aID);
		
		color = this.startBoxColors[ this.curStartBoxColor ];
		this.curStartBoxColor += 1;
		this.curStartBoxColor %= this.startBoxColors.length;
		
		x1p = Math.round( x1 / range * 100 );
		y1p = Math.round( y1 / range * 100 ); 
		x2p = 100-Math.round( x2 / range * 100 );
		y2p = 100-Math.round( y2 / range * 100 );
		
		startBoxDiv = domConstruct.create('div',
			{
				'style':{
					'background':color,
					
					'left':x1p + "%",
					'top':y1p + "%",
					
					'right':x2p + "%",
					'bottom':y2p + "%",
					'opacity':0.5,
					'position':'absolute',
					'zIndex':1
				},
				'onmousedown':lang.hitch(this, function(){
					var clearBoxMessage;
					if( this.addBoxes )
					{
						return;
					}
					if(this.hosting)
					{
						this.battleRoom.remStartRect(aID)
					}
					else
					{
						clearBoxMessage = "!clearbox " + (aID+1);
						topic.publish( 'Lobby/rawmsg', {'msg':'SAYBATTLE '+ clearBoxMessage} );
					}
				}),
				'onmouseover':function(e){
					domStyle.set( startBoxDiv, 'border', '2px dotted white' )
				},
				'onmouseout':function(e){
					domStyle.set( startBoxDiv, 'border', '' )
				}
			},
			//this.mapDiv
			this.boxesDiv
			//this.paintDiv
		);
		allyDiv = domConstruct.create('div',
			{
				'innerHTML':(aID+1),
				'style':{
					//'width':'auto',
					'width':'100%',
					'left':'1px',
					'position':'absolute',
					'verticalAlign':'middle',
					'textAlign':'center',
					//'background':'black',
					'color':'white',
					'fontWeight':'bold',
					'top':'1px',
					'textShadow':'2px 2px black'
				}
			},
			startBoxDiv
		);
		this.startBoxes[aID] = startBoxDiv;
	},
	
	'setMap':function(map)
	{
		this.map = map;
		this.mapClean = this.map.replace(/ /g, '%20');
		this.mapCleanUnderscores = this.map.replace(/ /g, '_');
		this.updateMap();
	},
	'clearMap':function()
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
	
	'cycleMaps':function()
	{
		this.mapTypeIndex += 1;
		this.mapTypeIndex %= 3;
		
		this.updateMap();
	},
	
	'getMapLink':function()
	{
		return 'http://zero-k.info/Maps/DetailName?name='+ this.mapClean;
	},
	
	'updateMap':function()
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
	
	'updateMapDiv':function()
	{
		var mapImgHeight = domStyle.getComputedStyle(this.mapImg).height
		var mapImgWidth = domStyle.getComputedStyle(this.mapImg).width
		var mapDivWidth  = domStyle.getComputedStyle( this.mapDiv ).width ;
		
		domStyle.set(this.boxesDiv, 'height', mapImgHeight );
		domStyle.set(this.boxesDiv, 'width', mapImgWidth );
		domStyle.set(this.boxesDiv, 'left', ((parseInt(mapDivWidth) - parseInt(mapImgWidth))/2)+'px' );
	},
	
	'selectMap':function()
	{
		var dlg, content, mapCount, i, mapName, mapSelect, mapOptions, okButton, url;
		if( !this.hosting )
		{
			url = "http://zero-k.info/Maps";
			window.open(url,'_blank');
			return;
		}
		
		content = domConstruct.create('div', {'innerHTML':'Select Map'})
		
		mapCount = this.battleRoom.getUnitsync().getMapCount();
		
		mapOptions = [];
		for(i=0; i < mapCount; i++)
		{
			mapName = this.battleRoom.getUnitsync().getMapName( i ) 
			mapOptions.push( {'label':mapName, 'value':mapName} )
		}
		
		mapSelect = new Select({
			//'value':+'', //must be string
			'style':{'width':'250px'},
			'options':mapOptions
		}).placeAt(content);
		
		okButton = new Button({
			'label':'Select',
			'onClick':lang.hitch(this, function(){
				this.battleRoom.updateBattle({
					'battleId':this.battleRoom.battleId,
					'map':mapSelect.get('value')
				})
				dlg.hide();
			})
		}).placeAt(content);
		
		dlg = new Dialog({
			'title':'Select Map',
			'content':content
		});
		dlg.show();
	},
	
	'blank':null
}); }); //declare lwidgets.BattleMap
