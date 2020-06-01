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
var isMinor = function (note) { return minorNotes.indexOf(note % 12) !== -1; };
var isMajor = function (note) { return !isMinor(note); };
var isNote = function (event) { return event.isNoteOn() || event.isNoteOff(); };
var isMinorNote = function (event) {
    return isNote(event) && isMinor(event.getNote());
};
var isMajorNote = function (event) {
    return isNote(event) && isMajor(event.getNote());
};
/**
 * Split the minor notes from the first track a separate second track
 */
function splitMinors(music) {
    // const keys = Object.keys(music);
    // console.log("Objects in main scope: ", keys);
    // keys
    //   .filter((key) => key !== "0")
    //   .forEach((key) => console.log(key, ":", music[key]));
    var newMusic = MidiFunctions_1.createMusic(1, music.ppqn);
    var primaryTrack = MidiFunctions_1.addTrack(newMusic);
    var secondaryTrack = MidiFunctions_1.addTrack(newMusic);
    music[0]
        .filter(function (event) { return isMajorNote(event); }) // !isMinorNote(event))
        .forEach(function (event) {
        primaryTrack.add(event.tt, event);
    });
    music[0]
        .filter(function (event) { return isMinorNote(event); }) // !isMajorNote(event))
        .forEach(function (event) {
        secondaryTrack.add(event.tt, event);
    });
    console.log("Moved", primaryTrack.length, "major note events to primary track;", secondaryTrack.length, "minor note events to secondary track.");
    return newMusic;
}
function main() {
    var args = parseArgs();
    var music = MidiFunctions_1.loadMusic(args.inputFileName);
    if (music.length !== 1) {
        throw new Error("Sorry, but I can only handle single-track MIDI files!");
    }
    var newMusic = splitMinors(music);
    MidiFunctions_1.saveMusic(newMusic, args.outputFileName);
}
main();
