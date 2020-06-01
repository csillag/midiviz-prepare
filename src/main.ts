#!/usr/bin/env node

import process = require("process");

import { SMF } from "./MidiTypes";
import {
  addTrack,
  createMusic,
  describe,
  loadMusic,
  saveMusic,
} from "./MidiFunctions";
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

const isMinor = (note: number): boolean => minorNotes.indexOf(note % 12) !== -1;
const isMajor = (note: number): boolean => !isMinor(note);

const isNote = (event: MIDI): boolean => event.isNoteOn() || event.isNoteOff();

const isMinorNote = (event: MIDI): boolean =>
  isNote(event) && isMinor(event.getNote());

const isMajorNote = (event: MIDI): boolean =>
  isNote(event) && isMajor(event.getNote());

/**
 * Split the minor notes from the first track a separate second track
 */
function splitMinors(music: SMF): SMF {
  // const keys = Object.keys(music);
  // console.log("Objects in main scope: ", keys);
  // keys
  //   .filter((key) => key !== "0")
  //   .forEach((key) => console.log(key, ":", music[key]));
  const newMusic = createMusic(1, music.ppqn);
  const primaryTrack = addTrack(newMusic);
  const secondaryTrack = addTrack(newMusic);
  music[0]
    .filter((event) => isMajorNote(event)) // !isMinorNote(event))
    .forEach((event) => {
      primaryTrack.add(event.tt, event);
    });
  music[0]
    .filter((event) => isMinorNote(event)) // !isMajorNote(event))
    .forEach((event) => {
      secondaryTrack.add(event.tt, event);
    });
  console.log(
    "Moved",
    primaryTrack.length,
    "major note events to primary track;",
    secondaryTrack.length,
    "minor note events to secondary track."
  );
  return newMusic;
}

function main() {
  const args = parseArgs();
  const music = loadMusic(args.inputFileName);
  if (music.length !== 1) {
    throw new Error("Sorry, but I can only handle single-track MIDI files!");
  }
  const newMusic = splitMinors(music);
  saveMusic(newMusic, args.outputFileName);
}

main();
