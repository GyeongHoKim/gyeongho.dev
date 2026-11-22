#!/bin/sh
# Builds the design system screen from 1280x800 captures of the public Storybook
# (https://6879ec1785e2e4589d8c4df0-akgqhihwlv.chromatic.com, one Docs page per component).
# Each capture stays on screen for 1.2 seconds, in file name order.
set -eu
cd "$(dirname "$0")"
out=../../src/assets/portfolio/ids-storybook
ffmpeg -v error -y -framerate 1/1.2 -pattern_type glob -i '*.png' -vf "fps=30,format=yuv420p" \
	-c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an -r 30 "$out.mp4"
ffmpeg -v error -y -i "$out.mp4" -frames:v 1 -q:v 4 "$out.jpg"
