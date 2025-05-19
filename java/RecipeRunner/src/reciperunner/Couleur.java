package reciperunner;

public class Couleur {
    public static final Couleur GREEN   = new Couleur(0, "Green");
    public static final Couleur BLUE    = new Couleur(1, "Blue");
    public static final Couleur RED     = new Couleur(2, "Red");
    public static final Couleur YELLOW  = new Couleur(3, "Yellow");
    public static final Couleur CYAN    = new Couleur(4, "Cyan");
    public static final Couleur MAGENTA = new Couleur(5, "Magenta");
    public static final Couleur WHITE   = new Couleur(6, "White");

    public int id;
    public String name;

    public Couleur(int i, String n) {
        id = i;
        name = n;
    }

    public static Couleur mix(Couleur a, Couleur b) {
        Couleur res = _mix(a, b);
        if (res != null) {
            return res;
        } else {
            return _mix(b, a);
        }
    }

    private static Couleur _mix(Couleur a, Couleur b) {
        if (a.equals(b)) return a;
        if (a.equals(GREEN)   && b.equals(BLUE))  return CYAN;
        if (a.equals(GREEN)   && b.equals(RED))   return YELLOW;
        if (a.equals(RED)     && b.equals(BLUE))  return MAGENTA;
        if (a.equals(YELLOW)  && b.equals(BLUE))  return WHITE;
        if (a.equals(MAGENTA) && b.equals(GREEN)) return WHITE;
        if (a.equals(CYAN)    && b.equals(RED))   return WHITE;
        return null;
    }

    @Override
    public int hashCode() {
        return id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Couleur)) return false;
        return this.id == ((Couleur) o).id;
    }
}
