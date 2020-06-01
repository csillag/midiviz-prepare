#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process = require("process");
var MidiFunctions_1 = require("./MidiFunctions");
function parseArgs() {
    if (process.argv.length < 4) {
        throw new Error("Missing parameters! Please submit input and output file name.");
    }
    return {
        inputFileName: process.argv[2],
        outputFileName: process.argv[3],
    };
}
var minorNotes = [1, 3, 6, 8, 10];
function isMinor(note) {
    return minorNotes.indexOf(note % 12) !== -1;
}
/**
 * Split the minor notes from the first track a separate second track
 */
function splitMinors(music) {
    var splitTrack = music.length > 1 ? music[1] : MidiFunctions_1.addTrack(music);
    var toDelete = [];
    music[0].forEach(function (event) {
        if (event.isNoteOn() || event.isNoteOff()) {
            if (isMinor(event.getNote())) {
                splitTrack.add(event.tt, event);
                toDelete.push(event);
            }
        }
    });
    MidiFunctions_1.removeEvents(music[0], toDelete);
    console.log("Moved", toDelete.length, "note events to the second track.");
}
function main() {
    var args = parseArgs();
    var music = MidiFunctions_1.loadMusic(args.inputFileName);
    splitMinors(music);
    MidiFunctions_1.saveMusic(music, args.outputFileName);
}
main();
