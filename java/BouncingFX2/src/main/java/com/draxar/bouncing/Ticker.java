package com.draxar.bouncing;

import javafx.animation.AnimationTimer;
import javafx.beans.property.LongProperty;
import javafx.beans.property.SimpleLongProperty;

/**
 * Because of a bug somewhere, javafx on my Manjaro is unable to
 * vsync to screen and spits frames like crazy.
 * Setting this to a strictly positive value enables soft fixed fps.
 * Setting it to zero or negative let javafx handle the fps.
 * Note: the following JVM parameters have no effect on Acer
 * -Djavafx.animation.fullspeed=false
 * -Djavafx.animation.pulse=60
 * -Djavafx.animation.framerate=60
 * But they work on Windows, except for javafx.animation.framerate which seems to do nothing at all.
 * @author drax
 *
 */
public class Ticker extends AnimationTimer {
	private final LongProperty lastUpdateTime = new SimpleLongProperty();
	private boolean            smooth = true;
	private long               tick_duration_ns = 0;
	private final Simulation   simu;

	public Ticker(Simulation s) {
		super();
		simu = s;
	}

	public Ticker(Simulation s, double fps) {
		this(s);
		setFps(fps);
	}

	@Override
	public void start() {
		lastUpdateTime.set(System.nanoTime());
		super.start();
	}

	/**
	 * When true, uses the correct tick elapsed time in calculations.
	 * Always true when AUTOFPS is on.
	 * @param b
	 */
	public void setSmooth(boolean b) {
		smooth = b;
	}

	/**
	 * @param fps Wanted frames per seconds
	 */
	public void setFps(double fps) {
		tick_duration_ns = fps <= 0 ? 0 : (long)(1/fps * 1E9);
	}

	@Override
	public void handle(long now) {
		if (tick_duration_ns == 0 || now - lastUpdateTime.get() >= tick_duration_ns) {
			long elapsed = smooth ? now - lastUpdateTime.get() : tick_duration_ns;
			lastUpdateTime.set(now);
			simu.tick(elapsed * 1E-9);
		}
	}

}
