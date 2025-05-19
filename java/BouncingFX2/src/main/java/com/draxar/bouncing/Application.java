package com.draxar.bouncing;

import java.io.IOException;
import java.util.Random;

import javafx.application.Platform;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.canvas.Canvas;
import javafx.scene.control.CheckMenuItem;
import javafx.scene.control.ContextMenu;
import javafx.scene.control.MenuItem;
import javafx.scene.input.KeyCode;
import javafx.scene.input.MouseButton;
import javafx.scene.layout.Pane;
import javafx.stage.Stage;
import javafx.stage.StageStyle;

/**
 * A simple bouncing balls simulation in JavaFX.
 * This class handles the user interface.
 * @author drax
 */
public class Application extends javafx.application.Application {
	private static final int SCENE_WIDTH = 1000;
	private static final int SCENE_HEIGHT = 800;

	private Simulation simu;
	private Ball       tmpBall;

	@Override
	public void start(Stage stage) throws IOException {
		stage.setTitle("Bouncing Balls 2");
		stage.initStyle(StageStyle.DECORATED);
		stage.sizeToScene();
		stage.setScene(buildScene());
		stage.show();
		stage.setOnCloseRequest(t -> { quit(); });
	}

	public static void quit() {
		Platform.exit();
		System.exit(0);
	}

	private void buildSimu(Canvas c) {
		simu = new Simulation(c);
		final Random rand = new Random();
		for (int i = 0; i < 10; i++) {
			simu.addBall(new Ball(
				SCENE_WIDTH / 2,
				SCENE_HEIGHT / 2,
				rand.nextDouble(300)-150,
				rand.nextDouble(300)-150,
				rand.nextDouble(30)+10));
		}
		simu.start();
	}

	private Scene buildScene() {
		final Canvas simuArea = new Canvas();
		final Pane   root     = new Pane(simuArea);
		final Scene  scene    = new Scene(root, SCENE_WIDTH, SCENE_HEIGHT);

	    root.setStyle("-fx-background-color: darkgrey");
	    simuArea.widthProperty().bind(root.widthProperty());
	    simuArea.heightProperty().bind(root.heightProperty());
	    buildSimu(simuArea);

	    // Context menu
		final CheckMenuItem playMI       = new CheckMenuItem("Play/Pause (SPACE)");
		final CheckMenuItem torusMI      = new CheckMenuItem("Torus (T)");
		final CheckMenuItem gravityMI    = new CheckMenuItem("Gravity (G)");
		final MenuItem      fullscreenMI = new MenuItem("Fullscreen (F)");
		final MenuItem      resetMI      = new MenuItem("Reset (R)");
		final MenuItem      quitMI       = new MenuItem("Quit (Q)");
		final ContextMenu   contextMenu  = new ContextMenu(playMI, torusMI, gravityMI, fullscreenMI, resetMI, quitMI);
		contextMenu.setAutoHide(true);
		contextMenu.setAutoFix(true);
		contextMenu.setHideOnEscape(true);
		contextMenu.setConsumeAutoHidingEvents(true);
		playMI      .setOnAction(event -> { simu.togglePause(); });
		torusMI     .setOnAction(event -> { simu.toggleTorus(); });
		gravityMI   .setOnAction(event -> { simu.toggleGravity(); });
		fullscreenMI.setOnAction(event -> { ((Stage)scene.getWindow()).setFullScreen(true); });
		resetMI     .setOnAction(event -> { simu.reset(); });
		quitMI      .setOnAction(event -> { quit(); });

		// Mouse events
		root.setOnMouseMoved(event -> { simu.updateGhost(event.getX(), event.getY()); });
		root.setOnScroll(t -> {
			double d = simu.ghostRadius() + (t.getDeltaY() > 0 ? 5 : -5);
			if (d < 5) d = 5;
			simu.ghostRadius(d);
		});
		root.setOnMousePressed(event -> {
			if (event.getButton() == MouseButton.PRIMARY)
				tmpBall = new Ball(event.getX(), event.getY(), 0, 0, simu.ghostRadius());
		});
		root.setOnMouseReleased(event -> {
			if (event.getButton() == MouseButton.PRIMARY && tmpBall != null) {             // && new BoundingBox(0, 0, simuArea.getWidth(), simuArea.getHeight()).contains(new Point2D(tmpBall.x, tmpBall.y))
				tmpBall.cx = event.getX() - tmpBall.x;
				tmpBall.cy = event.getY() - tmpBall.y;
				simu.addBall(tmpBall);
				tmpBall = null;
			}
			simu.updateGhost(event.getX(), event.getY());
		});
		root.setOnMouseClicked(event -> {
			if (event.getButton() == MouseButton.SECONDARY) {
				contextMenu.setX(event.getScreenX());
				contextMenu.setY(event.getScreenY());
				contextMenu.show(((Node) event.getSource()).getScene().getWindow()); // Stage.getWindows().get(0)
				playMI     .setSelected(simu.isRunning().get());
				torusMI    .setSelected(simu.torusProperty().get());
				gravityMI  .setSelected(simu.gravityProperty().get());
			}
		});

		// Keyboard events
		scene.setOnKeyPressed(key -> {
			switch (key.getCode()) {
			case T:
				simu.toggleTorus();
				break;
			case G:
				simu.toggleGravity();
				break;
			case F:
				((Stage)scene.getWindow()).setFullScreen(true);
				break;
			case R:
				simu.reset();
				break;
			case Q:
				quit();
				break;
			case CONTROL:
				simu.ghostProperty().set(true);
				break;
			case SPACE:
				simu.togglePause();
				break;
			default:
				break;
			}
		});
		scene.setOnKeyReleased(key -> {
			if (key.getCode() == KeyCode.CONTROL)
				simu.ghostProperty().set(false);
		});

		return scene;
	}

	public static void main(String[] args) {
		launch(args);
	}
}
