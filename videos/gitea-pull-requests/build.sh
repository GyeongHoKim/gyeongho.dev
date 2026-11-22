#!/bin/sh
# Builds the Gitea screen from full-page captures of the two pull requests
# (1280 px wide, taken signed in at gitea.com, which hides pull requests from guests).
set -eu
cd "$(dirname "$0")"
out=../../src/assets/portfolio/gitea-pull-requests
tmp=$(mktemp -d)
x264="-c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an -r 30"

# clip <image> <output> <hold> <scroll time> <hold> <scroll distance>
clip() {
	ffmpeg -v error -y -loop 1 -t "$(echo "$3+$4+$5" | bc)" -i "$1" \
		-vf "crop=1280:800:0:'$6*(1-cos(PI*clip((t-$3)/$4,0,1)))/2',fps=30" $x264 "$2"
}
clip go-sdk-781.png "$tmp/1.mp4" 1.8 3.5 1.5 720
clip cli-29.png "$tmp/2.mp4" 1.8 3 2 340
ffmpeg -v error -y -i "$tmp/1.mp4" -i "$tmp/2.mp4" \
	-filter_complex "[0][1]xfade=transition=fade:duration=0.5:offset=6.3,format=yuv420p" $x264 "$out.mp4"
ffmpeg -v error -y -i "$out.mp4" -frames:v 1 -q:v 4 "$out.jpg"
rm -r "$tmp"
