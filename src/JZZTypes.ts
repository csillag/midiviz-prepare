// This definition has been copied from JZZ

export interface MIDI extends Array<number> {
  tt: number;

  /** Convert MIDI to human-readable string
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#tostring */
  toString(): string;
  /** The message is Note On
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#isNoteOn */
  isNoteOn(): boolean;
  /** The message is Note Off
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#isNoteOff */
  isNoteOff(): boolean;
  /** The message is a SysEx
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#isSysEx */
  isSysEx(): boolean;
  /** The message is a full SysEx
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#isFullSysEx */
  isFullSysEx(): boolean;
  /** The message is a Standard MIDI File meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#isSMF */
  isSMF(): boolean;
  /** The message is a Tempo meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#isTempo */
  isTempo(): boolean;
  /** The message is a Time Signature meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#isTimeSignature */
  isTimeSignature(): boolean;
  /** The message is a Key Signature meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#isKeySignature */
  isKeySignature(): boolean;
  /** The message is an End of Track meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#isEOT */
  isEOT(): boolean;
  /** Return the channel number where applicable
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getChannel */
  getChannel(): number;
  /** Set the channel number where applicable
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#setChannel */
  setChannel(cc: number): MIDI;
  /** Return the note value where applicable
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getNote */
  getNote(): number;
  /** Set the note where applicable
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#setNote */
  setNote(note: number | string): MIDI;
  /** Return the velocity where applicable
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getVelocity */
  getVelocity(): number;
  /** Set the velocity where applicable
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#setVelocity */
  setVelocity(vv: number): MIDI;
  /** Return the SysEx channel number where applicable
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getSysExChannel */
  getSysExChannel(): number;
  /** Set the SysEx channel number where applicable
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#setSysExChannel */
  setSysExChannel(cc: number): MIDI;

  /** Get data from SMF meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getData */
  getData(): string;
  /** Set data on SMF meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#setData */
  setData(data: string): MIDI;
  /** Get UTF8 text from SMF meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getText */
  getText(): string;
  /** Set UTF8 text on SMF meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#setText */
  setText(str: string): MIDI;
  /** Get tempo in ms per quarter note from SMF Tempo meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getTempo */
  getTempo(): number;
  /** Get tempo as BPM from SMF Tempo meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getBPM */
  getBPM(): number;
  /** Get time signature from SMF Time Signature meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getTimeSignature */
  getTimeSignature(): number[];
  /** Get key signature from SMF Key Signature meta event
   *
   * https://jazz-soft.net/doc/JZZ/jzzmidi.html#getKeySignature */
  getKeySignature(): any[];
}
