#!/bin/bash

FNTDIR=
OPTRECUR="-maxdepth 1"

## Print yellow logs to stdout, and red warnings and errors to stderr
log(){ echo $'\e[1;33m'$@$'\e[0m'; }
warn(){ >&2 echo $'\e[31m'$@$'\e[m'; }
error(){ >&2 echo $@; exit 1; }

## For WSL, use tool.exe if it exists, otherwise try tool. Else, crash.
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

if ! MKVPROPEDIT=$(getTool mkvpropedit); then
    error "Missing mkvpropedit. Try installing mkvtoolnix"
fi


## Usage
usage() {
    cat <<EOF
MKV Add Fonts
Insert all fonts in a given directory into the given mkvs.
The insertion is in-place: the mkvs will be modified.
Supported fonts: otf, ttf, ttc

 Usage:
  $(basename $0) [-r] <-d fontdir> <mkv files …>
  $(basename $0) [-h]

 Options:
  -d <fontdir>  The directory containing the fonts.
  -r            Recurse font directory
  -h            help: what you are reading.

 Mandatory:
  files         The mkv files
EOF
    exit 0
}


options=':d:rh'
while getopts $options option; do
    case "$option" in
        d  ) FNTDIR="$OPTARG";;
        r  ) OPTRECUR=;;
        h  ) usage;;
        \? ) error "Unknown option: -$OPTARG";;
        :  ) error "Missing option argument for -$OPTARG";;
        *  ) error "Unimplemented option: -$OPTARG";;
    esac
done
shift $((OPTIND - 1))

## Check mandatory argument
(($# == 0)) && usage
[[ ! -d "$FNTDIR" ]] && error "This script requires a valid font directory (-d)"

insertFonts() {
	declare -a cmd_opts
	shopt -s lastpipe

	find "$FNTDIR" $OPTRECUR -type f \( -iname "*.ttf" -o -iname "*.ttc" \) -print0 | while IFS= read -r -d $'\0' line; do
		cmd_opts+=( --attachment-mime-type application/x-truetype-font)
		cmd_opts+=( --add-attachment "$line" )
	done

	find "$FNTDIR" $OPTRECUR -type f -iname "*.otf" -print0 | while IFS= read -r -d $'\0' line; do
		cmd_opts+=( --attachment-mime-type application/vnd.ms-opentype )
		cmd_opts+=( --add-attachment "$line")
	done

	$MKVPROPEDIT "$1" "${cmd_opts[@]}"
}


for f in "$@"; do
    if ! [[ -f "$f" && "$f" =~ .mkv$ ]]; then
        warn "Not a mkv file: ${f}"
        continue
    fi

    insertFonts "$f"
done
