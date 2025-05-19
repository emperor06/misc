package com.draxar.bouncing;

import java.util.ArrayList;
import java.util.List;

import javafx.beans.property.BooleanProperty;
import javafx.beans.property.DoubleProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.paint.Color;

/**
 * Handles the simulation, mainly through its step method (tick event)
 * @author drax
 */
public class Simulation {
	public static final float GRAVITY = 980f;
	public static double      fps     = 75;

	private final GraphicsContext gc;
	private final Ticker          ticker;
	private final Ball            ghost;
	private final List<Ball>      balls          = new ArrayList<>();
	private final BooleanProperty isRunning      = new SimpleBooleanProperty();
	private final BooleanProperty gravity        = new SimpleBooleanProperty();
	private final BooleanProperty torus          = new SimpleBooleanProperty();
	private final DoubleProperty  widthProperty  = new SimpleDoubleProperty();
	private final DoubleProperty  heightProperty = new SimpleDoubleProperty();
	private final BooleanProperty ghostProperty  = new SimpleBooleanProperty();

	public Simulation(Canvas canvas) {
		gc = canvas.getGraphicsContext2D();
		widthProperty.bind(canvas.widthProperty());
		heightProperty.bind(canvas.heightProperty());
		ticker = new Ticker(this, fps);
		constraintOnParameters();
		constraintOnResize();
		ghost = new Ball(0, 0, 0, 0, 25, Color.grayRgb(128, 0.5));
	}

	// Accessors
	public  DoubleProperty  widthProperty()       { return widthProperty; }
	public  DoubleProperty  heightProperty()      { return heightProperty; }
	public  BooleanProperty ghostProperty()       { return ghostProperty; }
	public  double          ghostRadius()         { return ghost.r; }
	public  void            ghostRadius(double r) { ghost.r = r; }
	private double          width()               { return widthProperty().get(); }
	private double          height()              { return heightProperty().get(); }

	/**
	 * Gravity and torus mode should never be both enabled otherwise balls will get infinite speed.
	 * Instead of checking their state when changing them, let's put on listener on them,
	 * so that nobody can screw it.
	 */
	private void constraintOnParameters() {
		gravityProperty().addListener((obs, oldValue, newValue) -> {
			if (newValue.booleanValue() && torusProperty().get())
				torusProperty().set(false);
		});
		torusProperty().addListener((obs, oldValue, newValue) -> {
			if (newValue.booleanValue() && gravityProperty().get())
				gravityProperty().set(false);
		});
	}

	/**
	 * When the simulation area changes, move the balls to ensure they are
	 * still within the drawing area. It's a bit useless on torus mode
	 * but it gives a cool effect on box mode.
	 */
	private void constraintOnResize() {
		widthProperty().addListener((obs, oldValue, newValue) -> {
			if (newValue.doubleValue() < oldValue.doubleValue()) {
				for (Ball b : balls) {
					double max = newValue.doubleValue() - b.r;
					if (b.x > max) b.x = max;
				}
			}
		});
		heightProperty.addListener((obs, oldValue, newValue) -> {
			if (newValue.doubleValue() < oldValue.doubleValue()) {
				for (Ball b : balls) {
					double max = newValue.doubleValue() - b.r;
					if (b.y > max) b.y = max;
				}
			}
		});
	}

	/**
	 * Updates the ghost ball location
	 * @param x
	 * @param y
	 */
	public void updateGhost(double x, double y) {
		ghost.x = x;
		ghost.y = y;
	}

	private void clearScreen() {
		gc.setFill(Color.DIMGREY);
	    gc.fillRect(0, 0, width(), height());
	}

	/**
	 * For box mode: if a ball is outside the drawing area and is still going out,
	 * reverse its speed to create a bounce effect of the borders.
	 */
	private void checkBorders() {
		if (!torusProperty().get()) {
			for (Ball b : balls) {
				if ((b.x - b.r <= 0 && b.cx < 0) || (b.x + b.r >= width() && b.cx > 0))
					b.cx *= -1;
				if ((b.y - b.r <= 0 && b.cy < 0) || (b.y + b.r >= height() && b.cy > 0))
					b.cy *= -1;
			}
		}
	}

	/**
	 * In box mode, two balls collide (overlap) when they are closer
	 * than the sum of their radiuses.
	 */
	private boolean areCollidingOnBox(Ball b1, Ball b2) {
		final double
			r  = b1.r + b2.r,
			dx = b1.x - b2.x,
			dy = b1.y - b2.y;
		return dx*dx + dy*dy <= r*r;
	}

	/**
	 * Precondition: balls must be normalized (coordinates within [0, 0, width, height])
	 * which is done on updateSimulation().
	 * Two balls collide on a torus when any of their instances overlap.
	 * The trick is the minimum dx and dy distance between 2 balls can never be
	 * bigger than width/2 and height/2 (on a torus, balls can never be further
	 * apart than half the screen size)
	 */
	private boolean areCollidingOnTorus(Ball b1, Ball b2) {
		double
			dx = Math.abs(b1.x - b2.x),
			dy = Math.abs(b1.y - b2.y),
			r  = b1.r + b2.r;
		if (dx > width()  / 2) dx = width()  - dx;
		if (dy > height() / 2) dy = height() - dy;
		return dx*dx + dy*dy <= r*r;
	}

	/**
	 * Handles the balls collisions with the border (box mode)
	 * and between each other.
	 * This method browses all ball couples in O(n²).
	 * When the method returns, the balls speed has been updated
	 * to match those collisions.
	 */
	private void handleCollisions() {
		final boolean torus = torusProperty().get();
		for (var i = balls.listIterator(); i.hasNext(); ) {
			var b1 = i.next();
			for (var j = balls.listIterator(i.nextIndex()); j.hasNext(); ) {
				var b2 = j.next();
				if (torus && areCollidingOnTorus(b1, b2) || areCollidingOnBox(b1, b2)) {
					b1.setCollision(true);
					b2.setCollision(true);
					bounce(b1, b2, torus);
				}
			}
		}
	}

	/**
	 * Newton's law applied to balls to get a correct bounce.
	 */
	private void bounce(Ball a, Ball b, boolean torus) {
		final double
		        w = width(),
		        h = height(),
		       sx = a.cx - b.cx,
		       sy = a.cy - b.cy;
		double dx = a.x - b.x,
		       dy = a.y - b.y;
		if (torus) {
			// Find the smallest distance between all representative of a and b on a torus
			if (a.x > b.x && dx > w / 2)
				dx = dx - w;
			else if (a.x < b.x && -dx > w / 2)
				dx = dx + w;
			if (a.y > b.y && dy > h / 2)
				dy = dy - h;
			else if (a.y < b.y && -dy > h /2)
				dy = dy + h;
		}
		// balls are going towards each other when this dot product is negative
		final double dot = dx * sx + dy * sy;
		if (dot < 0) {
			final double
				f  = 2 * dot / (dx * dx + dy * dy) / (a.m + b.m),
				fx = dx * f,
				fy = dy * f;
			a.cx += fx * -b.m;
			a.cy += fy * -b.m;
			b.cx += fx *  a.m;
			b.cy += fy *  a.m;
		}
	}

	/**
	 * Do not apply in torus mode (there is no ground)
	 * @param seconds
	 */
	private void applyGravity(double seconds) {
		for (Ball b : balls)
			if (b.y + b.r < height())
				b.cy += GRAVITY * seconds;
	}

	/**
	 * Javac is not very friendly. It refuses to inline my modulo function.
	 * So here it is, plain ugly and unreadable for twice the perf.
	 * @param seconds
	 * @param torus
	 */
	private void updateSimulation(double seconds) {
		boolean torus = torusProperty().get();
		double r, w = width(), h = height();
		for (Ball b : balls) {
			b.x += b.cx * seconds;
			b.y += b.cy * seconds;
			if (torus) {
				r = b.x % w;
				b.x = r < 0 ? r + w : r;
				r = b.y % h;
				b.y = r < 0 ? r + h : r;
			}
		}
	}

	private void renderGhost() {
		if (ghostProperty.get()) {
			gc.setFill(ghost.getColor());
			gc.fillOval(ghost.x - ghost.r, ghost.y - ghost.r, 2*ghost.r, 2*ghost.r);
		}
	}

	private void renderBalls() {
		clearScreen();
		renderGhost();
		boolean torus = torusProperty().get();
		final double
			maxx = width(),
			maxy = height();
		for (Ball b : balls) {
			gc.setFill(b.getColor());
			b.setCollision(false);
			// Draw the main ball (the one inside simuArea)
			double px = b.x - b.r,
			       py = b.y - b.r;
			gc.fillOval(px, py, 2*b.r, 2*b.r);
			if (!torus) continue;
			// Then, if needed, draw other instances of this ball in the neighbour tiles
			boolean L = b.x < b.r,
			        R = b.x > maxx - b.r,
			        T = b.y < b.r,
			        B = b.y > maxy - b.r;
			// The number of conditions can be reduced here, with proper "else", but the readability will be abysmal
			if (L)      gc.fillOval(px + maxx, py       , 2*b.r, 2*b.r);
			if (R)      gc.fillOval(px - maxx, py       , 2*b.r, 2*b.r);
			if (T)      gc.fillOval(px       , py + maxy, 2*b.r, 2*b.r);
			if (B)      gc.fillOval(px       , py - maxy, 2*b.r, 2*b.r);
			if (L && T) gc.fillOval(px + maxx, py + maxy, 2*b.r, 2*b.r);
			if (L && B) gc.fillOval(px + maxx, py - maxy, 2*b.r, 2*b.r);
			if (R && T) gc.fillOval(px - maxx, py + maxy, 2*b.r, 2*b.r);
			if (R && B) gc.fillOval(px - maxx, py - maxy, 2*b.r, 2*b.r);
		}
	}

	public void start() {
		ticker.start();
		isRunning.set(true);
	}

	public void stop() {
		ticker.stop();
		isRunning.set(false);
	}

	public void reset() {
		balls.clear();
		clearScreen();
		stop();
	}

	public BooleanProperty isRunning() {
		return isRunning;
	}

	public void addBall(Ball b) {
		balls.add(b);
		renderBalls();
	}

	public void tick(double seconds) {
		checkBorders();
		handleCollisions();
		if (gravity.get())
			applyGravity(seconds);
		updateSimulation(seconds);
		renderBalls();
	}

	public BooleanProperty gravityProperty() {
		return gravity;
	}

	public BooleanProperty torusProperty() {
		return torus;
	}

	public void toggleGravity() {
		gravityProperty().set(!gravityProperty().get());
	}

	public void toggleTorus() {
		torusProperty().set(!torusProperty().get());
	}

	public void togglePause() {
		if (isRunning().get())
			stop();
		else
			start();
	}
}
