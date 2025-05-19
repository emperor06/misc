from heapq import *
from collections import Counter

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


## Construit un arbre de Huffman à partir d'un texte donné
def HuffmanTree(Chaine):
    # On commence par compter les occurences de chaque caractère
    Dico = Counter(Chaine)

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
        code += lookupTable[c]
    return code


texte = "Huffman"
print("Texte : ", texte)
print("Code  : ", HuffmanCode(texte))
