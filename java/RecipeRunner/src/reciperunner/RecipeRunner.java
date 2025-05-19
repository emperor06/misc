package reciperunner;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class RecipeRunner {
    public static final String ENUM_FILENAME = "InputRecipe_Enum.COPY";
    public static final Couleur[] COULEURS = {
        Couleur.GREEN,
        Couleur.BLUE,
        Couleur.RED,
        Couleur.YELLOW,
        Couleur.CYAN,
        Couleur.MAGENTA,
        Couleur.WHITE
    };
    public static final Forme[] FORMES = {
        Forme.SPHERE,
        Forme.CUBE,
        Forme.TETRA,
        Forme.CYL,
        Forme.OCTA,
        Forme.ICO
    };
    public static final Map<String, String> ENUM_MAP = new HashMap<>();


    public static void parseEnum(File f) throws IOException {
        String pattern = ".*\"(.*)\".*";
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;
            while ((line = br.readLine()) != null && !line.trim().startsWith("DisplayNameMap="));
            if (line == null) {
                throw new IOException("Bad enum export file. Go back to UE4Editor, content browser, right-click on the enum (InputRecipe_Enum) and asset->export. Put that file where the README is.");
            }
            for (String s : line.split("\\),\\(")) {
                String[] bite = s.split(",");
                String key = bite[3].replaceAll(pattern, "$1");
                String value = bite[0].replaceAll(pattern, "$1");
                ENUM_MAP.put(key, value);
            }
        }
    }

    public static void main(String[] args) {
        try {
            parseEnum(new File(ENUM_FILENAME));
        } catch (IOException ioe) {
            System.err.println(ioe);
            System.exit(3);
        }

        // Génère tous les ingrédients possible (combinaison couleur + forme)
        Ingredient[] ingredients = new Ingredient[COULEURS.length * FORMES.length];
        int count = 0;
        for (Couleur c : COULEURS) {
            for (Forme f : FORMES) {
                ingredients[count++] = new Ingredient(c, f);
            }
        }

        // Génère toutes les recettes valide
        List<Recipe> recipes = new LinkedList<>();
        for (int i = 0; i < ingredients.length; i++) {
            Ingredient ingredient1 = ingredients[i];
            for (int j = 0; j < i; j++) {
                Ingredient ingredient2 = ingredients[j];
                Couleur c = ingredient1.mixCouleur(ingredient2);
                Forme f = ingredient1.mixForme(ingredient2);
                if (c != null && f != null) {
                    Ingredient output = new Ingredient(c, f);
                    recipes.add(new Recipe(ingredient1, ingredient2, output));
                }
            }
            // Génère les unstable ingots
            recipes.add(new Recipe(ingredient1));
        }

        if (args.length == 0) {
            // display result
            for (Recipe recipe : recipes) {
                System.out.println(recipe);
            }
        } else {
            File f = new File(args[0]);
            if (f.exists()) {
                System.err.println("File " + f.getAbsolutePath() + " already exists!");
                System.err.println("Aborting ...");
                System.exit(1);
            }
            try {
                f.createNewFile();
            } catch (IOException ioe) {
                System.err.println("Cannot create file " + f.getAbsolutePath());
                System.err.println("Aborting ...");
                System.exit(2);
            }
            try {
                BufferedWriter bw = new BufferedWriter(new FileWriter(f));
				bw.write("---,Type,Input,Output,ID,Category,Time,Energy,Tooltip,NameRecipe");
				bw.newLine();
                try {
                    for (Recipe recipe : recipes) {
                        bw.write(recipe.toString());
                        bw.newLine();
                    }
                } finally {
                    bw.close();
                }
            } catch (IOException ioe) {
                System.err.println(ioe);
            }
        }
    }
}
