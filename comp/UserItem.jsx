/*
 * An item in the UserList. It shows as much data as you give it, the only
 * required data field is user.name
 *
 * You have to pass battles to it unless you set the battle prop to true.
 */

'use strict'

require('style/UserItem.sass');
var _ = require('lodash');
var React = require('react');
var ModalWindow = require('comp/ModalWindow.jsx');
var Chat = require('act/Chat.js');
var Battle = require('act/Battle.js');
var colorToCss = require('comp/TeamColorPicker.jsx').toCss;
var timeDifference = require('util').humanizedTimeDifference;

module.exports = React.createClass({
	displayName: 'UserItem',
	getInitialState: function(){
		return { displayingInfo: false };
	},
	handleClick: function(){
		this.setState({ displayingInfo: true });
	},
	handleClose: function(){
		this.setState({ displayingInfo: false });
	},
	handleJoinUserBattle: function(id){
		Battle.joinMultiplayerBattle(id);
	},
	handleOpenColorPicker: function(open){
		this.setState({ showingColorPicker: open });
	},
	renderInfoBox: function(){
		var user = this.props.user;
		var now = new Date();
		var flagImgSrc;
		if (user.country){
			try {
				flagImgSrc = require('img/flags/' + user.country.toLowerCase() + '.png');
			} catch(e) {
				flagImgSrc = require('img/flags/unknown.png');
			}
		}
		return <ModalWindow title="User info" onClose={this.handleClose}>
		<div className="userInfoBox">
			<h1>{user.country &&
					<img src={flagImgSrc} key="country" title={user.country} />}
				&nbsp;{user.name}
			</h1>
			{this.props.battles && this.props.battles[user.battle] &&
				<p><img src={require('img/battlehalf.png')} />In
				battle {this.props.battles[user.battle].title}.</p>}
			{user.inGame && user.inGameSince &&
				<p><img src={require('img/battle.png')} />In
				game for {timeDifference(now, user.inGameSince)}</p>}
			{user.away && user.awaySince &&
				<p><img src={require('img/away.png')} />Away
				for {timeDifference(now, user.awaySince)}</p>}
			<table>
			{user.elo > 0 &&
				<tr><td>Rating:&nbsp;</td><td>{user.elo}</td></tr>}
			{user.level &&
				<tr><td>Level:&nbsp;</td><td>{user.level}</td></tr>}
			</table>
			<p>
				<button onClick={_.partial(Chat.openPrivate, user.name)}>
					Open private conversation
				</button>
				{user.battle !== undefined &&
				<button onClick={_.partial(this.handleJoinUserBattle, user.battle)}>
					Join user's battle
				</button>}
			</p>
		</div></ModalWindow>;
	},
	render: function(){
		var now = new Date();
		var user = {
			cpu: 0,
		};
		_.extend(user, this.props.user);
		var frontPics = [];
		var backPics = [];

			
		// XP / ELO symbols
		if (user.elo > 0 && user.level >= 0){ //zkls
			var level = Math.max(0, Math.min(7, Math.floor(Math.log(user.level / 30 + 1) * 4.2)));
			var skill = Math.max(0, Math.min(7, Math.floor((user.elo - 1000) / 200)));
			frontPics.push(<img src={require('img/ranks/' + level + '_' + skill + '.png')} key="rank" />);
		}
		else if (user.timeRank >= 0) { //spring
			var level = Math.min(7, user.timeRank);
			var skill = 3;
			frontPics.push(<img src={require('img/ranks/' + level + '_' + skill + '.png')} key="rank" />);
		}

		// Is a bot?
		if (user.botType)
			frontPics.push(<img src={require('img/robot.png')} key="bot" />);

		// Has a side icon.
		if ('sideIcon' in user)
			frontPics.push(<img src={user.sideIcon} key="side" />);

		if (('color' in user) && this.props.battle) {
			frontPics.push(<div
				key="color"
				className="color"
				style={{ backgroundColor: colorToCss(user.color) }}
			/>);
		}

		if (('synced' in user) && !user.synced && this.props.battle)
			frontPics.push(<img src={require('img/warning.png')} key="synced" width={14} height={14} title="User hasn't downloaded engine, game or map." />);

		// Away
		if (user['away'])
			backPics.push(<img src={require('img/away.png')} key="away" />);

		// In game
		var battleTitle = this.props.battles && this.props.battles[user.battle] ?
			(this.props.battles[user.battle].title || '(no name)') : null;
		if (user.inGame && !this.props.battle) {
			backPics.push(<img src={require('img/battle.png')} key="inGame" title={
				(battleTitle ? 'In battle ' + battleTitle + ', playing' : 'Playing single player') +
				(user.inGameSince ? ' for ' + timeDifference(now, user.inGameSince) + '.' : '')
			} />);
		} else if (user.inGame && this.props.battle) {
			backPics.push(<img src={require('img/battle.png')} key="inGame" title={(user.inGameSince ?
				'In game for ' + timeDifference(now, user.inGameSince) + '.' : '')} />);
		} else if (battleTitle && !this.props.battle) {
			backPics.push(<img src={require('img/battlehalf.png')} key="inBattle"
				title={battleTitle ? 'In battle ' + battleTitle + '.' : 'In a battle.'} />);
		}

		// Clan
		if (user.clan)
			backPics.push(<img src={'http://zero-k.info/img/clans/' + user.clan + '.png'} title={'Clan: ' + user.clan} key="clan" />);

		// Lobby
		if (user.lobby === 'swl')
			backPics.push(<img src={require('img/blobby2icon-small.png')} title="Spring Web Lobby" key="lobby" />);
		else if (user.lobby === 'zkl')
			backPics.push(<img src={require('img/zk_logo_square.png')} title="Zero-K Lobby" key="lobby" />);
		else if (user.lobby === 'notalobby')
			backPics.push(<img src={require('img/notalobby.png')} title="NotaLobby" key="lobby" />);
		else if (user.lobby === 'flobby')
			backPics.push(<img src={require('img/flobby.png')} title="flobby" key="lobby" />);
		else if (user.lobby === 'chobby')
			backPics.push(<img src={require('img/chobby.png')} title="Chobby" key="lobby" />);
			

		// OS
		if (user.os === 'windows')
			backPics.push(<img src={require('img/windows.png')} title="Microsoft Windows" key="os" />);
		else if (user.os === 'linux')
			backPics.push(<img src={require('img/linux.png')} title="Linux" key="os" />);
		else if (user.os === 'mac')
			backPics.push(<img src={require('img/mac.png')} title="MacOS" key="os" />);

		if (user.country) {
			var flagImgSrc;
			try {
				flagImgSrc = require('img/flags/' + user.country.toLowerCase() + '.png');
			} catch(e) {
				flagImgSrc = require('img/flags/unknown.png');
			}
			backPics.push(<img
				src={flagImgSrc}
				key="country"
				className="flag"
				title={user.country}
			/>);
		}
		
		

		return <li className="userItem">
			<div onClick={this.handleClick} className="content">
				<span className="userFrontPics">{frontPics}</span>
				<span className="userName">{user.name}</span>
				<span className="userBackPics">{backPics}</span>
				{this.state.showingColorPicker && this.renderColorPicker()}
			</div>
			{this.state.displayingInfo && this.renderInfoBox()}
		</li>;
	}
});
