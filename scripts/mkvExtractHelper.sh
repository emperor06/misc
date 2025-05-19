#!/usr/bin/env bash
#
# Extract all tracks/attachments/chapters from an mkv file.

# depends
type -p mkvmerge.exe &>/dev/null || exit 3
type -p mkvextract.exe &>/dev/null || exit 3

# trap SIGINT
trap 'trap - INT; kill -s INT "$$"' INT

get_ext() {
    # get_ext <mime>
    # TODO: actually make it useful
    case $1 in
        MPEG-4p10/AVC/h.264) echo mp4;;
        FLAC) echo flac;;
        SubStationAlpha) echo ass;;
    esac
}

tracks() {
    # tracks <src-file> <track>
    grep "$2" ${info} | while read line; do
        id=$(echo ${line} | egrep -o '[0-9]*' | head -1)
        ext=$(get_ext "$(echo ${line} | egrep -o '\((.*?)\)' | tr -d '()')")
        mkvextract.exe tracks "$1" ${id}:"${dest}/track_${id}.${ext}"
    done
}

attachments() {
    # attachments <src-file>
    grep Attachment ${info} | while read line; do
        id=$(echo ${line} | egrep -o '[0-9]*' | head -1)
        name=$(echo ${line} | awk -F, '{ print $NF }' | egrep -o "'.*?'" | tr -d \' | sed -r "s/([^.]*)$/\L\1/")
        mkvextract.exe attachments "$1" ${id}:"${dest}/${name}"
    done
}

chapters() {
    # chapters <src-file>
    mkvextract.exe chapters "$1" > "${dest}/chapters.xml"
}

file() {
    destd="$(dirname "$1")"
	destf="$(basename "$1")"
    dest="${destd}/.${destf%.*}" #"${1/.mkv/}"
    mkdir -p "${dest}"
    mkvmerge.exe -i "$1" > ${info}
    while getopts ":adstc" opt ${@:2}; do
        case ${opt} in
            a) tracks "$1" "audio" ;;
            d) tracks "$1" "video" ;;
            s) tracks "$1" "subtitles" ;;
            t) attachments "$1" ;;
            c) chapters "$1" ;;
        esac
    done
}

usage() {
    cat <<EOF
$(basename $0) <mode> <source> [options]

 Usage:
$(basename $0) --file/-f <inname>   extract from <inname> file
$(basename $0) --dir/-d <inname>    extract from all files in <inname>
$(basename $0) --all                same thing as doing --dir .

 Extract options:
  -a    audio
  -v    video
  -s    subtitles
  -t    attachments
  -c    chapters

 Example:
# extract all subs/attachments/chapters in ./file/ for all files in folder
$(basename $0) --all -stc
EOF
}

main() {
    info=$(mktemp)
    case $1 in
        --file|-f) file "$2" "${@:3}" ;;
        --dir|-d)
            find "$2" -type f \( -name '*.mkv' -or -name '*.mks' \) | while read f; do
              file "$f" "${@:3}"
            done ;;
        --all) main --dir . "${@:2}" ;;
        *) usage ;;
    esac
    rm ${info}
}

main "$@"
