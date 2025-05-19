package com.draxar.strfixer;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;

/**
 *
 * @author drax
 */
public class SrtParser {

    public static final char BOM = '\uFEFF';

    private final File file;
    private final List<SrtEntry> entries = new LinkedList<>();

    public SrtParser(String path) {
        file = new File(path);
    }

    private static enum Mode {
        NEW, ID, TIME, TEXT
    }

    private void error(int line, String msg) throws Exception {
        StringBuilder sb = new StringBuilder();
        sb.append("File ");
        sb.append(file.getName());
        sb.append(SrtEntry.EOL);
        sb.append("Parse error at line ");
        sb.append(line);
        sb.append(". ");
        sb.append(msg);
        throw new Exception(sb.toString());
    }

    private void warning(int line, String msg) {
        StringBuilder sb = new StringBuilder();
        sb.append("File ");
        sb.append(file.getName());
        sb.append(SrtEntry.EOL);
        sb.append("Parse warning at line ");
        sb.append(line);
        sb.append(". ");
        sb.append(msg);
        System.out.println(sb.toString());
    }

    public void parse() throws Exception {
        String line, text = null;
        Date start = null, end = null;
        int id = -1;
        Mode mode = Mode.NEW;
        int lineNumber = 0;
        String arrow = " --> ";

        //try (BufferedReader br = new BufferedReader(new FileReader(file))) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8))) {
            boolean firstLine = true;
            while ((line = br.readLine()) != null) {

                // Fix UTF-8 BOM issue
                if (firstLine && !line.isEmpty() && line.charAt(0) == BOM) {
                        line = line.substring(1);
                        firstLine = false;
                }

                lineNumber++;
                line = line.trim();
                if (line.equals("-")) continue;

                switch(mode) {
                    case NEW:
                        if (line.isEmpty()) continue;

                        text = null;
                        try {
                            id = Integer.parseInt(line);
                        } catch (NumberFormatException nfe) {
                            error(lineNumber, "Expecting an id, found this instead: '" + line + "'");
                        }
                        mode = Mode.TIME;
                        break;

                    case TIME:
                        int index = line.indexOf(arrow);
                        if (index == -1) {
                            error(lineNumber, "Expecting timestamp, found this instead: '" + line + "'");
                        }
                        start = SrtEntry.toDate(line.substring(0, index));
                        end   = SrtEntry.toDate(line.substring(index + arrow.length()));
                        mode = Mode.TEXT;
                        break;

                    case TEXT:
                        if (line.isEmpty()) {
                            if (text != null) { // discard empty entries
                                entries.add(new SrtEntry(id, start, end, text));
                            }
                            mode = Mode.NEW;
                        } else {
                            line = line.replaceAll("--", "...");
                            //if (line.substring(1).contains("-")) {
                            //    warning(lineNumber, "Suspicious dangling hyphen in '" + line + "'");
                            //}
                            text = text == null ? line : text + SrtEntry.EOL + line;
                        }
                        break;
                }
            }
            if (mode == Mode.TEXT) { // no blank line at the end of the file
                entries.add(new SrtEntry(id, start, end, text));
            }
        }
    }

    public List<SrtEntry> entries() {
        return entries;
    }

    /**
     * Make sure the ids are consecutive numbers.
     * Should be done last, although the other fixes
     * are not supposed to remove any entry.
     */
    public void fixIds() {
        int n = 1;
        for (SrtEntry entry : entries()) {
            entry.setId(n++);
        }
    }

    /**
     * Remove the useless dialog hyphen when there's only one speaker.
     * Algo:
     * if hyphen + single line -> remove
     * if multiline + single hyphen -> remove
     */
    public void fixHyphens() {
        for (SrtEntry entry : entries()) {
            if (entry.text().startsWith("-")) {
                if (!entry.text().contains(SrtEntry.EOL)) {
                    entry.setText(entry.text().substring(1).trim());
                } else {
                    String[] lines = entry.text().split(SrtEntry.EOL);
                    boolean moreHyphens = false;
                    for (int i = 1; i < lines.length; i++) {
                        if (lines[i].trim().startsWith("-")) {
                            if (!moreHyphens)
                                moreHyphens = true;
                            else
                                throw new RuntimeException("Too many dialogs at id " + entry.id());
                        }
                    }
                    if (!moreHyphens) {
                        entry.setText(entry.text().substring(1).trim());
                    }
                }
            }
        }
    }

    public void fixLength(int maxCharsPerLine) {
        for (SrtEntry entry : entries()) {
            entry.setText(fixText(entry.text(), maxCharsPerLine));
        }
    }

    private static String fixText(String text, int max) {
        String res;
        String[] lines = text.split(SrtEntry.EOL + "-");
        if (lines.length > 2) throw new RuntimeException("Too many hyphens");
        if (lines.length == 2) {
            // dialog, not many options here: 1 speaker per line
            res = lines[0].replaceAll(SrtEntry.EOL, " ");
            res += SrtEntry.EOL;
            res += "- " + lines[1].replaceAll(SrtEntry.EOL, " ").trim();
        } else {
            // No dialog, let's do magic
            text = text.replaceAll(SrtEntry.EOL, " ");
            if (text.length() <= max) {
                res = text;
            } else {
                int mid = text.length() / 2;
                int offset = 0;
                int breakPoint = -1;
                while (offset < mid) {
                    if (text.charAt(mid - offset) == ' ') {
                        breakPoint = mid - offset;
                        break;
                    }
                    if (text.charAt(mid + offset) == ' ') {
                        breakPoint = mid + offset;
                        break;
                    }
                    offset++;
                }
                if (breakPoint == -1) {
                    throw new RuntimeException("Unbreakable text");
                }
                res = text.substring(0, breakPoint) + SrtEntry.EOL + text.substring(breakPoint + 1);
            }
        }
        return res;
    }

    public void fixDurations() {
        Date start, end, tmp;
        for (int i = 1; i < entries().size(); i++) {
            end = entries().get(i - 1).end();
            start = entries().get(i).start();
            tmp = addMillis(end, 10);
            if (tmp.after(start)) {
                tmp = addMillis(start, -10);
                entries().get(i - 1).setEnd(tmp);
            }
        }
    }

    private static Date addMillis(Date date, Integer millis) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        cal.add(Calendar.MILLISECOND, millis);
        return cal.getTime();
    }

    public void save(String path) throws IOException {
        //try (BufferedWriter bw = new BufferedWriter(new FileWriter(path))) {
        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(path), StandardCharsets.UTF_8))) {
            // UTF-8 BOM
            bw.write(BOM);

            for (SrtEntry entry : entries()) {
                bw.write(entry.toSrtString());
                //bw.newLine();
                bw.write(SrtEntry.EOL);
            }
        }
    }
}
