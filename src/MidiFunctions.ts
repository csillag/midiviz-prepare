import fs = require("fs");
import { MIDITrack, SMF } from "./MidiTypes";
import JZZ = require("jzz");
import { MIDI } from "./JZZTypes";
require("jzz-midi-smf")(JZZ);
import remove = require("lodash.remove");

export function loadMusic(fileName: string): SMF {
  const data = fs.readFileSync(fileName, "binary");
  const smf = new (JZZ.MIDI as any).SMF(data); // TODO: get/create proper TS type declarations for midifile support
  return smf;
}

export function saveMusic(music: SMF, fileName: string) {
  fs.writeFileSync(fileName, music.dump(), "binary");
}

export function addTrack(music: SMF): MIDITrack {
  const trk = new (JZZ.MIDI as any).SMF.MTrk();
  music.push(trk);
  return trk;
}

export function removeEvents(track: MIDITrack, events: MIDI[]) {
  remove(track, (event) => events.indexOf(event) !== -1);
}

export function describe(music: SMF) {
  const player = music.player();
  const dump = music.dump();
  console.log("Type:", player.type());
  console.log("Number of tracks:", player.tracks());
  console.log("Size:", dump.length, "bytes");
  console.log("Duration:", player.duration(), "ticks");
  console.log("Total time:", player.durationMS(), "milliseconds");
}
