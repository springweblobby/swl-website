## The Why

 - Uses browserify instead of AMD and SASS instead of plain CSS.

 - The code is riddled with inline styles and finicky DOM
   manipulations. The new code does as much as possible with pure CSS and
   avoids direct DOM manipulation.

 - Using JavaScript for layout results in sluggish animation and resizing,
   requires tons of resize()/resizeAlready()/resizeAlready2()/ResizeNeeded
   hacks to support. Modern CSS is sufficienlty powerful to replace that.

 - There's little separation between UI and application logic which stalls any
   redesign effort.

 - Some things like lobby server and unitsync are not fully encapsulated, so
   every component sends whatever it wants to uberserver and calls unitsync as
   it pleases. In case of asynchronous unitsync this results in hard to debug
   bugs caused by random widgets messing up the state.

   The new approach is to have modules that encapsulate lobby server / unitsync
   and are the only places where it's accessed directly. This allows them to
   maintain consistent internal state, cache data and optimize access.

## General ideas

The architecture is based on ReactJS with Reflux. If you ignore the fluff, that
means: <i>stores</i> contain the application logic and publish their
<i>state</i>. View <i>components</i> are dumb functions from store state to
HTML. ReactJS makes sure that components are always updated when the state
changes. When the user interacts with the UI, components use <i>actions</i> to
signal the stores. Stores are then free to change their state accordingly
resulting in components changing and the cycle continues.

### Simple UI

The UI should prevent information overload and be self-explanatory. It's okay
and is encouraged to keep non-essential and rarely used functions behind several
clicks. To this effect:
 - Instead of classic tab layout that disorients you with an array of options
   there's a nav bar that sends you to the main menu, the chat screen or the
   current battle. You have to do two clicks instead of one to go from the
   battle room to settings.
 - Most buttons in the battle room screen have text labels instead of icons
   which makes their purpose more evident.
 - The start button changes its label and color depending on whether the user is
   synced and if she is spectating or not.

### "Selected" games

The lobby has a concept of "selected" games. Those are supposed to be the games
that the user plays most of the time.

The user can select what game panels she wants to see. On start the lobby tries
to update every game selected this way to keep the games up to date for people
who don't play on online hosts.

The Multiplayer screen only shows hosts for selected games by default with a
visible switch to show all games.

### Map/Game select

Definitely not dropdowns.

For maps a distinction should be made between maps that the user has locally and
maps that can be potentially downloaded. The map list can be a list of icons
(with thumbnails pulled from zk site) that grows as you scroll it.

For games we should default to the latest stable version (api.springfiles.com
allows you to query a rapid tag and get a full name back) and ideally the engine
version used by the game needs to be known. Having flashy pictures for games
would be a plus, but this would have to be filled in manually, so the UI still
needs to accomodate random mods that have no known metadata.

We should resist the temptation to display unimportant technical info about maps
and games just to fill the space. No one cares about MapMinHeight/MapMaxHeight.

### Single player game presets

Since the single player battle store is easily serializable, this can be
exploited to allow the user to save her favorite FFA on Real Europe with an
intricate set of bots as a preset that can be easily restored. Alternatively,
the last played single player configurations can be saved automatically.

### Invisible components don't render

Instead of setting style="display: none" for invisible components we don't
output the HTML for them at all. This is done for neatness and self-discipline:
if a component can't survive being destroyed and re-rendered from store state,
then it has functions that should instead go in the store.

It seems to work fast, but if performance issues arise we can always switch to
using display: none.

### Runs in browser

For ease of development we retain the ability to run it in a browser with mock
stores filling in for the ones accessing the C++ API.

## Random bits

View components must be oblivious to the inner workings of stores. Their
purpose is to blindly render whatever stores tell them.

Components should not call any mutating methods on stores directly, instead they
should use actions (with the exception of cases where the store is passed in a
param, e.g. SBattle).
