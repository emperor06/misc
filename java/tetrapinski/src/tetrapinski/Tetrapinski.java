/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package tetrapinski;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.util.LinkedList;
import java.util.List;
import javafx.geometry.Point3D;

/**
 *
 * @author drax
 */
public class Tetrapinski {

    public List<Tetrahedron> all = new LinkedList<>();
    int order;

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {

        /*
        int order = 6;
        Tetrapinski p = new Tetrapinski(order);
        try {
            BufferedWriter bw = new BufferedWriter(new FileWriter("c:/users/drax/Downloads/tetra.obj"));
            bw.write("# Tétraèdre de Sierpinski du Drax, ordre " + order);
            bw.newLine();
            bw.write("g default");
            bw.newLine();

            for (Tetrahedron t : p.all) {
                //System.out.println(t);
                bw.write(t.toString());
            }

            int firstIndex = 1;
            for (int i = 0; i < p.all.size(); i++) {
                //System.out.println(generateFaces(firstIndex));
                bw.write(generateFaces(firstIndex));
                firstIndex += 4;
            }

            bw.close();
        } catch (Exception e) {
            System.err.println(e);
        }
        */

        Tetrahedron t = new Tetrahedron(24.4948974278f);
        System.out.println(t);
        int firstIndex = 1;
        System.out.println(generateFaces(firstIndex));

    }

    public Tetrapinski(int order) {
        this.order = order;
        Tetrahedron t = new Tetrahedron();
        all = generateTetrahedrons(t, 0);
    }

    public List<Tetrahedron> generateTetrahedrons(Tetrahedron t, int o) {
        List<Tetrahedron> list = new LinkedList<>();
        Tetrahedron[] tets = sierpinski(t);
        for (int i = 0; i < tets.length; i++) {
            if (o == this.order) {
                list.add(tets[i]);
            } else {
                list.addAll(generateTetrahedrons(tets[i], o + 1));
            }
        }
        return list;
    }

    public static Tetrahedron[] sierpinski(Tetrahedron t) {
        Tetrahedron[] res = new Tetrahedron[4];
        float scale = t.getScale() / 2;
        Point3D trans = new Point3D(0, 0, 0);
        Point3D[] vertices = t.getVertices();

        for (int i = 0; i < 4; i++) {
            res[i] = new Tetrahedron(new Point3D(0, 0, 0), scale);
            trans = vertices[i].subtract(res[i].getVertices()[i]);
            res[i].translate(trans);
        }
        return res;
    }

    public static String generateFaces(int firstIndex) {
        int s1 = firstIndex;
        int s2 = firstIndex + 1;
        int s3 = firstIndex + 2;
        int s4 = firstIndex + 3;
        StringBuilder sb = new StringBuilder();
        sb.append("f ").append(s1).append(" ").append(s2).append(" ").append(s3).append("\n");
        sb.append("f ").append(s1).append(" ").append(s4).append(" ").append(s2).append("\n");
        sb.append("f ").append(s1).append(" ").append(s3).append(" ").append(s4).append("\n");
        sb.append("f ").append(s3).append(" ").append(s2).append(" ").append(s4).append("\n");
        return sb.toString();
    }
}
