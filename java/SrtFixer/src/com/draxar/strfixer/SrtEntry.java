package com.draxar.strfixer;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 *
 * @author drax
 */
public class SrtEntry {
    public static final SimpleDateFormat SDF = new SimpleDateFormat("HH:mm:ss,SSS");
    public static final String EOL = "\r\n"; //System.lineSeparator();
    
    private int id;
    private Date start;
    private Date end;
    private String text;
    
    public int id() {
        return id;
    }
    
    public Date start() {
        return start;
    }
    
    public Date end() {
        return end;
    }
    
    public String text() {
        return text;
    }
    
    public final void setId(int id) throws IllegalArgumentException {
        if (id <= 0) throw new IllegalArgumentException("Invalid id (" + id + ")");
        this.id = id;
    }
    
    public final void setStart(Date start) throws IllegalArgumentException {
        if (start == null) throw new IllegalArgumentException("Invalid start: null");
        if (end != null && end.before(start)) throw new IllegalArgumentException("Invalid start: start cannot be later than end");
        this.start = start;
    }
    
    public final void setEnd(Date end) throws IllegalArgumentException {
        if (end == null) throw new IllegalArgumentException("Invalid end: null");
        if (start != null && end.before(start)) throw new IllegalArgumentException("Invalid end: end cannot be earlier than start");
        this.end = end;
    }
    
    public final void setText(String text) {
        this.text = text == null ? "" : text;
    }
    
    public SrtEntry(int id, Date start, Date end, String text) throws IllegalArgumentException {
        setId(id);
        setStart(start);
        setEnd(end);
        setText(text);
    }
    
    public static Date toDate(String s) throws IllegalArgumentException {
        try {
            return SDF.parse(s);
        } catch (ParseException pe) {
            throw new IllegalArgumentException("Invalid date: " + s);
        }
    }
    
    public String toSrtString() {
        StringBuilder sb = new StringBuilder();
        sb.append(id()).append(EOL);
        sb.append(SDF.format(start())).append(" --> ").append(SDF.format(end())).append(EOL);
        sb.append(text()).append(EOL);
        return sb.toString();
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("id   : ").append(id()).append(EOL);
        sb.append("start: ").append(SDF.format(start())).append(EOL);
        sb.append("end  : ").append(SDF.format(end())).append(EOL);
        sb.append("text : ");
        boolean first = true;
        for (String t : text().split(EOL)) {
            if (!first) {
                sb.append("       ");
            }
            sb.append(t).append(EOL);
            first = false;
        }
        
        return sb.toString();
    }
}
