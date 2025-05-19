using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using static Fontname.Tools;

/* ::NameID::
 * 1 family (Minion Pro)
 * 2 subfamily (Bold)
 * 4 fullname (Minion Pro Bold)
 * 6 postscript (MinionPro-Bold)
 * 16 typographic family (Minion Pro)
 * 17 typographic subfamily (Semibold)
 * 18 typographic fullname (often missing)
 * 20 postscript CID
 * 21 WWS family (caption, display, handwritting…)
 * 22 WWS subfamily
 */
namespace Fontname
{

    struct NameRecord
    {
        public ushort platformID;
        public ushort encodingID;
        public ushort languageID;
        public ushort nameID;
        public ushort length;
        public ushort offset;
        public byte[] name;
        
        public static NameRecord FromByte(byte[] ar, ref uint off)
        {
            NameRecord n = new NameRecord();
            n.platformID = readUShortBE(ar, ref off);
            n.encodingID = readUShortBE(ar, ref off);
            n.languageID = readUShortBE(ar, ref off);
            n.nameID     = readUShortBE(ar, ref off);
            n.length     = readUShortBE(ar, ref off);
            n.offset     = readUShortBE(ar, ref off);
            return n;
        }

        public string GetName()
        {
            Encoding code = getEncoding(platformID, encodingID, languageID);
            return code.GetString(name).Trim(Tools.trimmable);
        }

        public string GetKey()
        {
            return String.Format("{0},{1},{2}", platformID, encodingID, languageID);
        }

        public string GetDebugString()
        {
            return String.Format("[{0, -12}] {1}", GetKey(), GetName());
        }
    }

    [Serializable]
    public class FontException : Exception
    {
        public FontException() : base() { }
        public FontException(string message) : base(message) { }
        public FontException(string message, Exception inner) : base(message, inner) { }
    }

    internal class Fonte
    {
        public static readonly HashSet<ushort> goodIdeas  = new HashSet<ushort>(new ushort[] { 1, 2, 4, 6, 16, 17, 18, 20, 21, 22 });
        public static readonly ushort[]        goodFamily = new ushort[] { 1, 16, 21 };

        string filename;
        List<NameRecord> records;

        public Fonte(string path)
        {
            filename = path;
            records = new List<NameRecord>();
            ParseData();
        }

        public List<NameRecord> GetRecords()
        {
            return records;
        }

        private void ParseData()
        {
            byte[] data;
            uint off         = 0,
                 tableOffset = 0,
                 tableLength = 0;

            using (var fs = new FileStream(filename, FileMode.Open, FileAccess.Read))
            using (var file = new BinaryReaderBE(fs))
            {
                uint version = file.ReadUInt32();
                if (version != 0x00010000 && version != 0x4f54544f)
                    throw new FontException("Unknown font version: " + version);
                short numTables = (short)file.ReadUInt16();
                fs.Seek(6, SeekOrigin.Current); // skips searchRange, entrySelector, and rangeShift
                while (numTables --> 0)
                    if (0x6E616D65 == file.ReadUInt32()) // name
                    {
                        fs.Seek(4, SeekOrigin.Current); // skip checksum
                        tableOffset = file.ReadUInt32();
                        tableLength = file.ReadUInt32();
                        break;
                    }
                    else fs.Seek(12, SeekOrigin.Current); // skip this table header
                if (numTables < 0)
                    throw new FontException("Name table not found");

                // Name table
                fs.Seek(tableOffset, SeekOrigin.Begin);
                data = file.ReadBytes((int)tableLength);
            }
            off = 2;
            ushort nbRecords = readUShortBE(data, ref off);
            ushort storageOffset = readUShortBE(data, ref off);
            for (int i = 0; i < nbRecords; i++)
            {
                NameRecord nr = NameRecord.FromByte(data, ref off);
                // Checks, for some fonts are malformed
                if (nr.offset + nr.length > tableLength - storageOffset)
                {
                    Console.Error.WriteLine("skipping malformed name record #{0}", i);
                    continue;
                }
                nr.name = new byte[nr.length];
                Array.Copy(data, storageOffset + nr.offset, nr.name, 0, nr.length);
                records.Add(nr);
            }
        }

        public string[] AllNames()
        {
            Dictionary<string, Dictionary<ushort, string>> dic = new Dictionary<string, Dictionary<ushort, string>>();
            Dictionary<ushort, string> ids;
            HashSet<string> names = new HashSet<string>();
            List<NameRecord> family = new List<NameRecord>(records.Count);
            string name;

            // Fetch only nameIDs suitable for a font name
            foreach (var rec in records)
                if (goodIdeas.Contains(rec.nameID) && (name = rec.GetName()) != null && name.Length != 0)
                {
                    string key = rec.GetKey();
                    if (!dic.TryGetValue(key, out ids))
                        dic.Add(key, ids = new Dictionary<ushort, string>());
                    ids.Add(rec.nameID, name);
                    if (Array.IndexOf(goodFamily, rec.nameID) != -1)
                        family.Add(rec);
                }

            // Fix FaceName by concatenating FamilyName and Style
            // And fill the names Set to get unique names
            foreach (var lang in dic.Values)
            {
                if (lang.ContainsKey(2) && !lang.ContainsKey(1))
                    lang.Remove(2);
                if (lang.ContainsKey(17) && !lang.ContainsKey(16))
                    lang.Remove(17);
                if (lang.ContainsKey(22) && !lang.ContainsKey(21))
                    lang.Remove(22);
                if (lang.ContainsKey(2))
                    lang[2] = String.Format("{0} {1}", lang[1], lang[2]);
                if (lang.ContainsKey(17))
                    lang[2] = String.Format("{0} {1}", lang[16], lang[17]);
                if (lang.ContainsKey(22))
                    lang[2] = String.Format("{0} {1}", lang[21], lang[22]);
                foreach (var val in lang.Values)
                    names.Add(val);
            }

            string best = GetBest(family);
            string[] res = new string[names.Count];
            names.CopyTo(res, 0);
            var idx = Array.IndexOf(res, best);
            if (idx != -1)
                (res[0], res[idx]) = (res[idx], res[0]);            
            return res;
        }

        string GetBest(List<NameRecord> family)
        {
            foreach (var id in goodFamily)
            {
                string other = null;
                foreach (var rec in family)
                {
                    if (rec.nameID != id) continue;
                    if (rec.platformID == 1 && rec.languageID == 0 ||
                        rec.platformID == 3 && rec.languageID == 0x409)
                        return rec.GetName(); // english
                    other = rec.GetName();
                }
                if (other != null)
                    return other;
            }
            Console.WriteLine("Cannot find a best name");
            return null;
        }
    }
}
