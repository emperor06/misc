package tetrapinski;

import javafx.geometry.Point3D;

//faces:
//0 1 2
//0 3 1
//0 2 3
//2 1 3

public class Tetrahedron {
    public static final float H = (float) Math.sqrt(2.0/3); // hauteur totale
    public static final float h = H/4; // hauteur du centre

    public static final Point3D S0 = new Point3D(-1.0/2, -1.0/3, -h);
    public static final Point3D S1 = new Point3D(0.0, Math.sqrt(3)/2 - 1.0/3, -h);
    public static final Point3D S2 = new Point3D(1.0/2, -1.0/3, -h);
    public static final Point3D S3 = new Point3D(0.0, 0.0, 3*h);

    private Point3D center;
    private float scale;
    private Point3D[] vertices;

    public Tetrahedron(Point3D center, float scale) {
        this.center = center;
        this.scale = scale;
        vertices = new Point3D[4];
        computeVertices();
    }

    public Tetrahedron() {
        this(new Point3D(0, 0, 0), 1);
    }

    public Tetrahedron(float scale) {
        this(new Point3D(0, 0, 0), scale);
    }

    public Point3D[] getVertices() {
        return vertices;
    }

    public Point3D getCenter() {
        return center;
    }

    public float getScale() {
        return scale;
    }

    public void translate(Point3D p) {
        center = center.add(p);
        computeVertices();
    }

    private void computeVertices() {
        vertices[0] = S0;
        vertices[1] = S1;
        vertices[2] = S2;
        vertices[3] = S3;
        for (int i = 0; i < vertices.length; i++) {
            vertices[i] = vertices[i].multiply(scale).add(center);
        }
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < vertices.length; i++) {
            sb.append("v ")
                    .append(vertices[i].getX()).append(" ")
                    .append(vertices[i].getY()).append(" ")
                    .append(vertices[i].getZ()).append("\n");
        }
        return sb.toString();
    }
}
