"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticksToSeconds = exports.startTempoRange = void 0;
var tempoRanges = [];
function startTempoRange(pulsesPerQuarterNote, ticks, tempo) {
    var startSecond = 0;
    if (tempoRanges.length) {
        var lastRange = tempoRanges[tempoRanges.length - 1];
        if (lastRange.tempo === tempo) {
            return;
        }
        lastRange.endTick = ticks;
        startSecond = lastRange.endSecond =
            lastRange.startSecond +
                lastRange.tickDuration * (ticks - lastRange.startTick);
    }
    var tickDuration = tempo / pulsesPerQuarterNote;
    var range = {
        startSecond: startSecond,
        startTick: ticks,
        tempo: tempo,
        tickDuration: tickDuration,
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
exports.startTempoRange = startTempoRange;
function findTempoRange(ticks) {
    return tempoRanges.find(function (r) { return r.startTick <= ticks && (!r.endTick || ticks <= r.endTick); });
}
function ticksToSeconds(ticks) {
    if (!ticks) {
        return 0;
    }
    var range = findTempoRange(ticks);
    if (!range) {
        throw new Error("Wtf, I don't know what is the tempo at tick " + ticks);
    }
    var startTick = range.startTick, startSecond = range.startSecond, tickDuration = range.tickDuration;
    return startSecond + ((ticks - startTick) * tickDuration) / 1000000;
}
exports.ticksToSeconds = ticksToSeconds;
