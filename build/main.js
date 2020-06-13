#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process = require("process");
var MidiFunctions_1 = require("./MidiFunctions");
function displayHelp() {
    console.error("Usage:");
    console.error();
    console.error("midiviz-prepare", "<input filename>", "<output filename> [<wanted start time>]");
}
function parseArgs() {
    var argv = process.argv;
    var args = argv.length;
    if (args < 4 || args > 5) {
        displayHelp();
        return;
    }
    var wantedStartTime;
    if (args === 5) {
        wantedStartTime = parseFloat(argv[4]);
    }
    return {
        inputFileName: process.argv[2],
        outputFileName: process.argv[3],
        wantedStartTime: wantedStartTime,
    };
}
var minorNotes = [1, 3, 6, 8, 10];
var isMinor = function (note) { return minorNotes.indexOf(note % 12) !== -1; };
var isMajor = function (note) { return !isMinor(note); };
var isNote = function (event) { return event.isNoteOn() || event.isNoteOff(); };
function belongsToMajorTrack(event) {
    if (isNote(event)) {
        return isMajor(event.getNote());
    }
    else {
        return event.isTempo() || event.isTimeSignature();
    }
}
function belongsToMinorTrack(event) {
    if (isNote(event)) {
        return isMinor(event.getNote());
    }
    else {
        return event.isTempo() || event.isTimeSignature();
    }
}
/**
 * Returns the minimum of two values that might be missing.
 *
 * The missing values are _not_ considered as a candidate.
 * If both values are missing, undefined is returned.
 */
function saneMin(a1, a2) {
    if (a1 === undefined) {
        if (a2 === undefined) {
            // None of the input values are defined; we have nothing better to do than returning undefined
            return undefined;
        }
        else {
            // A1 is undefined, A2 is defined
            return a2;
        }
    }
    else {
        if (a2 === undefined) {
            // A1 is defined, A2 is undefined
            return a1;
        }
        else {
            // Both A1 and A2 are defined
            return Math.min(a1, a2);
        }
    }
}
function main() {
    var _a, _b;
    // Parse the args
    var args = parseArgs();
    if (!args) {
        return;
    }
    var inputFileName = args.inputFileName, outputFileName = args.outputFileName, wantedStartTime = args.wantedStartTime;
    // Load the music
    var music;
    try {
        music = MidiFunctions_1.loadMusic(inputFileName);
    }
    catch (error) {
        console.error("Error while reading specified input file:", error.message);
        return;
    }
    // Do the processing
    var tempo = music.ppqn;
    var allEvents = [];
    music.forEach(function (track) { return track.forEach(function (event) { return allEvents.push(event); }); });
    var sortedEvents = allEvents.sort(function (a, b) { return a.tt - b.tt; });
    // Filter the notes
    var majors = sortedEvents.filter(function (event) { return belongsToMajorTrack(event); });
    var minors = sortedEvents.filter(function (event) { return belongsToMinorTrack(event); });
    // Calculating required time adjustment
    var timeOffset = 0;
    if (wantedStartTime !== undefined) {
        console.log("Tempo is:", tempo, "ticks per half second");
        var tickLength = 0.5 / tempo;
        var currentStartTicks = saneMin((_a = majors[0]) === null || _a === void 0 ? void 0 : _a.tt, (_b = minors[0]) === null || _b === void 0 ? void 0 : _b.tt);
        if (currentStartTicks === undefined) {
            console.log("There are no notes; not doing time adjustment.");
        }
        else {
            var wantedStartTicks = wantedStartTime / tickLength;
            timeOffset = wantedStartTicks - currentStartTicks;
            console.log("Current start time:", currentStartTicks, "ticks");
            console.log("Wanted start time:", wantedStartTime, "secs,", wantedStartTicks, "ticks");
            console.log("Adjusting timestamps with", timeOffset, "ticks");
        }
    }
    else {
        console.log("No time adjustment requested.");
    }
    // Create a new MIDI file
    var newMusic = MidiFunctions_1.createMusic(1, tempo);
    // Add the track for the major notes
    var primaryTrack = MidiFunctions_1.addTrack(newMusic);
    majors.forEach(function (event) {
        primaryTrack.add(event.tt + timeOffset, event);
    });
    // Add the tract for the minor notes
    var secondaryTrack = MidiFunctions_1.addTrack(newMusic);
    minors.forEach(function (event) {
        secondaryTrack.add(event.tt + timeOffset, event);
    });
    // Log the results
    console.log("Moved", primaryTrack.length, "major note events to primary track;", secondaryTrack.length, "minor note events to secondary track.");
    // Save the result
    try {
        MidiFunctions_1.saveMusic(newMusic, outputFileName);
        console.log("Output saved to", outputFileName);
    }
    catch (error) {
        console.error("Error while writing specified output file:", error.message);
        return;
    }
}
main();
