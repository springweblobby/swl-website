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

package com.springrts.unitsync;


import java.nio.ByteBuffer;
import java.nio.IntBuffer;

/**
 * Pure interface for the native library <b>unitsync</b><br>
 * This file was copied from an auto-generated file.
 * @see #UnitsyncLibrary
 */
public interface Unitsync {

	/**
	 * @brief Retrieves the next error in queue of errors and removes this error<br>
	 *   from the queue<br>
	 * @return An error message, or NULL if there are no more errors in the queue<br>
	 * * Use this method to get a (short) description of errors that occurred in any<br>
	 * other unitsync methods. Call this in a loop until it returns NULL to get all<br>
	 * errors.<br>
	 * * The error messages may be varying in detail etc.; nothing is guaranteed about<br>
	 * them, not even whether they have terminating newline or not.<br>
	 * * Example:<br>
	 * 	@code<br>
	 * 	const char* err;<br>
	 * 	while ((err = GetNextError()) != NULL)<br>
	 * 		printf("unitsync error: %s\n", err);<br>
	 * 	@endcode<br>
	 * Original signature : <code>char* GetNextError()</code>
	 */
	String getNextError();
	/**
	 * @brief Retrieve the synced version of Spring,<br>
	 *   this unitsync was compiled with.<br>
	 * @return The synced Spring/unitsync version, examples:<br>
	 *   - 0.78.0: 1st release of 0.78<br>
	 *   - 0.82.6: 7th release of 0.82<br>
	 *   - 0.82+.5: some test-version from after the 6th release of 0.82<br>
	 *   - 0.82+.0: some dev-version from after the 1st release of 0.82<br>
	 *     (on the main dev branch)<br>
	 * * Returns a string specifying the synced part of the version of Spring used to<br>
	 * build this library with.<br>
	 * * The returned version will be of the format "Major.Minor".<br>
	 * With Major=0.82 and Minor=6, the returned version would be "0.82.6".<br>
	 * It was added to aid in lobby creation, to check if the engine version in use<br>
	 * is sync-compatible with the current stable one.<br>
	 * Original signature : <code>char* GetSpringVersion()</code>
	 */
	String getSpringVersion();
	/**
	 * @brief Retrieve the unsynced/patch-set part of the version of Spring,<br>
	 *   this unitsync was compiled with.<br>
	 * @return The unsynced/patch-set Spring/unitsync version,<br>
	 *   for example "1" if the whole spring version is "0.82.6.1".<br>
	 * * Returns a string specifying the unsynced/patch-set part of the version of<br>
	 * Spring used to build this library with.<br>
	 * * The You may use this together with GetSpringVersion(), to form the whole<br>
	 * version like this:<br>
	 * GetSpringVersion() + "." + GetSpringVersionPatchset()<br>
	 * This will provide you with a version of the format "Major.Minor.Patchset",<br>
	 * for example "0.82.6.0" or "0.82.6.1".<br>
	 * Original signature : <code>char* GetSpringVersionPatchset()</code>
	 */
	String getSpringVersionPatchset();
	/**
	 * @brief Initialize the unitsync library<br>
	 * @return Zero on error; non-zero on success<br>
	 * @param isServer indicates whether the caller is hosting or joining a game<br>
	 * @param id unused parameter TODO<br>
	 * * Call this function before calling any other function in unitsync.<br>
	 * In case unitsync was already initialized, it is uninitialized and then<br>
	 * reinitialized.<br>
	 * * Calling this function is currently the only way to clear the VFS of the<br>
	 * files which are mapped into it.  In other words, after using AddArchive() or<br>
	 * AddAllArchives() you have to call Init when you want to remove the archives<br>
	 * from the VFS and start with a clean state.<br>
	 * * The config handler will not be reset. It will however, be initialised if it<br>
	 * was not before (with SetSpringConfigFile()).<br>
	 * Original signature : <code>int Init(bool, int)</code>
	 */
	int init(boolean isServer, int id);
	/**
	 * @brief Uninitialize the unitsync library<br>
	 * * also resets the config handler<br>
	 * Original signature : <code>void UnInit()</code>
	 */
	void unInit();
	/**
	 * @brief Get the main data directory that is used by unitsync and Spring<br>
	 * @return NULL on error; the data directory path on success<br>
	 * * This is the data directory which is used to write logs, screen-shots, demos,<br>
	 * etc.<br>
	 * Original signature : <code>char* GetWritableDataDirectory()</code>
	 */
	String getWritableDataDirectory();
	/**
	 * @brief Get the total number of readable data directories used by unitsync and Spring<br>
	 * @return -1 if there was an error, otherwise integer >= 0<br>
	 * Original signature : <code>int GetDataDirectoryCount()</code>
	 */
	int getDataDirectoryCount();
	/**
	 * @brief Get the absolute path to i-th data directory<br>
	 * @return NULL on error; the i-th data directory absolute path on success<br>
	 * Original signature : <code>char* GetDataDirectory(int)</code>
	 */
	String getDataDirectory(int index);
	/**
	 * @brief Process another unit and return how many are left to process<br>
	 * @return The number of unprocessed units to be handled<br>
	 * * Call this function repeatedly until it returns 0 before calling any other<br>
	 * function related to units.<br>
	 * * Because of risk for infinite loops, this function can not return any error<br>
	 * code. It is advised to poll GetNextError() after calling this function.<br>
	 * * Before any units are available, you will first need to map a mod's archives<br>
	 * into the VFS using AddArchive() or AddAllArchives().<br>
	 * Original signature : <code>int ProcessUnits()</code>
	 */
	int processUnits();
	/**
	 * @brief Identical to ProcessUnits(), neither generates checksum anymore<br>
	 * @see ProcessUnits<br>
	 * Original signature : <code>int ProcessUnitsNoChecksum()</code>
	 */
	int processUnitsNoChecksum();
	/**
	 * @brief Get the number of units<br>
	 * @return Zero on error; the number of units available on success<br>
	 * * Will return the number of units. Remember to call ProcessUnits() beforehand<br>
	 * until it returns 0.  As ProcessUnits() is called the number of processed<br>
	 * units goes up, and so will the value returned by this function.<br>
	 * * Example:<br>
	 * 	@code<br>
	 * 	while (ProcessUnits() != 0) {}<br>
	 * 	int unit_number = GetUnitCount();<br>
	 * 	@endcode<br>
	 * Original signature : <code>int GetUnitCount()</code>
	 */
	int getUnitCount();
	/**
	 * @brief Get the units internal mod name<br>
	 * @param unit The units id number<br>
	 * @return The units internal mod name or NULL on error<br>
	 * * This function returns the units internal mod name. For example it would<br>
	 * return 'armck' and not 'Arm Construction kbot'.<br>
	 * Original signature : <code>char* GetUnitName(int)</code>
	 */
	String getUnitName(int unit);
	/**
	 * @brief Get the units human readable name<br>
	 * @param unit The units id number<br>
	 * @return The units human readable name or NULL on error<br>
	 * * This function returns the units human name. For example it would return<br>
	 * 'Arm Construction kbot' and not 'armck'.<br>
	 * Original signature : <code>char* GetFullUnitName(int)</code>
	 */
	String getFullUnitName(int unit);
	/**
	 * @brief Adds an archive to the VFS (Virtual File System)<br>
	 * * After this, the contents of the archive are available to other unitsync<br>
	 * functions, for example:<br>
	 * ProcessUnits(), OpenFileVFS(), ReadFileVFS(), FileSizeVFS(), etc.<br>
	 * * Do not forget to call RemoveAllArchives() before proceeding with other<br>
	 * archives.<br>
	 * Original signature : <code>void AddArchive(const char*)</code>
	 */
	void addArchive(String archiveName);
	/**
	 * @brief Adds an achive and all its dependencies to the VFS<br>
	 * @see AddArchive<br>
	 * Original signature : <code>void AddAllArchives(const char*)</code>
	 */
	void addAllArchives(String rootArchiveName);
	/**
	 * @brief Removes all archives from the VFS (Virtual File System)<br>
	 * * After this, the contents of the archives are not available to other unitsync<br>
	 * functions anymore, for example:<br>
	 * ProcessUnits(), OpenFileVFS(), ReadFileVFS(), FileSizeVFS(), etc.<br>
	 * * In a lobby-client, this may be used instead of Init() when switching mod<br>
	 * archive.<br>
	 * Original signature : <code>void RemoveAllArchives()</code>
	 */
	void removeAllArchives();
	/**
	 * @brief Get checksum of an archive<br>
	 * @return Zero on error; the checksum on success<br>
	 * * This checksum depends only on the contents from the archive itself, and not<br>
	 * on the contents from dependencies of this archive (if any).<br>
	 * Original signature : <code>int GetArchiveChecksum(const char*)</code>
	 */
	int getArchiveChecksum(String archiveName);
	/**
	 * @brief Gets the real path to the archive<br>
	 * @return NULL on error; a path to the archive on success<br>
	 * Original signature : <code>char* GetArchivePath(const char*)</code>
	 */
	String getArchivePath(String archiveName);
	/**
	 * @brief Get the number of maps available<br>
	 * @return Zero on error; the number of maps available on success<br>
	 * * Call this before any of the map functions which take a map index as<br>
	 * parameter.<br>
	 * This function actually performs a relatively costly enumeration of all maps,<br>
	 * so you should resist from calling it repeatedly in a loop.  Rather use:<br>
	 * 	@code<br>
	 * 	int map_count = GetMapCount();<br>
	 * 	for (int index = 0; index < map_count; ++index) {<br>
	 * 		printf("map name: %s\n", GetMapName(index));<br>
	 * 	}<br>
	 * 	@endcode<br>
	 * Then:<br>
	 * 	@code<br>
	 * 	for (int index = 0; index < GetMapCount(); ++index) { ... }<br>
	 * 	@endcode<br>
	 * Original signature : <code>int GetMapCount()</code>
	 */
	int getMapCount();
	/**
	 * @brief Get the name of a map<br>
	 * @return NULL on error; the name of the map (e.g. "SmallDivide") on success<br>
	 * Original signature : <code>char* GetMapName(int)</code>
	 */
	String getMapName(int index);
	/**
	 * @brief Get the file-name of a map<br>
	 * @return NULL on error; the file-name of the map (e.g. "maps/SmallDivide.smf")<br>
	 *   on success<br>
	 * Original signature : <code>char* GetMapFileName(int)</code>
	 */
	String getMapFileName(int index);
	/**
	 * @brief Get the description of a map<br>
	 * @return NULL on error; the description of the map<br>
	 *         (e.g. "Lot of metal in middle") on success<br>
	 * Original signature : <code>char* GetMapDescription(int)</code>
	 */
	String getMapDescription(int index);
	/**
	 * @brief Get the name of the author of a map<br>
	 * @return NULL on error; the name of the author of a map on success<br>
	 * Original signature : <code>char* GetMapAuthor(int)</code>
	 */
	String getMapAuthor(int index);
	/**
	 * @brief Get the width of a map<br>
	 * @return -1 on error; the width of a map<br>
	 * Original signature : <code>int GetMapWidth(int)</code>
	 */
	int getMapWidth(int index);
	/**
	 * @brief Get the height of a map<br>
	 * @return -1 on error; the height of a map<br>
	 * Original signature : <code>int GetMapHeight(int)</code>
	 */
	int getMapHeight(int index);
	/**
	 * @brief Get the tidal speed of a map<br>
	 * @return -1 on error; the tidal speed of the map on success<br>
	 * Original signature : <code>int GetMapTidalStrength(int)</code>
	 */
	int getMapTidalStrength(int index);
	/**
	 * @brief Get the minimum wind speed on a map<br>
	 * @return -1 on error; the minimum wind speed on a map<br>
	 * Original signature : <code>int GetMapWindMin(int)</code>
	 */
	int getMapWindMin(int index);
	/**
	 * @brief Get the maximum wind strenght on a map<br>
	 * @return -1 on error; the maximum wind strenght on a map<br>
	 * Original signature : <code>int GetMapWindMax(int)</code>
	 */
	int getMapWindMax(int index);
	/**
	 * @brief Get the gravity of a map<br>
	 * @return -1 on error; the gravity of the map on success<br>
	 * Original signature : <code>int GetMapGravity(int)</code>
	 */
	int getMapGravity(int index);
	/**
	 * @brief Get the number of resources supported available<br>
	 * @return -1 on error; the number of resources supported available on success<br>
	 * Original signature : <code>int GetMapResourceCount(int)</code>
	 */
	int getMapResourceCount(int index);
	/**
	 * @brief Get the name of a map resource<br>
	 * @return NULL on error; the name of a map resource (e.g. "Metal") on success<br>
	 * Original signature : <code>char* GetMapResourceName(int, int)</code>
	 */
	String getMapResourceName(int index, int resourceIndex);
	/**
	 * @brief Get the scale factor of a resource map<br>
	 * @return 0.0f on error; the scale factor of a resource map on success<br>
	 * Original signature : <code>float GetMapResourceMax(int, int)</code>
	 */
	float getMapResourceMax(int index, int resourceIndex);
	/**
	 * @brief Get the extractor radius for a map resource<br>
	 * @return -1 on error; the extractor radius for a map resource on success<br>
	 * Original signature : <code>int GetMapResourceExtractorRadius(int, int)</code>
	 */
	int getMapResourceExtractorRadius(int index, int resourceIndex);
	/**
	 * @brief Get the number of defined start positions for a map<br>
	 * @return -1 on error; the number of defined start positions for a map<br>
	 *         on success<br>
	 * Original signature : <code>int GetMapPosCount(int)</code>
	 */
	int getMapPosCount(int index);
	/**
	 * @brief Get the position on the x-axis for a start position on a map<br>
	 * @return -1.0f on error; the position on the x-axis for a start position<br>
	 *         on a map on success<br>
	 * Original signature : <code>float GetMapPosX(int, int)</code>
	 */
	float getMapPosX(int index, int posIndex);
	/**
	 * @brief Get the position on the z-axis for a start position on a map<br>
	 * @return -1.0f on error; the position on the z-axis for a start position<br>
	 *         on a map on success<br>
	 * Original signature : <code>float GetMapPosZ(int, int)</code>
	 */
	float getMapPosZ(int index, int posIndex);
	/**
	 * @brief return the map's minimum height<br>
	 * @param mapName name of the map, e.g. "SmallDivide"<br>
	 * * Together with maxHeight, this determines the<br>
	 * range of the map's height values in-game. The<br>
	 * conversion formula for any raw 16-bit height<br>
	 * datum <code>h</code> is<br>
	 * *    <code>minHeight + (h * (maxHeight - minHeight) / 65536.0f)</code><br>
	 * Original signature : <code>float GetMapMinHeight(const char*)</code>
	 */
	float getMapMinHeight(String mapName);
	/**
	 * @brief return the map's maximum height<br>
	 * @param mapName name of the map, e.g. "SmallDivide"<br>
	 * * Together with minHeight, this determines the<br>
	 * range of the map's height values in-game. See<br>
	 * GetMapMinHeight() for the conversion formula.<br>
	 * Original signature : <code>float GetMapMaxHeight(const char*)</code>
	 */
	float getMapMaxHeight(String mapName);
	/**
	 * @brief Retrieves the number of archives a map requires<br>
	 * @param mapName name of the map, e.g. "SmallDivide"<br>
	 * @return Zero on error; the number of archives on success<br>
	 * * Must be called before GetMapArchiveName()<br>
	 * Original signature : <code>int GetMapArchiveCount(const char*)</code>
	 */
	int getMapArchiveCount(String mapName);
	/**
	 * @brief Retrieves an archive a map requires<br>
	 * @param index the index of the archive<br>
	 * @return NULL on error; the name of the archive on success<br>
	 * Original signature : <code>char* GetMapArchiveName(int)</code>
	 */
	String getMapArchiveName(int index);
	/**
	 * @brief Get map checksum given a map index<br>
	 * @param index the index of the map<br>
	 * @return Zero on error; the checksum on success<br>
	 * * This checksum depends on Spring internals, and as such should not be expected<br>
	 * to remain stable between releases.<br>
	 * * (It is meant to check sync between clients in lobby, for example.)<br>
	 * Original signature : <code>int GetMapChecksum(int)</code>
	 */
	int getMapChecksum(int index);
	/**
	 * @brief Get map checksum given a map name<br>
	 * @param mapName name of the map, e.g. "SmallDivide"<br>
	 * @return Zero on error; the checksum on success<br>
	 * @see GetMapChecksum<br>
	 * Original signature : <code>int GetMapChecksumFromName(const char*)</code>
	 */
	int getMapChecksumFromName(String mapName);
	/**
	 * @brief Retrieves a minimap image for a map.<br>
	 * @param fileName The name of the map, including extension.<br>
	 * @param miplevel Which miplevel of the minimap to extract from the file.<br>
	 * Set miplevel to 0 to get the largest, 1024x1024 minimap. Each increment<br>
	 * divides the width and height by 2. The maximum miplevel is 8, resulting in a<br>
	 * 4x4 image.<br>
	 * @return A pointer to a static memory area containing the minimap as a 16 bit<br>
	 * packed RGB-565 (MSB to LSB: 5 bits red, 6 bits green, 5 bits blue) linear<br>
	 * bitmap on success; NULL on error.<br>
	 * * An example usage would be GetMiniMap("SmallDivide.smf", 2).<br>
	 * This would return a 16 bit packed RGB-565 256x256 (= 1024/2^2) bitmap.<br>
	 * Original signature : <code>* GetMiniMap(const char*, int)</code><br>
	 * <i>native declaration : unitsync_api.h:388</i>
	 */
	short[] getMiniMap(String fileName, int mipLevel);
	/**
	 * @brief Retrieves dimensions of infomap for a map.<br>
	 * @param mapName  The name of the map, e.g. "SmallDivide".<br>
	 * @param name     Of which infomap to retrieve the dimensions.<br>
	 * @param width    This is set to the width of the infomap, or 0 on error.<br>
	 * @param height   This is set to the height of the infomap, or 0 on error.<br>
	 * @return Non-zero when the infomap was found with a non-zero size; zero on<br>
	 *   error.<br>
	 * @see GetInfoMap<br>
	 * Original signature : <code>int GetInfoMapSize(const char*, const char*, int*, int*)</code>
	 */
	int getInfoMapSize(String mapName, String name, IntBuffer width, IntBuffer height);
	/**
	 * @brief Retrieves infomap data of a map.<br>
	 * @param mapName  The name of the map, e.g. "SmallDivide".<br>
	 * @param name     Which infomap to extract from the file.<br>
	 * @param data     Pointer to a memory location with enough room to hold the<br>
	 *   infomap data.<br>
	 * @param typeHint One of bm_grayscale_8 (or 1) and bm_grayscale_16 (or 2).<br>
	 * @return Non-zero if the infomap was successfully extracted (and optionally<br>
	 * converted), or zero on error (map was not found, infomap was not found, or<br>
	 * typeHint could not be honored.)<br>
	 * * This function extracts an infomap from a map. This can currently be one of:<br>
	 * "height", "metal", "grass", "type". The heightmap is natively in 16 bits per<br>
	 * pixel, the others are in 8 bits pixel. Using typeHint one can give a hint to<br>
	 * this function to convert from one format to another. Currently only the<br>
	 * conversion from 16 bpp to 8 bpp is implemented.<br>
	 * Original signature : <code>int GetInfoMap(const char*, const char*, unsigned char*, int)</code>
	 */
	int getInfoMap(String mapName, String name, ByteBuffer data, int typeHint);
	/**
	 * @brief Retrieves the number of Skirmish AIs available<br>
	 * @return Zero on error; The number of Skirmish AIs available on success<br>
	 * @see GetMapCount<br>
	 * Original signature : <code>int GetSkirmishAICount()</code>
	 */
	int getSkirmishAICount();
	/**
	 * @brief Retrieves the number of info items available for a given Skirmish AI<br>
	 * @param index Skirmish AI index/id<br>
	 * @return Zero on error; the number of info items available on success<br>
	 * @see GetSkirmishAICount<br>
	 * * Be sure to call GetSkirmishAICount() prior to using this function.<br>
	 * Original signature : <code>int GetSkirmishAIInfoCount(int)</code>
	 */
	int getSkirmishAIInfoCount(int index);
	/**
	 * @brief Retrieves an info item's key<br>
	 * @param index info item index/id<br>
	 * @return NULL on error; the info item's key on success<br>
	 * @see GetSkirmishAIInfoCount<br>
	 * * The key of an option is either one defined as SKIRMISH_AI_PROPERTY_* in<br>
	 * ExternalAI/Interface/SSkirmishAILibrary.h, or a custom one.<br>
	 * Be sure to call GetSkirmishAIInfoCount() prior to using this function.<br>
	 * Original signature : <code>char* GetInfoKey(int)</code>
	 */
	String getInfoKey(int index);
	/**
	 * @brief Retrieves an info item's value type<br>
	 * @param index info item index/id<br>
	 * @return NULL on error; the info item's value type on success,<br>
	 *   which will be one of:<br>
	 *   "string", "integer", "float", "boolean"<br>
	 * @see GetSkirmishAIInfoCount<br>
	 * @see GetInfoValueString<br>
	 * @see GetInfoValueInteger<br>
	 * @see GetInfoValueFloat<br>
	 * @see GetInfoValueBool<br>
	 * * Be sure to call GetSkirmishAIInfoCount() prior to using this function.<br>
	 * Original signature : <code>char* GetInfoType(int)</code>
	 */
	String getInfoType(int index);
	/**
	 * @brief Retrieves an info item's value as string<br>
	 * @param index info item index/id<br>
	 * @return NULL on error; the info item's value as string on success<br>
	 * @see GetSkirmishAIInfoCount<br>
	 * @see GetInfoType<br>
	 * @see GetInfoValueString<br>
	 * @see GetInfoValueInteger<br>
	 * @see GetInfoValueFloat<br>
	 * @see GetInfoValueBool<br>
	 * @deprecated use GetInfoValue* instead<br>
	 * Original signature : <code>char* GetInfoValue(int)</code>
	 */
	String getInfoValue(int index);
	/**
	 * @brief Retrieves an info item's value of type string<br>
	 * @param index info item index/id<br>
	 * @return NULL on error; the info item's value on success<br>
	 * @see GetSkirmishAIInfoCount<br>
	 * @see GetInfoType<br>
	 * * Be sure to call GetSkirmishAIInfoCount() prior to using this function.<br>
	 * Original signature : <code>char* GetInfoValueString(int)</code>
	 */
	String getInfoValueString(int index);
	/**
	 * @brief Retrieves an info item's value of type integer<br>
	 * @param index info item index/id<br>
	 * @return NULL on error; the info item's value on success<br>
	 * @see GetSkirmishAIInfoCount<br>
	 * @see GetInfoType<br>
	 * * Be sure to call GetSkirmishAIInfoCount() prior to using this function.<br>
	 * Original signature : <code>int GetInfoValueInteger(int)</code>
	 */
	int getInfoValueInteger(int index);
	/**
	 * @brief Retrieves an info item's value of type float<br>
	 * @param index info item index/id<br>
	 * @return NULL on error; the info item's value on success<br>
	 * @see GetSkirmishAIInfoCount<br>
	 * @see GetInfoType<br>
	 * * Be sure to call GetSkirmishAIInfoCount() prior to using this function.<br>
	 * Original signature : <code>float GetInfoValueFloat(int)</code>
	 */
	float getInfoValueFloat(int index);
	/**
	 * @brief Retrieves an info item's value of type bool<br>
	 * @param index info item index/id<br>
	 * @return NULL on error; the info item's value on success<br>
	 * @see GetSkirmishAIInfoCount<br>
	 * @see GetInfoType<br>
	 * * Be sure to call GetSkirmishAIInfoCount() prior to using this function.<br>
	 * Original signature : <code>bool GetInfoValueBool(int)</code>
	 */
	boolean getInfoValueBool(int index);
	/**
	 * @brief Retrieves an info item's description<br>
	 * @param index info item index/id<br>
	 * @return NULL on error; the info item's description on success<br>
	 * @see GetSkirmishAIInfoCount<br>
	 * * Be sure to call GetSkirmishAIInfoCount() prior to using this function.<br>
	 * Original signature : <code>char* GetInfoDescription(int)</code>
	 */
	String getInfoDescription(int index);
	/**
	 * @brief Retrieves the number of options available for a given Skirmish AI<br>
	 * @param index Skirmish AI index/id<br>
	 * @return Zero on error; the number of Skirmish AI options available on success<br>
	 * @see GetSkirmishAICount<br>
	 * @see GetOptionKey<br>
	 * @see GetOptionName<br>
	 * @see GetOptionDesc<br>
	 * @see GetOptionType<br>
	 * * Be sure to call GetSkirmishAICount() prior to using this function.<br>
	 * Original signature : <code>int GetSkirmishAIOptionCount(int)</code>
	 */
	int getSkirmishAIOptionCount(int index);
	/**
	 * @brief Retrieves the number of mods available<br>
	 * @return Zero on error; The number of mods available on success<br>
	 * @see GetMapCount<br>
	 * Original signature : <code>int GetPrimaryModCount()</code>
	 */
	int getPrimaryModCount();
	/**
	 * @brief Retrieves the name of this mod<br>
	 * @param index The mods index/id<br>
	 * @return NULL on error; The mods name on success<br>
	 * * Returns the name of the mod usually found in ModInfo.lua.<br>
	 * Be sure you have made a call to GetPrimaryModCount() prior to using this.<br>
	 * @brief Retrieves the number of info items available for this mod<br>
	 * @param index The mods index/id<br>
	 * @return Zero on error; the number of info items available on success<br>
	 * @see GetPrimaryModCount<br>
	 * @see GetInfoKey<br>
	 * @see GetInfoType<br>
	 * @see GetInfoDescription<br>
	 * * Be sure you have made a call to GetPrimaryModCount() prior to using this.<br>
	 * Original signature : <code>int GetPrimaryModInfoCount(int)</code>
	 */
	int getPrimaryModInfoCount(int index);
	/**
	 * @brief Retrieves the human readable name of this mod<br>
	 * @param index The mods index/id<br>
	 * @return NULL on error; The mods name on success<br>
	 * * Returns the name of the mod usually found in ModInfo.lua.<br>
	 * Be sure you have made a call to GetPrimaryModCount() prior to using this.<br>
	 * * @deprecated use the mod info item with key "name" instead<br>
	 * @see GetPrimaryModInfoCount<br>
	 * @see GetInfoKey<br>
	 * Original signature : <code>char* GetPrimaryModName(int)</code>
	 */
	String getPrimaryModName(int index);
	/**
	 * @brief Retrieves the shortened name of this mod<br>
	 * @param index The mods index/id<br>
	 * @return NULL on error; The mods abbrieviated name on success<br>
	 * * Returns the shortened name of the mod usually found in ModInfo.lua.<br>
	 * Be sure you have made a call GetPrimaryModCount() prior to using this.<br>
	 * * @deprecated use the mod info item with key "shortName" instead<br>
	 * @see GetPrimaryModInfoCount<br>
	 * @see GetInfoKey<br>
	 * Original signature : <code>char* GetPrimaryModShortName(int)</code>
	 */
	String getPrimaryModShortName(int index);
	/**
	 * @brief Retrieves the version string of this mod<br>
	 * @param index The mods index/id<br>
	 * @return NULL on error; The mods version string on success<br>
	 * * Returns value of the mutator tag for the specified mod usually found in<br>
	 * ModInfo.lua.<br>
	 * Be sure you have made a call to GetPrimaryModCount() prior to using this.<br>
	 * * @deprecated use the mod info item with key "version" instead<br>
	 * @see GetPrimaryModInfoCount<br>
	 * @see GetInfoKey<br>
	 * Original signature : <code>char* GetPrimaryModVersion(int)</code>
	 */
	String getPrimaryModVersion(int index);
	/**
	 * @brief Retrieves the mutator name of this mod<br>
	 * @param index The mods index/id<br>
	 * @return NULL on error; The mods mutator name on success<br>
	 * * Returns value of the mutator tag for the specified mod usually found in<br>
	 * ModInfo.lua.<br>
	 * Be sure you have made a call to GetPrimaryModCount() prior to using this.<br>
	 * * @deprecated use the mod info item with key "mutator" instead<br>
	 * @see GetPrimaryModInfoCount<br>
	 * @see GetInfoKey<br>
	 * Original signature : <code>char* GetPrimaryModMutator(int)</code>
	 */
	String getPrimaryModMutator(int index);
	/**
	 * @brief Retrieves the game name of this mod<br>
	 * @param index The mods index/id<br>
	 * @return NULL on error; The mods game name on success<br>
	 * * Returns the name of the game this mod belongs to usually found in<br>
	 * ModInfo.lua.<br>
	 * Be sure you have made a call to GetPrimaryModCount() prior to using this.<br>
	 * * @deprecated use the mod info item with key "game" instead<br>
	 * @see GetPrimaryModInfoCount<br>
	 * @see GetInfoKey<br>
	 * Original signature : <code>char* GetPrimaryModGame(int)</code>
	 */
	String getPrimaryModGame(int index);
	/**
	 * @brief Retrieves the short game name of this mod<br>
	 * @param index The mods index/id<br>
	 * @return NULL on error; The mods abbrieviated game name on success<br>
	 * * Returns the abbrieviated name of the game this mod belongs to usually found<br>
	 * in ModInfo.lua.<br>
	 * Be sure you have made a call to GetPrimaryModCount() prior to using this.<br>
	 * * @deprecated use the mod info item with key "shortGame" instead<br>
	 * @see GetPrimaryModInfoCount<br>
	 * @see GetInfoKey<br>
	 * Original signature : <code>char* GetPrimaryModShortGame(int)</code>
	 */
	String getPrimaryModShortGame(int index);
	/**
	 * @brief Retrieves the description of this mod<br>
	 * @param index The mods index/id<br>
	 * @return NULL on error; The mods description on success<br>
	 * * Returns a description for the specified mod usually found in ModInfo.lua.<br>
	 * Be sure you have made a call to GetPrimaryModCount() prior to using this.<br>
	 * * @deprecated use the mod info item with key "description" instead<br>
	 * @see GetPrimaryModInfoCount<br>
	 * @see GetInfoKey<br>
	 * Original signature : <code>char* GetPrimaryModDescription(int)</code>
	 */
	String getPrimaryModDescription(int index);
	/**
	 * @brief Retrieves the mod's first/primary archive<br>
	 * @param index The mods index/id<br>
	 * @return NULL on error; The mods primary archive on success<br>
	 * * Returns the name of the primary archive of the mod.<br>
	 * Be sure you have made a call to GetPrimaryModCount() prior to using this.<br>
	 * Original signature : <code>char* GetPrimaryModArchive(int)</code>
	 */
	String getPrimaryModArchive(int index);
	/**
	 * @brief Retrieves the number of archives a mod requires<br>
	 * @param index The index of the mod<br>
	 * @return Zero on error; the number of archives this mod depends on otherwise<br>
	 * * This is used to get the entire list of archives that a mod requires.<br>
	 * Call GetPrimaryModArchiveCount() with selected mod first to get number of<br>
	 * archives, and then use GetPrimaryModArchiveList() for 0 to count-1 to get the<br>
	 * name of each archive.  In code:<br>
	 * 	@code<br>
	 * 	int count = GetPrimaryModArchiveCount(mod_index);<br>
	 * 	for (int archive = 0; archive < count; ++archive) {<br>
	 * 		printf("primary mod archive: %s\n", GetPrimaryModArchiveList(archive));<br>
	 * 	}<br>
	 * 	@endcode<br>
	 * Original signature : <code>int GetPrimaryModArchiveCount(int)</code>
	 */
	int getPrimaryModArchiveCount(int index);
	/**
	 * @brief Retrieves the name of the current mod's archive.<br>
	 * @param archiveNr The archive's index/id.<br>
	 * @return NULL on error; the name of the archive on success<br>
	 * @see GetPrimaryModArchiveCount<br>
	 * Original signature : <code>char* GetPrimaryModArchiveList(int)</code>
	 */
	String getPrimaryModArchiveList(int archive);
	/**
	 * @brief The reverse of GetPrimaryModName()<br>
	 * @param name The name of the mod<br>
	 * @return -1 if the mod can not be found; the index of the mod otherwise<br>
	 * Original signature : <code>int GetPrimaryModIndex(const char*)</code>
	 */
	int getPrimaryModIndex(String name);
	/**
	 * @brief Get checksum of mod<br>
	 * @param index The mods index/id<br>
	 * @return Zero on error; the checksum on success.<br>
	 * @see GetMapChecksum<br>
	 * Original signature : <code>int GetPrimaryModChecksum(int)</code>
	 */
	int getPrimaryModChecksum(int index);
	/**
	 * @brief Get checksum of mod given the mod's name<br>
	 * @param name The name of the mod<br>
	 * @return Zero on error; the checksum on success.<br>
	 * @see GetMapChecksum<br>
	 * Original signature : <code>int GetPrimaryModChecksumFromName(const char*)</code>
	 */
	int getPrimaryModChecksumFromName(String name);
	/**
	 * @brief Retrieve the number of available sides<br>
	 * @return Zero on error; the number of sides on success<br>
	 * * This function parses the mod's side data, and returns the number of sides<br>
	 * available. Be sure to map the mod into the VFS using AddArchive() or<br>
	 * AddAllArchives() prior to using this function.<br>
	 * Original signature : <code>int GetSideCount()</code>
	 */
	int getSideCount();
	/**
	 * @brief Retrieve a side's name<br>
	 * @return NULL on error; the side's name on success<br>
	 * * Be sure you have made a call to GetSideCount() prior to using this.<br>
	 * Original signature : <code>char* GetSideName(int)</code>
	 */
	String getSideName(int side);
	/**
	 * @brief Retrieve a side's default starting unit<br>
	 * @return NULL on error; the side's starting unit name on success<br>
	 * * Be sure you have made a call to GetSideCount() prior to using this.<br>
	 * Original signature : <code>char* GetSideStartUnit(int)</code>
	 */
	String getSideStartUnit(int side);
	/**
	 * @brief Retrieve the number of map options available<br>
	 * @param mapName the name of the map, e.g. "SmallDivide"<br>
	 * @return Zero on error; the number of map options available on success<br>
	 * @see GetOptionKey<br>
	 * @see GetOptionName<br>
	 * @see GetOptionDesc<br>
	 * @see GetOptionType<br>
	 * Original signature : <code>int GetMapOptionCount(const char*)</code>
	 */
	int getMapOptionCount(String mapName);
	/**
	 * @brief Retrieve the number of mod options available<br>
	 * @return Zero on error; the number of mod options available on success<br>
	 * @see GetOptionKey<br>
	 * @see GetOptionName<br>
	 * @see GetOptionDesc<br>
	 * @see GetOptionType<br>
	 * * Be sure to map the mod into the VFS using AddArchive() or AddAllArchives()<br>
	 * prior to using this function.<br>
	 * Original signature : <code>int GetModOptionCount()</code>
	 */
	int getModOptionCount();
	/**
	 * @brief Returns the number of options available in a specific option file<br>
	 * @param fileName the VFS path to a Lua file containing an options table<br>
	 * @return Zero on error; the number of options available on success<br>
	 * @see GetOptionKey<br>
	 * @see GetOptionName<br>
	 * @see GetOptionDesc<br>
	 * @see GetOptionType<br>
	 * Original signature : <code>int GetCustomOptionCount(const char*)</code>
	 */
	int getCustomOptionCount(String fileName);
	/**
	 * @brief Retrieve an option's key<br>
	 * @param optIndex option index/id<br>
	 * @return NULL on error; the option's key on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * * For mods, maps or Skimrish AIs, the key of an option is the name it should be<br>
	 * given in the start script (section [MODOPTIONS], [MAPOPTIONS] or<br>
	 * [AI/OPTIONS]).<br>
	 * Original signature : <code>char* GetOptionKey(int)</code>
	 */
	String getOptionKey(int optIndex);
	/**
	 * @brief Retrieve an option's scope<br>
	 * @param optIndex option index/id<br>
	 * @return NULL on error; the option's scope on success, one of:<br>
	 *   "global" (default), "player", "team", "allyteam"<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionScope(int)</code>
	 */
	String getOptionScope(int optIndex);
	/**
	 * @brief Retrieve an option's name<br>
	 * @param optIndex option index/id<br>
	 * @return NULL on error; the option's user visible name on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionName(int)</code>
	 */
	String getOptionName(int optIndex);
	/**
	 * @brief Retrieve an option's section<br>
	 * @param optIndex option index/id<br>
	 * @return NULL on error; the option's section name on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionSection(int)</code>
	 */
	String getOptionSection(int optIndex);
	/**
	 * @brief Retrieve an option's style<br>
	 * @param optIndex option index/id<br>
	 * @return NULL on error; the option's style on success<br>
	 * * XXX The format of an option style string is currently undecided.<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionStyle(int)</code>
	 */
	String getOptionStyle(int optIndex);
	/**
	 * @brief Retrieve an option's description<br>
	 * @param optIndex option index/id<br>
	 * @return NULL on error; the option's description on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionDesc(int)</code>
	 */
	String getOptionDesc(int optIndex);
	/**
	 * @brief Retrieve an option's type<br>
	 * @param optIndex option index/id<br>
	 * @return opt_error on error; the option's type on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>int GetOptionType(int)</code>
	 */
	int getOptionType(int optIndex);
	/**
	 * @brief Retrieve an opt_bool option's default value<br>
	 * @param optIndex option index/id<br>
	 * @return Zero on error; the option's default value (0 or 1) on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>int GetOptionBoolDef(int)</code>
	 */
	int getOptionBoolDef(int optIndex);
	/**
	 * @brief Retrieve an opt_number option's default value<br>
	 * @param optIndex option index/id<br>
	 * @return Zero on error; the option's default value on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>float GetOptionNumberDef(int)</code>
	 */
	float getOptionNumberDef(int optIndex);
	/**
	 * @brief Retrieve an opt_number option's minimum value<br>
	 * @param optIndex option index/id<br>
	 * @return -1.0e30 on error; the option's minimum value on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>float GetOptionNumberMin(int)</code>
	 */
	float getOptionNumberMin(int optIndex);
	/**
	 * @brief Retrieve an opt_number option's maximum value<br>
	 * @param optIndex option index/id<br>
	 * @return +1.0e30 on error; the option's maximum value on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>float GetOptionNumberMax(int)</code>
	 */
	float getOptionNumberMax(int optIndex);
	/**
	 * @brief Retrieve an opt_number option's step value<br>
	 * @param optIndex option index/id<br>
	 * @return Zero on error; the option's step value on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>float GetOptionNumberStep(int)</code>
	 */
	float getOptionNumberStep(int optIndex);
	/**
	 * @brief Retrieve an opt_string option's default value<br>
	 * @param optIndex option index/id<br>
	 * @return NULL on error; the option's default value on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionStringDef(int)</code>
	 */
	String getOptionStringDef(int optIndex);
	/**
	 * @brief Retrieve an opt_string option's maximum length<br>
	 * @param optIndex option index/id<br>
	 * @return Zero on error; the option's maximum length on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>int GetOptionStringMaxLen(int)</code>
	 */
	int getOptionStringMaxLen(int optIndex);
	/**
	 * @brief Retrieve an opt_list option's number of available items<br>
	 * @param optIndex option index/id<br>
	 * @return Zero on error; the option's number of available items on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>int GetOptionListCount(int)</code>
	 */
	int getOptionListCount(int optIndex);
	/**
	 * @brief Retrieve an opt_list option's default value<br>
	 * @param optIndex option index/id<br>
	 * @return NULL on error; the option's default value (list item key) on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionListDef(int)</code>
	 */
	String getOptionListDef(int optIndex);
	/**
	 * @brief Retrieve an opt_list option item's key<br>
	 * @param optIndex option index/id<br>
	 * @param itemIndex list item index/id<br>
	 * @return NULL on error; the option item's key (list item key) on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionListItemKey(int, int)</code>
	 */
	String getOptionListItemKey(int optIndex, int itemIndex);
	/**
	 * @brief Retrieve an opt_list option item's name<br>
	 * @param optIndex option index/id<br>
	 * @param itemIndex list item index/id<br>
	 * @return NULL on error; the option item's name on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionListItemName(int, int)</code>
	 */
	String getOptionListItemName(int optIndex, int itemIndex);
	/**
	 * @brief Retrieve an opt_list option item's description<br>
	 * @param optIndex option index/id<br>
	 * @param itemIndex list item index/id<br>
	 * @return NULL on error; the option item's description on success<br>
	 * * Do not use this before having called Get*OptionCount().<br>
	 * @see GetMapOptionCount<br>
	 * @see GetModOptionCount<br>
	 * @see GetSkirmishAIOptionCount<br>
	 * @see GetCustomOptionCount<br>
	 * Original signature : <code>char* GetOptionListItemDesc(int, int)</code>
	 */
	String getOptionListItemDesc(int optIndex, int itemIndex);
	/**
	 * @brief Retrieve the number of valid maps for the current mod<br>
	 * @return 0 on error; the number of valid maps on success<br>
	 * * A return value of 0 means that any map can be selected.<br>
	 * Be sure to map the mod into the VFS using AddArchive() or AddAllArchives()<br>
	 * prior to using this function.<br>
	 * Original signature : <code>int GetModValidMapCount()</code>
	 */
	int getModValidMapCount();
	/**
	 * @brief Retrieve the name of a map valid for the current mod<br>
	 * @return NULL on error; the name of the map on success<br>
	 * * Map names should be complete  (including the .smf or .sm3 extension.)<br>
	 * Be sure you have made a call to GetModValidMapCount() prior to using this.<br>
	 * Original signature : <code>char* GetModValidMap(int)</code>
	 */
	String getModValidMap(int index);
	/**
	 * @brief Open a file from the VFS<br>
	 * @param name the name of the file<br>
	 * @return Zero on error; a non-zero file handle on success.<br>
	 * * The returned file handle is needed for subsequent calls to CloseFileVFS(),<br>
	 * ReadFileVFS() and FileSizeVFS().<br>
	 * * Map the wanted archives into the VFS with AddArchive() or AddAllArchives()<br>
	 * before using this function.<br>
	 * Original signature : <code>int OpenFileVFS(const char*)</code>
	 */
	int openFileVFS(String name);
	/**
	 * @brief Close a file in the VFS<br>
	 * @param file the file handle as returned by OpenFileVFS()<br>
	 * Original signature : <code>void CloseFileVFS(int)</code>
	 */
	void closeFileVFS(int file);
	/**
	 * @brief Read some data from a file in the VFS<br>
	 * @param file the file handle as returned by OpenFileVFS()<br>
	 * @param buf output buffer, must be at least of size numBytes<br>
	 * @param numBytes how many bytes to read from the file<br>
	 * @return -1 on error; the number of bytes read on success<br>
	 * (if this is less than length you reached the end of the file.)<br>
	 * Original signature : <code>int ReadFileVFS(int, unsigned char*, int)</code>
	 */
	int readFileVFS(int file, ByteBuffer buf, int numBytes);
	/**
	 * @brief Retrieve size of a file in the VFS<br>
	 * @param file the file handle as returned by OpenFileVFS()<br>
	 * @return -1 on error; the size of the file on success<br>
	 * Original signature : <code>int FileSizeVFS(int)</code>
	 */
	int fileSizeVFS(int file);
	/**
	 * @brief Find files in VFS by glob<br>
	 * Does not currently support more than one call at a time;<br>
	 * a new call to this function destroys data from previous ones.<br>
	 * Pass the returned handle to FindFilesVFS to get the results.<br>
	 * @param pattern glob used to search for files, for example "*.png"<br>
	 * @return handle to the first file found that matches the pattern, or 0 if no<br>
	 *   file was found or an error occurred<br>
	 * @see FindFilesVFS<br>
	 * Original signature : <code>int InitFindVFS(const char*)</code>
	 */
	int initFindVFS(String pattern);
	/**
	 * @brief Find files in VFS by glob in a sub-directory<br>
	 * Does not currently support more than one call at a time;<br>
	 * a new call to this function destroys data from previous ones.<br>
	 * Pass the returned handle to FindFilesVFS to get the results.<br>
	 * @param path sub-directory to search in<br>
	 * @param pattern glob used to search for files, for example "*.png"<br>
	 * @param modes which archives to search, see System/FileSystem/VFSModes.h<br>
	 * @return handle to the first file found that matches the pattern, or 0 if no<br>
	 *   file was found or an error occurred<br>
	 * @see FindFilesVFS<br>
	 * Original signature : <code>int InitDirListVFS(const char*, const char*, const char*)</code>
	 */
	int initDirListVFS(String path, String pattern, String modes);
	/**
	 * @brief Find directories in VFS by glob in a sub-directory<br>
	 * Does not currently support more than one call at a time;<br>
	 * a new call to this function destroys data from previous ones.<br>
	 * Pass the returned handle to FindFilesVFS to get the results.<br>
	 * @param path sub-directory to search in<br>
	 * @param pattern glob used to search for directories, for example "iLove*"<br>
	 * @param modes which archives to search, see System/FileSystem/VFSModes.h<br>
	 * @return handle to the first file found that matches the pattern, or 0 if no<br>
	 *   file was found or an error occurred<br>
	 * @see FindFilesVFS<br>
	 * Original signature : <code>int InitSubDirsVFS(const char*, const char*, const char*)</code>
	 */
	int initSubDirsVFS(String path, String pattern, String modes);
	/**
	 * @brief Find the next file.<br>
	 * On first call, pass a handle from any of the Init*VFS() functions.<br>
	 * On subsequent calls, pass the return value of this function.<br>
	 * @param file the file handle as returned by any of the Init*VFS() functions or<br>
	 *   this one.<br>
	 * @param nameBuf out-param to contain the VFS file-path<br>
	 * @param size should be set to the size of nameBuf<br>
	 * @return new file handle or 0<br>
	 * @see InitFindVFS<br>
	 * @see InitDirListVFS<br>
	 * @see InitSubDirsVFS<br>
	 * Original signature : <code>int FindFilesVFS(int, char*, int)</code>
	 */
	int findFilesVFS(int file, ByteBuffer nameBuf, int size);
	/**
	 * @brief Open an archive<br>
	 * @param name the name of the archive (*.sdz, *.sd7, ...)<br>
	 * @return Zero on error; a non-zero archive handle on success.<br>
	 * @sa OpenArchiveType<br>
	 * Original signature : <code>int OpenArchive(const char*)</code>
	 */
	int openArchive(String name);
	/**
	 * @brief Open an archive<br>
	 * @param name the name of the archive<br>
	 *   (*.sd7, *.sdz, *.sdd, *.ccx, *.hpi, *.ufo, *.gp3, *.gp4, *.swx)<br>
	 * @param type the type of the archive<br>
	 *   (sd7, 7z, sdz, zip, sdd, dir, ccx, hpi, ufo, gp3, gp4, swx)<br>
	 * @return Zero on error; a non-zero archive handle on success.<br>
	 * @sa OpenArchive<br>
	 * * The list of supported types and recognized extensions may change at any time,<br>
	 * but this list will always be the same as the file types recognized by the<br>
	 * engine.<br>
	 * * FIXME This function is pointless, because OpenArchive() does the same and<br>
	 * automatically detects the file type based on its extension.<br>
	 * Who added it anyway?<br>
	 * @deprecated<br>
	 * Original signature : <code>int OpenArchiveType(const char*, const char*)</code>
	 */
	int openArchiveType(String name, String type);
	/**
	 * @brief Close an archive in the VFS<br>
	 * @param archive the archive handle as returned by OpenArchive()<br>
	 * Original signature : <code>void CloseArchive(int)</code>
	 */
	void closeArchive(int archive);
	/**
	 * @brief Browse through files in a VFS archive<br>
	 * @param archive the archive handle as returned by OpenArchive()<br>
	 * @param file the index of the file in the archive to fetch info for<br>
	 * @param nameBuf out-param, will contain the name of the file on success<br>
	 * @param size in&out-param, has to contain the size of nameBuf on input,<br>
	 *   will contain the file-size as output on success<br>
	 * @return Zero on error; a non-zero file handle on success.<br>
	 * Original signature : <code>int FindFilesArchive(int, int, char*, int*)</code>
	 */
	int findFilesArchive(int archive, int file, ByteBuffer nameBuf, IntBuffer size);
	/**
	 * @brief Open an archive member<br>
	 * @param archive the archive handle as returned by OpenArchive()<br>
	 * @param name the name of the file<br>
	 * @return Zero on error; a non-zero file handle on success.<br>
	 * * The returned file handle is needed for subsequent calls to ReadArchiveFile(),<br>
	 * CloseArchiveFile() and SizeArchiveFile().<br>
	 * Original signature : <code>int OpenArchiveFile(int, const char*)</code>
	 */
	int openArchiveFile(int archive, String name);
	/**
	 * @brief Read some data from an archive member<br>
	 * @param archive the archive handle as returned by OpenArchive()<br>
	 * @param file the file handle as returned by OpenArchiveFile()<br>
	 * @param buffer output buffer, must be at least numBytes bytes<br>
	 * @param numBytes how many bytes to read from the file<br>
	 * @return -1 on error; the number of bytes read on success<br>
	 * (if this is less than numBytes you reached the end of the file.)<br>
	 * Original signature : <code>int ReadArchiveFile(int, int, unsigned char*, int)</code>
	 */
	int readArchiveFile(int archive, int file, ByteBuffer buffer, int numBytes);
	/**
	 * @brief Close an archive member<br>
	 * @param archive the archive handle as returned by OpenArchive()<br>
	 * @param file the file handle as returned by OpenArchiveFile()<br>
	 * Original signature : <code>void CloseArchiveFile(int, int)</code>
	 */
	void closeArchiveFile(int archive, int file);
	/**
	 * @brief Retrieve size of an archive member<br>
	 * @param archive the archive handle as returned by OpenArchive()<br>
	 * @param file the file handle as returned by OpenArchiveFile()<br>
	 * @return -1 on error; the size of the file on success<br>
	 * Original signature : <code>int SizeArchiveFile(int, int)</code>
	 */
	int getSizeArchiveFile(int archive, int file);
	/**
	 * @brief (Re-)Loads the global config-handler<br>
	 * @param fileNameAsAbsolutePath the config file to be used, if NULL, the<br>
	 *   default one is used<br>
	 * @see GetSpringConfigFile()<br>
	 * Original signature : <code>void SetSpringConfigFile(const char*)</code>
	 */
	void setSpringConfigFile(String fileNameAsAbsolutePath);
	/**
	 * @brief Returns the path to the config-file path<br>
	 * @return the absolute path to the config-file in use by the config-handler<br>
	 * @see SetSpringConfigFile()<br>
	 * Original signature : <code>char* GetSpringConfigFile()</code>
	 */
	String getSpringConfigFile();
	/**
	 * @brief get string from Spring configuration<br>
	 * @param name name of key to get<br>
	 * @param defValue default string value to use if the key is not found, may not<br>
	 *   be NULL<br>
	 * @return string value<br>
	 * Original signature : <code>char* GetSpringConfigString(const char*, const char*)</code>
	 */
	String getSpringConfigString(String name, String defValue);
	/**
	 * @brief get integer from Spring configuration<br>
	 * @param name name of key to get<br>
	 * @param defValue default integer value to use if key is not found<br>
	 * @return integer value<br>
	 * Original signature : <code>int GetSpringConfigInt(const char*, const int)</code>
	 */
	int getSpringConfigInt(String name, int defValue);
	/**
	 * @brief get float from Spring configuration<br>
	 * @param name name of key to get<br>
	 * @param defValue default float value to use if key is not found<br>
	 * @return float value<br>
	 * Original signature : <code>float GetSpringConfigFloat(const char*, const float)</code>
	 */
	float getSpringConfigFloat(String name, float defValue);
	/**
	 * @brief set string in Spring configuration<br>
	 * @param name name of key to set<br>
	 * @param value string value to set<br>
	 * Original signature : <code>void SetSpringConfigString(const char*, const char*)</code>
	 */
	void setSpringConfigString(String name, String value);
	/**
	 * @brief set integer in Spring configuration<br>
	 * @param name name of key to set<br>
	 * @param value integer value to set<br>
	 * Original signature : <code>void SetSpringConfigInt(const char*, const int)</code>
	 */
	void setSpringConfigInt(String name, int value);
	/**
	 * @brief set float in Spring configuration<br>
	 * @param name name of key to set<br>
	 * @param value float value to set<br>
	 * Original signature : <code>void SetSpringConfigFloat(const char*, const float)</code>
	 */
	void setSpringConfigFloat(String name, float value);
	/// Original signature : <code>void lpClose()</code>
	void lpClose();
	/// Original signature : <code>int lpOpenFile(const char*, const char*, const char*)</code>
	int lpOpenFile(String fileName, String fileModes, String accessModes);
	/// Original signature : <code>int lpOpenSource(const char*, const char*)</code>
	int lpOpenSource(String source, String accessModes);
	/// Original signature : <code>int lpExecute()</code>
	int lpExecute();
	/// Original signature : <code>char* lpErrorLog()</code>
	String lpErrorLog();
	/// Original signature : <code>void lpAddTableInt(int, int)</code>
	void lpAddTableInt(int key, int override);
	/// Original signature : <code>void lpAddTableStr(const char*, int)</code>
	void lpAddTableStr(String key, int override);
	/// Original signature : <code>void lpEndTable()</code>
	void lpEndTable();
	/// Original signature : <code>void lpAddIntKeyIntVal(int, int)</code>
	void lpAddIntKeyIntVal(int key, int value);
	/// Original signature : <code>void lpAddStrKeyIntVal(const char*, int)</code>
	void lpAddStrKeyIntVal(String key, int value);
	/// Original signature : <code>void lpAddIntKeyBoolVal(int, int)</code>
	void lpAddIntKeyBoolVal(int key, int value);
	/// Original signature : <code>void lpAddStrKeyBoolVal(const char*, int)</code>
	void lpAddStrKeyBoolVal(String key, int value);
	/// Original signature : <code>void lpAddIntKeyFloatVal(int, float)</code>
	void lpAddIntKeyFloatVal(int key, float value);
	/// Original signature : <code>void lpAddStrKeyFloatVal(const char*, float)</code>
	void lpAddStrKeyFloatVal(String key, float value);
	/// Original signature : <code>void lpAddIntKeyStrVal(int, const char*)</code>
	void lpAddIntKeyStrVal(int key, String value);
	/// Original signature : <code>void lpAddStrKeyStrVal(const char*, const char*)</code>
	void lpAddStrKeyStrVal(String key, String value);
	/// Original signature : <code>int lpRootTable()</code>
	int lpRootTable();
	/// Original signature : <code>int lpRootTableExpr(const char*)</code>
	int lpRootTableExpr(String expr);
	/// Original signature : <code>int lpSubTableInt(int)</code>
	int lpSubTableInt(int key);
	/// Original signature : <code>int lpSubTableStr(const char*)</code>
	int lpSubTableStr(String key);
	/// Original signature : <code>int lpSubTableExpr(const char*)</code>
	int lpSubTableExpr(String expr);
	/// Original signature : <code>void lpPopTable()</code>
	void lpPopTable();
	/// Original signature : <code>int lpGetKeyExistsInt(int)</code>
	int lpGetKeyExistsInt(int key);
	/// Original signature : <code>int lpGetKeyExistsStr(const char*)</code>
	int lpGetKeyExistsStr(String key);
	/// Original signature : <code>int lpGetIntKeyType(int)</code>
	int lpGetIntKeyType(int key);
	/// Original signature : <code>int lpGetStrKeyType(const char*)</code>
	int lpGetStrKeyType(String key);
	/// Original signature : <code>int lpGetIntKeyListCount()</code>
	int lpGetIntKeyListCount();
	/// Original signature : <code>int lpGetIntKeyListEntry(int)</code>
	int lpGetIntKeyListEntry(int index);
	/// Original signature : <code>int lpGetStrKeyListCount()</code>
	int lpGetStrKeyListCount();
	/// Original signature : <code>char* lpGetStrKeyListEntry(int)</code>
	String lpGetStrKeyListEntry(int index);
	/// Original signature : <code>int lpGetIntKeyIntVal(int, int)</code>
	int lpGetIntKeyIntVal(int key, int defValue);
	/// Original signature : <code>int lpGetStrKeyIntVal(const char*, int)</code>
	int lpGetStrKeyIntVal(String key, int defValue);
	/// Original signature : <code>int lpGetIntKeyBoolVal(int, int)</code>
	int lpGetIntKeyBoolVal(int key, int defValue);
	/// Original signature : <code>int lpGetStrKeyBoolVal(const char*, int)</code>
	int lpGetStrKeyBoolVal(String key, int defValue);
	/// Original signature : <code>float lpGetIntKeyFloatVal(int, float)</code>
	float lpGetIntKeyFloatVal(int key, float defValue);
	/// Original signature : <code>float lpGetStrKeyFloatVal(const char*, float)</code>
	float lpGetStrKeyFloatVal(String key, float defValue);
	/// Original signature : <code>char* lpGetIntKeyStrVal(int, const char*)</code>
	String lpGetIntKeyStrVal(int key, String defValue);
	/// Original signature : <code>char* lpGetStrKeyStrVal(const char*, const char*)</code>
	String lpGetStrKeyStrVal(String key, String defValue);
}
