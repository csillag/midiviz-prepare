#!/usr/bin/env node

import { Command } from "commander";

import process = require("process");

import { SMF } from "./MidiTypes";
import {
  addTrack,
  createMusic,
  isAfterTouch,
  isPedal,
  loadMusic,
  saveMusic,
} from "./MidiFunctions";
import { MIDI } from "./JZZTypes";
import { startTempoRange, ticksToSeconds } from "./tempo";

const minorNotes = [1, 3, 6, 8, 10];

const isMinor = (note: number): boolean => minorNotes.indexOf(note % 12) !== -1;
const isMajor = (note: number): boolean => !isMinor(note);

const isNote = (event: MIDI): boolean => event.isNoteOn() || event.isNoteOff();

function belongsToMajorTrack(event: MIDI): boolean {
  if (isNote(event)) {
    return isMajor(event.getNote());
  } else {
    // if (event.isTempo()) {
    //   console.log("Passing on event", event.toString(), event[0]);
    //   return true;
    // }
    // console.log("Swallowing", event.toString());
    return false;
  }
}

function belongsToMinorTrack(event: MIDI): boolean {
  if (isNote(event)) {
    return isMinor(event.getNote());
  } else {
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
function saneMin(a1: number, a2: number): number | undefined {
  if (a1 === undefined) {
    if (a2 === undefined) {
      // None of the input values are defined; we have nothing better to do than returning undefined
      return undefined;
    } else {
      // A1 is undefined, A2 is defined
      return a2;
    }
  } else {
    if (a2 === undefined) {
      // A1 is defined, A2 is undefined
      return a1;
    } else {
      // Both A1 and A2 are defined
      return Math.min(a1, a2);
    }
  }
}

function splitTracks(
  inputFileName: string,
  outputFileName: string,
  wantedStartTime?: number
) {
  // Load the music
  let music: SMF | undefined;
  try {
    music = loadMusic(inputFileName);
  } catch (error) {
    console.error("Error while reading specified input file:", error.message);
    return;
  }

  // Do the processing

  const tempo = music.ppqn;

  const allEvents: MIDI[] = [];
  music.forEach((track) => track.forEach((event) => allEvents.push(event)));
  const sortedEvents = allEvents.sort((a, b) => a.tt - b.tt);

  // Filter the notes
  const majors = sortedEvents.filter((event) => belongsToMajorTrack(event));
  const minors = sortedEvents.filter((event) => belongsToMinorTrack(event));

  // Calculating required time adjustment
  let timeOffset = 0;
  if (wantedStartTime !== undefined) {
    console.log("Tempo is:", tempo, "ticks per half second");
    const tickLength = 0.5 / tempo;
    const currentStartTicks = saneMin(majors[0]?.tt, minors[0]?.tt);
    if (currentStartTicks === undefined) {
      console.log("There are no notes; not doing time adjustment.");
    } else {
      const wantedStartTicks = wantedStartTime / tickLength;
      timeOffset = wantedStartTicks - currentStartTicks;
      console.log("Current start time:", currentStartTicks, "ticks");
      console.log(
        "Wanted start time:",
        wantedStartTime,
        "secs,",
        wantedStartTicks,
        "ticks"
      );
      console.log("Adjusting timestamps with", timeOffset, "ticks");
    }
  } else {
    console.log("No time adjustment requested.");
  }

  // Create a new MIDI file
  const newMusic = createMusic(1, tempo);

  // Add the track for the major notes
  const primaryTrack = addTrack(newMusic);
  majors.forEach((event) => {
    primaryTrack.add(event.tt + timeOffset, event);
  });

  // Add the tract for the minor notes
  const secondaryTrack = addTrack(newMusic);
  minors.forEach((event) => {
    secondaryTrack.add(event.tt + timeOffset, event);
  });

  // Log the results
  console.log(
    "Moved",
    primaryTrack.length,
    "major note events to primary track;",
    secondaryTrack.length,
    "minor note events to secondary track."
  );

  // Save the result
  try {
    saveMusic(newMusic, outputFileName);
    console.log("Output saved to", outputFileName);
  } catch (error) {
    console.error("Error while writing specified output file:", error.message);
    return;
  }
}

function addDelay(
  inputFileName: string,
  outputFileName: string,
  delaySeconds: number
) {
  // Load the music
  let music: SMF | undefined;
  try {
    music = loadMusic(inputFileName);
  } catch (error) {
    console.error("Error while reading specified input file:", error.message);
    return;
  }

  // Create a new MIDI file
  const newMusic = createMusic(1, music.ppqn);

  let tempo: number;
  let delta: number;

  // Do the processing
  music.forEach((track, trackIndex) => {
    const newTrack = addTrack(newMusic);
    tempo = music!.ppqn;
    delta = delaySeconds * tempo * 2;
    console.log(
      "Parsing track",
      trackIndex,
      "staring with tempo",
      tempo,
      "which means a delta of",
      delta,
      "ticks.",
      "( " + delaySeconds + " * " + tempo + " * 2 )"
    );
    let count = 0;
    let started = false;

    track.forEach((event) => {
      // if (event.isNoteOn()) {
      //   started = true;
      // }
      if (started) {
        const newTime = event.tt + delta;
        newTrack.add(newTime, event);
        console.log(
          "Moved event from",
          event.tt,
          "to",
          newTime,
          event.toString()
        );
        count += 1;
      } else {
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
    saveMusic(newMusic, outputFileName);
    console.log("Output saved to", outputFileName);
  } catch (error) {
    console.error("Error while writing specified output file:", error.message);
    return;
  }
}

function adjustTempo(
  inputFileName: string,
  outputFileName: string,
  tempoRate: number
) {
  // Load the music
  let music: SMF | undefined;
  try {
    music = loadMusic(inputFileName);
  } catch (error) {
    console.error("Error while reading specified input file:", error.message);
    return;
  }

  const tickUpscaling = 64;

  const newPPQN = music.ppqn * tickUpscaling;

  console.log("Upscaling PPQM from", music.ppqn, "to", newPPQN);

  // Create a new MIDI file
  const newMusic = createMusic(1, newPPQN);

  // Do the processing
  music.forEach((track, trackIndex) => {
    const newTrack = addTrack(newMusic);
    console.log("Copying track", trackIndex);

    track.forEach((event) => {
      const newTime = Math.round((event.tt * tickUpscaling) / tempoRate);
      newTrack.add(newTime, event);
      // console.log("Event timestamp is", event.tt);
    });
  });

  // Save the result
  try {
    saveMusic(newMusic, outputFileName);
    console.log("Output saved to", outputFileName);
  } catch (error) {
    console.error("Error while writing specified output file:", error.message);
    return;
  }
}

function cut(
  inputFileName: string,
  outputFileName: string,
  startSeconds: number,
  endSeconds: number,
  wantedStartTime = 1
) {
  // Load the music
  let music: SMF | undefined;
  try {
    music = loadMusic(inputFileName);
  } catch (error) {
    console.error("Error while reading specified input file:", error.message);
    return;
  }

  const pulsesPerQuarterNote = music!.ppqn;
  // console.log("PPQN is", pulsesPerQuarterNote);

  // Create a new MIDI file
  const newMusic = createMusic(1, music.ppqn);

  // console.log("Cutting segment [", startSeconds, "-", endSeconds, "]...");

  // Do the processing
  music.forEach((track, trackIndex) => {
    const newTrack = addTrack(newMusic);
    console.log("Copying track", trackIndex);

    let lastTime = 0;
    let droppedNotes = 0;
    let usedNotes = 0;
    let neededOffset: number | undefined;
    track.forEach((event) => {
      if (event.isTempo()) {
        startTempoRange(pulsesPerQuarterNote, event.tt, event.getTempo());
      }

      const seconds = ticksToSeconds(event.tt);
      const tooEarly = seconds < startSeconds;
      const tooLate = !!endSeconds && seconds > endSeconds;
      // console.log(
      //   "Looking at event at",
      //   event.tt,
      //   "ticks,",
      //   seconds,
      //   "seconds. Too early?",
      //   tooEarly,
      //   "Too late?",
      //   tooLate
      // );
      if (
        event.isNoteOn() ||
        isAfterTouch(event) ||
        event.isNoteOff() ||
        isPedal(event)
      ) {
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
        } else if (tooLate) {
          if (event.isNoteOn()) {
            droppedNotes++;
          }
          // console.log(
          //   "Dropped musical event from",
          //   seconds,
          //   "seconds (too late)"
          // );
        } else {
          if (event.isNoteOn()) {
            usedNotes++;
          }
          // This event is within the specified timeframe, so we will have to add it.

          // We will have to adjust the time a little bit
          if (neededOffset === undefined) {
            // This is the first sound, let's set a good affset
            neededOffset = wantedStartTime - seconds;
            console.log(
              "Since we wanted to start at",
              wantedStartTime,
              "sec, and we have found the first sound at",
              seconds,
              "(",
              event.tt,
              "ticks)",
              ", we are setting an offset of",
              neededOffset
            );
          }
          const newSeconds = seconds + neededOffset;
          const newTicks = (newSeconds * 1000000) / tickDuration;
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
      } else {
        // Control event. We can't drop this,

        if (tooEarly || tooLate) {
          // We can't drop control events
          // so let's cram it to the end of the track without changing the time too much
          // console.log(
          //   "Cramming in control event at time",
          //   lastTime,
          //   ":",
          //   event.toString()
          // );
          newTrack.add(lastTime, event);
        } else {
          // This event is within the specified timeframe, so we will have to add it.
          // Do we have to modify the time?

          // We will have to adjust the time a little bit
          if (neededOffset === undefined) {
            // This is the first sound, let's set a good offset
            neededOffset = wantedStartTime - seconds;
            console.log(
              "Since we wanted to start at",
              wantedStartTime,
              "sec, and we have found the first wanted control event at",
              seconds,
              ", we are setting an offset of",
              neededOffset
            );
          }
          const newSeconds = seconds + neededOffset;

          const newTicks = !!newSeconds
            ? (newSeconds * 1000000) / tickDuration
            : 0;
          // console.log(
          //   "Adding special event at",
          //   newTicks,
          //   "ticks",
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
    console.log(
      "Track statistics: used",
      usedNotes,
      "notes; dropped",
      droppedNotes,
      "notes."
    );
    console.log("Music now starts at", wantedStartTime, "seconds.");
  });

  // Save the result
  try {
    saveMusic(newMusic, outputFileName);
    console.log("Output saved to", outputFileName);
  } catch (error) {
    console.error("Error while writing specified output file:", error.message);
    return;
  }
}

function dump(inputFileName: string) {
  // Load the music
  let music: SMF | undefined;
  try {
    music = loadMusic(inputFileName);
  } catch (error) {
    console.error("Error while reading specified input file:", error.message);
    return;
  }

  const pulsesPerQuarterNote = music!.ppqn;
  music.forEach((track, trackIndex) => {
    console.log("Track", trackIndex);
    track.forEach((event) => {
      if (event.isTempo()) {
        startTempoRange(pulsesPerQuarterNote, event.tt, event.getTempo());
      }

      const seconds = ticksToSeconds(event.tt);
      console.log(seconds, event.toString());
    });
  });
}

function hasPedal(inputFileName: string) {
  // Load the music
  let music: SMF | undefined;
  try {
    music = loadMusic(inputFileName);
  } catch (error) {
    console.error("Error while reading specified input file:", error.message);
    return;
  }

  let found = false;
  music.forEach((track) => {
    track.forEach((event) => {
      if (isPedal(event)) {
        found = true;
      }
    });
  });
  return found ? "1" : "0";
}

const APP_NAME = "midiviz-prepare";

const program = new Command(APP_NAME);

program.version("0.0.14");

program
  .command("split-tracks <input-midi-file> <outout-pidi-file>")
  .description("Split the major and minor notes to two separate tracks.")
  .option("--adjust-start <seconds>", "adjust the timing of the first event")
  .action((inputMidiFile: string, outputMidiFile: string, options: any) => {
    const { adjustStart } = options;
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
  .command(
    "cut-segment <input-midi-file> <output-midi-file> <start-seconds> [end-seconds]"
  )
  .description(
    "Cut out the wanted segment of the file. (Drop the beginning and the end.)"
  )
  .option("--adjust-start <seconds>", "adjust the timing of the first event")
  .action(
    (
      inputFileName: string,
      outputFileName: string,
      startSeconds: number,
      endSeconds: number,
      options: any
    ) => {
      const { adjustStart } = options;
      cut(inputFileName, outputFileName, startSeconds, endSeconds, adjustStart);
    }
  );

program
  .command("dump <input-midi-file>")
  .description("Dump MIDI events in text format")
  .action(dump);

program
  .command("has-pedal <input-midi-file>")
  .description("Checks whether a MIDI sequence contains pedal events")
  .action((inputMidiFile) => {
    const pedal = hasPedal(inputMidiFile);
    console.log(pedal);
  });

program.parse(process.argv);
