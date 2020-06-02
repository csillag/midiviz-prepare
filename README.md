
`midiviz-prepare` is a MIDI file pre-processor for [MIDIVisualizer](https://github.com/ekuiter/MIDIVisualizer).

## Problem

- Once upon a time, there was a great utility called [MIDIVisualizer](https://github.com/kosua20/MIDIVisualizer), by [@kosua20](https://github.com/kosua20).
- At some point, [@ekuiter](https://github.com/ekuiter) has decided that we need a fork of this app. He has [pulled the trigger](https://github.com/ekuiter/MIDIVisualizer). Then he has added various enhancements, but alas he also ~broke~ modified one of the nifty features of the original app. The original app was able to color major and minor keys differently. The forked version uses the coloring to indicate different tracks, which is not very helpful when there is only one track.
- So I was faced with a dilemma: use the original app, with the nice coloring, or use the new fork, with the fancy features: 

## Reaction

My answer is that I choose _both_. I need the fancy new features, _and_ the correct coloring.
One possible way to achieve this would have been to create _yet another fork_ of the project, picking and choosing what I want from both versions.

But I didn't want to further fragment the already split landscape of the code. Also it would have been a PITA to maintain this version later on.

## Solution

So I just created a small MIDI pre-processor utility, which is able to move the minor keys to a separate track, and thus achieve the desired coloring with the new version.

## Installation

Just install with `npm`. The command with appear in your normal npm binary directory.

```
npm install midiviz-prepare
```

## Usage 

Just run it with the input output file names.

```
midiviz-prepare input.mid output.mid [start time in seconds]
```

### But what does it do?

Well, it reads the music in the input (single-track) MIDI file, and creates a new MIDI file out of it, by copying all the major notes on the first track, and all the minor notes to the second track. It can optionally adjust the timestamps, so that the music starts at the requested time. (Which can be helpful to get more deterministic timing, in case you want to mix the resulting animation with sound.)

