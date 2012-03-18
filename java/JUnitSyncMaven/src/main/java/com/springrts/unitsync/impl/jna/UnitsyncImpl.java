/*
	Copyright (c) 2011 Robin Vobruba <hoijui.quaero@gmail.com>

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
import com.sun.jna.NativeLibrary;
import com.sun.jna.Pointer;
import java.awt.Dimension;
import java.nio.ByteBuffer;
import java.nio.IntBuffer;
import java.util.prefs.Preferences;

/**
 * Implementation of <tt>Unitsync</tt> using the JNA wrapper of the native
 * library.
 * @see #UnitsyncLibrary
 */
public class UnitsyncImpl implements Unitsync, UnitsyncSimple {

	public UnitsyncImpl() {

		String filePath = Preferences.userRoot().get("unitsync.path", "unitsync");

		com.sun.jna.Native.register(UnitsyncLibrary.class,
				NativeLibrary.getInstance(filePath));
	}

	@Override
	public String getNextError() {
		return UnitsyncLibrary.GetNextError();
	}

	@Override
	public String getSpringVersion() {
		return UnitsyncLibrary.GetSpringVersion();
	}

	public String getSpringVersionPatchset() {
		return UnitsyncLibrary.GetSpringVersionPatchset();
	}

	@Override
	public int init(boolean isServer, int id) {
		return UnitsyncLibrary.Init(isServer, id);
	}

	@Override
	public void unInit() {
		UnitsyncLibrary.UnInit();
	}

	@Override
	public String getWritableDataDirectory() {
		return UnitsyncLibrary.GetWritableDataDirectory();
	}

	@Override
	public int getDataDirectoryCount() {
		return UnitsyncLibrary.GetDataDirectoryCount();
	}

	@Override
	public String getDataDirectory(int index) {
		return UnitsyncLibrary.GetDataDirectory(index);
	}

	@Override
	public int processUnits() {
		return UnitsyncLibrary.ProcessUnits();
	}

	@Override
	public int processUnitsNoChecksum() {
		return UnitsyncLibrary.ProcessUnitsNoChecksum();
	}

	@Override
	public int getUnitCount() {
		return UnitsyncLibrary.GetUnitCount();
	}

	@Override
	public String getUnitName(int unitId) {
		return UnitsyncLibrary.GetUnitName(unitId);
	}

	@Override
	public String getFullUnitName(int unitId) {
		return UnitsyncLibrary.GetFullUnitName(unitId);

	}

	@Override
	public void addArchive(String name) {
		UnitsyncLibrary.AddArchive(name);
	}

	@Override
	public void addAllArchives(String root) {
		UnitsyncLibrary.AddAllArchives(root);
	}

	@Override
	public void removeAllArchives() {
		UnitsyncLibrary.RemoveAllArchives();
	}

	@Override
	public int getArchiveChecksum(String archiveName) {
		return UnitsyncLibrary.GetArchiveChecksum(archiveName);
	}

	@Override
	public String getArchivePath(String archiveName) {
		return UnitsyncLibrary.GetArchivePath(archiveName);
	}

	@Override
	public int getMapCount() {
		return UnitsyncLibrary.GetMapCount();
	}

	@Override
	public String getMapName(int index) {
		return UnitsyncLibrary.GetMapName(index);
	}

	@Override
	public String getMapFileName(int index) {
		return UnitsyncLibrary.GetMapFileName(index);
	}

	@Override
	public String getMapDescription(int index) {
		return UnitsyncLibrary.GetMapDescription(index);
	}

	@Override
	public String getMapAuthor(int index) {
		return UnitsyncLibrary.GetMapAuthor(index);
	}

	@Override
	public int getMapWidth(int index) {
		return UnitsyncLibrary.GetMapWidth(index);
	}

	@Override
	public int getMapHeight(int index) {
		return UnitsyncLibrary.GetMapHeight(index);
	}

	@Override
	public int getMapTidalStrength(int index) {
		return UnitsyncLibrary.GetMapTidalStrength(index);
	}

	@Override
	public int getMapWindMin(int index) {
		return UnitsyncLibrary.GetMapWindMin(index);
	}

	@Override
	public int getMapWindMax(int index) {
		return UnitsyncLibrary.GetMapWindMax(index);
	}

	@Override
	public int getMapGravity(int index) {
		return UnitsyncLibrary.GetMapGravity(index);
	}

	@Override
	public int getMapResourceCount(int index) {
		return UnitsyncLibrary.GetMapResourceCount(index);
	}

	@Override
	public String getMapResourceName(int index, int resourceIndex) {
		return UnitsyncLibrary.GetMapResourceName(index, resourceIndex);

	}

	@Override
	public float getMapResourceMax(int index, int resourceIndex) {
		return UnitsyncLibrary.GetMapResourceMax(index, resourceIndex);
	}

	@Override
	public int getMapResourceExtractorRadius(int index, int resourceIndex) {
		return UnitsyncLibrary.GetMapResourceExtractorRadius(index, resourceIndex);
	}

	@Override
	public int getMapPosCount(int index) {
		return UnitsyncLibrary.GetMapPosCount(index);
	}

	@Override
	public float getMapPosX(int index, int posIndex) {
		return UnitsyncLibrary.GetMapPosX(index, posIndex);
	}

	@Override
	public float getMapPosZ(int index, int posIndex) {
		return UnitsyncLibrary.GetMapPosZ(index, posIndex);
	}

	@Override
	public float getMapMinHeight(String mapName) {
		return UnitsyncLibrary.GetMapMinHeight(mapName);
	}

	@Override
	public float getMapMaxHeight(String mapName) {
		return UnitsyncLibrary.GetMapMaxHeight(mapName);
	}

	@Override
	public int getMapArchiveCount(String mapName) {
		return UnitsyncLibrary.GetMapArchiveCount(mapName);
	}

	@Override
	public String getMapArchiveName(int index) {
		return UnitsyncLibrary.GetMapArchiveName(index);
	}

	@Override
	public int getMapChecksum(int index) {
		return UnitsyncLibrary.GetMapChecksum(index);
	}

	@Override
	public int getMapChecksumFromName(String mapName) {
		return UnitsyncLibrary.GetMapChecksumFromName(mapName);
	}

	@Override
	public short[] getMiniMap(String fileName, int mipLevel) {

		assert((mipLevel >= 0) && (mipLevel >= 4));
		int sideX = 1024 >> mipLevel;
		int sideY = sideX;
		Pointer miniMap = UnitsyncLibrary.GetMinimap(fileName, mipLevel);
		return miniMap.getShortArray(0, sideX * sideY);
	}

	@Override
	public int getInfoMapSize(String fileName, String name, IntBuffer width, IntBuffer height) {
		return UnitsyncLibrary.GetInfoMapSize(fileName, name, width, height);
	}
	@Override
	public Dimension getInfoMapSize(String fileName, String name) {

		Dimension dimension = null;

		IntBuffer width = IntBuffer.allocate(1);
		IntBuffer height = IntBuffer.allocate(1);
		int ret = UnitsyncLibrary.GetInfoMapSize(fileName, name, width, height);
		if (ret != 0) {
			dimension = new Dimension(width.get(), width.get());
		}

		return dimension;
	}

	@Override
	public int getInfoMap(String fileName, String name, ByteBuffer data, int typeHint) {
		return UnitsyncLibrary.GetInfoMap(fileName, name, data, typeHint);
	}

	@Override
	public int getSkirmishAICount() {
		return UnitsyncLibrary.GetSkirmishAICount();
	}

	@Override
	public int getSkirmishAIInfoCount(int index) {
		return UnitsyncLibrary.GetSkirmishAIInfoCount(index);
	}

	@Override
	public String getInfoKey(int index) {
		return UnitsyncLibrary.GetInfoKey(index);
	}

	@Deprecated
	@Override
	public String getInfoValue(int index) {
		return UnitsyncLibrary.GetInfoValue(index);
	}

	@Override
	public String getInfoType(int index) {
		return UnitsyncLibrary.GetInfoType(index);
	}

	@Override
	public String getInfoValueString(int index) {
		return UnitsyncLibrary.GetInfoValueString(index);
	}

	@Override
	public int getInfoValueInteger(int index) {
		return UnitsyncLibrary.GetInfoValueInteger(index);
	}

	@Override
	public float getInfoValueFloat(int index) {
		return UnitsyncLibrary.GetInfoValueFloat(index);
	}

	@Override
	public boolean getInfoValueBool(int index) {
		return UnitsyncLibrary.GetInfoValueBool(index);
	}

	@Override
	public String getInfoDescription(int index) {
		return UnitsyncLibrary.GetInfoDescription(index);
	}

	@Override
	public int getSkirmishAIOptionCount(int index) {
		return UnitsyncLibrary.GetSkirmishAIOptionCount(index);
	}

	@Override
	public int getPrimaryModCount() {
		return UnitsyncLibrary.GetPrimaryModCount();
	}

	@Override
	public int getPrimaryModInfoCount(int index) {
		return UnitsyncLibrary.GetPrimaryModInfoCount(index);
	}

	@Override
	public String getPrimaryModName(int index) {
		return UnitsyncLibrary.GetPrimaryModName(index);
	}

	@Override
	public String getPrimaryModShortName(int index) {
		return UnitsyncLibrary.GetPrimaryModShortName(index);
	}

	@Override
	public String getPrimaryModVersion(int index) {
		return UnitsyncLibrary.GetPrimaryModVersion(index);
	}

	@Override
	public String getPrimaryModMutator(int index) {
		return UnitsyncLibrary.GetPrimaryModMutator(index);
	}

	@Override
	public String getPrimaryModGame(int index) {
		return UnitsyncLibrary.GetPrimaryModGame(index);
	}

	@Override
	public String getPrimaryModShortGame(int index) {
		return UnitsyncLibrary.GetPrimaryModShortGame(index);
	}

	@Override
	public String getPrimaryModDescription(int index) {
		return UnitsyncLibrary.GetPrimaryModDescription(index);
	}

	@Override
	public String getPrimaryModArchive(int index) {
		return UnitsyncLibrary.GetPrimaryModArchive(index);
	}

	@Override
	public int getPrimaryModArchiveCount(int index) {
		return UnitsyncLibrary.GetPrimaryModArchiveCount(index);
	}

	@Override
	public String getPrimaryModArchiveList(int archiveIndex) {
		return UnitsyncLibrary.GetPrimaryModArchiveList(archiveIndex);
	}

	@Override
	public int getPrimaryModIndex(String name) {
		return UnitsyncLibrary.GetPrimaryModIndex(name);
	}

	@Override
	public int getPrimaryModChecksum(int index) {
		return UnitsyncLibrary.GetPrimaryModChecksum(index);
	}

	@Override
	public int getPrimaryModChecksumFromName(String name) {
		return UnitsyncLibrary.GetPrimaryModChecksumFromName(name);
	}

	@Override
	public int getSideCount() {
		return UnitsyncLibrary.GetSideCount();
	}

	@Override
	public String getSideName(int side) {
		return UnitsyncLibrary.GetSideName(side);
	}

	@Override
	public String getSideStartUnit(int side) {
		return UnitsyncLibrary.GetSideStartUnit(side);
	}

	@Override
	public int getMapOptionCount(String name) {
		return UnitsyncLibrary.GetMapOptionCount(name);
	}

	@Override
	public int getModOptionCount() {
		return UnitsyncLibrary.GetModOptionCount();
	}

	@Override
	public int getCustomOptionCount(String fileName) {
		return UnitsyncLibrary.GetCustomOptionCount(fileName);
	}

	@Override
	public String getOptionKey(int optIndex) {
		return UnitsyncLibrary.GetOptionKey(optIndex);
	}

	@Override
	public String getOptionScope(int optIndex) {
		return UnitsyncLibrary.GetOptionScope(optIndex);
	}

	@Override
	public String getOptionName(int optIndex) {
		return UnitsyncLibrary.GetOptionName(optIndex);
	}

	@Override
	public String getOptionSection(int optIndex) {
		return UnitsyncLibrary.GetOptionSection(optIndex);
	}

	@Override
	public String getOptionStyle(int optIndex) {
		return UnitsyncLibrary.GetOptionStyle(optIndex);
	}

	@Override
	public String getOptionDesc(int optIndex) {
		return UnitsyncLibrary.GetOptionDesc(optIndex);
	}

	@Override
	public int getOptionType(int optIndex) {
		return UnitsyncLibrary.GetOptionType(optIndex);
	}

	@Override
	public int getOptionBoolDef(int optIndex) {
		return UnitsyncLibrary.GetOptionBoolDef(optIndex);
	}

	@Override
	public float getOptionNumberDef(int optIndex) {
		return UnitsyncLibrary.GetOptionNumberDef(optIndex);
	}

	@Override
	public float getOptionNumberMin(int optIndex) {
		return UnitsyncLibrary.GetOptionNumberMin(optIndex);
	}

	@Override
	public float getOptionNumberMax(int optIndex) {
		return UnitsyncLibrary.GetOptionNumberMax(optIndex);
	}

	@Override
	public float getOptionNumberStep(int optIndex) {
		return UnitsyncLibrary.GetOptionNumberStep(optIndex);
	}

	@Override
	public String getOptionStringDef(int optIndex) {
		return UnitsyncLibrary.GetOptionStringDef(optIndex);
	}

	@Override
	public int getOptionStringMaxLen(int optIndex) {
		return UnitsyncLibrary.GetOptionStringMaxLen(optIndex);
	}

	@Override
	public int getOptionListCount(int optIndex) {
		return UnitsyncLibrary.GetOptionListCount(optIndex);
	}

	@Override
	public String getOptionListDef(int optIndex) {
		return UnitsyncLibrary.GetOptionListDef(optIndex);
	}

	@Override
	public String getOptionListItemKey(int optIndex, int itemIndex) {
		return UnitsyncLibrary.GetOptionListItemKey(optIndex, itemIndex);
	}

	@Override
	public String getOptionListItemName(int optIndex, int itemIndex) {
		return UnitsyncLibrary.GetOptionListItemName(optIndex, itemIndex);
	}

	@Override
	public String getOptionListItemDesc(int optIndex, int itemIndex) {
		return UnitsyncLibrary.GetOptionListItemDesc(optIndex, itemIndex);
	}

	@Override
	public int getModValidMapCount() {
		return UnitsyncLibrary.GetModValidMapCount();
	}

	@Override
	public String getModValidMap(int index) {
		return UnitsyncLibrary.GetModValidMap(index);
	}

	@Override
	public int openFileVFS(String name) {
		return UnitsyncLibrary.OpenFileVFS(name);
	}

	@Override
	public void closeFileVFS(int handle) {
		UnitsyncLibrary.CloseFileVFS(handle);
	}

	@Override
	public int readFileVFS(int handle, ByteBuffer buf, int length) {
		return UnitsyncLibrary.ReadFileVFS(handle, buf, length);
	}

	@Override
	public int fileSizeVFS(int handle) {
		return UnitsyncLibrary.FileSizeVFS(handle);
	}

	@Override
	public int initFindVFS(String pattern) {
		return UnitsyncLibrary.InitFindVFS(pattern);
	}

	@Override
	public int initDirListVFS(String path, String pattern, String modes) {
		return UnitsyncLibrary.InitDirListVFS(path, pattern, modes);
	}

	@Override
	public int initSubDirsVFS(String path, String pattern, String modes) {
		return UnitsyncLibrary.InitSubDirsVFS(path, pattern, modes);
	}

	@Override
	public int findFilesVFS(int handle, ByteBuffer nameBuf, int size) {
		return UnitsyncLibrary.FindFilesVFS(handle, nameBuf, size);
	}

	@Override
	public int openArchive(String name) {
		return UnitsyncLibrary.OpenArchive(name);
	}

	@Override
	public int openArchiveType(String name, String type) {
		return UnitsyncLibrary.OpenArchiveType(name, type);
	}

	@Override
	public void closeArchive(int archive) {
		UnitsyncLibrary.CloseArchive(archive);
	}

	@Override
	public int findFilesArchive(int archive, int fileId, ByteBuffer nameBuf, IntBuffer size) {
		return UnitsyncLibrary.FindFilesArchive(archive, fileId, nameBuf, size);
	}

	@Override
	public int openArchiveFile(int archive, String name) {
		return UnitsyncLibrary.OpenArchiveFile(archive, name);
	}

	@Override
	public int readArchiveFile(int archive, int handle, ByteBuffer buffer, int numBytes) {
		return UnitsyncLibrary.ReadArchiveFile(archive, handle, buffer, numBytes);
	}

	@Override
	public void closeArchiveFile(int archive, int handle) {
		UnitsyncLibrary.CloseArchiveFile(archive, handle);
	}

	@Override
	public int getSizeArchiveFile(int archive, int handle) {
		return UnitsyncLibrary.SizeArchiveFile(archive, handle);
	}

	@Override
	public void setSpringConfigFile(String filenameAsAbsolutePath) {
		UnitsyncLibrary.SetSpringConfigFile(filenameAsAbsolutePath);
	}

	@Override
	public String getSpringConfigFile() {
		return UnitsyncLibrary.GetSpringConfigFile();
	}

	@Override
	public String getSpringConfigString(String name, String defValue) {
		return UnitsyncLibrary.GetSpringConfigString(name, defValue);
	}

	@Override
	public int getSpringConfigInt(String name, int defValue) {
		return UnitsyncLibrary.GetSpringConfigInt(name, defValue);
	}

	@Override
	public float getSpringConfigFloat(String name, float defValue) {
		return UnitsyncLibrary.GetSpringConfigFloat(name, defValue);
	}

	@Override
	public void setSpringConfigString(String name, String value) {
		UnitsyncLibrary.SetSpringConfigString(name, value);
	}

	@Override
	public void setSpringConfigInt(String name, int value) {
		UnitsyncLibrary.SetSpringConfigInt(name, value);
	}

	@Override
	public void setSpringConfigFloat(String name, float value) {
		UnitsyncLibrary.SetSpringConfigFloat(name, value);
	}

	@Override
	public void lpClose() {
		UnitsyncLibrary.lpClose();
	}

	@Override
	public int lpOpenFile(String fileName, String fileModes, String accessModes) {
		return UnitsyncLibrary.lpOpenFile(fileName, fileModes, accessModes);
	}

	@Override
	public int lpOpenSource(String source, String accessModes) {
		return UnitsyncLibrary.lpOpenSource(source, accessModes);
	}

	@Override
	public int lpExecute() {
		return UnitsyncLibrary.lpExecute();
	}

	@Override
	public String lpErrorLog() {
		return UnitsyncLibrary.lpErrorLog();
	}

	@Override
	public void lpAddTableInt(int key, int override) {
		UnitsyncLibrary.lpAddTableInt(key, override);
	}

	@Override
	public void lpAddTableStr(String key, int override) {
		UnitsyncLibrary.lpAddTableStr(key, override);
	}

	@Override
	public void lpEndTable() {
		UnitsyncLibrary.lpEndTable();
	}

	@Override
	public void lpAddIntKeyIntVal(int key, int val) {
		UnitsyncLibrary.lpAddIntKeyIntVal(key, val);
	}

	@Override
	public void lpAddStrKeyIntVal(String key, int val) {
		UnitsyncLibrary.lpAddStrKeyIntVal(key, val);
	}

	@Override
	public void lpAddIntKeyBoolVal(int key, int val) {
		UnitsyncLibrary.lpAddIntKeyBoolVal(key, val);
	}

	@Override
	public void lpAddStrKeyBoolVal(String key, int val) {
		UnitsyncLibrary.lpAddStrKeyBoolVal(key, val);
	}

	@Override
	public void lpAddIntKeyFloatVal(int key, float val) {
		UnitsyncLibrary.lpAddIntKeyFloatVal(key, val);
	}

	@Override
	public void lpAddStrKeyFloatVal(String key, float val) {
		UnitsyncLibrary.lpAddStrKeyFloatVal(key, val);
	}

	@Override
	public void lpAddIntKeyStrVal(int key, String val) {
		UnitsyncLibrary.lpAddIntKeyStrVal(key, val);
	}

	@Override
	public void lpAddStrKeyStrVal(String key, String val) {
		UnitsyncLibrary.lpAddStrKeyStrVal(key, val);
	}

	@Override
	public int lpRootTable() {
		return UnitsyncLibrary.lpRootTable();
	}

	@Override
	public int lpRootTableExpr(String expr) {
		return UnitsyncLibrary.lpRootTableExpr(expr);
	}

	@Override
	public int lpSubTableInt(int key) {
		return UnitsyncLibrary.lpSubTableInt(key);
	}

	@Override
	public int lpSubTableStr(String key) {
		return UnitsyncLibrary.lpSubTableStr(key);
	}

	@Override
	public int lpSubTableExpr(String expr) {
		return UnitsyncLibrary.lpSubTableExpr(expr);
	}

	@Override
	public void lpPopTable() {
		UnitsyncLibrary.lpPopTable();
	}

	@Override
	public int lpGetKeyExistsInt(int key) {
		return UnitsyncLibrary.lpGetKeyExistsInt(key);
	}

	@Override
	public int lpGetKeyExistsStr(String key) {
		return UnitsyncLibrary.lpGetKeyExistsStr(key);
	}

	@Override
	public int lpGetIntKeyType(int key) {
		return UnitsyncLibrary.lpGetIntKeyType(key);
	}

	@Override
	public int lpGetStrKeyType(String key) {
		return UnitsyncLibrary.lpGetStrKeyType(key);
	}

	@Override
	public int lpGetIntKeyListCount() {
		return UnitsyncLibrary.lpGetIntKeyListCount();
	}

	@Override
	public int lpGetIntKeyListEntry(int index) {
		return UnitsyncLibrary.lpGetIntKeyListEntry(index);
	}

	@Override
	public int lpGetStrKeyListCount() {
		return UnitsyncLibrary.lpGetStrKeyListCount();
	}

	@Override
	public String lpGetStrKeyListEntry(int index) {
		return UnitsyncLibrary.lpGetStrKeyListEntry(index);
	}

	@Override
	public int lpGetIntKeyIntVal(int key, int defVal) {
		return UnitsyncLibrary.lpGetIntKeyIntVal(key, defVal);
	}

	@Override
	public int lpGetStrKeyIntVal(String key, int defVal) {
		return UnitsyncLibrary.lpGetStrKeyIntVal(key, defVal);
	}

	@Override
	public int lpGetIntKeyBoolVal(int key, int defVal) {
		return UnitsyncLibrary.lpGetIntKeyBoolVal(key, defVal);
	}

	@Override
	public int lpGetStrKeyBoolVal(String key, int defVal) {
		return UnitsyncLibrary.lpGetStrKeyBoolVal(key, defVal);
	}

	@Override
	public float lpGetIntKeyFloatVal(int key, float defVal) {
		return UnitsyncLibrary.lpGetIntKeyFloatVal(key, defVal);
	}

	@Override
	public float lpGetStrKeyFloatVal(String key, float defVal) {
		return UnitsyncLibrary.lpGetStrKeyFloatVal(key, defVal);
	}

	@Override
	public String lpGetIntKeyStrVal(int key, String defVal) {
		return UnitsyncLibrary.lpGetIntKeyStrVal(key, defVal);
	}

	@Override
	public String lpGetStrKeyStrVal(String key, String defVal) {
		return UnitsyncLibrary.lpGetStrKeyStrVal(key, defVal);
	}
}
