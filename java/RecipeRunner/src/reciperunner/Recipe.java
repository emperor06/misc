package reciperunner;

public class Recipe {
    static final String CSV = "%s,\"fusion\",\"((%s,1),(%s,1))\",\"(BlueprintGeneratedClass'\"\"/Game/Ingredients/ComplexIngredient/%s/%s_BP.%s_BP_C\"\"')\",\"0\",\"category_complexingredients\",\"0\",\"0\",\"\",\"%s\"";
    static final String UNSTABLE_CSV = "%s,\"fusion\",\"((%s,2))\",\"(BlueprintGeneratedClass'\"\"/Game/Ingredients/ComplexIngredient/%s/Unstable_Complex_%s_BP.Unstable_Complex_%s_BP_C\"\"')\",\"0\",\"category_complexingredients\",\"0\",\"0\",\"\",\"%s\"";
    static int counter = 1;

    protected Ingredient input1;
    protected Ingredient input2;
    protected Ingredient output;

    // Constructor for unstable ingots
    public Recipe(Ingredient i1) {
        input1 = i1;
        input2 = null;
        output = null;
    }

    // Constructor for regular fusions
    public Recipe(Ingredient i1, Ingredient i2, Ingredient o) {
        input1 = i1;
        input2 = i2;
        output = o;
    }
    
    private static String fixBalls(String s) {
        return s.replaceAll("Ball", "Sphere");
    }

    @Override
    public String toString() {
        return (input2 == null) ?
        String.format(UNSTABLE_CSV,
                "BASE" + counter++ + "_UNSTABLE_" + input1.getForme().name.toUpperCase(),
                input1.getEnumerator(),
                fixBalls(input1.getForme().name),
                fixBalls(input1.getForme().name),
                fixBalls(input1.getForme().name),
                "u_" + input1.getForme().shortName.toLowerCase()
        )
        :
        String.format(CSV,
                "BASE" + counter++ + "_" + output.capsName(),
                input1.getEnumerator(),
                input2.getEnumerator(),
                fixBalls(output.getForme().name),
                output.camelName(),
                output.camelName(),
                output.displayNameCode()
        );
    }
}
