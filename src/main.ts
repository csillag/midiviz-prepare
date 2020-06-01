#!/usr/bin/env node

import process = require("process");

import { SMF } from "./MidiTypes";
import { addTrack, loadMusic, removeEvents, saveMusic } from "./MidiFunctions";
import { MIDI } from "./JZZTypes";

interface Parameters {
  inputFileName: string;
  outputFileName: string;
}

function parseArgs(): Parameters {
  if (process.argv.length < 4) {
    throw new Error(
      "Missing parameters! Please submit input and output file name."
    );
  }
  return {
    inputFileName: process.argv[2],
    outputFileName: process.argv[3],
  };
}

const minorNotes = [1, 3, 6, 8, 10];

function isMinor(note: number) {
  return minorNotes.indexOf(note % 12) !== -1;
}

/**
 * Split the minor notes from the first track a separate second track
 */
function splitMinors(music: SMF) {
  const splitTrack = music.length > 1 ? music[1] : addTrack(music);
  const toDelete: MIDI[] = [];
  music[0].forEach((event) => {
    if (event.isNoteOn() || event.isNoteOff()) {
      if (isMinor(event.getNote())) {
        splitTrack.add(event.tt, event);
        toDelete.push(event);
      }
    }
  });
  removeEvents(music[0], toDelete);
  console.log("Moved", toDelete.length, "note events to the second track.");
}

function main() {
  const args = parseArgs();
  const music = loadMusic(args.inputFileName);
  splitMinors(music);
  saveMusic(music, args.outputFileName);
}

main();
