using System;
using System.Text;
using System.IO;

/**
 * Fontname by Drax
 * Prints all possible font names for that font (family, facename, PS name, in every language/encoding)
 */
namespace Fontname
{
    internal class Program
    {
 
        public static void ListAllEncodings()
        {
            Console.WriteLine("CodePage identifier and name     WindowsCodePage");
            foreach (EncodingInfo ei in Encoding.GetEncodings())
            {
                Encoding e = ei.GetEncoding();
                Console.WriteLine("{0,-6} {1,-25} {0,-6}", ei.CodePage, ei.Name, e.WindowsCodePage);
            }
            Environment.Exit(0);
        }

        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8; // Sets the Console to UTF-8
            // ListAllEncodings();

            if (args.Length == 0)
            {
                Console.WriteLine("Usage: Fontname.exe fontfile.?tf");
                return;
            }

            string filename = args[0];
            if (filename.Length == 0 || !File.Exists(filename))
            {
                Console.Error.WriteLine("Cannot open file {0}", filename);
                Environment.Exit(1);
            }

            try
            {
                Fonte fonte = new Fonte(filename);
                foreach (var name in fonte.AllNames())
                    Console.WriteLine(name);
            }
            catch (Exception e)
            {
                Console.Error.WriteLine(e.Message);
                Environment.Exit(1);
            }
        }
    }
}
