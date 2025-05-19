package com.draxar.math;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Point;
import java.awt.RenderingHints;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.util.HashSet;
import java.util.Set;

import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;

public class Bolygone extends JComponent {
	private static final long serialVersionUID = 956732015720876801L;

	public static final double TAU = Math.PI * 2;
	private static final String TABLE_DE = "Table de ";
	private static final String MODULO = " modulo ";
	private JLabel label;
	
	/**
	 * La table de multiplication par n
	 */
	private int n = 2;
	
	/**
	 * Le modulo (nombre de points sur le cercle
	 */
	private int m = 10;
	
	/**
	 * L'ensemble des lignes à tracer
	 */
	private Set<Ligne> lignes = new HashSet<>();
	
	private JFrame frame;
	
	private class Ligne {
		Point a, b;
		
		Ligne(Point a, Point b) {
			this.a = a;
			this.b = b;
		}
		
		@Override
		public int hashCode() {
			return a.hashCode() + b.hashCode();
		}
		
		@Override
		public boolean equals(Object o) {
			if (!(o instanceof Ligne)) return false;
			Ligne l = (Ligne) o;
			return a.equals(l.a) && b.equals(l.b);
		}
	}

	public Bolygone(Dimension d) {
		setPreferredSize(d);
		frame = new JFrame();
		frame.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
		frame.getContentPane().add(this, BorderLayout.CENTER);
		JPanel buttonsPanel = new JPanel();
		label = new JLabel();
		JTextField nField = new JTextField(3);
		JTextField mField = new JTextField(3);
		JButton incNButton = new JButton("+");
		JButton drawButton = new JButton("Draw");
		
		buttonsPanel.add(label);
		buttonsPanel.add(nField);
		buttonsPanel.add(mField);
		buttonsPanel.add(incNButton);
		buttonsPanel.add(drawButton);
		
		nField.addKeyListener(new KeyListener() {
			
			@Override
			public void keyPressed(KeyEvent ke) {

			}

			@Override
			public void keyReleased(KeyEvent ke) {
				if (ke.getKeyCode() == KeyEvent.VK_ENTER) {
					try {
						int parse = Integer.parseInt(nField.getText());
						n = parse >= 0 ? parse : 0;
						construit();
					} catch (Exception exc) {}
				}
			}

			@Override
			public void keyTyped(KeyEvent arg0) {}
		});
		
		mField.addKeyListener(new KeyListener() {
			
			@Override
			public void keyPressed(KeyEvent ke) {

			}

			@Override
			public void keyReleased(KeyEvent ke) {
				if (ke.getKeyCode() == KeyEvent.VK_ENTER) {
					try {
						int parse = Integer.parseInt(mField.getText());
						m = parse >= 0 ? parse : 0;
						construit();
					} catch (Exception exc) {}
				}
			}

			@Override
			public void keyTyped(KeyEvent arg0) {}
		});
		incNButton.addActionListener(new ActionListener() {

	        @Override
	        public void actionPerformed(ActionEvent e) {
	        	m++;
	        	construit();
	        }
	    });
		
		nField.addKeyListener(new KeyListener() {
			
			@Override
			public void keyReleased(KeyEvent ke) {}

			@Override
			public void keyPressed(KeyEvent ke) {
				switch (ke.getKeyCode()) {
				case KeyEvent.VK_UP:
					n++;
					break;

				case KeyEvent.VK_DOWN:
					n--;
					if (n < 0) n = 0;
					break;
					
				case KeyEvent.VK_RIGHT:
					m++;
					break;
					
				case KeyEvent.VK_LEFT:
					m--;
					if (m < 0) m = 0;
					break;
					
				default:
					break;
				}
				construit();
			}

			@Override
			public void keyTyped(KeyEvent arg0) {}
		});
		
		frame.getContentPane().add(buttonsPanel, BorderLayout.SOUTH);
		construit();
	}
	
	public void display() {
		frame.pack();
		frame.setVisible(true);
	}
	
	public void construit() {
		int cx = getWidth() / 2;
		int cy = getHeight() / 2;
		if (cx == 0 || cy == 0) {
			cx = (int) getPreferredSize().getWidth() / 2;
			cy = (int) getPreferredSize().getHeight() / 2;
		}
		double r = Math.min(cx, cy) * 0.95;

		Point[] p = new Point[m];
		for (int i = 0; i < m; i++) {
			p[i] = new Point();
			p[i].x = cx + (int) (r * Math.sin(TAU * i / m) + 0.5);
			p[i].y = cy - (int) (r * Math.cos(TAU * i / m) + 0.5);
		}
		lignes.clear();
		for (int i = 0; i < m; i++) {
			int mul = (i * n) % m;
			lignes.add(new Ligne(p[i], p[mul]));
		}
		label.setText(TABLE_DE + n + MODULO + m);
		repaint();
	}
	
	@Override
	protected void paintComponent(Graphics g) {
	    super.paintComponent(g);
	    Graphics2D g2 = (Graphics2D)  g;
	    g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
	    for (Ligne ligne : lignes) {
	        g2.setColor(Color.BLACK);
	        g2.drawLine(ligne.a.x, ligne.a.y, ligne.b.x, ligne.b.y);
	    }
	}
	
	public static void main(String[] args) {
		
		final Bolygone bol = new Bolygone(new Dimension(500, 500));
		bol.display();
	}

}
