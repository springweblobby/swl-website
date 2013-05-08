///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/SpringSettings',
	[
		"dojo/_base/declare",
		
		'dojo/topic',
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',

		"dijit/form/TextBox",
		"dijit/form/Button",
		"dijit/form/Select",
		"dijit/form/ToggleButton",
		"dijit/form/HorizontalSlider",
		"dijit/form/HorizontalRule",
		"dijit/form/HorizontalRuleLabels",
		"dijit/layout/TabContainer",
		"dijit/layout/ContentPane",
		"dijit/Dialog",
		"dijit/Tooltip",
		
	],
	function(declare,
		topic, array, domConstruct, domStyle, domAttr, lang,
		TextBox,
		Button,
		Select,
		ToggleButton,
		HorizontalSlider,
		HorizontalRule,
		HorizontalRuleLabels,
		TabContainer,
		ContentPane,
		Dialog,
		Tooltip
	){
	return declare([ ], {

	'options':null,
	
	'constructor':function(/* Object */args){
		var i,j, optionKey,
			option,
			optionName,optionType,optionDefault,
			configNames
			;
		
		declare.safeMixin(this, args);
		
		configNames = [
			'3DTrees',
			'AI_UnpauseAfterInit',
			'AdvMapShading',
			'AdvSky',
			'AdvUnitShading',
			'AllowAdditionalPlayers',
			'AtiHacks',
			'AtiSwapRBFix',
			'AutoAddBuiltUnitsToFactoryGroup',
			'AutoAddBuiltUnitsToSelectedGroup',
			'AutohostIP',
			'AutohostPort',
			'BuildIconsFirst',
			'BumpWaterAnisotropy',
			'BumpWaterBlurReflection',
			'BumpWaterDepthBits',
			'BumpWaterDynamicWaves',
			'BumpWaterEndlessOcean',
			'BumpWaterOcclusionQuery',
			'BumpWaterReflection',
			'BumpWaterRefraction',
			'BumpWaterShoreWaves',
			'BumpWaterTexSizeReflection',
			'BumpWaterUseDepthTexture',
			'BumpWaterUseUniforms',
			'CamFreeAngVelTime',
			'CamFreeAutoTilt',
			'CamFreeEnabled',
			'CamFreeFOV',
			'CamFreeGoForward',
			'CamFreeGravity',
			'CamFreeGroundOffset',
			'CamFreeInvertAlt',
			'CamFreeScrollSpeed',
			'CamFreeSlide',
			'CamFreeTiltSpeed',
			'CamFreeVelTime',
			'CamMode',
			'CamModeName',
			'CamTimeExponent',
			'CamTimeFactor',
			'CatchAIExceptions',
			'ColorElev',
			'CompressTextures',
			'CrossAlpha',
			'CrossMoveScale',
			'CrossSize',
			'CubeTexSizeReflection',
			'CubeTexSizeSpecular',
			'DemoFromDemo',
			'DepthBufferBits',
			'DisableCrappyGPUWarning',
			'DoubleClickTime',
			'DualScreenMiniMapOnLeft',
			'DualScreenMode',
			'DynamicSky',
			'DynamicSun',
			'DynamicSunMinElevation',
			'EnableDrawCallIns',
			'ExtraTextureUpdateRate',
			'FPSEnabled',
			'FPSFOV',
			'FPSMouseScale',
			'FPSScrollSpeed',
			'FSAALevel',
			'FeatureDrawDistance',
			'FeatureFadeDistance',
			'FixAltTab',
			'FontFile',
			'FontOutlineWeight',
			'FontOutlineWidth',
			'FontSize',
			'Fullscreen',
			'FullscreenEdgeMove',
			'GrassDetail',
			'GroundDecals',
			'GroundDetail',
			'GroundLODScaleReflection',
			'GroundLODScaleRefraction',
			'GroundLODScaleUnitReflection',
			'GroundNormalTextureHighPrecision',
			'GroundScarAlphaFade',
			'GuiOpacity',
			'HangTimeout',
			'HardwareCursor',
			'HardwareThreadCount',
			'HeightMapTexture',
			'HighResLos',
			'InfoConsoleGeometry',
			'InfoMessageTime',
			'InitialNetworkTimeout',
			'InputTextGeo',
			'InvertMouse',
			'InvertQueueKey',
			'JoystickEnabled',
			'JoystickUse',
			'LODScale',
			'LODScaleReflection',
			'LODScaleRefraction',
			'LODScaleShadow',
			'LastSelectedMap',
			'LastSelectedMod',
			'LastSelectedScript',
			'LastSelectedSetting',
			'LinkIncomingMaxPacketRate',
			'LinkIncomingMaxWaitingPackets',
			'LinkIncomingPeakBandwidth',
			'LinkIncomingSustainedBandwidth',
			'LinkOutgoingBandwidth',
			'LoadingMT',
			'LobbyServer',
			'LogFlush',
			'LogSections',
			'LuaModUICtrl',
			'LuaShaders',
			'LuaSocketEnabled',
			'MTInfoThreshold',
			'MaxDynamicMapLights',
			'MaxDynamicModelLights',
			'MaxNanoParticles',
			'MaxParticles',
			'MaxPathCostsMemoryFootPrint',
			'MaxSounds',
			'MaximumTransmissionUnit',
			'MetalMapPalette',
			'MiddleClickScrollSpeed',
			'MiniMapButtonSize',
			'MiniMapCursorScale',
			'MiniMapDrawCommands',
			'MiniMapDrawProjectiles',
			'MiniMapFullProxy',
			'MiniMapGeometry',
			'MiniMapIcons',
			'MiniMapMarker',
			'MiniMapUnitExp',
			'MiniMapUnitSize',
			'MouseDragScrollThreshold',
			'MultiThreadDrawUnit',
			'MultiThreadDrawUnitShadow',
			'MultiThreadLua',
			'NetworkLossFactor',
			'NetworkTimeout',
			'NoHelperAIs',
			'NoSound',
			'OrbitControllerEnabled',
			'OrbitControllerOrbitSpeed',
			'OrbitControllerPanSpeed',
			'OrbitControllerZoomSpeed',
			'OscStatsSenderDestinationAddress',
			'OscStatsSenderDestinationPort',
			'OscStatsSenderEnabled',
			'OverheadEnabled',
			'OverheadFOV',
			'OverheadScrollSpeed',
			'OverheadTiltSpeed',
			'PitchAdjust',
			'ROAM',
			'ReconnectTimeout',
			'ReflectiveWater',
			'RotOverheadEnabled',
			'RotOverheadFOV',
			'RotOverheadMouseScale',
			'RotOverheadScrollSpeed',
			'RotateLogFiles',
			'SM3ForceFallbackTex',
			'SM3MaxTextureStages',
			'SM3TerrainDetail',
			'SMFTexAniso',
			'ScreenshotCounter',
			'ScrollWheelSpeed',
			'SetCoreAffinity',
			'ShadowMapSize',
			'ShadowProjectionMode',
			'Shadows',
			'ShowClock',
			'ShowFPS',
			'ShowHealthBars',
			'ShowMTInfo',
			'ShowPlayerInfo',
			'ShowRezBars',
			'ShowSpeed',
			'SimpleMiniMapColors',
			'SmallFontFile',
			'SmallFontOutlineWeight',
			'SmallFontOutlineWidth',
			'SmallFontSize',
			'SmoothEnabled',
			'SmoothFOV',
			'SmoothLines',
			'SmoothPoints',
			'SmoothScrollSpeed',
			'SmoothTiltSpeed',
			'SourcePort',
			'SpeedControl',
			'SpringData',
			'StencilBufferBits',
			'TCPAllowConnect',
			'TCPAllowListen',
			'TWEnabled',
			'TWFOV',
			'TWScrollSpeed',
			'TeamHighlight',
			'TeamNanoSpray',
			'TextureLODBias',
			'TooltipGeometry',
			'TooltipOutlineFont',
			'TreeRadius',
			'UDPAllowConnect',
			'UDPAllowListen',
			'UnitIconDist',
			'UnitLodDist',
			'UnitTransparency',
			'UseDistToGroundForIcons',
			'UseEFX',
			'UsePBO',
			'VSync',
			'WhiteListAdditionalPlayers',
			'WindowBorderless',
			'WindowPosX',
			'WindowPosY',
			'WindowState',
			'WindowedEdgeMove',
			'XResolution',
			'YResolution',
			'address',
			'name',
			'snd_airAbsorption',
			'snd_device',
			'snd_volbattle',
			'snd_volgeneral',
			'snd_volmaster',
			'snd_volmusic',
			'snd_volui',
			'snd_volunitreply'
		];
		
		options = {};
		
		
		array.forEach( configNames, function(configName) {
			optionKey = configName;
			
			optionType = 'string';
			
			optionValue = this.appletHandler.getUnitsync(this.version).getSpringConfigString(optionKey, 'abcde');
			if( optionValue === 'abcde' )
			{
				optionType = 'int';
				optionValue = this.appletHandler.getUnitsync(this.version).getSpringConfigInt(optionKey, -999);
			}
			if( optionValue === -999 )
			{
				optionType = 'float';
				optionValue = this.appletHandler.getUnitsync(this.version).getSpringConfigFloat(optionKey, -999);
				optionValue = this.fixBadNumber(optionValue)
			}
			if( optionValue === -999 )
			{
				optionType = '';
				optionValue = '';
			}
			
			//optionDefault = '';
			
			option = {
				'key':optionKey,
				'type':optionType,
				//'default':optionDefault,
				'value':optionValue
			};
			
			options[optionKey] = option;
			
		}, this); //foreach
		
		this.options = options;
		
		
		this.loaded = true;
		
	}, //constructor
	
	'destroy':function()
	{
		
	},
	
	'showDialog':function()
	{
		var dlg;
		
		dlg = new Dialog({
			'title': 'Engine Options',
			'content':this.makeOptions(),
			style:{width:'450px'}
		});
		dlg.startup();
		dlg.show();
	}, //showDialog
	
	makeOptions:function( )
	{
		var option, content, curOptionControl,
			slider,
			rowDiv, nameDiv, controlDiv,
			discreteValues,
			listOptions,
			itemKey, item,
			desc
			;
		
		content = domConstruct.create( 'div', { 'style':{'width':'100%','height':'380px', 'overflow':'auto' } } )
		
		
		for( optionKey in this.options )
		{
			option = this.options[optionKey];
			
			//if( option.type === 'string' )
			{
				rowDiv = domConstruct.create('div', {'style':{'height':'40px', 'width':'200px', 'position':'relative'  } }, content );
				nameDiv = domConstruct.create('div', {'innerHTML': option.key, 'style':{'position':'absolute' } }, rowDiv );
				//controlDiv = domConstruct.create('div', { }, rowDiv );
				
				curOptionControl = new TextBox({
					'name': option.key,
					'value':option.value,
					'style':{'position':'absolute', 'left':'250px', 'width':'150px'},
					onChange:lang.hitch(this,function(optionKey, optionType, val){
						//if( optionType === 'string' )
						{
							echo('changing!', optionKey, val)
							this.appletHandler.getUnitsync(this.version).setSpringConfigString(optionKey, val);
						}
					}, optionKey, option.type)
				}).placeAt(rowDiv)
			}
			
		} //for( optionKey in options )
		return content;
	},
	
	'fixBadNumber':function(number)
	{
		number *= 1000;
		number = Math.round(number);
		number /= 1000;
		return number;
	},
	
	
	'blank':null
}); }); //declare lwidgets.SpringSettings



