#!/bin/bash
# By Drax, Cleanse a mkv from unused fonts.
# Note: only handles Substation Alpha subtitles (.ass)
# Requires a few helpers (see just below).
# Update: take care of fonts that start with an @ (e.g. @Iwata-blabla)
# --Todo--: replace getFontFamily.exe with Fontes.class as it gives both the font family and the font name, in all locales.
# Update: now using Fontes.class to get all font names. Note! Requires having java.exe in the PATH and Fontes.class in CLASSPATH. Note! Fontes.class is pretty slow.
# Todo: replace that java prog with a native one.
# Update: now using Fontname.py (which uses fonttools internaly). Requires Linux's Python with fonttools (can't seem to call the script with python.exe in a decent way)
# Update: replaced Fontname.py with Fontname.exe. The python version was returning some empty lines which crash the script.
# Update: replaced fdupes with jdupes.exe
# Update: mkvFontClean now support mks subtitle files (update mkvExtractHelper.sh as well!)
# Update: if the fontname ends with space or dot, a dollar sign is added at the end (prevents Win32 from failing on those filenames in font store).
##

## Check dependencies
type -p mkvExtractHelper.sh &>/dev/null || exit 3
type -p mkvmerge.exe &>/dev/null || exit 3
type -p mkvextract.exe &>/dev/null || exit 3
#type -p getFontFamily.exe &>/dev/null || exit 3
type -p Fontname.py &>/dev/null || exit 3
type -p jdupes.exe &>/dev/null || exit 3

## Usage
usage() {
	cat <<EOF
MKV Font Clean v0.94
Removes unused fonts from mkv containers.

 Usage:
  $(basename $0) [-brd] [-R|-C] [-a <directory>] <file>
  $(basename $0) [-h]

 Options:
  -R		remux: create a fresh mkv with used fonts.
  -C		check: tells about missing fonts.
  -b		backup fonts to storage (see code).
  -r		recursive, not yet implemented.
  -d		delete all generated files except for backups.
  -a <dir>	add directory where additional fonts are located.
  -h		help: what you are reading.

 Mandatory:
  file		The mkv file (or directory for recurse)

 Note:
  Options -R and -C are mutually exclusive.

 Thoughts:
  This script purges mkv files of unused fonts, creating a fresh copy.
  It also helps extracting fonts and subtitles, find out which fonts are missing
  and which style directive are faulty. Also, since all fonts are extracted,
  it enables storing them in a storage folder (specified in the code within
  the variable FONTSTORE).

  There are many ways cleansing mkv files can be done: whitelist, blacklist …
  This script uses a whitelist approach: it scans all .ass files for fonts
  actually used, then isolate those fonts and remux a new mkv with just those.

  As a result, it also strips the mkv from any other attachments, such as xml or
  jpeg (for example, cover.jpg). Be warned.

  A feature (being implemented as I write this note) is to use the font store to
  add missing fonts automatically, but this requires a clean font store (one
  version per font face).

  So here how it works:
  first, .ass, .ttf, and .otf are dumped into a temporary directory (the name of
  the mkv file starting with a dot and missing the mkv extension, on the same
  directory level as the mkv itself). Duplicates are removed. At this stage, all
  fonts and subtitles are accessible until they get cleaned (see below).

  If -b is specified and FONTSTORE contains a valid directory, fonts are added
  to the store in a subdir corresponding to the font family name, with a
  filename corresponding to its SHA1 hash. This avoids duplicates.

  If C or R, "fonts" subdir is added and will contain a copy of the actual fonts
  used by the mkv. Also, the script will issue errors and warnings if a missing
  font is detected.

  If remux is activated (with -R), the original mkv is moved into a backup dir
  (./bak/) and a new copy is remuxed with the correct fonts in place of the
  original: so after a remux, <file> is the remuxed version while ./bak/<file>
  is the original.

  Finally, if cleaning is required (-d), the temporary directory is destroyed.

  Note: good fonts are currently copied into fonts/ rather than hardlinked.
  This is because, while Windows' NTFS supports hardlink, ReFS doesn't. Shame.

  TODO:
   * support for recursive operation (feed a directory of mkv instead of a
  single file).
   * automatically get missing fonts from FONTSTORE if available.

 Example:
  Dump all fonts and subtitles, saving fonts to store
  \$ $(basename $0) -b file.mkv

  Find out if a mkv is missing fonts,
  \$ $(basename $0) -C file.mkv

  Fix a mkv after a few languages have been removed,
  \$ $(basename $0) -Rd file.mkv

  Do it all: extract everything, backup fonts, fix the mkv, then clean
  \$ $(basename $0) -Rbc file.mkv

EOF
	exit 0
}

## Handle command line options
OPTS_REMUX=0
OPTS_CHECK=0
OPTS_BAKUP=0
OPTS_RECUR=0
OPTS_DELET=0
OPTS_EXTRA=

## Print yellow logs to stdout, and red warnings and errors to stderr
log(){ echo $'\e[1;33m'$@$'\e[0m'; }
warn(){ >&2 echo $'\e[31m'$@$'\e[m'; echo $@ >>"${FNTDIR}/missing.log"; }
error(){ >&2 echo $@; exit 1; }

options=':RCbrda:h'
while getopts $options option; do
    case "$option" in
		R  ) ((OPTS_CHECK)) && error "Options -R and -C are mutually exclusive."; OPTS_REMUX=1;;
		C  ) ((OPTS_REMUX)) && error "Options -R and -C are mutually exclusive."; OPTS_CHECK=1;;
        b  ) OPTS_BAKUP=1;;
		r  ) OPTS_RECUR=1;;
		d  ) OPTS_DELET=1;;
		a  ) OPTS_EXTRA="$OPTARG";;
		h  ) usage; exit 0;;
        \? ) error "Unknown option: -$OPTARG";;
        :  ) error "Missing option argument for -$OPTARG";;
        *  ) error "Unimplemented option: -$OPTARG";;
    esac
done
shift $((OPTIND - 1))

## Check mandatory argument
(($# == 0)) && usage
(($# != 1)) && error "Error: too many arguments. Use -h for help."
[[ ! -f $1 || ! $1 =~ .mk[vs]$ ]] && error "Error: file does not exist or is not a mkv/mks file. Use -h for help."
[[ -n $OPTS_EXTRA ]] && [[ ! -d $OPTS_EXTRA ]] && error "Error: -a requires a valid directory. Use -h for help."

## Variables
FONTSTORE="/mnt/g/Files/Fonts/Extracted/"
OLDPWD="$PWD"
MKVFILE="$1"
DIR="$(dirname "${MKVFILE}")"
MKV="$(basename "${MKVFILE}")"
FNTDIR="${DIR}/.${MKV%.*}"
NEWFNTDIR="${FNTDIR}/fonts"
MKVBAK="${DIR}/bak/${MKV}"
declare -A FONTS

# For remux, if backup file exists, then error, else create output dir
if (( OPTS_REMUX == 1 )); then
	[[ -e "$MKVBAK" ]] && error "Error: backup file '${MKVBAK}' already exists. Aborting."
	mkdir -p "${DIR}/bak/"
fi

# For backup, check if storage is ok
if (( OPTS_BAKUP )) && [[ ! -d "$FONTSTORE" ]]; then
	error "Error: fontstore invalid '${FONTSTORE}'"
fi

## Add all font files for that given font family.
## @return false if font file is missing
addFontFiles() { # (fontname)
	files=${FONTS["${1^^}"]}
	[[ -z "$files" ]] && return 1 # font is missing
	OLDIFS=$IFS ; IFS=':'
	read -ra arfile <<< "$files"
	for FILE in "${arfile[@]}"; do
		# ln "$FILE" "${NEWFNTDIR}/" 2>/dev/null ## hard link not supported on ReFS!
		[[ -n $FILE ]] && cp -n "${FILE}" "${NEWFNTDIR}/"
	done
	IFS=$OLDIFS
	return 0
}

## Extract fonts and subtitles
extract() {
	log "Extracting fonts and subtitles …"
	mkvExtractHelper.sh -f "$MKVFILE" -st 1>/dev/null
	# best to copy the extra fonts now, so they get deduped
	if [[ -n $OPTS_EXTRA ]]; then
		cp -n "$OPTS_EXTRA"/* "$FNTDIR"/
	fi
}

## Remove duplicate font files
dedupe() {
	log "Removing duplicate fonts …"
	jdupes.exe -dN "$FNTDIR"
}

## Store font to storage
storeFont() { # (fontname, fontfile)
	fntname="$1" ; fntfile="$2"
	# Fix stupid Win32 not supporting files ending with dot or space
	pat="[\. ]$"
	if [[ $fntname =~ $pat ]]; then fntname="${fntname}$"; fi
	mkdir -p "${FONTSTORE}/${fntname}"
	shaname="$(shasum -a1 "$fntfile" | sed -r 's/^([a-z0-9]*).*\.(...)$/\1.\2/')"
	if [[ ! -e "${FONTSTORE}/${fntname}/$shaname" ]]; then # because cp -n always return true
		cp "$fntfile" "${FONTSTORE}/${fntname}/$shaname" \
		&& echo "Added new font to the store: ${fntname}" \
		|| echo "Storing '${fntname}' failed: couldn't copy file '${fntfile}'"
	fi
}

## Construct the pseudo dictionary of <FontFamily, [FontFile]>
generateCache() {
	log "Generating font cache …"
	for FNTPATH in "${FNTDIR}"/*.{otf,tt{f,c}}; do
		[[ ! -f $FNTPATH ]] && continue;
		# This one is the english family name, used for storing the font
		#FNTNAME="$(getFontFamily.exe "$FNTPATH")"
		# Now let's get all possible names for that font (family, typeface, locale)
		declare -a allnames
		mapfile -t allnames < <( Fontname.exe "${FNTPATH}" )
		for name in "${allnames[@]}"; do
			FONTS["${name^^}"]+=":${FNTPATH}"
		done
		## Backup fonts to storage
		((OPTS_BAKUP)) && storeFont "${allnames[0]}" "$FNTPATH"
	done
}

## Process the subtitles to look for missing fonts and whitelist useful ones.
processSubtitles() {
	mkdir -p "${NEWFNTDIR}"

	## Loop through subtitles to get all styles
	for ASS in "${FNTDIR}"/*.ass; do
		[[ ! -f $ASS ]] && continue
		log "Processing $(basename "$ASS")"
		dos2unix "$ASS" 2>/dev/null

		## Extract all styles used in actual dialogues and make them unique
		grep '^Dialogue: ' "$ASS" | cut -d "," -f 4 | sort -u | while read -r sty
		do	## For each unique style, get the fontname from the header, find the actual font, and save it
			font=$(grep -oP "^Style: ${sty},@?\K[^,]+" "$ASS")
			if [[ $? != 0 ]]; then
				warn "Warning: file $(basename "$ASS") is missing style declaration for '${sty}'."
				continue
			fi

			## Get the actual font files for that font family
			if ! addFontFiles "$font" ; then
				warn "Warning: missing font file for '${font}' (style '${sty}')";
			fi
		done
	done

	## Extract additional fonts found in \fn directives instead of styles
	cat "${FNTDIR}"/*.ass | sed -rn 's/^.*\\fn@?([^\\}]+)[\\}].*$/\1/p' | sort -u | while read -r font
	do
		if ! addFontFiles "$font" ; then
			warn "Warning: missing font file for '${font}' (inline)";
		fi
	done
}

remux() {
	log "Remuxing mkv …"
	mv "$MKVFILE" "$MKVBAK"
	declare -a cmd_opts
	shopt -s lastpipe

	find "$NEWFNTDIR" -type f \( -iname "*.ttf" -o -iname "*.ttc" \) -print0 | while IFS= read -r -d $'\0' line; do
		cmd_opts+=( --attachment-mime-type application/x-truetype-font)
		cmd_opts+=( --attach-file "$line" )
	done

	find "$NEWFNTDIR" -type f -iname "*.otf" -print0 | while IFS= read -r -d $'\0' line; do
		cmd_opts+=( --attachment-mime-type application/vnd.ms-opentype )
		cmd_opts+=( --attach-file "$line")
	done

	mkvmerge.exe -o "${MKVFILE}" "${cmd_opts[@]}" -M "$MKVBAK"
	echo "The backup of the original mkv is ${MKVBAK}"
}

processMkv() {
	log "Processing: ${MKVFILE}"

	## Extract subtitles and fonts, remove duplicates
	extract && dedupe

	## Generate font cache
	if ((OPTS_BAKUP || OPTS_CHECK || OPTS_REMUX)); then
		generateCache
	fi

	## Get fonts from subtitle files
	if ((OPTS_CHECK || OPTS_REMUX)); then
		processSubtitles
	fi

	## Remake the mkv with purged attachments
	if ((OPTS_REMUX)); then
		remux
	fi

	## Cleaning
	if ((OPTS_DELET)); then
		rm -rf "$FNTDIR"
	fi
}

processMkv

echo
log "Done."
