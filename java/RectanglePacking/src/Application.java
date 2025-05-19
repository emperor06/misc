import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import javax.swing.BorderFactory;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.SwingUtilities;

public class Application {
    
    public static void main(String[] args) {
        SwingUtilities.invokeLater(new Runnable() {
            public void run() {
                createAndShowGUI();
            }
        });
    }
    
    private static void createAndShowGUI() {
        System.out.println("Created GUI on EDT? "+
                SwingUtilities.isEventDispatchThread());
        JFrame f = new JFrame("Rectangle Packing");
        f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        f.add(new Grid(6, 8));
        f.setSize(640,640);
        f.setVisible(true);
    }
}

class Grid extends JPanel {

    public static final int CELL_SIZE = 40;
    int width;
    int height;
    boolean[][] free;

    List<Item> items;
    
    public Grid(int w, int h) {
    	this.width = w;
    	this.height = h;
    	this.free = new boolean[w][h];
    	this.items = new ArrayList<>();

    	for (int i = 0; i < w; i++)
    		for (int j = 0; j < h; j++)
    			this.free[i][j] = true;
    	
        setBorder(BorderFactory.createLineBorder(Color.black));

        addMouseListener(new MouseAdapter(){
            public void mousePressed(MouseEvent e){
            	pack();
                addItem();
            }
        });

        addMouseMotionListener(new MouseAdapter(){
            public void mouseDragged(MouseEvent e){
            }
        });
    }

    public void addItem() {
    	int maxLength = Math.max(width/2, height/2);
    	int w = ThreadLocalRandom.current().nextInt(1, maxLength);
    	int h = ThreadLocalRandom.current().nextInt(1, maxLength);
    	Item item = new Item(w, h);
    	
    	out: {
	    	for (int i = 0; i < width; i++) {
	    		for (int j = 0; j < height; j++) {
	    			item.x = i; item.y = j;
	    			if (insert(item)) break out;
	    			else {
	    				item.r = !item.r;
	    				if (insert(item)) break out;
	    			}
	    		}
	    	}
	    	System.out.println("Can't fit item (" + w + ", " + h + ")");
	    	return; // does not fit
    	}
    	
    	items.add(item);
    	repaint();
    }
    
    private void pack() {
    	items.sort(new Comparator<Item>() {

			@Override
			public int compare(Item a, Item b) {
				int max = Math.max(a.h, a.w) - Math.max(b.h, b.w);
				if (max != 0) return max;
				return Math.min(a.h, a.w) - Math.min(b.h, b.w);
			}
		});
    	
    	
    }
    
    private boolean insert(Item item) {
    	int w = item.r ? item.h : item.w;
    	int h = item.r ? item.w : item.h;
    	
    	if (item.x + w > width || item.y + h > height) {
    		return false;
    	}
    	
    	for (int i = item.x; i < item.x + w; i++)
    		for (int j = item.y; j < item.y + h; j++)
    			if (!free[i][j]) return false;
    	
    	for (int i = item.x; i < item.x + w; i++)
    		for (int j = item.y; j < item.y + h; j++)
    			free[i][j] = false;
    	
    	return true;
    }

    public Dimension getPreferredSize() {
        return new Dimension(width * Grid.CELL_SIZE, height * Grid.CELL_SIZE);
    }
    
    public void paintComponent(Graphics g) {
        super.paintComponent(g);
        paintGrid(g);
        //g.drawString("This is my custom Panel!",10,20);
        for (Item item : items) {
        	item.paint(g);
        }
        
    }
    
    private void paintGrid(Graphics g) {
    	g.setColor(Color.GRAY);
    	for (int i = 0; i <= width; i++) {
    		g.drawLine(i * Grid.CELL_SIZE, 0, i * Grid.CELL_SIZE, height * Grid.CELL_SIZE);
    	}
    	
    	for (int i = 0; i <= height; i++) {
    		g.drawLine(0, i * Grid.CELL_SIZE, width * Grid.CELL_SIZE, i * Grid.CELL_SIZE);
    	}
    }
}

class Item {

    public int x;
    public int y;
    public boolean r;
    public final int w;
    public final int h;

    public Item(int w, int h) {
    	this.w = w;
    	this.h = h;
    	r = false;
    }

    public void paint(Graphics g){
    	int w = r ? this.h : this.w;
    	int h = r ? this.w : this.h;
    	
        g.setColor(Color.RED);
        g.fillRect(x * Grid.CELL_SIZE, y * Grid.CELL_SIZE, w * Grid.CELL_SIZE, h * Grid.CELL_SIZE);
        g.setColor(Color.BLACK);
        g.drawRect(x * Grid.CELL_SIZE, y * Grid.CELL_SIZE, w * Grid.CELL_SIZE, h * Grid.CELL_SIZE);
        
        g.setColor(Color.PINK);
    	for (int i = 1; i < w; i++) {
    		g.drawLine((i + x) * Grid.CELL_SIZE, 0, (i + x) * Grid.CELL_SIZE, (h + y) * Grid.CELL_SIZE);
    	}
    	
    	for (int i = 1; i < h; i++) {
    		g.drawLine(0, (i + y) * Grid.CELL_SIZE, (w + x) * Grid.CELL_SIZE, (i + y) * Grid.CELL_SIZE);
    	}
    }
}