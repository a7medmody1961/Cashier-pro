// src/main-process/sound-handler.js

const { ipcMain } = require('electron');
// لا نحتاج لاستيراد Tone.js هنا، لأنها مكتبة تعمل في Renderer Process
// بدلاً من ذلك، سنرسل حدثاً إلى Renderer لتشغيل الصوت

module.exports = (ipcMain) => {
    /**
     * Handles requests from the renderer process to play a sound.
     * The actual sound playback logic will be in the renderer process using Tone.js.
     * @param {Electron.IpcMain} ipcMain - The ipcMain instance.
     */
    ipcMain.on('play-sound', (event, soundName) => {
        // Send a message back to the renderer process to play the sound
        // This is safer as Tone.js is a client-side library
        event.sender.send('trigger-sound', soundName);
    });
};