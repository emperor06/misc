using System;
using System.Text;

namespace Fontname
{
    public static class Tools
    {
        public static readonly char[] trimmable  = { ' ', '\n', '\t', '\r', '\0' };

        public static ushort readUShortBE(byte[] ar, ref uint off)
        {
            return (ushort) (ar[off++] << 8 | (ar[off++] & 0xff));
        }

        public static uint readUIntBE(byte[] ar, ref uint off)
        {
            return (uint)(ar[off++] << 24 |
                          ar[off++] << 16 |
                          ar[off++] <<  8 |
                          ar[off++]);
        }

        public static Encoding getEncoding(ushort PID, ushort EID, ushort LID)
        {
            // Unicode
            if (PID == 0)
			{
				return Encoding.GetEncoding(1201); // utf-16be
            }

            // Macintosh
            if (PID == 1)
			{
                if (LID == 65535) return Encoding.GetEncoding(10000); // macintosh (Seems like lang 65535 is always a PSName which should be ascii, but mac os roman is fully compatible with ascii anyway)
                switch (EID)
				{
					case 0:
						switch (LID)
						{
							case 0:  return Encoding.GetEncoding(10000); // macintosh
                            case 15: return Encoding.GetEncoding(10079); // x-mac-iceland
                            case 17: return Encoding.GetEncoding(10081); // x-mac-turkish
                            case 18: return Encoding.GetEncoding(10082); // x-mac-croatian
                            case 24:
							case 25:
							case 26:
							case 27:
							case 28:
							case 36:
							case 38:
							case 39:
							case 40: return Encoding.GetEncoding(10029); // x-mac-ce (mac_latin2)
							case 37: return Encoding.GetEncoding(10010); // x-mac-romanian
                            default:
								//Console.Error.WriteLine("Default language for PID 1, EID 0, LID {0}", LID);
								return Encoding.GetEncoding(10000); // macintosh
                        }
					case 1:  return Encoding.GetEncoding(10001); // x-mac-japanese
                    case 2:  return Encoding.GetEncoding(10002); // x-mac-chinesetrad
                    case 3:  return Encoding.GetEncoding(10003); // x-mac-korean
					case 4:  return Encoding.GetEncoding(10004); // x-mac-arabic
                    case 5:  return Encoding.GetEncoding(10005); // x-mac-hebrew
                    case 6:  return Encoding.GetEncoding(10006); // x-mac-greek
                    case 7:  return Encoding.GetEncoding(10007); // x-mac-cyrillic
                    case 8:
                    case 25: return Encoding.GetEncoding(10008); // x-mac-chinesesimp
                    case 10: return Encoding.GetEncoding(10010); // x-mac-romanian
                    case 17: return Encoding.GetEncoding(10017); // x-mac-ukrainian
                    case 21: return Encoding.GetEncoding(10021); // x-mac-thai
                    case 29: return Encoding.GetEncoding(10029); // x-mac-ce
					case 35:
                    case 81: return Encoding.GetEncoding(10081); // x-mac-turkish
                    case 37:
                    case 79: return Encoding.GetEncoding(10079); // x-mac-icelandic
                    case 82: return Encoding.GetEncoding(10082); // x-mac-croatian
                    default:
						Console.Error.WriteLine("Unknown encoding for PID 1, EID {0}", EID);
						return Encoding.GetEncoding(10000);      // macintosh
                }
			}

            // Beuh?
            if (PID == 2)
			{
				switch (EID)
				{
					case 0: return Encoding.GetEncoding(20127); // us-ascii
                    case 1: return Encoding.GetEncoding(1201);  // utf-16be
                    case 2: return Encoding.GetEncoding(28591); // iso-8859-1
                    default:
						Console.Error.WriteLine("Unknown encoding for PID 2, EID {0}", EID);
						return Encoding.GetEncoding(20127);     // us-ascii
                }
			}

            // Windows
            if (PID == 3)
			{
				switch (EID)
				{
					case 0:
					case 1:
					case 10: return Encoding.GetEncoding(1201);  // utf-16be
                    case 2:  return Encoding.GetEncoding(932);   // shift_jis
                    case 3:  return Encoding.GetEncoding(936);   // gb2312
                    case 4:  return Encoding.GetEncoding(950);   // big5
                    case 5:  return Encoding.GetEncoding(51949); // euc-kr
                    case 6:  return Encoding.GetEncoding(1361);  // johab
                    default:
						Console.Error.WriteLine("Unknown encoding for PID 3, EID {0}", EID);
						return Encoding.GetEncoding(1201);       // utf-16be
                }
			}
			
			Console.Error.WriteLine("Unknown platformID " + PID);
            return Encoding.GetEncoding(20127); // us-ascii
        }

    }
}
