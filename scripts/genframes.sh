#!/bin/bash
#
# Generates an mkv that contains a h265 video where each frame name itself.
# Generates the associated ass subtitle file, doing the same.
# By Drax

# Default values
file="teset.mkv"
font="Courier-New-Bold" # View available fonts with: convert -list font (Ubuntu-Mono-Bold for Linux)
fontname="Courier New"
frames=24
rate=23.976023976
mux=0

errout() { 2>&1 echo $@; exit 2; }

## Usage
usage() {
cat <<EOF
Frame counter generator (by drax)

Generates an mkv that contains a h265 video where each frame name itself.
Generates the associated ass subtitle file, doing the same.

 Usage:
  $(basename $0) [-n frames] [-r rate] [-f font] [-m] [-o output.mkv]
  $(basename $0) [-h | -l]

 Options:
  -n frames     The number of frames (+1) to generate (default: $frames)
  -r rate       Framerate (default: $rate)
  -f font       Font name as given by $(basename $0) -l
  -m            Mux the subtitle with the video
  -o output     Output filename
  -l            List all available fonts on this system
  -h            This help

EOF
}

# Check dependencies
ffmpeg="ffmpeg.exe"
ffmpeg_alt="ffmpeg"
type -p "$ffmpeg" &>/dev/null || ffmpeg="$ffmpeg_alt"
type -p "$ffmpeg" &>/dev/null || errout "Ffmpeg not found."

magick="magick.exe"
magick_alt="magick"
type -p "$magick" &>/dev/null || magick="magick_alt"
type -p "$magick" &>/dev/null || errout "ImageMagick not found."

# A little helper
showfonts() {
  "$magick" -list font | tr -d "\r" | sed -nE 's/.*Font: (.*)/\1/p'
}



# Get options
options=':n:r:f:o:lmh'
while getopts $options option; do
    case "$option" in
        n  ) frames="$OPTARG";;
        r  ) rate="$OPTARG";;
        f  ) font="$OPTARG";;
        o  ) file="$OPTARG";;
        l  ) showfonts; exit 0;;
        m  ) mux=1;;
        h  ) usage; exit 0;;
        \? ) errout "Unknown option: -$OPTARG";;
        :  ) errout "Missing option argument for -$OPTARG";;
        *  ) errout "Unimplemented option: -$OPTARG";;
    esac
done
shift $((OPTIND - 1))

# Check mandatory argument
(($# != 0)) && errout "Error: too many arguments. Use -h for help."
[[ ! "$frames" =~ ^[0-9]+$ ]] && errout "Error: frames must be a positive integer."
[[ ! "$rate" =~ ^[0-9]+\.?[0-9]*$ ]] && errout "Error: frame rate must be a positive number."
showfonts | grep "^${font}$" &>/dev/null || errout "Font not found. Use -l to list available fonts."

# Set some additional values
fontname="$("$magick" -list font | tr -d "\r" | sed -nE "/Font: ${font}$/ {n; s/.*family: //p}")"
ass="${file%.*}.ass"
digits=${#frames} # Used for padding

# My h265 encoding parameters
X265_PARAMS=wpp=1:no-pmode=1:no-pme=1:no-psnr=1:no-ssim=1:interlace=0:total-frames=0:level-idc=0:high-tier=1:uhd-bd=0:ref=3:no-allow-non-conformance=1:no-repeat-headers=1:annexb=1:no-aud=1:no-eob=1:no-eos=1:no-hrd=1:info=1:hash=0:no-temporal-layers=1:open-gop=1:min-keyint=24:keyint=240:gop-lookahead=0:bframes=4:b-adapt=2:b-pyramid=1:bframe-bias=0:rc-lookahead=20:lookahead-slices=6:scenecut=40:hist-scenecut=0:radl=0:no-intra-refresh=1:ctu=64:min-cu-size=8:no-rect=1:no-amp=1:max-tu-size=32:tu-inter-depth=1:tu-intra-depth=1:limit-tu=0:rdoq-level=0:dynamic-rd=0.00:no-ssim-rd=1:signhide=1:no-tskip=1:nr-intra=0:nr-inter=0:no-constrained-intra=1:no-strong-intra-smoothing=1:max-merge=2:limit-refs=3:no-limit-modes=1:me=1:subme=2:merange=57:temporal-mvp=1:no-frame-dup=1:no-hme=1:weightp=1:no-weightb=1:no-analyze-src-pics=1:sao=1:no-sao-non-deblock=1:rd=3:selective-sao=4:no-early-skip=1:rskip=1:no-fast-intra=1:no-tskip-fast=1:no-cu-lossless=1:b-intra=1:no-splitrd-skip=1:rdpenalty=0:psy-rd=0.00:psy-rdoq=0.00:no-rd-refine=1:no-lossless=1:cbqpoffs=0:crqpoffs=0:qcomp=0.60:qpstep=4:ipratio=1.40:pbratio=1.30:cutree=1:no-strict-cbr=1:qg-size=32:no-rc-grain=1:qpmax=69:qpmin=0:no-const-vbv=1:sar=1:videoformat=5:range=0:colorprim=2:transfer=2:colormatrix=2:chromaloc=0:no-cll=1:min-luma=0:max-luma=1023:log2-max-poc-lsb=8:vui-timing-info=1:vui-hrd-info=1:slices=1:no-opt-qp-pps=1:no-opt-ref-list-length-pps=1:no-multi-pass-opt-rps=1:scenecut-bias=0.05:hist-threshold=0.03:no-opt-cu-delta-qp=1:no-aq-motion=1:no-hdr10=1:no-hdr10-opt=1:no-dhdr10-opt=1:no-idr-recovery-sei=1:analysis-reuse-level=0:analysis-save-reuse-level=0:analysis-load-reuse-level=0:scale-factor=0:refine-intra=0:refine-inter=0:refine-mv=1:refine-ctu-distortion=0:no-limit-sao=1:ctu-info=0:no-lowpass-dct=1:copy-pic=1:max-ausize-factor=1.0:no-dynamic-refine=1:no-single-sei=1:no-hevc-aq=1:no-field=1:qp-adaptation-range=1.00:no-vbv-live-multi-pass=1
X265_PARAMS=$X265_PARAMS:deblock=0,0:crf=27:aq-mode=1:aq-strength=0

# Create the subtitle file header
>"$ass" cat << EOF
[Script Info]
Title: Frame counter
Original Script: drax
ScriptType: v4.00+
YCbCr Matrix: TV.601
PlayResX: 800
PlayResY: 480

[Aegisub Project Garbage]
Video File: $file

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontname},45,&H00FFFFFF,&H000019FF,&H00000000,&H82000000,-1,0,0,0,100,100,0,0,1,1.66667,1.66667,2,30,30,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
EOF

# And add a dialogue entry for each frame
awk -v "rate=$rate" -v "frames=$frames" \
'BEGIN {
  frame=1/rate
  for (i=0; i <= frames; i++) {
    start = frame * i
	end   = frame + start
	sh = int(start / 3600)
	sm = start / 60 % 60
	ss = int(start % 60 * 100) / 100
	eh = int(end / 3600)
	em = end / 60 % 60
	es = int(end % 60 * 100) / 100
    printf("Dialogue: 0,%1d:%02d:%05.2f,%1d:%02d:%05.2f,Default,,0,0,0,,Frame %d\n", sh, sm, ss, eh, em, es, i);
  }
}' >>"$ass"

# Generate a sequence of numbers; for each of them, generate an image frame and pipe it to stdout;
# then let ffmpeg collect this pipe and encode it to a video on-the-fly
# Note! I'm using a PGM output from ImageMagick because it's faster for b&w images. If colors are used, use ppm instead.
for n in $(seq -f "%0${digits}.0f" 0 $frames); do
  "$magick" -font "$font" -background '#000000' -size 800x480 \
    -fill '#ffffff' -pointsize 72 -gravity center label:"Frame #$n" pgm:-
done | \
"$ffmpeg" -hide_banner -y -framerate "$rate" -i - -s:v 800:480 \
  -metadata:s:v:0 title="Drax" -metadata:s:v:0 language=und \
  -pix_fmt yuv420p10le -c:v libx265 -preset medium -x265-params $X265_PARAMS \
  "$file"

# Because I'm not able to do that in 1-pass with ffmpeg reading on stdin.
if (( mux == 1 )); then
  mv "$file" _"$file"
  "$ffmpeg" -i _"$file" -i "$ass" -c copy -disposition:s:0 default -metadata:s:s:0 title="Counter" -metadata:s:s:0 language=eng "$file"
  rm _"$file"
fi
