import { MIDI } from "./JZZTypes";

export interface MIDITrack extends Array<MIDI> {
  add(time: number, event: MIDI): void;
}

export interface MIDIPlayer {
  play(): void;
  tracks(): number;
  type(): number;
  duration(): number;
  durationMS(): number;
}

export interface SMF extends Array<MIDITrack> {
  player(): MIDIPlayer;
  dump(): any;
}
