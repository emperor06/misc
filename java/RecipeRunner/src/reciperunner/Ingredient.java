package reciperunner;

public class Ingredient {

    private final Couleur couleur;
    private final Forme forme;

    public Ingredient(Couleur c, Forme f) {
        couleur = c;
        forme = f;
    }

    public Couleur getCouleur() {
        return couleur;
    }

    public Forme getForme() {
        return forme;
    }

    @Deprecated
    private String createEnumerator(int nbFormes) {
        int c = couleur.id;
        int f = forme.id;
        int n = c * nbFormes + f + 1;
        return "NewEnumerator" + n;
    }

    public String getEnumerator() {
        String s = RecipeRunner.ENUM_MAP.get(displayNameCode());
        if (s == null) {
            System.err.println("Cannot find enumerator for " + displayNameCode());
        }
        return s;
    }

    public String camelName() {
        return couleur.name + forme.name;
    }

    public String capsName() {
        return couleur.name.toUpperCase() + "_" + forme.name.toUpperCase();
    }

    public String displayNameCode() {
        return couleur.name.toLowerCase().charAt(0) + "_" + forme.shortName.toLowerCase();
    }

    public Couleur mixCouleur(Ingredient o) {
        Couleur a = this.getCouleur();
        Couleur b = o.getCouleur();
        return Couleur.mix(a, b);
    }

    public Forme mixForme(Ingredient o) {
        Forme a = this.getForme();
        Forme b = o.getForme();
        return Forme.mix(a, b);
    }
}
