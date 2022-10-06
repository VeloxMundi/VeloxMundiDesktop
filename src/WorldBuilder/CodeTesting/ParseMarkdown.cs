using Markdig;
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
            string mdSource = GetMarkdownSample1();
            Entry myCharacter = GetSingleEntry("Some Person", GetEntryType("Character"));
            string md = Environment.NewLine + "# " + Environment.NewLine + mdSource + Environment.NewLine;
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

            var result = Markdown.ToHtml(mdSource);
            Console.WriteLine(result);

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

        private string GetMarkdownSample2(bool showSection=true)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("# Jaida Colth");
            sb.AppendLine("Jaida was a person who did some things. They were not very nice, but that's really OK.");
            sb.AppendLine("");
            sb.AppendLine("## |Callout|");
            sb.AppendLine("Something very special about Jaida would go here.");
            sb.AppendLine("### Picture{X}");
            sb.AppendLine("![ALLOSOURCE_amoreng_MThumb.jpg](:/309422322435453d9373a0b3407a1397)");
            sb.AppendLine("### Height");
            sb.AppendLine("2.2 spans");
            sb.AppendLine("### Weight");
            sb.AppendLine("62 measures");
            sb.AppendLine("### Eyes");
            sb.AppendLine("Green");
            sb.AppendLine("### Hair");
            sb.AppendLine("Brown");
            sb.AppendLine("### Magic Class");
            sb.AppendLine("Earth");
            sb.AppendLine("");
            sb.AppendLine("## Early Childhood");
            sb.AppendLine("Jaida was born on the 7<sup>th</sup> of Doloc in the 841<sup>st</sup> Turn. His parents were [Eldra Maidar]() and [Sela Maidar](). He was a nuisance of a child.");
            sb.AppendLine("");
            sb.AppendLine("### Chasing the dog");
            sb.AppendLine("When Jaida was 6 turns old, he saw a dog skulking around the chicken coop. He threw a rock at the dog and it growled and ran away. He chased it for nearly a block before returning home.");
            sb.AppendLine("");
            sb.AppendLine("### Eating a fish");
            sb.AppendLine("When Jaida was 11 turns old, he ate a fish.");
            sb.AppendLine("");
            sb.AppendLine("## Between Years");
            sb.AppendLine("Jaida didn't do anything noteworthy in his between years.");
            sb.AppendLine("");
            sb.AppendLine("## Adult Life");
            sb.AppendLine("After growing up, Jaida got a job.");
            sb.AppendLine("");
            sb.AppendLine("### Cartographer");
            sb.AppendLine("Jaida's first job was as a cartographer for the explorer's guild.");
            sb.AppendLine("");
            sb.AppendLine("### Baker");
            sb.AppendLine("Jaida decided he didn't like map-making, so he tried his hand at baking delightful treats to sell to the village children.");
            sb.AppendLine("");
            sb.AppendLine("");




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
