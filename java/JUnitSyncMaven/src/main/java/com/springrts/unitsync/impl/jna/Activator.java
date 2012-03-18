/*
	Copyright (c) 2010 Robin Vobruba <hoijui.quaero@gmail.com>

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

package com.springrts.unitsync.impl.jna;


import com.springrts.unitsync.Unitsync;
import com.springrts.unitsync.UnitsyncSimple;
import java.util.Dictionary;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

/**
 * This bundle loads the native library its self.
 * Each time the bundle is started, the native library is loaded,
 * and respectively un-loaded when the bundle is stopped.
 * The native library is:
 * <list>
 * <il>unitsync.dll (Windows)</il>
 * <il>libunitsync.so (Unix/Linux/BSD)</il>
 * <il>unitsync.dylib (Mac OS X)</il>
 * </list>
 * You may specify the dir containing unitsync like this:
 * <code>System.setProperty("jna.library.path", unitsyncDir);</code>
 * or the path to unitsync like this:
 * <code>Preferences.userRoot().put("unitsync.path", unitsyncPath);</code>
 * @author hoijui <hoijui.quaero@gmail.com>
 */
public class Activator implements BundleActivator {

	/**
	 * @param context The context for the bundle.
	 */
	@Override
	public void start(BundleContext context) {

		Dictionary dict = null;
		UnitsyncImpl unitsyncImpl = new UnitsyncImpl();
		context.registerService(Unitsync.class.getName(), unitsyncImpl, dict);
		context.registerService(UnitsyncSimple.class.getName(), unitsyncImpl, dict);
	}

	/**
	 * @param context The context for the bundle.
	 */
	@Override
	public void stop(BundleContext context) {
		// Services registered in start() are automatically deregistered.
	}
}
