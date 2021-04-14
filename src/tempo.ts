interface TempoRange {
  startTick: number;
  endTick?: number;
  startSecond: number;
  endSecond?: number;
  tempo: number;
  tickDuration: number;
}

const tempoRanges: TempoRange[] = [];

export function startTempoRange(
  pulsesPerQuarterNote: number,
  ticks: number,
  tempo: number
) {
  let startSecond = 0;
  if (tempoRanges.length) {
    const lastRange = tempoRanges[tempoRanges.length - 1];
    if (lastRange.tempo === tempo) {
      return;
    }
    lastRange.endTick = ticks;
    startSecond = lastRange.endSecond =
      lastRange.startSecond +
      lastRange.tickDuration * (ticks - lastRange.startTick);
  }
  const tickDuration = tempo / pulsesPerQuarterNote;
  const range: TempoRange = {
    startSecond,
    startTick: ticks,
    tempo,
    tickDuration,
  };
  tempoRanges.push(range);
  // console.log("Starting new tempo range:", JSON.stringify(range, null, "  "));
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

function findTempoRange(ticks: number): TempoRange | undefined {
  return tempoRanges.find(
    (r) => r.startTick <= ticks && (!r.endTick || ticks <= r.endTick)
  );
}

export function ticksToSeconds(ticks: number): number {
  if (!ticks) {
    return 0;
  }
  const range = findTempoRange(ticks);
  if (!range) {
    throw new Error("Wtf, I don't know what is the tempo at tick " + ticks);
  }
  const { startTick, startSecond, tickDuration } = range;
  return startSecond + ((ticks - startTick) * tickDuration) / 1000000;
}
