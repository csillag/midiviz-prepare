#!/usr/bin/env node

import process = require("process");

import { SMF } from "./MidiTypes";
import { addTrack, createMusic, loadMusic, saveMusic } from "./MidiFunctions";
import { MIDI } from "./JZZTypes";

interface Parameters {
  inputFileName: string;
  outputFileName: string;
  wantedStartTime?: number;
}

function displayHelp() {
  console.error("Usage:");
  console.error();
  console.error(
    "midiviz-prepare",
    "<input filename>",
    "<output filename> [<wanted start time>]"
  );
}

function parseArgs(): Parameters | undefined {
  const { argv } = process;
  const args = argv.length;
  if (args < 4 || args > 5) {
    displayHelp();
    return;
  }
  let wantedStartTime: number | undefined;
  if (args === 5) {
    wantedStartTime = parseFloat(argv[4]);
  }
  return {
    inputFileName: process.argv[2],
    outputFileName: process.argv[3],
    wantedStartTime,
  };
}

const minorNotes = [1, 3, 6, 8, 10];

const isMinor = (note: number): boolean => minorNotes.indexOf(note % 12) !== -1;
const isMajor = (note: number): boolean => !isMinor(note);

const isNote = (event: MIDI): boolean => event.isNoteOn() || event.isNoteOff();

function belongsToMajorTrack(event: MIDI): boolean {
  if (isNote(event)) {
    return isMajor(event.getNote());
  } else {
    return event.isTempo() || event.isTimeSignature();
  }
}

function belongsToMinorTrack(event: MIDI): boolean {
  if (isNote(event)) {
    return isMinor(event.getNote());
  } else {
    return event.isTempo() || event.isTimeSignature();
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

function main() {
  // Parse the args
  const args = parseArgs();
  if (!args) {
    return;
  }
  const { inputFileName, outputFileName, wantedStartTime } = args;

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

main();
