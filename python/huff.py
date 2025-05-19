from heapq import *

class Noeud:

    def __init__(self, c = None, o = 0, l = None, r = None):
        self.lettre = c
        self.occurences = o
        self.left = l
        self.right = r
        self.code = ""

    # Implémente l'opérateur < pour les noeuds
    def __lt__(self, autre):
        return self.occurences < autre.occurences

    # Implémente l'opérateur == pour les noeuds
    def __eq__(self, autre):
        return autre != None and autre.occurences == autre.occurences

    def __repr__(self):
        if (self.lettre == None or self.lettre == ''):
            return ''
        return "lettre={} ; occurences={} ; code={}".format(self.lettre, self.occurences, self.code)

    # Implémente printable
    def __str__(self):
        str = self.__repr__()
        if (str != ''):
            str += "\n"
        if (self.left != None):
            str += self.left.__str__()
        if (self.right != None):
            str += self.right.__str__()
        return str

    # A appeler sur le root
    def genereCodes(self):
        if (self.left != None):
            self.left.code  = self.code + "0"
            self.left.genereCodes()
        if (self.right != None):
            self.right.code = self.code + "1"
            self.right.genereCodes()

    # A appeler sur le root
    # Précondition : genereCodes() a été appelé
    def lookup(self, dic):
        if (self.lettre != None and self.lettre != ''):
            dic[self.lettre] = self.code
        if (self.left != None):
            self.left.lookup(dic)
        if (self.right != None):
            self.right.lookup(dic)


## Construit un dictionnaire <caractère, occurences> à partir d'un texte
def Compteoccurences(s):
    Dico = dict()
    for c in s: # On parcourt la chaine caractère par caractère
        if (Dico.get(c) == None): # si on n'a pas déjà le caractère c, on le rajoute au dico
            Dico[c] = 1
        else: # sinon, on l'incrémente
            Dico[c] += 1
    return Dico



## Affiche les occurences de chaque lettre contenues dans un dictionnaire
## Entrée : un dictionnaire <lettre, occurences>
def Afficheoccurences(dico):
    for lettre, occurences in dico.items():
        print(lettre, occurences, sep="=")


## Construit un arbre de Huffman à partir d'un texte donné
def HuffmanTree(Chaine):
    # On commence par compter les occurences de chaque caractère
    Dico = Compteoccurences(Chaine)

    # On fabrique les noeuds de l'arbre et on les trie dans un tableau
    # (Python possède déjà une structure de données pour ça)
    heap = []
    for lettre, occurences in Dico.items():
        heappush(heap, Noeud(lettre, occurences))

    root = Noeud()
    while len(heap) > 1:
        left = heappop(heap)
        right = heappop(heap)
        root = Noeud('', left.occurences + right.occurences, left, right)
        heappush(heap, root)

    return heap[0]

## Code la chaine
def HuffmanCode(Chaine):
    root = HuffmanTree(Chaine)
    root.genereCodes()
    lookupTable = {}
    root.lookup(lookupTable)
    code = ""
    for c in Chaine:
        code += lookupTable.get(c)
    return code

# debug
texte = "Huffman"
print("Texte : ", texte)

# debug
print("\nOccurences")
Afficheoccurences(Compteoccurences(texte))

# debug
root = HuffmanTree(texte)
root.genereCodes()
print("\nArbre de Huffman")
print(root)

# debug
codes = {} # dictionnaire qui contiendra les codes de Huffman pour chaque lettre
root.lookup(codes)
print("\nCodes par lettre")
print(codes)

# vrai code
print("\nCode de Huffman complet")
print(HuffmanCode(texte))
