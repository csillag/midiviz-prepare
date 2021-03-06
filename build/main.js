#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var process = require("process");
var MidiFunctions_1 = require("./MidiFunctions");
var minorNotes = [1, 3, 6, 8, 10];
var isMinor = function (note) { return minorNotes.indexOf(note % 12) !== -1; };
var isMajor = function (note) { return !isMinor(note); };
var isNote = function (event) { return event.isNoteOn() || event.isNoteOff(); };
function belongsToMajorTrack(event) {
    if (isNote(event)) {
        return isMajor(event.getNote());
    }
    else {
        // if (event.isTempo()) {
        //   console.log("Passing on event", event.toString(), event[0]);
        //   return true;
        // }
        // console.log("Swallowing", event.toString());
        return false;
    }
}
function belongsToMinorTrack(event) {
    if (isNote(event)) {
        return isMinor(event.getNote());
    }
    else {
        //    return event.isTempo();
        return false;
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
function splitTracks(inputFileName, outputFileName, wantedStartTime) {
    var _a, _b;
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
function addDelay(inputFileName, outputFileName, delaySeconds) {
    // Load the music
    var music;
    try {
        music = MidiFunctions_1.loadMusic(inputFileName);
    }
    catch (error) {
        console.error("Error while reading specified input file:", error.message);
        return;
    }
    // Create a new MIDI file
    var newMusic = MidiFunctions_1.createMusic(1, music.ppqn);
    var tempo;
    var delta;
    // Do the processing
    music.forEach(function (track, trackIndex) {
        var newTrack = MidiFunctions_1.addTrack(newMusic);
        tempo = music.ppqn;
        delta = delaySeconds * tempo * 2;
        console.log("Parsing track", trackIndex, "staring with tempo", tempo, "which means a delta of", delta, "ticks.", "( " + delaySeconds + " * " + tempo + " * 2 )");
        var count = 0;
        var started = false;
        track.forEach(function (event) {
            // if (event.isNoteOn()) {
            //   started = true;
            // }
            if (started) {
                var newTime = event.tt + delta;
                newTrack.add(newTime, event);
                console.log("Moved event from", event.tt, "to", newTime, event.toString());
                count += 1;
            }
            else {
                newTrack.add(event.tt, event);
                console.log("Copied event as is", event.tt, event.toString());
            }
            if (event.isTempo()) {
                tempo = event.getBPM();
                delta = Math.round(delaySeconds * tempo * 2);
                // console.log(
                //   "Tempo is now",
                //   tempo,
                //   "which means a delta of",
                //   delta,
                //   "ticks."
                // );
            }
        });
        console.log("Adjusted", count, "events from this track.");
    });
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
function adjustTempo(inputFileName, outputFileName, tempoRate) {
    // Load the music
    var music;
    try {
        music = MidiFunctions_1.loadMusic(inputFileName);
    }
    catch (error) {
        console.error("Error while reading specified input file:", error.message);
        return;
    }
    // Create a new MIDI file
    var newMusic = MidiFunctions_1.createMusic(1, music.ppqn);
    // Do the processing
    music.forEach(function (track, trackIndex) {
        var newTrack = MidiFunctions_1.addTrack(newMusic);
        console.log("Copying track", trackIndex);
        track.forEach(function (event) {
            var newTime = Math.round(event.tt / tempoRate);
            newTrack.add(newTime, event);
            // console.log("Event timestamp is", event.tt);
        });
    });
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
function cut(inputFileName, outputFileName, startSeconds, endSeconds, wantedStartTime) {
    if (wantedStartTime === void 0) { wantedStartTime = 1; }
    // Load the music
    var music;
    try {
        music = MidiFunctions_1.loadMusic(inputFileName);
    }
    catch (error) {
        console.error("Error while reading specified input file:", error.message);
        return;
    }
    var pulsesPerQuarterNote = music.ppqn;
    // console.log("PPQN is", pulsesPerQuarterNote);
    // Create a new MIDI file
    var newMusic = MidiFunctions_1.createMusic(1, music.ppqn);
    // Do the processing
    music.forEach(function (track, trackIndex) {
        var newTrack = MidiFunctions_1.addTrack(newMusic);
        console.log("Copying track", trackIndex);
        var tickDuration = NaN;
        var lastTime = 0;
        var droppedNotes = 0;
        var usedNotes = 0;
        var neededOffset;
        track.forEach(function (event) {
            if (event.isTempo()) {
                if (!isNaN(tickDuration)) {
                    console.log("oops. We are having a time change within the track. Expect trouble.");
                }
                var microsecondsPerQuarterNote = event.getTempo();
                tickDuration = microsecondsPerQuarterNote / pulsesPerQuarterNote;
                // console.log(
                //   "Starting with tick",
                //   event.tt,
                //   "tempo is",
                //   event.getTempo(),
                //   "ms / quarter note, so one tick means",
                //   tickDuration,
                //   "micro seconds."
                // );
            }
            var seconds = (event.tt * tickDuration) / 1000000;
            var tooEarly = seconds < startSeconds;
            var tooLate = !!endSeconds && seconds > endSeconds;
            if (event.isNoteOn() || MidiFunctions_1.isAfterTouch(event) || event.isNoteOff()) {
                // Normal musical event
                if (tooEarly) {
                    if (event.isNoteOn()) {
                        droppedNotes++;
                    }
                    // Too early, we are dropping this
                    // console.log(
                    //   "Dropped musical event from",
                    //   seconds,
                    //   "seconds (too early)"
                    // );
                }
                else if (tooLate) {
                    if (event.isNoteOn()) {
                        droppedNotes++;
                    }
                    // console.log(
                    //   "Dropped musical event from",
                    //   seconds,
                    //   "seconds (too late)"
                    // );
                }
                else {
                    if (event.isNoteOn()) {
                        usedNotes++;
                    }
                    // This event is within the specified timeframe, so we will have to add it.
                    // We will have to adjust the time a little bit
                    if (neededOffset === undefined) {
                        // This is the first sound, let's set a good affset
                        neededOffset = wantedStartTime - seconds;
                    }
                    var newSeconds = seconds + neededOffset;
                    var newTicks = (newSeconds * 1000000) / tickDuration;
                    // console.log(
                    //   "Adding musical event at",
                    //   newTicks,
                    //   newSeconds,
                    //   "seconds, instead of the original",
                    //   seconds,
                    //   "seconds",
                    //   event.toString()
                    // );
                    newTrack.add(newTicks, event);
                    lastTime = newTicks;
                }
            }
            else {
                // Control event. We can't drop this,
                if (tooEarly || tooLate) {
                    // We can't drop control events
                    // so let's cram it to the end of the track without changing the time too much
                    newTrack.add(lastTime, event);
                    // console.log("Cramming in control event", event.toString());
                }
                else {
                    // This event is within the specified timeframe, so we will have to add it.
                    // Do we have to modify the time?
                    // We will have to adjust the time a little bit
                    // We will have to adjust the time a little bit
                    if (neededOffset === undefined) {
                        // This is the first sound, let's set a good affset
                        neededOffset = wantedStartTime - seconds;
                    }
                    var newSeconds = seconds + neededOffset;
                    var newTicks = (newSeconds * 1000000) / tickDuration;
                    // console.log(
                    //   "Adding special event at",
                    //   newSeconds,
                    //   "seconds, instead of the original",
                    //   seconds,
                    //   "seconds"
                    // );
                    newTrack.add(newTicks, event);
                    lastTime = newTicks;
                }
            }
        });
        console.log("Track statistics: used", usedNotes, "notes; dropped", droppedNotes, "notes.");
        console.log("Music now starts at", wantedStartTime, "seconds.");
    });
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
var APP_NAME = "midiviz-prepare";
var program = new commander_1.Command(APP_NAME);
program.version("0.0.14");
program
    .command("split-tracks <input-midi-file> <outout-pidi-file>")
    .description("Split the major and minor notes to two separate tracks.")
    .option("--adjust-start <seconds>", "adjust the timing of the first event")
    .action(function (inputMidiFile, outputMidiFile, options) {
    var adjustStart = options.adjustStart;
    splitTracks(inputMidiFile, outputMidiFile, adjustStart);
});
program
    .command("add-delay <input-midi-file> <outout-pidi-file> <seconds>")
    .description("Add some delay to the whole file.")
    .action(addDelay);
program
    .command("adjust-tempo <input-midi-file> <outout-pidi-file> <rate>")
    .description("Adjust the tempo of the whole file.")
    .action(adjustTempo);
program
    .command("cut-segment <input-midi-file> <output-midi-file> <start-seconds> [end-seconds]")
    .description("Cut out the wanted segment of the file. (Drop the beginning and the end.)")
    .option("--adjust-start <seconds>", "adjust the timing of the first event")
    .action(function (inputFileName, outputFileName, startSeconds, endSeconds, options) {
    var adjustStart = options.adjustStart;
    cut(inputFileName, outputFileName, startSeconds, endSeconds, adjustStart);
});
program.parse(process.argv);
