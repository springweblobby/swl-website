/** @jsx React.DOM
 *
 * An item in the UserList. It shows as much data as you give it, the only
 * required data field is user.name
 *
 * You have to pass battles to it unless you set the battle prop to true.
 */

'use strict'

var _ = require('lodash');
var ModalWindow = require('comp/ModalWindow.jsx');
var Chat = require('act/Chat.js');
var Battle = require('act/Battle.js');

module.exports = React.createClass({
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
	timeDifference: function(t1, t0){
		var diff = Math.floor((t1 - t0) / 60000);
		return (Math.floor(diff / 60) > 0 ? Math.floor(diff / 60) + ' hours ' : '') + (diff % 60) + ' minutes';
	},
	renderInfoBox: function(){
		var user = this.props.user;
		var now = new Date();
		return <ModalWindow title="User info" onClose={this.handleClose}>
		<div className="userInfoBox">
			<h1>{user.name}</h1>
			{this.props.battles && user.battle !== undefined &&
				<p><img src="img/battlehalf.png" />In battle {this.props.battles[user.battle].title}.</p>}
			{user.inGame && user.inGameSince &&
				<p><img src="img/battle.png" />In game for {this.timeDifference(now, user.inGameSince)}</p>}
			{user.away && user.awaySince &&
				<p><img src="img/away.png" />Away for {this.timeDifference(now, user.awaySince)}</p>}
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

		// Country
		if (user.country)
			frontPics.push(<img src={'img/flags/' + user.country.toLowerCase() + '.png'} key="country" />);

		// Is a bot?
		if (user.botType)
			frontPics.push(<img src="img/robot.png" key="bot" />);

		// Has a side icon.
		if ('sideIcon' in user)
			frontPics.push(<img src={user.sideIcon} key="side" />);

		if (('synced' in user) && !user.synced && this.props.battle)
			frontPics.push(<img src={'img/warning.png'} key="synced" width={14} height={14} title="User hasn't downloaded engine, game or map." />);

		// Away
		if (user['away'])
			backPics.push(<img src="img/away.png" key="away" />);

		// In game
		var battleTitle = this.props.battles && user.battle !== null && user.battle !== undefined ?
			(this.props.battles[user.battle].title || '(no name)') : null;
		if (user.inGame && !this.props.battle) {
			backPics.push(<img src="img/battle.png" key="inGame" title={
				(battleTitle ? 'In battle ' + battleTitle + ', playing' : 'Playing single player') +
				(user.inGameSince ? ' for ' + this.timeDifference(now, user.inGameSince) + '.' : '')
			} />);
		} else if (user.inGame && this.props.battle) {
			backPics.push(<img src="img/battle.png" key="inGame" title={(user.inGameSince ?
				'In game for ' + this.timeDifference(now, user.inGameSince) + '.' : '')} />);
		} else if (battleTitle && !this.props.battle) {
			backPics.push(<img src="img/battlehalf.png" key="inBattle"
				title={battleTitle ? 'In battle ' + battleTitle + '.' : 'In a battle.'} />);
		}

		// Clan
		if (user.clan)
			backPics.push(<img src={'http://zero-k.info/img/clans/' + user.clan + '.png'} title={'Clan: ' + user.clan} key="clan" />);

		// Lobby
		if (user.lobby === 'swl')
			backPics.push(<img src = "img/blobby2icon-small.png" title = "Spring Web Lobby" key="lobby" />);
		else if (user.lobby === 'zkl')
			backPics.push(<img src = "img/zk_logo_square.png" title = "Zero-K Lobby" key="lobby" />);
		else if (user.lobby === 'notalobby')
			backPics.push(<img src = "img/notalobby.png" title = "NotaLobby" key="lobby" />);
		else if (user.lobby === 'mlclient')
			backPics.push(<img src = "img/mlclient.ico" title = "mlclient" key="lobby" />);
		else if (user.lobby === 'flobby')
			backPics.push(<img src = "img/flobby.png" title = "flobby" key="lobby" />);

		// OS
		if (user.os === 'windows')
			backPics.push(<img src="img/windows.png" title = "Microsoft Windows" key="os" />);
		else if (user.os === 'linux')
			backPics.push(<img src="img/linux.png" title = "Linux" key="os" />);
		else if (user.os === 'mac')
			backPics.push(<img src="img/mac.png" title = "MacOS" key="os" />);

		return (<li className="userItem">
			<div onClick={this.handleClick} className="content">
				<span className="userFrontPics">{frontPics}</span>
				<span className="userName">{user.name}</span>
				<span className="userBackPics">{backPics}</span>
			</div>
			{this.state.displayingInfo && this.renderInfoBox()}
		</li>);
	}
});
