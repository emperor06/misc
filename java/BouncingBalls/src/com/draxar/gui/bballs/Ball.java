package com.draxar.gui.bballs;

import java.awt.Graphics;

/**
 * A simple representation of a ball.
 * It has a radius, a location, and a speed.
 * A ball can tell if it's colliding another ball.
 * It can even give you the resulting speed of such a collision! :)
 * @author drax
 *
 */
public class Ball {
	public float radius;
	public Vec pos;
	public Vec spd;
	
	/**
	 * Let's assume all balls have the same uniform density.
	 * The mass can be 2D mass (the ball is like a coin) or 3D (like a billiard ball)
	 * @return the mass of the ball only determined by its radius.
	 */
	public float mass() {
		//return 4.188790f * radius * radius * radius; // 3D
		return 2 * 3.1415927f * radius * radius; // 2D
	}
	
	public Ball(float r, Vec p, Vec s) {
		radius = r;
		pos = p;
		spd = s;
	}
	
	public static Ball getRandomBall(Vec pos) {
		float r = 10 + (float)Math.random() * 40;
		float angl = (float) Math.random() * 2*3.1415927f;
		float rho = 100 + (float) Math.random() * 300;
		Vec spd = new Vec((float) Math.cos(angl) * rho, (float) Math.sin(angl) * rho);
		//Vec p = new Vec((float) Math.random() * pos.x, (float) Math.random() * pos.y);
		return new Ball(r, pos, spd);
	}
	
	public void setPos(Vec v) {
		pos.set(v);
	}
	
	public void setSpeed(Vec v) {
		spd.set(v);
	}
	
	/**
	 * Returns true if this ball is "within" the other given ball.
	 * @param b another ball to test
	 * @return true when they collide
	 */
	public boolean collidesWith(Ball b) {
		float maxDistSq = (radius + b.radius) * (radius + b.radius);
		return pos.sub(b.pos).normSq() <= maxDistSq;
	}
	
	/**
	 * Uses Newton's laws of conservation of energy and momentum to derive the
	 * new speed of this ball after a collision with the given ball.
	 * @param b another ball colliding this one.
	 * @return The new speed of this ball without modifying it.
	 */
	public Vec collision(Ball b) {
		Vec x1x2 = pos.sub(b.pos);
		Vec v1v2 = spd.sub(b.spd);
		float f1 = 2 * b.mass() / (mass() + b.mass());
		f1 *= x1x2.dot(v1v2);
		f1 /= x1x2.normSq();
		x1x2.mut_mul(f1);
		return spd.sub(x1x2);
	}
	
	/**
	 * Tells whether this ball and the given ball are moving towards each other or not.
	 * When 2 balls collide, because of the tick resolution they can end up overlapping.
	 * When it happens, the balls should move away from each other after the collision
	 * but they may still be overlapping, triggering another (unwanted) collision on the next tick.
	 * One solution is to revert time a little bit when a collision is detected, so that the
	 * balls are tangent. Another solution is to use this function to discard collisions
	 * when the balls are moving away from each other.
	 * @param b another ball
	 * @return true if this ball moves away from the other.
	 */
	public boolean movingAwayFrom(Ball b) {
		Vec d = b.pos.sub(pos);
		Vec v = b.spd.sub(spd);
		return v.dot(d) >= 0;
	}
	
	/**
	 * Simply draws this ball on the canvas.
	 * @param g The Graphics to paint on.
	 */
	public void draw(Graphics g) {
		int x = (int) (pos.x - radius + 0.5);
		int y = (int) (pos.y - radius + 0.5);
		int r = (int) (2*radius + 0.5);
		g.fillOval(x, y, r, r);
	}
}
