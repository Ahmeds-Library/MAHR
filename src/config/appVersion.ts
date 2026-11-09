/**
 * Global MAHR System Version Single Source of Truth
 */
export const APP_VERSION = "2.4.1-build-2";
export const APP_VERSION_BASE = "2.4.1";
export const DEB_FILENAME = `mahr-desktop_2.4.1_amd64.deb`;
export const EXE_FILENAME = `MAHR-Setup-v2.4.1-build-2.exe`;
export const EXE_STANDALONE_FILENAME = `MAHR-v2.4.1-build-2.exe`;
export const EXE_PORTABLE_FILENAME = `MAHR-Setup-v2.4.1.exe`;

export const LINUX_INSTALL_CMD = "sudo apt install --reinstall -y ./mahr-desktop*.deb && mahr";
export const LINUX_DPKG_CMD = "sudo dpkg -i --force-overwrite ./mahr-desktop*.deb && mahr";
