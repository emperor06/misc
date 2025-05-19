package com.draxar.gui.bballs;

import java.awt.Point;

/**
 * A simple Vector2f class for basic vector operations.
 * Functions mut_* modify the actual objects then return it.
 * If the function does not start with mut_, then a copy is returned.
 * @author drax
 */
public class Vec {
	public float x, y;

	public Vec(float x, float y) {
		this.x = x;
		this.y = y;
	}
	
	public Vec(Vec v) {
		this(v.x, v.y);
	}
	
	public Vec(Point p) {
		this(p.x, p.y);
	}
	
	public Vec() {
		this(0f, 0f);
	}
	
	public void set(float x, float y) {
		this.x = x;
		this.y = y;
	}
	
	public void set(Vec v) {
		set(v.x, v.y);
	}
	
	public Vec mut_add(Vec v) {
		set(x + v.x, y + v.y);
		return this;
	}
	
	public Vec mut_sub(Vec v) {
		set(x - v.x, y - v.y);
		return this;
	}
	
	public Vec mut_mul(float f) {
		set(x * f, y * f);
		return this;
	}
	
	public Vec mut_normalize() {
		if (x != 0 || y != 0) {
			float n = norm();
			mut_mul(1/n);
		}
		return this;
	}
	
	public Vec add(Vec v) {
		Vec res = new Vec(this);
		return res.mut_add(v);
	}

	public Vec sub(Vec v) {
		Vec res = new Vec(this);
		return res.mut_sub(v);
	}
	
	public Vec mul(float f) {
		Vec res = new Vec(this);
		return res.mut_mul(f);
	}
	
	public float dot(Vec v) {
		return x * v.x + y * v.y;
	}
	
	public Vec normalize() {
		Vec v = new Vec(this);
		return v.mut_normalize();
	}

	public float normSq() {
		return x*x + y*y;
	}
	
	public float norm() {
		return (float) Math.sqrt(normSq());
	}
}
