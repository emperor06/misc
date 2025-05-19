package com.draxar.gui.bballs;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.EventQueue;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Robot;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.Timer;

/**
 * 
 * Java / Linux bug: FPS is atrocious unless a mouse is moved over the window.
 * Some repaints are skipped, apparently. See:
 * https://stackoverflow.com/questions/27489314/why-java-is-slow-if-i-dont-move-mouse-over-the-window-on-linux
 * https://stackoverflow.com/questions/19480076/java-animation-stutters-when-not-moving-mouse-cursor/19515365#19515365
 * Note: the robot solution completely fucked my keyboard. I had to reboot.
 * @author drax
 *
 */
class TickVersion {

	public static void main(String[] args) {
		new TickVersion();
	}

	public static void sleep(long ms) {
		try {
			Thread.sleep(ms);
		} catch (InterruptedException e) {}
	}
	
	public TickVersion() {
		EventQueue.invokeLater(new Runnable() {
			@Override
			public void run() {
				JFrame frame = new JFrame();
				frame.add(new TestPane());
				frame.pack();
				frame.setLocationRelativeTo(null);
				frame.setVisible(true);
				frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
			}
		});
	}

	public class Ticker {

		public interface Callbck {
			public void tick(Ticker ticker, long ns);
		}

		private Timer timer;
		private Callbck callback;
		private Robot robot;
		        

		public void setCallback(Callbck tick) {
			this.callback = tick;
		}

		public void start() {
			if (timer != null)
				return;
			if (robot == null)
				try { robot = new Robot(); }
				catch (Exception e) {
					e.printStackTrace();
					System.exit(-1);
				}
			timer = new Timer(8, new ActionListener() {
				long last = System.nanoTime();

				@Override
				public void actionPerformed(ActionEvent e) {
					if (callback == null)
						return;
					long now = System.nanoTime();
					callback.tick(Ticker.this, now - last);
					last = now;
					robot.keyPress(62);
				}
			});
			timer.start();
		}

		public void stop() {
			if (timer == null)
				return;
			timer.stop();
			timer = null;
		}

	}

	public class TestPane extends JPanel {
		private static final long serialVersionUID = 1L;
		float posX;
		private Ticker ticker;

		public TestPane() {

			ticker = new Ticker();
			ticker.setCallback(new Ticker.Callbck() {

				@Override
				public void tick(Ticker ticker, long ns) {
					posX += ns/8000000f;
					repaint();
				}
			});

		}

		protected void startAnimtion() {
			ticker.start();
		}

		protected void stopAnimation() {
			ticker.stop();
		}

		@Override
		public Dimension getPreferredSize() {
			return new Dimension(400, 400);
		}

		@Override
		public void addNotify() {
			super.addNotify();
			startAnimtion();
		}

		@Override
		public void removeNotify() {
			super.removeNotify();
			stopAnimation();
		}

		@Override
		public void paintComponent(Graphics g) {
				super.paintComponent(g);
				Graphics2D g2d = (Graphics2D) g;
				g2d.setColor(Color.RED);
				int midY = getHeight() / 2;
				g2d.fillOval((int)(posX + 0.5) % getWidth(), midY - 5, 10, 10);
		}

	}
}