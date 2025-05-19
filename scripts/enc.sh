#!/bin/bash

VERSION="1.6"

#################################### Default options
CRF=22
AQMODE=1
AQSTR=0.60
TRACK=0
FILTER=""
FNAME=""
AFTER=""
BEFORE=""
DEBLOCK="0,0"

#################################### Tools
getTool() {
    (( $# != 1 )) && return 1
    local RES=
    if type -p "$1.exe" &>/dev/null; then
        RES="$1.exe"
    elif type -p "$1" &>/dev/null; then
        RES="$1"
    fi
    [[ -z $RES ]] && return 1
    echo "$RES"
    return 0
}

FFMPEG="$(getTool ffmpeg)"
FFPROBE="$(getTool ffprobe)"

#################################### Usage
usage () {
    echo "Usage: $0 [options] filename.mkv"
    echo
    echo "  -u str          Unsharp strength (default, no filter)."
    echo "  -a params       Ffmpeg additional parameters that should go after the input."
    echo "  -b params       Ffmpeg additional parameters that should go before the input."
    echo "  -d params       Add deblock (params, params). Default is (0,0)."
    echo "  -c crf          crf (default 22)."
    echo "  -m mode         aq-mode (default 1)."
    echo "  -s strength     aq-strength (default 1.0)."
    echo "  -t tnum         Video track number to encode (default 0)."
    echo "  -o outname      Output filename (default, same as input)."
}

#################################### GetOpts options
options=':d:u:c:t:o:a:b:m:s:hv'
while getopts $options option
do
    case "$option" in
        c  ) CRF=$OPTARG;;
        t  ) TRACK=$OPTARG;;
        u  ) FILTER="unsharp=5:5:${OPTARG}:5:5:0";;
        a  ) AFTER="$OPTARG";;
        b  ) BEFORE="$OPTARG";;
        m  ) AQMODE="$OPTARG";;
        s  ) AQSTR="$OPTARG";;
        o  ) FNAME="$OPTARG";;
        d  ) DEBLOCK="${OPTARG},${OPTARG}";;
        h  ) echo "enc ${VERSION} by Drax"; echo; usage; exit 0;;
        v  ) echo "enc ${VERSION} by Drax"; exit 0;;
        \? ) echo "Unknown option: -$OPTARG" >&2; exit 1;;
        :  ) echo "Missing option argument for -$OPTARG" >&2; exit 1;;
        *  ) echo "Unimplemented option: -$OPTARG" >&2; exit 1;;
    esac
done
shift $((OPTIND - 1))

#################################### Checks
if (($# != 1)); then
    echo "Error: $0 takes exactly 1 argument"
    echo
    usage
    exit 2
fi

SRC="$1"
if [ ! -f "${SRC}" ]; then
    echo "Error: file ${SRC} does not exist or is not a file"
    exit 3
fi


#################################### Fix unsharp on 10bit input
if [[ -n "$FILTER" ]]; then
    "$FFPROBE" "$SRC" 2>&1 | grep -q yuv420p10
    if (( $? == 0 )); then
        echo "10 bit source detected, switching input to 8 bit for unsharp filter"
        FILTER="-vf format=yuv420p,${FILTER}"
    else
        FILTER="-vf ${FILTER}"
    fi
fi

#################################### Prepare output
if [ -z "$FNAME" ]; then
	FDIR=$(dirname "$SRC")
    FNAME="$(basename "$SRC")"
    FNAME="${FNAME%.*}.mkv"
	DST="${FDIR}/output/${FNAME}"
	mkdir -p "${FDIR}/output"
else
	DST="${FNAME}"
fi

#################################### Encoder settings
X265_PARAMS=wpp=1:no-pmode=1:no-pme=1:no-psnr=1:no-ssim=1:interlace=0:total-frames=0:level-idc=0:high-tier=1:uhd-bd=0:ref=3:no-allow-non-conformance=1:no-repeat-headers=1:annexb=1:no-aud=1:no-eob=1:no-eos=1:no-hrd=1:info=1:hash=0:temporal-layers=0:open-gop=1:min-keyint=24:keyint=240:gop-lookahead=0:bframes=4:b-adapt=2:b-pyramid=1:bframe-bias=0:rc-lookahead=20:lookahead-slices=6:scenecut=40:hist-scenecut=0:radl=0:no-intra-refresh=1:ctu=64:min-cu-size=8:no-rect=1:no-amp=1:max-tu-size=32:tu-inter-depth=1:tu-intra-depth=1:limit-tu=0:rdoq-level=0:dynamic-rd=0.00:no-ssim-rd=1:signhide=1:no-tskip=1:nr-intra=0:nr-inter=0:no-constrained-intra=1:no-strong-intra-smoothing=1:max-merge=2:limit-refs=3:no-limit-modes=1:me=1:subme=2:merange=57:temporal-mvp=1:no-frame-dup=1:no-hme=1:weightp=1:no-weightb=1:no-analyze-src-pics=1:sao=1:no-sao-non-deblock=1:rd=3:selective-sao=4:no-early-skip=1:rskip=1:no-fast-intra=1:no-tskip-fast=1:no-cu-lossless=1:b-intra=1:no-splitrd-skip=1:rdpenalty=0:psy-rd=0.00:psy-rdoq=0.00:no-rd-refine=1:no-lossless=1:cbqpoffs=0:crqpoffs=0:qcomp=0.60:qpstep=4:ipratio=1.40:pbratio=1.30:cutree=1:no-strict-cbr=1:qg-size=32:no-rc-grain=1:qpmax=69:qpmin=0:no-const-vbv=1:sar=1:videoformat=5:range=0:colorprim=2:transfer=2:colormatrix=2:chromaloc=0:no-cll=1:min-luma=0:max-luma=1023:log2-max-poc-lsb=8:vui-timing-info=1:vui-hrd-info=1:slices=1:no-opt-qp-pps=1:no-opt-ref-list-length-pps=1:no-multi-pass-opt-rps=1:scenecut-bias=0.05:hist-threshold=0.03:no-opt-cu-delta-qp=1:no-aq-motion=1:no-hdr10=1:no-hdr10-opt=1:no-dhdr10-opt=1:no-idr-recovery-sei=1:analysis-reuse-level=0:analysis-save-reuse-level=0:analysis-load-reuse-level=0:scale-factor=0:refine-intra=0:refine-inter=0:refine-mv=1:refine-ctu-distortion=0:no-limit-sao=1:ctu-info=0:no-lowpass-dct=1:copy-pic=1:max-ausize-factor=1.0:no-dynamic-refine=1:no-single-sei=1:no-hevc-aq=1:no-field=1:qp-adaptation-range=1.00:no-vbv-live-multi-pass=1

X265_PARAMS=$X265_PARAMS:deblock=${DEBLOCK}:crf=${CRF}:aq-mode=${AQMODE}:aq-strength=${AQSTR}

#################################### Encode
"$FFMPEG" -hide_banner -y $BEFORE -i "${SRC}" $AFTER -map 0:$TRACK \
    -metadata:s:v:0 title="Drax" -metadata:s:v:0 language=und \
    $FILTER -pix_fmt yuv420p10le -c:v libx265 -preset medium -x265-params $X265_PARAMS \
    "${DST}"


#################################### CHANGELOG
: '
Version 1.1
  - Just like unsharp, the deblock value can now be set.
  - If not given through the -o option, the destination filename is now forced to end with .mkv

Version 1.2
  - The encoder settings are now included in the script so it''s easier to move it around.

Version 1.3
  - Fixed metadata on video track when the input is not track 0

Version 1.4
  - If the output filename is specified with -o, then this name is used (instead of source_dir/output/fname).
    This helps with encoding tests, leaving all test files in the same directory as the source for comparison.

Version 1.5
  - It seems like with newer versions of ffmpeg, some options have changed. Replaced no-temporal-layers=1 with temporal-layers=0
  - Still a problem with hist-threshold option not existing anymore

Version 1.6
  - Added getTool for compatibility between WSL and Linux
'
