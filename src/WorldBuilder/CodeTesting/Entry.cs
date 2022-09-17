using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeTesting
{
    public class Entry
    {
        public Entry()
        {
            Id = Guid.NewGuid();
            Fields = new List<EntryField>();
        }
        public Guid Id { get; set; }
        public EntryType Type { get; set; }
        public Guid TypeId { get; set; }
        public List<EntryField> Fields { get; set; }
        public string Name { get; set; }
    }

    public class EntryField
    {
        public EntryField()
        {
            Id = Guid.NewGuid();
        }
        public Guid Id { get; set; }
        public string Section { get; set; }
        public string Name { get; set; }
        public string Value { get; set; }
    }

    public class EntryType
    {
        public EntryType()
        {
            Id = Guid.NewGuid();
            Fields = new List<EntryField>();
        }
        public Guid Id { get; set; }
        public string Name { get; set; }
        public List<EntryField> Fields { get; set; }
    }
}
