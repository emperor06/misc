using System;
using System.Collections.Generic;

namespace Matrimonial
{
    class Humain
    {
        private int _index;
        public string Nom { get; set; }
        public List<Humain> Favoris { get; set; }
        public Humain Partenaire { get; set; }

        public Humain(string nom)
        {
            Nom = nom;
            _index = 0;
            Favoris = null;
            Partenaire = null;
        }

        /// <summary>
        /// Est-ce que je préfère cet autre humain à mon partenaire actuel ?
        /// C'est à dire est-ce que le rang de cet humain est plus petit que celui
        /// de mon partenaire dans ma liste de favoris ?
        /// </summary>
        /// <param name="h">Un humain à tester</param>
        /// <returns>false si l'autre est mon partenaire ou s'il est pire que mon partenaire, vrai si l'autre est strictement mieux</returns>
        public bool Prefere(Humain h)
        {
            //return Favoris.FindIndex(o => o == h) < Favoris.FindIndex(o => o == Partenaire);
            foreach (Humain autre in Favoris)
            {
                if (autre == Partenaire) return false;
                if (autre == h) return true;
            }
            return false; // ne se produit jamais
        }

        public Humain ProchaineCible()
        {
            if (_index >= Favoris.Count) return null; // plus de cibles disponibles
            return Favoris[_index++];
        }

        public void SeCaseAvec(Humain h)
        {
            // Si l'autre a déjà un partenaire, je le libère
            if (h.Partenaire != null)
                h.Partenaire.Partenaire = null;
            // Je suis maintenant le nouveau partenaire de l'autre
            h.Partenaire = this;
            // Si j'avais déjà un partenaire, je romps
            if (Partenaire != null)
                Partenaire.Partenaire = null;
            // Je prends l'autre comme nouveau partenaire
            Partenaire = h;
        }
    }

    static class Humains
    {
        static Humain sandrine = new Humain("Sandrine");
        static Humain steph = new Humain("Steph");
        static Humain virginie = new Humain("Virginie");
        static Humain sarah = new Humain("Sarah");
        static Humain ingrid = new Humain("Ingrid");
        static Humain elodie = new Humain("Elodie");
        static Humain isabelle = new Humain("Isabelle");

        static Humain greg = new Humain("Greg");
        static Humain yann = new Humain("Yann");
        static Humain mathieu = new Humain("Mathieu");
        static Humain nicolus = new Humain("Nicolus");
        static Humain kranf = new Humain("Kranf");
        static Humain sam = new Humain("Sam");
        static Humain roger = new Humain("Roger");

        static public List<Humain> meufs { get; set; }
        static public List<Humain> mecs  { get; set; }

        static Humains()
        {
            sandrine.Favoris = new List<Humain>() { greg, yann, nicolus, roger, sam, mathieu, kranf };
            steph.Favoris = new List<Humain>() { greg, mathieu, kranf, roger, nicolus, sam, yann };
            virginie.Favoris = new List<Humain>() { roger, greg, nicolus, yann, sam, mathieu, kranf };
            sarah.Favoris = new List<Humain>() { sam, greg, mathieu, kranf, nicolus, roger, yann };
            ingrid.Favoris = new List<Humain>() { greg, sam, mathieu, kranf, roger, yann, nicolus };
            elodie.Favoris = new List<Humain>() { roger, nicolus, sam, mathieu, greg, kranf, yann };
            isabelle.Favoris = new List<Humain>() { greg, roger, sam, mathieu, nicolus, kranf, yann };

            greg.Favoris = new List<Humain>() { steph, sarah, elodie, isabelle, ingrid, sandrine, virginie };
            nicolus.Favoris = new List<Humain>() { sandrine, sarah, virginie, isabelle, elodie, steph, ingrid };
            yann.Favoris = new List<Humain>() { sandrine, virginie, isabelle, ingrid, elodie, sarah, steph };
            mathieu.Favoris = new List<Humain>() { elodie, steph, sarah, sandrine, isabelle, ingrid, virginie };
            kranf.Favoris = new List<Humain>() { steph, sarah, ingrid, elodie, sandrine, isabelle, virginie };
            sam.Favoris = new List<Humain>() { ingrid, isabelle, sarah, steph, elodie, sandrine, virginie };
            roger.Favoris = new List<Humain>() { sandrine, sarah, isabelle, elodie, virginie, steph, ingrid };

            meufs = new List<Humain>(greg.Favoris);
            mecs  = new List<Humain>(steph.Favoris);
        }
    }

    class Program
    {


        static public bool EstStable(List<Humain> sexe)
        {
            List<Humain> sexeOppose = sexe[0].Favoris;
            foreach (Humain mec in sexe)
                foreach (Humain meuf in sexeOppose)
                    if (mec.Prefere(meuf) && meuf.Prefere(mec))
                        return false;
            return true;
        }

        static void Main(string[] args)
        {
            Console.WriteLine("  == Agence Direct-To-Bed ==");
            Console.WriteLine();

            
            Console.WriteLine("Les hommes proposent, les femmes disposent...");
            List<Humain> mecs = Humains.mecs;
            int humainsLibres = mecs.Count;
            while (humainsLibres > 0)
            {
                foreach (Humain mec in mecs)
                {
                    if (mec.Partenaire == null)
                    {
                        Humain meuf = mec.ProchaineCible();
                        if (meuf.Partenaire == null)
                        {
                            mec.SeCaseAvec(meuf);
                            humainsLibres--;
                        } else if (meuf.Prefere(mec))
                        {
                            mec.SeCaseAvec(meuf);
                        }
                    }
                }
            }

            foreach (Humain mec in mecs)
            {
                Console.WriteLine("{0} se tape {1}", mec.Nom, mec.Partenaire.Nom);
            }
            Console.WriteLine("Stable ? {0}", EstStable(mecs));

        }
    }
}
