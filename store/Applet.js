/*
 * Allows access to the C++ API when running in QWebKit.
 *
 * For historical reasons it's called an "applet" even though it's long since
 * not a Java applet.
 */

'use strict'

window.QWeblobbyApplet && QWeblobbyApplet.init();

module.exports = window.QWeblobbyApplet || null;
