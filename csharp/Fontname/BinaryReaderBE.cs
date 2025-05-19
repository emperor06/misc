using System.IO;

namespace Fontname
{
    public class BinaryReaderBE : BinaryReader
    {
        public BinaryReaderBE(System.IO.Stream stream) : base(stream) { }

        public override uint ReadUInt32()
        {
            return (uint)(base.ReadByte() << 24 | base.ReadByte() << 16 | base.ReadByte() << 8 | base.ReadByte());
        }

        public override ushort ReadUInt16()
        {
            return (ushort)(base.ReadByte() << 8 | base.ReadByte());
        }
    }
}
