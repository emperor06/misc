package com.draxar.gui.bballs;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.EventQueue;
import java.awt.Graphics;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.List;

import javax.swing.JFrame;
import javax.swing.JPanel;

/**
 * A simple bouncing balls simulation.
 * The collisions are all elastic: there is no loss of energy, no friction.
 * Energy and momentum is conserved, as per Newton's Laws.
 *
 * Usage:
 *  - click to spawn a ball of size 30
 *  - click and drag to spawn a ball with an initial speed
 *  - use right-click to randomize the size of the ball
 *  - press G to enable gravity
 *  - press C to clear
 *  - press Escape (or close the window) to exit
 *
 * @author drax
 */
@SuppressWarnings("serial")
public class BouncingBalls extends JPanel {
	public static final int DIMX = 800;
	public static final int DIMY = 600;
	public static final long TICK_DURATION_MS = 17; // The wanted tick duration is ns (resolution, the smaller, the more precise the simulation is)
	public static final float GRAVITY = 980; // in pixels/s²
	private Vec mouseStart = null; // for drag'n'drop
	private boolean gravity = false;

	// Speed is in pixels/sec
	private List<Ball> balls = new ArrayList<>() {{
		//add(new Ball(20, new Vec(300, 200), new Vec(250, -100)));
		//add(new Ball(60, new Vec(100, 300), new Vec(100, 350)));
		//add(new Ball(40, new Vec(500, 100), new Vec(-150, -50)));
		//add(new Ball(30, new Vec(100, 200), new Vec(200, 0)));
		//add(new Ball(30, new Vec(500, 200), new Vec(-200, 0)));
		//add(new Ball( 6, new Vec(200, 6), new Vec(0, 200)));
		//add(new Ball(50, new Vec(200, 56), new Vec(0, 200)));

		// boulier
		//add(new Ball(20, new Vec(700, 300), new Vec()));
		//add(new Ball(20, new Vec(660, 300), new Vec()));
		//add(new Ball(20, new Vec(620, 300), new Vec()));
		//add(new Ball(20, new Vec(580, 300), new Vec()));
		//add(new Ball(20, new Vec(540, 300), new Vec()));
		//add(new Ball(20, new Vec(500, 300), new Vec()));
		//add(new Ball(20, new Vec(200, 300), new Vec(300, 0)));

		// Billiard (x increases by a factor of r*sqrt(3)
		add(new Ball(20, new Vec(500, 300), new Vec()));
		add(new Ball(20, new Vec(534.64101615f, 320), new Vec()));
		add(new Ball(20, new Vec(534.64101615f, 280), new Vec()));
		add(new Ball(20, new Vec(569.2820323f, 300), new Vec()));
		add(new Ball(20, new Vec(569.2820323f, 340), new Vec()));
		add(new Ball(20, new Vec(569.2820323f, 260), new Vec()));
		add(new Ball(20, new Vec(100, 300), new Vec(300, 0)));
	}};

	public BouncingBalls() {
		setPreferredSize(new Dimension(DIMX, DIMY));
		setBackground(Color.DARK_GRAY);
		setFocusable(true); // for key events

		// Click to add random balls. Click+drag to give it an initial velocity. Right click for random size.
		addMouseListener(new MouseAdapter() {
			@Override
			public void mousePressed(MouseEvent e) {
				super.mousePressed(e);
				mouseStart = new Vec(e.getPoint());
			}

			@Override
			public void mouseReleased(MouseEvent e) {
				super.mouseReleased(e);
				if (mouseStart != null) {
					Vec end = new Vec(e.getPoint());
					Vec dir = end.sub(mouseStart);
					float speed = dir.norm();
					if (speed > 800)
						dir.mut_mul(800f / speed);
					float r = e.getButton() == MouseEvent.BUTTON1 ? 30 : 10 + (float)Math.random() * 40;
					balls.add(new Ball(r, mouseStart, dir));
				}
			}
		});

		addKeyListener(new KeyAdapter() {
			@Override
			public void keyPressed(KeyEvent e) {
				super.keyTyped(e);
				switch (e.getKeyCode()) {
				case KeyEvent.VK_G:
					gravity = !gravity;
					break;
				case KeyEvent.VK_C:
					balls.clear();
					break;
				case KeyEvent.VK_ESCAPE:
					System.exit(0);
				}
			}
		});
	}

	/**
	 * The physics and location calculation is done in a separate thread
	 */
	private void startTick() {

		new Thread() {
			@Override
			public void run() {
				long last = System.currentTimeMillis() - TICK_DURATION_MS;
				while (true) {
					long now = System.currentTimeMillis();
					long  elapsed = now - last;
					float seconds = (float) (elapsed * 1E-3);
					last = now;
					updatePhysics(seconds);
					repaint();
					try { Thread.sleep(TICK_DURATION_MS); }
					catch (InterruptedException e) {}
				}
			}
		}.start();
	}

	/**
	 * Simply ask each ball to draw itself.
	 */
	@Override
	protected void paintComponent(Graphics g) {
		super.paintComponent(g);
		g.setColor(Color.LIGHT_GRAY);
		for (Ball b : balls)
			b.draw(g);
	}

	/**
	 * When a ball reaches a screen border, flip its direction.
	 */
	private void checkBorder() {
		for (Ball b : balls) {
			if (b.pos.x + b.radius > getWidth() && b.spd.x > 0 || b.pos.x - b.radius < 0 && b.spd.x < 0)
				b.spd.x *= -1;
			if (b.pos.y + b.radius > getHeight() && b.spd.y > 0 || b.pos.y - b.radius < 0 && b.spd.y < 0)
				b.spd.y *= -1;
		}
	}

	/**
	 * Some math describing how balls move.
	 * For now, handle only the collision of 2 balls.
	 * If 3 balls collide at the same time, this needs to be updated.
	 */
	public void updatePhysics(float seconds) {
		// Consider every ball couples
		for (int i = 0; i < balls.size(); i++)
			for (int j = i + 1; j < balls.size(); j++) {
				Ball b1 = balls.get(i);
				Ball b2 = balls.get(j);
				// If they overlap, change their speed
				if (b1.collidesWith(b2) && !b1.movingAwayFrom(b2)) {
					Vec nv1 = b1.collision(b2);
					Vec nv2 = b2.collision(b1);
					b1.spd.set(nv1);
					b2.spd.set(nv2);
				}
			}

		// Handle gravity
		if (gravity)
			for (Ball b : balls)
				if (b.pos.y + b.radius <= getHeight())
					b.spd.mut_add(new Vec(0, GRAVITY * seconds));

		// Also, make sure they don't go off-screen
		checkBorder();

		// And finally, apply the movement. Here, the tick duration should be taken into account.
		for (Ball b : balls) {
			b.pos.mut_add(b.spd.mul(seconds));
		}
	}

	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			@Override
			public void run() {
				BouncingBalls bb = new BouncingBalls();
				JFrame frame = new JFrame("Bouncing Balls");
				frame.add(bb);
				frame.pack();
				frame.setLocationRelativeTo(null);
				frame.setVisible(true);
				frame.setFocusable(false);
				frame.setResizable(true);
				frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
				bb.startTick();
			}
		});
	}

}