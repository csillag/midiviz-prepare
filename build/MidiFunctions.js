"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describe = exports.removeEvents = exports.addTrack = exports.saveMusic = exports.createMusic = exports.loadMusic = void 0;
var fs = require("fs");
var JZZ = require("jzz");
require("jzz-midi-smf")(JZZ);
var remove = require("lodash.remove");
function loadMusic(fileName) {
    var data = fs.readFileSync(fileName, "binary");
    var smf = new JZZ.MIDI.SMF(data); // TODO: get/create proper TS type declarations for midifile support
    return smf;
}
exports.loadMusic = loadMusic;
function createMusic(type, tempo) {
    return new JZZ.MIDI.SMF(type, tempo);
}
exports.createMusic = createMusic;
function saveMusic(music, fileName) {
    fs.writeFileSync(fileName, music.dump(), "binary");
}
exports.saveMusic = saveMusic;
function addTrack(music) {
    var trk = new JZZ.MIDI.SMF.MTrk();
    music.push(trk);
    return trk;
}
exports.addTrack = addTrack;
function removeEvents(track, test) {
    remove(track, test);
}
exports.removeEvents = removeEvents;
function describe(music) {
    var player = music.player();
    var dump = music.dump();
    console.log("Type:", player.type());
    console.log("Number of tracks:", player.tracks());
    console.log("Size:", dump.length, "bytes");
    console.log("Duration:", player.duration(), "ticks");
    console.log("Total time:", player.durationMS(), "milliseconds");
}
exports.describe = describe;
