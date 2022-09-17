using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Text;

namespace CodeTesting
{
    [TestClass]
    public class ParseMarkdown
    {
        [TestMethod]
        public void FindFieldsInMarkdown()
        {
            Entry myCharacter = GetSingleEntry("Some Person", GetEntryType("Character"));
            string md = Environment.NewLine + "# " + Environment.NewLine + GetMarkdownSample1();
            string[] sections = md.Split(new string[] { Environment.NewLine + "# " }, StringSplitOptions.None);
            
            foreach (string section in sections)
            {
                if (!string.IsNullOrWhiteSpace(section))
                {
                    int getNewlinePos = section.IndexOf(Environment.NewLine);
                    string sectionName = (getNewlinePos > 0 ? section.Substring(0, getNewlinePos) : "");
                    string[] fields = section.Replace(sectionName, "").Split(new string[] { Environment.NewLine + "## " }, StringSplitOptions.None);
                    foreach (string field in fields)
                    {
                        if (!string.IsNullOrWhiteSpace(field))
                        {
                            int getFieldNewLinePos = field.IndexOf(Environment.NewLine);
                            string fieldName = (getFieldNewLinePos > 0 ? field.Substring(0, getFieldNewLinePos) : "");
                            if (string.IsNullOrWhiteSpace(fieldName))
                            {
                                fieldName = sectionName;
                            }
                            myCharacter.Fields.Add(new EntryField()
                            {
                                Section = sectionName,
                                Name = fieldName,
                                Value = field.Replace(fieldName, "").Trim()
                            });
                        }
                    }
                }

            }

            // TODO: Right now, we are only adding new fields, not updating existing, but the basic parsing is functional. We do need to add something that allows us to identify section and field order for each Entry
            // Inadvertantly figured out how to share a field between two entities...If each field just has a Guid and each Entry has a list of fields, there is no reason that a field cannot be shared between two Entries...just add it to both. When one is updated, update the markdown of the other. Consider near-simultaneous edits to the field...that could cause minor issues, but that is the risk of sharing a field between two Entries.
        }


        private string GetMarkdownSample1(bool showSection=true)
        {
            StringBuilder sb = new StringBuilder();
            if (showSection)
            {
                sb.AppendLine("# Section 1");
                sb.AppendLine("Intro text goes here. What is this part of? Maybe a section can also be a field?");
                sb.AppendLine();
            }
            sb.AppendLine("## Heading 1");
            sb.AppendLine("Text goes here");
            sb.AppendLine();
            sb.AppendLine("## Heading 2");
            sb.AppendLine("More text is in h2 than in h1.");
            sb.AppendLine();
            sb.AppendLine("In fact, there are several lines in h2, and many of them  ");
            sb.AppendLine("contain multple lines or even _formatted_ text of **many** kinds.");

            return sb.ToString();
        }

        private Entry GetSingleEntry(string name, EntryType entryType)
        {
            var entry = new Entry();
            entry.Name = name;
            entry.Type = entryType;

            return entry;
        }

        private EntryType GetEntryType(string name)
        {
            var entryType = new EntryType();
            entryType.Name = name;

            return entryType;
        }
    }
}
