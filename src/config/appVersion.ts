/**
 * Global MAHR System Version Single Source of Truth
 */
export const APP_VERSION = "2.4.1";
export const DEB_FILENAME = `mahr-desktop_${APP_VERSION}_amd64.deb`;
export const EXE_FILENAME = `MAHR-Setup-v${APP_VERSION}.exe`;

export const LINUX_INSTALL_CMD = "sudo apt install --reinstall -y ./mahr-desktop*.deb && mahr";
export const LINUX_DPKG_CMD = "sudo dpkg -i --force-overwrite ./mahr-desktop*.deb && mahr";
