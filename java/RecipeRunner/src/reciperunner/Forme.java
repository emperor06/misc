package reciperunner;

public class Forme {
    public static final Forme SPHERE    = new Forme(0, "Ball", "Sphere");
    public static final Forme CUBE      = new Forme(1, "Cube", "Cube");
    public static final Forme TETRA     = new Forme(2, "Tetrahedron", "Tetra");
    public static final Forme CYL       = new Forme(3, "Cylinder", "Cylinder");
    public static final Forme OCTA      = new Forme(4, "Octahedron", "Octa");
    public static final Forme ICO       = new Forme(5, "Icosahedron", "Ico");

    public int id;
    public String name;
    public String shortName;

    public Forme(int i, String n, String s) {
        id = i;
        name = n;
        shortName = s;
    }

    public static Forme mix(Forme a, Forme b) {
        Forme res = _mix(a, b);
        if (res != null) {
            return res;
        } else {
            return _mix(b, a);
        }
    }

    private static Forme _mix(Forme a, Forme b) {
        if (a.equals(b)) return a;
        if (a.equals(SPHERE) && b.equals(CUBE))  return CYL;
        if (a.equals(SPHERE) && b.equals(TETRA)) return ICO;
        if (a.equals(CUBE)   && b.equals(TETRA)) return OCTA;
        return null;
    }

    @Override
    public int hashCode() {
        return id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Forme)) return false;
        return this.id == ((Forme) o).id;
    }
}

