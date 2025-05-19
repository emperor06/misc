package com.draxar.strfixer;

import java.util.List;

/**
 *
 * @author drax
 */
public class SrtFixer {

    public static void main(String[] args) {
        realMain(args);
        //teset();
    }
    
    private static void realMain(String[] args) {
        if (args.length != 1) {
            System.out.println("Usage: java StrFixer <file.srt>");
            System.exit(-1);
        }
        try {
            String file = args[0];
            SrtParser parser = new SrtParser(file);
            parser.parse();
            parser.fixHyphens();
            parser.fixLength(46);
            parser.fixDurations();
            parser.fixIds();
            parser.save(file + "_");
        } catch (Exception e) {
            System.err.println(e);
        }
    }
    
    private static void teset() {
        try {
            SrtParser parser = new SrtParser("teset.srt");
            parser.parse();
            List<SrtEntry> entries = parser.entries();
            /*
            for (SrtEntry entry : entries) {
                System.out.println(entry);
            }
            */
            System.out.println("Total entries: " + entries.size());
            System.out.println("fixing hyphens ...");
            parser.fixHyphens();
            System.out.println("fixing length ...");
            parser.fixLength(46);
            System.out.println("fixing durations ...");
            parser.fixDurations();
            System.out.println("fixing ids ...");
            parser.fixIds();
            System.out.println("saving ...");
            parser.save("teset2.srt");
        } catch (Exception e) {
            System.err.println(e);
        }
    }
}
