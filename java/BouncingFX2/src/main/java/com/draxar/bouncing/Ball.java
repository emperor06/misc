package com.draxar.bouncing;

import java.util.Random;

import javafx.scene.paint.Color;

/**
 * A simplistic ball representation.
 * @author drax
 *
 */
public 	class Ball {
	public static final Color DEFAULT_COLOR = Color.LIGHTGREY;
	public double x, y, cx, cy, r, m;
	private Color color;
	private boolean collision = false;
	private static final Random rand = new Random();

	public Ball(double x, double y, double cx, double cy, double r, Color c) {
		this.x = x;
		this.y = y;
		this.cx = cx;
		this.cy = cy;
		this.r = r;
		this.color = c;
		this.m = r*r;
	}

	public Ball(double x, double y, double cx, double cy, double r) {
		this(x, y, cx, cy, r, new Color(rand.nextDouble(), rand.nextDouble(), rand.nextDouble(), 1));
	}

	public void setCollision(boolean b) {
		collision = b;
	}

	public Color getColor() {
		return collision ? color.brighter() : color;
	}
}